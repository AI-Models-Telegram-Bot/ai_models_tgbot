import axios from 'axios';
import sharp from 'sharp';
import { logger } from './logger';

/**
 * Parse an aspect ratio string (e.g. "9:16") into numeric w/h components.
 */
function parseAspectRatio(ar: string): { w: number; h: number } | null {
  const parts = ar.split(':');
  if (parts.length !== 2) return null;
  const w = parseInt(parts[0], 10);
  const h = parseInt(parts[1], 10);
  if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) return null;
  return { w, h };
}

/**
 * Calculate target pixel dimensions for a given aspect ratio.
 * Uses 720px on the shorter side for video-optimised output.
 */
function getTargetDimensions(ar: { w: number; h: number }): { width: number; height: number } {
  const shortSide = 720;
  if (ar.w >= ar.h) {
    // Landscape or square
    return { width: Math.round(shortSide * (ar.w / ar.h)), height: shortSide };
  }
  // Portrait
  return { width: shortSide, height: Math.round(shortSide * (ar.h / ar.w)) };
}

/**
 * Download an image from a URL and resize/crop it to match the target aspect ratio.
 * Uses center-crop (sharp's `cover` fit) so the entire output is filled.
 * Returns a JPEG buffer ready for re-upload.
 */
export async function resizeImageForAspectRatio(
  imageUrl: string,
  targetAspectRatio: string,
): Promise<Buffer> {
  const ar = parseAspectRatio(targetAspectRatio);
  if (!ar) {
    throw new Error(`Invalid aspect ratio: ${targetAspectRatio}`);
  }

  const { width, height } = getTargetDimensions(ar);

  logger.info(`Image resize: downloading and cropping to ${width}x${height} (${targetAspectRatio})`);

  const response = await axios.get(imageUrl, {
    responseType: 'arraybuffer',
    timeout: 30000,
  });

  const buffer = await sharp(Buffer.from(response.data))
    .resize(width, height, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 90 })
    .toBuffer();

  logger.info(`Image resize: done, output ${buffer.length} bytes`);
  return buffer;
}

const TELEGRAM_PHOTO_MAX = 10 * 1024 * 1024; // 10 MB

/**
 * Download an image from a URL and compress it to fit within Telegram's 10 MB photo limit.
 * Preserves original dimensions but reduces quality progressively until it fits.
 * Returns a JPEG buffer.
 */
export async function compressImageForTelegram(imageUrl: string): Promise<Buffer> {
  logger.info('compressImageForTelegram: downloading image', { url: imageUrl.slice(0, 80) });

  const response = await axios.get(imageUrl, {
    responseType: 'arraybuffer',
    timeout: 60000,
  });

  const originalSize = response.data.byteLength;
  logger.info(`compressImageForTelegram: original size ${(originalSize / 1024 / 1024).toFixed(1)} MB`);

  // If already small enough, just return as-is
  if (originalSize <= TELEGRAM_PHOTO_MAX) {
    return Buffer.from(response.data);
  }

  const image = sharp(Buffer.from(response.data));
  const metadata = await image.metadata();

  // Cap at 4K on the longest side to avoid excessively large outputs
  const maxDim = 4096;
  let resizeOpts: { width?: number; height?: number } | undefined;
  if (metadata.width && metadata.height) {
    const longest = Math.max(metadata.width, metadata.height);
    if (longest > maxDim) {
      if (metadata.width >= metadata.height) {
        resizeOpts = { width: maxDim };
      } else {
        resizeOpts = { height: maxDim };
      }
    }
  }

  // Try progressively lower JPEG quality until it fits
  for (const quality of [90, 80, 70, 60]) {
    let pipeline = sharp(Buffer.from(response.data));
    if (resizeOpts) pipeline = pipeline.resize(resizeOpts);
    const buf = await pipeline.jpeg({ quality }).toBuffer();
    logger.info(`compressImageForTelegram: quality=${quality}, size=${(buf.length / 1024 / 1024).toFixed(1)} MB`);
    if (buf.length <= TELEGRAM_PHOTO_MAX) return buf;
  }

  // Last resort: resize down to 2048px longest side at quality 60
  let pipeline = sharp(Buffer.from(response.data));
  const fallbackMax = 2048;
  if (metadata.width && metadata.height) {
    if (metadata.width >= metadata.height) {
      pipeline = pipeline.resize({ width: fallbackMax });
    } else {
      pipeline = pipeline.resize({ height: fallbackMax });
    }
  }
  const buf = await pipeline.jpeg({ quality: 60 }).toBuffer();
  logger.info(`compressImageForTelegram: final fallback size=${(buf.length / 1024 / 1024).toFixed(1)} MB`);
  return buf;
}

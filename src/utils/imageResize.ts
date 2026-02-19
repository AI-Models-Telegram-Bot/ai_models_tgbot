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

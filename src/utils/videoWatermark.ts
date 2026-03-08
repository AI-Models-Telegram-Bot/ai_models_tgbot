import { execFile } from 'child_process';
import { unlink, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';
import { logger } from './logger';
import https from 'https';
import http from 'http';
import { createWriteStream } from 'fs';

const WATERMARK_DIR = join(tmpdir(), 'video-watermark');

/**
 * Download a file from a URL to a local path.
 */
function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const file = createWriteStream(dest);
    proto.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        return downloadFile(response.headers.location!, dest).then(resolve, reject);
      }
      if (response.statusCode !== 200) {
        file.close();
        return reject(new Error(`Download failed: HTTP ${response.statusCode}`));
      }
      response.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
      file.on('error', reject);
    }).on('error', (err) => {
      file.close();
      reject(err);
    });
  });
}

/**
 * Apply a semi-transparent "VseOnix.com" watermark to a video using ffmpeg.
 * Places two watermark lines at 1/3 and 2/3 height — hard to crop out.
 *
 * @param inputVideoUrl - URL of the source video
 * @returns Path to the watermarked video file (caller must clean up)
 */
export async function applyWatermark(inputVideoUrl: string): Promise<string> {
  mkdirSync(WATERMARK_DIR, { recursive: true });
  const id = randomBytes(6).toString('hex');
  const inputPath = join(WATERMARK_DIR, `${id}_input.mp4`);
  const outputPath = join(WATERMARK_DIR, `${id}_watermarked.mp4`);

  // Download source video
  await downloadFile(inputVideoUrl, inputPath);

  // Apply watermark with ffmpeg — single centered text, h/22 font size
  const drawtext = "drawtext=text='VseOnix.com':fontsize=(h/18):fontcolor=white@0.5:x=(w-text_w)/2:y=(h-text_h)/2:borderw=2:bordercolor=black@0.25";

  return new Promise((resolve, reject) => {
    execFile('ffmpeg', [
      '-i', inputPath,
      '-vf', drawtext,
      '-codec:a', 'copy',
      '-y',
      outputPath,
    ], { timeout: 120000 }, (error, _stdout, stderr) => {
      // Clean up input file
      unlink(inputPath, () => {});

      if (error) {
        logger.error('FFmpeg watermark failed', { error: error.message, stderr });
        unlink(outputPath, () => {});
        return reject(new Error(`Watermark failed: ${error.message}`));
      }

      logger.info('Watermark applied successfully', { outputPath });
      resolve(outputPath);
    });
  });
}

/**
 * Clean up a watermarked video file after it's been sent.
 */
export function cleanupWatermarkedVideo(filePath: string): void {
  unlink(filePath, (err) => {
    if (err) logger.warn('Failed to clean up watermarked video', { filePath, error: err.message });
  });
}

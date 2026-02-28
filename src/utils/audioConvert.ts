import { execFileSync } from 'child_process';
import { writeFileSync, readFileSync, unlinkSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';
import { logger } from './logger';

/**
 * Convert an OGA/OGG audio buffer to MP3 using ffmpeg.
 * Used to convert Telegram voice messages (Opus/OGG) to a format
 * supported by KieAI Avatar API (mp3/wav/aac).
 */
export function convertOgaToMp3(inputBuffer: Buffer): Buffer {
  const id = randomBytes(6).toString('hex');
  const dir = join(tmpdir(), 'audio-convert');
  mkdirSync(dir, { recursive: true });
  const inputPath = join(dir, `${id}.oga`);
  const outputPath = join(dir, `${id}.mp3`);

  try {
    writeFileSync(inputPath, inputBuffer);

    execFileSync('ffmpeg', [
      '-i', inputPath,
      '-codec:a', 'libmp3lame',
      '-q:a', '4',
      '-y',
      outputPath,
    ], { timeout: 30000, stdio: 'pipe' });

    const mp3Buffer = readFileSync(outputPath);
    logger.info(`Audio converted OGA→MP3: ${inputBuffer.length} → ${mp3Buffer.length} bytes`);
    return mp3Buffer;
  } finally {
    try { unlinkSync(inputPath); } catch { /* ignore */ }
    try { unlinkSync(outputPath); } catch { /* ignore */ }
  }
}

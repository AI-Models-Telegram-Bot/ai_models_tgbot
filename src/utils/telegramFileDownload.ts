import axios from 'axios';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { config } from '../config';
import { logger } from './logger';

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Download a file from Telegram by file_id and save it to the local uploads directory.
 * Works for files of any size — bypasses the 20MB getFileLink limit by streaming
 * the download directly from Telegram's servers.
 *
 * Returns a publicly accessible URL served by our Express static middleware.
 */
export async function downloadTelegramFile(
  fileId: string,
  botToken: string,
  ext: string = '.mp4',
): Promise<string> {
  // Step 1: Call getFile to get the file_path (this works even for large files —
  // the 20MB limit only applies to the Bot API's built-in file serving, not getFile itself)
  const getFileRes = await axios.get(
    `https://api.telegram.org/bot${botToken}/getFile`,
    { params: { file_id: fileId }, timeout: 15000 },
  );

  if (!getFileRes.data?.ok || !getFileRes.data?.result?.file_path) {
    throw new Error(`Telegram getFile failed: ${JSON.stringify(getFileRes.data)}`);
  }

  const filePath = getFileRes.data.result.file_path as string;
  const fileSize = getFileRes.data.result.file_size as number | undefined;

  // Step 2: Download the file via streaming
  const downloadUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
  const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
  const destPath = path.join(UPLOAD_DIR, uniqueName);

  logger.info('Downloading Telegram file', {
    fileId: fileId.slice(0, 20) + '...',
    fileSize,
    destPath: uniqueName,
  });

  const response = await axios.get(downloadUrl, {
    responseType: 'stream',
    timeout: 120000, // 2 min for large files
  });

  await new Promise<void>((resolve, reject) => {
    const writer = fs.createWriteStream(destPath);
    response.data.pipe(writer);
    writer.on('finish', resolve);
    writer.on('error', reject);
    response.data.on('error', reject);
  });

  // Step 3: Return the public URL
  const webappUrl = config.webapp?.url;
  if (!webappUrl) {
    throw new Error('WEBAPP_URL not configured — cannot serve uploaded file');
  }

  const publicUrl = `${webappUrl}/uploads/${uniqueName}`;
  logger.info('Telegram file downloaded', { publicUrl, fileSize });
  return publicUrl;
}

/**
 * Schedule cleanup of an uploaded file after a delay (default 30 min).
 */
export function scheduleFileCleanup(publicUrl: string, delayMs: number = 30 * 60 * 1000): void {
  const filename = publicUrl.split('/uploads/').pop();
  if (!filename) return;

  const filePath = path.join(UPLOAD_DIR, filename);
  setTimeout(() => {
    fs.unlink(filePath, (err) => {
      if (err && (err as NodeJS.ErrnoException).code !== 'ENOENT') {
        logger.error('Failed to clean up uploaded file', { filePath, err });
      } else {
        logger.info('Cleaned up uploaded file', { filePath });
      }
    });
  }, delayMs);
}

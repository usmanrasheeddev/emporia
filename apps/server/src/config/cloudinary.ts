// ═══════════════════════════════════════════════════════════════
// Cloudinary Configuration
// Image/video upload helpers with transformation presets
// ═══════════════════════════════════════════════════════════════

import { v2 as cloudinary } from 'cloudinary';
import { env } from './env';
import { logger } from '../utils/logger';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface UploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

/**
 * Upload a file buffer to Cloudinary.
 * @param buffer - File buffer from Multer
 * @param folder - Cloudinary folder path
 * @param options - Additional upload options
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  options: Record<string, unknown> = {}
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
        transformation: [
          { quality: 'auto:good', fetch_format: 'auto' },
        ],
        ...options,
      },
      (error, result) => {
        if (error || !result) {
          logger.error('Cloudinary upload failed:', error);
          reject(error || new Error('Upload failed'));
          return;
        }
        resolve({
          publicId: result.public_id,
          url: result.url,
          secureUrl: result.secure_url,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        });
      }
    );
    uploadStream.end(buffer);
  });
}

/**
 * Delete a file from Cloudinary by its public ID.
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    logger.error(`Cloudinary delete failed for ${publicId}:`, error);
  }
}

/**
 * Generate an optimized image URL with transformations.
 */
export function getOptimizedUrl(
  publicId: string,
  width?: number,
  height?: number
): string {
  const transforms: Record<string, unknown>[] = [
    { quality: 'auto', fetch_format: 'auto' },
  ];
  if (width) transforms.push({ width, crop: 'scale' });
  if (height) transforms.push({ height, crop: 'scale' });

  return cloudinary.url(publicId, { transformation: transforms, secure: true });
}

export { cloudinary };

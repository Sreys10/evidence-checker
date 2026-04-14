import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a base64 data URL image to Cloudinary.
 * Returns the secure HTTPS URL of the uploaded image.
 */
export async function uploadImageToCloudinary(base64DataUrl: string): Promise<string> {
  const result = await cloudinary.uploader.upload(base64DataUrl, {
    folder: 'evi-check',
    resource_type: 'image',
  });
  return result.secure_url;
}

/**
 * Delete an image from Cloudinary by its public_id.
 */
export async function deleteImageFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

export default cloudinary;

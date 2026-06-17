/**
 * uploadToCloudinaryDirect
 * 
 * Uploads a File directly from the browser to Cloudinary using a server-signed
 * request. This completely bypasses Vercel — NO base64 encoding, NO serverless
 * function bandwidth consumption, NO 14 MB body limit.
 * 
 * Returns the Cloudinary secure_url on success.
 */
export async function uploadToCloudinaryDirect(file: File): Promise<string> {
  // 1. Get a signed upload token from our API (tiny request — no file data)
  const signRes = await fetch('/api/cloudinary-sign', { method: 'POST' });
  if (!signRes.ok) {
    throw new Error('Failed to get Cloudinary upload signature');
  }
  const { signature, timestamp, folder, cloudName, apiKey } = await signRes.json();

  // 2. Upload directly to Cloudinary (browser → Cloudinary, zero Vercel bandwidth)
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', apiKey);
  formData.append('timestamp', String(timestamp));
  formData.append('signature', signature);
  formData.append('folder', folder);

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
    { method: 'POST', body: formData }
  );

  if (!uploadRes.ok) {
    const err = await uploadRes.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Cloudinary upload failed');
  }

  const result = await uploadRes.json();
  return result.secure_url as string;
}

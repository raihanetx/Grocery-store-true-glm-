// Cloudinary configuration and upload utility
import crypto from 'crypto';

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'dpteezqq9';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '525535772615535';
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || 'P1LPKgo1weQpgyQurUdX9aqJCuk';

interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
}

interface CloudinaryDeleteResult {
  result: string;
}

// Generate signature for authenticated uploads
export function generateSignature(timestamp: number, folder: string = 'categories'): string {
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = crypto
    .createHmac('sha256', CLOUDINARY_API_SECRET)
    .update(paramsToSign)
    .digest('hex');
  return signature;
}

// Upload image to Cloudinary using server-side API
export async function uploadToCloudinary(
  file: Buffer,
  filename: string,
  folder: string = 'categories'
): Promise<CloudinaryUploadResult> {
  const formData = new FormData();
  const timestamp = Math.round(Date.now() / 1000);
  const signature = generateSignature(timestamp, folder);
  
  // Convert Buffer to Blob
  const blob = new Blob([file], { type: 'image/png' });
  
  formData.append('file', blob, filename);
  formData.append('api_key', CLOUDINARY_API_KEY);
  formData.append('timestamp', timestamp.toString());
  formData.append('signature', signature);
  formData.append('folder', folder);
  
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cloudinary upload failed: ${error}`);
  }
  
  return response.json();
}

// Delete image from Cloudinary
export async function deleteFromCloudinary(publicId: string): Promise<CloudinaryDeleteResult> {
  const timestamp = Math.round(Date.now() / 1000);
  
  const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}`;
  const signature = crypto
    .createHmac('sha256', CLOUDINARY_API_SECRET)
    .update(paramsToSign)
    .digest('hex');
  
  const formData = new FormData();
  formData.append('public_id', publicId);
  formData.append('api_key', CLOUDINARY_API_KEY);
  formData.append('timestamp', timestamp.toString());
  formData.append('signature', signature);
  
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`,
    {
      method: 'POST',
      body: formData,
    }
  );
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cloudinary delete failed: ${error}`);
  }
  
  return response.json();
}

// Extract public_id from Cloudinary URL
export function extractPublicId(url: string): string | null {
  try {
    const urlParts = url.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    if (uploadIndex === -1) return null;
    
    // Get the parts after 'upload' and before the file extension
    const pathParts = urlParts.slice(uploadIndex + 1);
    // Remove version if present (v1234567890)
    const filteredParts = pathParts.filter(part => !part.startsWith('v'));
    
    // Join and remove extension
    const fullPath = filteredParts.join('/');
    const lastDotIndex = fullPath.lastIndexOf('.');
    return lastDotIndex !== -1 ? fullPath.substring(0, lastDotIndex) : fullPath;
  } catch {
    return null;
  }
}

// Get Cloudinary config for client-side uploads (for unsigned uploads)
export function getCloudinaryConfig() {
  return {
    cloudName: CLOUDINARY_CLOUD_NAME,
    apiKey: CLOUDINARY_API_KEY,
  };
}

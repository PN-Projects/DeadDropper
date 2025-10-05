/**
 * AXIOS UPLOAD UTILITY - Optional Dependency
 * 
 * This file contains the axios upload function for those who want to use axios.
 * To use this, you need to install axios: npm install axios
 * 
 * If you don't want to use axios, stick with the fetch() version in upload-utils.ts
 */

import axios from "axios";

/**
 * Axios PUT upload function - Uses exact fields from presign response
 * 
 * CRITICAL: Send the exact headers/values the presign indicates
 * 
 * @param presignedUrl - The full presignedUrl string for the put call
 * @param file - File or Blob object to upload
 * @param fields - Fields returned by presign endpoint (exact values to use)
 * @returns Promise<AxiosResponse>
 */
export async function uploadWithAxios(
  presignedUrl: string, 
  file: File | Blob, 
  fields?: { [key: string]: string | undefined }
): Promise<any> {
  // create a new instance to avoid global interceptors
  const client = axios.create({
    maxContentLength: Infinity,
    maxBodyLength: Infinity
  });

  // Send the exact headers/values the presign indicates
  const headers: { [key: string]: string } = {};

  if (fields) {
    // Content-Type: use exact value from fields or default
    headers['Content-Type'] = fields['Content-Type'] || 'application/octet-stream';
    
    // x-amz-server-side-encryption: use exact value from fields
    if (fields['x-amz-server-side-encryption']) {
      headers['x-amz-server-side-encryption'] = fields['x-amz-server-side-encryption'];
    }
    
    // x-amz-acl: use exact value from fields
    if (fields['x-amz-acl']) {
      headers['x-amz-acl'] = fields['x-amz-acl'];
    }
  } else {
    // Fallback for backward compatibility
    headers['Content-Type'] = 'application/octet-stream';
    headers['x-amz-server-side-encryption'] = 'AES256';
    headers['x-amz-acl'] = 'bucket-owner-full-control';
  }

  const resp = await client.put(presignedUrl, file, {
    headers,
    withCredentials: false
  });

  return resp;
}

/**
 * Example usage with axios
 */
export async function exampleAxiosUpload(fileInput: HTMLInputElement, presignedUrl: string) {
  const file = fileInput.files?.[0];
  if (!file) {
    throw new Error("No file selected");
  }
  
  try {
    const response = await uploadWithAxios(presignedUrl, file);
    console.log("Axios upload successful:", response);
    return response;
  } catch (error) {
    console.error("Axios upload failed:", error);
    throw error;
  }
}

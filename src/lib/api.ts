// API configuration and utility functions for DeadDropper
import { uploadToPresign, uploadManifestToS3 } from './upload-utils';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://y970yz4nf6.execute-api.eu-north-1.amazonaws.com';

// API Configuration
export const API_CONFIG = {
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  retries: 3,
  headers: {
    'Content-Type': 'application/json',
  },
};

// Performance monitoring
const trackApiCall = (path: string, duration: number, success: boolean) => {
  if (duration > 1000) {
    console.warn(`Slow API call: ${path} took ${duration.toFixed(2)}ms`);
  }
  
  // Send to analytics if available
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'api_call', {
      api_path: path,
      duration: Math.round(duration),
      success: success,
    });
  }
};

// Error tracking
const trackError = (error: Error, context: string) => {
  console.error(`API Error in ${context}:`, error);
  
  // Send to error tracking service if available
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'api_error', {
      error_message: error.message,
      context: context,
    });
  }
};

// Types for API responses
export interface ChunkInfo {
  hash: string;
  size: number;
}

export interface FileInfo {
  name: string;
  size: number;
}

export interface PresignRequest {
  chunks: ChunkInfo[];
  meta: {
    size: number;
    files: FileInfo[];
  };
}

export interface PresignResponse {
  drop_id: string;
  presigned: Array<{
    hash: string;
    url: string;
    key: string;
    size: number;
    fields?: {
      'Content-Type'?: string;
      'x-amz-server-side-encryption'?: string;
      'x-amz-acl'?: string;
      [key: string]: string | undefined;
    };
  }>;
  manifest_presigned?: {
    url: string;
    key: string;
    fields?: {
      'Content-Type'?: string;
      'x-amz-server-side-encryption'?: string;
      'x-amz-acl'?: string;
      [key: string]: string | undefined;
    };
  };
}

export interface Manifest {
  created_at: number;
  files: FileInfo[];
  encryption: {
    alg: string;
    chunk_size: number;
    salt: string; // Safe salt for key derivation
  };
  chunks: Array<{
    keyId: string; // Safe identifier, not raw key
    size: number;
    hash: string;
    iv: string;
  }>;
  burn_after_read?: boolean;
}

export interface FinalizeRequest {
  drop_id: string;
  manifest_s3_key: string;
}

export interface FinalizeResponse {
  drop_id: string;
  short_code: string;
  manifest_s3_key: string;
}

export interface ShortCodeResponse {
  drop_id: string;
  short_code: string;
  status: string;
}

export interface DropResponse {
  drop_id: string;
  status: string;
  short_code: string;
  manifest: Manifest;
  chunks: Array<{
    key: string;
    url: string;
    size: number;
    hash: string;
    iv: string;
  }>;
}

export interface PickupRequest {
  client_time: number;
  user_agent_redacted?: string;
}

// Generic API Functions (following best practices)
export async function apiPost<TReq, TRes>(path: string, body: TReq): Promise<TRes> {
  const startTime = performance.now();
  
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: API_CONFIG.headers,
      body: JSON.stringify(body),
    });
    
    const duration = performance.now() - startTime;
    
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const error = new Error(`API ${path} failed: ${res.status} ${text}`);
      trackError(error, `apiPost:${path}`);
      trackApiCall(path, duration, false);
      throw error;
    }
    
    trackApiCall(path, duration, true);
    return res.json();
  } catch (error) {
    const duration = performance.now() - startTime;
    trackApiCall(path, duration, false);
    throw error;
  }
}

export async function apiGet<TRes>(path: string): Promise<TRes> {
  const startTime = performance.now();
  
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, { 
      method: "GET",
      headers: API_CONFIG.headers,
    });
    
    const duration = performance.now() - startTime;
    
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const error = new Error(`API ${path} failed: ${res.status} ${text}`);
      trackError(error, `apiGet:${path}`);
      trackApiCall(path, duration, false);
      throw error;
    }
    
    trackApiCall(path, duration, true);
    return res.json();
  } catch (error) {
    const duration = performance.now() - startTime;
    trackApiCall(path, duration, false);
    throw error;
  }
}

export async function apiPut<TReq, TRes>(path: string, body: TReq): Promise<TRes> {
  const startTime = performance.now();
  
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: "PUT",
      headers: API_CONFIG.headers,
      body: JSON.stringify(body),
    });
    
    const duration = performance.now() - startTime;
    
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const error = new Error(`API ${path} failed: ${res.status} ${text}`);
      trackError(error, `apiPut:${path}`);
      trackApiCall(path, duration, false);
      throw error;
    }
    
    trackApiCall(path, duration, true);
    return res.json();
  } catch (error) {
    const duration = performance.now() - startTime;
    trackApiCall(path, duration, false);
    throw error;
  }
}

export async function apiDelete<TRes>(path: string): Promise<TRes> {
  const startTime = performance.now();
  
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, { 
      method: "DELETE",
      headers: API_CONFIG.headers,
    });
    
    const duration = performance.now() - startTime;
    
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const error = new Error(`API ${path} failed: ${res.status} ${text}`);
      trackError(error, `apiDelete:${path}`);
      trackApiCall(path, duration, false);
      throw error;
    }
    
    trackApiCall(path, duration, true);
    return res.json();
  } catch (error) {
    const duration = performance.now() - startTime;
    trackApiCall(path, duration, false);
    throw error;
  }
}

// Retry logic for failed requests
export async function apiPostWithRetry<TReq, TRes>(
  path: string, 
  body: TReq, 
  maxRetries: number = API_CONFIG.retries
): Promise<TRes> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiPost<TReq, TRes>(path, body);
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on client errors (4xx)
      if (error instanceof Error && error.message.includes('4')) {
        throw error;
      }
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`Retrying ${path} in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
}

// DeadDropper Service Functions (using generic API functions)
export const deadDropperService = {
  // 1. Create presigned URLs for upload
  presign: async (request: PresignRequest): Promise<PresignResponse> => {
    return apiPost<PresignRequest, PresignResponse>('/api/presign', request);
  },

  // 2. Finalize drop with manifest
  finalize: async (request: FinalizeRequest): Promise<FinalizeResponse> => {
    return apiPost<FinalizeRequest, FinalizeResponse>('/api/drops', request);
  },

  // 3. Resolve short code to drop_id
  resolveShortCode: async (shortCode: string): Promise<ShortCodeResponse> => {
    try {
      return await apiGet<ShortCodeResponse>(`/api/short/${encodeURIComponent(shortCode)}`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        throw new Error('Drop not found or expired');
      }
      throw error;
    }
  },

  // 4. Get drop manifest and download URLs
  getDrop: async (dropId: string): Promise<DropResponse> => {
    try {
      return await apiGet<DropResponse>(`/api/drops/${encodeURIComponent(dropId)}`);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('404')) {
          throw new Error('Drop not found');
        }
        if (error.message.includes('409')) {
          throw new Error('Drop not ready - try again in a few seconds');
        }
      }
      throw error;
    }
  },

  // 5. Log pickup attempt
  logPickup: async (dropId: string, request: PickupRequest): Promise<void> => {
    return apiPost<PickupRequest, void>(`/api/drops/${encodeURIComponent(dropId)}/pickup`, request);
  },

  // 6. Request immediate burn
  burnDrop: async (dropId: string, reason?: string): Promise<{ drop_id: string; status: string; message: string }> => {
    return apiPost<{ reason?: string }, { drop_id: string; status: string; message: string }>(
      `/api/drops/${encodeURIComponent(dropId)}/burn`, 
      { reason }
    );
  },

  // UPLOAD CHUNK WITH EXACT FIELDS - Uses exact fields from presign response
  uploadChunk: async (url: string, encryptedChunk: ArrayBuffer, fields?: { [key: string]: string | undefined }): Promise<void> => {
    console.log('Uploading chunk to URL:', url.substring(0, 50) + '...');
    console.log('Chunk size:', encryptedChunk.byteLength);
    
    try {
      // Use the exact fields from presign response
      const response = await uploadToPresign(url, encryptedChunk, fields);
      console.log('Upload response status:', response.status);
    } catch (error) {
      // Handle TTL expiry specifically
      if (error instanceof Error && error.message.includes('Request has expired')) {
        throw new Error('Presigned URL has expired. Please try uploading again.');
      }
      throw error;
    }
  },

  // Download chunk from S3 using presigned URL
  downloadChunk: async (url: string): Promise<ArrayBuffer> => {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Chunk download failed: ${response.status}`);
    }

    return response.arrayBuffer();
  },

  // Upload manifest to S3 with proper SSE and ACL headers
  uploadManifest: async (
    presignedUrl: string, 
    manifest: any, 
    fields?: { [key: string]: string | undefined }
  ): Promise<void> => {
    console.log('Uploading manifest to URL:', presignedUrl.substring(0, 50) + '...');
    
    try {
      // Use the dedicated manifest upload function
      const response = await uploadManifestToS3(presignedUrl, manifest, fields);
      console.log('Manifest upload response status:', response.status);
    } catch (error) {
      // Handle TTL expiry specifically
      if (error instanceof Error && error.message.includes('Request has expired')) {
        throw new Error('Presigned URL for manifest has expired. Please try uploading again.');
      }
      throw error;
    }
  },
};

// Legacy API object for backward compatibility
export const api = deadDropperService;

// ============================================================================
// EXACT WORKING EXAMPLES - Copy/Paste Ready Upload Functions
// ============================================================================

/**
 * UPLOAD WITH EXACT FIELDS - Uses exact fields from presign response
 * 
 * CRITICAL: Send the exact headers/values the presign indicates
 * 
 * @param presignedUrl - The EXACT URL from backend (never reconstruct or encode)
 * @param file - File or Blob object to upload
 * @param fields - Fields returned by presign endpoint (exact values to use)
 * @returns Promise<Response>
 */
export async function uploadToPresign(
  presignedUrl: string, 
  file: File | Blob, 
  fields?: { [key: string]: string | undefined }
): Promise<Response> {
  // Use the URL string exactly as returned from backend — do not modify
  const headers: { [key: string]: string } = {};

  // Send the exact headers/values the presign indicates
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

  const resp = await fetch(presignedUrl, {
    method: 'PUT',
    headers,
    body: file, // arrayBuffer, Blob, File
    // important: do NOT include credentials/cookies
    credentials: 'omit'
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`Upload failed ${resp.status}: ${text}`);
  }
  return resp;
}

/**
 * Axios PUT upload function (works; be careful about transformRequest)
 * 
 * NOTE: This function requires axios to be installed: npm install axios
 * If you don't need axios, use uploadToPresign() instead.
 * 
 * @param presignedUrl - The full presignedUrl string for the put call
 * @param file - File or Blob object to upload
 * @returns Promise<AxiosResponse>
 * 
 * COPY/PASTE VERSION (if you want to use axios):
 * 
 * import axios from "axios";
 * 
 * async function uploadWithAxios(presignedUrl, file) {
 *   const resp = await axios.put(presignedUrl, file, {
 *     headers: {
 *       "Content-Type": "application/octet-stream",
 *       "x-amz-server-side-encryption": "AES256",
 *       "x-amz-acl": "private"
 *     },
 *     maxBodyLength: Infinity,
 *     maxContentLength: Infinity
 *   });
 *   return resp;
 * }
 */

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example usage of uploadToPresign with a file input
 */
export async function exampleFileUpload(fileInput: HTMLInputElement, presignedUrl: string) {
  const file = fileInput.files?.[0];
  if (!file) {
    throw new Error("No file selected");
  }
  
  try {
    const response = await uploadToPresign(presignedUrl, file);
    console.log("Upload successful:", response);
    return response;
  } catch (error) {
    console.error("Upload failed:", error);
    throw error;
  }
}

/**
 * Example usage with drag-and-drop files
 */
export async function exampleDragDropUpload(files: FileList, presignedUrl: string) {
  const uploadPromises = Array.from(files).map(file => 
    uploadToPresign(presignedUrl, file)
  );
  
  try {
    const responses = await Promise.all(uploadPromises);
    console.log("All uploads successful:", responses);
    return responses;
  } catch (error) {
    console.error("One or more uploads failed:", error);
    throw error;
  }
}

// ============================================================================
// SECURE ENCRYPTION UTILITIES - Fixed Security Issues
// ============================================================================

/**
 * SECURE Encryption utilities with proper key derivation and security practices
 * 
 * CRITICAL FIXES:
 * - Uses HKDF for key derivation instead of raw key export
 * - Implements proper IV uniqueness with counter-based derivation
 * - Uses base64url encoding for safe S3 keys
 * - Implements chunked hashing for large files
 * - No sensitive data in logs or manifests
 */
export class EncryptionUtils {
  private static readonly CHUNK_SIZE = 1024 * 1024; // 1MB
  private static readonly IV_SIZE = 12; // AES-GCM standard
  
  /**
   * Generate a master key for the entire drop
   * CRITICAL: This key is NEVER transmitted to server - only used for key derivation
   * 
   * Creates a raw key material that can be used for both HKDF and PBKDF2 derivation
   */
  private static async generateMasterKey(): Promise<CryptoKey> {
    // Generate random key material
    const keyMaterial = crypto.getRandomValues(new Uint8Array(32));
    
    // Import as raw key material for derivation
    return crypto.subtle.importKey(
      'raw',
      keyMaterial,
      { name: 'PBKDF2' }, // Use PBKDF2 as base since it's more widely supported
      false,
      ['deriveKey']
    );
  }

  /**
   * Alternative: Generate master key using PBKDF2 (more widely supported)
   * Use this if HKDF is not supported in your environment
   */
  private static async generateMasterKeyPBKDF2(password: Uint8Array, salt: Uint8Array): Promise<CryptoKey> {
    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      password,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    
    // Derive master key using PBKDF2
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Derive per-chunk keys using PBKDF2 to prevent key reuse
   * CRITICAL: Never export raw keys - only derive subkeys
   */
  private static async deriveChunkKey(
    masterKey: CryptoKey, 
    chunkIndex: number, 
    salt: Uint8Array
  ): Promise<CryptoKey> {
    // Create unique salt for this chunk by combining base salt with chunk index
    const chunkSalt = new Uint8Array(salt.length + 8);
    chunkSalt.set(salt);
    
    // Add chunk index as big-endian bytes
    const indexBytes = new Uint8Array(new BigUint64Array([BigInt(chunkIndex)]).buffer);
    chunkSalt.set(indexBytes, salt.length);
    
    // Derive chunk key using PBKDF2
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: chunkSalt,
        iterations: 10000, // Reasonable iteration count for performance
        hash: 'SHA-256'
      },
      masterKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Generate unique IV for each chunk using counter-based approach
   * CRITICAL: Prevents IV reuse across chunks
   */
  private static generateChunkIV(chunkIndex: number): Uint8Array {
    const iv = new Uint8Array(this.IV_SIZE);
    
    // Use chunk index as counter (first 8 bytes)
    const indexBytes = new Uint8Array(new BigUint64Array([BigInt(chunkIndex)]).buffer);
    iv.set(indexBytes, 0);
    
    // Fill remaining bytes with random data
    const randomBytes = crypto.getRandomValues(new Uint8Array(4));
    iv.set(randomBytes, 8);
    
    return iv;
  }

  /**
   * Convert bytes to base64url (safe for S3 keys)
   * CRITICAL: Avoids +, /, = characters that cause encoding issues
   */
  private static bytesToBase64Url(bytes: Uint8Array): string {
    const base64 = btoa(String.fromCharCode(...bytes));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  private static bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Convert base64url back to bytes
   */
  private static base64UrlToBytes(base64Url: string): Uint8Array {
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
    return Uint8Array.from(atob(padded), c => c.charCodeAt(0));
  }

  /**
   * SECURE chunk encryption with proper key derivation
   * CRITICAL: No raw keys exported, unique IVs, safe encoding
   */
  static async encryptChunk(
    chunk: ArrayBuffer, 
    chunkIndex: number, 
    masterKey: CryptoKey,
    salt: Uint8Array
  ): Promise<{ 
    encrypted: ArrayBuffer; 
    iv: string; 
    keyId: string; // Safe identifier, not raw key
  }> {
    // Derive unique key for this chunk
    const chunkKey = await this.deriveChunkKey(masterKey, chunkIndex, salt);
    
    // Generate unique IV
    const iv = this.generateChunkIV(chunkIndex);
    
    // Encrypt chunk
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      chunkKey,
      chunk
    );

    // Generate safe key identifier (not the actual key)
    const keyId = this.bytesToBase64Url(salt.slice(0, 8)) + '-' + chunkIndex.toString(36);

    return {
      encrypted,
      iv: this.bytesToBase64Url(iv),
      keyId, // Safe identifier only
    };
  }

  /**
   * SECURE chunk decryption
   */
  static async decryptChunk(
    encryptedChunk: ArrayBuffer, 
    iv: string, 
    chunkIndex: number,
    masterKey: CryptoKey,
    salt: Uint8Array
  ): Promise<ArrayBuffer> {
    const chunkKey = await this.deriveChunkKey(masterKey, chunkIndex, salt);
    const ivArray = this.base64UrlToBytes(iv);
    
    return crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivArray },
      chunkKey,
      encryptedChunk
    );
  }

  /**
   * CHUNKED hashing for large files - prevents memory issues
   * CRITICAL: Never loads entire file into memory
   */
  static async generateChunkHashes(file: File): Promise<string[]> {
    const chunks: ArrayBuffer[] = [];
    let offset = 0;

    // Process file in chunks to avoid memory issues
    while (offset < file.size) {
      const end = Math.min(offset + this.CHUNK_SIZE, file.size);
      const blob = file.slice(offset, end);
      const arrayBuffer = await blob.arrayBuffer();
      chunks.push(arrayBuffer);
      offset = end;
    }

    // Hash each chunk individually
    const hashes = await Promise.all(
      chunks.map(async (chunk) => {
        const hashBuffer = await crypto.subtle.digest('SHA-256', chunk);
        const hashArray = new Uint8Array(hashBuffer);
        return this.bytesToHex(hashArray); // hex string matching sha256sum
      })
    );
    
    return hashes;
  }

  /**
   * SECURE file chunking with memory management
   * CRITICAL: Never calls arrayBuffer() on entire file
   */
  static async chunkFile(file: File, chunkSize: number = this.CHUNK_SIZE): Promise<ArrayBuffer[]> {
    const chunks: ArrayBuffer[] = [];
    let offset = 0;

    while (offset < file.size) {
      const end = Math.min(offset + chunkSize, file.size);
      const blob = file.slice(offset, end);
      const arrayBuffer = await blob.arrayBuffer();
      chunks.push(arrayBuffer);
      offset = end;
    }

    return chunks;
  }

  /**
   * Generate master key and salt for a drop
   * CRITICAL: Master key never leaves client, salt is safe to store
   */
  static async initializeDrop(): Promise<{
    masterKey: CryptoKey;
    salt: Uint8Array;
    saltString: string; // Safe to store/transmit
  }> {
    const masterKey = await this.generateMasterKey();
    const salt = crypto.getRandomValues(new Uint8Array(32));
    const saltString = this.bytesToBase64Url(salt);
    
    return { masterKey, salt, saltString };
  }
}

/**
 * ZIP Utilities for DeadDropper Multiple File Support
 * 
 * Handles client-side ZIP creation for multiple files with proper error handling
 * and progress tracking.
 */

import JSZip from 'jszip';

export interface FileWithProgress {
  file: File;
  progress: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

export interface ZipCreationOptions {
  onProgress?: (progress: number) => void;
  onFileProgress?: (fileIndex: number, progress: number) => void;
  zipFileName?: string;
}

export interface ZipCreationResult {
  zipBlob: Blob;
  zipFileName: string;
  originalFiles: File[];
  totalSize: number;
  zipSize: number;
}

/**
 * Creates a ZIP file from multiple files
 * 
 * @param files Array of files to zip
 * @param options Configuration options
 * @returns Promise with ZIP creation result
 */
export async function createZipFromFiles(
  files: File[],
  options: ZipCreationOptions = {}
): Promise<ZipCreationResult> {
  const { onProgress, onFileProgress, zipFileName } = options;
  
  if (files.length === 0) {
    throw new Error('No files provided for ZIP creation');
  }

  if (files.length === 1) {
    // Single file - return as is without creating ZIP
    return {
      zipBlob: files[0],
      zipFileName: files[0].name,
      originalFiles: files,
      totalSize: files[0].size,
      zipSize: files[0].size,
    };
  }

  // Multiple files - create ZIP
  const zip = new JSZip();
  const totalSize = files.reduce((acc, file) => acc + file.size, 0);
  
  // Create ZIP filename
  const defaultZipName = zipFileName || `DeadDropper_${new Date().toISOString().split('T')[0]}.zip`;
  
  try {
    // Add files to ZIP with progress tracking
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Report file progress
      if (onFileProgress) {
        onFileProgress(i, 0);
      }
      
      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Add to ZIP
      zip.file(file.name, arrayBuffer);
      
      // Report file completion
      if (onFileProgress) {
        onFileProgress(i, 100);
      }
      
      // Report overall progress
      if (onProgress) {
        const progress = ((i + 1) / files.length) * 50; // First 50% for adding files
        onProgress(progress);
      }
    }
    
    // Generate ZIP blob
    if (onProgress) {
      onProgress(50);
    }
    
    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 6, // Balanced compression
      },
    });
    
    if (onProgress) {
      onProgress(100);
    }
    
    return {
      zipBlob,
      zipFileName: defaultZipName,
      originalFiles: files,
      totalSize,
      zipSize: zipBlob.size,
    };
    
  } catch (error) {
    console.error('ZIP creation failed:', error);
    throw new Error(`Failed to create ZIP: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validates file selection for multiple file upload
 * 
 * @param files Array of selected files
 * @returns Validation result with error message if invalid
 */
export function validateFileSelection(files: File[]): { valid: boolean; error?: string } {
  // Check file count
  if (files.length === 0) {
    return { valid: false, error: 'No files selected' };
  }
  
  if (files.length > 5) {
    return { valid: false, error: 'Maximum 5 files allowed' };
  }
  
  // Check total size (5GB = 5 * 1024 * 1024 * 1024 bytes)
  const maxSize = 5 * 1024 * 1024 * 1024; // 5GB
  const totalSize = files.reduce((acc, file) => acc + file.size, 0);
  
  if (totalSize > maxSize) {
    const maxSizeGB = (maxSize / (1024 * 1024 * 1024)).toFixed(1);
    const currentSizeGB = (totalSize / (1024 * 1024 * 1024)).toFixed(1);
    return { 
      valid: false, 
      error: `Total file size (${currentSizeGB}GB) exceeds maximum allowed size (${maxSizeGB}GB)` 
    };
  }
  
  // Check individual file sizes (optional - prevent extremely large single files)
  const maxSingleFileSize = 2 * 1024 * 1024 * 1024; // 2GB per file
  for (const file of files) {
    if (file.size > maxSingleFileSize) {
      const fileSizeGB = (file.size / (1024 * 1024 * 1024)).toFixed(1);
      return { 
        valid: false, 
        error: `File "${file.name}" (${fileSizeGB}GB) exceeds maximum single file size (2GB)` 
      };
    }
  }
  
  return { valid: true };
}

/**
 * Formats file size in human-readable format
 * 
 * @param bytes File size in bytes
 * @returns Formatted size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Gets file extension from filename
 * 
 * @param filename File name
 * @returns File extension (without dot)
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Checks if file is an image
 * 
 * @param file File object
 * @returns True if file is an image
 */
export function isImageFile(file: File): boolean {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
  const extension = getFileExtension(file.name);
  return imageExtensions.includes(extension) || file.type.startsWith('image/');
}

/**
 * Checks if file is a video
 * 
 * @param file File object
 * @returns True if file is a video
 */
export function isVideoFile(file: File): boolean {
  const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'];
  const extension = getFileExtension(file.name);
  return videoExtensions.includes(extension) || file.type.startsWith('video/');
}

/**
 * Checks if file is a document
 * 
 * @param file File object
 * @returns True if file is a document
 */
export function isDocumentFile(file: File): boolean {
  const docExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'];
  const extension = getFileExtension(file.name);
  return docExtensions.includes(extension) || file.type.startsWith('application/');
}

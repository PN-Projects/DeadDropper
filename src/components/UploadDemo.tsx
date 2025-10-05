import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { uploadToPresign } from '@/lib/upload-utils';

/**
 * Demo component showing how to use the exact working upload examples
 * This can be copied/pasted into any React component
 */
export const UploadDemo: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [presignedUrl, setPresignedUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setSelectedFile(file || null);
    setUploadResult(null);
  };

  const handleFetchUpload = async () => {
    if (!selectedFile || !presignedUrl) {
      setUploadResult({ success: false, message: 'Please select a file and enter a presigned URL' });
      return;
    }

    setIsUploading(true);
    setUploadResult(null);

    try {
      // Example: fields might be
      // { "Content-Type": "application/octet-stream", "x-amz-server-side-encryption":"AES256", "x-amz-acl":"bucket-owner-full-control" }
      const fields = {
        'Content-Type': 'application/octet-stream',
        'x-amz-server-side-encryption': 'AES256',
        'x-amz-acl': 'bucket-owner-full-control'
      };
      
      const response = await uploadToPresign(presignedUrl, selectedFile, fields);
      setUploadResult({ 
        success: true, 
        message: `Upload successful! Status: ${response.status}` 
      });
    } catch (error) {
      setUploadResult({ 
        success: false, 
        message: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAxiosUpload = async () => {
    setUploadResult({ 
      success: false, 
      message: 'Axios upload requires installing axios: npm install axios. Use the copy/paste code from upload-utils.ts' 
    });
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Upload Demo</h2>
      
      <div className="space-y-4">
        {/* File Input */}
        <div>
          <label className="block text-sm font-medium mb-2">Select File:</label>
          <input
            type="file"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {selectedFile && (
            <p className="text-sm text-gray-600 mt-1">
              Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
            </p>
          )}
        </div>

        {/* Presigned URL Input */}
        <div>
          <label className="block text-sm font-medium mb-2">Presigned URL:</label>
          <input
            type="url"
            value={presignedUrl}
            onChange={(e) => setPresignedUrl(e.target.value)}
            placeholder="https://your-bucket.s3.amazonaws.com/path/to/file?signature..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Upload Buttons */}
        <div className="flex gap-4">
          <Button 
            onClick={handleFetchUpload} 
            disabled={!selectedFile || !presignedUrl || isUploading}
            className="flex-1"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload with Fetch
          </Button>
          
          <Button 
            onClick={handleAxiosUpload} 
            disabled={!selectedFile || !presignedUrl || isUploading}
            variant="outline"
            className="flex-1"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload with Axios
          </Button>
        </div>

        {/* Result */}
        {uploadResult && (
          <Alert className={uploadResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <div className="flex items-center">
              {uploadResult.success ? (
                <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
              )}
              <span className={uploadResult.success ? 'text-green-800' : 'text-red-800'}>
                {uploadResult.message}
              </span>
            </div>
          </Alert>
        )}

        {/* Usage Instructions */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Usage Instructions:</h3>
          <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
            <li>Select a file using the file input above</li>
            <li>Paste your presigned URL from your backend</li>
            <li>Click either "Upload with Fetch" or "Upload with Axios"</li>
            <li>The functions will handle the proper headers automatically</li>
          </ol>
        </div>
      </div>
    </Card>
  );
};

export default UploadDemo;

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Copy, Check, FileText, AlertCircle, Archive, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert } from "@/components/ui/alert";
import { toast } from "sonner";
import Header from "@/components/Header";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { api, EncryptionUtils, type PresignRequest, type FinalizeRequest } from "@/lib/api";
import { 
  createZipFromFiles, 
  validateFileSelection, 
  formatFileSize, 
  isImageFile, 
  isVideoFile, 
  isDocumentFile,
  type ZipCreationResult 
} from "@/lib/zip-utils";

const Drop = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [dropCode, setDropCode] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [burnSchedule, setBurnSchedule] = useState("24hrs");
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string>("");
  const [currentStep, setCurrentStep] = useState<string>("");
  
  // New state for multiple file handling
  const [zipProgress, setZipProgress] = useState(0);
  const [isCreatingZip, setIsCreatingZip] = useState(false);
  const [zipResult, setZipResult] = useState<ZipCreationResult | null>(null);
  const [fileValidation, setFileValidation] = useState<{ valid: boolean; error?: string }>({ valid: true });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Validate file selection
    const validation = validateFileSelection(acceptedFiles);
    setFileValidation(validation);
    
    if (validation.valid) {
      setFiles(acceptedFiles);
      setError("");
      setZipResult(null); // Reset previous ZIP result
    } else {
      setError(validation.error || "Invalid file selection");
      toast.error(validation.error || "Invalid file selection");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    maxFiles: 5,
    maxSize: 5 * 1024 * 1024 * 1024, // 5GB total (will be validated in onDrop)
  });

  const handleDrop = async () => {
    if (files.length === 0) {
      toast.error("Please select files to drop");
      return;
    }

    if (!fileValidation.valid) {
      toast.error(fileValidation.error || "Invalid file selection");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError("");
    setCurrentStep("Preparing files...");

    try {
      let finalFile: File;
      let finalFileName: string;
      let originalFiles: File[];

      // Step 1: Create ZIP if multiple files, otherwise use single file
      if (files.length > 1) {
        setCurrentStep("Creating ZIP archive...");
        setIsCreatingZip(true);
        setZipProgress(0);

        const zipResult = await createZipFromFiles(files, {
          onProgress: setZipProgress,
          zipFileName: `DeadDropper_${new Date().toISOString().split('T')[0]}.zip`,
        });

        setZipResult(zipResult);
        finalFile = new File([zipResult.zipBlob], zipResult.zipFileName, { 
          type: 'application/zip' 
        });
        finalFileName = zipResult.zipFileName;
        originalFiles = zipResult.originalFiles;
        
        setIsCreatingZip(false);
        setZipProgress(100);
        toast.success(`ZIP created successfully! ${formatFileSize(zipResult.zipSize)}`);
      } else {
        // Single file - no ZIP needed
        finalFile = files[0];
        finalFileName = files[0].name;
        originalFiles = files;
      }

      // Step 2: Initialize secure encryption for the drop
      setCurrentStep("Initializing secure encryption...");
      const { masterKey, salt, saltString } = await EncryptionUtils.initializeDrop();
      
      // Step 3: Prepare file and chunks with secure processing
      const totalSize = finalFile.size;
      const fileInfos = originalFiles.map(file => ({ name: file.name, size: file.size }));
      
      // Process file securely (chunked to prevent memory issues)
      setCurrentStep("Processing file securely...");
      const fileHashes = await EncryptionUtils.generateChunkHashes(finalFile);
      const fileChunks = await EncryptionUtils.chunkFile(finalFile);
      
      const chunks = fileChunks.map((chunk, index) => ({
        hash: fileHashes[index],
        size: chunk.byteLength,
      }));

      // Step 4: Request presigned URLs
      setCurrentStep("Requesting upload URLs...");
      setUploadProgress(10);
      
      const presignRequest: PresignRequest = {
        chunks,
        meta: {
          size: totalSize,
          files: fileInfos,
        },
      };

      const presignResponse = await api.presign(presignRequest);
      setUploadProgress(20);

      // Step 5: Upload chunks with exact headers
      setCurrentStep("Uploading chunks...");
      const uploadedChunks: Array<{ size: number; hash: string; iv: string | null }> = [];
      
      for (let i = 0; i < fileChunks.length; i++) {
        const chunk = fileChunks[i];
        const presigned = presignResponse.presigned[i];
        const url = presigned.url;
        const fields = presigned.fields || {};
        
        try {
          await api.uploadChunk(url, chunk, fields);
        } catch (uploadError) {
          console.error(`Failed to upload chunk ${i + 1}:`, uploadError);
          throw new Error(`Failed to upload chunk ${i + 1}: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
        }
        
        uploadedChunks.push({
          size: chunk.byteLength,
          hash: presigned.hash,
          iv: null,
        });

        // Update progress
        const progress = 20 + (i / fileChunks.length) * 60;
        setUploadProgress(progress);
      }

      // Step 6: Create manifest and upload to S3
      setCurrentStep("Creating manifest...");
      setUploadProgress(85);

      // Create manifest
      const manifest = {
        meta: {
          filename: finalFileName,
          size: totalSize,
          created_at: new Date().toISOString(),
          original_files: originalFiles.map(f => ({ name: f.name, size: f.size })),
          is_zip: files.length > 1,
        },
        chunks: presignResponse.presigned.map((p, idx) => ({
          key: p.key,
          size: uploadedChunks[idx]?.size ?? p.size,
          hash: uploadedChunks[idx]?.hash ?? p.hash,
          iv: uploadedChunks[idx]?.iv ?? null,
        })),
      } as const;

      // Step 7: Upload manifest to S3
      setCurrentStep("Uploading manifest to S3...");
      
      if (!presignResponse.manifest_presigned || !presignResponse.manifest_presigned.url) {
        throw new Error('No manifest presigned URL returned by server. Update presign lambda to include manifest_presigned.');
      }
      
      const manifestPresigned = presignResponse.manifest_presigned;
      
      await api.uploadManifest(
        manifestPresigned.url, 
        manifest, 
        manifestPresigned.fields
      );

      console.log('Uploaded manifest to', manifestPresigned.key);

      // Step 8: Finalize drop
      setCurrentStep("Finalizing drop...");
      setUploadProgress(95);

      const finalizeRequest: FinalizeRequest = {
        drop_id: presignResponse.drop_id,
        manifest_s3_key: manifestPresigned.key,
      };

      const finalizeResponse = await api.finalize(finalizeRequest);
      
      setUploadProgress(100);
      setDropCode(finalizeResponse.short_code);
      setIsUploading(false);
      setCurrentStep("");
      toast.success("Drop created successfully!");
      
    } catch (err) {
      console.error("Drop creation failed:", err);
      setError(err instanceof Error ? err.message : "Upload failed");
      setIsUploading(false);
      setIsCreatingZip(false);
      setCurrentStep("");
      toast.error("Failed to create drop. Please try again.");
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(dropCode);
    setCopied(true);
    toast.success("Code copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    const validation = validateFileSelection(newFiles);
    setFileValidation(validation);
    setFiles(newFiles);
    setZipResult(null);
    if (validation.valid) {
      setError("");
    }
  };

  const clearAllFiles = () => {
    setFiles([]);
    setZipResult(null);
    setError("");
    setFileValidation({ valid: true });
  };

  const totalSize = files.reduce((acc, file) => acc + file.size, 0);
  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />
      
      <main className="container mx-auto px-4 pt-32 pb-20">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center text-white">Drop Files</h1>
          <p className="text-white/70 text-center mb-12">
            Drag and drop files or folders to share securely
          </p>

          {!dropCode ? (
            <>
              {/* Dropzone */}
              <Card className="p-8 mb-8">
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                    isDragActive
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="w-16 h-16 mx-auto mb-4 text-white/60" />
                  {isDragActive ? (
                    <p className="text-lg text-white">Drop files here...</p>
                  ) : (
                    <>
                      <p className="text-lg mb-2 text-white">Drag & drop files here (up to 5 files, 5GB max)</p>
                      <p className="text-sm text-white/60">or click to browse</p>
                    </>
                  )}
                </div>

                {files.length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-white">
                        Selected Files ({files.length})
                        {files.length > 1 && (
                          <span className="ml-2 text-sm text-white/60">
                            (will be zipped)
                          </span>
                        )}
                      </h3>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPreview(!showPreview)}
                        >
                          {showPreview ? "Hide" : "Preview"} List
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearAllFiles}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Clear All
                        </Button>
                      </div>
                    </div>
                    
                    {showPreview && (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {files.map((file, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 rounded-lg bg-secondary"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {isImageFile(file) ? (
                                <div className="w-8 h-8 rounded bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                                  IMG
                                </div>
                              ) : isVideoFile(file) ? (
                                <div className="w-8 h-8 rounded bg-purple-500 flex items-center justify-center text-white text-xs font-bold">
                                  VID
                                </div>
                              ) : isDocumentFile(file) ? (
                                <div className="w-8 h-8 rounded bg-green-500 flex items-center justify-center text-white text-xs font-bold">
                                  DOC
                                </div>
                              ) : (
                                <FileText className="w-8 h-8 text-white/60" />
                              )}
                              <div className="min-w-0 flex-1">
                                <span className="text-sm truncate block text-white font-medium">
                                  {file.name}
                                </span>
                                <span className="text-xs text-white/60">
                                  {formatFileSize(file.size)}
                                </span>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeFile(idx)}
                              className="text-red-400 hover:text-red-300 ml-2"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="mt-4 p-4 rounded-lg bg-secondary/50">
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-white">
                          Total size: <span className="font-semibold">{formatFileSize(totalSize)}</span>
                        </p>
                        {files.length > 1 && (
                          <div className="flex items-center gap-2 text-sm text-white/70">
                            <Archive className="w-4 h-4" />
                            <span>Will be zipped</span>
                          </div>
                        )}
                      </div>
                      {zipResult && (
                        <div className="mt-2 text-sm text-white/70">
                          ZIP size: <span className="font-semibold">{formatFileSize(zipResult.zipSize)}</span>
                          <span className="ml-2 text-xs">
                            ({Math.round((zipResult.zipSize / zipResult.totalSize) * 100)}% of original)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>

              {/* Burn Schedule */}
              <Card className="p-6 mb-8">
                <h3 className="font-semibold mb-4 text-white">Schedule Burn</h3>
                <div className="grid grid-cols-5 gap-2">
                  {["60min", "2hrs", "6hrs", "12hrs", "24hrs"].map((option) => (
                    <button
                      key={option}
                      onClick={() => setBurnSchedule(option)}
                      className={`p-3 rounded-lg text-sm font-medium transition-all ${
                        burnSchedule === option
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </Card>

              {/* Drop Button */}
              <div className="flex justify-center">
                <InteractiveHoverButton
                  text="Drop"
                  onClick={handleDrop}
                  disabled={files.length === 0 || isUploading || isCreatingZip || !fileValidation.valid}
                  className="w-48 h-12 text-lg"
                />
              </div>

              {/* ZIP Creation Progress */}
              {isCreatingZip && (
                <Card className="p-6 mb-8">
                  <h3 className="font-semibold mb-4 text-white flex items-center gap-2">
                    <Archive className="w-5 h-5" />
                    Creating ZIP Archive
                  </h3>
                  <Progress value={zipProgress} className="mb-2" />
                  <p className="text-sm text-white/70 text-center">
                    {zipProgress}% complete
                  </p>
                  <p className="text-xs text-white/60 text-center mt-1">
                    Compressing {files.length} files...
                  </p>
                </Card>
              )}

              {/* Upload Progress */}
              {isUploading && (
                <Card className="p-6 mt-8">
                  <h3 className="font-semibold mb-4 text-white">Uploading...</h3>
                  <Progress value={uploadProgress} className="mb-2" />
                  <p className="text-sm text-white/70 text-center mb-2">
                    {uploadProgress}% complete
                  </p>
                  {currentStep && (
                    <p className="text-xs text-white/60 text-center">
                      {currentStep}
                    </p>
                  )}
                </Card>
              )}

              {/* Error Display */}
              {error && (
                <Alert variant="destructive" className="mt-8">
                  <AlertCircle className="h-4 w-4" />
                  <div>
                    <h4 className="font-medium">Upload Failed</h4>
                    <p className="text-sm mt-1">{error}</p>
                  </div>
                </Alert>
              )}
            </>
          ) : (
            /* Success State */
            <Card className="p-8 text-center">
              <div className="mb-6">
                <div className="w-16 h-16 rounded-full bg-white mx-auto mb-4 flex items-center justify-center">
                  <Check className="w-8 h-8 text-black" />
                </div>
                <h2 className="text-2xl font-bold mb-2 text-white">Drop Created!</h2>
                <p className="text-white/70">
                  Share this code to allow others to pick up your files
                </p>
              </div>

              <div className="max-w-sm mx-auto mb-6">
                <div className="flex items-center gap-2 p-4 rounded-lg bg-secondary">
                  <code className="flex-1 text-2xl font-mono font-bold text-white">{dropCode}</code>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={copyCode}
                  >
                    {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
                  </Button>
                </div>
              </div>

              <p className="text-sm text-white/70 mb-6">
                Files will auto-burn in: <span className="font-semibold text-white">{burnSchedule}</span>
                {zipResult && zipResult.originalFiles.length > 1 && (
                  <span className="block mt-2">
                    Contains {zipResult.originalFiles.length} files in ZIP archive
                  </span>
                )}
              </p>

              <Button onClick={() => window.location.reload()}>Create Another Drop</Button>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Drop;

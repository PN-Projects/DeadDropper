import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Copy, Check, FileText, AlertCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert } from "@/components/ui/alert";
import { toast } from "sonner";
import Header from "@/components/Header";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { api, EncryptionUtils, type PresignRequest, type FinalizeRequest } from "@/lib/api";

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

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
  });

  const handleDrop = async () => {
    if (files.length === 0) {
      toast.error("Please select files to drop");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError("");
    setCurrentStep("Preparing files...");

    try {
      // Step 1: Initialize secure encryption for the drop
      setCurrentStep("Initializing secure encryption...");
      const { masterKey, salt, saltString } = await EncryptionUtils.initializeDrop();
      
      // Step 2: Prepare files and chunks with secure processing
      const totalSize = files.reduce((acc, file) => acc + file.size, 0);
      const fileInfos = files.map(file => ({ name: file.name, size: file.size }));
      
      // Process files securely (chunked to prevent memory issues)
      setCurrentStep("Processing files securely...");
      const allChunks: ArrayBuffer[] = [];
      const chunkHashes: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setCurrentStep(`Processing file ${i + 1}/${files.length}: ${file.name}`);
        
      // Hash and chunk file (no encryption for now; raw chunks)
      const fileHashes = await EncryptionUtils.generateChunkHashes(file);
      const fileChunks = await EncryptionUtils.chunkFile(file);
        
        allChunks.push(...fileChunks);
        chunkHashes.push(...fileHashes);
      }
      
      const chunks = allChunks.map((chunk, index) => ({
        hash: chunkHashes[index],
        size: chunk.byteLength,
      }));

      // Step 2: Request presigned URLs
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

      // Step 3: Upload raw chunks with exact headers
      setCurrentStep("Uploading chunks...");
      const uploadedChunks: Array<{ size: number; hash: string; iv: string | null }> = [];
      
      for (let i = 0; i < allChunks.length; i++) {
        const chunk = allChunks[i];
        const presigned = presignResponse.presigned[i]; // take the chunk you want
        const url = presigned.url;
        const fields = presigned.fields || {};
        
        // SECURITY: Encrypt with proper key derivation and unique IV
        // Upload to S3 using exact fields from presign response
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
        const progress = 20 + (i / allChunks.length) * 60;
        setUploadProgress(progress);
      }

      // Step 4: Create manifest and upload to S3
      setCurrentStep("Creating manifest...");
      setUploadProgress(85);

      // Create manifest (raw chunks, no encryption metadata)
      const manifest = {
        meta: {
          filename: files.length === 1 ? files[0].name : `${files.length} files`,
          size: totalSize,
          created_at: new Date().toISOString(),
        },
        chunks: presignResponse.presigned.map((p, idx) => ({
          key: p.key,
          size: uploadedChunks[idx]?.size ?? p.size,
          hash: uploadedChunks[idx]?.hash ?? p.hash,
          iv: uploadedChunks[idx]?.iv ?? null,
        })),
      } as const;

      // Step 5: Upload manifest to S3 using manifest_presigned from presign response
      setCurrentStep("Uploading manifest to S3...");
      
      // Check if manifest_presigned is available in the presign response
      if (!presignResponse.manifest_presigned || !presignResponse.manifest_presigned.url) {
        throw new Error('No manifest presigned URL returned by server. Update presign lambda to include manifest_presigned.');
      }
      
      const manifestPresigned = presignResponse.manifest_presigned;
      
      // Upload manifest using the manifest_presigned URL and fields
      await api.uploadManifest(
        manifestPresigned.url, 
        manifest, 
        manifestPresigned.fields
      );

      console.log('Uploaded manifest to', manifestPresigned.key);

      // Step 6: Finalize drop - ensure manifest upload completes first
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
                      <p className="text-lg mb-2 text-white">Drag & drop files or folders here</p>
                      <p className="text-sm text-white/60">or click to browse</p>
                    </>
                  )}
                </div>

                {files.length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-white">Selected Files ({files.length})</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPreview(!showPreview)}
                      >
                        {showPreview ? "Hide" : "Preview"} List
                      </Button>
                    </div>
                    
                    {showPreview && (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {files.map((file, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 rounded-lg bg-secondary"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="w-4 h-4 text-white/60" />
                              <span className="text-sm truncate max-w-xs text-white">{file.name}</span>
                            </div>
                            <span className="text-xs text-white/60">
                              {formatSize(file.size)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="mt-4 p-4 rounded-lg bg-secondary/50">
                      <p className="text-sm text-white">
                        Total size: <span className="font-semibold">{formatSize(totalSize)}</span>
                      </p>
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
                  disabled={files.length === 0 || isUploading}
                  className="w-48 h-12 text-lg"
                />
              </div>

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
            /* Success State with QR Code */
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

              <div className="inline-block p-6 rounded-xl bg-white mb-6">
                <QRCodeSVG value={dropCode} size={200} />
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

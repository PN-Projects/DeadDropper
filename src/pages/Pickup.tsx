import { useState } from "react";
import { Download, FileText, Eye, TriangleAlert, AlertCircle, Loader2, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import Header from "@/components/Header";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { api, EncryptionUtils, type DropResponse, type FileInfo } from "@/lib/api";
import { formatFileSize } from "@/lib/zip-utils";

const Pickup = () => {
  const [code, setCode] = useState("");
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isBurned, setIsBurned] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [dropData, setDropData] = useState<DropResponse | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileInfo | null>(null);

  const handlePickup = async () => {
    if (code.length !== 6) {
      toast.error("Please enter a valid 6-character code");
      return;
    }

    setIsLoading(true);
    setError("");
    setCurrentStep("Resolving drop code...");

    try {
      // Step 1: Resolve short code to drop_id
      const shortCodeResponse = await api.resolveShortCode(code);
      setCurrentStep("Loading drop data...");

      // Step 2: Get drop manifest and download URLs
      const dropResponse = await api.getDrop(shortCodeResponse.drop_id);
      
      setDropData(dropResponse);
      // Populate files from manifest.files if present; otherwise derive from manifest.meta
      if (dropResponse.manifest?.files && dropResponse.manifest.files.length > 0) {
        setFiles(dropResponse.manifest.files);
      } else if ((dropResponse as any).manifest?.meta?.filename && (dropResponse as any).manifest?.meta?.size !== undefined) {
        setFiles([{ name: (dropResponse as any).manifest.meta.filename, size: (dropResponse as any).manifest.meta.size }]);
      } else {
        setFiles([]);
      }
      setIsLoading(false);
      setCurrentStep("");
      toast.success("Files found!");
      
    } catch (err) {
      console.error("Pickup failed:", err);
      setError(err instanceof Error ? err.message : "Failed to load drop");
      setIsLoading(false);
      setCurrentStep("");
      toast.error("Failed to load drop. Please check the code and try again.");
    }
  };

  const handleDownload = async () => {
    if (!dropData) return;

    // Validate chunks before proceeding
    if (!dropData.chunks || dropData.chunks.length === 0) {
      setError("No chunks available for this drop. Try again later or regenerate the drop.");
      toast.error("Download unavailable: no chunks found");
      return;
    }

    setIsDownloading(true);
    setDownloadProgress(0);
    setCurrentStep("Downloading chunks...");

    try {
      // Helper: sha256 hex
      const sha256Hex = async (ab: ArrayBuffer) => {
        const d = await crypto.subtle.digest('SHA-256', ab);
        const arr = Array.from(new Uint8Array(d));
        return arr.map((b) => b.toString(16).padStart(2, '0')).join('');
      };

      // Download all chunks as raw bytes and verify hashes
      const chunkBuffers: ArrayBuffer[] = [];
      for (let i = 0; i < dropData.chunks.length; i++) {
        const chunkInfo = dropData.chunks[i];
        setCurrentStep(`Downloading chunk ${i + 1}/${dropData.chunks.length}...`);

        const chunkBytes = await api.downloadChunk(chunkInfo.url);

        // Verify SHA-256 if present
        if (chunkInfo.hash) {
          const got = await sha256Hex(chunkBytes);
          if (got !== chunkInfo.hash) {
            throw new Error(`Hash mismatch on chunk ${i + 1}: expected ${chunkInfo.hash} got ${got}`);
          }
        }

        chunkBuffers.push(chunkBytes);

        const progress = (i / dropData.chunks.length) * 80;
        setDownloadProgress(progress);
      }

      setCurrentStep("Assembling file...");
      setDownloadProgress(85);

      // Concatenate chunks
      const totalBytes = chunkBuffers.reduce((acc, ab) => acc + ab.byteLength, 0);
      const combined = new Uint8Array(totalBytes);
      let offset = 0;
      for (const ab of chunkBuffers) {
        combined.set(new Uint8Array(ab), offset);
        offset += ab.byteLength;
      }

      setCurrentStep("Preparing download...");
      setDownloadProgress(95);

      // Save as single file
      const filename = dropData.manifest?.meta?.filename || (files[0]?.name || 'download.bin');
      const blob = new Blob([combined.buffer], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadProgress(100);
      setCurrentStep("");
      setIsDownloading(false);
      toast.success("Download completed!");

      // Log pickup attempt
      if (dropData.drop_id) {
        await api.logPickup(dropData.drop_id, {
          client_time: Date.now(),
          user_agent_redacted: navigator.userAgent.substring(0, 50),
        });
      }

      // Start burn countdown if burn_after_read is enabled
      if (dropData.manifest.burn_after_read) {
        setCountdown(30);
        const interval = setInterval(() => {
          setCountdown((prev) => {
            if (prev === null || prev <= 1) {
              clearInterval(interval);
              // Burn the drop after countdown
              if (dropData.drop_id) {
                api.burnDrop(dropData.drop_id, 'Auto-burn after download');
              }
              setIsBurned(true);
              return null;
            }
            return prev - 1;
          });
        }, 1000);
      }

    } catch (err) {
      console.error("Download failed:", err);
      setError(err instanceof Error ? err.message : "Download failed");
      setIsDownloading(false);
      setCurrentStep("");
      toast.error("Download failed. Please try again.");
    }
  };


  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />
      
      <main className="container mx-auto px-4 pt-32 pb-20">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center text-white">PickUp Files</h1>
          <p className="text-white/70 text-center mb-12">
            Enter your 6-character code to retrieve securely shared files
          </p>

          {!isBurned ? (
            <>
              {files.length === 0 ? (
                <Card className="p-8">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-white">Drop Code</label>
                      <Input
                        type="text"
                        placeholder="Enter 6-character code"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase())}
                        maxLength={6}
                        className="text-center text-2xl font-mono tracking-widest"
                      />
                    </div>

                    <div className="flex justify-center pt-4">
                      <InteractiveHoverButton
                        text={isLoading ? "Loading..." : "PickUp"}
                        onClick={handlePickup}
                        disabled={code.length !== 6 || isLoading}
                        className="w-48 h-12 text-lg"
                      />
                    </div>

                    {/* Loading State */}
                    {isLoading && (
                      <div className="mt-4 text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-white" />
                        <p className="text-sm text-white/70">{currentStep}</p>
                      </div>
                    )}

                    {/* Error Display */}
                    {error && (
                      <Alert variant="destructive" className="mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <div>
                          <h4 className="font-medium">Pickup Failed</h4>
                          <p className="text-sm mt-1">{error}</p>
                        </div>
                      </Alert>
                    )}
                  </div>
                </Card>
              ) : (
                <div className="space-y-6">
                  <Card className="p-6">
                    <h3 className="font-semibold mb-4 text-white flex items-center gap-2">
                      {dropData?.manifest?.meta?.is_zip ? (
                        <>
                          <Archive className="w-5 h-5" />
                          ZIP Archive
                        </>
                      ) : (
                        <>
                          <FileText className="w-5 h-5" />
                          Available File
                        </>
                      )}
                    </h3>
                    
                    {dropData?.manifest?.meta?.is_zip && dropData?.manifest?.meta?.original_files ? (
                      <div className="space-y-3">
                        <div className="p-4 rounded-lg bg-secondary">
                          <div className="flex items-center gap-3 mb-2">
                            <Archive className="w-6 h-6 text-white/60" />
                            <div>
                              <p className="font-medium text-white">
                                {dropData.manifest.meta.filename}
                              </p>
                              <p className="text-xs text-white/60">
                                ZIP Archive • {formatFileSize(dropData.manifest.meta.size)}
                              </p>
                            </div>
                          </div>
                          <div className="mt-3">
                            <p className="text-sm text-white/70 mb-2">
                              Contains {dropData.manifest.meta.original_files.length} files:
                            </p>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {dropData.manifest.meta.original_files.map((file, idx) => (
                                <div key={idx} className="flex justify-between items-center text-xs text-white/60">
                                  <span className="truncate flex-1 mr-2">{file.name}</span>
                                  <span>{formatFileSize(file.size)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {files.map((file, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-4 rounded-lg bg-secondary"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-white/60" />
                              <div>
                                <p className="font-medium text-white">{file.name}</p>
                                <p className="text-xs text-white/60">
                                  {formatFileSize(file.size)}
                                </p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setPreviewFile(file);
                                setPreviewOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Preview
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>

                  {countdown !== null && (
                    <Alert variant="warning" className="flex items-center gap-3">
                      <TriangleAlert className="text-white" size={20} />
                      <p className="text-sm font-medium text-white">
                        Files will auto-burn in {countdown} seconds after download
                      </p>
                    </Alert>
                  )}

                  {/* Download Progress */}
                  {isDownloading && (
                    <Card className="p-6">
                      <h3 className="font-semibold mb-4 text-white">Downloading...</h3>
                      <Progress value={downloadProgress} className="mb-2" />
                      <p className="text-sm text-white/70 text-center mb-2">
                        {downloadProgress}% complete
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
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <div>
                        <h4 className="font-medium">Download Failed</h4>
                        <p className="text-sm mt-1">{error}</p>
                      </div>
                    </Alert>
                  )}

                  <div className="flex gap-4">
                    <Button
                      onClick={handleDownload}
                      disabled={countdown !== null || isDownloading}
                      className="flex-1 bg-gradient-pickup hover:opacity-90"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {isDownloading ? "Downloading..." : 
                       dropData?.manifest?.meta?.is_zip ? "Download ZIP" : "Download File"}
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center p-12 border border-white/30 rounded-lg bg-white/5">
              <TriangleAlert className="text-white w-16 h-16 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold mb-2 text-white">Drop Burned</h3>
              <p className="text-white/70">
                This drop has been burned and is no longer available.
              </p>
            </div>
          )}
        </div>
      </main>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>File details</DialogTitle>
            {previewFile ? (
              <DialogDescription>
                <div className="space-y-2">
                  <div className="text-sm"><span className="text-muted-foreground">Name:</span> {previewFile.name}</div>
                  <div className="text-sm"><span className="text-muted-foreground">Size:</span> {formatSize(previewFile.size)}</div>
                </div>
              </DialogDescription>
            ) : null}
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Pickup;

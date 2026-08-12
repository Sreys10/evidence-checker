"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { saveEvidence, updateEvidenceAnalysis, getEvidenceById, getAllEvidence, type StoredEvidence } from "@/lib/evidence-storage";

interface DetectionResult {
  id: string;
  fileName: string;
  imagePreview: string;
  status: "pending" | "analyzing" | "complete";
  result: {
    isTampered: boolean;
    confidence: number;
    anomalies: string[];
    metadata: {
      camera?: string;
      date?: string;
      location?: string;
      software?: string;
    };

    aiDetection?: {
      deepfake: number;
      aiGenerated: number;
      quality: number;
      scamProb: number;
      rawResults?: Record<string, unknown>;
    };
    weaponDetection?: {
      weaponsFound: boolean;
      weaponsDetected: string[];
      detections: Array<{
        class: string;
        confidence: number;
        bbox: { x: number; y: number; width: number; height: number };
      }>;
      totalDetections: number;
    };
  } | null;
}

// Helper to convert base64 to file
const dataURLtoFile = async (dataUrl: string, filename: string): Promise<File> => {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type });
};

interface TamperingDetectionProps {
  preselectedEvidenceId?: string | null;
  isEmbedded?: boolean;
  autoStart?: boolean;
  onAnalysisStarted?: () => void;
}

export default function TamperingDetection({
  preselectedEvidenceId,
  isEmbedded = false,
  autoStart = false,
  onAnalysisStarted
}: TamperingDetectionProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<DetectionResult[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<DetectionResult | null>(null);
  // Ref to reliably gate autoStart — avoids stale closure on isAnalyzing state
  const isRunningRef = React.useRef(false);

  // Load evidence from storage on mount
  useEffect(() => {
    loadEvidenceFromStorage();
  }, []);

  useEffect(() => {
    const loadPreselected = async () => {
      if (preselectedEvidenceId) {
        try {
          const found = await getEvidenceById(preselectedEvidenceId);
          if (found && found.imageData) {
            // Guard: skip video evidence — tampering detection only supports images.
            if (found.type && found.type.startsWith('video/')) {
              console.warn('TamperingDetection: preselected evidence is a video. Skipping auto-load.');
              return;
            }
            // If already fully analyzed, skip re-running and push full result to local state
            if (found.status === 'complete' && found.result) {
              const fullResult: DetectionResult = {
                id: found.id || (found as any)._id,
                fileName: found.fileName,
                imagePreview: found.imageData,
                status: "complete",
                result: {
                  isTampered: found.result === "tampered",
                  confidence: found.confidence || 0,
                  anomalies: found.anomalies || [],
                  metadata: found.metadata || {},
                  aiDetection: found.aiDetection,
                  weaponDetection: found.weaponDetection,
                }
              };
              setResults(prev => {
                const filtered = prev.filter(r => r.id !== fullResult.id);
                return [fullResult, ...filtered];
              });
              return;
            }
            if (found.status === 'analyzing') {
              setIsAnalyzing(true);
              return;
            }
            const file = await dataURLtoFile(found.imageData, found.fileName);
            setSelectedFile(file);

            // Auto-start when embedded OR when autoStart prop is true
            const shouldAutoStart = isEmbedded || autoStart;
            if (shouldAutoStart && !isRunningRef.current) {
              if (onAnalysisStarted) onAnalysisStarted();
              startAnalysis(file);
            }
          }
        } catch (e) {
          console.error("Failed to load preselected evidence", e);
        }
      }
    };
    loadPreselected();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedEvidenceId, autoStart, isEmbedded]);

  const loadEvidenceFromStorage = async () => {
    const storedEvidence = await getAllEvidence();
    // Sort by uploadDate descending and pick only the latest complete one
    const latest = storedEvidence
      .filter(e => e.status === "complete")
      .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())[0];

    if (!latest) return;

    const latestResult: DetectionResult = {
      id: latest.id || (latest as any)._id,
      fileName: latest.fileName,
      imagePreview: latest.imageData,
      status: "complete" as const,
      result: latest.result ? {
        isTampered: latest.result === "tampered",
        confidence: latest.confidence || 0,
        anomalies: latest.anomalies || [],
        metadata: latest.metadata || {},
        aiDetection: latest.aiDetection,
        weaponDetection: latest.weaponDetection,
      } : null,
    };

    setResults([latestResult]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
    }
  };

  const startAnalysis = async (fileToAnalyze?: File) => {
    const file = fileToAnalyze || selectedFile;
    if (!file) return;
    // Prevent duplicate concurrent analyses (guards the autoStart stale-closure bug)
    if (isRunningRef.current) return;

    isRunningRef.current = true;
    setIsAnalyzing(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const preview = e.target?.result as string;
      const newAnalysis: DetectionResult = {
        id: Date.now().toString(),
        fileName: file.name,
        imagePreview: preview,
        status: "analyzing",
        result: null,
      };

      setCurrentAnalysis(newAnalysis);
      // Replace the single displayed result with the new in-progress one
      setResults([newAnalysis]);

      try {
        // First, save the evidence to storage
        const evidenceData: StoredEvidence = {
          fileName: file.name,
          imageData: preview,
          uploadDate: new Date().toISOString(),
          status: "analyzing",
          size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
          type: file.type,
        };
        const savedResult = await saveEvidence(evidenceData);
        const evidenceId = savedResult?.id || savedResult?._id || newAnalysis.id;

        // Create FormData to send the image
        const formData = new FormData();
        formData.append('image', file);

        // Call the API
        const response = await fetch('/api/detect-tampering', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('API Error:', errorData);
          const errorMessage = errorData.details || errorData.error || 'Analysis failed';
          throw new Error(errorMessage);
        }

        const data = await response.json();

        if (data.success && data.result) {
          const analysisResult = {
            isTampered: data.result.isTampered,
            confidence: data.result.confidence,
            anomalies: data.result.anomalies || [],
            metadata: data.result.metadata || {},
            aiDetection: data.result.aiDetection,
            weaponDetection: data.result.weaponDetection,
          };

          await updateEvidenceAnalysis(evidenceId as string, {
            isTampered: data.result.isTampered,
            confidence: data.result.confidence,
            anomalies: data.result.anomalies || [],
            metadata: data.result.metadata,
            aiDetection: data.result.aiDetection,
            weaponDetection: data.result.weaponDetection,
          });

          setCurrentAnalysis(null);
          // Replace with the single completed result
          setResults([{ ...newAnalysis, status: "complete", result: analysisResult }]);
        } else {
          throw new Error('Invalid response from server');
        }
      } catch (error) {
        console.error('Analysis error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Analysis failed';

        setCurrentAnalysis(null);
        setResults((prev) =>
          prev.map((r) =>
            r.id === newAnalysis.id
              ? {
                ...r,
                status: "complete",
                result: {
                  isTampered: false,
                  confidence: 0,
                  anomalies: [`Error: ${errorMessage}`],
                  metadata: {},
                },
              }
              : r
          )
        );
      } finally {
        isRunningRef.current = false;
        setIsAnalyzing(false);
        setSelectedFile(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // Placeholder for handleDetectAndSearch, assuming it will be defined elsewhere or is a typo for startAnalysis
  const handleDetectAndSearch = () => {
    startAnalysis(); // Assuming this is the intended action
  };

  return (
    <div className="space-y-6">

      {/* ── Forensic Tampering ────────────────────────────────────────── */}
      <>
        {/* Upload Section */}
        <Card className={isEmbedded ? "border-0 shadow-none bg-transparent" : ""}>
        {!isEmbedded && (
          <CardHeader>
            <CardTitle>Detect Tampering</CardTitle>
            <CardDescription>
              Upload an image to analyze for tampering, manipulation, or forgery
            </CardDescription>
          </CardHeader>
        )}
        <CardContent className={isEmbedded ? "p-0" : ""}>
          {/* In embedded mode: hide the file upload UI entirely.
              The image comes from the already-uploaded evidence record and
              analysis starts automatically. */}
          {!isEmbedded && (
            selectedFile ? (
              (!currentAnalysis && !isAnalyzing && !(results.filter(r => r.id === preselectedEvidenceId).length > 0)) && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg border border-border">
                    <div className="h-16 w-16 bg-muted rounded overflow-hidden flex-shrink-0">
                      <img
                        src={selectedFile ? URL.createObjectURL(selectedFile) : ""}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)}>Change</Button>
                  </div>
                  <Button id="run-analysis-btn" onClick={() => startAnalysis()} disabled={isAnalyzing} className="w-full gap-2 py-6 text-base font-semibold shadow-lg">
                    {isAnalyzing ? <><Loader2 className="h-5 w-5 animate-spin" /> Analyzing...</> : <><Search className="h-5 w-5" /> Run Forensic Tampering Check</>}
                  </Button>
                </div>
              )
            ) : (
              <div className="flex flex-col sm:flex-row gap-4">
                <label className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isAnalyzing}
                  />
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors">
                    <ImageIcon className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Supports JPEG, PNG, WebP up to 10MB
                    </p>
                  </div>
                </label>
              </div>
            )
          )}
        </CardContent>
      </Card>

      {/* Current Analysis */}
      {
        currentAnalysis && (
          <Card className="border border-cyan-500/20 bg-cyan-950/5 shadow-md overflow-hidden relative">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold tracking-wider text-cyan-500 uppercase flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Forensic Analysis Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="relative w-28 h-28 bg-muted rounded-lg overflow-hidden border border-cyan-500/30 flex-shrink-0">
                  <img
                    src={currentAnalysis.imagePreview}
                    alt={currentAnalysis.fileName}
                    className="w-full h-full object-cover"
                  />
                  {/* Glowing scanline overlay */}
                  <motion.div 
                    className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_10px_rgba(34,211,238,0.85)] z-10"
                    animate={{ top: ['0%', '100%'] }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                  />
                  <div className="absolute inset-0 bg-cyan-500/5 mix-blend-overlay pointer-events-none animate-pulse" />
                </div>
                <div className="flex-1 w-full">
                  <p className="font-semibold text-sm text-foreground truncate">{currentAnalysis.fileName}</p>
                  
                  <div className="mt-2.5 p-3 rounded-lg bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/25 relative overflow-hidden shadow-sm">
                    {/* Sliding scanning beam */}
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/15 to-transparent -skew-x-12"
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                    />
                    <div className="flex items-center gap-3 relative z-10">
                      <div className="relative flex h-5 w-5 shrink-0 items-center justify-center">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                        <Loader2 className="h-4 w-4 animate-spin text-cyan-500 relative z-10" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-xs text-foreground">Forensic Scanning in Progress</span>
                        <span className="text-[10px] text-muted-foreground">Running ELA compression, noise map uniformity, and metadata checks...</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      }

      {/* Results — only shows the latest single result */}
      {
        (() => {
          const displayResults = isEmbedded
            ? results.filter(r => r.id === preselectedEvidenceId)
            : results.slice(0, 1); // Only the latest result
          return displayResults.length > 0 && (
          <div className="space-y-4">
            {!isEmbedded && <h2 className="text-xl font-semibold text-foreground">Analysis Result</h2>}
            {displayResults.map((result) => (
              <Card key={result.id} className={isEmbedded ? "border-0 shadow-none bg-transparent" : ""}>
                <CardContent className={isEmbedded ? "p-0" : "p-6"}>
                  <div className={isEmbedded ? "space-y-4" : "grid grid-cols-1 lg:grid-cols-3 gap-6"}>
                    {/* Image Preview - Hide if embedded */}
                    {!isEmbedded && (
                      <div className="lg:col-span-1">
                        <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                          <img
                            src={result.imagePreview}
                            alt={result.fileName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">{result.fileName}</p>
                      </div>
                    )}

                    {/* Analysis Results */}
                    {result.result && (
                      <div className={isEmbedded ? "w-full space-y-4" : "lg:col-span-2 space-y-4"}>
                        {/* Verdict Header */}
                        <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/30 p-3.5 rounded-xl border border-border">
                          <div className="flex items-center gap-3">
                            {result.result.isTampered ? (
                              <Badge variant="destructive" className="text-sm px-3 py-1 font-semibold">
                                <AlertTriangle className="h-4 w-4 mr-1.5 shrink-0" />
                                Tampered — {result.result.confidence.toFixed(1)}% Confidence
                              </Badge>
                            ) : (
                              <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-3 py-1 font-semibold">
                                <CheckCircle2 className="h-4 w-4 mr-1.5 shrink-0" />
                                Authentic — {result.result.confidence.toFixed(1)}% Confidence
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground font-mono">
                            ID: {result.id.slice(0, 12)}
                          </span>
                        </div>

                        {/* Anomalies / Integrity Status */}
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Forensic Integrity & Anomalies</p>
                          {result.result.isTampered ? (
                            <ul className="space-y-2 bg-destructive/5 border border-destructive/20 p-3.5 rounded-xl">
                              {result.result.anomalies && result.result.anomalies.length > 0 ? (
                                result.result.anomalies.map((anomaly, idx) => (
                                  <li key={idx} className="text-sm text-destructive font-medium flex items-start gap-2">
                                    <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                                    <span>{anomaly}</span>
                                  </li>
                                ))
                              ) : (
                                <li className="text-sm text-destructive font-medium flex items-start gap-2">
                                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                                  <span>AI Forensic model detected synthetic content manipulation / deepfake patterns in this image.</span>
                                </li>
                              )}
                            </ul>
                          ) : (
                            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                              <span className="text-xs font-medium">
                                No tampering anomalies detected across Error Level Analysis (ELA), PRNU sensor check, and metadata checksums.
                              </span>
                            </div>
                          )}
                        </div>



                        {/* AI Detection Analytics */}
                        {result.result.aiDetection && (
                          <div className="pt-3 border-t border-border">
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">AI & Forensics Metrics</p>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-muted/40 border border-border/60 p-3 rounded-xl">
                                <p className="text-[11px] font-medium text-muted-foreground mb-1">Deepfake Probability</p>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                    <motion.div
                                      className={`h-full ${result.result.aiDetection.deepfake > 0.5 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                      initial={{ width: 0 }}
                                      animate={{ width: `${result.result.aiDetection.deepfake * 100}%` }}
                                      transition={{ duration: 1, delay: 0.2 }}
                                    />
                                  </div>
                                  <span className="text-xs font-bold font-mono">
                                    {(result.result.aiDetection.deepfake * 100).toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                              <div className="bg-muted/40 border border-border/60 p-3 rounded-xl">
                                <p className="text-[11px] font-medium text-muted-foreground mb-1">AI-Generated Content</p>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                    <motion.div
                                      className={`h-full ${result.result.aiDetection.aiGenerated > 0.5 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                      initial={{ width: 0 }}
                                      animate={{ width: `${result.result.aiDetection.aiGenerated * 100}%` }}
                                      transition={{ duration: 1, delay: 0.3 }}
                                    />
                                  </div>
                                  <span className="text-xs font-bold font-mono">
                                    {(result.result.aiDetection.aiGenerated * 100).toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                              <div className="bg-muted/40 border border-border/60 p-3 rounded-xl">
                                <p className="text-[11px] font-medium text-muted-foreground mb-1">Image Quality</p>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                    <motion.div
                                      className={`h-full ${result.result.aiDetection.quality > 0.7 ? 'bg-emerald-500' : result.result.aiDetection.quality > 0.4 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                      initial={{ width: 0 }}
                                      animate={{ width: `${result.result.aiDetection.quality * 100}%` }}
                                      transition={{ duration: 1, delay: 0.4 }}
                                    />
                                  </div>
                                  <span className="text-xs font-bold font-mono">
                                    {(result.result.aiDetection.quality * 100).toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                              <div className="bg-muted/40 border border-border/60 p-3 rounded-xl">
                                <p className="text-[11px] font-medium text-muted-foreground mb-1">Scammer / Fraud Signal</p>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                    <motion.div
                                      className={`h-full ${result.result.aiDetection.scamProb > 0.5 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                      initial={{ width: 0 }}
                                      animate={{ width: `${result.result.aiDetection.scamProb * 100}%` }}
                                      transition={{ duration: 1, delay: 0.5 }}
                                    />
                                  </div>
                                  <span className="text-xs font-bold font-mono">
                                    {(result.result.aiDetection.scamProb * 100).toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                              {result.result.weaponDetection && (
                                <div className="bg-muted/40 border border-border/60 p-3 rounded-xl col-span-2">
                                  <p className="text-[11px] font-medium text-muted-foreground mb-1">Weapon / Threat Detection</p>
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                      <motion.div
                                        className={`h-full ${result.result.weaponDetection.weaponsFound ? 'bg-red-500' : 'bg-emerald-500'}`}
                                        initial={{ width: 0 }}
                                        animate={{ width: result.result.weaponDetection.weaponsFound ? '100%' : '0%' }}
                                        transition={{ duration: 1, delay: 0.6 }}
                                      />
                                    </div>
                                    <span className={`text-xs font-bold ${result.result.weaponDetection.weaponsFound ? 'text-red-500' : 'text-emerald-500'}`}>
                                      {result.result.weaponDetection.weaponsFound ? `Threat (${result.result.weaponDetection.weaponsDetected.join(', ') || 'Weapon Found'})` : 'Safe (No Weapon)'}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          );
        })()
      }
      </>
    </div>
  );
}


"use client";
import { useState, useEffect } from "react";
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
import { saveEvidence, updateEvidenceAnalysis, getAllEvidence, type StoredEvidence } from "@/lib/evidence-storage";

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
    analysis: {
      pixelAnalysis: number;
      metadataAnalysis: number;
      compressionAnalysis: number;
      overallScore: number;
    };
    aiDetection?: {
      deepfake: number;
      aiGenerated: number;
      quality: number;
      scamProb: number;
      rawResults?: Record<string, unknown>;
    };
  } | null;
}

export default function TamperingDetection() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<DetectionResult[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<DetectionResult | null>(null);

  // Load evidence from storage on mount
  useEffect(() => {
    loadEvidenceFromStorage();
  }, []);

  const loadEvidenceFromStorage = () => {
    const storedEvidence = getAllEvidence();
    const analyzedEvidence = storedEvidence.filter(e => e.status === "complete");
    
    const detectionResults: DetectionResult[] = analyzedEvidence.map(evidence => ({
      id: evidence.id,
      fileName: evidence.fileName,
      imagePreview: evidence.imageData,
      status: "complete" as const,
      result: evidence.result ? {
        isTampered: evidence.result === "tampered",
        confidence: evidence.confidence || 0,
        anomalies: evidence.anomalies || [],
        metadata: evidence.metadata || {},
        analysis: evidence.analysis || {
          pixelAnalysis: 0,
          metadataAnalysis: 0,
          compressionAnalysis: 0,
          overallScore: 0,
        },
        aiDetection: evidence.aiDetection,
      } : null,
    }));
    
    setResults(detectionResults);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
    }
  };

  const startAnalysis = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const preview = e.target?.result as string;
      const newAnalysis: DetectionResult = {
        id: Date.now().toString(),
        fileName: selectedFile.name,
        imagePreview: preview,
        status: "analyzing",
        result: null,
      };

      setCurrentAnalysis(newAnalysis);
      setResults((prev) => [newAnalysis, ...prev]);

      try {
        // First, save the evidence to storage
        const evidenceId = newAnalysis.id;
        const evidenceData: StoredEvidence = {
          id: evidenceId,
          fileName: selectedFile.name,
          imageData: preview,
          uploadDate: new Date().toISOString(),
          status: "analyzing",
          size: `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`,
          type: selectedFile.type,
        };
        saveEvidence(evidenceData);

        // Create FormData to send the image
        const formData = new FormData();
        formData.append('image', selectedFile);

        // Call the API
        const response = await fetch('/api/detect-tampering', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || errorData.details || 'Analysis failed');
        }

        const data = await response.json();
        
        if (data.success && data.result) {
          const analysisResult = {
            isTampered: data.result.isTampered,
            confidence: data.result.confidence,
            anomalies: data.result.anomalies || [],
            metadata: data.result.metadata || {},
            analysis: data.result.analysis || {
              pixelAnalysis: 0,
              metadataAnalysis: 0,
              compressionAnalysis: 0,
              overallScore: 0,
            },
            aiDetection: data.result.aiDetection, // Store AI detection results
          };

          // Update evidence in storage with analysis results
          updateEvidenceAnalysis(evidenceId, {
            isTampered: data.result.isTampered,
            confidence: data.result.confidence,
            anomalies: data.result.anomalies || [],
            analysis: data.result.analysis || {
              pixelAnalysis: 0,
              metadataAnalysis: 0,
              compressionAnalysis: 0,
              overallScore: 0,
            },
            metadata: data.result.metadata,
            aiDetection: data.result.aiDetection,
          });

          setCurrentAnalysis(null);
          setResults((prev) =>
            prev.map((r) =>
              r.id === newAnalysis.id
                ? { ...r, status: "complete", result: analysisResult }
                : r
            )
          );
        } else {
          throw new Error('Invalid response from server');
        }
      } catch (error) {
        console.error('Analysis error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
        
        // Update with error state
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
                    analysis: {
                      pixelAnalysis: 0,
                      metadataAnalysis: 0,
                      compressionAnalysis: 0,
                      overallScore: 0,
                    },
                  },
                }
              : r
          )
        );
      } finally {
        setIsAnalyzing(false);
        setSelectedFile(null);
      }
    };
    reader.readAsDataURL(selectedFile);
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Detect Tampering</CardTitle>
          <CardDescription>
            Upload an image to analyze for tampering, manipulation, or forgery
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                  {selectedFile ? selectedFile.name : "Select an image file"}
                </p>
              </div>
            </label>
            <Button
              onClick={startAnalysis}
              disabled={!selectedFile || isAnalyzing}
              className="sm:w-auto"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Start Analysis
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Analysis */}
      {currentAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis in Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="relative w-32 h-32 bg-muted rounded-lg overflow-hidden">
                <img
                  src={currentAnalysis.imagePreview}
                  alt={currentAnalysis.fileName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{currentAnalysis.fileName}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">
                    Analyzing image for tampering...
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Analysis Results</h2>
        {results.map((result) => (
          <Card key={result.id}>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Image Preview */}
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

                {/* Analysis Results */}
                {result.result && (
                  <div className="lg:col-span-2 space-y-4">
                    {/* Status Badge */}
                    <div className="flex items-center gap-3">
                      {result.result.isTampered ? (
                        <Badge variant="destructive" className="text-sm">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Tampered - {result.result.confidence.toFixed(1)}% Confidence
                        </Badge>
                      ) : (
                        <Badge className="bg-green-500 text-white text-sm">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Authentic - {result.result.confidence.toFixed(1)}% Confidence
                        </Badge>
                      )}
                    </div>

                    {/* Analysis Scores */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Pixel Analysis</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-primary"
                              initial={{ width: 0 }}
                              animate={{ width: `${result.result.analysis.pixelAnalysis}%` }}
                              transition={{ duration: 1 }}
                            />
                          </div>
                          <span className="text-sm font-medium">
                            {result.result.analysis.pixelAnalysis.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Metadata Analysis</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-blue-500"
                              initial={{ width: 0 }}
                              animate={{ width: `${result.result.analysis.metadataAnalysis}%` }}
                              transition={{ duration: 1, delay: 0.2 }}
                            />
                          </div>
                          <span className="text-sm font-medium">
                            {result.result.analysis.metadataAnalysis.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Compression Analysis</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-orange-500"
                              initial={{ width: 0 }}
                              animate={{ width: `${result.result.analysis.compressionAnalysis}%` }}
                              transition={{ duration: 1, delay: 0.4 }}
                            />
                          </div>
                          <span className="text-sm font-medium">
                            {result.result.analysis.compressionAnalysis.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Overall Score</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-green-500"
                              initial={{ width: 0 }}
                              animate={{ width: `${result.result.analysis.overallScore}%` }}
                              transition={{ duration: 1, delay: 0.6 }}
                            />
                          </div>
                          <span className="text-sm font-medium">
                            {result.result.analysis.overallScore.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Anomalies */}
                    {result.result.anomalies.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-foreground mb-2">Detected Anomalies:</p>
                        <ul className="space-y-1">
                          {result.result.anomalies.map((anomaly, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                              {anomaly}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="pt-4 border-t border-border">
                      <p className="text-sm font-medium text-foreground mb-2">Metadata:</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {result.result.metadata.camera && (
                          <div>
                            <span className="text-muted-foreground">Camera: </span>
                            <span className="text-foreground">{result.result.metadata.camera}</span>
                          </div>
                        )}
                        {result.result.metadata.date && (
                          <div>
                            <span className="text-muted-foreground">Date: </span>
                            <span className="text-foreground">{result.result.metadata.date}</span>
                          </div>
                        )}
                        {result.result.metadata.location && (
                          <div>
                            <span className="text-muted-foreground">Location: </span>
                            <span className="text-foreground">{result.result.metadata.location}</span>
                          </div>
                        )}
                        {result.result.metadata.software && (
                          <div>
                            <span className="text-muted-foreground">Software: </span>
                            <span className="text-foreground">{result.result.metadata.software}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* AI Detection Results */}
                    {result.result.aiDetection && (
                      <div className="pt-4 border-t border-border">
                        <p className="text-sm font-medium text-foreground mb-3">AI Detection Results:</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-muted/50 p-3 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Deepfake Probability</p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <motion.div
                                  className={`h-full ${result.result.aiDetection.deepfake > 0.5 ? 'bg-red-500' : 'bg-green-500'}`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${result.result.aiDetection.deepfake * 100}%` }}
                                  transition={{ duration: 1, delay: 0.8 }}
                                />
                              </div>
                              <span className="text-sm font-medium">
                                {(result.result.aiDetection.deepfake * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                          <div className="bg-muted/50 p-3 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">AI-Generated Content</p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <motion.div
                                  className={`h-full ${result.result.aiDetection.aiGenerated > 0.5 ? 'bg-red-500' : 'bg-green-500'}`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${result.result.aiDetection.aiGenerated * 100}%` }}
                                  transition={{ duration: 1, delay: 1 }}
                                />
                              </div>
                              <span className="text-sm font-medium">
                                {(result.result.aiDetection.aiGenerated * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                          <div className="bg-muted/50 p-3 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Image Quality</p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <motion.div
                                  className={`h-full ${result.result.aiDetection.quality > 0.7 ? 'bg-green-500' : result.result.aiDetection.quality > 0.4 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${result.result.aiDetection.quality * 100}%` }}
                                  transition={{ duration: 1, delay: 1.2 }}
                                />
                              </div>
                              <span className="text-sm font-medium">
                                {(result.result.aiDetection.quality * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                          <div className="bg-muted/50 p-3 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Scammer Detection</p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <motion.div
                                  className={`h-full ${result.result.aiDetection.scamProb > 0.5 ? 'bg-red-500' : 'bg-green-500'}`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${result.result.aiDetection.scamProb * 100}%` }}
                                  transition={{ duration: 1, delay: 1.4 }}
                                />
                              </div>
                              <span className="text-sm font-medium">
                                {(result.result.aiDetection.scamProb * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
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
    </div>
  );
}


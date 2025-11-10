"use client";
import { useState } from "react";
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
  } | null;
}

const mockResults: DetectionResult[] = [
  {
    id: "1",
    fileName: "evidence_001.jpg",
    imagePreview: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23ddd' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999'%3EEvidence Image%3C/text%3E%3C/svg%3E",
    status: "complete",
    result: {
      isTampered: false,
      confidence: 94.5,
      anomalies: [],
      metadata: {
        camera: "Canon EOS 5D Mark IV",
        date: "2024-01-15 14:30:22",
        location: "New York, USA",
      },
      analysis: {
        pixelAnalysis: 96,
        metadataAnalysis: 98,
        compressionAnalysis: 89,
        overallScore: 94.5,
      },
    },
  },
  {
    id: "2",
    fileName: "evidence_002.png",
    imagePreview: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23ddd' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999'%3EEvidence Image%3C/text%3E%3C/svg%3E",
    status: "complete",
    result: {
      isTampered: true,
      confidence: 87.3,
      anomalies: [
        "Inconsistent pixel patterns detected",
        "Metadata mismatch found",
        "Compression artifacts suggest editing",
      ],
      metadata: {
        camera: "Unknown",
        software: "Adobe Photoshop 2024",
        date: "2024-01-20 10:15:00",
      },
      analysis: {
        pixelAnalysis: 72,
        metadataAnalysis: 45,
        compressionAnalysis: 65,
        overallScore: 87.3,
      },
    },
  },
];

export default function TamperingDetection() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<DetectionResult[]>(mockResults);
  const [currentAnalysis, setCurrentAnalysis] = useState<DetectionResult | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
    }
  };

  const startAnalysis = () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
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

      // Simulate analysis
      setTimeout(() => {
        const mockResult = {
          isTampered: Math.random() > 0.5,
          confidence: 75 + Math.random() * 20,
          anomalies: Math.random() > 0.5 ? ["Pixel inconsistency detected"] : [],
          metadata: {
            camera: "Canon EOS 5D",
            date: new Date().toISOString(),
          },
          analysis: {
            pixelAnalysis: 80 + Math.random() * 15,
            metadataAnalysis: 75 + Math.random() * 20,
            compressionAnalysis: 70 + Math.random() * 25,
            overallScore: 75 + Math.random() * 20,
          },
        };

        setCurrentAnalysis(null);
        setResults((prev) =>
          prev.map((r) =>
            r.id === newAnalysis.id
              ? { ...r, status: "complete", result: mockResult }
              : r
          )
        );
        setIsAnalyzing(false);
        setSelectedFile(null);
      }, 3000);
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


"use client";
import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Search,
  User,
  CheckCircle2,
  XCircle,
  Loader2,
  Settings,
  Image as ImageIcon,
} from "lucide-react";

interface FaceMatch {
  face_number: number;
  match_found: boolean;
  match_info: {
    identity: string;
    distance: number;
    person_name: string;
  } | null;
  face_image_base64: string;
  error?: string;
}

interface DetectionResult {
  success: boolean;
  faces_detected: number;
  matches: FaceMatch[];
  error?: string;
}

export default function FaceDetection() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Configuration state
  const [detector, setDetector] = useState("retinaface");
  const [model, setModel] = useState("ArcFace");
  const [threshold, setThreshold] = useState(0.5);
  const [showSettings, setShowSettings] = useState(false);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    setSelectedFile(file);
    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDetectAndSearch = async () => {
    if (!selectedFile) {
      setError("Please select an image first");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);
      formData.append("detector", detector);
      formData.append("model", model);
      formData.append("threshold", threshold.toString());
      formData.append("database_path", "database/");

      const response = await fetch("/api/face/detect-and-search", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process image");
      }

      setResult(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      console.error("Face detection error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Face Detection & Matching
              </CardTitle>
              <CardDescription>
                Upload an image to detect faces and match them against the database
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Settings Panel */}
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 bg-muted rounded-lg space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Face Detector
                  </label>
                  <select
                    value={detector}
                    onChange={(e) => setDetector(e.target.value)}
                    className="w-full p-2 border rounded-md bg-background"
                  >
                    <option value="retinaface">RetinaFace</option>
                    <option value="opencv">OpenCV</option>
                    <option value="ssd">SSD</option>
                    <option value="dlib">Dlib</option>
                    <option value="mtcnn">MTCNN</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Recognition Model
                  </label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full p-2 border rounded-md bg-background"
                  >
                    <option value="ArcFace">ArcFace</option>
                    <option value="VGG-Face">VGG-Face</option>
                    <option value="Facenet">Facenet</option>
                    <option value="OpenFace">OpenFace</option>
                    <option value="DeepFace">DeepFace</option>
                    <option value="DeepID">DeepID</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Distance Threshold: {threshold.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={threshold}
                    onChange={(e) => setThreshold(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Lower = stricter matching
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* File Upload Area */}
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleFileSelect(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
            {preview ? (
              <div className="space-y-4">
                <img
                  src={preview}
                  alt="Preview"
                  className="max-h-64 mx-auto rounded-lg"
                />
                <div className="flex gap-2 justify-center">
                  <Button onClick={(e) => { e.stopPropagation(); handleClear(); }} variant="outline">
                    <XCircle className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDetectAndSearch();
                    }}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Detect & Match Faces
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">
                  Drag and drop an image here, or click to select
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports JPG, PNG, and other image formats
                </p>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive"
            >
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </motion.div>
          )}

          {/* Results Display */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Detection Results
                  </CardTitle>
                  <CardDescription>
                    {result.faces_detected} face(s) detected
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {result.matches && result.matches.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {result.matches.map((match) => (
                        <Card key={match.face_number} className="overflow-hidden">
                          <div className="relative">
                            <img
                              src={match.face_image_base64}
                              alt={`Face ${match.face_number}`}
                              className="w-full h-48 object-cover"
                            />
                            <Badge
                              className={`absolute top-2 right-2 ${
                                match.match_found
                                  ? "bg-green-500"
                                  : "bg-gray-500"
                              }`}
                            >
                              {match.match_found ? (
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                              ) : (
                                <XCircle className="h-3 w-3 mr-1" />
                              )}
                              {match.match_found ? "Match" : "No Match"}
                            </Badge>
                          </div>
                          <CardContent className="p-4">
                            <p className="font-medium mb-2">
                              Face {match.face_number}
                            </p>
                            {match.match_found && match.match_info ? (
                              <div className="space-y-1 text-sm">
                                <p>
                                  <span className="font-medium">Person:</span>{" "}
                                  {match.match_info.person_name}
                                </p>
                                <p>
                                  <span className="font-medium">Distance:</span>{" "}
                                  {match.match_info.distance.toFixed(4)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {match.match_info.identity}
                                </p>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                No match found in database
                                {match.error && ` - ${match.error}`}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No faces detected in the image
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Upload,
  Search,
  Loader2,
  AlertCircle,
  Scan,
  User,
  ShieldAlert,
  FolderOpen,
  Calendar,
  FileText,
  UserCheck,
  UserX,
  Send,
  CheckCircle2,
} from "lucide-react";
import { downloadReport, type ReportData } from "@/lib/report-generator";

interface MatchedPerson {
  id: string;
  full_name: string;
  case_number?: string;
  gender?: string;
  age?: number;
  notes?: string;
  created_at: string;
  registered_images: string[];
}

interface SearchResult {
  face_index: int;
  bounding_box: number[]; // [x1, y1, x2, y2]
  matched: boolean;
  confidence?: number;
  person?: MatchedPerson;
}

const FACE_BACKEND_URL = process.env.NEXT_PUBLIC_FACE_BACKEND_URL || 'http://localhost:5001';

export default function FaceRecognitionSearch() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [threshold, setThreshold] = useState<number>(0.60);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFaceIndex, setSelectedFaceIndex] = useState<number | null>(null);
  const [isSendingToAdmin, setIsSendingToAdmin] = useState(false);
  const [sentToAdmin, setSentToAdmin] = useState(false);

  // Scaling factors for overlays
  const [imgScale, setImgScale] = useState({ scaleX: 1, scaleY: 1, renderedW: 0, renderedH: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update scale factor when image loads or window resizes
  const updateScaling = () => {
    if (imgRef.current) {
      const img = imgRef.current;
      const renderedW = img.clientWidth;
      const renderedH = img.clientHeight;
      const naturalW = img.naturalWidth;
      const naturalH = img.naturalHeight;

      if (naturalW > 0 && naturalH > 0) {
        setImgScale({
          scaleX: renderedW / naturalW,
          scaleY: renderedH / naturalH,
          renderedW,
          renderedH,
        });
      }
    }
  };

  useEffect(() => {
    window.addEventListener("resize", updateScaling);
    return () => window.removeEventListener("resize", updateScaling);
  }, []);

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setResults(null);
    setSelectedFaceIndex(null);
    setSentToAdmin(false);

    const file = files[0];
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSearch = async () => {
    if (!selectedFile) {
      setError("Please select or drag an image first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);
    setSelectedFaceIndex(null);
    setSentToAdmin(false);

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);
      formData.append("threshold", threshold.toString());

      const response = await fetch("/api/faces/search", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Face search failed.");
      }

      setResults(data);
      if (data && data.length > 0) {
        // Auto-select the first matched face, fallback to index 0 if none matched
        const matchedIdx = data.findIndex((res: any) => res.matched);
        setSelectedFaceIndex(matchedIdx !== -1 ? matchedIdx : 0);
      } else {
        setError("No faces detected in the uploaded image.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during face search.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadReport = () => {
    if (!results || !selectedFile) return;

    // Get current user from localStorage
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    const user = userStr ? JSON.parse(userStr) : { name: "Forensic Analyst", email: "analyst@evicheck.com" };

    const matches = results.map((res) => ({
      face_number: res.face_index + 1,
      match_found: res.matched,
      face_image_base64: preview || "", // Fallback to full preview URL
      match_info: res.matched && res.person ? {
        person_name: res.person.full_name,
        distance: 1 - (res.confidence || 0) / 100,
        original_image_base64: res.person.registered_images?.[0] 
          ? getImageUrl(res.person.registered_images[0])
          : "",
        metadata: {
          age: res.person.age ? `${res.person.age} yrs` : "",
          gender: res.person.gender || "",
          notes: res.person.notes || ""
        }
      } : null
    }));

    // Aggregate overall confidence as average confidence of matches, fallback to 100
    const matchedItems = results.filter(r => r.matched);
    const avgConfidence = matchedItems.length > 0
      ? matchedItems.reduce((acc, curr) => acc + (curr.confidence || 0), 0) / matchedItems.length
      : 100;

    const reportData: ReportData = {
      id: `face_rep_${Date.now()}`,
      fileName: `report_faces_${selectedFile.name.replace(/\.[^/.]+$/, "")}_${new Date().toISOString().split("T")[0]}.pdf`,
      evidenceName: selectedFile.name,
      imageData: preview || "",
      generatedDate: new Date().toISOString(),
      generatedBy: {
        name: user.name,
        email: user.email,
      },
      status: matchedItems.length > 0 ? "authentic" : "tampered", // Authentic if matches found, tampered if unknown faces
      confidence: avgConfidence,
      faceDetection: {
        faces_detected: results.length,
        matches: matches
      }
    };

    downloadReport(reportData, "PDF");
  };

  const handleSendToAdmin = async () => {
    if (!results || !selectedFile) return;
    setIsSendingToAdmin(true);

    try {
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const user = userStr ? JSON.parse(userStr) : { name: "Forensic Analyst", email: "analyst@evicheck.com" };

      const existingNotifications = JSON.parse(
        localStorage.getItem('adminNotifications') || '[]'
      );

      const matches = results.map((res) => ({
        face_number: res.face_index + 1,
        match_found: res.matched,
        face_image_base64: preview || "",
        match_info: res.matched && res.person ? {
          person_name: res.person.full_name,
          distance: 1 - (res.confidence || 0) / 100,
          original_image_base64: res.person.registered_images?.[0] 
            ? getImageUrl(res.person.registered_images[0])
            : "",
          metadata: {
            age: res.person.age ? `${res.person.age} yrs` : "",
            gender: res.person.gender || "",
            notes: res.person.notes || ""
          }
        } : null
      }));

      const matchedItems = results.filter(r => r.matched);
      const avgConfidence = matchedItems.length > 0
        ? matchedItems.reduce((acc, curr) => acc + (curr.confidence || 0), 0) / matchedItems.length
        : 100;

      const reportData: ReportData = {
        id: `face_rep_${Date.now()}`,
        fileName: `report_faces_${selectedFile.name.replace(/\.[^/.]+$/, "")}_${new Date().toISOString().split("T")[0]}.pdf`,
        evidenceName: selectedFile.name,
        imageData: preview || "",
        generatedDate: new Date().toISOString(),
        generatedBy: {
          name: user.name,
          email: user.email,
        },
        status: matchedItems.length > 0 ? "authentic" : "tampered",
        confidence: avgConfidence,
        faceDetection: {
          faces_detected: results.length,
          matches: matches
        }
      };

      const notification = {
        id: `notif_${Date.now()}`,
        type: 'report',
        title: `New Biometric Report: ${selectedFile.name}`,
        message: `Analyst ${user.name} has generated a new biometric face recognition report for ${selectedFile.name}. Status: ${reportData.status.toUpperCase()} (${avgConfidence.toFixed(1)}% confidence)`,
        reportId: reportData.id,
        reportData: {
          fileName: reportData.fileName,
          evidenceName: reportData.evidenceName,
          status: reportData.status,
          confidence: reportData.confidence,
          generatedDate: reportData.generatedDate,
          generatedBy: user,
          format: "PDF",
        },
        fullReport: JSON.stringify(reportData),
        timestamp: new Date().toISOString(),
        read: false,
      };

      const apiResponse = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notification)
      });

      if (!apiResponse.ok) {
        throw new Error("Failed to send notification to server");
      }

      const updatedNotifications = [notification, ...existingNotifications];
      localStorage.setItem('adminNotifications', JSON.stringify(updatedNotifications));

      window.dispatchEvent(new StorageEvent('storage', {
        key: 'adminNotifications',
        newValue: JSON.stringify(updatedNotifications),
      }));

      setSentToAdmin(true);
      alert("Biometric report successfully sent to the Admin portal!");
    } catch (err) {
      console.error(err);
      alert("Failed to send report to admin.");
    } finally {
      setIsSendingToAdmin(false);
    }
  };

  const getImageUrl = (path: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `${FACE_BACKEND_URL}${path}`;
  };

  const selectedFace = selectedFaceIndex !== null && results ? results[selectedFaceIndex] : null;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
      {/* Upload and Image Viewer Container */}
      <Card className="xl:col-span-8 border-border bg-card/40 backdrop-blur-md shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-border/50 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                <Scan className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">Face Recognition Search</CardTitle>
                <CardDescription>Upload an image to detect and match faces in real time</CardDescription>
              </div>
            </div>
            
            {/* Configurable Threshold Slider */}
            <div className="w-full sm:w-48 space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <Label className="text-muted-foreground">Similarity Threshold</Label>
                <span className="text-primary font-bold">{Math.round(threshold * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 flex flex-col items-center justify-center min-h-[450px]">
          <AnimatePresence mode="wait">
            {!preview ? (
              /* Drag & Drop Upload Zone */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); handleFileSelect(e.dataTransfer.files); }}
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border/80 hover:border-primary/50 transition-all duration-200 rounded-2xl p-16 flex flex-col items-center justify-center gap-4 cursor-pointer bg-background/20 hover:bg-background/40 group max-w-2xl"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                />
                <div className="p-5 rounded-full bg-primary/5 text-primary group-hover:scale-110 transition-transform duration-200 border border-primary/10">
                  <Upload className="h-7 w-7" />
                </div>
                <div className="text-center">
                  <p className="text-base font-bold text-foreground">Drag & drop search image here</p>
                  <p className="text-sm text-muted-foreground mt-1">or click to choose file</p>
                </div>
                <p className="text-xs text-muted-foreground">Supports JPG, JPEG, PNG, and WEBP formats up to 10MB</p>
              </motion.div>
            ) : (
              /* Active Image View & Overlays */
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="w-full flex flex-col items-center gap-6"
              >
                <div 
                  ref={containerRef}
                  className="relative rounded-2xl border border-border shadow-md overflow-hidden bg-muted/30 max-w-full select-none"
                >
                  <img
                    ref={imgRef}
                    src={preview}
                    alt="Query"
                    onLoad={updateScaling}
                    className="max-h-[550px] w-auto h-auto object-contain block"
                  />
                  
                  {/* Bounding Box Overlays */}
                  {results && results.map((res, index) => {
                    const [x1, y1, x2, y2] = res.bounding_box;
                    const left = x1 * imgScale.scaleX;
                    const top = y1 * imgScale.scaleY;
                    const width = (x2 - x1) * imgScale.scaleX;
                    const height = (y2 - y1) * imgScale.scaleY;
                    
                    const isSelected = selectedFaceIndex === index;
                    const isMatched = res.matched;
                    
                    return (
                      <div
                        key={index}
                        onClick={() => setSelectedFaceIndex(index)}
                        style={{
                          position: "absolute",
                          left: `${left}px`,
                          top: `${top}px`,
                          width: `${width}px`,
                          height: `${height}px`,
                        }}
                        className={`cursor-pointer transition-all duration-200 ${
                          isMatched 
                            ? "border-2 border-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20" 
                            : "border-2 border-red-500 bg-red-500/10 hover:bg-red-500/20"
                        } ${
                          isSelected 
                            ? "ring-2 ring-white ring-offset-1 ring-offset-background scale-[1.01] z-30 shadow-lg" 
                            : "z-20"
                        }`}
                      >
                        <span className={`absolute -top-6 left-0 px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-sm border ${
                          isMatched 
                            ? "bg-emerald-500 border-emerald-600" 
                            : "bg-red-500 border-red-600"
                        }`}>
                          {isMatched ? `${res.person?.full_name} (${Math.round(res.confidence || 0)}%)` : "Unknown"}
                        </span>
                      </div>
                    );
                  })}
                </div>
                
                {/* Control Actions */}
                <div className="flex gap-4 w-full justify-center max-w-md">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreview(null);
                      setResults(null);
                      setSelectedFaceIndex(null);
                      setSentToAdmin(false);
                    }}
                    className="flex-1 rounded-xl cursor-pointer hover:bg-muted"
                    disabled={isLoading}
                  >
                    Clear Image
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSearch}
                    className="flex-1 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground shadow-md cursor-pointer flex items-center justify-center gap-2"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Running Biometrics...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4" />
                        Recognize Faces
                      </>
                    )}
                  </Button>
                </div>

                {results && (
                  <div className="flex flex-col sm:flex-row gap-3 w-full justify-center max-w-md mt-1 border-t border-border/50 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleDownloadReport}
                      className="flex-1 rounded-xl cursor-pointer hover:bg-muted flex items-center justify-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Generate Report
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSendToAdmin}
                      disabled={isSendingToAdmin || sentToAdmin}
                      className={`flex-1 rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 transition-all ${
                        sentToAdmin 
                          ? "bg-emerald-600 hover:bg-emerald-600/90 text-white" 
                          : "bg-indigo-600 hover:bg-indigo-600/95 text-white"
                      }`}
                    >
                      {isSendingToAdmin ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : sentToAdmin ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Sent
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Send to Admin
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          
          {error && (
            <div className="mt-4 flex items-center gap-3 p-3.5 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive text-sm max-w-2xl w-full">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Detail Panel */}
      <Card className="xl:col-span-4 border-border bg-card/40 backdrop-blur-md shadow-lg rounded-2xl overflow-hidden h-full xl:min-h-[570px] flex flex-col">
        <CardHeader className="border-b border-border/50 pb-5">
          <CardTitle className="text-lg font-bold">Biometric Match Metadata</CardTitle>
          <CardDescription>Select a face in the query image to see matching details</CardDescription>
        </CardHeader>
        
        <CardContent className="p-6 flex-1 flex flex-col justify-between">
          <AnimatePresence mode="wait">
            {!results ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center text-center p-8 space-y-4 my-auto"
              >
                <div className="p-4 rounded-full bg-muted/40 text-muted-foreground border border-border/50">
                  <User className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Waiting for analysis</p>
                  <p className="text-xs text-muted-foreground mt-1">Upload and scan an image containing faces to extract biometrics</p>
                </div>
              </motion.div>
            ) : selectedFace ? (
              <motion.div
                key={selectedFaceIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 flex-1 flex flex-col justify-between"
              >
                {/* Match Status Header */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs px-2.5 py-0.5 font-bold uppercase tracking-wide bg-muted">
                      Face #{selectedFace.face_index + 1}
                    </Badge>
                    <Badge
                      className={`text-xs px-3 py-1 font-semibold border flex items-center gap-1.5 shadow-sm ${
                        selectedFace.matched
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                      }`}
                    >
                      {selectedFace.matched ? (
                        <>
                          <UserCheck className="h-3.5 w-3.5" />
                          Matched ({selectedFace.confidence}%)
                        </>
                      ) : (
                        <>
                          <UserX className="h-3.5 w-3.5" />
                          Unknown Subject
                        </>
                      )}
                    </Badge>
                  </div>

                  {/* Profile Metadata */}
                  {selectedFace.matched && selectedFace.person ? (
                    <div className="space-y-4 border-t border-border/50 pt-4">
                      <div>
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Subject Name</Label>
                        <p className="text-lg font-bold text-foreground">{selectedFace.person.full_name}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Case File</Label>
                          <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground mt-0.5">
                            <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="truncate">{selectedFace.person.case_number || "Unspecified"}</span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Age / Gender</Label>
                          <p className="text-sm font-semibold text-foreground mt-0.5">
                            {selectedFace.person.age ? `${selectedFace.person.age} yrs` : "Unknown"} / {selectedFace.person.gender || "Unknown"}
                          </p>
                        </div>
                      </div>

                      <div>
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Registered At</Label>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{new Date(selectedFace.person.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Forensic & Case Notes</Label>
                        <p className="text-xs text-muted-foreground leading-relaxed bg-background/30 rounded-xl p-3 border border-border mt-1">
                          {selectedFace.person.notes || "No additional notes registered."}
                        </p>
                      </div>

                      {/* Registered Reference Photos */}
                      {selectedFace.person.registered_images && selectedFace.person.registered_images.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Database References ({selectedFace.person.registered_images.length})</Label>
                          <div className="grid grid-cols-3 gap-2">
                            {selectedFace.person.registered_images.map((imgUrl, i) => (
                              <div key={i} className="aspect-square rounded-lg overflow-hidden border border-border bg-muted/40 shadow-sm">
                                <img
                                  src={getImageUrl(imgUrl)}
                                  alt="Database Profile Reference"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Unknown Face info */
                    <div className="space-y-4 border-t border-border/50 pt-4 my-auto py-12 flex flex-col items-center justify-center text-center">
                      <div className="p-3.5 rounded-full bg-red-500/5 text-red-500 border border-red-500/10">
                        <ShieldAlert className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">No Database Matches Found</p>
                        <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
                          This face did not yield matching records in pgvector search above {Math.round(threshold * 100)}% similarity.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Upload,
  UserPlus,
  Trash2,
  Loader2,
  CheckCircle,
  AlertCircle,
  FileImage,
  Sparkles,
} from "lucide-react";

export default function FaceRecognitionRegister() {
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [caseNumber, setCaseNumber] = useState("");
  const [notes, setNotes] = useState("");
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [successData, setSuccessData] = useState<{ personId: string; embeddingsCreated: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [existingCases, setExistingCases] = useState<string[]>([]);

  useEffect(() => {
    const fetchExistingCases = async () => {
      try {
        const [casesRes, evidenceRes] = await Promise.all([
          fetch("/api/cases").then(r => r.ok ? r.json() : { cases: [] }),
          fetch("/api/evidence").then(r => r.ok ? r.json() : { evidence: [] })
        ]);

        const caseNumbers = new Set<string>();
        
        if (casesRes.cases && Array.isArray(casesRes.cases)) {
          casesRes.cases.forEach((c: any) => {
            if (c.caseNumber && c.caseNumber.trim()) {
              caseNumbers.add(c.caseNumber.trim());
            }
          });
        }

        if (evidenceRes.evidence && Array.isArray(evidenceRes.evidence)) {
          evidenceRes.evidence.forEach((e: any) => {
            if (e.caseNumber && e.caseNumber.trim()) {
              caseNumbers.add(e.caseNumber.trim());
            }
          });
        }

        setExistingCases(Array.from(caseNumbers));
      } catch (err) {
        console.error("Error loading existing cases:", err);
      }
    };

    fetchExistingCases();
  }, []);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;
    setError(null);
    setSuccessData(null);

    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    Array.from(files).forEach((file) => {
      const isImg = file.type.startsWith("image/");
      const ext = file.name.split('.').pop()?.toLowerCase();
      const isValidExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext || '');

      if (!isImg || !isValidExt) {
        setError("Only JPG, JPEG, PNG and WEBP formats are supported.");
        return;
      }

      validFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    });

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    setPreviews((prev) => [...prev, ...newPreviews]);
  }, []);

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      // Revoke URL to prevent memory leaks
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError("Please enter the person's full name.");
      return;
    }
    if (selectedFiles.length === 0) {
      setError("Please upload at least one reference photo.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessData(null);

    try {
      const formData = new FormData();
      formData.append("full_name", fullName.trim());
      formData.append("gender", gender.trim());
      formData.append("age", age ? parseInt(age).toString() : "");
      formData.append("case_number", caseNumber.trim());
      formData.append("notes", notes.trim());

      selectedFiles.forEach((file) => {
        formData.append("images", file);
      });

      const response = await fetch("/api/faces/register", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to register person.");
      }

      setSuccessData({
        personId: data.person_id,
        embeddingsCreated: data.embeddings_created,
      });
      
      // Clear form
      setFullName("");
      setGender("");
      setAge("");
      setCaseNumber("");
      setNotes("");
      setSelectedFiles([]);
      setPreviews([]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during registration.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Registration Form */}
      <Card className="lg:col-span-7 border-border bg-card/40 backdrop-blur-md shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-border/50 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Register Person</CardTitle>
              <CardDescription>Add a new subject to the biometric database</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          <form onSubmit={handleRegister} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-semibold">Full Name *</Label>
                <Input
                  id="fullName"
                  placeholder="e.g. John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-background/50"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="caseNumber" className="text-sm font-semibold">Case Number</Label>
                <Input
                  id="caseNumber"
                  placeholder="e.g. CASE-2026-0045"
                  value={caseNumber}
                  onChange={(e) => setCaseNumber(e.target.value)}
                  className="bg-background/50"
                />
                {existingCases.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80">Select Existing Case:</Label>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                      {existingCases.map((caseNum) => (
                        <button
                          key={caseNum}
                          type="button"
                          onClick={() => setCaseNumber(caseNum)}
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                            caseNumber === caseNum
                              ? "bg-primary/20 text-primary border-primary/45 shadow-sm scale-95"
                              : "bg-muted/40 hover:bg-muted/80 text-muted-foreground hover:text-foreground border-border/60 hover:scale-105"
                          }`}
                        >
                          {caseNum}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender" className="text-sm font-semibold">Gender</Label>
                <Input
                  id="gender"
                  placeholder="Male, Female, Other"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age" className="text-sm font-semibold">Age</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="Age"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="bg-background/50"
                  min="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-semibold">Additional Metadata / Case Notes</Label>
              <textarea
                id="notes"
                placeholder="Details of the subject, visual marks, or connection to the investigation..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              />
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive text-sm"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              {successData && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-foreground text-sm space-y-2"
                >
                  <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <CheckCircle className="h-5 w-5" />
                    <span>Subject Registered Successfully!</span>
                  </div>
                  <div className="text-xs text-muted-foreground pl-7 space-y-1">
                    <p><strong>Person ID:</strong> {successData.personId}</p>
                    <p><strong>Embeddings Created:</strong> {successData.embeddingsCreated} (From reference photo(s))</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              className="w-full h-11 font-semibold rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Extracting Biometrics & Saving...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Submit Registration
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Photo Upload Area */}
      <Card className="lg:col-span-5 border-border bg-card/40 backdrop-blur-md shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-border/50 pb-5">
          <CardTitle className="text-lg font-bold">Reference Photos</CardTitle>
          <CardDescription>Each photo must contain exactly one face</CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6 space-y-4">
          {/* Drag & Drop Box */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border/80 hover:border-primary/50 transition-colors duration-200 rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer bg-background/30 hover:bg-background/50 group"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
              multiple
              accept="image/jpeg,image/jpg,image/png,image/webp"
            />
            <div className="p-4 rounded-full bg-primary/5 text-primary group-hover:scale-110 transition-transform duration-200 border border-primary/10">
              <Upload className="h-6 w-6" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">Drag & drop files here</p>
              <p className="text-xs text-muted-foreground mt-1">or click to browse from device</p>
            </div>
            <div className="flex gap-2.5 mt-2.5">
              <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-muted">JPG</Badge>
              <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-muted">PNG</Badge>
              <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-muted">WEBP</Badge>
            </div>
          </div>

          {/* Previews List */}
          {previews.length > 0 && (
            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Uploaded Images ({previews.length})</Label>
              <div className="grid grid-cols-3 gap-3">
                {previews.map((preview, index) => (
                  <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-border group shadow-sm bg-muted">
                    <img
                      src={preview}
                      alt={`Reference upload ${index + 1}`}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-200"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(index);
                        }}
                        className="h-8 w-8 rounded-lg shadow-md cursor-pointer hover:bg-destructive/90"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

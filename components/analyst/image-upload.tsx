"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  saveEvidence,
  saveCase,
  getAllCases,
  getEvidenceByCase,
  deleteCase,
  type StoredEvidence,
  type StoredCase,
} from "@/lib/evidence-storage";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  X,
  CheckCircle2,
  Loader2,
  Search,
  ArrowRight,
  ArrowLeft,
  Image as ImageIcon,
  CloudUpload,
  Plus,
  FolderOpen,
  Briefcase,
  Hash,
  FileText,
  Trash2,
} from "lucide-react";

interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  status: "uploading" | "success" | "error";
  progress: number;
  size: string;
  type: string;
  evidenceName: string;
}

interface ImageUploadProps {
  onNavigateToDetect?: () => void;
  preselectedCaseId?: string | null;
}

export default function ImageUpload({ onNavigateToDetect, preselectedCaseId }: ImageUploadProps) {
  const [cases, setCases] = useState<StoredCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<StoredCase | null>(null);
  const [isCreatingCase, setIsCreatingCase] = useState(false);
  const [newCaseNumber, setNewCaseNumber] = useState("");
  const [newCaseName, setNewCaseName] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [evidenceNameInput, setEvidenceNameInput] = useState("");
  const [existingEvidence, setExistingEvidence] = useState<StoredEvidence[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCases(getAllCases());
  }, []);

  useEffect(() => {
    if (preselectedCaseId && cases.length > 0) {
      const foundCase = cases.find((c) => c.id === preselectedCaseId);
      if (foundCase) {
        setSelectedCase(foundCase);
        setUploadedFiles([]); // Clear previous uploads when switching
      }
    }
  }, [preselectedCaseId, cases]);

  useEffect(() => {
    if (selectedCase) {
      setExistingEvidence(getEvidenceByCase(selectedCase.id));
    } else {
      setExistingEvidence([]);
    }
  }, [selectedCase]);

  const refreshCases = () => setCases(getAllCases());

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const handleCreateCase = () => {
    if (!newCaseNumber.trim() || !newCaseName.trim()) return;
    const newCase: StoredCase = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      caseNumber: newCaseNumber.trim(),
      caseName: newCaseName.trim(),
      createdDate: new Date().toISOString(),
    };
    saveCase(newCase);
    refreshCases();
    setSelectedCase(newCase);
    setIsCreatingCase(false);
    setNewCaseNumber("");
    setNewCaseName("");
  };

  const handleDeleteCase = (caseId: string) => {
    if (!confirm("Delete this case and all its evidence?")) return;
    deleteCase(caseId);
    refreshCases();
    if (selectedCase?.id === caseId) setSelectedCase(null);
  };

  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files || !selectedCase) return;

      Array.from(files).forEach((file) => {
        if (!file.type.startsWith("image/")) {
          alert(`${file.name} is not an image file`);
          return;
        }

        const reader = new FileReader();
        const fileId =
          Date.now().toString() + Math.random().toString(36).substr(2, 9);
        const eName = evidenceNameInput.trim() || file.name.replace(/\.[^/.]+$/, "");

        reader.onload = (e) => {
          const preview = e.target?.result as string;
          const newFile: UploadedFile = {
            id: fileId,
            file,
            preview,
            status: "uploading",
            progress: 0,
            size: formatFileSize(file.size),
            type: file.type,
            evidenceName: eName,
          };

          setUploadedFiles((prev) => [...prev, newFile]);

          const evidenceData: StoredEvidence = {
            id: fileId,
            fileName: file.name,
            imageData: preview,
            uploadDate: new Date().toISOString(),
            status: "pending",
            size: formatFileSize(file.size),
            type: file.type,
            caseId: selectedCase.id,
            caseNumber: selectedCase.caseNumber,
            caseName: selectedCase.caseName,
            evidenceName: eName,
          };
          saveEvidence(evidenceData);

          const interval = setInterval(() => {
            setUploadedFiles((prev) =>
              prev.map((f) => {
                if (f.id === fileId) {
                  const newProgress = Math.min(f.progress + 15, 100);
                  if (newProgress === 100) {
                    clearInterval(interval);
                    setTimeout(() => {
                      setUploadedFiles((prev) =>
                        prev.map((f) =>
                          f.id === fileId
                            ? { ...f, status: "success" as const }
                            : f
                        )
                      );
                    }, 400);
                  }
                  return { ...f, progress: newProgress };
                }
                return f;
              })
            );
          }, 150);
        };

        reader.readAsDataURL(file);
      });

      setEvidenceNameInput("");
    },
    [selectedCase, evidenceNameInput]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // ──────── PHASE 1: CASE SELECTION ────────
  if (!selectedCase) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Upload Evidence</h2>
          <p className="text-muted-foreground">
            Select or create a case to begin uploading evidence.
          </p>
        </div>

        {/* New Case Form */}
        <AnimatePresence>
          {isCreatingCase && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-5 space-y-4">
                  <h3 className="font-semibold text-base">Create New Case</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="caseNumber" className="text-xs font-medium flex items-center gap-1.5">
                        <Hash className="h-3.5 w-3.5" /> Case Number
                      </Label>
                      <Input
                        id="caseNumber"
                        placeholder="e.g. CASE-2026-001"
                        value={newCaseNumber}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCaseNumber(e.target.value)}
                        onKeyDown={(e: React.KeyboardEvent) => e.key === "Enter" && handleCreateCase()}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="caseName" className="text-xs font-medium flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5" /> Case Name
                      </Label>
                      <Input
                        id="caseName"
                        placeholder="e.g. Bank Fraud Investigation"
                        value={newCaseName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCaseName(e.target.value)}
                        onKeyDown={(e: React.KeyboardEvent) => e.key === "Enter" && handleCreateCase()}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setIsCreatingCase(false)}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleCreateCase}
                      disabled={!newCaseNumber.trim() || !newCaseName.trim()}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Create Case
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Case Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Add Case Card */}
          {!isCreatingCase && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsCreatingCase(true)}
              className="flex flex-col items-center justify-center gap-3 min-h-[160px] rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-colors cursor-pointer"
            >
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <span className="text-sm font-medium text-primary">New Case</span>
            </motion.button>
          )}

          {/* Existing Cases */}
          {cases.map((c) => {
            const evidenceCount = getEvidenceByCase(c.id).length;
            return (
              <motion.div
                key={c.id}
                whileHover={{ scale: 1.02 }}
                className="group relative"
              >
                <button
                  onClick={() => {
                    setSelectedCase(c);
                    setUploadedFiles([]);
                  }}
                  className="w-full text-left rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all p-5 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FolderOpen className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {evidenceCount} item{evidenceCount !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-mono">{c.caseNumber}</p>
                    <p className="text-sm font-semibold truncate mt-0.5">{c.caseName}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Created {new Date(c.createdDate).toLocaleDateString()}
                  </p>
                </button>

                {/* Delete */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteCase(c.id); }}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 rounded-full bg-destructive/10 hover:bg-destructive/20 flex items-center justify-center"
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </button>
              </motion.div>
            );
          })}
        </div>

        {cases.length === 0 && !isCreatingCase && (
          <div className="text-center py-12 text-muted-foreground">
            <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No cases yet. Create one to start uploading evidence.</p>
          </div>
        )}
      </div>
    );
  }

  // ──────── PHASE 2: EVIDENCE UPLOAD ────────
  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={() => { setSelectedCase(null); setUploadedFiles([]); }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight">Upload Evidence</h2>
              <Badge variant="outline" className="font-mono text-[10px]">
                {selectedCase.caseNumber}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              {selectedCase.caseName}
            </p>
          </div>
        </div>
      </div>

      {/* Evidence Name Input + Upload Area */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="evidenceName" className="text-xs font-medium flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Evidence Label
            <span className="text-muted-foreground font-normal">(optional — defaults to file name)</span>
          </Label>
          <Input
            id="evidenceName"
            placeholder="e.g. Crime Scene Photo 1, CCTV Footage Capture"
            value={evidenceNameInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEvidenceNameInput(e.target.value)}
          />
        </div>

        <Card className="border-2 border-dashed border-border/60 hover:border-primary/50 transition-colors bg-muted/5 overflow-hidden">
          <CardContent className="p-0">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`relative flex flex-col items-center justify-center min-h-[240px] text-center transition-all duration-300 ${isDragging ? "bg-primary/5 scale-[1.01]" : ""
                }`}
            >
              <motion.div
                animate={{ y: isDragging ? -10 : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <div className={`p-4 rounded-full bg-primary/10 mb-4 mx-auto w-fit ${isDragging ? "ring-4 ring-primary/20" : ""}`}>
                  <CloudUpload className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  Drag and drop evidence files
                </h3>
                <p className="text-muted-foreground mb-4 max-w-sm mx-auto text-sm">
                  JPEG, PNG, TIFF, RAW — max 50MB
                </p>
                <div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="hidden"
                    ref={fileInputRef}
                  />
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
                  >
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Browse Files
                  </Button>
                </div>
              </motion.div>

              {isDragging && (
                <div className="absolute inset-0 pointer-events-none border-4 border-primary/20 rounded-lg animate-pulse" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Uploaded Files Grid */}
      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">
                Uploaded Evidence ({uploadedFiles.length})
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {uploadedFiles.map((file) => (
                <motion.div
                  key={file.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  className="group relative bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                    <img
                      src={file.preview}
                      alt={file.file.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />

                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => removeFile(file.id)}
                        className="h-8 w-8 rounded-full"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {file.status === "uploading" && (
                      <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-4">
                        <Loader2 className="h-8 w-8 text-white animate-spin mb-2" />
                        <span className="text-white text-xs font-medium mb-2">
                          Uploading...
                        </span>
                        <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-primary"
                            initial={{ width: 0 }}
                            animate={{ width: `${file.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {file.status === "success" && (
                      <div className="absolute top-2 right-2">
                        <div className="bg-emerald-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center shadow-sm">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          UPLOADED
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-3">
                    <p className="text-sm font-semibold text-foreground truncate" title={file.evidenceName}>
                      {file.evidenceName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate" title={file.file.name}>
                      {file.file.name} • {file.size}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            {uploadedFiles.some((f) => f.status === "success") &&
              onNavigateToDetect && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-5 rounded-xl bg-gradient-to-r from-primary/10 via-background to-background border border-primary/20 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-11 w-11 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Search className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">
                          Ready for Analysis
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {uploadedFiles.filter((f) => f.status === "success").length}{" "}
                          file(s) ready for deepfake detection & metadata analysis.
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={onNavigateToDetect}
                      className="w-full sm:w-auto gap-2 shadow-md"
                    >
                      Proceed to Detection
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Existing Evidence Section */}
      {selectedCase && existingEvidence.length > 0 && (
        <div className="pt-8 border-t border-border mt-8">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold">Existing Evidence in this Case</h3>
            <Badge variant="outline">{existingEvidence.length}</Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {existingEvidence.map((ev) => (
              <Card key={ev.id} className="overflow-hidden group hover:border-primary/50 transition-colors">
                <div className="aspect-square relative bg-muted">
                  {ev.imageData ? (
                    <img src={ev.imageData} alt={ev.fileName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <ImageIcon className="h-8 w-8" />
                    </div>
                  )}
                  {ev.status === 'complete' && (
                    <div className="absolute top-1 right-1 bg-background/80 backdrop-blur-sm rounded-full p-0.5">
                      {ev.result === 'authentic' ?
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> :
                        <X className="h-3.5 w-3.5 text-red-500" />}
                    </div>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-medium truncate" title={ev.evidenceName || ev.fileName}>
                    {ev.evidenceName || ev.fileName}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-muted-foreground truncate">{new Date(ev.uploadDate).toLocaleDateString()}</span>
                    <span className="text-[10px] uppercase font-mono text-muted-foreground">{ev.type.split('/')[1] || 'FILE'}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

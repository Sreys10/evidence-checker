"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Search,
  User,
  CheckCircle2,
  XCircle,
  Loader2,
  ScanFace,
  Mail,
  Phone,
  FileText,
  UserCheck,
  UserX,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { saveEvidence, getAllEvidence, type StoredEvidence } from "@/lib/evidence-storage";

/* ─── Types ─────────────────────────────────────────────────────────── */
interface PersonMetadata {
  name?: string;
  age?: number;
  email?: string;
  phone?: string;
  notes?: string;
  added_by?: { name: string; email: string };
  added_at?: string;
}

interface FaceMatch {
  face_number: number;
  match_found: boolean;
  match_info: {
    identity: string;
    distance: number;
    person_name: string;
    original_image_base64?: string;
    image_url?: string;
    metadata?: PersonMetadata;
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

/* ─── Helpers ────────────────────────────────────────────────────────── */
const dataURLtoFile = async (dataUrl: string, filename: string): Promise<File> => {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type });
};

/** Convert raw distance → human-readable similarity percentage */
const distanceToSimilarity = (distance: number): number =>
  Math.max(0, Math.min(100, Math.round((1 - distance) * 100)));

const similarityColor = (pct: number) => {
  if (pct >= 80) return "text-emerald-500";
  if (pct >= 60) return "text-yellow-500";
  return "text-red-500";
};

const similarityBg = (pct: number) => {
  if (pct >= 80) return "bg-emerald-500/10 border-emerald-500/20";
  if (pct >= 60) return "bg-yellow-500/10 border-yellow-500/20";
  return "bg-red-500/10 border-red-500/20";
};

/* ─── Sub-components ─────────────────────────────────────────────────── */
function SimilarityBar({ pct }: { pct: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs">
        <span className="text-muted-foreground font-medium">Similarity Score</span>
        <span className={`font-bold text-sm ${similarityColor(pct)}`}>{pct}%</span>
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function MatchCard({ match, index }: { match: FaceMatch; index: number }) {
  const isMatched = match.match_found && match.match_info;
  const similarity = isMatched ? distanceToSimilarity(match.match_info!.distance) : 0;

  // Resolve database image URL — prefer CDN URL, then base64
  let dbImgSrc = match.match_info?.image_url || match.match_info?.original_image_base64;
  if (dbImgSrc && !dbImgSrc.startsWith("data:") && !dbImgSrc.startsWith("http")) {
    dbImgSrc = `data:image/jpeg;base64,${dbImgSrc}`;
  }

  const meta = match.match_info?.metadata;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className={`rounded-2xl border overflow-hidden bg-card shadow-sm ${isMatched ? "border-emerald-500/25" : "border-border"}`}
    >
      {/* Header strip */}
      <div className={`px-4 py-2.5 flex items-center justify-between ${isMatched ? "bg-emerald-500/8" : "bg-muted/40"}`}>
        <div className="flex items-center gap-2">
          <ScanFace className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground">Face #{match.face_number}</span>
        </div>
        <Badge
          className={`text-[10px] px-2 py-0.5 gap-1 ${isMatched
            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
            : "bg-muted text-muted-foreground border-border"
          }`}
        >
          {isMatched ? (
            <><UserCheck className="h-3 w-3" /> Match Found</>
          ) : (
            <><UserX className="h-3 w-3" /> No Match</>
          )}
        </Badge>
      </div>

      {/* Face images comparison */}
      <div className="grid grid-cols-2 gap-3 p-4 pb-3">
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-center">Detected</p>
          {match.face_image_base64 ? (
            <img
              src={match.face_image_base64}
              alt={`Detected face ${match.face_number}`}
              className="w-full aspect-square object-cover rounded-xl border border-border"
            />
          ) : (
            <div className="w-full aspect-square bg-muted rounded-xl border border-border flex items-center justify-center">
              <User className="h-8 w-8 text-muted-foreground/40" />
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-center">
            {isMatched ? "Database Match" : "No Match"}
          </p>
          {isMatched && dbImgSrc ? (
            <img
              src={dbImgSrc}
              alt="Database match"
              className="w-full aspect-square object-cover rounded-xl border-2 border-emerald-500/40"
            />
          ) : (
            <div className="w-full aspect-square bg-muted/50 rounded-xl border border-dashed border-border flex flex-col items-center justify-center gap-1">
              <UserX className="h-7 w-7 text-muted-foreground/30" />
              <span className="text-[10px] text-muted-foreground/50">Not found</span>
            </div>
          )}
        </div>
      </div>

      {/* Match details */}
      <div className="px-4 pb-4 space-y-3">
        {isMatched ? (
          <>
            {/* Similarity bar */}
            <SimilarityBar pct={similarity} />

            {/* Person details */}
            <div className={`rounded-xl border p-3 space-y-2 ${similarityBg(similarity)}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Matched Person</p>
              </div>

              <div className="space-y-1.5 text-sm">
                {/* Person ID */}
                <div className="flex items-start gap-2">
                  <User className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[10px] text-muted-foreground">ID</span>
                    <p className="font-semibold text-foreground leading-tight">{match.match_info!.person_name}</p>
                  </div>
                </div>

                {/* Full name */}
                {meta?.name && (
                  <div className="flex items-start gap-2">
                    <UserCheck className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[10px] text-muted-foreground">Full Name</span>
                      <p className="font-medium text-foreground leading-tight">{meta.name}</p>
                    </div>
                  </div>
                )}

                {/* Age */}
                {meta?.age && (
                  <div className="flex items-start gap-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[10px] text-muted-foreground">Age</span>
                      <p className="font-medium text-foreground leading-tight">{meta.age}</p>
                    </div>
                  </div>
                )}

                {/* Email */}
                {meta?.email && (
                  <div className="flex items-start gap-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[10px] text-muted-foreground">Email</span>
                      <p className="font-medium text-foreground leading-tight break-all">{meta.email}</p>
                    </div>
                  </div>
                )}

                {/* Phone */}
                {meta?.phone && (
                  <div className="flex items-start gap-2">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[10px] text-muted-foreground">Phone</span>
                      <p className="font-medium text-foreground leading-tight">{meta.phone}</p>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {meta?.notes && (
                  <div className="flex items-start gap-2">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[10px] text-muted-foreground">Notes</span>
                      <p className="font-medium text-foreground leading-tight text-xs">{meta.notes}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Distance badge */}
              <div className="pt-2 border-t border-current/10 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">Match Distance</span>
                <span className="text-[10px] font-mono font-bold text-foreground">{match.match_info!.distance.toFixed(4)}</span>
              </div>
            </div>

            {/* Added by */}
            {meta?.added_by?.name && (
              <p className="text-[10px] text-muted-foreground text-center">
                Added by <span className="font-medium">{meta.added_by.name}</span>
                {meta.added_at && (
                  <span> · {new Date(meta.added_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                )}
              </p>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 py-3 text-center">
            <UserX className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">
              {match.error
                ? match.error
                : "No matching person found in the database"}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────── */
interface FaceDetectionProps {
  preselectedEvidenceId?: string | null;
  isEmbedded?: boolean;
}

export default function FaceDetection({ preselectedEvidenceId, isEmbedded = false }: FaceDetectionProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Detection logic ── */
  const runDetection = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("detector", "retinaface");
      formData.append("model", "ArcFace");
      formData.append("threshold", "0.5");
      formData.append("database_path", "database/");

      const response = await fetch("/api/face/detect-and-search", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Detection failed");

      setResult(data);

      // Persist face detection result to evidence storage
      if (data.success) {
        const allEvidence = await getAllEvidence();
        const existing = allEvidence.find((e: StoredEvidence) => e.fileName === file.name);
        const faceDetection = { faces_detected: data.faces_detected || 0, matches: data.matches || [] };

        if (!existing) {
          const reader = new FileReader();
          reader.onload = async (e) => {
            await saveEvidence({
              fileName: file.name,
              imageData: e.target?.result as string,
              uploadDate: new Date().toISOString(),
              status: "complete",
              result: null,
              size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
              type: file.type,
              faceDetection,
            });
          };
          reader.readAsDataURL(file);
        } else {
          existing.faceDetection = faceDetection;
          await saveEvidence(existing);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  /* ── Load preselected evidence ── */
  useEffect(() => {
    const load = async () => {
      if (!preselectedEvidenceId) return;
      const all = await getAllEvidence();
      const found = all.find((e: StoredEvidence) => (e.id || (e as any)._id) === preselectedEvidenceId);
      if (found?.imageData) {
        try {
          const file = await dataURLtoFile(found.imageData, found.fileName);
          setSelectedFile(file);
          const reader = new FileReader();
          reader.onload = (e) => setPreview(e.target?.result as string);
          reader.readAsDataURL(file);
          setError(null);
          if (found.faceDetection?.faces_detected !== undefined) {
            setResult({ success: true, faces_detected: found.faceDetection.faces_detected, matches: found.faceDetection.matches });
          } else if (isEmbedded) {
            runDetection(file);
          }
        } catch (e) {
          console.error("Failed to load preselected evidence", e);
        }
      }
    };
    load();
  }, [preselectedEvidenceId, isEmbedded]);

  /* ── File handling ── */
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files?.length) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) { setError("Please select an image file"); return; }
    setSelectedFile(file);
    setError(null);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleClear = () => {
    setSelectedFile(null); setPreview(null); setResult(null); setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* ── Summary stats ── */
  const matchedCount = result?.matches?.filter(m => m.match_found).length ?? 0;
  const unmatchedCount = (result?.faces_detected ?? 0) - matchedCount;

  /* ─── Render ── */
  return (
    <div className="space-y-6">

      {/* Upload panel */}
      <Card className="border border-border/60 overflow-hidden">
        {!isEmbedded && (
          <div className="px-6 pt-5 pb-4 border-b border-border/40">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <ScanFace className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Face Similarity Search</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Upload an image — detected faces are matched against the known-persons database
                </p>
              </div>
            </div>
          </div>
        )}

        <CardContent className="p-5 space-y-4">
          {/* Drop zone */}
          <div
            className={`relative border-2 border-dashed rounded-2xl transition-all duration-200 cursor-pointer
              ${isDragging ? "border-primary bg-primary/5 scale-[1.01]" : preview ? "border-border/50 bg-muted/20" : "border-border/50 hover:border-primary/50 hover:bg-muted/30"}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileSelect(e.dataTransfer.files); }}
            onClick={() => !preview && fileInputRef.current?.click()}
          >
            <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => handleFileSelect(e.target.files)} className="hidden" />

            {preview ? (
              <div className="p-4 space-y-4">
                <div className="flex gap-4 items-start">
                  <img src={preview} alt="Evidence preview" className="h-40 w-auto rounded-xl border border-border object-contain" />
                  <div className="flex-1 space-y-2 pt-1">
                    <p className="text-sm font-semibold text-foreground">{selectedFile?.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : ""}</p>
                    {result && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">
                          {result.faces_detected} face{result.faces_detected !== 1 ? "s" : ""} detected
                        </span>
                        {matchedCount > 0 && (
                          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                            {matchedCount} match{matchedCount !== 1 ? "es" : ""}
                          </span>
                        )}
                        {unmatchedCount > 0 && (
                          <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium">
                            {unmatchedCount} unmatched
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleClear(); }} className="gap-1.5">
                    <XCircle className="h-3.5 w-3.5" /> Clear
                  </Button>
                  <Button
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); runDetection(selectedFile!); }}
                    disabled={isProcessing}
                    className="gap-1.5 flex-1"
                  >
                    {isProcessing ? (
                      <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching database...</>
                    ) : (
                      <><RefreshCw className="h-3.5 w-3.5" /> Re-run Search</>
                    )}
                  </Button>
                  {!result && (
                    <Button
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); runDetection(selectedFile!); }}
                      disabled={isProcessing}
                      className="gap-1.5 flex-1 bg-primary"
                    >
                      {isProcessing ? (
                        <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Processing...</>
                      ) : (
                        <><Search className="h-3.5 w-3.5" /> Search Database</>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-12 px-6 text-center space-y-3">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Drop image here or click to upload</p>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP — evidence images with faces</p>
                </div>
              </div>
            )}
          </div>

          {/* Processing state */}
          <AnimatePresence>
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/5 border border-primary/20"
              >
                <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Searching face database...</p>
                  <p className="text-xs text-muted-foreground">Detecting faces → extracting embeddings → comparing against known persons</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-start gap-3 px-4 py-3 rounded-xl bg-destructive/8 border border-destructive/20"
              >
                <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">Detection failed</p>
                  <p className="text-xs text-destructive/80 mt-0.5">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="space-y-4"
          >
            {/* Summary header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-bold text-foreground">Search Results</h3>
                <div className="flex gap-2">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold">
                    {result.faces_detected} detected
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                    {matchedCount} matched
                  </span>
                </div>
              </div>
            </div>

            {result.matches && result.matches.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {result.matches.map((match, i) => (
                  <MatchCard key={match.face_number} match={match} index={i} />
                ))}
              </div>
            ) : (
              <Card className="border border-border/60">
                <CardContent className="py-16 flex flex-col items-center gap-3 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center">
                    <ScanFace className="h-7 w-7 text-muted-foreground/40" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">No faces detected</p>
                    <p className="text-xs text-muted-foreground/70 mt-1 max-w-xs">
                      Make sure the image contains clearly visible faces and try again.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state — no image, no result */}
      {!preview && !result && !isProcessing && (
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <CheckCircle2 className="h-5 w-5 text-muted-foreground/30" />
          <p className="text-xs text-muted-foreground">
            Upload an image above to search for matching faces in the database
          </p>
        </div>
      )}
    </div>
  );
}

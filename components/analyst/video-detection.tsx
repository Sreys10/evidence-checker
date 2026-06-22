"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload, Video, AlertTriangle, CheckCircle2, X, Loader2,
  BarChart3, Film, Info, ShieldCheck, ShieldAlert, RefreshCw, Zap, Image,
  FileText, Download, Send,
} from "lucide-react";
import { updateEvidenceAnalysis, getAllEvidence } from "@/lib/evidence-storage";

interface FrameResult {
  frameIndex: number;
  aiGeneratedScore: number;
}

interface VideoDetectionResult {
  isAiGenerated: boolean;
  verdict: string;
  confidence: number;
  avgAiScore: number;
  maxAiScore: number;
  minAiScore: number;
  totalFrames: number;
  aiGeneratedFrames: number;
  authenticFrames: number;
  frames: FrameResult[];
}

const ACCEPTED_TYPES = "video/mp4,video/webm,video/quicktime,video/x-msvideo,video/mpeg,.mp4,.webm,.mov,.avi,.mpeg,.mpg";
const MAX_SIZE_MB = 200;
const FRAME_COUNT = 10;

// ── Generate and download an HTML forensics report for video detection ──
function generateVideoReport(
  fileName: string,
  result: VideoDetectionResult,
  analyst: { name: string; email: string }
) {
  const now = new Date();
  const formattedDate = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
  const reportId = `VID-${Date.now().toString(36).toUpperCase()}`;
  const statusColor = result.isAiGenerated ? "#ef4444" : "#10b981";
  const verdict = result.verdict.toUpperCase();

  const heatmapBars = result.frames.map((f, i) => {
    const score = f.aiGeneratedScore;
    const color = score > 0.7 ? "#ef4444" : score > 0.5 ? "#f97316" : score > 0.3 ? "#eab308" : "#22c55e";
    return `<div style="display:inline-block;width:24px;height:40px;background:${color};opacity:${(0.3 + score * 0.7).toFixed(2)};border-radius:4px;margin:2px;cursor:default;" title="Frame ${i+1}: ${(score*100).toFixed(1)}% AI"></div>`;
  }).join("");

  const frameRows = result.frames.map((f, i) => {
    const score = f.aiGeneratedScore;
    const color = score > 0.5 ? "#ef4444" : "#10b981";
    return `<tr style="background:${i%2===0?"#f9fafb":"white"}">
      <td style="padding:10px 15px;font-weight:600;">Frame ${i + 1}</td>
      <td style="padding:10px 15px;">${(score * 100).toFixed(2)}%</td>
      <td style="padding:10px 15px;"><span style="background:${color};color:white;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600;">${score > 0.5 ? "AI-Generated" : "Authentic"}</span></td>
    </tr>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Video Forensics Report - ${fileName}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;color:#1f2937;padding:20px;line-height:1.7;}
    .container{max-width:960px;margin:0 auto;background:white;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.1);overflow:hidden;}
    .header{background:linear-gradient(135deg,#1e3a8a 0%,#3b82f6 60%,#6366f1 100%);color:white;padding:50px 40px;text-align:center;}
    .header h1{font-size:32px;font-weight:700;margin-bottom:8px;}
    .header .sub{font-size:17px;opacity:.9;margin-bottom:16px;}
    .header .rid{background:rgba(255,255,255,.2);padding:6px 16px;border-radius:20px;font-size:12px;letter-spacing:.5px;display:inline-block;}
    .content{padding:50px 40px;}
    .section{margin-bottom:48px;}
    .section-title{font-size:24px;font-weight:700;color:#1e3a8a;border-bottom:3px solid #3b82f6;padding-bottom:10px;margin-bottom:24px;}
    .verdict-box{padding:28px;border-radius:12px;border:2px solid ${statusColor};background:${result.isAiGenerated?"#fef2f2":"#f0fdf4"};margin-bottom:24px;}
    .verdict-badge{display:inline-block;padding:12px 28px;background:${statusColor};color:white;border-radius:8px;font-size:20px;font-weight:700;letter-spacing:.5px;margin:12px 0;}
    .conf-bar{height:36px;background:#e5e7eb;border-radius:20px;overflow:hidden;margin:16px 0;}
    .conf-fill{height:100%;width:${result.confidence}%;background:${statusColor};display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:15px;}
    .stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin:24px 0;}
    .stat-card{padding:20px;background:linear-gradient(135deg,#f9fafb,#f3f4f6);border-radius:10px;border-left:5px solid #3b82f6;}
    .stat-card label{display:block;font-size:11px;text-transform:uppercase;color:#6b7280;font-weight:700;letter-spacing:1px;margin-bottom:8px;}
    .stat-card value{display:block;font-size:24px;font-weight:700;color:#1f2937;}
    .score-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin:20px 0;}
    .score-card{padding:24px;border-radius:10px;text-align:center;color:white;}
    .score-card label{display:block;font-size:12px;opacity:.9;margin-bottom:8px;font-weight:600;}
    .score-card value{display:block;font-size:34px;font-weight:700;}
    .score-card .interp{font-size:11px;opacity:.9;margin-top:6px;}
    table{width:100%;border-collapse:collapse;margin-top:16px;}
    th{background:#3b82f6;color:white;padding:12px 15px;text-align:left;font-size:13px;font-weight:600;}
    .footer{background:linear-gradient(135deg,#1f2937,#374151);color:white;padding:36px 40px;text-align:center;border-top:4px solid #3b82f6;}
    .footer p{margin:6px 0;opacity:.9;}
    @media print{body{padding:0;}.no-print{display:none;}}
  </style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>VIDEO FORENSICS ANALYSIS REPORT</h1>
    <p class="sub">AI-Generated Video Detection — Frame-Level Analysis</p>
    <div class="rid">Report ID: ${reportId}</div>
  </div>
  <div class="content">
    <div class="section">
      <div class="verdict-box">
        <h3 style="color:${result.isAiGenerated?"#991b1b":"#166534"};font-size:18px;font-weight:700;margin-bottom:10px;">Executive Summary</h3>
        <p style="color:#374151;font-size:15px;line-height:1.8;margin-bottom:14px;">This digital forensics report presents findings from a frame-level AI-generation analysis of video evidence <strong>${fileName}</strong>. ${FRAME_COUNT} frames were extracted and each independently examined using our image-based AI generation model.</p>
        <div class="verdict-badge">${result.isAiGenerated ? "⚠" : "✓"} VERDICT: ${verdict}</div>
        <div class="conf-bar"><div class="conf-fill">Confidence: ${result.confidence.toFixed(1)}%</div></div>
        <p style="color:#475569;font-size:14px;line-height:1.7;">${result.isAiGenerated
          ? `The analysis identified <strong>${result.aiGeneratedFrames} of ${result.totalFrames}</strong> sampled frames as likely AI-generated. The average AI score of ${(result.avgAiScore*100).toFixed(1)}% exceeds the 50% threshold, indicating the video was likely produced by a generative AI model.`
          : `The analysis found <strong>no significant indicators of AI generation</strong>. Only ${result.aiGeneratedFrames} of ${result.totalFrames} sampled frames scored above the 50% threshold. The average AI score of ${(result.avgAiScore*100).toFixed(1)}% is consistent with authentic video footage.`
        }</p>
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">1. Evidence Information</h2>
      <div class="stats-grid">
        <div class="stat-card"><label>File Name</label><value style="font-size:15px;word-break:break-all;">${fileName}</value></div>
        <div class="stat-card"><label>Report Date</label><value style="font-size:15px;">${formattedDate}</value></div>
        <div class="stat-card"><label>Forensic Analyst</label><value style="font-size:15px;">${analyst.name}</value></div>
        <div class="stat-card"><label>Analyst Contact</label><value style="font-size:15px;">${analyst.email}</value></div>
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">2. Detection Statistics</h2>
      <div class="stats-grid">
        <div class="stat-card" style="border-color:#3b82f6;"><label>Frames Sampled</label><value>${result.totalFrames}</value></div>
        <div class="stat-card" style="border-color:#ef4444;"><label>AI-Generated Frames</label><value style="color:#ef4444;">${result.aiGeneratedFrames}</value></div>
        <div class="stat-card" style="border-color:#22c55e;"><label>Authentic Frames</label><value style="color:#22c55e;">${result.authenticFrames}</value></div>
        <div class="stat-card" style="border-color:#f97316;"><label>AI Frames Ratio</label><value>${result.totalFrames>0?((result.aiGeneratedFrames/result.totalFrames)*100).toFixed(1):0}%</value></div>
      </div>
      <div class="score-grid">
        <div class="score-card" style="background:${result.avgAiScore>0.5?"linear-gradient(135deg,#ef4444,#dc2626)":"linear-gradient(135deg,#10b981,#059669)"}"><label>Average AI Score</label><value>${(result.avgAiScore*100).toFixed(1)}%</value><div class="interp">${result.avgAiScore>0.5?"Above threshold":"Below threshold"}</div></div>
        <div class="score-card" style="background:${result.maxAiScore>0.7?"linear-gradient(135deg,#ef4444,#dc2626)":result.maxAiScore>0.5?"linear-gradient(135deg,#f97316,#ea580c)":"linear-gradient(135deg,#10b981,#059669)"}"><label>Peak AI Score</label><value>${(result.maxAiScore*100).toFixed(1)}%</value><div class="interp">Highest frame score</div></div>
        <div class="score-card" style="background:linear-gradient(135deg,#3b82f6,#2563eb)"><label>Minimum AI Score</label><value>${(result.minAiScore*100).toFixed(1)}%</value><div class="interp">Lowest frame score</div></div>
        <div class="score-card" style="background:linear-gradient(135deg,#6366f1,#4f46e5)"><label>Analysis Confidence</label><value>${result.confidence.toFixed(1)}%</value><div class="interp">${result.isAiGenerated?"AI-Generated":"Authentic"}</div></div>
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">3. Frame Heatmap</h2>
      <p style="color:#4b5563;margin-bottom:16px;font-size:14px;">Visual representation of AI probability per sampled frame. Hover over each bar to see the exact score.</p>
      <div style="background:#f9fafb;padding:20px;border-radius:10px;border:1px solid #e5e7eb;">
        ${heatmapBars}
        <div style="margin-top:16px;display:flex;gap:16px;font-size:12px;color:#6b7280;">
          <span>🟢 Authentic (&lt;30%)</span>
          <span>🟡 Uncertain (30–50%)</span>
          <span>🟠 Likely AI (50–70%)</span>
          <span>🔴 AI-Generated (&gt;70%)</span>
        </div>
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">4. Per-Frame Analysis</h2>
      <table>
        <thead><tr><th>Frame</th><th>AI Score</th><th>Classification</th></tr></thead>
        <tbody>${frameRows}</tbody>
      </table>
    </div>

    <div class="section">
      <h2 class="section-title">5. Methodology</h2>
      <div style="background:#fef3c7;border:2px solid #fbbf24;border-radius:10px;padding:24px;">
        <h4 style="color:#92400e;margin-bottom:12px;font-weight:700;">Analysis Techniques Applied</h4>
        <ul style="margin-left:20px;color:#78350f;">
          <li style="margin:8px 0;"><strong>Frame Extraction:</strong> ${FRAME_COUNT} frames were evenly sampled across the video timeline using browser Canvas API.</li>
          <li style="margin:8px 0;"><strong>Per-Frame AI Detection:</strong> Each frame was independently analyzed using our <code>genai</code> model — a pixel-based detector targeting all major AI video generators (Sora, Veo, Runway, Pika, Kling, etc.).</li>
          <li style="margin:8px 0;"><strong>Score Aggregation:</strong> Individual frame scores were averaged to produce the overall AI probability. Verdict threshold is 0.5 (50%).</li>
          <li style="margin:8px 0;"><strong>Detection Basis:</strong> Analysis is purely pixel-based — metadata stripping has no effect on results.</li>
        </ul>
      </div>
    </div>
  </div>
  <div class="footer">
    <p><strong>EviCheck Digital Forensics Platform</strong></p>
    <p>Report generated by ${analyst.name} &lt;${analyst.email}&gt;</p>
    <p>Generated: ${formattedDate} · Report ID: ${reportId}</p>
    <p style="margin-top:12px;font-size:12px;opacity:.7;">This report is generated automatically. Results should be reviewed by a qualified forensic analyst before use in legal proceedings.</p>
  </div>
</div>
</body></html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `VideoForensics_${fileName.replace(/[^a-z0-9]/gi, "_")}_${now.toISOString().split("T")[0]}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

// Format file size helper
function formatSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Extract N evenly-spaced frames from a video element via Canvas
async function extractFrames(videoEl: HTMLVideoElement, count: number): Promise<Blob[]> {
  return new Promise((resolve, reject) => {
    const duration = videoEl.duration;
    if (!duration || isNaN(duration)) {
      reject(new Error("Could not determine video duration."));
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 180;
    const ctx = canvas.getContext("2d");
    if (!ctx) { reject(new Error("Canvas not supported.")); return; }

    const blobs: Blob[] = [];
    let current = 0;
    let seekTimeout: NodeJS.Timeout;

    const interval = duration / (count + 1);

    const captureNext = () => {
      if (current >= count) {
        videoEl.onseeked = null;
        resolve(blobs);
        return;
      }
      const seekTime = interval * (current + 1);
      
      // 4-second timeout per seek to prevent hanging on corrupted frames
      seekTimeout = setTimeout(() => {
        console.warn(`Seek to ${seekTime}s timed out.`);
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) blobs.push(blob);
          current++;
          captureNext();
        }, "image/jpeg", 0.85);
      }, 4000);

      videoEl.currentTime = Math.min(seekTime, duration - 0.1);
    };

    videoEl.onseeked = () => {
      clearTimeout(seekTimeout);
      try {
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (blob) blobs.push(blob);
            current++;
            captureNext();
          },
          "image/jpeg",
          0.85
        );
      } catch (err) {
        console.error("Error drawing frame to canvas:", err);
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) blobs.push(blob);
          current++;
          captureNext();
        }, "image/jpeg", 0.85);
      }
    };

    captureNext();
  });
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span className="font-semibold text-foreground">{(value * 100).toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(value * 100, 100)}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function FrameHeatmap({ frames }: { frames: FrameResult[] }) {
  if (!frames.length) return null;
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Frame-by-frame AI score</p>
      <div className="flex gap-1 flex-wrap">
        {frames.map((frame, i) => {
          const score = frame.aiGeneratedScore;
          const bg =
            score > 0.7 ? "bg-red-500" :
            score > 0.5 ? "bg-orange-400" :
            score > 0.3 ? "bg-yellow-400" :
            "bg-green-500";
          return (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <div
                title={`Frame ${i + 1}: ${(score * 100).toFixed(1)}% AI`}
                className={`h-8 w-6 rounded ${bg} cursor-pointer transition-opacity hover:opacity-100`}
                style={{ opacity: 0.3 + score * 0.7 }}
              />
              <span className="text-[9px] text-muted-foreground">{i + 1}</span>
            </div>
          );
        })}
      </div>
      <div className="flex gap-3 text-[10px] text-muted-foreground mt-1">
        <span className="flex items-center gap-1"><span className="h-2 w-2 bg-green-500 rounded-sm inline-block" />Authentic</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 bg-yellow-400 rounded-sm inline-block" />Uncertain</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 bg-red-500 rounded-sm inline-block" />AI-Generated</span>
      </div>
    </div>
  );
}

interface VideoDetectionProps {
  preselectedEvidenceId?: string | null;
  isEmbedded?: boolean;
  autoStart?: boolean;
  onAnalysisStarted?: () => void;
}

export default function VideoDetection({
  preselectedEvidenceId,
  isEmbedded = false,
  autoStart = false,
  onAnalysisStarted,
}: VideoDetectionProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [result, setResult] = useState<VideoDetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSendingToAdmin, setIsSendingToAdmin] = useState(false);
  const [sentToAdmin, setSentToAdmin] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const getAnalyst = () => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      return { name: u.name || "Analyst", email: u.email || "" };
    } catch { return { name: "Analyst", email: "" }; }
  };

  const handleFile = useCallback((f: File) => {
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File too large. Maximum size is ${MAX_SIZE_MB}MB.`);
      return;
    }
    setFile(f);
    setResult(null);
    setError(null);
    setProgress(0);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleAnalyze = async () => {
    if (!file || !videoRef.current) return;
    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    setProgress(0);

    try {
      // Wait for video metadata to load
      setProgressLabel("Loading video metadata…");
      await new Promise<void>((res, rej) => {
        const v = videoRef.current!;
        if (v.readyState >= 1) { res(); return; }
        v.onloadedmetadata = () => res();
        v.onerror = () => rej(new Error("Failed to load video metadata."));
        setTimeout(() => rej(new Error("Video metadata load timed out.")), 10000);
      });

      // Extract frames
      setProgressLabel("Extracting frames…");
      setProgress(15);
      const frames = await extractFrames(videoRef.current, FRAME_COUNT);
      
      setProgressLabel(`Analyzing frames (0/${FRAME_COUNT})…`);
      setProgress(30);

      let completedCount = 0;
      
      const analyzeFrame = async (blob: Blob, i: number): Promise<FrameResult> => {
        const formData = new FormData();
        formData.append("frame", blob, `frame_${i}.jpg`);
        formData.append("frameIndex", i.toString());

        const res = await fetch("/api/video-detection", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Failed to analyze frame ${i + 1}`);
        }

        const data = await res.json();
        completedCount++;
        const currentProgress = Math.min(30 + Math.floor((70 * completedCount) / FRAME_COUNT), 99);
        setProgress(currentProgress);
        setProgressLabel(`Analyzing frames (${completedCount}/${FRAME_COUNT})…`);

        return {
          frameIndex: i,
          aiGeneratedScore: data.aiGeneratedScore ?? 0,
        };
      };

      // Run analysis for all frames in parallel (Cloud AI is very fast)
      const resultsArray = await Promise.all(
        frames.map((blob, i) => analyzeFrame(blob, i))
      );

      // Sort chronological order
      resultsArray.sort((a, b) => a.frameIndex - b.frameIndex);

      // Aggregate results
      const totalFrames = resultsArray.length;
      const aiScores = resultsArray.map(r => r.aiGeneratedScore);
      const avgAiScore = aiScores.reduce((sum, val) => sum + val, 0) / totalFrames;
      const maxAiScore = Math.max(...aiScores);
      const minAiScore = Math.min(...aiScores);

      const aiGeneratedFrames = resultsArray.filter(r => r.aiGeneratedScore > 0.5).length;
      const authenticFrames = totalFrames - aiGeneratedFrames;
      const isAiGenerated = avgAiScore > 0.5;

      const verdict = isAiGenerated
        ? "AI-Generated Video"
        : "Authentic Video";

      const confidence = isAiGenerated ? avgAiScore * 100 : (1 - avgAiScore) * 100;

      const aggregatedResult: VideoDetectionResult = {
        isAiGenerated,
        verdict,
        confidence,
        avgAiScore,
        maxAiScore,
        minAiScore,
        totalFrames,
        aiGeneratedFrames,
        authenticFrames,
        frames: resultsArray,
      };

      setProgress(100);
      setResult(aggregatedResult);

      if (preselectedEvidenceId) {
        await updateEvidenceAnalysis(preselectedEvidenceId, {
          status: 'complete',
          result: isAiGenerated ? 'tampered' : 'authentic',
          confidence: confidence,
          anomalies: [`AI-Generated frames ratio: ${((aiGeneratedFrames / totalFrames) * 100).toFixed(1)}%`],
          aiDetection: aggregatedResult,
        }).catch(err => console.error("Failed to save video analysis results:", err));
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const isRunningRef = useRef(false);

  // Load preselected evidence and handle auto-analysis
  useEffect(() => {
    const loadPreselected = async () => {
      if (preselectedEvidenceId) {
        const all = await getAllEvidence();
        const found = all.find(e => (e.id || (e as any)._id) === preselectedEvidenceId);
        if (found && found.type?.startsWith("video/")) {
          // Set previewUrl to the video image/url directly
          setPreviewUrl(found.imageData);
          // Set dummy file so the UI renders controls
          setFile({ name: found.fileName, size: 0, type: found.type } as any);
          setSentToAdmin(false);

          // If the evidence has already been analyzed, load results from its metadata/aiDetection
          if (found.status === "complete" && found.aiDetection) {
            setResult(found.aiDetection as VideoDetectionResult);
          } else {
            setResult(null);
            
            // Auto start if requested and not running
            if (autoStart && !isRunningRef.current) {
              isRunningRef.current = true;
              if (onAnalysisStarted) onAnalysisStarted();
              setTimeout(() => {
                handleAnalyze();
              }, 500);
            }
          }
        }
      }
    };
    loadPreselected();
  }, [preselectedEvidenceId, autoStart]);

  const handleReset = () => {
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setProgress(0);
    setSentToAdmin(false);
  };

  const handleSendToAdmin = async () => {
    if (!result || !file) return;
    setIsSendingToAdmin(true);
    try {
      const now = new Date();
      const reportId = "RPT-" + Math.random().toString(36).slice(2, 10).toUpperCase();
      const analyst = getAnalyst();

      const notification = {
        id: `notif_${Date.now()}`,
        reportId: reportId,
        type: 'report',
        title: `New Video Report: ${file.name}`,
        message: `Analyst ${analyst.name} has generated a new video verification report for ${file.name}. Verdict: ${result.verdict} (${result.confidence.toFixed(1)}% confidence)`,
        reportData: {
          fileName: file.name,
          evidenceName: file.name,
          status: result.isAiGenerated ? 'tampered' : 'authentic',
          confidence: result.confidence,
          generatedDate: now.toISOString(),
          generatedBy: analyst,
          format: 'HTML',
          isVideo: true,
          videoResult: result,
        },
      };

      // Persist to DB via API (cross-browser, cross-device)
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notification),
      });

      if (!res.ok) {
        throw new Error('Failed to send notification to admin');
      }

      setSentToAdmin(true);
    } catch (err) {
      console.error("Error sending video report to admin:", err);
    } finally {
      setIsSendingToAdmin(false);
    }
  };

  const handleDownloadReport = () => {
    if (!result || !file) return;
    const analyst = getAnalyst();
    generateVideoReport(file.name, result, analyst);
  };

  return (
    <div className={isEmbedded ? "space-y-4" : "max-w-4xl mx-auto space-y-8 p-6"}>
      {!isEmbedded && (
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">AI Video Detection</h1>
          <p className="text-muted-foreground">Upload a video to analyze it for AI-generated artifacts and deepfake markers.</p>
        </div>
      )}

      {/* Upload Zone */}
      {!file && (
        <motion.div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
            isDragging ? "border-primary bg-primary/10 scale-[1.01]" : "border-border bg-muted/20 hover:border-primary/50 hover:bg-primary/5"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
          <div className="flex flex-col items-center gap-4">
            <div className={`h-16 w-16 rounded-2xl flex items-center justify-center transition-all ${isDragging ? "bg-primary/20" : "bg-muted"}`}>
              <Film className={`h-8 w-8 transition-colors ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">{isDragging ? "Drop to upload" : "Upload a video file"}</p>
              <p className="text-sm text-muted-foreground mt-1">Drag & drop or click to browse</p>
              <p className="text-xs text-muted-foreground mt-2">MP4, WebM, MOV, AVI · max {MAX_SIZE_MB}MB</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* File Preview + Controls */}
      {file && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {previewUrl && (
              <video
                  ref={videoRef}
                  src={previewUrl}
                  crossOrigin="anonymous"
                  controls={!isEmbedded}
                  preload="metadata"
                  className={isEmbedded ? "hidden" : "w-full max-h-64 object-contain bg-black rounded-t-xl"}
                />
              )}
              <div className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <Film className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatSize(file.size)} · {file.type || "video"}</p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {!isEmbedded && (
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground" onClick={handleReset} disabled={isAnalyzing}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  <Button onClick={handleAnalyze} disabled={isAnalyzing} className="gap-2 min-w-[140px]">
                    {isAnalyzing ? <><Loader2 className="h-4 w-4 animate-spin" />Analyzing…</> : <><Upload className="h-4 w-4" />Analyze Video</>}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress */}
          {isAnalyzing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-foreground font-medium">
                  <Loader2 className="h-4 w-4 text-primary animate-spin" />
                  {progressLabel}
                </span>
                <span className="text-primary font-bold">{progress}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Extracting {FRAME_COUNT} evenly-spaced frames and checking each for AI generation artifacts…
              </p>
            </motion.div>
          )}

          {/* Error */}
          {error && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive"
            >
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Analysis Failed</p>
                <p className="text-xs mt-0.5 opacity-80">{error}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto shrink-0 text-destructive" onClick={() => setError(null)}>
                <X className="h-3 w-3" />
              </Button>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">

            {/* Verdict Banner */}
            <Card className={`overflow-hidden border-2 ${result.isAiGenerated ? "border-red-500/40 bg-red-500/5" : "border-green-500/40 bg-green-500/5"}`}>
              <CardContent className="p-5">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 ${result.isAiGenerated ? "bg-red-500/15" : "bg-green-500/15"}`}>
                    {result.isAiGenerated ? <ShieldAlert className="h-8 w-8 text-red-500" /> : <ShieldCheck className="h-8 w-8 text-green-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`text-xl font-bold ${result.isAiGenerated ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                        {result.verdict}
                      </h3>
                      <Badge variant="outline" className={`text-xs ${result.isAiGenerated
                        ? "border-red-500/30 text-red-600 dark:text-red-400 bg-red-500/10"
                        : "border-green-500/30 text-green-600 dark:text-green-400 bg-green-500/10"}`}>
                        {result.confidence.toFixed(1)}% confidence
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {result.aiGeneratedFrames} of {result.totalFrames} sampled frames flagged as AI-generated
                    </p>
                  </div>
                  {!isEmbedded && (
                    <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground shrink-0" onClick={handleReset}>
                      <RefreshCw className="h-4 w-4" />New Analysis
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="gap-2 shrink-0" onClick={handleDownloadReport}>
                    <Download className="h-4 w-4" />Download Report
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`gap-2 shrink-0 ${sentToAdmin ? "text-green-600 border-green-500/40 bg-green-500/10" : ""}`}
                    onClick={handleSendToAdmin}
                    disabled={isSendingToAdmin || sentToAdmin}
                  >
                    {isSendingToAdmin ? <Loader2 className="h-4 w-4 animate-spin" /> : sentToAdmin ? <CheckCircle2 className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                    {sentToAdmin ? "Sent" : "Send to Admin"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className={isEmbedded ? "grid grid-cols-2 gap-3" : "grid grid-cols-2 sm:grid-cols-4 gap-3"}>
              {[
                { label: "Frames Sampled", value: result.totalFrames, icon: Film, color: "text-blue-500", bg: "bg-blue-500/10" },
                { label: "AI Frames", value: result.aiGeneratedFrames, icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10" },
                { label: "Auth Frames", value: result.authenticFrames, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
                { label: "Avg AI Score", value: `${(result.avgAiScore * 100).toFixed(1)}%`, icon: BarChart3, color: "text-orange-500", bg: "bg-orange-500/10" },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <Card key={label}>
                  <CardContent className="pt-4 pb-3 px-4">
                    <div className={`h-7 w-7 rounded-lg ${bg} flex items-center justify-center mb-1`}>
                      <Icon className={`h-4 w-4 ${color}`} />
                    </div>
                    <p className="text-xl font-bold text-foreground">{value}</p>
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Score Breakdown + Heatmap */}
            <div className={isEmbedded ? "grid grid-cols-1 gap-4" : "grid grid-cols-1 md:grid-cols-2 gap-4"}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" />Score Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ScoreBar label="Average AI score" value={result.avgAiScore} color={result.avgAiScore > 0.5 ? "bg-red-500" : "bg-green-500"} />
                  <ScoreBar label="Peak AI score" value={result.maxAiScore} color={result.maxAiScore > 0.7 ? "bg-red-500" : result.maxAiScore > 0.5 ? "bg-orange-500" : "bg-green-500"} />
                  <ScoreBar label="Minimum AI score" value={result.minAiScore} color="bg-blue-500" />
                  <div className="pt-2 border-t">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">AI vs Authentic split</span>
                      <span className="font-semibold">{result.totalFrames > 0 ? ((result.aiGeneratedFrames / result.totalFrames) * 100).toFixed(0) : 0}% AI</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden flex">
                      <motion.div className="h-full bg-red-500" initial={{ width: 0 }}
                        animate={{ width: `${result.totalFrames > 0 ? (result.aiGeneratedFrames / result.totalFrames) * 100 : 0}%` }}
                        transition={{ duration: 0.8 }} />
                      <div className="h-full bg-green-500 flex-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2"><Film className="h-4 w-4 text-primary" />Frame Heatmap</CardTitle>
                  <CardDescription className="text-xs">Per-frame AI probability (hover for score)</CardDescription>
                </CardHeader>
                <CardContent>
                  <FrameHeatmap frames={result.frames} />
                </CardContent>
              </Card>
            </div>

            {/* Info */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border text-xs text-muted-foreground">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <p>
                <span className="font-medium text-foreground">{FRAME_COUNT} evenly-spaced frames</span> were extracted from the video and each analyzed independently for AI generation artifacts.
                Scores above 0.5 indicate a likely AI-generated frame. Results are aggregated for the overall verdict.
                Works best on videos under 5 minutes — longer videos are still analyzed but only {FRAME_COUNT} frames are sampled.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

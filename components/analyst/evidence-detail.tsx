"use client";

import { useState, useEffect } from "react";
import {
    ArrowLeft,
    Calendar,
    FileText,
    User,
    Hash,
    Shield,
    FileJson,
    Download,
    Share2,
    Maximize2,
    ZoomIn,
    ZoomOut,
    Eye,
    ChevronLeft,
    Check,
    X,
    Edit2,
    Send,
    AlertTriangle,
    CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card"; // Keep Card for non-embedded parts if needed, but mainly for consistent style
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/custom-tabs";
import { Input } from "@/components/ui/input";
import { getEvidenceByCase, getEvidenceById, renameEvidence, type StoredEvidence } from "@/lib/evidence-storage";
import TamperingDetection from "./tampering-detection";
import VideoDetection from "./video-detection";
import MetadataAnalysis from "./metadata-analysis";
import FaceAnalysis from "./face-analysis";
import WeaponDetection from "./weapon-detection";
import { motion } from "framer-motion";
import { uploadToIPFS } from "@/lib/ipfs-service";
import { connectWallet, storeHashOnBlockchain } from "@/lib/web3-service";
import { saveEvidence } from "@/lib/evidence-storage";
import { Loader2, ShieldCheck, Link as LinkIcon } from "lucide-react";
import { downloadReport, type ReportData } from "@/lib/report-generator";

interface EvidenceDetailProps {
    evidenceId: string;
    initialTab?: string;
    onBack: () => void;
    onAction: (action: 'detect' | 'metadata' | 'face' | 'report', evidenceId: string) => void;
}

export default function EvidenceDetail({ evidenceId, initialTab, onBack, onAction }: EvidenceDetailProps) {
    const [evidence, setEvidence] = useState<StoredEvidence | null>(null);
    const [zoom, setZoom] = useState(1);
    const [isPreserving, setIsPreserving] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [renameValue, setRenameValue] = useState("");
    const [activeTab, setActiveTab] = useState(initialTab || "details");
    const [isAnalyzingBg, setIsAnalyzingBg] = useState(false);
    const [isSendingToAdmin, setIsSendingToAdmin] = useState(false);
    const [sentToAdmin, setSentToAdmin] = useState(false);

    useEffect(() => {
        if (evidence) {
            const notifs = JSON.parse(localStorage.getItem('adminNotifications') || '[]');
            const exists = notifs.some((n: any) => n.reportData?.evidenceName === evidence.fileName || n.title?.includes(evidence.fileName));
            setSentToAdmin(exists);
        }
    }, [evidence]);

    // Background analysis runner for images
    useEffect(() => {
        const runBgAnalysis = async () => {
            if (!evidence || evidence.status === 'complete' || evidence.status === 'failed' || isAnalyzingBg) return;
            if (evidence.type && !evidence.type.startsWith('image/')) return;

            setIsAnalyzingBg(true);

            try {
                // Update local status and database to analyzing
                setEvidence(prev => prev ? { ...prev, status: 'analyzing' as const } : null);
                await fetch(`/api/evidence/${evidence.id || (evidence as any)._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'analyzing' }),
                });

                const file = await dataURLtoFile(evidence.imageData, evidence.fileName);

                const formData = new FormData();
                formData.append('image', file);

                const metadataFormData = new FormData();
                metadataFormData.append('image', file);

                // Call the APIs in parallel
                const [tamperRes, metaRes] = await Promise.all([
                    fetch('/api/detect-tampering', {
                        method: 'POST',
                        body: formData,
                    }).then(async r => {
                        if (!r.ok) {
                            const err = await r.json().catch(() => ({}));
                            throw new Error(err.details || err.error || 'Tampering analysis failed');
                        }
                        return r.json();
                    }),
                    fetch('/api/metadata-analysis', {
                        method: 'POST',
                        body: metadataFormData,
                    }).then(async r => {
                        if (!r.ok) {
                            const err = await r.json().catch(() => ({}));
                            throw new Error(err.error || 'Metadata analysis failed');
                        }
                        return r.json();
                    })
                ]);

                if (tamperRes.success && tamperRes.result) {
                    const isMetadataTampered = metaRes && (metaRes.risk === "HIGH" || metaRes.risk === "CRITICAL" || (metaRes.score && metaRes.score > 7));
                    const resultVal = (tamperRes.result.isTampered || isMetadataTampered) ? "tampered" : "authentic";
                    
                    let confidenceVal = tamperRes.result.confidence;
                    if (isMetadataTampered && !tamperRes.result.isTampered && metaRes) {
                        const metaScore = metaRes.score || 0;
                        confidenceVal = Math.min(100, Math.max(50, (metaScore / 24) * 100));
                    }

                    // Merge anomalies and deduplicate to avoid duplicates
                    const anomalies = Array.from(new Set([
                        ...(tamperRes.result.anomalies || []),
                        ...(metaRes?.metadataFlags?.map((f: any) => f.text) || []),
                        ...(metaRes?.reasons || [])
                    ]));

                    // Merge metadata
                    const metadata = {
                        ...(metaRes || {}),
                        ...(tamperRes.result.metadata || {})
                    };

                    const aiDetection = tamperRes.result.aiDetection;
                    const weaponDetection = tamperRes.result.weaponDetection;

                    const completedUpdates = {
                        status: 'complete' as const,
                        result: resultVal as 'authentic' | 'tampered',
                        confidence: confidenceVal,
                        metadata,
                        anomalies,
                        aiDetection,
                        weaponDetection,
                        analyzedDate: new Date().toISOString(),
                    };

                    setEvidence(prev => prev ? { ...prev, ...completedUpdates } : null);
                    await fetch(`/api/evidence/${evidence.id || (evidence as any)._id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(completedUpdates),
                    });
                }
            } catch (err: any) {
                console.error("Background forensic analysis failed:", err);
                const failedUpdates = {
                    status: 'failed' as const,
                    result: null,
                    confidence: null,
                    anomalies: [err.message || "Forensic analysis failed"],
                    analyzedDate: new Date().toISOString(),
                };
                setEvidence(prev => prev ? { ...prev, ...failedUpdates } : null);
                await fetch(`/api/evidence/${evidence.id || (evidence as any)._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(failedUpdates),
                });
            } finally {
                setIsAnalyzingBg(false);
            }
        };

        if (evidence && evidence.status !== 'complete' && evidence.status !== 'failed') {
            runBgAnalysis();
        }
    }, [evidenceId, evidence?.status]);

    const handleGenerateReportDirect = async () => {
        if (!evidence) return;
        if (evidence.status !== 'complete') {
            alert("Analysis is still in progress. Please wait until the global status is COMPLETE.");
            return;
        }

        // Get current user from localStorage
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : { name: "Forensic Analyst", email: "analyst@evicheck.com" };

        const reportData: ReportData = {
            id: Date.now().toString(),
            fileName: `report_${evidence.fileName.replace(/\.[^/.]+$/, "")}_${new Date().toISOString().split("T")[0]}.pdf`,
            evidenceName: evidence.fileName,
            imageData: evidence.imageData || "",
            generatedDate: new Date().toISOString(),
            generatedBy: {
                name: user.name,
                email: user.email,
            },
            status: evidence.result === "tampered" ? "tampered" : "authentic",
            confidence: evidence.confidence || 0,
            metadata: evidence.metadata,
            anomalies: evidence.anomalies,
            aiDetection: evidence.aiDetection,
            faceDetection: evidence.faceDetection,
            weaponDetection: evidence.weaponDetection,
        };

        // Download as PDF
        downloadReport(reportData, "PDF");

        // Save to generatedReports list in localStorage
        const savedReports = localStorage.getItem('generatedReports');
        let allReports = [];
        if (savedReports) {
            try {
                allReports = JSON.parse(savedReports);
            } catch {
                allReports = [];
            }
        }
        const newReport = {
            ...reportData,
            format: "PDF" as const,
            sentToAdmin: false,
        };
        allReports = [newReport, ...allReports];
        localStorage.setItem('generatedReports', JSON.stringify(allReports));

        // Mark report as generated in DB
        setEvidence(prev => prev ? { ...prev, reportGenerated: true } : null);
        await fetch(`/api/evidence/${evidence.id || (evidence as any)._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reportGenerated: true }),
        });
    };

    const handleSendToAdminDirect = async () => {
        if (!evidence) return;
        if (evidence.status !== 'complete') {
            alert("Analysis is still in progress. Please wait until the global status is COMPLETE.");
            return;
        }

        setIsSendingToAdmin(true);

        try {
            // Get current user from localStorage
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : { name: "Forensic Analyst", email: "analyst@evicheck.com" };

            // Get existing notifications
            const existingNotifications = JSON.parse(
                localStorage.getItem('adminNotifications') || '[]'
            );

            const reportData: ReportData = {
                id: Date.now().toString(),
                fileName: `report_${evidence.fileName.replace(/\.[^/.]+$/, "")}_${new Date().toISOString().split("T")[0]}.pdf`,
                evidenceName: evidence.fileName,
                imageData: evidence.imageData || "",
                generatedDate: new Date().toISOString(),
                generatedBy: {
                    name: user.name,
                    email: user.email,
                },
                status: evidence.result === "tampered" ? "tampered" : "authentic",
                confidence: evidence.confidence || 0,
                metadata: evidence.metadata,
                anomalies: evidence.anomalies,
                aiDetection: evidence.aiDetection,
                faceDetection: evidence.faceDetection,
                weaponDetection: evidence.weaponDetection,
            };

            const notification = {
                id: `notif_${Date.now()}`,
                type: 'report',
                title: `New Report: ${evidence.fileName}`,
                message: `Analyst ${user.name} has generated a new verification report for ${evidence.fileName}. Status: ${evidence.result} (${(evidence.confidence || 0).toFixed(1)}% confidence)`,
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

            // Post notification to Postgres DB
            const apiResponse = await fetch('/api/admin/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(notification)
            });

            if (!apiResponse.ok) {
                const errData = await apiResponse.json().catch(() => ({}));
                throw new Error(errData.error || "Failed to save notification on the server");
            }

            const updatedNotifications = [notification, ...existingNotifications];
            localStorage.setItem('adminNotifications', JSON.stringify(updatedNotifications));

            // Dispatch storage event to alert other tabs (like the admin portal)
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'adminNotifications',
                newValue: JSON.stringify(updatedNotifications),
            }));

            // Mark as sent in state
            setSentToAdmin(true);
            alert("Forensic report successfully sent to the Admin portal!");
        } catch (error) {
            console.error("Error sending report to admin:", error);
            alert("Failed to send report to admin.");
        } finally {
            setIsSendingToAdmin(false);
        }
    };

    const handleRename = async () => {
        if (!renameValue.trim() || !evidence) return;
        const success = await renameEvidence((evidence.id || (evidence as any)._id) as string, renameValue.trim());
        if (success) {
            setEvidence(prev => prev ? { ...prev, evidenceName: renameValue.trim() } : null);
            setIsRenaming(false);
        } else {
            alert("Failed to rename evidence. Please try again.");
        }
    };

    // Helper to convert base64 to File
    const dataURLtoFile = async (dataUrl: string, filename: string): Promise<File> => {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        return new File([blob], filename, { type: blob.type });
    };

    const handlePreserve = async () => {
        if (!evidence) return;
        setIsPreserving(true);
        try {
            // 1. Connect Wallet
            const account = await connectWallet();
            if (!account) throw new Error("Wallet connection failed or rejected");

            // 2. Upload image to local IPFS daemon
            const file = await dataURLtoFile(evidence.imageData, evidence.fileName);
            const ipfsHash = await uploadToIPFS(file);

            // 3. Store IPFS CID on ImageStorage contract
            const receipt = await storeHashOnBlockchain(ipfsHash);

            // 4. Save to local evidence record
            const updates = {
                ipfsHash,
                blockchainHash: receipt.hash,
            };
            setEvidence(prev => prev ? { ...prev, ...updates } : null);
            await fetch(`/api/evidence/${evidence.id || (evidence as any)._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });

            alert(
                `Evidence preserved on blockchain!\nIPFS CID: ${ipfsHash}\nTransaction Hash: ${receipt.hash}`
            );

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error("Preservation Error:", error);
            alert("Preservation failed: " + (error.message || error));
        } finally {
            setIsPreserving(false);
        }
    };

    useEffect(() => {
        const loadEvidence = async () => {
            const found = await getEvidenceById(evidenceId);
            if (found) {
                setEvidence(found);
                setRenameValue(found.evidenceName || found.fileName);
                setActiveTab(initialTab || "details");
            }
        };
        loadEvidence();
    }, [evidenceId, initialTab]);

    if (!evidence) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground animate-pulse">
                <p>Loading evidence details...</p>
                <Button variant="link" onClick={onBack} className="mt-2 text-primary">Return to Records</Button>
            </div>
        );
    }

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = evidence.imageData;
        link.download = evidence.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="h-[calc(100vh-2rem)] flex flex-col gap-4 animate-in fade-in duration-500">
            {/* --- Top Navigation Bar --- */}
            <header className="flex items-center justify-between px-1 pb-4 border-b border-border/40 shrink-0">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-muted/60 transition-colors">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    {isRenaming ? (
                        <div className="flex items-center gap-2">
                            <Input
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleRename();
                                    if (e.key === 'Escape') {
                                        setIsRenaming(false);
                                        setRenameValue(evidence.evidenceName || evidence.fileName);
                                    }
                                }}
                                className="h-8 max-w-xs text-sm font-semibold focus-visible:ring-primary"
                                autoFocus
                            />
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={handleRename}>
                                <Check className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => {
                                setIsRenaming(false);
                                setRenameValue(evidence.evidenceName || evidence.fileName);
                            }}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-3 group/title">
                                {evidence.evidenceName || evidence.fileName}
                                <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover/title:opacity-100 transition-opacity rounded-full" onClick={() => setIsRenaming(true)}>
                                    <Edit2 className="h-3 w-3 text-muted-foreground" />
                                </Button>
                                {evidence.caseNumber && <Badge variant="outline" className="font-mono text-xs">{evidence.caseNumber}</Badge>}
                            </h2>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(evidence.uploadDate).toLocaleDateString()}</span>
                                <span className="w-1 h-1 rounded-full bg-border" />
                                <span className="flex items-center gap-1"><Hash className="h-3 w-3" /> {evidence.size}</span>
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleDownload} className="h-8 gap-2">
                        <Download className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Download File</span>
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleSendToAdminDirect}
                        disabled={evidence.status !== 'complete' || sentToAdmin || isSendingToAdmin}
                        className={`h-8 gap-2 ${sentToAdmin ? "border-green-500 text-green-600 bg-green-50 dark:bg-green-950/20 hover:bg-green-100" : ""}`}
                    >
                        {isSendingToAdmin ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : sentToAdmin ? (
                            <Check className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                            <Send className="h-3.5 w-3.5" />
                        )}
                        <span className="hidden sm:inline">{sentToAdmin ? "Sent to Admin" : "Send to Admin"}</span>
                    </Button>
                    <Button 
                        size="sm" 
                        onClick={handleGenerateReportDirect} 
                        disabled={evidence.status !== 'complete' || isAnalyzingBg}
                        className="h-8 gap-2 ml-2"
                    >
                        <FileText className="h-3.5 w-3.5" />
                        Generate Report
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePreserve}
                        disabled={isPreserving || !!evidence.blockchainHash}
                        className={`h-8 gap-2 ml-2 ${evidence.blockchainHash ? "border-green-500 text-green-600 bg-green-50 hover:bg-green-100" : ""}`}
                    >
                        {isPreserving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                        {evidence.blockchainHash ? "Preserved On-Chain" : "Preserve"}
                    </Button>
                </div>
            </header>

            {/* --- Main Transformation Workspace --- */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">

                {/* Left Panel: Image Visualization (8 Columns) */}
                <div className="lg:col-span-8 flex flex-col bg-muted/10 rounded-xl border border-border/50 overflow-hidden relative group">
                    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Button variant="secondary" size="icon" className="h-8 w-8 shadow-sm" onClick={() => setZoom(z => Math.min(z + 0.1, 3))}>
                            <ZoomIn className="h-4 w-4" />
                        </Button>
                        <Button variant="secondary" size="icon" className="h-8 w-8 shadow-sm" onClick={() => setZoom(z => Math.max(z - 0.1, 0.5))}>
                            <ZoomOut className="h-4 w-4" />
                        </Button>
                        <Button variant="secondary" size="icon" className="h-8 w-8 shadow-sm" onClick={() => setZoom(1)}>
                            <Maximize2 className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="flex-1 overflow-auto flex items-center justify-center p-8 bg-[url('/grid-pattern.svg')] bg-center">
                        {/* Placeholder for grid pattern if missing, fallback to nice gray */}
                        <div className="relative shadow-2xl shadow-black/5 rounded-lg overflow-hidden transition-transform duration-200" style={{ transform: `scale(${zoom})` }}>
                            {evidence.type?.startsWith('video/') ? (
                                <video
                                    src={evidence.imageData}
                                    controls
                                    className="max-h-[70vh] w-full object-contain bg-black"
                                />
                            ) : (
                                <div className="relative overflow-hidden">
                                    <img
                                        src={evidence.imageData}
                                        alt={evidence.fileName}
                                        className="max-h-[70vh] w-auto object-contain"
                                    />
                                    {evidence.status === 'analyzing' && (
                                        <>
                                            {/* Glowing scanline overlay */}
                                            <motion.div 
                                                className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_rgba(34,211,238,0.85),_0_0_5px_rgba(34,211,238,0.5)] z-10"
                                                animate={{ top: ['0%', '100%'] }}
                                                transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                                            />
                                            {/* Holographic tint overlay */}
                                            <div className="absolute inset-0 bg-cyan-500/5 mix-blend-overlay animate-[pulse_1.5s_infinite] pointer-events-none" />
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="absolute bottom-3 left-4 text-xs font-mono text-muted-foreground bg-background/80 backdrop-blur px-2 py-1 rounded border">
                        {evidence.fileName} • {Math.round(zoom * 100)}%
                    </div>
                </div>

                {/* Right Panel: Analysis Tools (4 Columns) */}
                <div className="lg:col-span-4 flex flex-col h-full min-h-0 bg-card rounded-xl border border-border/60 shadow-sm overflow-hidden">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
                        <div className="px-4 pt-4 pb-2 border-b border-border/40 bg-muted/5">
                            <TabsList className={`w-full grid bg-muted/50 p-1 ${evidence.type?.startsWith('video/') ? 'grid-cols-3' : 'grid-cols-4'}`}>
                                <TabsTrigger value="details">Info</TabsTrigger>
                                {evidence.type?.startsWith('video/') ? (
                                    <>
                                        <TabsTrigger value="video">Video AI</TabsTrigger>
                                        <TabsTrigger value="metadata">Meta</TabsTrigger>
                                    </>
                                ) : (
                                    <>
                                        <TabsTrigger value="detect">Tamper</TabsTrigger>
                                        <TabsTrigger value="metadata">Meta</TabsTrigger>
                                        <TabsTrigger value="weapon">Weapon</TabsTrigger>
                                    </>
                                )}
                            </TabsList>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                            {/* Tab Content: Details */}
                            <TabsContent value="details" className="mt-0 h-full">
                                <div className="p-6 space-y-6">
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">File Metadata</h3>
                                        <div className="grid gap-3">
                                            <div className="flex justify-between py-2 border-b border-border/30">
                                                <span className="text-sm text-foreground/70 flex items-center gap-2"><FileText className="h-3.5 w-3.5" /> Full Name</span>
                                                <span className="text-sm font-medium">{evidence.fileName}</span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b border-border/30">
                                                <span className="text-sm text-foreground/70 flex items-center gap-2"><User className="h-3.5 w-3.5" /> Investigating Case</span>
                                                <span className="text-sm font-medium">{evidence.caseName || 'Unassigned'}</span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b border-border/30">
                                                <span className="text-sm text-foreground/70 flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> Date Added</span>
                                                <span className="text-sm font-medium">{new Date(evidence.uploadDate).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {evidence.blockchainHash && (
                                        <div className="p-4 rounded-lg bg-green-50/50 dark:bg-green-900/10 border border-green-100 dark:border-green-800 space-y-2">
                                            <div className="flex items-center gap-2 text-green-700 dark:text-green-300 font-semibold mb-1">
                                                <ShieldCheck className="h-4 w-4" /> Blockchain Verified
                                            </div>
                                            <div className="text-xs text-muted-foreground break-all">
                                                <span className="font-medium text-foreground">Tx:</span> {evidence.blockchainHash}
                                            </div>
                                            {evidence.ipfsHash && (
                                                <div className="text-xs text-muted-foreground break-all">
                                                    <span className="font-medium text-foreground">IPFS:</span> {evidence.ipfsHash}
                                                </div>
                                            )}
                                            <a
                                                href={`http://127.0.0.1:8545`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-xs text-primary flex items-center gap-1 hover:underline mt-1"
                                            >
                                                View on Local Hardhat Node <LinkIcon className="h-3 w-3" />
                                            </a>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Current Analysis Status</h3>
                                        <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm font-medium">Global Status</span>
                                                <Badge variant={
                                                    evidence.status === 'complete' 
                                                        ? 'default' 
                                                        : evidence.status === 'failed' 
                                                            ? 'destructive' 
                                                            : 'secondary'
                                                }>
                                                    {evidence.status.toUpperCase()}
                                                </Badge>
                                            </div>
                                            {evidence.status === 'failed' && (
                                                <div className="mt-4 flex flex-col gap-2 p-3 bg-red-500/10 text-red-600 rounded-lg text-xs border border-red-500/20">
                                                    <div className="flex items-center gap-2 font-semibold">
                                                        <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
                                                        <span>Analysis Failed</span>
                                                    </div>
                                                    <p className="text-foreground/80 mt-1">
                                                        {evidence.anomalies?.[0] || "An unexpected error occurred during forensic checks."}
                                                    </p>
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline" 
                                                        className="mt-2 w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:hover:bg-red-950/20"
                                                        onClick={async () => {
                                                            const resetUpdates = {
                                                                status: 'pending' as const,
                                                                result: null,
                                                                confidence: null,
                                                                anomalies: [],
                                                                metadata: null,
                                                                aiDetection: null,
                                                                weaponDetection: null,
                                                            };
                                                            setEvidence(prev => prev ? { ...prev, ...resetUpdates } : null);
                                                            await fetch(`/api/evidence/${evidence.id || (evidence as any)._id}`, {
                                                                method: 'PUT',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify(resetUpdates),
                                                            });
                                                        }}
                                                    >
                                                        Retry Analysis
                                                    </Button>
                                                </div>
                                            )}
                                            {evidence.result && (
                                                <div className="flex justify-between items-center mt-3 pt-3 border-t border-border/30">
                                                    <span className="text-sm font-medium">Verdict</span>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant={evidence.result === 'authentic' ? 'outline' : 'destructive'}
                                                            className={evidence.result === 'authentic' ? 'text-green-600 border-green-200 bg-green-50' : 'text-red-600 bg-red-50 border-red-200'}>
                                                            {evidence.result?.toUpperCase()}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            )}
                                            {evidence.confidence && (
                                                <div className="mt-2 text-xs text-muted-foreground text-right">
                                                    Confidence Score: {evidence.confidence > 1 ? evidence.confidence.toFixed(1) : (evidence.confidence * 100).toFixed(1)}%
                                                </div>
                                            )}
                                            {evidence.status === 'analyzing' && (
                                                <motion.div 
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ duration: 0.3 }}
                                                    className="mt-4 p-4 rounded-lg bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/25 relative overflow-hidden shadow-sm"
                                                >
                                                    {/* Sliding scanning beam */}
                                                    <motion.div 
                                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent -skew-x-12"
                                                        animate={{ x: ['-100%', '200%'] }}
                                                        transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                                                    />
                                                    
                                                    <div className="flex items-center gap-3 relative z-10">
                                                        <div className="relative flex h-5 w-5 shrink-0 items-center justify-center">
                                                            {/* Pulse rings */}
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                                            <Loader2 className="h-4 w-4 animate-spin text-cyan-500 relative z-10" />
                                                        </div>
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="font-semibold text-xs text-foreground">Forensic Scanning in Progress</span>
                                                            <span className="text-[10px] text-muted-foreground">Running background tampering, ELA/PRNU, and metadata integrity checks...</span>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                            {evidence.status === 'complete' && (
                                                <div className="mt-4 pt-4 border-t border-border/30 space-y-4">
                                                    {/* AI Detection Scores */}
                                                    {evidence.aiDetection && (
                                                        <div className="space-y-2">
                                                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">AI Integrity Check</span>
                                                            <div className="grid grid-cols-2 gap-2 text-[11px] bg-card p-3 rounded-lg border border-border/40">
                                                                <div>
                                                                    <span className="text-muted-foreground">Deepfake Prob:</span>
                                                                    <span className="font-semibold text-foreground ml-1">
                                                                        {((evidence.aiDetection.deepfake || 0) * 100).toFixed(1)}%
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-muted-foreground">AI Content:</span>
                                                                    <span className="font-semibold text-foreground ml-1">
                                                                        {((evidence.aiDetection.aiGenerated || 0) * 100).toFixed(1)}%
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-muted-foreground">Image Quality:</span>
                                                                    <span className="font-semibold text-foreground ml-1">
                                                                        {((evidence.aiDetection.quality || 0) * 100).toFixed(1)}%
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-muted-foreground">Scam Prob:</span>
                                                                    <span className="font-semibold text-foreground ml-1">
                                                                        {((evidence.aiDetection.scamProb || 0) * 100).toFixed(1)}%
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Metadata / Noise Analysis */}
                                                    {evidence.metadata && (evidence.metadata as any).verdict && (
                                                        <div className="space-y-2">
                                                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Metadata & Noise Summary</span>
                                                            <div className="bg-card p-3 rounded-lg border border-border/40 space-y-1.5 text-[11px]">
                                                                <div className="flex justify-between">
                                                                    <span className="text-muted-foreground">Verdict:</span>
                                                                    <span className="font-medium text-foreground">{(evidence.metadata as any).verdict}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-muted-foreground">Risk Level:</span>
                                                                    <span className={`font-semibold ${
                                                                        (evidence.metadata as any).risk === 'CRITICAL' || (evidence.metadata as any).risk === 'HIGH' 
                                                                            ? 'text-red-500' 
                                                                            : (evidence.metadata as any).risk === 'MEDIUM' 
                                                                                ? 'text-amber-500' 
                                                                                : 'text-green-500'
                                                                    }`}>
                                                                        {(evidence.metadata as any).risk}
                                                                    </span>
                                                                </div>
                                                                {(evidence.metadata as any).ela?.performed && (
                                                                    <div className="flex justify-between">
                                                                        <span className="text-muted-foreground">ELA Intensity:</span>
                                                                        <span className="font-medium text-foreground">{(evidence.metadata as any).ela.meanIntensity} (Max 255)</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Anomalies List */}
                                                    <div className="space-y-2">
                                                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Observations & Flags</span>
                                                        {evidence.anomalies && evidence.anomalies.length > 0 ? (
                                                            <ul className="space-y-1.5 bg-card p-3 rounded-lg border border-border/40 max-h-36 overflow-y-auto custom-scrollbar">
                                                                {evidence.anomalies.map((anomaly, idx) => (
                                                                    <li key={idx} className="text-[11px] text-foreground/85 flex items-start gap-1.5 leading-relaxed">
                                                                        <AlertTriangle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
                                                                        <span>{anomaly}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <div className="flex items-start gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-3 rounded-lg text-[11px] leading-relaxed">
                                                                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                                                                <span>No metadata anomalies, editing traces, or deepfake patterns detected. Image is consistent with an original capture.</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-lg bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-300">
                                        <p className="flex items-start gap-2">
                                            <Eye className="h-4 w-4 mt-0.5 shrink-0" />
                                            Active background analysis running. Use the tabs above to switch between different forensic views (Tamper, Meta, Face).
                                        </p>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Tab Content: Video AI */}
                            {evidence.type?.startsWith('video/') && (
                                <TabsContent value="video" className="mt-0 h-full">
                                    <div className="p-4">
                                        <VideoDetection 
                                            preselectedEvidenceId={evidenceId} 
                                            isEmbedded={true} 
                                            autoStart={evidence.status !== 'complete'} 
                                        />
                                    </div>
                                </TabsContent>
                            )}

                            {/* Tab Content: Tampering */}
                            {!evidence.type?.startsWith('video/') && (
                                <TabsContent value="detect" className="mt-0 h-full">
                                    <div className="p-4">
                                        <TamperingDetection 
                                            preselectedEvidenceId={evidenceId} 
                                            isEmbedded={true} 
                                            autoStart={evidence.status !== 'complete'} 
                                        />
                                    </div>
                                </TabsContent>
                            )}

                            {/* Tab Content: Metadata */}
                            <TabsContent value="metadata" className="mt-0 h-full">
                                <div className="p-4">
                                    <MetadataAnalysis preselectedEvidenceId={evidenceId} isEmbedded={true} />
                                </div>
                            </TabsContent>

                            {/* Tab Content: Weapon */}
                            <TabsContent value="weapon" className="mt-0 h-full">
                                <div className="p-4">
                                    <WeaponDetection preselectedEvidenceId={evidenceId} isEmbedded={true} />
                                </div>
                            </TabsContent>


                        </div>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}

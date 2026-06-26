"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scan, UserPlus, Database } from "lucide-react";
import FaceRecognitionSearch from "./face-recognition-search";
import FaceRecognitionRegister from "./face-recognition-register";
import FaceRecognitionDatabase from "./face-recognition-database";

type SubTab = "search" | "register" | "database";

interface FaceAnalysisProps {
    preselectedEvidenceId?: string | null;
    isEmbedded?: boolean;
}

export default function FaceAnalysis({ preselectedEvidenceId, isEmbedded = false }: FaceAnalysisProps) {
    const [subTab, setSubTab] = useState<SubTab>("search");

    const subTabs: { id: SubTab; label: string; icon: React.ElementType; description: string }[] = [
        { id: "search", label: "Face Search", icon: Scan, description: "Detect & recognize multiple faces in evidence" },
        { id: "register", label: "Register Person", icon: UserPlus, description: "Biometric database subject registration" },
        { id: "database", label: "Database Faces", icon: Database, description: "View registered faces in pgvector database" },
    ];

    return (
        <div className="space-y-6">
            {!isEmbedded && (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Face Recognition System</h2>
                        <p className="text-muted-foreground text-sm">
                            Detect multiple faces in evidence images, matching against the pgvector database using InsightFace.
                        </p>
                    </div>

                    {/* Sub-tab segmented control */}
                    <div className="flex items-center p-1 rounded-xl bg-muted/60 border border-border self-start md:self-auto shadow-inner">
                        {subTabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = subTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setSubTab(tab.id)}
                                    className={`relative flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${isActive
                                        ? "text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground/80"
                                        }`}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="face-analysis-tab"
                                            className="absolute inset-0 bg-background border border-border rounded-lg shadow-sm"
                                            transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
                                        />
                                    )}
                                    <span className="relative flex items-center gap-2 z-10">
                                        <Icon className="h-4 w-4" />
                                        {tab.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Active Sub-Tab component */}
            <AnimatePresence mode="wait">
                <motion.div
                  key={subTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                >
                    {subTab === "search" && <FaceRecognitionSearch />}
                    {subTab === "register" && <FaceRecognitionRegister />}
                    {subTab === "database" && <FaceRecognitionDatabase onNavigateToRegister={() => setSubTab("register")} />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

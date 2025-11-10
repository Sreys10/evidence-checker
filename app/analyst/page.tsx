"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileText,
  Search,
  Database,
  Settings,
  LogOut,
  Image as ImageIcon,
  Shield,
  FileCheck,
  History,
  Link as LinkIcon,
} from "lucide-react";
import Link from "next/link";
import ImageUpload from "@/components/analyst/image-upload";
import TamperingDetection from "@/components/analyst/tampering-detection";
import ReportGeneration from "@/components/analyst/report-generation";
import EvidenceRecords from "@/components/analyst/evidence-records";
import BlockchainUpload from "@/components/analyst/blockchain-upload";

type ActiveTab = "upload" | "detect" | "report" | "records" | "blockchain";

export default function AnalystPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("upload");

  const tabs = [
    { id: "upload" as ActiveTab, label: "Upload Evidence", icon: Upload },
    { id: "detect" as ActiveTab, label: "Detect Tampering", icon: Search },
    { id: "report" as ActiveTab, label: "Generate Report", icon: FileText },
    { id: "records" as ActiveTab, label: "Evidence Records", icon: History },
    { id: "blockchain" as ActiveTab, label: "Blockchain Upload", icon: Database },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Analyst Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Upload, analyze, and manage digital evidence
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" asChild>
                <Link href="/">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/login">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Evidence
                </CardTitle>
                <ImageIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">127</div>
                <p className="text-xs text-muted-foreground mt-1">+12 this month</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Verified
                </CardTitle>
                <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">98</div>
                <p className="text-xs text-muted-foreground mt-1">77% success rate</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Reports Generated
                </CardTitle>
                <FileCheck className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">89</div>
                <p className="text-xs text-muted-foreground mt-1">This month</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  On Blockchain
                </CardTitle>
                <LinkIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">76</div>
                <p className="text-xs text-muted-foreground mt-1">Immutable records</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Navigation Tabs */}
        <Card className="mb-6">
          <CardContent className="p-0">
            <div className="flex flex-wrap gap-2 p-4 border-b border-border">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? "default" : "ghost"}
                    onClick={() => setActiveTab(tab.id)}
                    className="flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Content Area */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === "upload" && <ImageUpload />}
          {activeTab === "detect" && <TamperingDetection />}
          {activeTab === "report" && <ReportGeneration />}
          {activeTab === "records" && <EvidenceRecords />}
          {activeTab === "blockchain" && <BlockchainUpload />}
        </motion.div>
      </div>
    </div>
  );
}


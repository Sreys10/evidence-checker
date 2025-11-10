"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  Printer,
  Mail,
  FileCheck,
  Calendar,
  User,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Send,
  Loader2,
} from "lucide-react";
import { downloadReport, type ReportData } from "@/lib/report-generator";

interface Report {
  id: string;
  fileName: string;
  evidenceName: string;
  generatedDate: string;
  status: "authentic" | "tampered";
  confidence: number;
  format: "PDF" | "DOCX" | "HTML";
  imageData?: string;
  analysis?: {
    pixelAnalysis: number;
    metadataAnalysis: number;
    compressionAnalysis: number;
    overallScore: number;
  };
  metadata?: {
    camera?: string;
    date?: string;
    location?: string;
    software?: string;
  };
  anomalies?: string[];
  sentToAdmin?: boolean;
}

const mockEvidenceData: Record<string, {
  imageData: string;
  analysis: {
    pixelAnalysis: number;
    metadataAnalysis: number;
    compressionAnalysis: number;
    overallScore: number;
  };
  metadata: {
    camera?: string;
    date?: string;
    location?: string;
    software?: string;
  };
  anomalies?: string[];
}> = {
  "evidence_001.jpg": {
    imageData: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Crect fill='%23e5e7eb' width='800' height='600'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%236b7280' font-size='24'%3EEvidence Image 001%3C/text%3E%3C/svg%3E",
    analysis: {
      pixelAnalysis: 96,
      metadataAnalysis: 98,
      compressionAnalysis: 89,
      overallScore: 94.5,
    },
    metadata: {
      camera: "Canon EOS 5D Mark IV",
      date: "2024-01-15 14:30:22",
      location: "New York, USA",
    },
    anomalies: [],
  },
  "evidence_002.png": {
    imageData: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Crect fill='%23fee2e2' width='800' height='600'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23dc2626' font-size='24'%3EEvidence Image 002%3C/text%3E%3C/svg%3E",
    analysis: {
      pixelAnalysis: 72,
      metadataAnalysis: 45,
      compressionAnalysis: 65,
      overallScore: 87.3,
    },
    metadata: {
      camera: "Unknown",
      software: "Adobe Photoshop 2024",
      date: "2024-01-20 10:15:00",
    },
    anomalies: [
      "Inconsistent pixel patterns detected",
      "Metadata mismatch found",
      "Compression artifacts suggest editing",
    ],
  },
  "evidence_003.jpg": {
    imageData: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Crect fill='%23dbeafe' width='800' height='600'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%232563eb' font-size='24'%3EEvidence Image 003%3C/text%3E%3C/svg%3E",
    analysis: {
      pixelAnalysis: 99,
      metadataAnalysis: 97,
      compressionAnalysis: 98,
      overallScore: 98.2,
    },
    metadata: {
      camera: "Nikon D850",
      date: "2024-01-22 09:45:10",
      location: "Los Angeles, USA",
    },
    anomalies: [],
  },
  "evidence_004.tiff": {
    imageData: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Crect fill='%23f3f4f6' width='800' height='600'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%234b5563' font-size='24'%3EEvidence Image 004%3C/text%3E%3C/svg%3E",
    analysis: {
      pixelAnalysis: 88,
      metadataAnalysis: 92,
      compressionAnalysis: 85,
      overallScore: 88.3,
    },
    metadata: {
      camera: "Sony A7R IV",
      date: "2024-01-25 16:20:33",
    },
    anomalies: [],
  },
};

export default function ReportGeneration() {
  const [selectedEvidence, setSelectedEvidence] = useState<string>("");
  const [reportFormat, setReportFormat] = useState<"PDF" | "DOCX" | "HTML">("HTML");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState<string | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    // Load user from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser({ name: user.name, email: user.email });
    }

    // Load saved reports from localStorage
    const savedReports = localStorage.getItem('generatedReports');
    if (savedReports) {
      setReports(JSON.parse(savedReports));
    }
  }, []);

  const saveReports = (newReports: Report[]) => {
    setReports(newReports);
    localStorage.setItem('generatedReports', JSON.stringify(newReports));
  };

  const handleGenerateReport = () => {
    if (!selectedEvidence || !currentUser) return;

    setIsGenerating(true);
    const evidenceData = mockEvidenceData[selectedEvidence];
    
    if (!evidenceData) {
      setIsGenerating(false);
      return;
    }

    // Simulate report generation
    setTimeout(() => {
      const status: "authentic" | "tampered" = evidenceData.anomalies && evidenceData.anomalies.length > 0 ? "tampered" : "authentic";
      const confidence = evidenceData.analysis.overallScore;

      const newReport: Report = {
        id: Date.now().toString(),
        fileName: `report_${selectedEvidence.replace(/\.[^/.]+$/, "")}_${new Date().toISOString().split("T")[0]}.${reportFormat.toLowerCase()}`,
        evidenceName: selectedEvidence,
        generatedDate: new Date().toISOString(),
        status,
        confidence,
        format: reportFormat,
        imageData: evidenceData.imageData,
        analysis: evidenceData.analysis,
        metadata: evidenceData.metadata,
        anomalies: evidenceData.anomalies,
        sentToAdmin: false,
      };

      const updatedReports = [newReport, ...reports];
      saveReports(updatedReports);
      setIsGenerating(false);
      setSelectedEvidence("");
    }, 2000);
  };

  const handleDownload = (reportId: string) => {
    const report = reports.find((r) => r.id === reportId);
    if (!report || !currentUser) return;

    const reportData: ReportData = {
      id: report.id,
      fileName: report.fileName,
      evidenceName: report.evidenceName,
      imageData: report.imageData || "",
      generatedDate: report.generatedDate,
      generatedBy: {
        name: currentUser.name,
        email: currentUser.email,
      },
      status: report.status,
      confidence: report.confidence,
      analysis: report.analysis,
      metadata: report.metadata,
      anomalies: report.anomalies,
    };

    downloadReport(reportData, report.format === "PDF" ? "PDF" : "HTML");
  };

  const handlePrint = (reportId: string) => {
    const report = reports.find((r) => r.id === reportId);
    if (!report || !currentUser) return;

    const reportData: ReportData = {
      id: report.id,
      fileName: report.fileName,
      evidenceName: report.evidenceName,
      imageData: report.imageData || "",
      generatedDate: report.generatedDate,
      generatedBy: {
        name: currentUser.name,
        email: currentUser.email,
      },
      status: report.status,
      confidence: report.confidence,
      analysis: report.analysis,
      metadata: report.metadata,
      anomalies: report.anomalies,
    };

    downloadReport(reportData, "PDF");
  };

  const handleSendToAdmin = async (reportId: string) => {
    const report = reports.find((r) => r.id === reportId);
    if (!report || !currentUser) return;

    setIsSending(reportId);

    try {
      // Get existing notifications
      const existingNotifications = JSON.parse(
        localStorage.getItem('adminNotifications') || '[]'
      );

      const notification = {
        id: `notif_${Date.now()}`,
        type: 'report',
        title: `New Report: ${report.evidenceName}`,
        message: `Analyst ${currentUser.name} has generated a new verification report for ${report.evidenceName}. Status: ${report.status} (${report.confidence.toFixed(1)}% confidence)`,
        reportId: report.id,
        reportData: {
          fileName: report.fileName,
          evidenceName: report.evidenceName,
          status: report.status,
          confidence: report.confidence,
          generatedDate: report.generatedDate,
          generatedBy: currentUser,
        },
        timestamp: new Date().toISOString(),
        read: false,
      };

      const updatedNotifications = [notification, ...existingNotifications];
      localStorage.setItem('adminNotifications', JSON.stringify(updatedNotifications));

      // Update report to mark as sent
      const updatedReports = reports.map((r) =>
        r.id === reportId ? { ...r, sentToAdmin: true } : r
      );
      saveReports(updatedReports);

      // Trigger storage event for admin portal
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'adminNotifications',
        newValue: JSON.stringify(updatedNotifications),
      }));

      setTimeout(() => {
        setIsSending(null);
      }, 1000);
    } catch (error) {
      console.error('Error sending report to admin:', error);
      setIsSending(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Generate New Report */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
          <CardDescription>
            Create a comprehensive verification report for analyzed evidence
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Select Evidence
              </label>
              <select
                value={selectedEvidence}
                onChange={(e) => setSelectedEvidence(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Choose evidence file...</option>
                {Object.keys(mockEvidenceData).map((evidence) => (
                  <option key={evidence} value={evidence}>
                    {evidence}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Report Format
              </label>
              <div className="flex gap-4">
                {(["PDF", "HTML"] as const).map((format) => (
                  <label
                    key={format}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="format"
                      value={format}
                      checked={reportFormat === format}
                      onChange={() => setReportFormat(format)}
                      className="text-primary"
                    />
                    <span className="text-sm text-foreground">{format}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button
              onClick={handleGenerateReport}
              disabled={!selectedEvidence || isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Report...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generated Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Generated Reports</CardTitle>
          <CardDescription>View and manage your generated reports</CardDescription>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No reports generated yet. Create your first report above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <FileText className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-foreground">{report.fileName}</h3>
                        <Badge variant="outline">{report.format}</Badge>
                        {report.status === "authentic" ? (
                          <Badge className="bg-green-500 text-white">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Authentic
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Tampered
                          </Badge>
                        )}
                        {report.sentToAdmin && (
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                            <Mail className="h-3 w-3 mr-1" />
                            Sent to Admin
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="h-4 w-4" />
                          <span>{report.evidenceName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(report.generatedDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileCheck className="h-4 w-4" />
                          <span>{report.confidence.toFixed(1)}% confidence</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4 flex-wrap">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDownload(report.id)}
                        title="Download"
                        className="hover:bg-primary hover:text-primary-foreground"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handlePrint(report.id)}
                        title="Print"
                        className="hover:bg-primary hover:text-primary-foreground"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleSendToAdmin(report.id)}
                        title="Send to Admin"
                        disabled={report.sentToAdmin || isSending === report.id}
                        className="hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
                      >
                        {isSending === report.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

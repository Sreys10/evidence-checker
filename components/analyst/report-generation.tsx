"use client";
import { useState } from "react";
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
} from "lucide-react";

interface Report {
  id: string;
  fileName: string;
  evidenceName: string;
  generatedDate: string;
  status: "authentic" | "tampered";
  confidence: number;
  format: "PDF" | "DOCX" | "HTML";
}

const mockReports: Report[] = [
  {
    id: "1",
    fileName: "report_evidence_001_20240115.pdf",
    evidenceName: "evidence_001.jpg",
    generatedDate: "2024-01-15",
    status: "authentic",
    confidence: 94.5,
    format: "PDF",
  },
  {
    id: "2",
    fileName: "report_evidence_002_20240120.pdf",
    evidenceName: "evidence_002.png",
    generatedDate: "2024-01-20",
    status: "tampered",
    confidence: 87.3,
    format: "PDF",
  },
  {
    id: "3",
    fileName: "report_evidence_003_20240122.docx",
    evidenceName: "evidence_003.jpg",
    generatedDate: "2024-01-22",
    status: "authentic",
    confidence: 98.2,
    format: "DOCX",
  },
];

export default function ReportGeneration() {
  const [selectedEvidence, setSelectedEvidence] = useState<string>("");
  const [reportFormat, setReportFormat] = useState<"PDF" | "DOCX" | "HTML">("PDF");
  const [isGenerating, setIsGenerating] = useState(false);
  const [reports, setReports] = useState<Report[]>(mockReports);

  const handleGenerateReport = () => {
    if (!selectedEvidence) return;

    setIsGenerating(true);
    // Simulate report generation
    setTimeout(() => {
      const newReport: Report = {
        id: Date.now().toString(),
        fileName: `report_${selectedEvidence}_${new Date().toISOString().split("T")[0]}.${reportFormat.toLowerCase()}`,
        evidenceName: selectedEvidence,
        generatedDate: new Date().toISOString().split("T")[0],
        status: Math.random() > 0.5 ? "authentic" : "tampered",
        confidence: 75 + Math.random() * 20,
        format: reportFormat,
      };
      setReports((prev) => [newReport, ...prev]);
      setIsGenerating(false);
      setSelectedEvidence("");
    }, 2000);
  };

  const handleDownload = (reportId: string) => {
    const report = reports.find((r) => r.id === reportId);
    if (report) {
      // Simulate download
      alert(`Downloading ${report.fileName}...`);
    }
  };

  const handlePrint = (reportId: string) => {
    const report = reports.find((r) => r.id === reportId);
    if (report) {
      window.print();
    }
  };

  const handleEmail = (reportId: string) => {
    const report = reports.find((r) => r.id === reportId);
    if (report) {
      alert(`Emailing ${report.fileName}...`);
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
                <option value="evidence_001.jpg">evidence_001.jpg</option>
                <option value="evidence_002.png">evidence_002.png</option>
                <option value="evidence_003.jpg">evidence_003.jpg</option>
                <option value="evidence_004.tiff">evidence_004.tiff</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Report Format
              </label>
              <div className="flex gap-4">
                {(["PDF", "DOCX", "HTML"] as const).map((format) => (
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
                  <FileText className="h-4 w-4 mr-2 animate-pulse" />
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

      {/* Report Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Report Templates</CardTitle>
          <CardDescription>Choose from pre-configured report templates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {["Standard", "Detailed", "Executive Summary"].map((template) => (
              <Card key={template} className="cursor-pointer hover:border-primary transition-colors">
                <CardContent className="p-4">
                  <FileCheck className="h-8 w-8 mb-2 text-primary" />
                  <h3 className="font-semibold text-foreground mb-1">{template}</h3>
                  <p className="text-sm text-muted-foreground">
                    {template === "Standard"
                      ? "Basic verification report"
                      : template === "Detailed"
                      ? "Comprehensive analysis report"
                      : "High-level summary report"}
                  </p>
                </CardContent>
              </Card>
            ))}
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
          <div className="space-y-4">
            {reports.map((report) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-border rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
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
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        <span>{report.evidenceName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{report.generatedDate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileCheck className="h-4 w-4" />
                        <span>{report.confidence.toFixed(1)}% confidence</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDownload(report.id)}
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePrint(report.id)}
                      title="Print"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEmail(report.id)}
                      title="Email"
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  History,
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  Calendar,
  Image as ImageIcon,
  FileText,
  Database,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from "lucide-react";

interface EvidenceRecord {
  id: string;
  fileName: string;
  uploadDate: string;
  analyzedDate: string;
  status: "pending" | "analyzing" | "complete";
  result: "authentic" | "tampered" | null;
  confidence: number | null;
  size: string;
  type: string;
  blockchainHash: string | null;
  reportGenerated: boolean;
}

const mockRecords: EvidenceRecord[] = [
  {
    id: "1",
    fileName: "evidence_001.jpg",
    uploadDate: "2024-01-15 10:30:00",
    analyzedDate: "2024-01-15 10:35:00",
    status: "complete",
    result: "authentic",
    confidence: 94.5,
    size: "2.4 MB",
    type: "image/jpeg",
    blockchainHash: "0x1234...5678",
    reportGenerated: true,
  },
  {
    id: "2",
    fileName: "evidence_002.png",
    uploadDate: "2024-01-20 14:20:00",
    analyzedDate: "2024-01-20 14:25:00",
    status: "complete",
    result: "tampered",
    confidence: 87.3,
    size: "1.8 MB",
    type: "image/png",
    blockchainHash: "0xabcd...efgh",
    reportGenerated: true,
  },
  {
    id: "3",
    fileName: "evidence_003.tiff",
    uploadDate: "2024-01-22 09:15:00",
    analyzedDate: "2024-01-22 09:20:00",
    status: "complete",
    result: "authentic",
    confidence: 98.2,
    size: "5.2 MB",
    type: "image/tiff",
    blockchainHash: null,
    reportGenerated: false,
  },
  {
    id: "4",
    fileName: "evidence_004.jpg",
    uploadDate: "2024-01-23 16:45:00",
    analyzedDate: "2024-01-23 16:50:00",
    status: "analyzing",
    result: null,
    confidence: null,
    size: "3.1 MB",
    type: "image/jpeg",
    blockchainHash: null,
    reportGenerated: false,
  },
];

export default function EvidenceRecords() {
  const [records, setRecords] = useState<EvidenceRecord[]>(mockRecords);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterResult, setFilterResult] = useState<string>("all");

  const filteredRecords = records.filter((record) => {
    const matchesSearch = record.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || record.status === filterStatus;
    const matchesResult = filterResult === "all" || record.result === filterResult;
    return matchesSearch && matchesStatus && matchesResult;
  });

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this evidence record?")) {
      setRecords((prev) => prev.filter((r) => r.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Evidence Records</CardTitle>
          <CardDescription>
            View and manage all uploaded evidence files and their analysis history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search evidence files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="analyzing">Analyzing</option>
              <option value="complete">Complete</option>
            </select>
            <select
              value={filterResult}
              onChange={(e) => setFilterResult(e.target.value)}
              className="px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Results</option>
              <option value="authentic">Authentic</option>
              <option value="tampered">Tampered</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Records List */}
      <div className="space-y-4">
        {filteredRecords.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <History className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No evidence records found</p>
            </CardContent>
          </Card>
        ) : (
          filteredRecords.map((record) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <ImageIcon className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-foreground">{record.fileName}</h3>
                        {record.status === "complete" && record.result && (
                          <>
                            {record.result === "authentic" ? (
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
                          </>
                        )}
                        {record.status === "analyzing" && (
                          <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1 animate-spin" />
                            Analyzing
                          </Badge>
                        )}
                        {record.status === "pending" && (
                          <Badge variant="outline">Pending</Badge>
                        )}
                        {record.reportGenerated && (
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            <FileText className="h-3 w-3 mr-1" />
                            Report Generated
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <div>
                            <p className="text-xs">Uploaded</p>
                            <p className="text-foreground">{record.uploadDate}</p>
                          </div>
                        </div>
                        {record.analyzedDate && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <div>
                              <p className="text-xs">Analyzed</p>
                              <p className="text-foreground">{record.analyzedDate}</p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <FileText className="h-4 w-4" />
                          <div>
                            <p className="text-xs">Size</p>
                            <p className="text-foreground">{record.size}</p>
                          </div>
                        </div>
                        {record.confidence && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <CheckCircle2 className="h-4 w-4" />
                            <div>
                              <p className="text-xs">Confidence</p>
                              <p className="text-foreground">{record.confidence.toFixed(1)}%</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {record.blockchainHash && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <div className="flex items-center gap-2 text-sm">
                            <Database className="h-4 w-4 text-primary" />
                            <span className="text-muted-foreground">Blockchain Hash:</span>
                            <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                              {record.blockchainHash}
                            </code>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button variant="outline" size="icon" title="View">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" title="Download">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(record.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}


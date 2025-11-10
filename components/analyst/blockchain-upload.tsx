"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  Upload,
  CheckCircle2,
  Clock,
  Link as LinkIcon,
  Copy,
  ExternalLink,
  Shield,
  Image as ImageIcon,
} from "lucide-react";

interface BlockchainRecord {
  id: string;
  fileName: string;
  hash: string;
  transactionId: string;
  uploadDate: string;
  status: "pending" | "uploading" | "confirmed" | "failed";
  blockNumber: number | null;
  network: "Ethereum" | "Polygon" | "IPFS";
  gasFee: string | null;
}

const mockBlockchainRecords: BlockchainRecord[] = [
  {
    id: "1",
    fileName: "evidence_001.jpg",
    hash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    transactionId: "0xabcd1234...5678efgh",
    uploadDate: "2024-01-15 10:40:00",
    status: "confirmed",
    blockNumber: 12345678,
    network: "Ethereum",
    gasFee: "0.0023 ETH",
  },
  {
    id: "2",
    fileName: "evidence_002.png",
    hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    transactionId: "0xefgh5678...9012ijkl",
    uploadDate: "2024-01-20 14:30:00",
    status: "confirmed",
    blockNumber: 12345901,
    network: "Polygon",
    gasFee: "0.0001 MATIC",
  },
  {
    id: "3",
    fileName: "evidence_003.tiff",
    hash: "0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba",
    transactionId: "0xmnop3456...7890qrst",
    uploadDate: "2024-01-22 09:25:00",
    status: "uploading",
    blockNumber: null,
    network: "IPFS",
    gasFee: null,
  },
];

export default function BlockchainUpload() {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<"Ethereum" | "Polygon" | "IPFS">("Ethereum");
  const [isUploading, setIsUploading] = useState(false);
  const [records, setRecords] = useState<BlockchainRecord[]>(mockBlockchainRecords);

  const availableFiles = [
    "evidence_001.jpg",
    "evidence_002.png",
    "evidence_003.tiff",
    "evidence_004.jpg",
  ];

  const handleUpload = () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    // Simulate blockchain upload
    setTimeout(() => {
      const newRecords = selectedFiles.map((fileName, index) => ({
        id: Date.now().toString() + index,
        fileName,
        hash: `0x${Math.random().toString(16).substr(2, 64)}`,
        transactionId: `0x${Math.random().toString(16).substr(2, 16)}...${Math.random().toString(16).substr(2, 8)}`,
        uploadDate: new Date().toLocaleString(),
        status: "uploading" as const,
        blockNumber: null,
        network: selectedNetwork,
        gasFee: selectedNetwork === "IPFS" ? null : `0.00${Math.floor(Math.random() * 100)} ${selectedNetwork === "Ethereum" ? "ETH" : "MATIC"}`,
      }));

      setRecords((prev) => [...newRecords, ...prev]);

      // Simulate confirmation after 3 seconds
      setTimeout(() => {
        setRecords((prev) =>
          prev.map((r) =>
            newRecords.some((nr) => nr.id === r.id)
              ? {
                  ...r,
                  status: "confirmed" as const,
                  blockNumber: 12345000 + Math.floor(Math.random() * 1000),
                }
              : r
          )
        );
      }, 3000);

      setIsUploading(false);
      setSelectedFiles([]);
    }, 2000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload to Blockchain</CardTitle>
          <CardDescription>
            Securely store verified evidence on the blockchain for immutable record-keeping
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Select Evidence Files
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto border border-border rounded-lg p-4">
                {availableFiles.map((file) => (
                  <label
                    key={file}
                    className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes(file)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFiles((prev) => [...prev, file]);
                        } else {
                          setSelectedFiles((prev) => prev.filter((f) => f !== file));
                        }
                      }}
                      className="text-primary"
                    />
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{file}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Blockchain Network
              </label>
              <div className="flex gap-4">
                {(["Ethereum", "Polygon", "IPFS"] as const).map((network) => (
                  <label
                    key={network}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="network"
                      value={network}
                      checked={selectedNetwork === network}
                      onChange={() => setSelectedNetwork(network)}
                      className="text-primary"
                    />
                    <span className="text-sm text-foreground">{network}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {selectedNetwork === "Ethereum"
                  ? "Higher security, higher gas fees"
                  : selectedNetwork === "Polygon"
                  ? "Lower gas fees, good security"
                  : "Decentralized storage, no gas fees"}
              </p>
            </div>

            <Button
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || isUploading}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Uploading to Blockchain...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {selectedFiles.length} file(s) to {selectedNetwork}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Blockchain Records */}
      <Card>
        <CardHeader>
          <CardTitle>Blockchain Records</CardTitle>
          <CardDescription>
            View all evidence files stored on the blockchain
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {records.map((record) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-border rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Database className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-foreground">{record.fileName}</h3>
                      <Badge variant="outline">{record.network}</Badge>
                      {record.status === "confirmed" && (
                        <Badge className="bg-green-500 text-white">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Confirmed
                        </Badge>
                      )}
                      {record.status === "uploading" && (
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1 animate-spin" />
                          Uploading
                        </Badge>
                      )}
                      {record.status === "pending" && (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Hash:</span>
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono flex-1 truncate">
                          {record.hash}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(record.hash)}
                          title="Copy hash"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      {record.transactionId && (
                        <div className="flex items-center gap-2">
                          <LinkIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Transaction:</span>
                          <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                            {record.transactionId}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(record.transactionId)}
                            title="Copy transaction ID"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => {
                              const explorerUrl =
                                record.network === "Ethereum"
                                  ? `https://etherscan.io/tx/${record.transactionId}`
                                  : record.network === "Polygon"
                                  ? `https://polygonscan.com/tx/${record.transactionId}`
                                  : `https://ipfs.io/ipfs/${record.hash}`;
                              window.open(explorerUrl, "_blank");
                            }}
                            title="View on explorer"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Upload Date</p>
                          <p className="text-sm text-foreground">{record.uploadDate}</p>
                        </div>
                        {record.blockNumber && (
                          <div>
                            <p className="text-xs text-muted-foreground">Block Number</p>
                            <p className="text-sm text-foreground">{record.blockNumber.toLocaleString()}</p>
                          </div>
                        )}
                        {record.gasFee && (
                          <div>
                            <p className="text-xs text-muted-foreground">Gas Fee</p>
                            <p className="text-sm text-foreground">{record.gasFee}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Blockchain Info */}
      <Card>
        <CardHeader>
          <CardTitle>About Blockchain Storage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Immutable Records:</strong> Once uploaded, evidence
              cannot be altered or deleted, ensuring permanent integrity.
            </p>
            <p>
              <strong className="text-foreground">Transparent Verification:</strong> Anyone can verify
              the authenticity of evidence using the blockchain hash.
            </p>
            <p>
              <strong className="text-foreground">Decentralized Storage:</strong> Evidence is stored
              across multiple nodes, eliminating single points of failure.
            </p>
            <p>
              <strong className="text-foreground">Legal Admissibility:</strong> Blockchain records
              provide cryptographic proof of evidence integrity for legal proceedings.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


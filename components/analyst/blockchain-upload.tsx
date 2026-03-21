"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  Upload,
  CheckCircle2,
  Clock,
  Link as LinkIcon,
  Copy,
  Image as ImageIcon,
  Wallet,
  AlertCircle,
} from "lucide-react";
import { uploadToIPFS } from "@/lib/ipfs-service";
import { connectWallet, storeEvidenceOnBlockchain } from "@/lib/web3-service";

interface BlockchainRecord {
  id: string;
  fileName: string;
  ipfsCid: string;
  txHash: string;
  blockNumber: number;
  walletAddress: string;
  uploadDate: string;
  status: "confirmed" | "uploading" | "failed";
  analystId?: string;
  confidenceScore?: number;
  evidenceStatus?: string;
}

interface BlockchainUploadProps {
  currentUser?: {
    _id?: string;
    id?: string;
    name: string;
    email: string;
    userType: string;
  };
}

export default function BlockchainUpload({ currentUser }: BlockchainUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [records, setRecords] = useState<BlockchainRecord[]>([]);

  // Metadata for blockchain storage
  const [confidence, setConfidence] = useState<number>(100);
  const [isTampered, setIsTampered] = useState<boolean>(false);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleConnectWallet = async () => {
    try {
      setStatusMsg("Connecting wallet…");
      const address = await connectWallet();
      setWalletAddress(address);
      setStatusMsg(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMsg(`❌ Wallet error: ${msg}`);
    }
  };

  // ── Main upload flow ──────────────────────────────────────────────────────

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);

    // Optimistic record while uploading
    const tempId = Date.now().toString();
    const optimistic: BlockchainRecord = {
      id: tempId,
      fileName: selectedFile.name,
      ipfsCid: "—",
      txHash: "—",
      blockNumber: 0,
      walletAddress: walletAddress ?? "—",
      uploadDate: new Date().toLocaleString(),
      status: "uploading",
    };
    setRecords((prev) => [optimistic, ...prev]);

    try {
      // 1. Ensure wallet connected
      let address = walletAddress;
      if (!address) {
        setStatusMsg("Connecting wallet…");
        address = await connectWallet();
        setWalletAddress(address);
      }

      // 2. Upload to local IPFS
      setStatusMsg("Uploading image to IPFS…");
      const cid = await uploadToIPFS(selectedFile);

      // 3. Store CID on ImageStorage contract with enriched metadata
      setStatusMsg("Storing evidence on blockchain…");
      const evStatus = isTampered ? "Tampered" : "Authentic";
      const analystId = currentUser?._id || currentUser?.id || "unknown_analyst";
      
      const receipt = await storeEvidenceOnBlockchain(
        cid,
        analystId,
        confidence,
        evStatus
      );

      // 4. Update record with real data
      const confirmed: BlockchainRecord = {
        id: tempId,
        fileName: selectedFile.name,
        ipfsCid: cid,
        txHash: receipt.hash,
        blockNumber: Number(receipt.blockNumber),
        walletAddress: address,
        uploadDate: new Date().toLocaleString(),
        status: "confirmed",
        analystId,
        confidenceScore: confidence,
        evidenceStatus: evStatus
      };
      setRecords((prev) => prev.map((r) => (r.id === tempId ? confirmed : r)));
      setStatusMsg("✅ Successfully stored on blockchain!");
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setRecords((prev) =>
        prev.map((r) =>
          r.id === tempId ? { ...r, status: "failed" as const } : r
        )
      );
      setStatusMsg(`❌ Upload failed: ${msg}`);
    } finally {
      setIsUploading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Wallet + Upload Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Image to IPFS &amp; Blockchain</CardTitle>
          <CardDescription>
            Uploads your image to a local IPFS node, then stores the CID on the
            ImageStorage smart contract via MetaMask.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Wallet */}
          <div className="flex items-center gap-3">
            {walletAddress ? (
              <Badge variant="outline" className="gap-1 py-1 px-3 font-mono text-xs">
                <Wallet className="h-3 w-3" />
                {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
              </Badge>
            ) : (
              <Button variant="outline" size="sm" onClick={handleConnectWallet}>
                <Wallet className="h-4 w-4 mr-2" />
                Connect MetaMask
              </Button>
            )}
          </div>

          {/* File picker */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Select Image File
            </label>
            <div
              className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-6 cursor-pointer hover:border-primary/60 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-40 rounded object-contain mb-2"
                />
              ) : (
                <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
              )}
              <p className="text-sm text-muted-foreground">
                {selectedFile
                  ? selectedFile.name
                  : "Click to browse or drop an image here"}
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Metadata Controls */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border border-border/50">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Confidence Score</label>
              <div className="flex items-center gap-3">
                <input 
                  type="range" min="0" max="100" 
                  value={confidence} 
                  onChange={(e) => setConfidence(parseInt(e.target.value))}
                  className="flex-1 h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
                />
                <span className="text-sm font-mono w-8">{confidence}%</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Verification Status</label>
              <div className="flex items-center gap-2">
                <Button 
                  variant={isTampered ? "outline" : "default"} 
                  size="sm" 
                  className="flex-1 h-8 text-xs"
                  onClick={() => setIsTampered(false)}
                > Authentic </Button>
                <Button 
                  variant={isTampered ? "destructive" : "outline"} 
                  size="sm" 
                  className="flex-1 h-8 text-xs"
                  onClick={() => setIsTampered(true)}
                > Tampered </Button>
              </div>
            </div>
          </div>

          {/* Status message */}
          {statusMsg && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-muted-foreground flex items-center gap-2"
            >
              {statusMsg.startsWith("❌") ? (
                <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
              ) : (
                <Clock className="h-4 w-4 animate-spin shrink-0" />
              )}
              {statusMsg}
            </motion.p>
          )}

          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Processing…
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload &amp; Store on Blockchain
              </>
            )}
          </Button>

          {/* Prerequisites note */}
          <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-3">
            <strong>Prerequisites:</strong> Run{" "}
            <code className="bg-muted px-1 rounded">ipfs daemon</code> and{" "}
            <code className="bg-muted px-1 rounded">npx hardhat node</code> in
            separate terminals, deploy the contract with{" "}
            <code className="bg-muted px-1 rounded">
              npx hardhat run scripts/deploy.js --network localhost
            </code>
            , and connect MetaMask to Localhost 8545.
          </p>
        </CardContent>
      </Card>

      {/* Transaction Records */}
      {records.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>On-Chain Records</CardTitle>
            <CardDescription>
              Real transactions stored on the local Hardhat node via ImageStorage
              contract
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {records.map((record) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <Database className="h-5 w-5 text-primary shrink-0" />
                    <span className="font-semibold text-foreground truncate flex-1">
                      {record.fileName}
                    </span>
                    {record.status === "confirmed" && (
                      <Badge className="bg-green-500 text-white gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Confirmed
                      </Badge>
                    )}
                    {record.status === "uploading" && (
                      <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3 animate-spin" />
                        Uploading
                      </Badge>
                    )}
                    {record.status === "failed" && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Failed
                      </Badge>
                    )}
                  </div>

                  {record.status === "confirmed" && (
                    <div className="space-y-2 text-sm">
                      {/* IPFS CID */}
                      <div className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">IPFS CID:</span>
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono flex-1 truncate">
                          {record.ipfsCid}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(record.ipfsCid)}
                          title="Copy CID"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <a
                          href={`https://ipfs.io/ipfs/${record.ipfsCid}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline text-xs"
                        >
                          View
                        </a>
                      </div>

                      {/* Tx Hash */}
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">Tx Hash:</span>
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono flex-1 truncate">
                          {record.txHash}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(record.txHash)}
                          title="Copy tx hash"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Metadata row */}
                      <div className="grid grid-cols-3 gap-4 pt-1 text-xs">
                        <div>
                          <p className="text-muted-foreground">Block</p>
                          <p className="font-medium">
                            {record.blockNumber.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Wallet</p>
                          <p className="font-medium font-mono">
                            {record.walletAddress.slice(0, 8)}…
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Date</p>
                          <p className="font-medium">{record.uploadDate}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* About section */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">1. IPFS Upload:</strong> The
              image file is uploaded to your local IPFS node via the HTTP API
              at{" "}
              <code className="bg-muted px-1 rounded">
                http://127.0.0.1:5001
              </code>
              . IPFS returns a unique content-addressed CID.
            </p>
            <p>
              <strong className="text-foreground">2. On-Chain Storage:</strong>{" "}
              The CID is sent to the{" "}
              <code className="bg-muted px-1 rounded">storeHash()</code>{" "}
              function of the <code className="bg-muted px-1 rounded">ImageStorage</code>{" "}
              Solidity contract running on the local Hardhat blockchain node.
            </p>
            <p>
              <strong className="text-foreground">3. Immutable Reference:</strong>{" "}
              The transaction is mined and produces a cryptographic hash
              linking the file to the wallet address — providing tamper-proof
              proof of the image at that point in time.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

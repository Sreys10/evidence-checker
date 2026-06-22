"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  CheckCircle2,
  Clock,
  Link as LinkIcon,
  Copy,
  Wallet,
  AlertCircle,
  ShieldCheck,
  ShieldOff,
  BarChart3,
  Layers,
  RefreshCw,
  ExternalLink,
  Hash,
  Calendar,
  FileImage,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { getAllEvidence, getAllCases, type StoredEvidence, type StoredCase } from "@/lib/evidence-storage";

interface BlockchainUploadProps {
  currentUser?: {
    _id?: string;
    id?: string;
    name: string;
    email: string;
    userType: string;
  };
}

interface CaseGroup {
  case: StoredCase;
  preserved: StoredEvidence[];
  unpreserved: StoredEvidence[];
}

const StatCard = ({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  sub?: string;
  color: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35 }}
  >
    <Card className="border border-border/60 bg-card/80 hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              {label}
            </p>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={`p-2.5 rounded-xl bg-current/10 ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

export default function BlockchainUpload({ currentUser }: BlockchainUploadProps) {
  const [allEvidence, setAllEvidence] = useState<StoredEvidence[]>([]);
  const [caseGroups, setCaseGroups] = useState<CaseGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCase, setExpandedCase] = useState<string | null>(null);
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "preserved" | "unpreserved">("all");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [evidence, cases] = await Promise.all([getAllEvidence(), getAllCases()]);
      setAllEvidence(evidence);

      // Group evidence by case
      const groups: CaseGroup[] = cases.map((c) => {
        const caseId = c.id || c._id || "";
        const caseEvidence = evidence.filter(
          (e) => e.caseId === caseId || e.caseName === c.caseName
        );
        return {
          case: c,
          preserved: caseEvidence.filter((e) => !!e.blockchainHash),
          unpreserved: caseEvidence.filter((e) => !e.blockchainHash),
        };
      });

      // Also catch evidence not linked to any known case
      const knownCaseIds = new Set(cases.map((c) => c.id || c._id || ""));
      const knownCaseNames = new Set(cases.map((c) => c.caseName));
      const unlinked = evidence.filter(
        (e) => e.caseId && !knownCaseIds.has(e.caseId) && !knownCaseNames.has(e.caseName || "")
      );
      if (unlinked.length > 0) {
        groups.push({
          case: { caseNumber: "UNLINKED", caseName: "Unlinked Evidence", createdDate: "", id: "__unlinked__" },
          preserved: unlinked.filter((e) => !!e.blockchainHash),
          unpreserved: unlinked.filter((e) => !e.blockchainHash),
        });
      }

      setCaseGroups(groups.filter((g) => g.preserved.length + g.unpreserved.length > 0));
    } catch (err) {
      console.error("Error loading blockchain data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const preserved = allEvidence.filter((e) => !!e.blockchainHash);
  const unpreserved = allEvidence.filter((e) => !e.blockchainHash && e.status === "complete");
  const preservationRate =
    allEvidence.length > 0 ? Math.round((preserved.length / allEvidence.length) * 100) : 0;

  const filteredGroups = caseGroups.map((g) => ({
    ...g,
    displayEvidence:
      activeFilter === "preserved"
        ? g.preserved
        : activeFilter === "unpreserved"
        ? g.unpreserved
        : [...g.preserved, ...g.unpreserved],
  })).filter((g) => g.displayEvidence.length > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Blockchain Preservation Ledger
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Cryptographic on-chain records of preserved forensic evidence
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Row */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border border-border/60">
              <CardContent className="p-5">
                <div className="h-12 bg-muted/50 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={BarChart3}
            label="Total Evidence"
            value={allEvidence.length}
            sub="across all cases"
            color="text-blue-500"
          />
          <StatCard
            icon={ShieldCheck}
            label="Preserved On-Chain"
            value={preserved.length}
            sub={`${preservationRate}% of total`}
            color="text-emerald-500"
          />
          <StatCard
            icon={ShieldOff}
            label="Not Yet Preserved"
            value={unpreserved.length}
            sub="use 'Secure Now' in evidence"
            color="text-amber-500"
          />
          <StatCard
            icon={Layers}
            label="Cases Tracked"
            value={caseGroups.length}
            sub="with evidence records"
            color="text-violet-500"
          />
        </div>
      )}

      {/* Preservation Rate Bar */}
      {!isLoading && allEvidence.length > 0 && (
        <Card className="border border-border/60">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-foreground">Overall Preservation Rate</span>
              <span className="text-sm font-bold text-emerald-500">{preservationRate}%</span>
            </div>
            <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                initial={{ width: 0 }}
                animate={{ width: `${preservationRate}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{preserved.length} preserved</span>
              <span>{unpreserved.length} pending</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter Tabs */}
      {!isLoading && (
        <div className="flex items-center gap-2 flex-wrap">
          {(["all", "preserved", "unpreserved"] as const).map((f) => (
            <Button
              key={f}
              variant={activeFilter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter(f)}
              className="capitalize h-8 text-xs gap-1.5"
            >
              {f === "preserved" && <ShieldCheck className="h-3 w-3" />}
              {f === "unpreserved" && <ShieldOff className="h-3 w-3" />}
              {f === "all" && <Database className="h-3 w-3" />}
              {f === "all" ? "All Evidence" : f === "preserved" ? "Preserved" : "Not Preserved"}
              <span className="ml-0.5 bg-background/30 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                {f === "all"
                  ? allEvidence.length
                  : f === "preserved"
                  ? preserved.length
                  : unpreserved.length}
              </span>
            </Button>
          ))}
        </div>
      )}

      {/* Case-wise Groups */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="border border-border/60">
              <CardContent className="p-5">
                <div className="h-8 bg-muted/50 rounded animate-pulse mb-2" />
                <div className="h-4 w-1/3 bg-muted/40 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredGroups.length === 0 ? (
        <Card className="border border-border/60">
          <CardContent className="py-16 flex flex-col items-center gap-3 text-center">
            <Database className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">
              {activeFilter === "preserved"
                ? "No blockchain-preserved evidence yet."
                : activeFilter === "unpreserved"
                ? "All evidence has been preserved on blockchain!"
                : "No evidence records found."}
            </p>
            {activeFilter === "preserved" && (
              <p className="text-xs text-muted-foreground/70 max-w-sm">
                Open any evidence in Evidence Records and click <strong>"Secure Now"</strong> to preserve it on the Hardhat blockchain.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredGroups.map((group) => {
            const caseId = group.case.id || group.case._id || group.case.caseName;
            const isExpanded = expandedCase === caseId;
            const total = group.preserved.length + group.unpreserved.length;
            const pct = total > 0 ? Math.round((group.preserved.length / total) * 100) : 0;

            return (
              <motion.div
                key={caseId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border border-border/60 overflow-hidden">
                  {/* Case Header — clickable to expand */}
                  <button
                    className="w-full text-left"
                    onClick={() => setExpandedCase(isExpanded ? null : caseId)}
                  >
                    <CardHeader className="pb-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                            <Layers className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <CardTitle className="text-sm font-semibold truncate">
                              {group.case.caseName}
                            </CardTitle>
                            <CardDescription className="text-xs">
                              {group.case.caseNumber} · {total} evidence item{total !== 1 ? "s" : ""}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {group.preserved.length > 0 && (
                            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1 text-xs">
                              <ShieldCheck className="h-3 w-3" />
                              {group.preserved.length} preserved
                            </Badge>
                          )}
                          {group.unpreserved.length > 0 && (
                            <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 text-xs">
                              <ShieldOff className="h-3 w-3" />
                              {group.unpreserved.length} pending
                            </Badge>
                          )}
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground w-8">{pct}%</span>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </button>

                  {/* Evidence List */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <CardContent className="pt-0 pb-4 px-4">
                          <div className="space-y-2.5">
                            {group.displayEvidence.map((ev) => {
                              const evId = ev.id || ev._id || "";
                              const isRecordExpanded = expandedRecord === evId;
                              const isPreserved = !!ev.blockchainHash;

                              return (
                                <motion.div
                                  key={evId}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className={`rounded-lg border ${
                                    isPreserved
                                      ? "border-emerald-500/20 bg-emerald-500/5"
                                      : "border-amber-500/20 bg-amber-500/5"
                                  } overflow-hidden`}
                                >
                                  {/* Evidence row header */}
                                  <button
                                    className="w-full text-left p-3 flex items-center gap-3 hover:bg-black/5 transition-colors"
                                    onClick={() =>
                                      setExpandedRecord(isRecordExpanded ? null : evId)
                                    }
                                  >
                                    <FileImage className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <span className="flex-1 text-sm font-medium truncate text-foreground">
                                      {ev.evidenceName || ev.fileName}
                                    </span>
                                    <div className="flex items-center gap-2 shrink-0">
                                      {isPreserved ? (
                                        <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                          <CheckCircle2 className="h-3.5 w-3.5" />
                                          On-Chain
                                        </span>
                                      ) : (
                                        <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                                          <Clock className="h-3.5 w-3.5" />
                                          Not Preserved
                                        </span>
                                      )}
                                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                        ev.result === "tampered"
                                          ? "bg-red-500/10 text-red-600 dark:text-red-400"
                                          : ev.result === "authentic"
                                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                          : "bg-muted/50 text-muted-foreground"
                                      }`}>
                                        {ev.result === "tampered" ? "Tampered" : ev.result === "authentic" ? "Authentic" : "Pending"}
                                      </span>
                                      {isPreserved && (
                                        isRecordExpanded
                                          ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                                          : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                                      )}
                                    </div>
                                  </button>

                                  {/* Expanded blockchain details */}
                                  <AnimatePresence>
                                    {isPreserved && isRecordExpanded && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden border-t border-emerald-500/15"
                                      >
                                        <div className="p-3 space-y-3 bg-background/40">
                                          {/* Tx Hash */}
                                          <div className="space-y-1">
                                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                              <Hash className="h-3 w-3" />
                                              Transaction Hash
                                            </p>
                                            <div className="flex items-center gap-2">
                                              <code className="flex-1 text-xs bg-muted/60 px-2.5 py-1.5 rounded font-mono truncate text-emerald-700 dark:text-emerald-400">
                                                {ev.blockchainHash}
                                              </code>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 shrink-0"
                                                onClick={() => copyToClipboard(ev.blockchainHash!, `txhash-${evId}`)}
                                                title="Copy tx hash"
                                              >
                                                {copiedId === `txhash-${evId}` ? (
                                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                                ) : (
                                                  <Copy className="h-3.5 w-3.5" />
                                                )}
                                              </Button>
                                            </div>
                                          </div>

                                          {/* IPFS Hash */}
                                          {ev.ipfsHash && (
                                            <div className="space-y-1">
                                              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                                <LinkIcon className="h-3 w-3" />
                                                IPFS CID
                                              </p>
                                              <div className="flex items-center gap-2">
                                                <code className="flex-1 text-xs bg-muted/60 px-2.5 py-1.5 rounded font-mono truncate text-blue-700 dark:text-blue-400">
                                                  {ev.ipfsHash}
                                                </code>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-7 w-7 shrink-0"
                                                  onClick={() => copyToClipboard(ev.ipfsHash!, `ipfs-${evId}`)}
                                                  title="Copy CID"
                                                >
                                                  {copiedId === `ipfs-${evId}` ? (
                                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                                  ) : (
                                                    <Copy className="h-3.5 w-3.5" />
                                                  )}
                                                </Button>
                                                <a
                                                  href={`https://ipfs.io/ipfs/${ev.ipfsHash}`}
                                                  target="_blank"
                                                  rel="noreferrer"
                                                  className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted transition-colors shrink-0"
                                                  title="View on IPFS"
                                                >
                                                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                                                </a>
                                              </div>
                                            </div>
                                          )}

                                          {/* Metadata grid */}
                                          <div className="grid grid-cols-3 gap-3 pt-1">
                                            <div className="space-y-0.5">
                                              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                Preserved On
                                              </p>
                                              <p className="text-xs font-medium text-foreground">
                                                {ev.analyzedDate
                                                  ? new Date(ev.analyzedDate).toLocaleDateString("en-IN", {
                                                      day: "2-digit", month: "short", year: "numeric"
                                                    })
                                                  : "—"}
                                              </p>
                                            </div>
                                            <div className="space-y-0.5">
                                              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                                Confidence
                                              </p>
                                              <p className="text-xs font-medium text-foreground">
                                                {ev.confidence != null ? `${ev.confidence}%` : "—"}
                                              </p>
                                            </div>
                                            <div className="space-y-0.5">
                                              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                                File Size
                                              </p>
                                              <p className="text-xs font-medium text-foreground">
                                                {ev.size || "—"}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>

                                  {/* Not-preserved hint */}
                                  {!isPreserved && (
                                    <div className="px-3 pb-3">
                                      <p className="text-[11px] text-amber-600/80 dark:text-amber-500/70 flex items-center gap-1.5">
                                        <AlertCircle className="h-3 w-3 shrink-0" />
                                        Open this evidence in Evidence Records → click <strong>&quot;Secure Now&quot;</strong> to preserve on blockchain.
                                      </p>
                                    </div>
                                  )}
                                </motion.div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Preserved Records — Full Flat List */}
      {!isLoading && preserved.length > 0 && activeFilter !== "unpreserved" && (
        <Card className="border border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              All Preserved Transactions
            </CardTitle>
            <CardDescription className="text-xs">
              {preserved.length} evidence item{preserved.length !== 1 ? "s" : ""} with confirmed on-chain records
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left pb-2.5 font-semibold text-muted-foreground uppercase tracking-wider pr-4">Evidence</th>
                    <th className="text-left pb-2.5 font-semibold text-muted-foreground uppercase tracking-wider pr-4">Case</th>
                    <th className="text-left pb-2.5 font-semibold text-muted-foreground uppercase tracking-wider pr-4">Result</th>
                    <th className="text-left pb-2.5 font-semibold text-muted-foreground uppercase tracking-wider pr-4">Tx Hash</th>
                    <th className="text-left pb-2.5 font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {preserved.map((ev) => {
                    const evId = ev.id || ev._id || "";
                    return (
                      <tr key={evId} className="hover:bg-muted/20 transition-colors">
                        <td className="py-2.5 pr-4">
                          <div className="flex items-center gap-2">
                            <FileImage className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="font-medium text-foreground truncate max-w-[140px]">
                              {ev.evidenceName || ev.fileName}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 pr-4 text-muted-foreground truncate max-w-[100px]">
                          {ev.caseName || "—"}
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            ev.result === "tampered"
                              ? "bg-red-500/10 text-red-600 dark:text-red-400"
                              : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                          }`}>
                            {ev.result === "tampered" ? "Tampered" : "Authentic"}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4">
                          <div className="flex items-center gap-1.5">
                            <code className="font-mono text-emerald-700 dark:text-emerald-400 max-w-[120px] truncate">
                              {ev.blockchainHash?.slice(0, 10)}...{ev.blockchainHash?.slice(-6)}
                            </code>
                            <button
                              onClick={() => copyToClipboard(ev.blockchainHash!, `table-${evId}`)}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {copiedId === `table-${evId}` ? (
                                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="py-2.5 text-muted-foreground">
                          {ev.analyzedDate
                            ? new Date(ev.analyzedDate).toLocaleDateString("en-IN", {
                                day: "2-digit", month: "short", year: "numeric"
                              })
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Network Info Footer */}
      <Card className="border border-border/40 bg-muted/20">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5 text-primary" />
              <strong className="text-foreground">Network:</strong> Hardhat Localhost (Chain ID 31337)
            </span>
            <span className="flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-primary" />
              <strong className="text-foreground">Contract:</strong>
              <code className="font-mono">
                {process.env.NEXT_PUBLIC_IMAGE_STORAGE_ADDRESS
                  ? `${process.env.NEXT_PUBLIC_IMAGE_STORAGE_ADDRESS.slice(0, 8)}…${process.env.NEXT_PUBLIC_IMAGE_STORAGE_ADDRESS.slice(-6)}`
                  : "Not deployed"}
              </code>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <strong className="text-foreground">RPC:</strong> http://127.0.0.1:8545
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

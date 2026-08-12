"use client";
import { motion } from "framer-motion";
import {
    Activity,
    Briefcase,
    CheckCircle2,
    Clock,
    FileText,
    Shield,
    TrendingUp,
    Users,
    AlertTriangle,
    Search,
    Upload,
    ImageIcon,
    ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { getAllEvidence, StoredEvidence, getAllCases } from "@/lib/evidence-storage";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell,
} from "recharts";

interface DashboardOverviewProps {
    stats: {
        totalEvidence: number;
        totalCases: number;
        verified: number;
        reportsGenerated: number;
        onBlockchain: number;
    };
    onNavigate: (tab: string) => void;
    onNavigateToEvidence?: (id: string) => void;
    userName?: string;
}

// ─── Pure SVG Donut ────────────────────────────────────────────────────────────
// Renders instantly — no ResizeObserver / Recharts PieChart overhead.
function SvgDonut({ data }: { data: { name: string; value: number; color: string }[] }) {
    const size = 180;
    const cx = size / 2;
    const cy = size / 2;
    const R = 70;   // outer radius
    const r = 50;   // inner radius (hole)
    const gap = 3;  // gap between segments in degrees

    const total = data.reduce((s, d) => s + d.value, 0);
    if (total === 0) return null;

    // Build arc paths
    let cursor = -90; // start at 12 o'clock
    const segments = data.map((d) => {
        const deg = (d.value / total) * 360 - gap;
        const startAngle = cursor;
        cursor += deg + gap;
        const endAngle = startAngle + deg;
        const toRad = (a: number) => (a * Math.PI) / 180;
        const x1 = cx + R * Math.cos(toRad(startAngle));
        const y1 = cy + R * Math.sin(toRad(startAngle));
        const x2 = cx + R * Math.cos(toRad(endAngle));
        const y2 = cy + R * Math.sin(toRad(endAngle));
        const x3 = cx + r * Math.cos(toRad(endAngle));
        const y3 = cy + r * Math.sin(toRad(endAngle));
        const x4 = cx + r * Math.cos(toRad(startAngle));
        const y4 = cy + r * Math.sin(toRad(startAngle));
        const large = deg > 180 ? 1 : 0;
        const path = `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${r} ${r} 0 ${large} 0 ${x4} ${y4} Z`;
        return { ...d, path };
    });

    return (
        <div className="flex items-center gap-6 w-full justify-center">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {segments.map((seg, i) => (
                    <path key={i} d={seg.path} fill={seg.color} opacity={0.9}>
                        <title>{seg.name}: {seg.value}</title>
                    </path>
                ))}
                {/* Centre label */}
                <text x={cx} y={cy - 6} textAnchor="middle" className="fill-foreground" style={{ fontSize: 22, fontWeight: 700 }}>{total}</text>
                <text x={cx} y={cy + 14} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 10 }}>Total</text>
            </svg>
            {/* Legend */}
            <div className="flex flex-col gap-2.5">
                {segments.map((seg, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="h-3 w-3 rounded-sm flex-shrink-0" style={{ background: seg.color }} />
                        <span className="text-muted-foreground">{seg.name}</span>
                        <span className="font-bold text-foreground ml-1">{seg.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function DashboardOverview({ stats, onNavigate, onNavigateToEvidence, userName }: DashboardOverviewProps) {
    const [recentEvidence, setRecentEvidence] = useState<StoredEvidence[]>([]);
    const [trendData, setTrendData] = useState<{ display: string; uploads: number }[]>([]);
    const [donutData, setDonutData] = useState<{ name: string; value: number; color: string }[]>([]);
    const [caseResolutionData, setCaseResolutionData] = useState<{ name: string; value: number; color: string }[]>([]);
    const [currentTime, setCurrentTime] = useState<string>("");

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            const dateStr = now.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
            });
            const timeStr = now.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
            });
            setCurrentTime(`${dateStr} | ${timeStr}`);
        };

        updateTime();
        const timer = setInterval(updateTime, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const updateData = async () => {
            const allEv = await getAllEvidence();
            
            // Sort by uploadDate descending for Recent List
            const sorted = [...allEv].sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
            setRecentEvidence(sorted.slice(0, 5));

            // Generate last 7 days trend
            const last7Days = Array.from({ length: 7 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (6 - i));
                return {
                    dateStr: d.toISOString().split('T')[0],
                    display: d.toLocaleDateString('en-US', { weekday: 'short' }),
                    uploads: 0
                };
            });

            allEv.forEach(ev => {
                const dStr = new Date(ev.uploadDate).toISOString().split('T')[0];
                const match = last7Days.find(d => d.dateStr === dStr);
                if (match) match.uploads++;
            });

            setTrendData(last7Days);

            // Generate Donut Data
            const authentic = allEv.filter(e => e.status === "complete" && e.result === "authentic").length;
            const tampered = allEv.filter(e => e.status === "complete" && e.result === "tampered").length;
            const pending = allEv.filter(e => e.status !== "complete").length;

            setDonutData([
                { name: 'Authentic', value: authentic, color: '#10b981' }, 
                { name: 'Tampered', value: tampered, color: '#ef4444' }, 
                { name: 'Pending', value: pending, color: '#f59e0b' },
            ].filter(d => d.value > 0));

            // Calculate case resolution rates
            const allCases = await getAllCases();
            let resolvedCases = 0;
            let activeCases = 0;

            allCases.forEach(c => {
                const caseEvidence = allEv.filter(e => e.caseId === c.id || e.caseId === c._id);
                if (caseEvidence.length === 0) {
                    activeCases++;
                } else {
                    const allComplete = caseEvidence.every(e => e.status === "complete");
                    if (allComplete) {
                        resolvedCases++;
                    } else {
                        activeCases++;
                    }
                }
            });

            setCaseResolutionData([
                { name: 'Resolved', value: resolvedCases, color: '#10b981' },
                { name: 'Active', value: activeCases, color: '#8884d8' },
            ]);
        };

        updateData();
        const interval = setInterval(updateData, 5000);
        return () => clearInterval(interval);
    }, []);

    const getTimeAgo = (dateStr: string) => {
        const now = new Date();
        const date = new Date(dateStr);
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        
        if (diffInSeconds < 60) return "Just now";
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        return `${Math.floor(diffInSeconds / 86400)} days ago`;
    };

    const overviewStats = [
        {
            title: "Active Cases",
            value: stats.totalCases,
            icon: Briefcase,
            color: "text-indigo-600 dark:text-indigo-400",
            bg: "bg-indigo-100 dark:bg-indigo-900/20",
            glowClass: "glow-indigo",
        },
        {
            title: "Total Evidence",
            value: stats.totalEvidence,
            icon: Activity,
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-100 dark:bg-blue-900/20",
            glowClass: "glow-blue",
        },
        {
            title: "Verified",
            value: stats.verified,
            icon: Shield,
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-100 dark:bg-emerald-900/20",
            glowClass: "glow-emerald",
        },
        {
            title: "Blockchain Secured",
            value: stats.onBlockchain,
            icon: CheckCircle2,
            color: "text-purple-600 dark:text-purple-400",
            bg: "bg-purple-100 dark:bg-purple-900/20",
            glowClass: "glow-purple",
        },
    ];

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    const maxUploads = trendData.reduce((max, d) => Math.max(max, d.uploads), 0);
    const yAxisDomain = [0, Math.max(6, maxUploads)];
    const yAxisTicks = maxUploads <= 6 ? [0, 2, 4, 6] : undefined;

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Analyst Dashboard</h2>
                    <p className="text-muted-foreground mt-1">
                        Welcome back, {userName || "Analyst"}!
                    </p>
                    {currentTime && (
                        <p className="text-sm font-mono text-muted-foreground/80 mt-1.5 flex items-center gap-2">
                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            {currentTime}
                        </p>
                    )}
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => onNavigate("upload")} className="gap-2">
                        <Upload className="h-4 w-4" />
                        Upload New Evidence
                    </Button>
                    <Button variant="outline" onClick={() => onNavigate("detect")} className="gap-2">
                        <Search className="h-4 w-4" />
                        Quick Analysis
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {overviewStats.map((stat) => (
                    <motion.div key={stat.title} variants={item}>
                        <Card className={`glow-card ${stat.glowClass} border hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300`}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {stat.title}
                                </CardTitle>
                                <div className={`p-2 rounded-full ${stat.bg}`}>
                                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value}</div>
                                {stat.title === "Blockchain Secured" && stats.totalEvidence > 0 && (
                                    <div className="mt-2 h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-purple-500" 
                                            style={{ width: `${(stats.onBlockchain / stats.totalEvidence) * 100}%` }}
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 md:grid-cols-7 md:h-[350px] h-auto">
                {/* 7-Day Trend Chart */}
                <Card className="col-span-1 md:col-span-3 h-full flex flex-col">
                    <CardHeader>
                        <CardTitle>Evidence Upload Trend</CardTitle>
                        <CardDescription>Upload activity over the last 7 days</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[240px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorUploads" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="display" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dy={10} />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 12 }} 
                                    domain={yAxisDomain} 
                                    ticks={yAxisTicks}
                                    allowDecimals={false} 
                                />
                                <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                                <RechartsTooltip 
                                    contentStyle={{ 
                                        backgroundColor: "var(--card)", 
                                        borderColor: "var(--border)", 
                                        borderRadius: '8px', 
                                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)' 
                                    }}
                                    itemStyle={{ color: "var(--foreground)" }}
                                    labelStyle={{ color: "var(--muted-foreground)" }}
                                />
                                <Area type="monotone" dataKey="uploads" stroke="#8884d8" fillOpacity={1} fill="url(#colorUploads)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Analysis Breakdown */}
                <Card className="col-span-1 md:col-span-2 h-full flex flex-col">
                    <CardHeader>
                        <CardTitle>Authenticity Breakdown</CardTitle>
                        <CardDescription>Ratio of authentic vs tampered</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[240px] w-full flex items-center justify-center">
                        {donutData.length === 0 ? (
                            <div className="text-center text-muted-foreground text-sm flex flex-col items-center">
                                <Activity className="h-8 w-8 mb-2 opacity-20" />
                                No analyzed data yet
                            </div>
                        ) : (
                            <SvgDonut data={donutData} />
                        )}
                    </CardContent>
                </Card>

                {/* Case Status Rates */}
                <Card className="col-span-1 md:col-span-2 h-full flex flex-col">
                    <CardHeader>
                        <CardTitle>Case Status Rates</CardTitle>
                        <CardDescription>Resolved vs active investigation cases</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[240px] w-full flex items-center justify-center">
                        {caseResolutionData.length === 0 || (caseResolutionData[0].value === 0 && caseResolutionData[1].value === 0) ? (
                            <div className="text-center text-muted-foreground text-sm flex flex-col items-center justify-center h-full">
                                <Briefcase className="h-8 w-8 mb-2 opacity-20" />
                                No case data available
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={caseResolutionData}
                                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                >
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} allowDecimals={false} />
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                                    <RechartsTooltip 
                                        contentStyle={{ 
                                            backgroundColor: "var(--card)", 
                                            borderColor: "var(--border)", 
                                            borderRadius: '8px', 
                                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)' 
                                        }}
                                        itemStyle={{ color: "var(--foreground)" }}
                                        labelStyle={{ color: "var(--muted-foreground)" }}
                                    />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                        {caseResolutionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recent Uploads Row */}
            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Uploads</CardTitle>
                        <CardDescription>
                            Latest evidence uploaded and analyzed across your cases
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentEvidence.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center bg-secondary/20 rounded-lg border border-dashed text-muted-foreground">
                                    <ImageIcon className="h-10 w-10 mb-2 opacity-50" />
                                    <p className="text-sm font-medium">No recent uploads</p>
                                    <p className="text-xs">Upload some evidence to see it appear here</p>
                                </div>
                            ) : (
                                recentEvidence.map((ev) => {
                                    const evId = ev.id || (ev as any)._id;
                                    return (
                                    <div key={evId} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group">
                                        <div className="flex items-center gap-4 min-w-0 flex-1">
                                            {/* Preview Thumbnail Box */}
                                            <div className="flex-shrink-0 relative overflow-hidden h-12 w-12 rounded-md border bg-muted flex flex-col justify-center items-center">
                                                {ev.imageData ? (
                                                    /* eslint-disable-next-line @next/next/no-img-element */
                                                    <img src={ev.imageData} alt="preview" className="object-cover h-full w-full" />
                                                ) : (
                                                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                                )}
                                            </div>
                                            
                                            <div className="space-y-1 min-w-0">
                                                <p className="text-sm font-medium leading-none truncate max-w-[200px]">
                                                    {ev.fileName}
                                                </p>
                                                <p className="text-xs text-muted-foreground flex items-center gap-2">
                                                    <span>{ev.caseName || 'Unassigned Case'}</span>
                                                    <span>•</span>
                                                    <span className="flex items-center">
                                                        <Clock className="h-3 w-3 mr-1" />
                                                        {getTimeAgo(ev.uploadDate)}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {/* Status Badge */}
                                            {ev.status !== 'complete' ? (
                                                <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400">
                                                    Pending Analysis
                                                </Badge>
                                            ) : ev.result === 'tampered' ? (
                                                <Badge variant="destructive" className="flex gap-1.5 items-center">
                                                    <AlertTriangle className="h-3 w-3" />
                                                    Tampered
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-emerald-500 hover:bg-emerald-600 flex gap-1.5 items-center text-white">
                                                    <Shield className="h-3 w-3" />
                                                    Authentic
                                                </Badge>
                                            )}

                                            {/* Analyse button — appears on hover or always visible */}
                                            {onNavigateToEvidence && evId && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-7 px-2.5 text-xs gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => onNavigateToEvidence(evId)}
                                                >
                                                    <ExternalLink className="h-3 w-3" />
                                                    Analyse
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                    );
                                })
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </motion.div>
    );
}

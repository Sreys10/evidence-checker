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
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DashboardOverviewProps {
    stats: {
        totalEvidence: number;
        totalCases: number;
        verified: number;
        reportsGenerated: number;
        onBlockchain: number;
    };
    onNavigate: (tab: string) => void;
}

export default function DashboardOverview({ stats, onNavigate }: DashboardOverviewProps) {
    // Mock recent activity data
    const recentActivity = [
        {
            id: 1,
            action: "Evidence Uploaded",
            details: "CCTV_Footage_001.mp4",
            time: "2 mins ago",
            icon: Upload,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
        },
        {
            id: 2,
            action: "Tampering Detected",
            details: "Image_DSC0293.jpg - High Probability",
            time: "15 mins ago",
            icon: AlertTriangle,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
        },
        {
            id: 3,
            action: "Report Generated",
            details: "Case #4928 - Forensic Analysis",
            time: "1 hour ago",
            icon: FileText,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
        },
        {
            id: 4,
            action: "Face Match Found",
            details: "Suspect #92 (98% match)",
            time: "3 hours ago",
            icon: Users,
            color: "text-purple-500",
            bg: "bg-purple-500/10",
        },
    ];

    const overviewStats = [
        {
            title: "Active Cases",
            value: stats.totalCases,
            change: "Case management",
            icon: Briefcase,
            color: "text-indigo-600 dark:text-indigo-400",
            bg: "bg-indigo-100 dark:bg-indigo-900/20",
        },
        {
            title: "Total Evidence",
            value: stats.totalEvidence,
            change: "+12% from last month",
            icon: Activity,
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-100 dark:bg-blue-900/20",
        },
        {
            title: "Verified",
            value: stats.verified,
            change: "+5% from last month",
            icon: Shield,
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-100 dark:bg-emerald-900/20",
        },
        {
            title: "Reports Created",
            value: stats.reportsGenerated,
            change: "+8% from last month",
            icon: FileText,
            color: "text-amber-600 dark:text-amber-400",
            bg: "bg-amber-100 dark:bg-amber-900/20",
        },
        {
            title: "Blockchain Secured",
            value: stats.onBlockchain,
            change: "100% secured",
            icon: CheckCircle2,
            color: "text-purple-600 dark:text-purple-400",
            bg: "bg-purple-100 dark:bg-purple-900/20",
        },
    ];

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6"
        >
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
                    <p className="text-muted-foreground mt-1">
                        Welcome back, Analyst. Here's what's happening with your cases today.
                    </p>
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
                {overviewStats.map((stat, index) => (
                    <motion.div key={stat.title} variants={item}>
                        <Card className="hover:shadow-md transition-shadow">
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
                                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                                    <TrendingUp className="h-3 w-3 mr-1 text-emerald-500" />
                                    {stat.change}
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <div className="grid gap-6 md:grid-cols-7">
                {/* Recent Activity */}
                <Card className="md:col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>
                            Latest actions performed across the platform
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {recentActivity.map((activity) => (
                                <div key={activity.id} className="flex items-center">
                                    <div className={`p-2 rounded-full mr-4 ${activity.bg}`}>
                                        <activity.icon className={`h-4 w-4 ${activity.color}`} />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium leading-none">
                                            {activity.action}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {activity.details}
                                        </p>
                                    </div>
                                    <div className="text-xs text-muted-foreground flex items-center">
                                        <Clock className="h-3 w-3 mr-1" />
                                        {activity.time}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Tips / System Status */}
                <Card className="md:col-span-3">
                    <CardHeader>
                        <CardTitle>System Status</CardTitle>
                        <CardDescription>
                            Operational metrics and maintenance
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                    AI Analysis Engine
                                </span>
                                <Badge variant="outline" className="text-emerald-500 bg-emerald-500/10 border-emerald-500/20">Operational</Badge>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                    Blockchain Network
                                </span>
                                <Badge variant="outline" className="text-emerald-500 bg-emerald-500/10 border-emerald-500/20">Synced</Badge>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                    Database Cluster
                                </span>
                                <Badge variant="outline" className="text-emerald-500 bg-emerald-500/10 border-emerald-500/20">Optimal</Badge>
                            </div>
                        </div>

                        <div className="pt-4 border-t">
                            <h4 className="text-sm font-medium mb-2">Analyst Tips</h4>
                            <ul className="space-y-2 text-xs text-muted-foreground list-disc list-inside">
                                <li>Use high-resolution images for better tampering detection accuracy.</li>
                                <li>Verify metadata consistency before generating final reports.</li>
                                <li>Regularly back up sensitive case files to the secure blockchain ledger.</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </motion.div>
    );
}

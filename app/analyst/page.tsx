"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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
  Menu,
  User,
  Bell,
  HelpCircle,
  Camera,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/analyst/image-upload";
import TamperingDetection from "@/components/analyst/tampering-detection";
import ReportGeneration from "@/components/analyst/report-generation";
import EvidenceRecords from "@/components/analyst/evidence-records";
import BlockchainUpload from "@/components/analyst/blockchain-upload";
import ThemeToggle from "@/components/theme-toggle";
import { getUserStats } from "@/lib/evidence-storage";

type ActiveTab = "upload" | "detect" | "report" | "records" | "blockchain";

interface User {
  _id?: string;
  name: string;
  email: string;
  userType: "admin" | "analyst" | "verifier" | "guest";
}

export default function AnalystPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("upload");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [stats, setStats] = useState({
    totalEvidence: 0,
    verified: 0,
    reportsGenerated: 0,
    onBlockchain: 0,
  });

  useEffect(() => {
    // Get current user from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
      
      // Load profile image if exists
      const savedImage = localStorage.getItem(`profileImage_${user._id || user.email}`);
      if (savedImage) {
        setProfileImage(savedImage);
      }
      
      // Redirect if not analyst
      if (user.userType !== 'analyst') {
        router.push('/login');
        return;
      }
    } else {
      router.push('/login');
      return;
    }
    
    // Listen for profile image updates
    const handleStorageChange = () => {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const updatedImage = localStorage.getItem(`profileImage_${user._id || user.email}`);
        if (updatedImage) {
          setProfileImage(updatedImage);
        }
      }
    };
    
    // Also check for changes in the same window
    const interval = setInterval(() => {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const updatedImage = localStorage.getItem(`profileImage_${user._id || user.email}`);
        if (updatedImage && updatedImage !== profileImage) {
          setProfileImage(updatedImage);
        }
      }
    }, 500);
    
    window.addEventListener('storage', handleStorageChange);
    
    // Load stats
    const loadStats = () => {
      if (userStr) {
        const user = JSON.parse(userStr);
        const userStats = getUserStats(user._id || user.email);
        setStats({
          totalEvidence: userStats.totalEvidence,
          verified: userStats.verified,
          reportsGenerated: userStats.reportsGenerated,
          onBlockchain: userStats.onBlockchain,
        });
      }
    };
    
    loadStats();
    
    // Refresh stats periodically
    const statsInterval = setInterval(() => {
      loadStats();
    }, 3000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
      clearInterval(statsInterval);
    };
  }, [router, profileImage]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  // Get first name only
  const getFirstName = (fullName: string | undefined) => {
    if (!fullName) return 'User';
    return fullName.split(' ')[0];
  };

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
      <header className="border-b border-border bg-gradient-to-r from-card via-card/95 to-card backdrop-blur-md sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden hover:bg-primary/10"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {currentUser ? `Hi ${getFirstName(currentUser.name)}, welcome back! 👋` : 'Analyst Dashboard'}
                </h1>
                <p className="text-muted-foreground mt-1 text-sm md:text-base">
                  Upload, analyze, and manage digital evidence
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(true)}
                className="hidden lg:flex hover:bg-primary/10 relative"
              >
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="h-8 w-8 rounded-full object-cover ring-2 ring-primary/20"
                  />
                ) : (
                  <User className="h-5 w-5" />
                )}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout} 
                className="hidden sm:flex hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleLogout} 
                className="sm:hidden hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Side Panel */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Profile & Settings</SheetTitle>
            <SheetDescription>
              Manage your profile and account settings
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-6 space-y-6 pb-6">
            {/* Profile Preview */}
            <div className="flex flex-col items-center text-center pb-6 border-b border-border">
              <div className="relative group">
                <Avatar className="h-20 w-20 mb-3 ring-2 ring-primary/20 transition-all group-hover:ring-primary/40">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt={currentUser?.name || "User"}
                      className="h-full w-full object-cover rounded-full"
                    />
                  ) : (
                    <AvatarFallback className="text-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {currentUser?.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase() || "A"}
                    </AvatarFallback>
                  )}
                </Avatar>
                <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-all shadow-lg hover:scale-110 active:scale-95 z-10">
                  <Camera className="h-4 w-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setIsUploadingPhoto(true);
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          const result = reader.result as string;
                          setProfileImage(result);
                          if (currentUser?._id || currentUser?.email) {
                            localStorage.setItem(`profileImage_${currentUser._id || currentUser.email}`, result);
                          }
                          setIsUploadingPhoto(false);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                    disabled={isUploadingPhoto}
                  />
                </label>
                {isUploadingPhoto && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
                    <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <h2 className="text-lg font-bold text-foreground">{getFirstName(currentUser?.name) || "Analyst"}</h2>
              <p className="text-xs text-muted-foreground mt-1">{currentUser?.email || ""}</p>
              <Badge variant="outline" className="mt-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                {currentUser?.userType || "analyst"}
              </Badge>
            </div>

            {/* Navigation Menu */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                Menu
              </h3>
              <div className="space-y-1.5">
                <Button 
                  variant="outline" 
                  className="w-full justify-start hover:bg-primary/10 hover:border-primary/50 hover:text-primary transition-all shadow-sm" 
                  asChild
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <Link href="/profile">
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start hover:bg-primary/10 hover:border-primary/50 hover:text-primary transition-all shadow-sm"
                  disabled
                  title="Settings coming soon"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start hover:bg-primary/10 hover:border-primary/50 hover:text-primary transition-all shadow-sm"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start hover:bg-primary/10 hover:border-primary/50 hover:text-primary transition-all shadow-sm"
                >
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Help & Support
                </Button>
              </div>
            </div>

            {/* Theme Toggle in Sidebar */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="font-semibold text-foreground">Appearance</h3>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-foreground">Theme</span>
                <ThemeToggle />
              </div>
            </div>

            {/* Logout */}
            <div className="pt-4 border-t border-border">
              <Button variant="destructive" className="w-full" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

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
                <div className="text-2xl font-bold text-foreground">{stats.totalEvidence}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.totalEvidence > 0 ? `${stats.verified} verified` : 'No evidence yet'}
                </p>
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
                <div className="text-2xl font-bold text-foreground">{stats.verified}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.totalEvidence > 0 
                    ? `${Math.round((stats.verified / stats.totalEvidence) * 100)}% success rate`
                    : 'No analysis yet'}
                </p>
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
                <div className="text-2xl font-bold text-foreground">{stats.reportsGenerated}</div>
                <p className="text-xs text-muted-foreground mt-1">Total reports</p>
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
                <div className="text-2xl font-bold text-foreground">{stats.onBlockchain}</div>
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


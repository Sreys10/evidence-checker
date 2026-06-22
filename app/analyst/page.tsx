"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  ChevronLeft,
  ChevronRight,
  Fingerprint,
  FileSearch,
  LayoutDashboard,
  Settings,
  AlertTriangle,
  MessageSquare,
  Video,
  Target,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/analyst/image-upload";
import TamperingDetection from "@/components/analyst/tampering-detection";
import ReportGeneration from "@/components/analyst/report-generation";
import EvidenceRecords from "@/components/analyst/evidence-records";
import BlockchainUpload from "@/components/analyst/blockchain-upload";
import FaceAnalysis from "@/components/analyst/face-analysis";
import MetadataAnalysis from "@/components/analyst/metadata-analysis";
import DashboardOverview from "@/components/analyst/dashboard-overview";
import ThemeToggle from "@/components/theme-toggle";
import EvidenceDetail from "@/components/analyst/evidence-detail";
import { getUserStats, getEvidenceById } from "@/lib/evidence-storage";
import ChatPanel from "@/components/analyst/chat-panel";
import VideoDetection from "@/components/analyst/video-detection";
import WeaponDetection from "@/components/analyst/weapon-detection";

type ActiveTab = "overview" | "upload" | "detect" | "video" | "metadata" | "face" | "weapon" | "report" | "blockchain" | "records" | "evidence-detail" | "chats";

interface User {
  _id?: string;
  name: string;
  email: string;
  userType: "admin" | "analyst" | "verifier" | "guest";
}

export default function AnalystPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAppSettingsOpen, setIsAppSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [preselectedCaseId, setPreselectedCaseId] = useState<string | null>(null);
  const [viewingEvidenceId, setViewingEvidenceId] = useState<string | null>(null);
  const [currentEvidenceName, setCurrentEvidenceName] = useState<string>("");
  const [currentCaseName, setCurrentCaseName] = useState<string>("");
  const [currentCaseId, setCurrentCaseId] = useState<string>("");
  const [preselectedEvidenceId, setPreselectedEvidenceId] = useState<string | null>(null);
  const [evidenceDetailInitialTab, setEvidenceDetailInitialTab] = useState<string>("details");
  const [autoStartAnalysis, setAutoStartAnalysis] = useState(false);
  const [stats, setStats] = useState({
    totalEvidence: 0,
    totalCases: 0,
    verified: 0,
    reportsGenerated: 0,
    onBlockchain: 0,
  });
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
          if (data.user.profileImage) setProfileImage(data.user.profileImage);
          if (data.user.userType !== 'analyst') {
            router.push('/login');
          }
        } else {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            setCurrentUser(user);
            const savedImage = localStorage.getItem(`profileImage_${user._id || user.email}`);
            if (savedImage) setProfileImage(savedImage);
            if (user.userType !== 'analyst') router.push('/login');
          } else {
            router.push('/login');
          }
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
      }
    };

    fetchProfile();

    const loadStats = async () => {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      if (user) {
        const userStats = await getUserStats(user._id || user.email);
        setStats({
          totalEvidence: userStats.totalEvidence,
          totalCases: userStats.totalCases,
          verified: userStats.verified,
          reportsGenerated: userStats.reportsGenerated,
          onBlockchain: userStats.onBlockchain,
        });
      }
    };

    loadStats();
    const statsInterval = setInterval(loadStats, 5000);

    return () => {
      clearInterval(statsInterval);
    };
  }, [router]);
  
  useEffect(() => {
    if (viewingEvidenceId) {
      getEvidenceById(viewingEvidenceId).then((evidence) => {
        if (evidence) {
          setCurrentEvidenceName(evidence.evidenceName || evidence.fileName);
          setCurrentCaseName(evidence.caseName || "Uncategorized Case");
          setCurrentCaseId(evidence.caseId || "");
        }
      });
    } else {
      setCurrentEvidenceName("");
      setCurrentCaseName("");
      setCurrentCaseId("");
    }
  }, [viewingEvidenceId]);

  // Poll unread message count
  useEffect(() => {
    const pollUnread = async () => {
      try {
        const res = await fetch('/api/messages?action=unread');
        if (res.ok) {
          const data = await res.json();
          setUnreadMessages(data.count || 0);
        }
      } catch (e) { /* silent */ }
    };
    pollUnread();
    const interval = setInterval(pollUnread, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleViewEvidence = (evidenceId: string) => {
    setViewingEvidenceId(evidenceId);
    setEvidenceDetailInitialTab("details");
    setActiveTab("evidence-detail");
  };

  const handleEvidenceAction = (action: string, evidenceId: string) => {
    setPreselectedEvidenceId(evidenceId);
    if (action === "detect") setAutoStartAnalysis(true);
    setActiveTab(action as ActiveTab);
  };

  const handleLogout = async () => { 
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) { console.error(e) }
    localStorage.removeItem('user'); 
    router.push('/login'); 
  };
  const getFirstName = (fullName: string | undefined) => fullName ? fullName.split(' ')[0] : 'User';

  const tabs = [
    { id: "overview" as ActiveTab, label: "Overview", icon: LayoutDashboard },
    { id: "upload" as ActiveTab, label: "Upload Evidence", icon: Upload },
    { id: "detect" as ActiveTab, label: "Detect Tampering", icon: Search },
    { id: "video" as ActiveTab, label: "Video Detection", icon: Video },
    { id: "metadata" as ActiveTab, label: "Metadata Analysis", icon: FileSearch },
    { id: "face" as ActiveTab, label: "Face Analysis", icon: Fingerprint },
    { id: "weapon" as ActiveTab, label: "Weapon Detection", icon: Target },
    { id: "report" as ActiveTab, label: "Generate Report", icon: FileText },
    { id: "records" as ActiveTab, label: "Evidence Records", icon: History },
    { id: "blockchain" as ActiveTab, label: "Blockchain", icon: LinkIcon },
    { id: "chats" as ActiveTab, label: "Chats", icon: MessageSquare, badge: unreadMessages },
  ];

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    // Immediately clear unread badge when opening Chats tab
    if (tab === "chats") setUnreadMessages(0);
  };

  const renderBreadcrumbs = () => {
    const breadcrumbClass = "text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer";
    const activeClass = "text-xs font-semibold text-foreground";
    const separator = <ChevronRight className="h-3 w-3 text-muted-foreground/60 mx-1 shrink-0" />;

    const items = [
      <span key="home" className={activeTab === "overview" ? activeClass : breadcrumbClass} onClick={() => handleTabChange("overview")}>
        Dashboard
      </span>
    ];

    if (activeTab !== "overview") {
      items.push(separator);
      
      if (activeTab === "evidence-detail") {
        items.push(
          <span key="records" className={breadcrumbClass} onClick={() => handleTabChange("records")}>
            Evidence Records
          </span>
        );
        items.push(separator);
        if (currentCaseName) {
          items.push(
            <span key="case" className={breadcrumbClass} onClick={() => handleTabChange("records")}>
              {currentCaseName}
            </span>
          );
          items.push(separator);
        }
        items.push(
          <span key="detail" className={activeClass}>
            {currentEvidenceName || "Evidence Detail"}
          </span>
        );
      } else {
        const currentTabLabel = tabs.find(t => t.id === activeTab)?.label || "Page";
        items.push(
          <span key="current" className={activeClass}>
            {currentTabLabel}
          </span>
        );
      }
    }

    return (
      <div className="flex items-center gap-1 overflow-x-auto py-1 whitespace-nowrap scrollbar-none">
        {items}
      </div>
    );
  };

  return (
    <div className="h-screen flex w-full bg-background overflow-hidden">
      {/* ═══════════ SIDEBAR ═══════════ */}
      <aside
        className={`hidden lg:flex flex-col border-r border-border bg-card/50 backdrop-blur-xl transition-all duration-300 relative z-20 ${sidebarCollapsed ? "w-[70px]" : "w-64"
          }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-center border-b border-border">
          {sidebarCollapsed ? (
            <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain shrink-0" />
          ) : (
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain shrink-0" />
              <div>
                <h1 className="font-bold text-lg leading-none text-foreground">EviCheck</h1>
                <p className="text-[10px] text-muted-foreground">Analyst Portal</p>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Snippet */}
        <div className="p-4 border-b border-border/50">
          <div className={`flex items-center gap-3 ${sidebarCollapsed ? "justify-center" : ""}`}>
            <Avatar className="h-9 w-9 ring-2 ring-primary/10">
              {profileImage ? (
                <img src={profileImage} alt="" className="h-full w-full object-cover" />
              ) : (
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {currentUser?.name?.substring(0, 2).toUpperCase() || "AN"}
                </AvatarFallback>
              )}
            </Avatar>
            {!sidebarCollapsed && (
              <div className="overflow-hidden">
                <p className="text-sm font-medium truncate">{getFirstName(currentUser?.name)}</p>
                <p className="text-[10px] text-muted-foreground truncate">{currentUser?.email}</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative ${isActive
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  } ${sidebarCollapsed ? "justify-center px-2" : ""}`}
              >
                <div className="relative shrink-0">
                  <Icon className={`h-4 w-4 ${sidebarCollapsed ? "h-5 w-5" : ""}`} />
                  {'badge' in tab && (tab as {badge?: number}).badge && (tab as {badge?: number}).badge! > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {(tab as {badge?: number}).badge! > 9 ? '9+' : (tab as {badge?: number}).badge}
                    </span>
                  )}
                </div>
                {!sidebarCollapsed && <span className="flex-1 text-left">{tab.label}</span>}
                {!sidebarCollapsed && 'badge' in tab && (tab as {badge?: number}).badge && (tab as {badge?: number}).badge! > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full h-4 px-1.5 flex items-center justify-center min-w-[1rem]">
                    {(tab as {badge?: number}).badge! > 9 ? '9+' : (tab as {badge?: number}).badge}
                  </span>
                )}
                {/* Tooltip for collapsed state */}
                {sidebarCollapsed && (
                  <div className="absolute left-full ml-4 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {tab.label}
                  </div>
                )}
              </button>

            );
          })}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border mt-auto">
          <Button
            variant="ghost"
            className={`w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 ${sidebarCollapsed ? "justify-center px-0" : ""}`}
            onClick={handleLogout}
          >
            <LogOut className={`h-4 w-4 ${!sidebarCollapsed && "mr-2"}`} />
            {!sidebarCollapsed && "Logout"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="absolute -right-3 top-1/2 transform -translate-y-1/2 h-6 w-6 rounded-full border border-border bg-background p-0 shadow-sm z-50 hidden lg:flex"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
          </Button>
        </div>
      </aside>

      {/* ═══════════ MAIN CONTENT ═══════════ */}
      <div className="flex-1 flex flex-col min-w-0 bg-background/95 backdrop-blur-sm">
        {/* Mobile Header */}
        <header className="h-16 border-b border-border flex items-center justify-between px-4 lg:hidden bg-card z-20">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="lg:hidden shrink-0" onClick={() => setIsMobileSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Logo" className="h-5 w-5 object-contain" />
              <span className="font-semibold text-sm text-foreground">EviCheck Analyst</span>
            </div>
          </div>
          <ThemeToggle />
        </header>

        {/* Desktop Header / Breadcrumbs */}
        <header className="hidden lg:flex h-16 border-b border-border items-center justify-between px-8 bg-card/50 backdrop-blur-sm z-10">
          <div className="flex flex-col gap-0.5">
            {renderBreadcrumbs()}
            <p className="text-[11px] text-muted-foreground">
              {activeTab === "evidence-detail" 
                ? "Detailed analysis of forensic evidence" 
                : (tabs.find(t => t.id === activeTab)?.label === "Overview" 
                  ? "System metrics, activity, and overview charts" 
                  : `Manage and analyze your digital evidence: ${tabs.find(t => t.id === activeTab)?.label}`)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)}>
              <Settings className="h-5 w-5 text-muted-foreground" />
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsHelpOpen(true)}>
              <HelpCircle className="h-4 w-4" />
              <span className="hidden xl:inline">Help</span>
            </Button>
          </div>
        </header>

        {/* Chats Tab — full height, no padding */}
        {activeTab === "chats" && currentUser && (
          <div className="flex-1 overflow-hidden">
            <ChatPanel
              currentUserId={currentUser._id || ""}
              currentUserName={currentUser.name}
            />
          </div>
        )}

        {/* All other tabs — scrollable with padding */}
        {activeTab !== "chats" && (
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === "overview" && (
                    <DashboardOverview
                      stats={stats}
                      onNavigate={(tab) => setActiveTab(tab as ActiveTab)}
                    />
                  )}
                  {activeTab === "upload" && (
                    <ImageUpload
                      onNavigateToDetect={(id?: string, type?: string) => {
                        if (id) {
                          setViewingEvidenceId(id);
                          setEvidenceDetailInitialTab(type?.startsWith("video/") ? "video" : "detect");
                          setActiveTab("evidence-detail");
                        }
                      }}
                      preselectedCaseId={preselectedCaseId}
                    />
                  )}
                  {activeTab === "detect" && (
                    <TamperingDetection 
                      preselectedEvidenceId={preselectedEvidenceId} 
                      autoStart={autoStartAnalysis}
                      onAnalysisStarted={() => setAutoStartAnalysis(false)}
                    />
                  )}
                  {activeTab === "metadata" && <MetadataAnalysis preselectedEvidenceId={preselectedEvidenceId} />}
                  {activeTab === "video" && (
                    <VideoDetection 
                      preselectedEvidenceId={preselectedEvidenceId} 
                      autoStart={autoStartAnalysis}
                      onAnalysisStarted={() => setAutoStartAnalysis(false)}
                    />
                  )}
                  {activeTab === "face" && <FaceAnalysis preselectedEvidenceId={preselectedEvidenceId} />}
                  {activeTab === "weapon" && <WeaponDetection preselectedEvidenceId={preselectedEvidenceId} />}
                  {activeTab === "report" && <ReportGeneration />}
                  {activeTab === "evidence-detail" && viewingEvidenceId && (
                    <EvidenceDetail
                      evidenceId={viewingEvidenceId}
                      initialTab={evidenceDetailInitialTab}
                      onBack={() => setActiveTab("records")}
                      onAction={handleEvidenceAction}
                    />
                  )}
                  {activeTab === "records" && (
                    <EvidenceRecords
                      onQuickAdd={(caseId) => {
                        setPreselectedCaseId(caseId);
                        setActiveTab("upload");
                      }}
                      onView={handleViewEvidence}
                    />
                  )}
                  {activeTab === "blockchain" && <BlockchainUpload currentUser={currentUser || undefined} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        )}
      </div>

      {/* ═══════════ SETTINGS SHEET ═══════════ */}
      <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Profile & Settings</SheetTitle>
            <SheetDescription>Manage your profile and account</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-6 pb-6">
            <div className="flex flex-col items-center text-center pb-6 border-b border-border">
              <div className="relative group">
                <Avatar className="h-20 w-20 mb-3 ring-2 ring-primary/20 transition-all group-hover:ring-primary/40">
                  {profileImage ? (
                    <img src={profileImage} alt={currentUser?.name || "User"} className="h-full w-full object-cover rounded-full" />
                  ) : (
                    <AvatarFallback className="text-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {currentUser?.name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "A"}
                    </AvatarFallback>
                  )}
                </Avatar>
                <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-all shadow-lg hover:scale-110 active:scale-95 z-10">
                  <Camera className="h-4 w-4" />
                  <input
                    type="file" accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setIsUploadingPhoto(true);
                        const reader = new FileReader();
                        reader.onloadend = async () => {
                          const result = reader.result as string;
                          try {
                            const res = await fetch('/api/user/profile', {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ profileImage: result })
                            });
                            if (res.ok) {
                              setProfileImage(result);
                              // Cache in localStorage as fallback
                              if (currentUser?._id || currentUser?.email) {
                                localStorage.setItem(`profileImage_${currentUser._id || currentUser.email}`, result);
                              }
                            } else {
                              console.error("Failed to upload profile photo to API");
                            }
                          } catch (e) {
                            console.error("Failed to upload profile photo to API:", e);
                          }
                          setIsUploadingPhoto(false);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden" disabled={isUploadingPhoto}
                  />
                </label>
                {isUploadingPhoto && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
                    <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <h2 className="text-lg font-bold text-foreground">{currentUser?.name || "Analyst"}</h2>
              <p className="text-xs text-muted-foreground mt-1">{currentUser?.email || ""}</p>
              <Badge variant="outline" className="mt-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                {currentUser?.userType || "analyst"}
              </Badge>
            </div>
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">Menu</h3>
              <div className="space-y-1.5">
                <Button variant="outline" className="w-full justify-start hover:bg-primary/10" asChild onClick={() => setIsSettingsOpen(false)}>
                  <Link href="/profile"><User className="h-4 w-4 mr-2" />Profile</Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => { setIsSettingsOpen(false); setIsAppSettingsOpen(true); }}>
                  <Settings className="h-4 w-4 mr-2" />Preferences
                </Button>
                <Button variant="outline" className="w-full justify-start"><Bell className="h-4 w-4 mr-2" />Notifications</Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => { setIsSettingsOpen(false); setIsHelpOpen(true); }}>
                  <HelpCircle className="h-4 w-4 mr-2" />Help & Support
                </Button>
              </div>
            </div>
            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="font-semibold text-foreground">Appearance</h3>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-foreground">Theme</span>
                <ThemeToggle />
              </div>
            </div>
            <div className="pt-4 border-t border-border">
              <Button variant="destructive" className="w-full" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />Logout
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ═══════════ APPLICATION SETTINGS SHEET ═══════════ */}
      <Sheet open={isAppSettingsOpen} onOpenChange={setIsAppSettingsOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto custom-scrollbar">
          <SheetHeader className="mb-6 border-b pb-4">
            <SheetTitle className="flex items-center gap-2 text-2xl">
              <Settings className="h-6 w-6 text-primary" />
              Application Preferences
            </SheetTitle>
            <SheetDescription>
              Configure your local evidence, blockchain network, and interface.
            </SheetDescription>
          </SheetHeader>
          
          <div className="space-y-8">
            {/* Blockchain Network Settings */}
            <section className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <LinkIcon className="h-5 w-5 text-primary" /> Web3 & Network
              </h3>
              <div className="space-y-4 text-sm mt-2">
                <div className="bg-muted/50 p-4 rounded-lg border">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold">RPC Network Endpoint</h4>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Connected</Badge>
                  </div>
                  <input type="text" disabled value="http://127.0.0.1:8545" className="w-full p-2 rounded-md bg-background border text-muted-foreground text-xs font-mono" />
                  <p className="text-xs text-muted-foreground mt-2">Target chain ID used for evidence preservation transactions.</p>
                </div>
                
                <div className="bg-muted/50 p-4 rounded-lg border">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold">Local IPFS Gateway</h4>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Daemon Up</Badge>
                  </div>
                  <input type="text" disabled value="http://127.0.0.1:5001" className="w-full p-2 rounded-md bg-background border text-muted-foreground text-xs font-mono" />
                </div>
              </div>
            </section>

            {/* Application Data & Privacy */}
            <section className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" /> Data Management
              </h3>
              
              <div className="bg-destructive/5 p-4 rounded-lg border border-destructive/20 border-l-4 border-l-destructive">
                <h4 className="font-semibold text-destructive flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4" /> Reset Evidence Storage
                </h4>
                <p className="text-xs text-muted-foreground mb-4">
                  This will completely wipe your local instance of uploaded evidence, generated reports, and cached results. Blockchain preservation data remains on-chain.
                </p>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    if (confirm("Are you sure you want to completely erase all local mock evidence? This cannot be undone.")) {
                      Object.keys(localStorage).forEach(key => {
                        if (key.startsWith('evidenceStorage_') || key.startsWith('casesStorage_')) {
                          localStorage.removeItem(key);
                        }
                      });
                      window.location.reload();
                    }
                  }}
                  className="w-full sm:w-auto"
                >
                  Clear Local Storage Cache
                </Button>
              </div>
            </section>

            {/* UI Settings */}
            <section className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <LayoutDashboard className="h-5 w-5 text-primary" /> Interface Options
              </h3>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
                <div>
                  <h4 className="font-semibold text-sm">Color Theme</h4>
                  <p className="text-xs text-muted-foreground">Toggle between Light, Dark, or System visual scheme.</p>
                </div>
                <ThemeToggle />
              </div>
            </section>

          </div>
        </SheetContent>
      </Sheet>

      {/* ═══════════ MOBILE SIDEBAR ═══════════ */}
      <Sheet open={isHelpOpen} onOpenChange={setIsHelpOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto custom-scrollbar">
          <SheetHeader className="mb-6 border-b pb-4">
            <SheetTitle className="flex items-center gap-2 text-2xl">
              <Shield className="h-6 w-6 text-primary" />
              EviCheck Help & Support
            </SheetTitle>
            <SheetDescription>
              A quick guide to using the EviCheck Analyst platform.
            </SheetDescription>
          </SheetHeader>
          
          <div className="space-y-8">
            {/* About Section */}
            <section className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> About EviCheck
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                EviCheck is a state-of-the-art digital forensics tool designed for analysts to verify evidence authenticity. 
                Our platform provides advanced algorithms to detect deepfakes, analyze image metadata, perform facial recognition, and secure critical evidence on a blockchain ledger.
              </p>
              <div className="flex gap-2">
                <Badge variant="outline">Version 1.0.0</Badge>
                <Badge variant="secondary">Analyst Portal</Badge>
              </div>
            </section>

            {/* How to use */}
            <section className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" /> Using the Modules
              </h3>
              
              <div className="space-y-4 text-sm mt-2">
                <div className="bg-muted/50 p-3 rounded-lg border">
                  <h4 className="font-semibold flex items-center gap-2 mb-1"><Upload className="h-4 w-4" /> 1. Upload Evidence</h4>
                  <p className="text-muted-foreground">Start by uploading media (images or videos). Once uploaded, the evidence is isolated and waiting for module analysis.</p>
                </div>
                
                <div className="bg-muted/50 p-3 rounded-lg border">
                  <h4 className="font-semibold flex items-center gap-2 mb-1"><AlertTriangle className="h-4 w-4" /> 2. Tampering Detection</h4>
                  <p className="text-muted-foreground">Run the AI models to scan for visual inconsistencies, GAN artifacts, and manipulation. The system will categorize it as Authentic or Tampered.</p>
                </div>

                <div className="bg-muted/50 p-3 rounded-lg border">
                  <h4 className="font-semibold flex items-center gap-2 mb-1"><FileSearch className="h-4 w-4" /> 3. Metadata Analysis</h4>
                  <p className="text-muted-foreground">Extract EXIF data to view the timestamp, geolocation, and camera model. A map is automatically generated based on GPS coordinates.</p>
                </div>

                <div className="bg-muted/50 p-3 rounded-lg border">
                  <h4 className="font-semibold flex items-center gap-2 mb-1"><Fingerprint className="h-4 w-4" /> 4. Face Match DB</h4>
                  <p className="text-muted-foreground">Upload suspected faces to find a match against our existing facial recognition database. View distance thresholds to gauge accuracy.</p>
                </div>

                <div className="bg-muted/50 p-3 rounded-lg border">
                  <h4 className="font-semibold flex items-center gap-2 mb-1"><LinkIcon className="h-4 w-4" /> 5. Blockchain Preservation</h4>
                  <p className="text-muted-foreground">Store crucial authentic evidence on the permanent IPFS blockchain ledger. This cryptographically secures the file hash against future tampering.</p>
                </div>
              </div>
            </section>

            {/* Support */}
            <section className="space-y-3 pt-4 border-t">
              <h3 className="text-lg font-semibold">Need more help?</h3>
              <p className="text-sm text-muted-foreground">
                If you encounter bugs, false positives, or blockchain connection issues, please report them directly to the administration.
              </p>
              <Button className="w-full mt-2" variant="outline" asChild>
                <a href="mailto:support@evicheck.com">Contact IT Support</a>
              </Button>
            </section>
          </div>
        </SheetContent>
      </Sheet>

      {/* ═══════════ MOBILE SIDEBAR ═══════════ */}
      <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
        <SheetContent side="left" className="w-[260px] p-0">
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-border bg-muted/20">
              <div className="flex items-center gap-2 mb-4">
                <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain shrink-0" />
                <span className="font-bold text-lg text-foreground">EviCheck</span>
              </div>
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 ring-2 ring-primary/20">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="h-full w-full object-cover rounded-full" />
                  ) : (
                    <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {currentUser?.name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "A"}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground text-sm truncate">{currentUser?.name || "Analyst"}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{currentUser?.email || ""}</p>
                </div>
              </div>
            </div>
            <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setIsMobileSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all ${isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="p-4 border-t border-border">
              <Button variant="ghost" className="w-full justify-start text-destructive hover:bg-destructive/10" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />Logout
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

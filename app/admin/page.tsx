"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Users, UserCheck, Clock, Shield, Settings, LogOut, Search, MoreVertical,
  Mail, Calendar, Menu, User, Bell, HelpCircle, Camera, FileText, X,
  CheckCircle2, Download, Eye, MessageSquare, Send, ChevronLeft, ChevronRight,
  LayoutDashboard, Flag,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/theme-toggle";
import ChatPanel from "@/components/analyst/chat-panel";
import AdminSidebar from "@/components/admin/admin-sidebar";
import { OverviewTab, UsersTab, NotificationsTab, FlaggedTab } from "@/components/admin/admin-tabs";
import type { AdminUser, AdminNotification, AdminFlaggedReport } from "@/lib/types/admin";
import EvidenceRecords from "@/components/analyst/evidence-records";
import EvidenceDetail from "@/components/analyst/evidence-detail";


const isUserOnline = (lastLogin: string | Date | undefined): boolean => {
  if (!lastLogin) return false;
  return (Date.now() - new Date(lastLogin).getTime()) / (1000 * 60) < 15;
};


export default function AdminPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("analyst");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [flaggedReports, setFlaggedReports] = useState<AdminFlaggedReport[]>([]);
  const [chatWith, setChatWith] = useState<AdminUser | null>(null);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview'|'users'|'notifications'|'flagged'|'chats'|'settings'|'records'|'evidence-detail'>('overview');
  const [viewingEvidenceId, setViewingEvidenceId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
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

  // Clear chat badge immediately when Chats tab is opened
  const handleSetActiveTab = (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (tab === 'chats') setChatUnreadCount(0);
  };

  const loadNotifications = async () => {
    try {
      const res = await fetch('/api/admin/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      // Fallback to localStorage if API unavailable (e.g. not yet an admin)
      const saved = localStorage.getItem('adminNotifications');
      if (saved) setNotifications(JSON.parse(saved));
    }
    // Flagged reports remain in localStorage (local-only admin action)
    const savedFlagged = localStorage.getItem('adminFlaggedReports');
    if (savedFlagged) setFlaggedReports(JSON.parse(savedFlagged));
  };

  const flagReport = (notification: AdminNotification) => {
    if (!notification.reportData) return;
    if (flaggedReports.find(r => r.reportId === notification.reportId)) return;
    const flagged: AdminFlaggedReport = {
      id: `flag_${Date.now()}`,
      reportId: notification.reportId || notification.id,
      evidenceName: notification.reportData.evidenceName,
      status: notification.reportData.status,
      confidence: notification.reportData.confidence,
      generatedBy: notification.reportData.generatedBy || { name: 'Unknown', email: '' },
      flaggedAt: new Date().toISOString(),
      reason: 'Flagged by admin for review',
      reportData: notification.reportData,
      fullReport: notification.fullReport,
    };
    const updated = [flagged, ...flaggedReports];
    setFlaggedReports(updated);
    localStorage.setItem('adminFlaggedReports', JSON.stringify(updated));
  };

  const removeFlaggedReport = (id: string) => {
    const updated = flaggedReports.filter(r => r.id !== id);
    setFlaggedReports(updated);
    localStorage.setItem('adminFlaggedReports', JSON.stringify(updated));
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users.map((user: AdminUser) => ({
          ...user,
          status: isUserOnline(user.lastLogin) ? 'online' : 'offline',
        })));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
          if (data.user.profileImage) setProfileImage(data.user.profileImage);
          if (data.user.userType !== 'admin') router.push('/login');
        } else {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            setCurrentUser(user);
            const savedImage = localStorage.getItem(`profileImage_${user._id || user.email}`);
            if (savedImage) setProfileImage(savedImage);
            if (user.userType !== 'admin') router.push('/login');
          } else {
            router.push('/login');
          }
        }
      } catch (err) { console.error("Profile fetch error:", err); }
    };
    fetchProfile();
    fetchUsers();
    loadNotifications();
    // Poll notifications from DB every 10 s
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, [router]);

  // Poll chat unread count for admin sidebar badge
  useEffect(() => {
    const pollChatUnread = async () => {
      try {
        const res = await fetch('/api/messages?action=unread');
        if (res.ok) {
          const data = await res.json();
          // Only update if not on chats tab (to avoid flicker)
          setChatUnreadCount(prev => {
            const newCount = data.count || 0;
            return newCount;
          });
        }
      } catch { /* silent */ }
    };
    pollChatUnread();
    const chatInterval = setInterval(pollChatUnread, 5000);
    return () => clearInterval(chatInterval);
  }, []);

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      if (res.ok) {
        setUsers(users.filter(u => u._id !== userId));
        if (selectedUser?._id === userId) setSelectedUser(null);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete user");
      }
    } catch (err) { console.error("Delete user error:", err); }
  };

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    await fetch('/api/admin/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark_read', id }),
    }).catch(console.error);
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    await fetch('/api/admin/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark_all_read' }),
    }).catch(console.error);
  };

  const archiveNotification = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true, archived: true } : n));
    await fetch('/api/admin/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'archive', id }),
    }).catch(console.error);
  };

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch (e) { console.error(e); }
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const result = reader.result as string;
      try {
        const res = await fetch('/api/user/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profileImage: result }) });
        if (res.ok) {
          setProfileImage(result);
          if (currentUser?._id || currentUser?.email) localStorage.setItem(`profileImage_${currentUser._id || currentUser.email}`, result);
        }
      } catch (e) { console.error(e); }
      setIsUploadingPhoto(false);
    };
    reader.readAsDataURL(file);
  };

  const getFirstName = (name: string | undefined) => name ? name.split(' ')[0] : 'Admin';
  const onlineUsers = users.filter(u => u.status === "online").length;
  const totalUsers = users.length;
  const unreadCount = notifications.filter(n => !n.read).length;

  const stats = [
    { title: "Total Users", value: totalUsers, icon: Users, color: "text-blue-600 dark:text-blue-400" },
    { title: "Online Now", value: onlineUsers, icon: UserCheck, color: "text-green-600 dark:text-green-400" },
    { title: "Active Today", value: onlineUsers + 1, icon: Clock, color: "text-orange-600 dark:text-orange-400" },
    { title: "Admins", value: users.filter(u => u.userType === "admin").length, icon: Shield, color: "text-red-600 dark:text-red-400" },
  ];

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      <AdminSidebar
        currentUser={currentUser}
        profileImage={profileImage}
        activeTab={activeTab}
        setActiveTab={handleSetActiveTab}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        isMobileSidebarOpen={isMobileSidebarOpen}
        setIsMobileSidebarOpen={setIsMobileSidebarOpen}
        unreadCount={unreadCount}
        flaggedCount={flaggedReports.length}
        totalUsers={totalUsers}
        chatUnreadCount={chatUnreadCount}
        isUploadingPhoto={isUploadingPhoto}
        onPhotoChange={handlePhotoChange}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-border bg-card/50 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-bold text-lg text-foreground leading-tight">
                {activeTab === 'overview' ? `Welcome back, ${getFirstName(currentUser?.name)} 👋` :
                 activeTab === 'users' ? 'User Management' :
                 activeTab === 'notifications' ? 'Notifications' :
                 activeTab === 'flagged' ? 'Flagged Reports' :
                 activeTab === 'records' ? 'Evidence Records' :
                 activeTab === 'evidence-detail' ? 'Evidence Details' :
                 activeTab === 'chats' ? 'Team Chat' : 'Settings'}
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                {activeTab === 'overview' ? 'System overview and quick actions' :
                 activeTab === 'users' ? `${totalUsers} registered users` :
                 activeTab === 'notifications' ? `${unreadCount} unread notifications` :
                 activeTab === 'flagged' ? `${flaggedReports.length} reports flagged for review` :
                 activeTab === 'records' ? 'View and search case evidence records' :
                 activeTab === 'evidence-detail' ? 'Detailed forensic visualization' :
                 activeTab === 'chats' ? 'Chat with your team' : 'Profile and preferences'}
              </p>
              {activeTab === 'overview' && currentTime && (
                <p className="text-[10px] font-mono text-muted-foreground/80 mt-1 flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {currentTime}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="relative" onClick={() => setActiveTab('notifications')}>
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </Button>
            <div className="relative cursor-pointer" onClick={() => setActiveTab('settings')}>
              <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                {profileImage
                  ? <img src={profileImage} alt="Profile" className="h-full w-full object-cover rounded-full" />
                  : <AvatarFallback className="bg-gradient-to-br from-red-500 to-orange-600 text-white text-xs font-bold">{currentUser?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'A'}</AvatarFallback>}
              </Avatar>
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
            </div>
          </div>
        </header>

        {activeTab === 'chats' && currentUser && (
          <div className="flex-1 overflow-hidden">
            <ChatPanel currentUserId={currentUser._id || ''} currentUserName={currentUser.name} />
          </div>
        )}

        {activeTab !== 'chats' && (
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {activeTab === 'overview' && (
              <OverviewTab stats={stats} unreadCount={unreadCount} flaggedCount={flaggedReports.length} totalUsers={totalUsers} onNavigate={(tab) => setActiveTab(tab as typeof activeTab)} />
            )}
            {activeTab === 'users' && (
              <UsersTab
                users={users} isLoading={isLoading}
                searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                filterType={filterType} setFilterType={setFilterType}
                selectedUser={selectedUser} setSelectedUser={setSelectedUser}
                onViewProfile={(u) => router.push(`/profile?viewUser=${u._id || u.email}`)}
                onMessageUser={(u) => { setChatWith(u); setActiveTab('chats'); }}
                onDeleteUser={handleDeleteUser}
                currentUserId={currentUser?._id}
              />
            )}
            {activeTab === 'notifications' && (
              <NotificationsTab notifications={notifications} onMarkRead={markAsRead} onMarkAllRead={markAllAsRead} onFlag={flagReport} onDismiss={archiveNotification} />
            )}
            {activeTab === 'flagged' && (
              <FlaggedTab flaggedReports={flaggedReports} onRemove={removeFlaggedReport} />
            )}
            {activeTab === 'records' && (
              <EvidenceRecords
                onView={(evidenceId) => {
                  setViewingEvidenceId(evidenceId);
                  setActiveTab('evidence-detail');
                }}
              />
            )}
            {activeTab === 'evidence-detail' && viewingEvidenceId && (
              <EvidenceDetail
                evidenceId={viewingEvidenceId}
                onBack={() => setActiveTab('records')}
                onAction={(action, id) => {}}
              />
            )}
            {activeTab === 'settings' && (
              <div className="max-w-md mx-auto">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Settings</CardTitle>
                    <CardDescription>Manage your admin profile</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="relative shrink-0">
                        <Avatar className="h-20 w-20 ring-2 ring-border">
                          {profileImage
                            ? <img src={profileImage} alt="Profile" className="h-full w-full object-cover rounded-full" />
                            : <AvatarFallback className="bg-gradient-to-br from-red-500 to-orange-600 text-white text-2xl font-bold">{currentUser?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'A'}</AvatarFallback>}
                        </Avatar>
                        <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 shadow-lg">
                          <Camera className="h-4 w-4" />
                          <input type="file" accept="image/*" className="hidden" disabled={isUploadingPhoto} onChange={handlePhotoChange} />
                        </label>
                      </div>
                      <div>
                        <p className="font-bold text-lg">{currentUser?.name}</p>
                        <p className="text-sm text-muted-foreground">{currentUser?.email}</p>
                        <Badge variant="outline" className="mt-1 bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 text-xs">Administrator</Badge>
                      </div>
                    </div>
                    <div className="pt-2 border-t space-y-2">
                      <Button variant="outline" className="w-full" onClick={() => router.push('/profile')}>
                        <User className="h-4 w-4 mr-2" />View Full Profile
                      </Button>
                      <Button variant="destructive" className="w-full" onClick={handleLogout}>
                        <LogOut className="h-4 w-4 mr-2" />Sign Out
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </main>
        )}
      </div>
    </div>
  );
}

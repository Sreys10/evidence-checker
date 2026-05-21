"use client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Bell, MessageSquare, Settings, LogOut, User, ChevronLeft, ChevronRight, LayoutDashboard, Flag, Camera } from "lucide-react";
import Link from "next/link";

type AdminTab = 'overview'|'users'|'notifications'|'flagged'|'chats'|'settings';

interface AdminSidebarProps {
  currentUser: {_id?:string;name:string;email:string} | null;
  profileImage: string | null;
  activeTab: AdminTab;
  setActiveTab: (t: AdminTab) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (v: boolean) => void;
  unreadCount: number;
  flaggedCount: number;
  totalUsers: number;
  chatUnreadCount: number;
  isUploadingPhoto: boolean;
  onPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLogout: () => void;
}

const tabs = [
  { id: 'overview' as AdminTab, label: 'Overview', icon: LayoutDashboard },
  { id: 'users' as AdminTab, label: 'Users', icon: Users, badgeKey: 'totalUsers' },
  { id: 'notifications' as AdminTab, label: 'Notifications', icon: Bell, badgeKey: 'unreadCount' },
  { id: 'flagged' as AdminTab, label: 'Flagged Reports', icon: Flag, badgeKey: 'flaggedCount' },
  { id: 'chats' as AdminTab, label: 'Team Chat', icon: MessageSquare, badgeKey: 'chatUnreadCount' },
  { id: 'settings' as AdminTab, label: 'Settings', icon: Settings },
];

export default function AdminSidebar({
  currentUser, profileImage, activeTab, setActiveTab,
  sidebarCollapsed, setSidebarCollapsed, isMobileSidebarOpen,
  setIsMobileSidebarOpen, unreadCount, flaggedCount, totalUsers, chatUnreadCount,
  isUploadingPhoto, onPhotoChange, onLogout
}: AdminSidebarProps) {
  const badges: Record<string, number> = { unreadCount, flaggedCount, totalUsers, chatUnreadCount };
  const initials = currentUser?.name?.split(' ').map(n=>n[0]).join('').toUpperCase() || 'A';

  return (
    <>
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setIsMobileSidebarOpen(false)} />
      )}
      <aside className={`${sidebarCollapsed ? 'w-16' : 'w-64'} fixed md:relative h-full z-40 flex flex-col border-r border-border bg-card transition-all duration-300 ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        {/* Brand */}
        <div className={`flex items-center h-16 px-4 border-b border-border gap-2 ${sidebarCollapsed ? 'justify-center px-2' : ''}`}>
          {!sidebarCollapsed && <>
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shrink-0">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm text-foreground">EviCheck</p>
              <Badge className="text-[9px] h-4 bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 border px-1.5">Admin Portal</Badge>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setSidebarCollapsed(true)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </>}
          {sidebarCollapsed && <>
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
          </>}
        </div>

        {/* Expand button when collapsed */}
        {sidebarCollapsed && (
          <div className="flex justify-center pt-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSidebarCollapsed(false)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Profile snippet */}
        {!sidebarCollapsed && (
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <Avatar className="h-9 w-9 ring-2 ring-primary/20">
                  {profileImage
                    ? <img src={profileImage} alt="profile" className="h-full w-full object-cover rounded-full" />
                    : <AvatarFallback className="bg-gradient-to-br from-red-500 to-orange-600 text-white text-xs font-bold">{initials}</AvatarFallback>}
                </Avatar>
                <label className="absolute -bottom-1 -right-1 h-5 w-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 shadow">
                  <Camera className="h-2.5 w-2.5" />
                  <input type="file" accept="image/*" className="hidden" disabled={isUploadingPhoto} onChange={onPhotoChange} />
                </label>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate text-foreground">{currentUser?.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{currentUser?.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const badge = tab.badgeKey ? badges[tab.badgeKey] : 0;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setIsMobileSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative ${isActive ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-muted hover:text-foreground'} ${sidebarCollapsed ? 'justify-center' : ''}`}
              >
                <div className="relative shrink-0">
                  <Icon className="h-4 w-4" />
                  {badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </div>
                {!sidebarCollapsed && <span className="flex-1 text-left">{tab.label}</span>}
                {!sidebarCollapsed && badge > 0 && (
                  <span className={`text-[10px] font-bold rounded-full h-4 min-w-[1rem] px-1 flex items-center justify-center ${isActive ? 'bg-white/20 text-white' : 'bg-red-500/15 text-red-600 dark:text-red-400'}`}>
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
                {sidebarCollapsed && (
                  <div className="absolute left-full ml-3 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {tab.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className={`p-2 border-t border-border space-y-0.5 ${sidebarCollapsed ? 'px-2' : 'px-2'}`}>
          <Link href="/profile">
            <button className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-all ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <User className="h-4 w-4 shrink-0" />
              {!sidebarCollapsed && <span>My Profile</span>}
            </button>
          </Link>
          <button onClick={onLogout} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <LogOut className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

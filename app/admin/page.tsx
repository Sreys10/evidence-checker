"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { 
  Users, 
  UserCheck, 
  Clock, 
  Shield, 
  Settings, 
  LogOut,
  Search,
  MoreVertical,
  Mail,
  Calendar,
  Menu,
  User,
  Bell,
  HelpCircle,
  Camera,
  FileText,
  X,
  CheckCircle2,
  Download,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/theme-toggle";

// User interface matching the database
interface User {
  _id?: string;
  name: string;
  email: string;
  userType: "admin" | "analyst" | "verifier" | "guest";
  lastLogin?: string | Date;
  createdAt?: string | Date;
  status?: "online" | "offline";
}

// Notification interface
interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  reportId?: string;
  reportData?: {
    fileName: string;
    evidenceName: string;
    status: "authentic" | "tampered";
    confidence: number;
    generatedDate: string;
    format?: "PDF" | "HTML";
    generatedBy?: {
      name: string;
      email: string;
    };
  };
  fullReport?: {
    id: string;
    fileName: string;
    evidenceName: string;
    imageData: string;
    generatedDate: string;
    generatedBy: {
      name: string;
      email: string;
    };
    status: "authentic" | "tampered";
    confidence: number;
    analysis?: {
      pixelAnalysis: number;
      metadataAnalysis: number;
      compressionAnalysis: number;
      overallScore: number;
    };
    metadata?: {
      camera?: string;
      date?: string;
      location?: string;
      software?: string;
    };
    anomalies?: string[];
  };
  timestamp: string;
  read: boolean;
}

// Helper function to format time ago
const getTimeAgo = (date: string | Date | undefined): string => {
  if (!date) return "Never";
  const now = new Date();
  const loginDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - loginDate.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  return `${Math.floor(diffInSeconds / 86400)} days ago`;
};

// Helper function to determine if user is online (logged in within last 15 minutes)
const isUserOnline = (lastLogin: string | Date | undefined): boolean => {
  if (!lastLogin) return false;
  const now = new Date();
  const loginDate = new Date(lastLogin);
  const diffInMinutes = (now.getTime() - loginDate.getTime()) / (1000 * 60);
  return diffInMinutes < 15;
};

const getUserTypeColor = (userType: string) => {
  switch (userType) {
    case "admin":
      return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
    case "analyst":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
    case "verifier":
      return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20";
    case "guest":
      return "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20";
    default:
      return "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20";
  }
};

export default function AdminPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const loadNotifications = () => {
    const savedNotifications = localStorage.getItem('adminNotifications');
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    }
  };

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
      
      // Redirect if not admin
      if (user.userType !== 'admin') {
        router.push('/login');
        return;
      }
    } else {
      router.push('/login');
      return;
    }

    // Fetch all users
    fetchUsers();
    
    // Load notifications
    loadNotifications();
    
    // Listen for new notifications
    const handleNotificationStorageChange = (e: StorageEvent) => {
      if (e.key === 'adminNotifications') {
        loadNotifications();
      }
    };
    window.addEventListener('storage', handleNotificationStorageChange);
    
    // Also check for changes in the same window
    const notificationInterval = setInterval(() => {
      loadNotifications();
    }, 1000);
    
    // Listen for profile image updates
    const handleImageStorageChange = () => {
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
    
    window.addEventListener('storage', handleImageStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleNotificationStorageChange);
      window.removeEventListener('storage', handleImageStorageChange);
      clearInterval(interval);
      clearInterval(notificationInterval);
    };
  }, [router, profileImage]);

  const markAsRead = (notificationId: string) => {
    const updated = notifications.map((n) =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    setNotifications(updated);
    localStorage.setItem('adminNotifications', JSON.stringify(updated));
  };

  const markAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem('adminNotifications', JSON.stringify(updated));
  };

  const deleteNotification = (notificationId: string) => {
    const updated = notifications.filter((n) => n.id !== notificationId);
    setNotifications(updated);
    localStorage.setItem('adminNotifications', JSON.stringify(updated));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        // Map users to include status based on lastLogin
        const usersWithStatus = data.users.map((user: User) => ({
          ...user,
          status: isUserOnline(user.lastLogin) ? 'online' : 'offline',
        }));
        setUsers(usersWithStatus);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  // Get first name only
  const getFirstName = (fullName: string | undefined) => {
    if (!fullName) return 'User';
    return fullName.split(' ')[0];
  };

  const onlineUsers = users.filter((u) => u.status === "online").length;
  const totalUsers = users.length;

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === "all" || user.userType === filterType;
    return matchesSearch && matchesFilter;
  });

  const stats = [
    {
      title: "Total Users",
      value: totalUsers,
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Online Now",
      value: onlineUsers,
      icon: UserCheck,
      color: "text-green-600 dark:text-green-400",
    },
    {
      title: "Active Today",
      value: onlineUsers + 1,
      icon: Clock,
      color: "text-orange-600 dark:text-orange-400",
    },
    {
      title: "Admins",
      value: users.filter((u) => u.userType === "admin").length,
      icon: Shield,
      color: "text-red-600 dark:text-red-400",
    },
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
                  {currentUser ? `Hi ${getFirstName(currentUser.name)}, welcome back! 👋` : 'Admin Dashboard'}
              </h1>
                <p className="text-muted-foreground mt-1 text-sm md:text-base">Manage users and system settings</p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsNotificationOpen(true)}
                className="relative hover:bg-primary/10"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
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

      {/* Notifications Panel */}
      <Sheet open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle>Notifications</SheetTitle>
                <SheetDescription>
                  Reports and updates from analysts
                </SheetDescription>
              </div>
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  Mark all as read
                </Button>
              )}
            </div>
          </SheetHeader>
          
          <div className="mt-6 space-y-4 pb-6">
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`border rounded-lg p-4 transition-all ${
                    notification.read
                      ? 'border-border bg-muted/30'
                      : 'border-primary/50 bg-primary/5 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold text-foreground text-sm">
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <div className="h-2 w-2 bg-primary rounded-full" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      {notification.reportData && (
                        <div className="mt-3 p-3 bg-background rounded border border-border">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                            <FileText className="h-3 w-3" />
                            <span>Report Details</span>
                          </div>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Evidence:</span>
                              <span className="text-foreground font-medium">
                                {notification.reportData.evidenceName}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Status:</span>
                              <Badge
                                variant={
                                  notification.reportData.status === "authentic"
                                    ? "default"
                                    : "destructive"
                                }
                                className="text-xs"
                              >
                                {notification.reportData.status}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Confidence:</span>
                              <span className="text-foreground font-medium">
                                {notification.reportData.confidence.toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Analyst:</span>
                              <span className="text-foreground font-medium">
                                {notification.reportData.generatedBy?.name || 'Unknown'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(notification.timestamp).toLocaleString()}
                      </p>
                      {notification.fullReport && (
                        <div className="mt-3 flex gap-2 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => {
                              // Import and use downloadReport function
                              import('@/lib/report-generator').then(({ downloadReport }) => {
                                downloadReport(notification.fullReport!, notification.reportData?.format || "PDF");
                              });
                            }}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download {notification.reportData?.format || "PDF"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => {
                              // Open report in new window for viewing
                              import('@/lib/report-generator').then(({ generateHTMLReport }) => {
                                const htmlContent = generateHTMLReport(notification.fullReport!);
                                const printWindow = window.open('', '_blank');
                                if (printWindow) {
                                  printWindow.document.write(htmlContent);
                                  printWindow.document.close();
                                }
                              });
                            }}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View Report
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => markAsRead(notification.id)}
                          title="Mark as read"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => deleteNotification(notification.id)}
                        title="Delete"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

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
                    <AvatarFallback className="text-xl bg-gradient-to-br from-red-500 to-orange-600 text-white">
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
              <h2 className="text-lg font-bold text-foreground">{getFirstName(currentUser?.name) || "Admin"}</h2>
              <p className="text-xs text-muted-foreground mt-1">{currentUser?.email || ""}</p>
              <Badge variant="outline" className="mt-2 bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">
                {currentUser?.userType || "admin"}
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
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Users List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Users</CardTitle>
                    <CardDescription>
                      Manage and view all registered users
                    </CardDescription>
                  </div>
                </div>
                {/* Search and Filter */}
                <div className="flex gap-3 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="all">All Types</option>
                    <option value="admin">Admin</option>
                    <option value="analyst">Analyst</option>
                    <option value="verifier">Verifier</option>
                    <option value="guest">Guest</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground">Loading users...</div>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground">No users found</div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredUsers.map((user, index) => (
                      <motion.div
                        key={user._id || index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <div
                          className={`p-4 border border-border rounded-lg cursor-pointer transition-all hover:bg-accent/50 ${
                            selectedUser?._id === user._id ? "bg-accent border-primary" : ""
                          }`}
                          onClick={() => setSelectedUser(user)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <Avatar>
                                  <AvatarFallback>
                                    {user.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </AvatarFallback>
                                </Avatar>
                                {user.status === "online" && (
                                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-foreground">{user.name}</h3>
                                  <Badge
                                    variant="outline"
                                    className={`${getUserTypeColor(user.userType)} text-xs`}
                                  >
                                    {user.userType}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Last login: {getTimeAgo(user.lastLogin)}
                                </p>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* User Profile Sidebar */}
          <div className="lg:col-span-1">
            {selectedUser ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>User Profile</CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedUser(null)}
                      >
                        ×
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Avatar and Basic Info */}
                    <div className="flex flex-col items-center text-center">
                      <Avatar className="h-24 w-24 mb-4">
                        <AvatarFallback className="text-2xl">
                          {selectedUser.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <h2 className="text-xl font-bold text-foreground">{selectedUser.name}</h2>
                      <p className="text-muted-foreground">{selectedUser.email}</p>
                      <Badge
                        variant="outline"
                        className={`${getUserTypeColor(selectedUser.userType)} mt-2`}
                      >
                        {selectedUser.userType}
                      </Badge>
                      <div className="mt-2">
                        <Badge
                          variant={selectedUser.status === "online" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {selectedUser.status === "online" ? "● Online" : "○ Offline"}
                        </Badge>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-foreground">Contact Information</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span>{selectedUser.email}</span>
                      </div>
                    </div>

                    {/* Activity Information */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-foreground">Activity</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Last login: {getTimeAgo(selectedUser.lastLogin)}</span>
                      </div>
                      {selectedUser.createdAt && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>Joined: {new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t border-border">
                      <div className="flex flex-col gap-2">
                        <Button variant="outline" className="w-full">
                          View Full Profile
                        </Button>
                        <Button variant="outline" className="w-full">
                          Edit User
                        </Button>
                        <Button variant="destructive" className="w-full">
                          Suspend User
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Select a user from the list to view their profile
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


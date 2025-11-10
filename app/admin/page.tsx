"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Calendar
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

  useEffect(() => {
    // Get current user from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
      
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
  }, [router]);

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
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {currentUser ? `Hi ${currentUser.name}, welcome back!` : 'Admin Dashboard'}
              </h1>
              <p className="text-muted-foreground mt-1">Manage users and system settings</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" asChild>
                <Link href="/">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

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


"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  User,
  Mail,
  Shield,
  Camera,
  ArrowLeft,
  Edit2,
  X,
  Check,
  MessageSquare,
  Send,
  Crown,
  Clock,
} from "lucide-react";
import Link from "next/link";
import ThemeToggle from "@/components/theme-toggle";

interface UserProfile {
  _id?: string;
  name: string;
  email: string;
  userType: "admin" | "analyst" | "verifier" | "guest";
  lastLogin?: string | Date;
  createdAt?: string | Date;
  profileImage?: string;
}

interface AdminInfo {
  _id: string;
  name: string;
  email: string;
  profileImage?: string | null;
}

interface Message {
  id?: string;
  fromUserId: string;
  toUserId: string;
  message: string;
  createdAt?: string;
  fromName?: string;
  fromUserType?: string;
}

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewUserId = searchParams.get('viewUser');
  const isAdminViewing = Boolean(viewUserId);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      if (viewUserId) {
        try {
          const res = await fetch('/api/users');
          if (res.ok) {
            const data = await res.json();
            const found = data.users.find((u: UserProfile) =>
              u._id === viewUserId || u.email === viewUserId
            );
            if (found) {
              setCurrentUser(found);
              setFormData({ name: found.name || '', email: found.email || '' });
              if (found.profileImage) setProfileImage(found.profileImage);
              else {
                const savedImage = localStorage.getItem(`profileImage_${found._id || found.email}`);
                if (savedImage) setProfileImage(savedImage);
              }
              return;
            }
          }
        } catch (err) {
          console.error('Error loading user for admin view:', err);
        }
      }
      // Normal self-profile load via API
      try {
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
          setFormData({ name: data.user.name || '', email: data.user.email || '' });
          if (data.user.profileImage) setProfileImage(data.user.profileImage);
          else {
            const savedImage = localStorage.getItem(`profileImage_${data.user._id || data.user.email}`);
            if (savedImage) setProfileImage(savedImage);
          }
        } else {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            setCurrentUser(user);
            setFormData({ name: user.name || '', email: user.email || '' });
            const savedImage = localStorage.getItem(`profileImage_${user._id || user.email}`);
            if (savedImage) setProfileImage(savedImage);
          } else {
            router.push('/login');
          }
        }
      } catch (err) {
        console.error('Profile fetch error:', err);
      }
    };
    loadUser();
  }, [router, viewUserId]);

  // Fetch admin info for non-admin users
  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.userType !== 'admin' && !isAdminViewing) {
      fetch('/api/admin/info')
        .then(r => r.json())
        .then(data => { if (data.admin) setAdminInfo(data.admin); })
        .catch(console.error);
    }
  }, [currentUser, isAdminViewing]);

  // Chat polling
  useEffect(() => {
    if (!showChat || !adminInfo?._id) return;
    const fetchMessages = async () => {
      const res = await fetch(`/api/messages?with=${adminInfo._id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    };
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [showChat, adminInfo]);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !adminInfo?._id || isSendingMessage) return;
    setIsSendingMessage(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId: adminInfo._id, message: newMessage.trim() }),
      });
      if (res.ok) {
        setNewMessage('');
        const updated = await fetch(`/api/messages?with=${adminInfo._id}`);
        if (updated.ok) setMessages((await updated.json()).messages || []);
      }
    } catch (e) { console.error(e); }
    finally { setIsSendingMessage(false); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const result = reader.result as string;
        try {
          const res = await fetch('/api/user/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ profileImage: result }),
          });
          if (res.ok) {
            setProfileImage(result);
            if (currentUser?._id || currentUser?.email) {
              localStorage.setItem(`profileImage_${currentUser._id || currentUser.email}`, result);
            }
          }
        } catch (e) { console.error('Error uploading photo:', e); }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name }),
      });
      if (res.ok && currentUser) {
        const updated = { ...currentUser, name: formData.name };
        setCurrentUser(updated);
        localStorage.setItem('user', JSON.stringify(updated));
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (currentUser) setFormData({ name: currentUser.name || '', email: currentUser.email || '' });
    setIsEditing(false);
  };

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case "admin": return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
      case "analyst": return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case "verifier": return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20";
      default: return "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20";
    }
  };

  const getFirstName = (fullName: string | undefined) => fullName ? fullName.split(' ')[0] : 'User';
  const getDashboardPath = () => {
    if (currentUser?.userType === "admin") return "/admin";
    if (currentUser?.userType === "analyst") return "/analyst";
    return "/dashboard";
  };

  const formatTime = (ts: string | undefined) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href={isAdminViewing ? '/admin' : getDashboardPath()}>
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  {isAdminViewing ? `Profile: ${currentUser.name}` : 'My Profile'}
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                  {isAdminViewing ? 'Viewing user profile (read-only)' : 'Manage your account information'}
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1 space-y-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="relative group">
                      <Avatar className="h-32 w-32 border-4 border-border ring-4 ring-primary/10">
                        {profileImage ? (
                          <img src={profileImage} alt={currentUser.name} className="h-full w-full object-cover rounded-full" />
                        ) : (
                          <AvatarFallback className="text-3xl bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                            {currentUser.name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "U"}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      {isEditing && (
                        <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-3 cursor-pointer hover:bg-primary/90 transition-all shadow-lg hover:scale-110 active:scale-95">
                          <Camera className="h-5 w-5" />
                          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </label>
                      )}
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold text-foreground">
                        {isEditing ? getFirstName(formData.name) : getFirstName(currentUser.name)}
                      </h2>
                      <Badge variant="outline" className={getUserTypeColor(currentUser.userType)}>
                        {currentUser.userType}
                      </Badge>
                    </div>
                    {!isEditing && !isAdminViewing && (
                      <Button variant="outline" className="w-full" onClick={() => setIsEditing(true)}>
                        <Edit2 className="h-4 w-4 mr-2" />Edit Profile
                      </Button>
                    )}
                    {isAdminViewing && (
                      <Button variant="outline" className="w-full" onClick={() => router.push('/admin')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />Back to Dashboard
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Admin Info Card — shown for analysts/verifiers only */}
            {adminInfo && !isAdminViewing && currentUser.userType !== 'admin' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <Card className="border-red-500/20 bg-gradient-to-br from-red-500/5 to-orange-500/5">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-red-500" />
                      <CardTitle className="text-sm font-semibold text-foreground">Your Admin</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 ring-2 ring-red-500/30">
                        {adminInfo.profileImage ? (
                          <img src={adminInfo.profileImage} alt={adminInfo.name} className="h-full w-full object-cover rounded-full" />
                        ) : (
                          <AvatarFallback className="bg-gradient-to-br from-red-500 to-orange-600 text-white text-sm font-bold">
                            {adminInfo.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground text-sm truncate">{adminInfo.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{adminInfo.email}</p>
                        <Badge variant="outline" className="text-[10px] mt-1 bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">
                          administrator
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full mt-4 text-sm gap-2 border-red-500/20 hover:bg-red-500/10 hover:border-red-500/40"
                      onClick={() => setShowChat(true)}
                    >
                      <MessageSquare className="h-4 w-4 text-red-500" />
                      Message Admin
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Details + Chat Column */}
          <div className="lg:col-span-2 space-y-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>Your personal information and role</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <User className="h-4 w-4" />Full Name
                    </label>
                    {isEditing ? (
                      <input type="text" name="name" value={formData.name} onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                        placeholder="Enter your name" />
                    ) : (
                      <div className="px-4 py-3 bg-muted/50 rounded-lg text-foreground">{currentUser.name}</div>
                    )}
                  </div>
                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Mail className="h-4 w-4" />Email Address
                    </label>
                    <div className="px-4 py-3 bg-muted/50 rounded-lg text-foreground text-sm">{currentUser.email}</div>
                  </div>
                  {/* Role */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Shield className="h-4 w-4" />Role
                    </label>
                    <div className="px-4 py-3 bg-muted/50 rounded-lg">
                      <Badge variant="outline" className={getUserTypeColor(currentUser.userType)}>
                        {currentUser.userType}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Your role cannot be changed. Contact your administrator for role changes.</p>
                  </div>
                  {/* Joined */}
                  {currentUser.createdAt && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4" />Member Since
                      </label>
                      <div className="px-4 py-3 bg-muted/50 rounded-lg text-sm text-foreground">
                        {new Date(currentUser.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                    </div>
                  )}
                  {/* Save/Cancel */}
                  {isEditing && (
                    <div className="flex gap-3 pt-4 border-t border-border">
                      <Button variant="default" className="flex-1" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? (
                          <><div className="h-4 w-4 mr-2 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />Saving...</>
                        ) : (
                          <><Check className="h-4 w-4 mr-2" />Save Changes</>
                        )}
                      </Button>
                      <Button variant="outline" className="flex-1" onClick={handleCancel} disabled={isSaving}>
                        <X className="h-4 w-4 mr-2" />Cancel
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Inline Chat Panel */}
            {showChat && adminInfo && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="border-primary/20">
                  <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-transparent">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 ring-2 ring-red-500/30">
                          {adminInfo.profileImage ? (
                            <img src={adminInfo.profileImage} alt={adminInfo.name} className="h-full w-full object-cover rounded-full" />
                          ) : (
                            <AvatarFallback className="bg-gradient-to-br from-red-500 to-orange-600 text-white text-xs font-bold">
                              {adminInfo.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <CardTitle className="text-sm">{adminInfo.name}</CardTitle>
                          <p className="text-xs text-muted-foreground">Administrator</p>
                        </div>
                        <span className="h-2 w-2 bg-green-500 rounded-full" title="Online" />
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowChat(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {/* Messages */}
                    <div className="h-72 overflow-y-auto p-4 space-y-3 bg-muted/20">
                      {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                          <MessageSquare className="h-10 w-10 mb-2 opacity-30" />
                          <p className="text-sm">No messages yet. Say hello! 👋</p>
                        </div>
                      ) : (
                        messages.map((msg, i) => {
                          const isMine = msg.fromUserId !== adminInfo._id;
                          return (
                            <div key={msg.id || i} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${
                                isMine
                                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                                  : 'bg-card border border-border text-foreground rounded-bl-sm'
                              }`}>
                                <p className="text-sm leading-relaxed">{msg.message}</p>
                                <p className={`text-[10px] mt-1 ${isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                  {formatTime(msg.createdAt)}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                    {/* Input */}
                    <div className="p-3 border-t border-border flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                        placeholder={`Message ${adminInfo.name}...`}
                        className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-full text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <Button
                        size="icon"
                        className="rounded-full h-9 w-9 shrink-0"
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || isSendingMessage}
                      >
                        {isSendingMessage ? (
                          <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">Loading profile...</div>}>
      <ProfileContent />
    </Suspense>
  );
}


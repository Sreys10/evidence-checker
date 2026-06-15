"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Send, MessageSquare, Users, ArrowLeft, X, Volume2, VolumeX, Paperclip, File, Folder, Image as ImageIcon, Loader2, ExternalLink, Plus, Video } from "lucide-react";
import { getAllEvidence, StoredEvidence } from "@/lib/evidence-storage";

interface Contact {
  _id: string;
  name: string;
  email: string;
  userType: string;
  profileImage?: string | null;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  unreadCount: number;
}

interface Message {
  id?: string;
  fromUserId: string;
  toUserId: string;
  message: string;
  createdAt?: string;
  fromName?: string;
}

interface NewMsgAlert {
  contactId: string;
  contactName: string;
  message: string;
  userType: string;
  profileImage?: string | null;
}

interface ChatPanelProps {
  currentUserId: string;
  currentUserName: string;
}

// ── Web Audio notification sound (no file needed) ──────────────
// Shared context — reusing avoids browser blocking new contexts
let _sharedAudioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  try {
    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!_sharedAudioCtx || _sharedAudioCtx.state === 'closed') {
      _sharedAudioCtx = new AudioCtxClass();
    }
    return _sharedAudioCtx;
  } catch { return null; }
}

function playNotificationSound() {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;

    const tones = [
      { freq: 1046.5, start: 0, duration: 0.12 },
      { freq: 1318.5, start: 0.13, duration: 0.18 },
    ];

    const playTones = () => {
      tones.forEach(({ freq, start, duration }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0, ctx.currentTime + start);
        gain.gain.linearRampToValueAtTime(0.28, ctx.currentTime + start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration + 0.05);
      });
    };

    // Resume if suspended (browser blocks AudioContext until user interaction)
    if (ctx.state === 'suspended') {
      ctx.resume().then(playTones).catch(() => {});
    } else {
      playTones();
    }
  } catch { /* silent fail */ }
}


function timeAgo(ts: string | null | undefined): string {
  if (!ts) return "";
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function formatMsgTime(ts: string | undefined): string {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getUserTypeColor(userType: string): string {
  switch (userType) {
    case "admin": return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
    case "analyst": return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
    case "verifier": return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20";
    default: return "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20";
  }
}

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function ContactAvatar({ contact, size = "md" }: { contact: Contact; size?: "sm" | "md" | "lg" }) {
  const dim = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-12 w-12" : "h-10 w-10";
  const textSize = size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm";
  const gradients: Record<string, string> = {
    admin: "from-red-500 to-orange-600",
    analyst: "from-blue-500 to-indigo-600",
    verifier: "from-green-500 to-emerald-600",
    guest: "from-gray-400 to-gray-600",
  };
  return (
    <Avatar className={`${dim} shrink-0`}>
      {contact.profileImage ? (
        <img src={contact.profileImage} alt={contact.name} className="h-full w-full object-cover rounded-full" />
      ) : (
        <AvatarFallback className={`bg-gradient-to-br ${gradients[contact.userType] || gradients.guest} text-white font-semibold ${textSize}`}>
          {getInitials(contact.name)}
        </AvatarFallback>
      )}
    </Avatar>
  );
}

export default function ChatPanel({ currentUserId, currentUserName }: ChatPanelProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [newMsgAlert, setNewMsgAlert] = useState<NewMsgAlert | null>(null);
  const [newlyUnread, setNewlyUnread] = useState<Set<string>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const contactsPollRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [evidenceList, setEvidenceList] = useState<StoredEvidence[]>([]);
  const [isLoadingEvidence, setIsLoadingEvidence] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<{
    type: "evidence" | "file";
    evidenceId?: string;
    fileName: string;
    url: string;
    mediaType: "image" | "video" | "other";
  } | null>(null);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  // Track previous unread counts to detect NEW messages
  const prevUnreadRef = useRef<Record<string, number>>({});
  const activeContactRef = useRef<Contact | null>(null);
  const alertTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Keep activeContactRef in sync
  useEffect(() => { activeContactRef.current = activeContact; }, [activeContact]);

  const handleOpenEvidenceModal = async () => {
    setShowEvidenceModal(true);
    setIsLoadingEvidence(true);
    try {
      const allEv = await getAllEvidence();
      setEvidenceList(allEv);
    } catch (e) {
      console.error("Failed to load evidence for attachment:", e);
    } finally {
      setIsLoadingEvidence(false);
    }
  };

  const handleSelectEvidence = (ev: StoredEvidence) => {
    setSelectedAttachment({
      type: "evidence",
      evidenceId: ev.id || ev._id,
      fileName: ev.evidenceName || ev.fileName,
      url: ev.imageData,
      mediaType: ev.type?.startsWith("video/") ? "video" : (ev.type?.startsWith("image/") ? "image" : "other")
    });
    setShowEvidenceModal(false);
  };

  const handleLocalFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAttachment(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        try {
          const res = await fetch("/api/chat-upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileData: base64Data })
          });
          if (res.ok) {
            const data = await res.json();
            setSelectedAttachment({
              type: "file",
              fileName: file.name,
              url: data.url,
              mediaType: file.type?.startsWith("video/") ? "video" : (file.type?.startsWith("image/") ? "image" : "other")
            });
          } else {
            const errData = await res.json();
            alert(`Upload failed: ${errData.error || "Unknown error"}`);
          }
        } catch (err) {
          console.error("Error uploading chat file:", err);
          alert("Failed to upload file. Please try again.");
        } finally {
          setIsUploadingAttachment(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Error reading chat file:", err);
      alert("Failed to read file.");
      setIsUploadingAttachment(false);
    } finally {
      if (e.target) e.target.value = "";
    }
  };

  const handleCancelAttachment = () => {
    setSelectedAttachment(null);
  };

  const triggerNewMessageAlert = useCallback((contact: Contact, msg: string) => {
    if (soundEnabled) playNotificationSound();
    setNewMsgAlert({ contactId: contact._id, contactName: contact.name, message: msg, userType: contact.userType, profileImage: contact.profileImage });
    setNewlyUnread(prev => new Set(prev).add(contact._id));
    // Auto-dismiss alert after 5s
    if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
    alertTimerRef.current = setTimeout(() => setNewMsgAlert(null), 5000);
  }, [soundEnabled]);

  const fetchContacts = useCallback(async () => {
    try {
      const res = await fetch("/api/contacts");
      if (res.ok) {
        const data = await res.json();
        const newContacts: Contact[] = data.contacts || [];

        // Detect new messages by comparing unread counts
        newContacts.forEach(contact => {
          const prevCount = prevUnreadRef.current[contact._id];
          // Only alert if we've seen this contact before (prevCount is defined) AND count increased
          if (prevCount !== undefined && contact.unreadCount > prevCount) {
            const isActiveChat = activeContactRef.current?._id === contact._id;
            if (!isActiveChat && contact.lastMessage) {
              triggerNewMessageAlert(contact, contact.lastMessage);
            }
          }
          prevUnreadRef.current[contact._id] = contact.unreadCount;
        });

        setContacts(newContacts);
      }
    } catch (e) {
      console.error("Failed to fetch contacts:", e);
    } finally {
      setIsLoadingContacts(false);
    }
  }, [triggerNewMessageAlert]);

  const fetchMessages = useCallback(async (contactId: string) => {
    try {
      const res = await fetch(`/api/messages?with=${contactId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setContacts((prev) => prev.map((c) => (c._id === contactId ? { ...c, unreadCount: 0 } : c)));
        // Clear newly-unread highlight for this contact
        setNewlyUnread(prev => { const s = new Set(prev); s.delete(contactId); return s; });
        prevUnreadRef.current[contactId] = 0;
      }
    } catch (e) {
      console.error("Failed to fetch messages:", e);
    }
  }, []);

  // Initial contacts load + poll every 4s
  useEffect(() => {
    fetchContacts();
    contactsPollRef.current = setInterval(fetchContacts, 4000);
    return () => { if (contactsPollRef.current) clearInterval(contactsPollRef.current); };
  }, [fetchContacts]);

  // Poll messages when a conversation is open
  useEffect(() => {
    if (!activeContact) return;
    setIsLoadingMessages(true);
    fetchMessages(activeContact._id).finally(() => setIsLoadingMessages(false));
    pollRef.current = setInterval(() => fetchMessages(activeContact._id), 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeContact, fetchMessages]);

  // Auto-scroll
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Focus input when conversation opens
  useEffect(() => { if (activeContact) setTimeout(() => inputRef.current?.focus(), 100); }, [activeContact]);

  const handleSend = async () => {
    const messageContent = newMessage.trim();
    if (!messageContent && !selectedAttachment) return;
    if (!activeContact || isSending) return;
    setIsSending(true);

    let messageToSend = messageContent;
    if (selectedAttachment) {
      messageToSend = JSON.stringify({
        attachment: selectedAttachment,
        text: messageContent || undefined
      });
    }

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId: activeContact._id, message: messageToSend }),
      });
      if (res.ok) {
        setNewMessage("");
        setSelectedAttachment(null);
        await fetchMessages(activeContact._id);
        
        const contactMessageText = selectedAttachment 
          ? `📎 Attachment: ${selectedAttachment.fileName}` 
          : messageContent;
        
        setContacts((prev) => 
          prev.map((c) => 
            c._id === activeContact._id 
              ? { ...c, lastMessage: contactMessageText, lastMessageAt: new Date().toISOString() } 
              : c
          )
        );
      }
    } catch (e) { 
      console.error("Failed to send:", e); 
    } finally { 
      setIsSending(false); 
    }
  };

  const openChat = (contact: Contact) => {
    setActiveContact(contact);
    setNewMsgAlert(null);
    // Clear newly-unread for this contact
    setNewlyUnread(prev => { const s = new Set(prev); s.delete(contact._id); return s; });
  };

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.userType.toLowerCase().includes(search.toLowerCase())
  );
  const totalUnread = contacts.reduce((sum, c) => sum + c.unreadCount, 0);
  const grouped = {
    admin: filteredContacts.filter((c) => c.userType === "admin"),
    analyst: filteredContacts.filter((c) => c.userType === "analyst"),
    verifier: filteredContacts.filter((c) => c.userType === "verifier"),
    guest: filteredContacts.filter((c) => c.userType === "guest"),
  };

  return (
    <div className="flex h-full w-full bg-background overflow-hidden relative">

      {/* ── WhatsApp-style new message toast (top center) ─── */}
      <AnimatePresence>
        {newMsgAlert && (
          <motion.div
            initial={{ opacity: 0, y: -60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -60 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-card border border-border shadow-2xl rounded-2xl px-4 py-3 max-w-sm w-[calc(100%-2rem)] cursor-pointer"
            onClick={() => {
              const c = contacts.find(c => c._id === newMsgAlert.contactId);
              if (c) openChat(c);
            }}
          >
            {/* Avatar */}
            <div className="shrink-0">
              <Avatar className="h-10 w-10">
                {newMsgAlert.profileImage ? (
                  <img src={newMsgAlert.profileImage} alt={newMsgAlert.contactName} className="h-full w-full object-cover rounded-full" />
                ) : (
                  <AvatarFallback className={`bg-gradient-to-br ${newMsgAlert.userType === 'admin' ? 'from-red-500 to-orange-600' : 'from-blue-500 to-indigo-600'} text-white text-sm font-bold`}>
                    {getInitials(newMsgAlert.contactName)}
                  </AvatarFallback>
                )}
              </Avatar>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-semibold text-foreground text-sm truncate">{newMsgAlert.contactName}</p>
                {newMsgAlert.userType === 'admin' && (
                  <span className="text-[9px] font-bold border border-red-500 text-red-500 rounded px-1 shrink-0">ADMIN</span>
                )}
                <span className="ml-auto text-[10px] text-muted-foreground">now</span>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{newMsgAlert.message}</p>
            </div>
            <button
              className="shrink-0 text-muted-foreground hover:text-foreground"
              onClick={e => { e.stopPropagation(); setNewMsgAlert(null); }}
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Left: Contacts Panel ── */}
      <AnimatePresence mode="wait">
        {(!activeContact || (typeof window !== 'undefined' && window.innerWidth >= 768)) && (
          <motion.div
            key="contacts"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex flex-col border-r border-border bg-card/50 ${activeContact ? "hidden md:flex md:w-72 shrink-0" : "flex-1 md:w-72 md:flex-none md:shrink-0"}`}
          >
            {/* Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-5 w-5 text-primary" />
                <h2 className="font-bold text-foreground text-lg">Chats</h2>
                {totalUnread > 0 && (
                  <Badge className="bg-green-500 text-white text-xs h-5 px-1.5 ml-auto animate-pulse">
                    {totalUnread}
                  </Badge>
                )}
                {/* Sound toggle */}
                <button
                  onClick={() => setSoundEnabled(v => !v)}
                  className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
                  title={soundEnabled ? "Mute notifications" : "Unmute notifications"}
                >
                  {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 opacity-50" />}
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search people..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Contacts List */}
            <div className="flex-1 overflow-y-auto">
              {isLoadingContacts ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">Loading contacts...</div>
              ) : filteredContacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Users className="h-10 w-10 mb-2 opacity-30" />
                  <p className="text-sm">No contacts found</p>
                </div>
              ) : (
                <div className="py-2">
                  {Object.entries(grouped).map(([groupType, groupContacts]) => {
                    if (groupContacts.length === 0) return null;
                    return (
                      <div key={groupType}>
                        <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                          {groupType === "admin" ? "👑 Admin" : groupType === "analyst" ? "🔬 Analysts" : groupType === "verifier" ? "✅ Verifiers" : "👤 Guests"}
                        </p>
                        {groupContacts.map((contact) => {
                          const isNewMsg = newlyUnread.has(contact._id);
                          const hasUnread = contact.unreadCount > 0;
                          return (
                            <motion.button
                              key={contact._id}
                              onClick={() => openChat(contact)}
                              animate={isNewMsg ? { x: [0, -4, 4, -4, 4, 0] } : {}}
                              transition={{ duration: 0.4 }}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors relative ${
                                activeContact?._id === contact._id
                                  ? "bg-primary/10 border-r-2 border-primary"
                                  : isNewMsg
                                  ? "bg-green-500/8 hover:bg-green-500/12"
                                  : "hover:bg-accent"
                              }`}
                            >
                              <div className="relative shrink-0">
                                <ContactAvatar contact={contact} size="md" />
                                {/* Green online-style dot for new message */}
                                {isNewMsg && (
                                  <span className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-background animate-pulse" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1">
                                  <span className={`text-sm truncate ${hasUnread ? "font-bold text-foreground" : "font-medium text-foreground"}`}>
                                    {contact.name}
                                    {contact.userType === "admin" && (
                                      <span className="ml-1.5 text-[9px] font-bold border border-red-500 text-red-500 rounded px-1 py-0 align-middle">ADMIN</span>
                                    )}</span>
                                  <span className={`text-[10px] shrink-0 ${hasUnread ? "text-green-600 dark:text-green-400 font-medium" : "text-muted-foreground"}`}>
                                    {timeAgo(contact.lastMessageAt)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-1 mt-0.5">
                                  <p className={`text-xs truncate ${hasUnread ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                                    {contact.lastMessage ? (
                                      (() => {
                                        try {
                                          if (contact.lastMessage.startsWith('{') && contact.lastMessage.endsWith('}')) {
                                            const parsed = JSON.parse(contact.lastMessage);
                                            if (parsed.attachment) {
                                              return `📎 Attachment: ${parsed.attachment.fileName}`;
                                            }
                                          }
                                        } catch (e) {}
                                        return contact.lastMessage;
                                      })()
                                    ) : (
                                      <span className="italic opacity-60">Start a conversation</span>
                                    )}
                                  </p>
                                  {hasUnread && (
                                    <span className={`shrink-0 min-w-[1.1rem] h-[1.1rem] px-1 ${isNewMsg ? 'bg-green-500' : 'bg-primary'} text-white text-[10px] font-bold rounded-full flex items-center justify-center transition-colors`}>
                                      {contact.unreadCount > 9 ? "9+" : contact.unreadCount}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Right: Conversation View ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {!activeContact ? (
          <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground select-none">
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="h-12 w-12 text-primary/50" />
                </div>
                <div className="absolute -bottom-1 -right-1 h-7 w-7 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-foreground">Your Messages</p>
                <p className="text-sm text-muted-foreground mt-1">Select a contact to start chatting</p>
              </div>
            </motion.div>
          </div>
        ) : (
          <>
            {/* Conversation Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/50 backdrop-blur-sm shrink-0">
              <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setActiveContact(null)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <ContactAvatar contact={activeContact} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-foreground truncate">{activeContact.name}</p>
                  {activeContact.userType === "admin" && (
                    <span className="text-[9px] font-bold border border-red-500 text-red-500 rounded px-1 py-0 shrink-0">ADMIN</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className={`text-[10px] h-4 px-1.5 ${getUserTypeColor(activeContact.userType)}`}>{activeContact.userType}</Badge>
                  <span className="text-xs text-muted-foreground">{activeContact.email}</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isLoadingMessages && messages.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                    <ContactAvatar contact={activeContact} size="lg" />
                    <p className="text-base font-semibold text-foreground mt-3">{activeContact.name}</p>
                    <p className="text-sm mt-1">Say hi! Start your first conversation 👋</p>
                  </motion.div>
                </div>
              ) : (
                <>
                  {messages.map((msg, i) => {
                    const isMine = msg.fromUserId === currentUserId;
                    const showDate = i === 0 || new Date(msg.createdAt || "").toDateString() !== new Date(messages[i - 1]?.createdAt || "").toDateString();
                    return (
                      <div key={msg.id || i}>
                        {showDate && (
                          <div className="flex justify-center my-3">
                            <span className="text-[10px] text-muted-foreground bg-muted px-3 py-1 rounded-full">
                              {new Date(msg.createdAt || "").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                            </span>
                          </div>
                        )}
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"}`}>
                          {!isMine && <ContactAvatar contact={activeContact} size="sm" />}
                          {(() => {
                            let parsedAttachment = null;
                            try {
                              if (msg.message.trim().startsWith('{') && msg.message.trim().endsWith('}')) {
                                const parsed = JSON.parse(msg.message);
                                if (parsed.attachment && parsed.attachment.type) {
                                  parsedAttachment = parsed;
                                }
                              }
                            } catch (e) {}

                            return (
                              <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl shadow-sm ${isMine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card border border-border text-foreground rounded-bl-sm"}`}>
                                {parsedAttachment ? (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 p-2 rounded-lg border border-border/10">
                                      {parsedAttachment.attachment.mediaType === "image" ? (
                                        <ImageIcon className="h-4 w-4 text-sky-500 shrink-0" />
                                      ) : parsedAttachment.attachment.mediaType === "video" ? (
                                        <Video className="h-4 w-4 text-indigo-500 shrink-0" />
                                      ) : (
                                        <File className="h-4 w-4 text-amber-500 shrink-0" />
                                      )}
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold truncate">
                                          {parsedAttachment.attachment.fileName}
                                        </p>
                                        <p className="text-[9px] opacity-70">
                                          {parsedAttachment.attachment.type === "evidence" 
                                            ? "Database Evidence" 
                                            : "Attached File"}
                                        </p>
                                      </div>
                                      <a 
                                        href={parsedAttachment.attachment.url} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="p-1 rounded bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 transition-all shrink-0"
                                        title="View attachment"
                                      >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                      </a>
                                    </div>
                                    
                                    {parsedAttachment.attachment.mediaType === "image" && (
                                      <div className="relative rounded-lg overflow-hidden border border-border/20 max-h-48 bg-muted">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img 
                                          src={parsedAttachment.attachment.url} 
                                          alt={parsedAttachment.attachment.fileName} 
                                          className="object-cover w-full h-full max-h-48 cursor-pointer hover:scale-105 transition-all"
                                          onClick={() => window.open(parsedAttachment.attachment.url, '_blank')}
                                        />
                                      </div>
                                    )}
                                    
                                    {parsedAttachment.attachment.mediaType === "video" && (
                                      <div className="relative rounded-lg overflow-hidden border border-border/20 bg-black max-h-48 flex items-center justify-center">
                                        <video 
                                          src={parsedAttachment.attachment.url} 
                                          controls 
                                          className="w-full h-full max-h-48"
                                        />
                                      </div>
                                    )}

                                    {parsedAttachment.text && (
                                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words mt-1">
                                        {parsedAttachment.text}
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.message}</p>
                                )}
                                <p className={`text-[10px] mt-1 text-right ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{formatMsgTime(msg.createdAt)}</p>
                              </div>
                            );
                          })()}
                          {isMine && (
                            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                              {getInitials(currentUserName)}
                            </div>
                          )}
                        </motion.div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Bar */}
            <div className="border-t border-border p-3 bg-card/50 shrink-0 relative">
              
              {/* Attachment selector menu */}
              {showAttachmentMenu && (
                <div className="absolute bottom-16 left-4 bg-popover border border-border rounded-xl shadow-2xl p-2 z-30 flex flex-col gap-1 w-56 animate-in slide-in-from-bottom-2 fade-in duration-150">
                  <button
                    onClick={() => {
                      setShowAttachmentMenu(false);
                      handleOpenEvidenceModal();
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-foreground hover:bg-accent hover:text-accent-foreground text-left w-full transition-colors"
                  >
                    <Folder className="h-4 w-4 text-sky-500" />
                    Attach Database Evidence
                  </button>
                  <button
                    onClick={() => {
                      setShowAttachmentMenu(false);
                      fileInputRef.current?.click();
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-foreground hover:bg-accent hover:text-accent-foreground text-left w-full transition-colors"
                  >
                    <Plus className="h-4 w-4 text-emerald-500" />
                    Upload Local File
                  </button>
                </div>
              )}

              {/* Hidden file input for uploading files */}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleLocalFileChange}
              />

              {/* Attachment preview box */}
              {selectedAttachment && (
                <div className="mb-3 bg-muted/70 border rounded-xl p-3 flex gap-3 relative items-start animate-in fade-in slide-in-from-bottom-2">
                  <div className="h-12 w-12 rounded-lg border bg-background flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {selectedAttachment.mediaType === "image" ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={selectedAttachment.url} alt="" className="object-cover h-full w-full" />
                    ) : selectedAttachment.mediaType === "video" ? (
                      <Video className="h-6 w-6 text-indigo-500" />
                    ) : (
                      <File className="h-6 w-6 text-amber-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate">{selectedAttachment.fileName}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      {selectedAttachment.type === "evidence" ? "Database Evidence" : "Local File Attachment"}
                    </p>
                  </div>
                  <button
                    onClick={handleCancelAttachment}
                    className="text-muted-foreground hover:text-foreground p-1 rounded-full bg-background border hover:shadow-sm"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              <div className="flex gap-2 items-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon" 
                  className="rounded-full h-10 w-10 shrink-0"
                  onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                  title="Attach file or evidence"
                  disabled={isUploadingAttachment || isSending}
                >
                  {isUploadingAttachment ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>

                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => { 
                      if (e.key === "Enter" && !e.shiftKey) { 
                        e.preventDefault(); 
                        handleSend(); 
                      } 
                    }}
                    placeholder={selectedAttachment ? "Add a caption..." : `Message ${activeContact.name.split(" ")[0]}...`}
                    className="w-full px-4 py-2.5 text-sm bg-background border border-border rounded-full text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
                
                <Button 
                  size="icon" 
                  className="rounded-full h-10 w-10 shrink-0 shadow-md" 
                  onClick={handleSend} 
                  disabled={isSending || isUploadingAttachment || (!newMessage.trim() && !selectedAttachment)}
                >
                  {isSending ? (
                    <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground text-center mt-1.5">Press Enter to send</p>
            </div>
          </>
        )}
      </div>

      {/* ── Evidence Selector Modal ── */}
      {showEvidenceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl w-full max-w-xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h3 className="font-bold text-lg text-foreground">Select Evidence</h3>
                <p className="text-xs text-muted-foreground">Choose an evidence file from the database to attach</p>
              </div>
              <button onClick={() => setShowEvidenceModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {isLoadingEvidence ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-sm gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  Loading database evidence...
                </div>
              ) : evidenceList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-sm">
                  No evidence records found in the database.
                </div>
              ) : (
                evidenceList.map((ev) => (
                  <button
                    key={ev.id || ev._id}
                    onClick={() => handleSelectEvidence(ev)}
                    className="w-full flex items-center gap-3 p-3 border rounded-xl bg-muted/30 hover:bg-muted text-left transition-colors"
                  >
                    <div className="h-12 w-12 rounded bg-background border flex-shrink-0 overflow-hidden flex items-center justify-center">
                      {ev.imageData ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={ev.imageData} alt="" className="object-cover h-full w-full" />
                      ) : ev.type?.startsWith("video/") ? (
                        <Video className="h-5 w-5 text-indigo-500" />
                      ) : (
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate text-foreground">{ev.evidenceName || ev.fileName}</p>
                      <p className="text-xs text-muted-foreground truncate">{ev.caseName || "Unassigned Case"}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Search, Send, MessageSquare, Users, ArrowLeft, X, Volume2, VolumeX,
  Paperclip, File, Folder, Image as ImageIcon, Loader2, ExternalLink,
  Plus, Video, Reply, Smile, CheckCheck, Check, Phone, Info, MoreVertical,
  Star, StarOff, Copy, Pin, PinOff, Wifi, WifiOff,
  Shield, Crown, Zap, ChevronDown, Bell, BellOff,
} from "lucide-react";
import { getAllEvidence, StoredEvidence } from "@/lib/evidence-storage";

interface Contact {
  _id: string;
  name: string;
  email: string;
  userType: string;
  profileImage?: string | null;
  lastLogin?: string | null;
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

interface ReplyTo {
  id: string;
  text: string;
  fromName: string;
  isMine: boolean;
}

const EMOJI_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "✅", "🎉"];

// ── Web Audio notification sound ──────────────────────────────────
let _sharedAudioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  try {
    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!_sharedAudioCtx || _sharedAudioCtx.state === "closed") {
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
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0, ctx.currentTime + start);
        gain.gain.linearRampToValueAtTime(0.28, ctx.currentTime + start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration + 0.05);
      });
    };
    if (ctx.state === "suspended") ctx.resume().then(playTones).catch(() => {});
    else playTones();
  } catch { /* silent */ }
}

// ── Utilities ─────────────────────────────────────────────────────
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

function formatMsgTimeFull(ts: string | undefined): string {
  if (!ts) return "";
  return new Date(ts).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatDateHeader(ts: string | undefined): string {
  if (!ts) return "";
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

function getUserTypeColor(userType: string): string {
  switch (userType) {
    case "admin": return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
    case "analyst": return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
    case "verifier": return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20";
    default: return "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20";
  }
}

function getGradient(userType: string): string {
  const g: Record<string, string> = {
    admin: "from-red-500 to-orange-600",
    analyst: "from-blue-500 to-indigo-600",
    verifier: "from-green-500 to-emerald-600",
    guest: "from-gray-400 to-gray-600",
  };
  return g[userType] || g.guest;
}

function getUserTypeIcon(userType: string) {
  if (userType === "admin") return <Crown className="h-3 w-3" />;
  if (userType === "analyst") return <Zap className="h-3 w-3" />;
  if (userType === "verifier") return <Shield className="h-3 w-3" />;
  return null;
}

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function parseMessageAttachment(rawMsg: string) {
  try {
    if (rawMsg.trim().startsWith("{") && rawMsg.trim().endsWith("}")) {
      const parsed = JSON.parse(rawMsg);
      if (parsed.attachment?.type) return parsed;
    }
  } catch { /* noop */ }
  return null;
}

function checkOnlineStatus(lastLogin: string | null | undefined): { isOnline: boolean; label: string } {
  if (!lastLogin) return { isOnline: false, label: "Offline" };
  const diffMinutes = (Date.now() - new Date(lastLogin).getTime()) / (1000 * 60);
  if (diffMinutes <= 15) {
    return { isOnline: true, label: "Active now" };
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 1) return { isOnline: false, label: `Last seen ${Math.max(1, Math.floor(diffMinutes))}m ago` };
  if (diffHours < 24) return { isOnline: false, label: `Last seen ${diffHours}h ago` };
  const diffDays = Math.floor(diffHours / 24);
  return { isOnline: false, label: `Last seen ${diffDays}d ago` };
}

function ContactAvatar({ contact, size = "md", showRing = false, showStatusDot = true }: { contact: Contact; size?: "sm" | "md" | "lg"; showRing?: boolean; showStatusDot?: boolean }) {
  const dim = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-12 w-12" : "h-10 w-10";
  const textSize = size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm";
  const status = checkOnlineStatus(contact.lastLogin);
  return (
    <div className="relative shrink-0">
      <Avatar className={`${dim} ${showRing ? "ring-2 ring-primary/40 ring-offset-1 ring-offset-background" : ""}`}>
        {contact.profileImage ? (
          <img src={contact.profileImage} alt={contact.name} className="h-full w-full object-cover rounded-full" />
        ) : (
          <AvatarFallback className={`bg-gradient-to-br ${getGradient(contact.userType)} text-white font-semibold ${textSize}`}>
            {getInitials(contact.name)}
          </AvatarFallback>
        )}
      </Avatar>
      {showStatusDot && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-background ${
            size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"
          } ${status.isOnline ? "bg-green-500" : "bg-gray-400 dark:bg-gray-500"}`}
          title={status.label}
        />
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────
export default function ChatPanel({ currentUserId, currentUserName }: ChatPanelProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");
  const [msgSearch, setMsgSearch] = useState("");
  const [showMsgSearch, setShowMsgSearch] = useState(false);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [newMsgAlert, setNewMsgAlert] = useState<NewMsgAlert | null>(null);
  const [newlyUnread, setNewlyUnread] = useState<Set<string>>(new Set());
  const [replyTo, setReplyTo] = useState<ReplyTo | null>(null);
  const [reactionMenuMsgId, setReactionMenuMsgId] = useState<string | null>(null);
  const [reactions, setReactions] = useState<Record<string, string>>({});
  const [isTyping, setIsTyping] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [starredMessages, setStarredMessages] = useState<Set<string>>(new Set());
  const [pinnedMsgId, setPinnedMsgId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ msgId: string; x: number; y: number } | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [notifsMuted, setNotifsMuted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const contactsPollRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
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
  const prevUnreadRef = useRef<Record<string, number>>({});
  const activeContactRef = useRef<Contact | null>(null);
  const alertTimerRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isUserScrolledUpRef = useRef<boolean>(false);

  // Online/offline detection
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => { window.removeEventListener("online", onOnline); window.removeEventListener("offline", onOffline); };
  }, []);

  // Scroll detection for scroll-to-bottom button
  const handleMessagesScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isUserScrolledUpRef.current = distFromBottom > 150;
    setShowScrollBtn(distFromBottom > 120);
  };

  const scrollToBottom = () => {
    isUserScrolledUpRef.current = false;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Typing indicator simulation
  const handleTyping = () => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {}, 2000);
  };

  useEffect(() => { activeContactRef.current = activeContact; }, [activeContact]);

  const handleOpenEvidenceModal = async () => {
    setShowEvidenceModal(true);
    setIsLoadingEvidence(true);
    try {
      const allEv = await getAllEvidence();
      setEvidenceList(allEv);
    } catch (e) {
      console.error("Failed to load evidence:", e);
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
      mediaType: ev.type?.startsWith("video/") ? "video" : ev.type?.startsWith("image/") ? "image" : "other",
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
            body: JSON.stringify({ fileData: base64Data }),
          });
          if (res.ok) {
            const data = await res.json();
            setSelectedAttachment({
              type: "file",
              fileName: file.name,
              url: data.url,
              mediaType: file.type?.startsWith("video/") ? "video" : file.type?.startsWith("image/") ? "image" : "other",
            });
          } else {
            const err = await res.json();
            alert(`Upload failed: ${err.error || "Unknown error"}`);
          }
        } catch (err) {
          console.error("Error uploading:", err);
          alert("Failed to upload file.");
        } finally {
          setIsUploadingAttachment(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Error reading file:", err);
      alert("Failed to read file.");
      setIsUploadingAttachment(false);
    } finally {
      if (e.target) e.target.value = "";
    }
  };

  const triggerNewMessageAlert = useCallback((contact: Contact, msg: string) => {
    if (soundEnabled && !notifsMuted) playNotificationSound();
    if (!notifsMuted) {
      setNewMsgAlert({ contactId: contact._id, contactName: contact.name, message: msg, userType: contact.userType, profileImage: contact.profileImage });
      setNewlyUnread((prev) => new Set(prev).add(contact._id));
      if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
      alertTimerRef.current = setTimeout(() => setNewMsgAlert(null), 5000);
    }
  }, [soundEnabled, notifsMuted]);

  const fetchContacts = useCallback(async () => {
    try {
      const res = await fetch("/api/contacts");
      if (res.ok) {
        const data = await res.json();
        const newContacts: Contact[] = data.contacts || [];
        newContacts.forEach((contact) => {
          const prevCount = prevUnreadRef.current[contact._id];
          if (prevCount !== undefined && contact.unreadCount > prevCount) {
            const isActiveChat = activeContactRef.current?._id === contact._id;
            if (!isActiveChat && contact.lastMessage) triggerNewMessageAlert(contact, contact.lastMessage);
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
        setNewlyUnread((prev) => { const s = new Set(prev); s.delete(contactId); return s; });
        prevUnreadRef.current[contactId] = 0;
      }
    } catch (e) {
      console.error("Failed to fetch messages:", e);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
    contactsPollRef.current = setInterval(fetchContacts, 4000);
    return () => { if (contactsPollRef.current) clearInterval(contactsPollRef.current); };
  }, [fetchContacts]);

  useEffect(() => {
    if (!activeContact) return;
    isUserScrolledUpRef.current = false;
    setIsLoadingMessages(true);
    fetchMessages(activeContact._id).finally(() => {
      setIsLoadingMessages(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "auto" }), 50);
    });
    pollRef.current = setInterval(() => fetchMessages(activeContact._id), 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeContact, fetchMessages]);

  useEffect(() => {
    if (!isUserScrolledUpRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  useEffect(() => { if (activeContact) setTimeout(() => inputRef.current?.focus(), 100); }, [activeContact]);

  // Auto-resize textarea
  const autoResize = () => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + "px";
    }
  };

  const handleSend = async () => {
    const messageContent = newMessage.trim();
    if (!messageContent && !selectedAttachment) return;
    if (!activeContact || isSending) return;
    setIsSending(true);

    let messageToSend = messageContent;
    if (selectedAttachment || replyTo) {
      const payload: Record<string, unknown> = {};
      if (selectedAttachment) payload.attachment = selectedAttachment;
      if (messageContent) payload.text = messageContent;
      if (replyTo) payload.replyTo = replyTo;
      messageToSend = JSON.stringify(payload);
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
        setReplyTo(null);
        if (inputRef.current) inputRef.current.style.height = "auto";
        isUserScrolledUpRef.current = false;
        await fetchMessages(activeContact._id);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        const contactMessageText = selectedAttachment
          ? `📎 ${selectedAttachment.fileName}`
          : messageContent;
        setContacts((prev) =>
          prev.map((c) =>
            c._id === activeContact._id
              ? { ...c, lastMessage: contactMessageText, lastMessageAt: new Date().toISOString() }
              : c
          )
        );
      }
    } catch (e) { console.error("Failed to send:", e); }
    finally { setIsSending(false); }
  };

  const openChat = (contact: Contact) => {
    isUserScrolledUpRef.current = false;
    setActiveContact(contact);
    setNewMsgAlert(null);
    setShowContactInfo(false);
    setReplyTo(null);
    setShowMsgSearch(false);
    setMsgSearch("");
    setContextMenu(null);
    setNewlyUnread((prev) => { const s = new Set(prev); s.delete(contact._id); return s; });
  };

  const copyMessageText = (msg: Message) => {
    const parsed = parseMessageAttachment(msg.message);
    const text = parsed ? (parsed.text || "") : msg.message;
    if (text) navigator.clipboard.writeText(text).catch(() => {});
    setContextMenu(null);
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

  const displayedMessages = msgSearch.trim()
    ? messages.filter((m) => {
        const parsed = parseMessageAttachment(m.message);
        const text = parsed ? (parsed.text || parsed.attachment?.fileName || "") : m.message;
        return text.toLowerCase().includes(msgSearch.toLowerCase());
      })
    : messages;

  const pinnedMsg = pinnedMsgId ? messages.find(m => (m.id || "") === pinnedMsgId) : null;

  return (
    <div
      className="flex h-full w-full bg-background overflow-hidden relative"
      onClick={() => { setReactionMenuMsgId(null); setContextMenu(null); setShowAttachmentMenu(false); }}
    >

      {/* ── Toast Alert ── */}
      <AnimatePresence>
        {newMsgAlert && (
          <motion.div
            initial={{ opacity: 0, y: -60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -60, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-card border border-border shadow-2xl rounded-2xl px-4 py-3 max-w-sm w-[calc(100%-2rem)] cursor-pointer hover:shadow-3xl transition-shadow"
            onClick={() => { const c = contacts.find((c) => c._id === newMsgAlert.contactId); if (c) openChat(c); }}
          >
            <div className="shrink-0 relative">
              <Avatar className="h-10 w-10">
                {newMsgAlert.profileImage ? (
                  <img src={newMsgAlert.profileImage} alt={newMsgAlert.contactName} className="h-full w-full object-cover rounded-full" />
                ) : (
                  <AvatarFallback className={`bg-gradient-to-br ${getGradient(newMsgAlert.userType)} text-white text-sm font-bold`}>
                    {getInitials(newMsgAlert.contactName)}
                  </AvatarFallback>
                )}
              </Avatar>
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-semibold text-foreground text-sm truncate">{newMsgAlert.contactName}</p>
                <span className="ml-auto text-[10px] text-muted-foreground shrink-0">now</span>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{newMsgAlert.message}</p>
            </div>
            <button className="shrink-0 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-accent transition-colors" onClick={(e) => { e.stopPropagation(); setNewMsgAlert(null); }}>
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Context Menu ── */}
      <AnimatePresence>
        {contextMenu && (() => {
          const ctxMsg = messages.find(m => (m.id || String(messages.indexOf(m))) === contextMenu.msgId);
          const ctxIsMine = ctxMsg?.fromUserId === currentUserId;
          const ctxParsed = ctxMsg ? parseMessageAttachment(ctxMsg.message) : null;
          const ctxText = ctxMsg ? (ctxParsed ? (ctxParsed.text || "") : ctxMsg.message) : "";
          const isStarred = starredMessages.has(contextMenu.msgId);
          const isPinned = pinnedMsgId === contextMenu.msgId;
          return (
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              style={{ position: "fixed", top: contextMenu.y, left: contextMenu.x, zIndex: 100 }}
              className="bg-popover border border-border rounded-xl shadow-2xl py-1.5 min-w-[160px] overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {[
                {
                  icon: <Reply className="h-3.5 w-3.5" />, label: "Reply", onClick: () => {
                    if (ctxMsg) {
                      setReplyTo({ id: contextMenu.msgId, text: ctxText, fromName: ctxIsMine ? currentUserName : (activeContact?.name || ""), isMine: ctxIsMine ?? false });
                      inputRef.current?.focus();
                    }
                    setContextMenu(null);
                  }
                },
                ctxText ? {
                  icon: <Copy className="h-3.5 w-3.5" />, label: "Copy", onClick: () => ctxMsg && copyMessageText(ctxMsg)
                } : null,
                {
                  icon: isStarred ? <StarOff className="h-3.5 w-3.5" /> : <Star className="h-3.5 w-3.5" />,
                  label: isStarred ? "Unstar" : "Star",
                  onClick: () => {
                    setStarredMessages(prev => {
                      const n = new Set(prev);
                      if (n.has(contextMenu.msgId)) n.delete(contextMenu.msgId); else n.add(contextMenu.msgId);
                      return n;
                    });
                    setContextMenu(null);
                  }
                },
                {
                  icon: isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />,
                  label: isPinned ? "Unpin" : "Pin",
                  onClick: () => {
                    setPinnedMsgId(isPinned ? null : contextMenu.msgId);
                    setContextMenu(null);
                  }
                },
              ].filter(Boolean).map((item, i) => (
                <button key={i} onClick={item!.onClick}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors text-left">
                  <span className="text-muted-foreground">{item!.icon}</span>
                  {item!.label}
                </button>
              ))}
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* ── Left Contacts Sidebar ── */}
      <AnimatePresence mode="wait">
        {(!activeContact || (typeof window !== "undefined" && window.innerWidth >= 768)) && (
          <motion.div
            key="contacts"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex flex-col border-r border-border bg-card/30 backdrop-blur-sm ${activeContact ? "hidden md:flex md:w-72 shrink-0" : "flex-1 md:w-72 md:flex-none md:shrink-0"}`}
          >
            {/* Sidebar Header */}
            <div className="p-4 border-b border-border bg-card/50">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                  <MessageSquare className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-foreground text-sm leading-tight">Team Chat</h2>
                  <p className="text-[10px] text-muted-foreground">{contacts.length} members</p>
                </div>
                {totalUnread > 0 && (
                  <Badge className="bg-primary text-primary-foreground text-[10px] h-5 px-1.5 min-w-[1.25rem] justify-center font-bold animate-pulse">
                    {totalUnread > 99 ? "99+" : totalUnread}
                  </Badge>
                )}
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => setNotifsMuted(v => !v)}
                    className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    title={notifsMuted ? "Unmute notifications" : "Mute notifications"}
                  >
                    {notifsMuted ? <BellOff className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => setSoundEnabled((v) => !v)}
                    className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    title={soundEnabled ? "Mute sound" : "Unmute sound"}
                  >
                    {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5 opacity-40" />}
                  </button>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search people..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
            </div>

            {/* Connection status */}
            {!isOnline && (
              <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border-b border-orange-500/20 text-orange-600 dark:text-orange-400">
                <WifiOff className="h-3.5 w-3.5 shrink-0" />
                <p className="text-xs font-medium">You're offline</p>
              </div>
            )}

            {/* Contact List */}
            <div className="flex-1 overflow-y-auto">
              {isLoadingContacts ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                  <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <p className="text-sm">Loading contacts...</p>
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground px-4 text-center">
                  <div className="h-14 w-14 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                    <Users className="h-7 w-7 opacity-30" />
                  </div>
                  <p className="text-sm font-medium">No contacts found</p>
                  <p className="text-xs opacity-60 mt-1">Try a different search</p>
                </div>
              ) : (
                <div className="py-2">
                  {Object.entries(grouped).map(([groupType, groupContacts]) => {
                    if (groupContacts.length === 0) return null;
                    const groupInfo: Record<string, { emoji: string; color: string }> = {
                      admin: { emoji: "👑", color: "text-red-500" },
                      analyst: { emoji: "🔬", color: "text-blue-500" },
                      verifier: { emoji: "✅", color: "text-green-500" },
                      guest: { emoji: "👤", color: "text-gray-500" },
                    };
                    const gi = groupInfo[groupType] || groupInfo.guest;
                    return (
                      <div key={groupType}>
                        <div className="px-4 py-1.5 flex items-center gap-2">
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${gi.color} opacity-70`}>
                            {gi.emoji} {groupType}s
                          </span>
                          <div className="flex-1 h-px bg-border/40" />
                          <span className="text-[9px] text-muted-foreground/50">{groupContacts.length}</span>
                        </div>
                        {groupContacts.map((contact) => {
                          const isNewMsg = newlyUnread.has(contact._id);
                          const hasUnread = contact.unreadCount > 0;
                          const isActive = activeContact?._id === contact._id;
                          const lastMsgText = contact.lastMessage ? (() => {
                            const parsed = parseMessageAttachment(contact.lastMessage);
                            if (parsed?.attachment) return `📎 ${parsed.attachment.fileName}`;
                            return contact.lastMessage;
                          })() : null;

                          return (
                            <motion.button
                              key={contact._id}
                              onClick={() => openChat(contact)}
                              animate={isNewMsg ? { x: [0, -3, 3, -3, 3, 0] } : {}}
                              transition={{ duration: 0.3 }}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all relative ${
                                isActive
                                  ? "bg-primary/10 border-r-[3px] border-primary"
                                  : isNewMsg
                                  ? "bg-green-500/8 hover:bg-green-500/12"
                                  : "hover:bg-accent/50"
                              }`}
                            >
                              <div className="relative shrink-0">
                                <ContactAvatar contact={contact} size="md" showRing={isActive} showStatusDot={true} />
                                {isNewMsg && (
                                  <span className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-background animate-pulse z-10" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1">
                                  <div className="flex items-center gap-1 min-w-0">
                                    <span className={`text-sm truncate ${hasUnread || isNewMsg ? "font-bold text-foreground" : "font-medium text-foreground"}`}>
                                      {contact.name}
                                    </span>
                                    {contact.userType === "admin" && (
                                      <span className="shrink-0 text-red-500 opacity-70">{getUserTypeIcon("admin")}</span>
                                    )}
                                  </div>
                                  <span className={`text-[10px] shrink-0 ${hasUnread ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                                    {timeAgo(contact.lastMessageAt)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-1 mt-0.5">
                                  <p className={`text-xs truncate ${hasUnread ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                                    {lastMsgText || <span className="italic opacity-40">Start a conversation</span>}
                                  </p>
                                  {hasUnread && (
                                    <span className={`shrink-0 min-w-[1.1rem] h-[1.1rem] px-1 ${isNewMsg ? "bg-green-500" : "bg-primary"} text-white text-[10px] font-bold rounded-full flex items-center justify-center`}>
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

            {/* Bottom status bar */}
            <div className="px-4 py-2 border-t border-border flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full shrink-0 ${isOnline ? "bg-green-500" : "bg-orange-400"}`} />
              <span className="text-[10px] text-muted-foreground">{isOnline ? "Connected" : "Offline"}</span>
              {isOnline && <Wifi className="h-3 w-3 text-green-500/60 ml-auto" />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Right: Conversation Panel ── */}
      <div className="flex-1 flex min-w-0 h-full overflow-hidden">
        {!activeContact ? (
          <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground select-none px-6">
            <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="flex flex-col items-center gap-6 text-center">
              <div className="relative">
                <div className="h-32 w-32 rounded-full bg-gradient-to-br from-primary/15 via-primary/8 to-transparent flex items-center justify-center ring-1 ring-primary/10">
                  <MessageSquare className="h-16 w-16 text-primary/30" />
                </div>
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -bottom-1 -right-1 h-10 w-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full border-2 border-background flex items-center justify-center shadow-lg"
                >
                  <Check className="h-5 w-5 text-white" />
                </motion.div>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">Team Messaging</p>
                <p className="text-sm text-muted-foreground mt-2 max-w-xs leading-relaxed">
                  Select a team member from the list to start a secure conversation
                </p>
              </div>
              {totalUnread > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Badge className="bg-primary/10 text-primary border border-primary/20 px-4 py-1.5 text-sm font-semibold">
                    {totalUnread} unread {totalUnread === 1 ? "message" : "messages"} waiting
                  </Badge>
                </motion.div>
              )}
              <div className="flex items-center gap-4 text-xs text-muted-foreground/60">
                <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> End-to-end encrypted</span>
                <span>·</span>
                <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5" /> Real-time sync</span>
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-w-0">
            {/* ── Conversation Header ── */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/70 backdrop-blur-md shrink-0">
              <Button variant="ghost" size="icon" className="md:hidden h-8 w-8 shrink-0" onClick={() => setActiveContact(null)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <button onClick={() => setShowContactInfo(!showContactInfo)} className="flex items-center gap-3 flex-1 min-w-0 text-left hover:opacity-85 transition-opacity">
                <ContactAvatar contact={activeContact} size="md" showStatusDot={true} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-foreground truncate text-sm">{activeContact.name}</p>
                    {activeContact.userType === "admin" && (
                      <span className="flex items-center gap-0.5 text-[9px] font-bold border border-red-500/50 text-red-500 rounded px-1 py-px shrink-0 bg-red-500/5">
                        <Crown className="h-2.5 w-2.5" /> ADMIN
                      </span>
                    )}
                  </div>
                  {(() => {
                    const st = checkOnlineStatus(activeContact.lastLogin);
                    return st.isOnline ? (
                      <p className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
                        Active now
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-gray-400 dark:bg-gray-500 inline-block" />
                        {st.label}
                      </p>
                    );
                  })()}
                </div>
              </button>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost" size="icon" className="h-8 w-8 rounded-full"
                  onClick={() => { setShowMsgSearch(!showMsgSearch); if (showMsgSearch) setMsgSearch(""); }}
                  title="Search in conversation"
                >
                  <Search className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" title="Voice call (coming soon)" disabled>
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" title="Video call (coming soon)" disabled>
                  <Video className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setShowContactInfo(!showContactInfo)}>
                  <Info className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Message search bar */}
            <AnimatePresence>
              {showMsgSearch && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-b border-border bg-muted/20"
                >
                  <div className="flex items-center gap-2 px-4 py-2">
                    <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                    <input
                      autoFocus
                      type="text"
                      placeholder="Search in conversation..."
                      value={msgSearch}
                      onChange={(e) => setSearch(e.target.value)}
                      className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground text-foreground"
                    />
                    {msgSearch && (
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        {displayedMessages.length} result{displayedMessages.length !== 1 ? "s" : ""}
                      </span>
                    )}
                    <button onClick={() => { setMsgSearch(""); setShowMsgSearch(false); }} className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-accent transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Pinned Message Banner ── */}
            <AnimatePresence>
              {pinnedMsg && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-b border-border bg-primary/5"
                >
                  <div className="flex items-center gap-2 px-4 py-2">
                    <Pin className="h-3.5 w-3.5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-primary uppercase tracking-wide">Pinned Message</p>
                      <p className="text-xs text-foreground truncate">
                        {(() => {
                          const parsed = parseMessageAttachment(pinnedMsg.message);
                          return parsed ? (parsed.text || `📎 ${parsed.attachment?.fileName}`) : pinnedMsg.message;
                        })()}
                      </p>
                    </div>
                    <button onClick={() => setPinnedMsgId(null)} className="text-muted-foreground hover:text-foreground shrink-0">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Contact Info Panel (slide-in) ── */}
            <AnimatePresence>
              {showContactInfo && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-b border-border bg-card/80 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-4 p-4">
                    <ContactAvatar contact={activeContact} size="lg" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground">{activeContact.name}</p>
                      <p className="text-sm text-muted-foreground">{activeContact.email}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <Badge variant="outline" className={`text-[10px] h-4 px-1.5 ${getUserTypeColor(activeContact.userType)}`}>
                          {activeContact.userType}
                        </Badge>
                        {(() => {
                          const st = checkOnlineStatus(activeContact.lastLogin);
                          return st.isOnline ? (
                            <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 font-medium">
                              <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
                              Active now
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-gray-400 dark:bg-gray-500 inline-block" />
                              {st.label}
                            </span>
                          );
                        })()}
                        <span className="text-xs text-muted-foreground">
                          {messages.length} messages
                        </span>
                      </div>
                    </div>
                    <button onClick={() => setShowContactInfo(false)} className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-accent transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Messages Area ── */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-1 scroll-smooth"
              onScroll={handleMessagesScroll}
            >
              {isLoadingMessages && messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                  <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <p className="text-sm">Loading messages...</p>
                </div>
              ) : displayedMessages.length === 0 && messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center flex flex-col items-center gap-4">
                    <div className="relative">
                      <ContactAvatar contact={activeContact} size="lg" />
                      <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full border-2 border-background flex items-center justify-center">
                        <span className="text-[10px]">👋</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-base font-bold text-foreground">{activeContact.name}</p>
                      <p className="text-sm mt-1 opacity-70">Say hi! Start your first conversation 👋</p>
                    </div>
                  </motion.div>
                </div>
              ) : displayedMessages.length === 0 && msgSearch ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Search className="h-8 w-8 mb-2 opacity-30" />
                  <p className="text-sm">No messages match &ldquo;{msgSearch}&rdquo;</p>
                </div>
              ) : (
                <>
                  {displayedMessages.map((msg, i) => {
                    const isMine = msg.fromUserId === currentUserId;
                    const prevMsg = displayedMessages[i - 1];
                    const showDate = i === 0 || new Date(msg.createdAt || "").toDateString() !== new Date(prevMsg?.createdAt || "").toDateString();
                    const isSameAuthorAsPrev = prevMsg && prevMsg.fromUserId === msg.fromUserId &&
                      new Date(msg.createdAt || "").getTime() - new Date(prevMsg.createdAt || "").getTime() < 5 * 60000;
                    const parsed = parseMessageAttachment(msg.message);
                    const msgId = msg.id || String(i);
                    const reaction = reactions[msgId];
                    const isStarred = starredMessages.has(msgId);
                    const isPinned = pinnedMsgId === msgId;
                    const highlightSearch = msgSearch && (() => {
                      const text = parsed ? (parsed.text || "") : msg.message;
                      return text.toLowerCase().includes(msgSearch.toLowerCase());
                    })();

                    return (
                      <div key={msgId}>
                        {showDate && (
                          <div className="flex justify-center my-4">
                            <span className="text-[10px] font-semibold text-muted-foreground bg-muted/80 border border-border/60 px-4 py-1 rounded-full backdrop-blur-sm">
                              {formatDateHeader(msg.createdAt)}
                            </span>
                          </div>
                        )}
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.2 }}
                          className={`group flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"} ${isSameAuthorAsPrev ? "mb-0.5" : "mb-2"}`}
                        >
                          {!isMine && !isSameAuthorAsPrev && <ContactAvatar contact={activeContact} size="sm" />}
                          {!isMine && isSameAuthorAsPrev && <div className="w-8 shrink-0" />}

                          <div className={`relative max-w-[72%] ${isMine ? "items-end" : "items-start"} flex flex-col`}>
                            {/* Reply context bubble */}
                            {parsed?.replyTo && (
                              <div className={`mb-1.5 px-3 py-1.5 rounded-xl text-xs border-l-2 ${
                                isMine
                                  ? "border-white/40 bg-primary/20 text-primary-foreground/70 self-end"
                                  : "border-primary bg-primary/8 text-muted-foreground"
                              } max-w-full cursor-pointer hover:opacity-80 transition-opacity`}>
                                <span className="font-semibold block">{parsed.replyTo.isMine ? "You" : parsed.replyTo.fromName}</span>
                                <span className="opacity-80 truncate block">{parsed.replyTo.text?.slice(0, 60)}{parsed.replyTo.text?.length > 60 ? "…" : ""}</span>
                              </div>
                            )}

                            {/* Message Bubble */}
                            <div
                              className={`relative px-4 py-2.5 shadow-sm cursor-default select-text transition-all ${
                                highlightSearch ? "ring-2 ring-yellow-400/60" : ""
                              } ${isPinned ? "ring-1 ring-primary/40" : ""} ${
                                isMine
                                  ? "bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground rounded-2xl rounded-br-md"
                                  : "bg-card border border-border text-foreground rounded-2xl rounded-bl-md"
                              }`}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                const x = Math.min(e.clientX, window.innerWidth - 180);
                                const y = Math.min(e.clientY, window.innerHeight - 200);
                                setContextMenu({ msgId, x, y });
                              }}
                              onDoubleClick={() => {
                                const text = parsed ? (parsed.text || "") : msg.message;
                                setReplyTo({ id: msgId, text, fromName: isMine ? currentUserName : activeContact.name, isMine });
                                inputRef.current?.focus();
                              }}
                            >
                              {/* Star indicator */}
                              {isStarred && (
                                <Star className={`h-3 w-3 absolute -top-1.5 ${isMine ? "right-2" : "left-2"} ${isMine ? "text-yellow-300" : "text-yellow-500"} fill-current`} />
                              )}

                              {/* Attachment content */}
                              {parsed?.attachment ? (
                                <div className="space-y-2">
                                  <div className={`flex items-center gap-2 p-2 rounded-xl border ${isMine ? "bg-white/10 border-white/20" : "bg-muted/40 border-border/60"}`}>
                                    {parsed.attachment.mediaType === "image" ? (
                                      <ImageIcon className="h-4 w-4 text-sky-400 shrink-0" />
                                    ) : parsed.attachment.mediaType === "video" ? (
                                      <Video className="h-4 w-4 text-indigo-400 shrink-0" />
                                    ) : (
                                      <File className="h-4 w-4 text-amber-400 shrink-0" />
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-semibold truncate">{parsed.attachment.fileName}</p>
                                      <p className={`text-[9px] ${isMine ? "opacity-60" : "text-muted-foreground"}`}>
                                        {parsed.attachment.type === "evidence" ? "Evidence DB" : "File"}
                                      </p>
                                    </div>
                                    <a href={parsed.attachment.url} target="_blank" rel="noreferrer"
                                      className={`p-1.5 rounded-lg transition-all shrink-0 ${isMine ? "bg-white/15 hover:bg-white/25" : "bg-muted/60 hover:bg-muted"}`}
                                      onClick={e => e.stopPropagation()}>
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  </div>
                                  {parsed.attachment.mediaType === "image" && (
                                    <div className="rounded-xl overflow-hidden max-h-56 bg-muted/30 cursor-pointer group/img"
                                      onClick={() => window.open(parsed.attachment.url, "_blank")}>
                                      <img src={parsed.attachment.url} alt={parsed.attachment.fileName}
                                        className="object-cover w-full max-h-56 group-hover/img:scale-[1.02] transition-transform duration-200" />
                                    </div>
                                  )}
                                  {parsed.attachment.mediaType === "video" && (
                                    <div className="rounded-xl overflow-hidden bg-black max-h-56">
                                      <video src={parsed.attachment.url} controls className="w-full max-h-56" />
                                    </div>
                                  )}
                                  {parsed.text && <p className="text-sm leading-relaxed whitespace-pre-wrap break-words mt-1">{parsed.text}</p>}
                                </div>
                              ) : (
                                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.message}</p>
                              )}

                              {/* Time + read receipt */}
                              <div className={`flex items-center gap-1 justify-end mt-1.5 ${isMine ? "text-primary-foreground/50" : "text-muted-foreground/60"}`}>
                                <span className="text-[10px]" title={formatMsgTimeFull(msg.createdAt)}>{formatMsgTime(msg.createdAt)}</span>
                                {isMine && <CheckCheck className="h-3 w-3" />}
                              </div>

                            </div>

                            {/* Reaction emoji */}
                            {reaction && (
                              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`flex mt-1 ${isMine ? "justify-end" : "justify-start"}`}>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setReactions((prev) => { const n = { ...prev }; delete n[msgId]; return n; }); }}
                                  className="inline-flex items-center gap-1 text-xs bg-card border border-border/80 rounded-full px-2 py-0.5 shadow-sm hover:scale-105 transition-transform cursor-pointer"
                                  title="Click to remove reaction"
                                >
                                  <span>{reaction}</span>
                                  <span className="text-[10px] text-muted-foreground font-medium">1</span>
                                </button>
                              </motion.div>
                            )}

                            {/* Hover actions */}
                            <div className={`absolute ${isMine ? "left-0 -translate-x-full pr-1.5" : "right-0 translate-x-full pl-1.5"} top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5 z-10`}>
                              <button
                                title="Reply"
                                onClick={() => {
                                  const text = parsed ? (parsed.text || "") : msg.message;
                                  setReplyTo({ id: msgId, text, fromName: isMine ? currentUserName : activeContact.name, isMine });
                                  inputRef.current?.focus();
                                }}
                                className="h-7 w-7 rounded-full bg-background border border-border shadow-sm hover:bg-accent flex items-center justify-center transition-colors"
                              >
                                <Reply className="h-3 w-3 text-muted-foreground" />
                              </button>
                              <button
                                title="React"
                                onClick={(e) => { e.stopPropagation(); setReactionMenuMsgId(reactionMenuMsgId === msgId ? null : msgId); }}
                                className="h-7 w-7 rounded-full bg-background border border-border shadow-sm hover:bg-accent flex items-center justify-center transition-colors"
                              >
                                <Smile className="h-3 w-3 text-muted-foreground" />
                              </button>
                              <button
                                title="More options"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const x = Math.min(rect.left, window.innerWidth - 180);
                                  const y = Math.min(rect.bottom + 4, window.innerHeight - 200);
                                  setContextMenu({ msgId, x, y });
                                }}
                                className="h-7 w-7 rounded-full bg-background border border-border shadow-sm hover:bg-accent flex items-center justify-center transition-colors"
                              >
                                <MoreVertical className="h-3 w-3 text-muted-foreground" />
                              </button>
                            </div>

                            {/* Emoji picker */}
                            <AnimatePresence>
                              {reactionMenuMsgId === msgId && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.8, y: 4 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.8, y: 4 }}
                                  className={`absolute ${isMine ? "right-0" : "left-0"} -top-12 z-30 flex gap-0.5 bg-card border border-border rounded-full px-2 py-1.5 shadow-2xl`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {EMOJI_REACTIONS.map((emoji) => (
                                    <button
                                      key={emoji}
                                      onClick={() => { setReactions((prev) => ({ ...prev, [msgId]: emoji })); setReactionMenuMsgId(null); }}
                                      className="text-lg hover:scale-125 transition-transform leading-none px-0.5"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          {isMine && !isSameAuthorAsPrev && (
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary border border-primary/20 ring-1 ring-primary/10">
                              {getInitials(currentUserName)}
                            </div>
                          )}
                          {isMine && isSameAuthorAsPrev && <div className="w-8 shrink-0" />}
                        </motion.div>
                      </div>
                    );
                  })}

                  {/* Typing indicator */}
                  {isTyping && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-end gap-2 mb-2">
                      <ContactAvatar contact={activeContact} size="sm" />
                      <div className="flex flex-col gap-0.5">
                        <p className="text-[10px] text-muted-foreground px-1 font-medium">{activeContact.name.split(" ")[0]} is typing...</p>
                        <div className="px-4 py-3 bg-card border border-border rounded-2xl rounded-bl-md inline-flex gap-1.5 items-center">
                          {[0, 0.15, 0.3].map((delay, k) => (
                            <motion.span key={k} className="h-2 w-2 bg-muted-foreground/50 rounded-full"
                              animate={{ y: ["0%", "-50%", "0%"] }} transition={{ duration: 0.7, delay, repeat: Infinity }} />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* ── Scroll to bottom button ── */}
            <AnimatePresence>
              {showScrollBtn && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={scrollToBottom}
                  className="absolute bottom-24 right-6 h-9 w-9 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors z-20"
                >
                  <ChevronDown className="h-4 w-4" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* ── Reply Preview ── */}
            <AnimatePresence>
              {replyTo && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden bg-muted/30 border-t border-border"
                >
                  <div className="flex items-center gap-3 px-4 py-2.5">
                    <Reply className="h-4 w-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0 border-l-2 border-primary pl-2.5">
                      <p className="text-xs font-bold text-primary">Replying to {replyTo.isMine ? "yourself" : replyTo.fromName}</p>
                      <p className="text-xs text-muted-foreground truncate">{replyTo.text?.slice(0, 80)}{(replyTo.text?.length || 0) > 80 ? "…" : ""}</p>
                    </div>
                    <button onClick={() => setReplyTo(null)} className="text-muted-foreground hover:text-foreground shrink-0 p-1 rounded-full hover:bg-accent transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Input Bar ── */}
            <div className="border-t border-border px-3 py-3 bg-card/60 backdrop-blur-md shrink-0 relative">

              {/* Attachment selector */}
              <AnimatePresence>
                {showAttachmentMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: 8 }}
                    className="absolute bottom-16 left-3 bg-popover border border-border rounded-2xl shadow-2xl p-2 z-30 flex flex-col gap-1 w-56"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2 pt-1 pb-0.5">Attach</p>
                    <button
                      onClick={() => { setShowAttachmentMenu(false); handleOpenEvidenceModal(); }}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-accent text-left w-full transition-colors"
                    >
                      <div className="h-8 w-8 rounded-xl bg-sky-500/10 flex items-center justify-center">
                        <Folder className="h-4 w-4 text-sky-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Evidence DB</p>
                        <p className="text-[10px] text-muted-foreground">From evidence records</p>
                      </div>
                    </button>
                    <button
                      onClick={() => { setShowAttachmentMenu(false); fileInputRef.current?.click(); }}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-accent text-left w-full transition-colors"
                    >
                      <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <Plus className="h-4 w-4 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Local File</p>
                        <p className="text-[10px] text-muted-foreground">Upload from your device</p>
                      </div>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <input ref={fileInputRef} type="file" className="hidden" onChange={handleLocalFileChange} />

              {/* Attachment preview */}
              <AnimatePresence>
                {selectedAttachment && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="mb-3 bg-muted/50 border border-border rounded-xl p-3 flex gap-3 items-center"
                  >
                    <div className="h-12 w-12 rounded-xl border bg-background flex-shrink-0 overflow-hidden flex items-center justify-center">
                      {selectedAttachment.mediaType === "image" ? (
                        <img src={selectedAttachment.url} alt="" className="object-cover h-full w-full rounded-xl" />
                      ) : selectedAttachment.mediaType === "video" ? (
                        <Video className="h-5 w-5 text-indigo-500" />
                      ) : (
                        <File className="h-5 w-5 text-amber-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate">{selectedAttachment.fileName}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">
                        {selectedAttachment.type === "evidence" ? "📁 Evidence DB" : "💾 Local File"}
                      </p>
                    </div>
                    <button onClick={() => setSelectedAttachment(null)} className="text-muted-foreground hover:text-destructive p-1.5 rounded-full bg-background border hover:border-destructive/30 transition-all">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-2 items-end">
                <Button
                  type="button" variant="outline" size="icon"
                  className="rounded-full h-10 w-10 shrink-0 border-border hover:border-primary/50 hover:bg-primary/5 transition-all"
                  onClick={(e) => { e.stopPropagation(); setShowAttachmentMenu(!showAttachmentMenu); }}
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
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={newMessage}
                    onChange={(e) => { setNewMessage(e.target.value); autoResize(); handleTyping(); }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                    }}
                    placeholder={selectedAttachment ? "Add a caption..." : `Message ${activeContact.name.split(" ")[0]}…`}
                    className="w-full px-4 py-2.5 text-sm bg-background border border-border rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none leading-relaxed transition-all hover:border-border/80"
                    style={{ minHeight: "42px", maxHeight: "120px" }}
                  />
                </div>

                <Button
                  size="icon"
                  className="rounded-full h-10 w-10 shrink-0 shadow-md bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all"
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

              <p className="text-[10px] text-muted-foreground/50 text-center mt-1.5">
                Enter to send · Shift+Enter new line · Right-click for options · Double-click to reply
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Evidence Selector Modal ── */}
      <AnimatePresence>
        {showEvidenceModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowEvidenceModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 12 }}
              className="bg-card border border-border rounded-2xl w-full max-w-xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b border-border bg-muted/20">
                <div>
                  <h3 className="font-bold text-lg text-foreground">Select Evidence</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Attach evidence from the database to this message</p>
                </div>
                <button onClick={() => setShowEvidenceModal(false)} className="text-muted-foreground hover:text-foreground rounded-full p-2 hover:bg-accent transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {isLoadingEvidence ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
                    <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    <p className="text-sm">Loading evidence...</p>
                  </div>
                ) : evidenceList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-sm">
                    <ImageIcon className="h-10 w-10 mb-2 opacity-20" />
                    <p>No evidence records found in the database.</p>
                  </div>
                ) : (
                  evidenceList.map((ev) => (
                    <button
                      key={ev.id || ev._id}
                      onClick={() => handleSelectEvidence(ev)}
                      className="w-full flex items-center gap-3 p-3.5 border border-border rounded-xl bg-muted/20 hover:bg-muted/60 text-left transition-all hover:shadow-sm hover:border-primary/30 group"
                    >
                      <div className="h-14 w-14 rounded-xl bg-background border flex-shrink-0 overflow-hidden flex items-center justify-center group-hover:scale-105 transition-transform">
                        {ev.imageData ? (
                          <img src={ev.imageData} alt="" className="object-cover h-full w-full" />
                        ) : ev.type?.startsWith("video/") ? (
                          <Video className="h-6 w-6 text-indigo-500" />
                        ) : (
                          <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold truncate text-foreground">{ev.evidenceName || ev.fileName}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{ev.caseName || "Unassigned Case"}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5 uppercase tracking-wide">{ev.type || "Unknown type"}</p>
                      </div>
                      <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                          <ExternalLink className="h-3.5 w-3.5 text-primary" />
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

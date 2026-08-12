"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, ChevronRight } from "lucide-react";

// ─── FAQ knowledge base ───────────────────────────────────────────────────────
const FAQ: { q: string; keywords: string[]; a: string }[] = [
  {
    q: "How do I upload evidence?",
    keywords: ["upload", "add evidence", "submit", "how to upload"],
    a: "To upload evidence:\n1. Log in as an Analyst.\n2. Click **Upload Evidence** in the sidebar.\n3. Drag & drop your image/video or click to browse.\n4. Assign it to a case (or leave Unassigned).\n5. Click **Upload** — the file is saved and ready for analysis.",
  },
  {
    q: "What is the workflow?",
    keywords: ["workflow", "process", "steps", "how does it work", "procedure"],
    a: "The EviCheck workflow:\n1. **Upload** — Submit digital evidence (image/video).\n2. **Detect Tampering** — AI forensic analysis (ELA, PRNU, deepfake check).\n3. **Metadata Analysis** — EXIF & structural integrity scan.\n4. **Weapon Detection** — Scan for threats in the image.\n5. **Generate Report** — Produce a signed PDF forensic report.\n6. **Blockchain** — Preserve the evidence hash on-chain for immutability.",
  },
  {
    q: "What file types are supported?",
    keywords: ["file type", "format", "jpeg", "png", "video", "supported", "mp4"],
    a: "Supported formats:\n• **Images** — JPEG, PNG, WebP, TIFF (up to 10 MB)\n• **Videos** — MP4, MOV, AVI (up to 100 MB)\n\nFor best results, use original uncompressed files.",
  },
  {
    q: "How does tampering detection work?",
    keywords: ["tampering", "detect", "forgery", "manipulation", "ela", "prnu", "ai"],
    a: "Tampering detection uses a multi-layer approach:\n• **ELA (Error Level Analysis)** — Finds regions saved at different compression levels.\n• **PRNU** — Detects noise pattern inconsistencies from camera sensors.\n• **AI Deepfake Model** — Neural network trained on synthetic media.\n• **Metadata Checksums** — Verifies EXIF integrity.\n\nResults include a confidence score and specific anomaly flags.",
  },
  {
    q: "How do I generate a report?",
    keywords: ["report", "generate", "pdf", "export", "download"],
    a: "To generate a forensic report:\n1. Go to **Generate Report** in the sidebar.\n2. Select the evidence records to include.\n3. Click **Generate PDF Report**.\n4. The report includes analysis results, confidence scores, blockchain proof, and timestamps.",
  },
  {
    q: "What is blockchain preservation?",
    keywords: ["blockchain", "preserve", "hash", "immutable", "ledger", "chain"],
    a: "After analysis, you can preserve evidence on the blockchain:\n1. Go to **Blockchain** in the sidebar.\n2. Select your evidence and click **Preserve on Blockchain**.\n3. A cryptographic hash of the evidence is written to an Ethereum smart contract.\n4. This creates a tamper-proof, time-stamped record that can be verified by anyone.",
  },
  {
    q: "How do I view evidence records?",
    keywords: ["records", "history", "evidence list", "view", "past"],
    a: "Go to **Evidence Records** in the sidebar. You'll see all uploaded evidence with:\n• File name & thumbnail\n• Case assignment\n• Upload date\n• Analysis result (Authentic / Tampered / Pending)\n\nClick any record to open the full detail view with all analysis tabs.",
  },
  {
    q: "What are user roles?",
    keywords: ["roles", "admin", "analyst", "user type", "permission", "access"],
    a: "EviCheck has two main roles:\n• **Admin** — Manages users, cases, reviews flagged evidence, oversees the system.\n• **Analyst** — Uploads and analyzes evidence, generates reports, uses forensic tools.\n\nLogin redirects you to the correct dashboard based on your role.",
  },
  {
    q: "How do I assign evidence to a case?",
    keywords: ["case", "assign", "case id", "link", "attach"],
    a: "During upload, you'll see a **Case** dropdown. Select an existing case or leave it as Unassigned.\n\nYou can also reassign evidence later from the Evidence Records detail view.",
  },
  {
    q: "How do I use face analysis?",
    keywords: ["face", "facial", "biometric", "recognition", "identity"],
    a: "Face Analysis has three sub-tools:\n• **Detect Faces** — Finds and highlights faces in an image.\n• **Search Database** — Matches a face against the registered database using FAISS vector search.\n• **Register Face** — Adds a person to the biometric database.",
  },
  // ── New entries ──────────────────────────────────────────────────────────────
  {
    q: "How do I log in?",
    keywords: ["login", "log in", "sign in", "credentials", "password", "account"],
    a: "To log in:\n1. Go to the **Login** page.\n2. Enter your registered email and password.\n3. Click **Sign In**.\n\nYou'll be redirected to either the **Admin** or **Analyst** dashboard based on your account role.\n\nIf you don't have an account, click **Sign Up** to create one.",
  },
  {
    q: "How do I sign up?",
    keywords: ["sign up", "register", "create account", "new account", "signup"],
    a: "To create an account:\n1. Click **Sign Up** on the login page.\n2. Enter your name, email, and password.\n3. Select your role (Analyst).\n4. Click **Create Account**.\n\nNote: Admin accounts are created only by existing admins.",
  },
  {
    q: "How does video detection work?",
    keywords: ["video", "video detection", "video analysis", "deepfake video"],
    a: "Video Detection analyzes videos for manipulation:\n1. Go to **Video Detection** in the sidebar.\n2. Upload an MP4/MOV/AVI file.\n3. The system extracts frames and runs forensic analysis on each.\n4. Results show which frames are suspicious, overall deepfake probability, and a confidence score.",
  },
  {
    q: "How does weapon detection work?",
    keywords: ["weapon", "gun", "knife", "threat", "object detection", "yolo"],
    a: "Weapon Detection uses a **YOLOv8** deep learning model:\n1. Go to **Weapon Detection** in the sidebar.\n2. Upload an image.\n3. The model scans for firearms, knives, and other threats.\n4. Detected objects are highlighted with bounding boxes and confidence scores.\n\nResults are stored with the evidence record.",
  },
  {
    q: "What does the confidence score mean?",
    keywords: ["confidence", "score", "percentage", "accuracy", "probability"],
    a: "The confidence score (0–100%) represents how certain the AI is about its verdict:\n• **90–100%** — Very high certainty (e.g., strong tampering evidence)\n• **70–89%** — High confidence\n• **50–69%** — Moderate — review manually\n• **Below 50%** — Low confidence — treat as inconclusive\n\nAlways combine AI results with manual expert review for legal cases.",
  },
  {
    q: "What is metadata analysis?",
    keywords: ["metadata", "exif", "meta", "camera info", "gps", "location data"],
    a: "Metadata Analysis examines the hidden data embedded in image files:\n• **EXIF data** — Camera model, date/time, GPS coordinates, software used.\n• **ELA** — Error Level Analysis to detect edited regions.\n• **PRNU** — Camera sensor noise fingerprint analysis.\n• **Risk score** — Combined verdict: LOW / MEDIUM / HIGH / CRITICAL.\n\nGo to **Metadata Analysis** in the sidebar to run it.",
  },
  {
    q: "How do I create a case?",
    keywords: ["create case", "new case", "add case", "case management"],
    a: "Cases are managed by **Admins**:\n1. Log in as Admin and go to the **Cases** tab.\n2. Click **New Case**.\n3. Enter the case name, description, and assign analysts.\n4. Save — analysts can now assign evidence to this case during upload.",
  },
  {
    q: "What is the admin panel?",
    keywords: ["admin", "admin panel", "admin dashboard", "administration", "manage users"],
    a: "The Admin Dashboard provides:\n• **User Management** — Create, edit, deactivate analyst accounts.\n• **Case Overview** — Monitor all active and resolved cases.\n• **Evidence Review** — Flag or approve submitted evidence.\n• **Team Chat** — Communicate with analysts.\n• **System Stats** — View platform-wide metrics.\n\nAccess it by logging in with an Admin account.",
  },
  {
    q: "How does the team chat work?",
    keywords: ["chat", "team chat", "message", "communicate", "discuss"],
    a: "The Team Chat allows Admins and Analysts to communicate:\n• Click **Chats** in the sidebar.\n• Select a contact (Admin or Analyst) to open a conversation.\n• Send text messages in real time.\n• Messages are stored and synced across sessions.\n\nAdmins can see all analyst conversations; analysts see their own.",
  },
  {
    q: "Is my evidence data secure?",
    keywords: ["secure", "security", "privacy", "safe", "encrypted", "data protection"],
    a: "Yes, EviCheck uses multiple security layers:\n• **JWT Authentication** — Secure session tokens for all requests.\n• **Role-based access** — Analysts can only see their own evidence.\n• **Blockchain hashing** — Evidence integrity is cryptographically verifiable.\n• **Encrypted storage** — Files stored securely via Cloudinary.\n• **MongoDB** — Evidence metadata stored in a secured database.",
  },
  {
    q: "How do I delete evidence?",
    keywords: ["delete", "remove", "erase", "clear evidence"],
    a: "Evidence deletion is restricted to **Admins** to maintain audit integrity:\n1. Log in as Admin.\n2. Go to **Evidence Records**.\n3. Open the evidence detail.\n4. Select **Delete** from the action menu.\n\nAnalysts cannot delete evidence to ensure chain-of-custody compliance.",
  },
  {
    q: "Why is my analysis showing as pending?",
    keywords: ["pending", "not analyzed", "waiting", "stuck", "not complete"],
    a: "**Pending** means the evidence was uploaded but analysis hasn't run yet.\n\nTo start analysis:\n1. Go to **Evidence Records** and open the evidence.\n2. Click **Detect Tampering**, **Metadata Analysis**, or the relevant tab.\n3. Click **Run Analysis** — results will appear within seconds.\n\nIf it stays pending, check that the backend service is running.",
  },
  {
    q: "Can I analyze a video for deepfakes?",
    keywords: ["deepfake", "fake video", "synthetic", "generated video", "ai video"],
    a: "Yes! Go to **Video Detection** in the sidebar:\n1. Upload a video file (MP4, MOV, AVI).\n2. The system samples frames and runs the deepfake detection model on each.\n3. Results show a **frame-by-frame deepfake probability** and an overall verdict.\n\nThis helps detect AI-generated or face-swapped videos.",
  },
  {
    q: "How do I contact support?",
    keywords: ["support", "help", "contact", "issue", "problem", "bug"],
    a: "For support:\n• Use the **Team Chat** inside the platform to contact your Admin.\n• Click the **Help** button (top-right corner) for quick tips.\n• For technical issues, check that all services (backend + database) are running.\n\nThis assistant also answers most common questions — just type your question!",
  },
  {
    q: "What is EviCheck?",
    keywords: ["what is evicheck", "about", "platform", "what does this do", "evidence.ai"],
    a: "**EviCheck (evidence.ai)** is a digital forensic evidence verification platform.\n\nIt helps law enforcement, legal teams, and investigators:\n• Detect **tampered or forged** images and videos using AI.\n• Analyze **metadata** for authenticity clues.\n• **Preserve evidence** immutably on the blockchain.\n• Detect **weapons and threats** in images.\n• Perform **facial recognition** against a biometric database.\n• Generate **legally-admissible forensic reports**.",
  },
];

interface Message {
  id: number;
  from: "user" | "bot";
  text: string;
  time: string;
}

const SUGGESTIONS = [
  "How do I upload evidence?",
  "What is the workflow?",
  "How does tampering detection work?",
  "How do I generate a report?",
  "What file types are supported?",
  "What is blockchain preservation?",
  "How do I use face analysis?",
  "How does weapon detection work?",
  "Is my evidence data secure?",
  "What is EviCheck?",
];

function getAnswer(input: string): string {
  const lower = input.toLowerCase();
  const match = FAQ.find((f) =>
    f.keywords.some((k) => lower.includes(k))
  );
  if (match) return match.a;
  return "I'm not sure about that yet. You can ask me about:\n• Uploading evidence\n• The workflow\n• Tampering detection\n• Generating reports\n• Blockchain preservation\n• User roles\n• Face analysis\n\nTry one of the quick questions below!";
}

function formatText(text: string) {
  // Bold **text**, newlines → <br>
  const parts = text.split(/(\*\*[^*]+\*\*|\n)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part === "\n") return <br key={i} />;
    return <span key={i}>{part}</span>;
  });
}

function now() {
  return new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export default function FaqChatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      from: "bot",
      text: "👋 Hi! I'm the EviCheck assistant. Ask me anything about uploading evidence, the workflow, analysis features, or anything else!",
      time: now(),
    },
  ]);
  const [typing, setTyping] = useState(false);
  const [pulse, setPulse] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Stop pulsing after first open
  useEffect(() => {
    if (open) setPulse(false);
  }, [open]);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [messages, open]);

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setInput("");

    const userMsg: Message = { id: Date.now(), from: "user", text: trimmed, time: now() };
    setMessages((prev) => [...prev, userMsg]);
    setTyping(true);

    // Simulate a short thinking delay
    setTimeout(() => {
      const answer = getAnswer(trimmed);
      const botMsg: Message = { id: Date.now() + 1, from: "bot", text: answer, time: now() };
      setMessages((prev) => [...prev, botMsg]);
      setTyping(false);
    }, 700);
  };

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-[9999]">
        <AnimatePresence>
          {!open && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setOpen(true)}
              className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 shadow-lg shadow-blue-500/30 text-white"
              aria-label="Open chat assistant"
            >
              <MessageCircle className="h-6 w-6" />
              {pulse && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex h-4 w-4 rounded-full bg-blue-500" />
                </span>
              )}
            </motion.button>
          )}
        </AnimatePresence>

        {/* Chat Window */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="absolute bottom-0 right-0 w-[360px] sm:w-[400px] rounded-2xl shadow-2xl border border-border bg-background overflow-hidden flex flex-col"
              style={{ maxHeight: "560px", minHeight: "460px" }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white flex-shrink-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm leading-none">EviCheck Assistant</p>
                  <p className="text-[11px] text-white/70 mt-0.5">Ask me anything about the platform</p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scroll-smooth">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 ${msg.from === "user" ? "flex-row-reverse" : "flex-row"}`}
                  >
                    {msg.from === "bot" && (
                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-white mb-1">
                        <Bot className="h-3.5 w-3.5" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                        msg.from === "user"
                          ? "bg-gradient-to-br from-blue-600 to-violet-600 text-white rounded-br-sm"
                          : "bg-muted text-foreground rounded-bl-sm"
                      }`}
                    >
                      {formatText(msg.text)}
                      <p className={`text-[10px] mt-1 ${msg.from === "user" ? "text-white/60 text-right" : "text-muted-foreground"}`}>
                        {msg.time}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {typing && (
                  <div className="flex items-end gap-2">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-white">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                    <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center">
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Quick Suggestions */}
              <div className="px-3 pb-2 flex-shrink-0">
                <div className="flex gap-1.5 flex-wrap">
                  {SUGGESTIONS.slice(0, 3).map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border border-border bg-muted/60 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ChevronRight className="h-3 w-3 flex-shrink-0" />
                      {s.replace("How do I ", "").replace("What ", "").replace("How does ", "")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input */}
              <div className="flex items-center gap-2 px-3 pb-3 pt-1 flex-shrink-0 border-t border-border">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                  placeholder="Ask a question..."
                  className="flex-1 text-sm bg-muted rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/50 placeholder:text-muted-foreground/60 border border-border"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || typing}
                  className="h-9 w-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-600 to-violet-600 text-white disabled:opacity-40 hover:opacity-90 transition-opacity flex-shrink-0"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

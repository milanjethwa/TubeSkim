import React, { useState, useEffect, useRef } from "react";
import {
  Youtube,
  FileText,
  Sparkles,
  Clipboard,
  Check,
  FileDown,
  Layers,
  Bookmark,
  Plus,
  Trash2,
  Heart,
  ArrowRight,
  ArrowLeft,
  Tv,
  Settings2,
  Clock,
  Brain,
  CheckSquare,
  HelpCircle,
  GraduationCap,
  MessageSquare,
  Send,
  Download,
  Terminal,
  Activity,
  User,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  BookOpen
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Markdown from "react-markdown";
import { SAMPLE_NOTEWORKS } from "./sampleData";
import {
  SkimmedNotesResult,
  SavedNoteItem,
  ChatMessage,
  ChapterItem,
  ActionItem,
  KeyConceptItem,
  QuizItem,
  FlashcardItem
} from "./types";

export default function App() {
  // Input parameters
  const [url, setUrl] = useState("");
  const [transcriptText, setTranscriptText] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [skimStyle, setSkimStyle] = useState<"Executive Summary" | "Action Plan" | "Deep Study Guide" | "Interactive Q&A">("Executive Summary");

  // Drag and Drop files
  const [isDragging, setIsDragging] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // States
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeNotes, setActiveNotes] = useState<SkimmedNotesResult>(SAMPLE_NOTEWORKS[0].notes);
  const [history, setHistory] = useState<SavedNoteItem[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>("sample-1");

  // Tabs
  const [activeTab, setActiveTab] = useState<"notes" | "chapters" | "concepts" | "actions" | "flashcards" | "quizzes">("notes");
  const [activeRightTab, setActiveRightTab] = useState<"editor" | "assistant">("editor");

  // Real-time Text Editor (Markdown)
  const [editableMarkdown, setEditableMarkdown] = useState(SAMPLE_NOTEWORKS[0].notes.formattedMarkdown);

  // Copied State
  const [copied, setCopied] = useState(false);

  // Interactive Flashcards Statuses
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [flashcardFlipped, setFlashcardFlipped] = useState(false);
  const [flashcardStatuses, setFlashcardStatuses] = useState<Record<number, "mastered" | "practice" | "unseen">>({});

  // Interactive Quiz Answers
  const [quizReveal, setQuizReveal] = useState<Record<number, boolean>>({});

  // Active Player seek position
  const [playerStartOffset, setPlayerStartOffset] = useState<number>(0);

  // Interactive Notes Chat Assistant
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: "model", text: "Hi! Ask me anything regarding this video context or these study notes. I can elaborate on complex definitions, extract more steps, or rewrite definitions for you! 🎓" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isSendingChat, setIsSendingChat] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Status message rotation for high aesthetics during API trigger
  const [generationStep, setGenerationStep] = useState(0);
  const steps = [
    "Contacting AI Studio Gateway...",
    "Deeply analyzing transcript syntax & metadata...",
    "Reconstructing chronological chapters & lecture milestones...",
    "Formulating action items & high-priority concept glossary...",
    "Structuring interactive study flashcards & quiz context...",
    "Assembling ultimate beautiful export draft..."
  ];

  // User ID Authentication states
  const [userId, setUserId] = useState<string | null>(() => {
    return localStorage.getItem("yt_notes_studio_userId");
  });
  const [loginInputId, setLoginInputId] = useState("");
  const [loginPasscode, setLoginPasscode] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Seed default credentials for standard profile showcase on first launch
  useEffect(() => {
    if (!localStorage.getItem("yt_notes_pin_milan")) {
      localStorage.setItem("yt_notes_pin_milan", "1234");
    }
  }, []);

  // Sync personal histories when active User ID switches
  useEffect(() => {
    const userHistoryKey = userId
      ? `yt_notes_studio_history_${userId.toLowerCase()}`
      : "yt_notes_studio_history";

    const cached = localStorage.getItem(userHistoryKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as SavedNoteItem[];
        setHistory(parsed);
        if (parsed.length > 0) {
          setActiveNotes(parsed[0].notes);
          setSelectedNoteId(parsed[0].id);
        } else {
          setActiveNotes(SAMPLE_NOTEWORKS[0].notes);
          setSelectedNoteId(SAMPLE_NOTEWORKS[0].id);
        }
      } catch (e) {
        setHistory(SAMPLE_NOTEWORKS);
        localStorage.setItem(userHistoryKey, JSON.stringify(SAMPLE_NOTEWORKS));
        setActiveNotes(SAMPLE_NOTEWORKS[0].notes);
        setSelectedNoteId(SAMPLE_NOTEWORKS[0].id);
      }
    } else {
      // First-time or guest session gets preloaded with the gorgeous samples
      setHistory(SAMPLE_NOTEWORKS);
      localStorage.setItem(userHistoryKey, JSON.stringify(SAMPLE_NOTEWORKS));
      setActiveNotes(SAMPLE_NOTEWORKS[0].notes);
      setSelectedNoteId(SAMPLE_NOTEWORKS[0].id);
    }
  }, [userId]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const targetId = loginInputId.trim();
    if (!targetId) {
      setLoginError("Please enter a valid User ID.");
      return;
    }

    if (!/^[a-zA-Z0-9_\-]+$/.test(targetId)) {
      setLoginError("User ID must contain alphanumeric characters, dashes, or underscores only.");
      return;
    }

    const lowerId = targetId.toLowerCase();

    // Check if user already exists and has a passcode registered
    const storedPin = localStorage.getItem(`yt_notes_pin_${lowerId}`);
    if (storedPin) {
      // If passcode exists, verify it
      if (loginPasscode !== storedPin) {
        setLoginError("Incorrect passcode for this User ID. Please try again.");
        return;
      }
    } else {
      // If no passcode exists and user enters one, we save it as their passcode (registration)
      if (loginPasscode) {
        localStorage.setItem(`yt_notes_pin_${lowerId}`, loginPasscode);
      }
    }

    // Successfully authenticated
    localStorage.setItem("yt_notes_studio_userId", targetId);
    setUserId(targetId);
    setLoginInputId("");
    setLoginPasscode("");
    setIsLoginModalOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("yt_notes_studio_userId");
    setUserId(null);
  };

  // Sync edited markdown with current active notes
  useEffect(() => {
    if (activeNotes) {
      setEditableMarkdown(activeNotes.formattedMarkdown);
    }
    // Reset cards and quizzes when topic changes
    setFlashcardIndex(0);
    setFlashcardFlipped(false);
    setFlashcardStatuses({});
    setQuizReveal({});
    setPlayerStartOffset(0);
    setChatMessages([
      {
        role: "model",
        text: `I've loaded "${activeNotes?.title}". I am fully primed on this context! Ask me any specific queries or requests about this video.`
      }
    ]);
  }, [activeNotes]);

  // Handle interactive step increments during notes synthesis
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      interval = setInterval(() => {
        setGenerationStep((prev) => (prev + 1) % steps.length);
      }, 3500);
    } else {
      setGenerationStep(0);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Scroll Chat window automatically
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isSendingChat]);

  // Extract Youtube ID
  const getYTVideoId = (inputUrl: string) => {
    try {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = inputUrl.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
    } catch {
      return null;
    }
  };

  // Helper to parse chapters string timestamps (e.g. "03:15" or "02:15 - 05:40") to total seconds
  const parseTimestampToSeconds = (timestampStr: string): number => {
    if (!timestampStr) return 0;
    const firstPart = timestampStr.split("-")[0].trim();
    const parts = firstPart.split(":").map(Number);
    if (parts.length === 3) {
      // hh:mm:ss
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      // mm:ss
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 1 && !isNaN(parts[0])) {
      return parts[0];
    }
    return 0;
  };

  // Detect whether chapter is currently the playing active segment in player offset
  const isChapterActive = (chapter: ChapterItem, index: number, chapters: ChapterItem[]) => {
    const currentStart = parseTimestampToSeconds(chapter.timestamp);
    let nextStart = Infinity;
    if (index < chapters.length - 1) {
      nextStart = parseTimestampToSeconds(chapters[index + 1].timestamp);
    }
    return playerStartOffset >= currentStart && playerStartOffset < nextStart;
  };

  // Safe file reader helper for .vtt or .srt upload
  const processSubtitleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        // Strip timestamps if it is a rigid srt or vtt file to simplify summary input
        const simplified = content
          .replace(/\r?\n\d+\r?\n\d\d:\d\d:\d\d.*\r?\n/g, "\n") // srt tags
          .replace(/WEBVTT[\s\S]*?\n\n/g, "") // vtt metadata
          .replace(/-->.*\n/g, "\n") // timestamps
          .replace(/\n+/g, "\n") // empty lines
          .trim();

        setTranscriptText(simplified);
        setUploadSuccess(`Successfully extracted "${file.name}" (${file.size} bytes)`);
        setTimeout(() => setUploadSuccess(null), 5000);
      }
    };
    reader.readAsText(file);
  };

  // Drag-and-drop listener functions
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSubtitleFile(e.dataTransfer.files[0]);
    }
  };

  // Trigger Backend API to generate structured notes
  const handleGenerateNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() && !transcriptText.trim()) {
      setErrorMessage("Please supply either a valid video URL OR paste/drag transcript text underneath.");
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    // Parse nice visual title
    const videoId = getYTVideoId(url);
    const simulatedTitle = titleFromUrl(url) || (transcriptText ? `Draft Notes #${Math.floor(Math.random() * 900 + 100)}` : "Advanced Lecture Notes");

    try {
      const response = await fetch("/api/gemini/prepare-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          title: simulatedTitle,
          transcriptRaw: transcriptText.trim(),
          skimStyle,
          customInstructions: customInstructions.trim(),
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to generate notes. Please inspect your server connection.");
      }

      const data = (await response.json()) as SkimmedNotesResult;

      // Ensure robust local values if server drops any property
      const preparedNotes: SkimmedNotesResult = {
        title: data.title || simulatedTitle,
        channelName: data.channelName || "Video Creator Channel",
        duration: data.duration || "15:00",
        originalWordCount: data.originalWordCount || Math.floor(transcriptText.split(/\s+/).length) || 1200,
        savedReadingTimeMinutes: data.savedReadingTimeMinutes || Math.max(5, Math.floor((data.originalWordCount || 1200) / 250)),
        summaryIntro: data.summaryIntro || "Notes dynamically compiled by YouTube Notes Studio.",
        chapters: data.chapters || [],
        actionItems: data.actionItems || [],
        keyConcepts: data.keyConcepts || [],
        quizzes: data.quizzes || [],
        flashcards: data.flashcards || [],
        formattedMarkdown: data.formattedMarkdown || ""
      };

      const newItem: SavedNoteItem = {
        id: `note-${Date.now()}`,
        date: new Date().toISOString().split("T")[0],
        url: url.trim(),
        skimStyle,
        notes: preparedNotes,
      };

      // Add to state and LocalStorage history lists
      const updatedHistory = [newItem, ...history];
      setHistory(updatedHistory);
      if (userId) {
        localStorage.setItem(`yt_notes_studio_history_${userId.toLowerCase()}`, JSON.stringify(updatedHistory));
      } else {
        localStorage.setItem("yt_notes_studio_history", JSON.stringify(updatedHistory));
      }

      setActiveNotes(preparedNotes);
      setSelectedNoteId(newItem.id);
      setActiveTab("notes");

      // Clear input fields
      setUrl("");
      setTranscriptText("");
      setCustomInstructions("");
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred. Check server outputs.");
    } finally {
      setIsGenerating(false);
    }
  };

  const titleFromUrl = (address: string) => {
    if (!address) return "";
    try {
      const u = new URL(address);
      if (u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be")) {
        return "YouTube Context Stream";
      }
      return u.pathname.substring(u.pathname.lastIndexOf("/") + 1) || "Web Lecture Stream";
    } catch {
      return "Pasted Transcript Deck";
    }
  };

  // Delete element from history logs
  const handleDeleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter((item) => item.id !== id);
    setHistory(updated);
    if (userId) {
      localStorage.setItem(`yt_notes_studio_history_${userId.toLowerCase()}`, JSON.stringify(updated));
    } else {
      localStorage.setItem("yt_notes_studio_history", JSON.stringify(updated));
    }

    if (selectedNoteId === id) {
      if (updated.length > 0) {
        setActiveNotes(updated[0].notes);
        setSelectedNoteId(updated[0].id);
      } else {
        // Fallback to SAMPLE
        setActiveNotes(SAMPLE_NOTEWORKS[0].notes);
        setSelectedNoteId(SAMPLE_NOTEWORKS[0].id);
      }
    }
  };

  // Helper: Copy markdown value
  const handleCopy = () => {
    navigator.clipboard.writeText(editableMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper: Export / Download text file
  const handleDownload = () => {
    const blob = new Blob([editableMarkdown], { type: "text/markdown;charset=utf-8;" });
    const link = document.createElement("a");
    const safeTitle = activeNotes.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `youtube-study-${safeTitle}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Notes interactive assistant query proxy
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isSendingChat) return;

    const userMsg = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setIsSendingChat(true);

    try {
      // Package up context parameters safely
      const notesDetails = `
Title: ${activeNotes.title}
Channel: ${activeNotes.channelName}
Summarized Core Insights:
${editableMarkdown}

Glossary:
${activeNotes.keyConcepts.map(c => `${c.concept}: ${c.definition}`).join("\n")}
`;

      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: userMsg,
          notesContext: notesDetails,
          chatHistory: chatMessages.slice(-8) // Send recent message sliding window to preserve token payload size
        }),
      });

      if (!response.ok) {
        throw new Error("Chat assistant error. Ensure backend server is active.");
      }

      const resData = await response.json();
      setChatMessages((prev) => [...prev, { role: "model", text: resData.response }]);
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        { role: "model", text: `⚠️ Error during assistant chat stream: ${err.message || "Failed to load model answer."}` }
      ]);
    } finally {
      setIsSendingChat(false);
    }
  };

  const currentVideoUrl = history.find(item => item.id === selectedNoteId)?.url || "";
  const currentVideoId = getYTVideoId(currentVideoUrl);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex flex-col selection:bg-emerald-500 selection:text-zinc-950">
      
      {/* HEADER SECTION */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-zinc-950 font-bold italic text-xl shadow-md shadow-emerald-500/10">
            S
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white flex items-center gap-2">
              TubeSkim
              <span className="text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-mono px-2 py-0.5 rounded uppercase tracking-wider font-semibold">Active v2.4</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Active stats display */}
          {activeNotes && (
            <div className="hidden md:flex items-center space-x-4 bg-zinc-900/80 px-4 py-1.5 rounded-lg border border-zinc-800 text-xs text-zinc-350">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-500" />
                <span>Original Words: <span className="font-mono text-white font-semibold">{activeNotes.originalWordCount || "1,200"}</span></span>
              </div>
              <div className="h-4 w-[1px] bg-zinc-800" />
              <div className="flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-emerald-400" />
                <span>Saved Time: <span className="font-mono text-emerald-400 font-semibold">{activeNotes.savedReadingTimeMinutes || "14"} min</span></span>
              </div>
            </div>
          )}

          {userId ? (
            <div className="flex items-center space-x-2 bg-zinc-900/90 border border-zinc-800/80 pl-3 pr-2 py-1.5 rounded-xl text-xs">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="font-mono font-bold tracking-tight text-zinc-200">{userId}</span>
              </div>
              <div className="h-3 w-[1px] bg-zinc-800 mx-1.5" />
              <button
                onClick={handleLogout}
                className="px-2.5 py-1 bg-zinc-800/80 hover:bg-zinc-850 border border-zinc-750 hover:border-red-500/25 text-[10px] font-mono text-zinc-400 hover:text-red-400 rounded-lg transition-all cursor-pointer"
                title="Sign out of study session"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 bg-zinc-900/90 border border-zinc-850/80 pl-3 pr-2 py-1.5 rounded-xl text-xs">
              <div className="flex items-center gap-1.5 text-zinc-400">
                <Settings2 className="w-3.5 h-3.5 text-emerald-500/80" />
                <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">Local (Guest)</span>
              </div>
              <div className="h-3 w-[1px] bg-zinc-855 mx-1.5" />
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 font-semibold font-sans text-[10px] text-zinc-950 rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                title="Sign in to dynamic user workspace profile"
              >
                <User className="w-3 h-3 text-zinc-950" />
                <span>Link Profile</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ERROR MESSAGE NOTIFICATION */}
      {errorMessage && (
        <div className="bg-red-950/80 border-b border-red-500/20 text-red-200 px-6 py-3 text-sm flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-2">
            <span className="font-mono bg-red-800/80 text-white rounded px-1.5 py-0.5 text-xs font-semibold">Error</span>
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-white transition-colors p-1">
            &times;
          </button>
        </div>
      )}

      {/* MAIN CONTAINER WORKSPACE */}
      <div className="flex-1 lg:max-h-[calc(100vh-64px)] flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-zinc-850 overflow-hidden">
        
        {/* LEFT COLUMN: CONTROL DECK / WORKSPACE CREATION PANEL */}
        <section className="w-full lg:w-[480px] shrink-0 p-6 flex flex-col space-y-6 overflow-y-auto bg-zinc-900/20">
          
          {/* LECTURE HISTORY SIDEBAR PRESETS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-emerald-500" />
                History
              </span>
              <span className="text-xs bg-zinc-800 border border-zinc-700/60 px-2 py-0.5 rounded-full text-zinc-350 font-mono">
                {history.length} Drafts
              </span>
            </div>
            
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1 text-zinc-100">
              {history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setActiveNotes(item.notes);
                    setSelectedNoteId(item.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setActiveNotes(item.notes);
                      setSelectedNoteId(item.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex justify-between items-start text-xs group relative cursor-pointer select-none focus:outline-none focus:ring-1 focus:ring-emerald-500/40 ${
                    selectedNoteId === item.id
                      ? "bg-zinc-900 border-emerald-500/40 shadow-inner ring-1 ring-emerald-500/10"
                      : "bg-zinc-900/40 border-zinc-800/60 hover:bg-zinc-900/80 hover:border-zinc-700"
                  }`}
                >
                  <div className="space-y-1 pr-6 flex-1 min-w-0">
                    <div className="font-medium text-zinc-200 line-clamp-1">{item.notes.title}</div>
                    <div className="flex items-center space-x-2 text-[10px] text-zinc-500">
                      <span className="font-mono bg-zinc-800 px-1 py-0.2 rounded text-[9px] text-zinc-400 border border-zinc-705">{item.skimStyle}</span>
                      <span>•</span>
                      <span>By {item.notes.channelName || "Creator"}</span>
                    </div>
                  </div>
                  
                  {/* Delete Button */}
                  <button
                    onClick={(e) => handleDeleteNote(item.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-450 transition-all absolute right-2.5 top-2.5 p-1 rounded hover:bg-red-950/20 cursor-pointer"
                    title="Remove Draft"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="h-[1px] bg-zinc-800/60" />

          {/* MAIN GENERATION FORM */}
          <form onSubmit={handleGenerateNotes} className="space-y-5 flex-1 flex flex-col justify-start">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Youtube className="w-3.5 h-3.5 text-red-500" />
                YouTube Video Link
              </label>
              <div className="relative">
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-zinc-900/80 border border-zinc-800 focus:border-emerald-500/85 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all pl-10"
                />
                <div className="absolute left-3 top-3.5 text-zinc-500">
                  <Youtube className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* DRAG AND DROP TRANSCRIPT UPLOADER */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider font-mono flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-450" />
                  Subtitle Transcript (Paste/Upload)
                </span>
                <span className="text-[10px] text-zinc-500 tracking-normal capitalize font-normal">Optional if link is provided</span>
              </label>

              {/* Upload Success Toast inside Box */}
              {uploadSuccess && (
                <div className="bg-emerald-950/65 border border-emerald-500/20 text-emerald-250 text-xs px-3 py-2 rounded-xl mb-2 flex items-center space-x-1.5">
                  <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-400" />
                  <span className="truncate">{uploadSuccess}</span>
                </div>
              )}

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-4 transition-all text-center flex flex-col items-center justify-center relative cursor-text min-h-[140px] ${
                  isDragging
                    ? "bg-zinc-900 border-emerald-500/70"
                    : transcriptText.trim()
                    ? "bg-zinc-900/30 border-zinc-800"
                    : "bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700/80"
                }`}
              >
                <textarea
                  value={transcriptText}
                  onChange={(e) => setTranscriptText(e.target.value)}
                  placeholder="Paste subtitle transcription here... or drag and drop a .srt, .txt, or .vtt file to extract instantly."
                  className="w-full bg-transparent resize-none border-none focus:outline-none text-xs text-zinc-200 placeholder-zinc-500 h-28 focus:ring-0 leading-relaxed"
                />
                
                {!transcriptText.trim() && (
                  <div className="pointer-events-none mt-2 text-[10px] text-zinc-500 flex items-center justify-center space-x-1">
                    <span>Drag subtitle here or click to import</span>
                  </div>
                )}
              </div>
            </div>

            {/* TUNING STYLE SELECTOR */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Settings2 className="w-3.5 h-3.5 text-emerald-500" />
                Summary type
              </label>
              
              <div className="relative">
                <select
                  value={skimStyle}
                  onChange={(e) => setSkimStyle(e.target.value as any)}
                  className="w-full bg-zinc-900 border border-zinc-800/80 focus:border-emerald-500/80 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 transition-all font-sans appearance-none pr-10 cursor-pointer"
                >
                  <option value="Executive Summary" className="bg-zinc-950 text-zinc-200">Executive Summary (takeaways, stats)</option>
                  <option value="Action Plan" className="bg-zinc-950 text-zinc-200">Action Plan (checklists, next tasks)</option>
                  <option value="Deep Study Guide" className="bg-zinc-950 text-zinc-200">Deep Study Guide (glossary, lecture notes)</option>
                  <option value="Interactive Q&A" className="bg-zinc-950 text-zinc-200">Interactive Q&A (quizzes, mock exams, flashcards)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-500">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>

              <p className="text-[10px] text-zinc-500 italic px-1">
                {skimStyle === "Executive Summary" && "Quick overview, key takeaways, and estimated reading time statistics."}
                {skimStyle === "Action Plan" && "Prescriptive, step-by-step checklists and actionable guidelines."}
                {skimStyle === "Deep Study Guide" && "Comprehensive glossary definitions, in-depth breakdowns, and notes."}
                {skimStyle === "Interactive Q&A" && "Quizzes, mock exams, and interactive flashcard drills."}
              </p>
            </div>

            {/* CUSTOM INSTRUCTION BOX */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  Focus areas
                </label>
                <span className="text-[10px] text-zinc-500">Optional</span>
              </div>
              <input
                type="text"
                placeholder="e.g., focus on coding blocks, highlight math variables, adopt casual tone"
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                className="w-full bg-zinc-900/80 border border-zinc-800 focus:border-emerald-500/80 rounded-xl px-3.5 py-2.5 text-xs text-zinc-250 placeholder-zinc-650 focus:outline-none transition-colors"
              />
            </div>

            {/* TRIGGER NOTES GENERATION METHOD */}
            <button
               type="submit"
               disabled={isGenerating || (!url.trim() && !transcriptText.trim())}
               className={`w-full py-4 px-4 rounded-xl font-medium text-xs tracking-wider uppercase flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                 isGenerating
                   ? "bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-700/40"
                   : (!url.trim() && !transcriptText.trim())
                   ? "bg-zinc-900/50 text-zinc-500 cursor-not-allowed border border-zinc-800/80"
                   : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/5 hover:-translate-y-0.5"
               }`}
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mr-1" />
                  <span>Synthesizing Notes Workspace...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 stroke-[2.5]" />
                  <span>Generate Custom Notes Deck</span>
                </>
              )}
            </button>
          </form>
        </section>

        {/* MIDDLE COLUMN & RIGHT COLUMN COMBINED (WORKSPACE ENGINE) */}
        <section className="flex-1 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-zinc-850 overflow-hidden min-h-0 bg-zinc-950">
          
          {/* MIDDLE PANE: MAIN TABBED ANALYSIS WORKBENCH */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
            
            {/* API LOADING CARD */}
            <AnimatePresence>
              {isGenerating && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-zinc-950/95 backdrop-blur z-40 flex flex-col items-center justify-center p-8 text-center"
                >
                  <div className="max-w-md space-y-6">
                    {/* Animated geometric nodes spinner */}
                    <div className="relative w-20 h-20 mx-auto">
                      <div className="absolute inset-0 rounded-full border border-emerald-500/10 animate-ping" />
                      <div className="absolute top-2 left-2 right-2 bottom-2 rounded-full border-t border-emerald-400 animate-spin" />
                      <div className="absolute top-4 left-4 right-4 bottom-4 rounded-full border-b border-emerald-500 animate-spin [animation-duration:1.5s]" />
                      <div className="absolute inset-[30px] rounded-full bg-gradient-to-tr from-emerald-500 to-zinc-700 opacity-80" />
                    </div>

                    <div className="space-y-2">
                       <h3 className="font-semibold text-lg text-white">Sieving Video Transcript</h3>
                       <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                        {steps[generationStep]}
                      </p>
                    </div>

                    <div className="h-1 w-48 bg-zinc-800 rounded-full mx-auto overflow-hidden">
                       <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full animate-progress" style={{ width: "80%" }} />
                    </div>

                    <p className="text-[10px] text-zinc-650 uppercase tracking-widest font-mono">
                      powered by Gemini 3.5 Flash
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* TAB SELECTORS */}
            <div className="border-b border-zinc-800/80 bg-zinc-900/10 px-4 py-2 flex items-center overflow-x-auto space-x-2 shrink-0 scrollbar-none">
              {(
                [
                  { id: "notes", label: "Markdown Draft", icon: FileText },
                  { id: "chapters", label: "Lecture Timeline", icon: Tv },
                  { id: "concepts", label: "Concept Glossary", icon: GraduationCap },
                  { id: "actions", label: "Action Guide", icon: CheckSquare },
                  { id: "flashcards", label: "Flashcards Studio", icon: Brain },
                  { id: "quizzes", label: "Self Quiz", icon: HelpCircle }
                ] as const
              ).map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition-all shrink-0 border uppercase tracking-wider font-mono ${
                      activeTab === tab.id
                        ? "bg-zinc-900 border-zinc-700/80 text-emerald-450 ring-1 ring-emerald-500/10"
                        : "bg-transparent border-transparent text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 stroke-[2]" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* CURRENT ACTIVE CONTENT CONTAINER */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 min-h-0 min-w-0">
              {activeNotes && (
                <div className="space-y-6 max-w-4xl mx-auto">
                  
                  {/* VIDEO RECEPTOR HEADER CARD */}
                  <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center space-x-2 text-[10px] text-emerald-400 font-mono tracking-wider uppercase">
                        <Activity className="w-3.5 h-3.5 animate-pulse" />
                        <span>{activeNotes.channelName || "Creator Masterclass"}</span>
                      </div>
                      <h2 className="text-xl font-bold tracking-tight text-white leading-snug truncate">
                        {activeNotes.title}
                      </h2>
                      <p className="text-xs text-zinc-400 line-clamp-1 leading-relaxed">
                        {activeNotes.summaryIntro}
                      </p>
                    </div>
                    
                    {/* Visual reading statistics badge */}
                    <div className="shrink-0 flex items-center space-x-3 bg-zinc-950 px-4 py-3 rounded-xl border border-zinc-800 text-xs shadow-inner uppercase font-mono text-zinc-300">
                      <div>
                        <div className="text-[9px] text-zinc-500 leading-none">Estimated Reading</div>
                        <div className="text-base font-semibold font-mono text-emerald-400 mt-1">
                          ~{activeNotes.savedReadingTimeMinutes || 5} Min
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* INTERACTIVE VIDEO PLAYER EMBED COMPONENT */}
                  <div id="youtube-player-anchor" className="scroll-mt-20">
                    {currentVideoId ? (
                      <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl overflow-hidden p-3 shadow-2xl relative group/player">
                        <div className="absolute top-4 right-4 z-10 flex items-center bg-zinc-900/80 backdrop-blur border border-zinc-805 px-2.5 py-1 rounded text-[10px] font-mono text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-550 animate-ping mr-1.5" />
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute left-[10px]" />
                          <span>SYNCHRONIZED PLAYER</span>
                        </div>
                        <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black shadow-inner">
                          <iframe
                            src={`https://www.youtube.com/embed/${currentVideoId}?autoplay=0&start=${playerStartOffset}&enablejsapi=1`}
                            title={activeNotes.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            className="absolute inset-0 w-full h-full"
                            key={`${currentVideoId}-${playerStartOffset}`}
                          ></iframe>
                        </div>
                        <div className="mt-3 px-2 py-1 flex flex-col md:flex-row md:items-center justify-between gap-2">
                          <div className="flex items-center space-x-2 text-xs min-w-0 flex-1">
                            <div className="p-1.5 bg-emerald-500/15 rounded-lg text-emerald-400 shrink-0">
                              <Tv className="w-4 h-4 text-emerald-500" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-zinc-100 truncate text-xs">Playing: {activeNotes.title}</p>
                              <a 
                                href={`https://www.youtube.com/watch?v=${currentVideoId}&t=${playerStartOffset}s`}
                                target="_blank"
                                rel="noreferrer"
                                referrerPolicy="no-referrer"
                                className="text-[10px] text-zinc-450 font-mono flex items-center gap-1 hover:text-emerald-400 transition-colors truncate"
                              >
                                {currentVideoUrl}
                                <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                              </a>
                            </div>
                          </div>
                          
                          {/* Playback navigation feedback controls */}
                          <div className="shrink-0 flex items-center space-x-2">
                            <span className="text-[9px] font-mono text-zinc-550 uppercase select-none">Seek Time:</span>
                            <span className="text-xs font-mono font-bold text-emerald-400 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded">
                              {Math.floor(playerStartOffset / 60)}m {playerStartOffset % 60}s
                            </span>
                            <button
                              onClick={() => {
                                setPlayerStartOffset(0);
                              }}
                              className="p-1.5 px-2 text-[10px] font-mono uppercase bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 rounded cursor-pointer transition-colors"
                              title="Reset player to start"
                            >
                              Restart
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-zinc-900/10 w-full rounded-2xl p-6 border border-dashed border-zinc-800 text-center flex flex-col items-center justify-center space-y-3">
                        <Youtube className="w-8 h-8 text-zinc-700 animate-pulse" />
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-zinc-300">No Playable Video Connected</p>
                          <p className="text-[10px] text-zinc-550 max-w-sm mx-auto">Input a live YouTube URL on the left panel to synthesize a fully interactive, navigable key moments video timeline.</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* TAB 1: BEAUTIFUL MARKDOWN RENDERING WINDOW */}
                  {activeTab === "notes" && (
                    <div className="bg-zinc-900/10 border border-transparent rounded-2xl p-2 leading-relaxed text-sm">
                      <div className="prose prose-invert prose-emerald max-w-none prose-sm font-sans text-zinc-300 antialiased space-y-4">
                        <Markdown>{editableMarkdown}</Markdown>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: CHAPTER TIMELINE CARDS */}
                  {activeTab === "chapters" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] font-mono uppercase text-zinc-400 tracking-wider">Timeline Key Moments & Summaries</span>
                        <span className="text-[10px] font-mono text-zinc-500">Click timestamps to jump video playback</span>
                      </div>

                      {activeNotes.chapters && activeNotes.chapters.length > 0 ? (
                        activeNotes.chapters.map((chapter, idx) => {
                          const active = isChapterActive(chapter, idx, activeNotes.chapters);
                          return (
                            <div
                              key={idx}
                              className={`border rounded-xl p-5 transition-all flex items-start space-x-4 group/chapter hover:translate-y-[-1px] ${
                                active
                                  ? "bg-emerald-950/10 border-emerald-500/40 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500/10"
                                  : "bg-zinc-900/25 border-zinc-800/80 hover:bg-zinc-900/50 hover:border-zinc-750"
                              }`}
                            >
                              <button
                                onClick={() => {
                                  const seconds = parseTimestampToSeconds(chapter.timestamp);
                                  setPlayerStartOffset(seconds);
                                  document.getElementById("youtube-player-anchor")?.scrollIntoView({ behavior: "smooth" });
                                }}
                                className={`text-xs px-2.5 py-1.5 rounded-lg shrink-0 font-mono tracking-tight font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                                  active
                                    ? "bg-emerald-500 text-zinc-950 ring-2 ring-emerald-400/20"
                                    : "bg-zinc-900 border border-zinc-800 text-emerald-400 hover:bg-zinc-800 hover:border-emerald-500/30 font-medium"
                                }`}
                                title={`Navigate video player to ${chapter.timestamp}`}
                              >
                                <Clock className={`w-3.5 h-3.5 ${active ? "text-zinc-950 animate-pulse animate-duration-1000" : "text-emerald-500"}`} />
                                {chapter.timestamp}
                              </button>

                              <div className="space-y-2 flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <h4 className={`text-sm font-semibold tracking-tight transition-colors ${
                                    active ? "text-emerald-400 font-bold" : "text-white"
                                  }`}>
                                    {chapter.title}
                                  </h4>
                                  {active && (
                                    <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded animate-pulse shrink-0">
                                      NOW PLAYING
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-zinc-400 leading-relaxed font-sans">{chapter.summary}</p>
                                {chapter.keyPoints && chapter.keyPoints.length > 0 && (
                                  <ul className="text-xs text-zinc-400 space-y-1.5 mt-3 list-disc pl-4 marker:text-emerald-500">
                                    {chapter.keyPoints.map((pt, pIdx) => (
                                      <li key={pIdx} className="leading-relaxed hover:text-zinc-300 transition-colors">{pt}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-12 text-zinc-500 text-xs">
                          No chronological modules were synthesized. Swap style modes to generate deep ones.
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: KEY CONCEPTS GLOSSARY GLOSSARY */}
                  {activeTab === "concepts" && (
                    <div className="border border-zinc-800/85 rounded-xl overflow-hidden bg-zinc-900/10">
                      <table className="w-full text-left text-xs divide-y divide-zinc-800/80">
                        <thead className="bg-zinc-900/50 font-mono uppercase tracking-wider text-[10px] text-zinc-400">
                          <tr>
                            <th className="px-5 py-3">Concept / Variable</th>
                            <th className="px-5 py-3">High Yield Definition</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/80 text-zinc-350">
                          {activeNotes.keyConcepts && activeNotes.keyConcepts.length > 0 ? (
                            activeNotes.keyConcepts.map((concept, idx) => (
                              <tr key={idx} className="hover:bg-zinc-900/20 transition-colors">
                                <td className="px-5 py-4 font-semibold text-emerald-400 align-top whitespace-nowrap">
                                  {concept.concept}
                                </td>
                                <td className="px-5 py-4 leading-relaxed text-zinc-300">
                                  {concept.definition}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={2} className="px-5 py-8 text-center text-zinc-500">
                                No concepts were isolated in this file. Paste more specific transcripts!
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* TAB 4: ACTION ITEMS GUIDE CHECKBOX */}
                  {activeTab === "actions" && (
                    <div className="space-y-3">
                      {activeNotes.actionItems && activeNotes.actionItems.length > 0 ? (
                        activeNotes.actionItems.map((action, idx) => (
                          <div
                            key={idx}
                            className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4 flex items-center justify-between"
                          >
                            <div className="flex items-start space-x-3 pr-4 flex-1">
                              <input
                                type="checkbox"
                                className="w-4 h-4 mt-0.5 rounded border-zinc-800 bg-zinc-950 text-emerald-500 focus:ring-0 focus:ring-offset-0 focus:outline-none cursor-pointer"
                              />
                              <div className="space-y-0.5 min-w-0">
                                <span className="text-xs text-zinc-200 block font-medium leading-relaxed">{action.task}</span>
                                {action.category && (
                                  <span className="text-[10px] text-zinc-500 font-mono border border-zinc-800 px-1.5 py-0.2 rounded bg-zinc-950">
                                    {action.category}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="shrink-0">
                              <span className={`text-[9px] font-semibold tracking-wider font-mono uppercase px-2 py-0.5 rounded-full border ${
                                action.priority.toLowerCase() === "high"
                                  ? "bg-red-950/40 text-red-400 border-red-500/25"
                                  : action.priority.toLowerCase() === "medium"
                                  ? "bg-amber-950/40 text-amber-400 border-amber-500/25"
                                  : "bg-zinc-900 border-zinc-800 text-zinc-400"
                              }`}>
                                {action.priority}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12 text-zinc-500 text-xs">
                          No prescriptive checklists generated for this layout. Change Vibe style to Action Plan.
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 5: INTERACTIVE 3D FLIP FLASHCARDS DECK */}
                  {activeTab === "flashcards" && (
                    <div className="space-y-6">
                      {activeNotes.flashcards && activeNotes.flashcards.length > 0 ? (
                        <div className="max-w-md mx-auto space-y-6">
                          
                          {/* PROGRESS COUNTER */}
                          <div className="flex items-center justify-between text-xs text-zinc-400 px-1 font-mono uppercase tracking-wider">
                            <span>Card {flashcardIndex + 1} of {activeNotes.flashcards.length}</span>
                            <span>Score: {Object.values(flashcardStatuses).filter(v => v === "mastered").length} Mastered</span>
                          </div>

                          {/* 3D CARD BOX */}
                          <div
                            onClick={() => setFlashcardFlipped(!flashcardFlipped)}
                            className="perspective-1000 h-[260px] cursor-pointer"
                          >
                            <div className={`relative w-full h-full transition-transform duration-500 preserve-3d ${
                              flashcardFlipped ? "rotate-y-180" : ""
                            }`}>
                              
                              {/* FRONT: QUESTION SIDE */}
                              <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-zinc-900 to-zinc-900/60 border border-zinc-800/80 rounded-2xl p-8 flex flex-col justify-between backface-hidden shadow-lg shadow-black/40">
                                <div className="text-[10px] text-emerald-400 font-mono uppercase tracking-widest flex items-center justify-between">
                                  <span>Flashcard Deck</span>
                                  <span className="bg-zinc-800 border border-zinc-700/60 text-zinc-350 rounded px-1.5 py-0.5 text-[8px]">Click to Reveal</span>
                                </div>
                                <div className="flex-1 flex items-center justify-center text-center">
                                  <p className="text-base text-white tracking-tight font-sans leading-relaxed">
                                    {activeNotes.flashcards[flashcardIndex].front}
                                  </p>
                                </div>
                                <div className="text-[10px] text-zinc-500 text-center font-mono">
                                  Click Card to Flip
                                </div>
                              </div>

                              {/* BACK: SOLUTION SIDE */}
                              <div className="absolute inset-0 w-full h-full bg-zinc-900 border border-emerald-500/30 rounded-2xl p-8 flex flex-col justify-between backface-hidden rotate-y-180 shadow-lg shadow-emerald-500/5">
                                <div className="text-[10px] text-emerald-400 font-mono uppercase tracking-widest">
                                  Solution Explanation
                                </div>
                                <div className="flex-1 flex items-center justify-center text-center">
                                  <p className="text-sm text-zinc-200 font-sans leading-relaxed">
                                    {activeNotes.flashcards[flashcardIndex].back}
                                  </p>
                                </div>
                                <div className="text-[10px] text-zinc-500 text-center font-mono">
                                  Click to Flip Back
                                </div>
                              </div>

                            </div>
                          </div>

                          {/* SCORING BAR ACTIONS */}
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setFlashcardStatuses(prev => ({ ...prev, [flashcardIndex]: "practice" }));
                                if (flashcardIndex < activeNotes.flashcards.length - 1) {
                                  setFlashcardIndex(prev => prev + 1);
                                  setFlashcardFlipped(false);
                                }
                              }}
                              className="py-2.5 px-3 rounded-xl border border-rose-500/20 bg-rose-950/20 text-rose-300 hover:bg-rose-950/40 text-xs transition-colors flex items-center justify-center space-x-1"
                            >
                              <span>Practice More</span>
                              {flashcardStatuses[flashcardIndex] === "practice" && <Check className="w-3.5 h-3.5" />}
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setFlashcardStatuses(prev => ({ ...prev, [flashcardIndex]: "mastered" }));
                                if (flashcardIndex < activeNotes.flashcards.length - 1) {
                                  setFlashcardIndex(prev => prev + 1);
                                  setFlashcardFlipped(false);
                                }
                              }}
                              className="py-2.5 px-3 rounded-xl border border-emerald-500/20 bg-emerald-950/20 text-emerald-300 hover:bg-emerald-950/40 text-xs transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                            >
                              <span>Got It! (Mastered)</span>
                              {flashcardStatuses[flashcardIndex] === "mastered" && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </button>
                          </div>

                          {/* DECK NAVIGATION CAROUSEL */}
                          <div className="flex items-center justify-between">
                            <button
                              disabled={flashcardIndex === 0}
                              onClick={() => {
                                setFlashcardIndex(prev => prev - 1);
                                setFlashcardFlipped(false);
                              }}
                              className="p-2 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors cursor-pointer"
                            >
                              <ArrowLeft className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => {
                                setFlashcardIndex(0);
                                setFlashcardFlipped(false);
                                setFlashcardStatuses({});
                              }}
                              className="text-[10px] text-zinc-500 hover:text-zinc-300 font-mono uppercase select-none cursor-pointer flex items-center gap-1"
                            >
                              <RotateCcw className="w-3 h-3" />
                              Reset Deck
                            </button>

                            <button
                              disabled={flashcardIndex === activeNotes.flashcards.length - 1}
                              onClick={() => {
                                setFlashcardIndex(prev => prev + 1);
                                setFlashcardFlipped(false);
                              }}
                              className="p-2 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors cursor-pointer"
                            >
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>

                        </div>
                      ) : (
                        <div className="text-center py-12 text-zinc-500 text-xs">
                          No flashcards compiled. Let's make a new notes deck.
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 6: SELF-TESTING INTERACTIVE QUIZZES */}
                  {activeTab === "quizzes" && (
                    <div className="space-y-4">
                      {activeNotes.quizzes && activeNotes.quizzes.length > 0 ? (
                        activeNotes.quizzes.map((quiz, quizIdx) => (
                          <div
                            key={quizIdx}
                            className="bg-zinc-900/15 border border-zinc-800 rounded-xl p-5 space-y-4 hover:border-zinc-700 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-1">
                                <span className="text-[10px] text-zinc-500 font-mono block">Question #{quizIdx + 1}</span>
                                <h4 className="text-sm font-semibold text-white leading-relaxed">{quiz.question}</h4>
                              </div>
                              <button
                                onClick={() => setQuizReveal(prev => ({ ...prev, [quizIdx]: !prev[quizIdx] }))}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-mono tracking-wider uppercase shrink-0 select-none transition-colors cursor-pointer ${
                                  quizReveal[quizIdx]
                                    ? "bg-zinc-800 text-emerald-400 border border-emerald-500/20"
                                    : "bg-emerald-500 text-zinc-950 hover:bg-emerald-400 font-semibold"
                                }`}
                              >
                                {quizReveal[quizIdx] ? "Hide Answer" : "Reveal Answer"}
                              </button>
                            </div>
                            
                            {/* Quiz Answer Drawer */}
                            <AnimatePresence>
                              {quizReveal[quizIdx] && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="bg-zinc-900/60 border-l-2 border-emerald-500/80 p-4 rounded-r-xl text-xs text-zinc-350 leading-relaxed font-sans shadow-inner">
                                    <span className="block font-mono text-[9px] text-emerald-400 uppercase tracking-widest mb-1">Teacher key:</span>
                                    {quiz.answer}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12 text-zinc-500 text-xs">
                          No quiz assets generated for this notes content.
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: WORKSPACE TOOLBARS: EDITOR & IA CHAT ASSISTANT */}
          <div className="w-full md:w-[420px] shrink-0 border-t md:border-t-0 p-5 flex flex-col space-y-4 overflow-hidden bg-zinc-900/10 min-h-[460px] md:min-h-0">
            
            {/* TOGGLE WORKSPACE MODE */}
            <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800/80">
              <button
                onClick={() => setActiveRightTab("editor")}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-mono uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  activeRightTab === "editor"
                    ? "bg-zinc-900 text-white shadow-sm ring-1 ring-zinc-850"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Text Editor</span>
              </button>
              
              <button
                onClick={() => setActiveRightTab("assistant")}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  activeRightTab === "assistant"
                    ? "bg-zinc-900 text-white shadow-sm ring-1 ring-zinc-850"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Video Assistant</span>
              </button>
            </div>

            {/* AREA 1: INTERACTIVE MARKDOWN DRAFTER & EXPORT PANEL */}
            {activeRightTab === "editor" && (
              <div className="flex-1 flex flex-col min-h-0 space-y-4">
                
                {/* TOOLBAR BUTTONS */}
                <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-zinc-500">
                  <span>Workspace Draft</span>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={handleCopy}
                      className="p-1.5 text-zinc-400 hover:text-white transition-colors bg-zinc-950 border border-zinc-850 rounded hover:border-zinc-700 flex items-center gap-1 px-2.5 text-[10px] cursor-pointer"
                      title="Copy Raw Markdown"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-400 stroke-[3]" /> : <Clipboard className="w-3 h-3" />}
                      <span>{copied ? "Copied" : "Copy"}</span>
                    </button>
                    
                    <button
                      onClick={handleDownload}
                      className="p-1.5 text-zinc-400 hover:text-white transition-colors bg-zinc-950 border border-zinc-850 rounded hover:border-zinc-700 flex items-center gap-1 px-2.5 text-[10px] cursor-pointer"
                      title="Export as Markdown File"
                    >
                      <Download className="w-3 h-3" />
                      <span>Export</span>
                    </button>
                  </div>
                </div>

                {/* TEXT AREA COMPONENT */}
                <div className="flex-1 min-h-0 relative">
                  <textarea
                    value={editableMarkdown}
                    onChange={(e) => setEditableMarkdown(e.target.value)}
                    className="w-full h-full bg-zinc-950 border border-zinc-850 focus:border-emerald-500/50 rounded-2xl px-4 py-4 text-xs font-mono leading-relaxed focus:outline-none focus:ring-0 overflow-y-auto text-zinc-300 resize-none placeholder-zinc-600"
                    placeholder="Raw Markdown workspace content loads here. You can manually adjust parameters, fix errors, or append supplementary study concepts directly."
                  />
                  <div className="absolute bottom-2.5 right-3 text-[9px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-850 px-2 py-0.5 rounded pointer-events-none uppercase">
                    Markdown Draft
                  </div>
                </div>
              </div>
            )}

            {/* AREA 2: CHAT COMPANION ASSISTANT INTERACTION BAR */}
            {activeRightTab === "assistant" && (
              <div className="flex-1 flex flex-col min-h-0 space-y-4">
                
                {/* CHAT OUTPUT DESK */}
                <div className="flex-1 bg-zinc-950 rounded-2xl border border-zinc-850/80 p-4 overflow-y-auto space-y-3 flex flex-col min-h-0">
                  {chatMessages.map((msg, index) => (
                    <div
                      key={index}
                      className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs whitespace-pre-wrap leading-relaxed ${
                        msg.role === "user"
                          ? "bg-emerald-500 text-zinc-950 font-semibold self-end rounded-tr-none"
                          : "bg-zinc-900 border border-zinc-800 text-zinc-350 self-start rounded-tl-none font-sans"
                      }`}
                    >
                      {msg.role === "model" && (
                        <div className="flex items-center space-x-1 mb-1 font-mono text-[9px] text-emerald-400 uppercase tracking-wider select-none">
                          <Brain className="w-3 h-3 text-emerald-400" />
                          <span>Assistant</span>
                        </div>
                      )}
                      {msg.text}
                    </div>
                  ))}

                  {/* LOADING CHAT RESPONSE MARKER */}
                  {isSendingChat && (
                    <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl px-3.5 py-3 text-xs text-zinc-400 self-start rounded-tl-none max-w-[80%] flex items-center space-x-2 animate-pulse">
                      <div className="flex space-x-1">
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" />
                      </div>
                      <span className="font-mono text-[10px] uppercase">Reviewing lecture...</span>
                    </div>
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* CHAT INPUT BAR */}
                <form onSubmit={handleSendChatMessage} className="flex space-x-2 shrink-0">
                  <input
                    type="text"
                    placeholder="Ask standard or custom follow-up details..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={isSendingChat}
                    className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-emerald-500/50 rounded-xl px-4 py-3 text-xs text-zinc-100 placeholder-zinc-650 focus:outline-none focus:ring-0 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={isSendingChat || !chatInput.trim()}
                    className="p-3 bg-emerald-500 text-zinc-950 hover:bg-emerald-400 rounded-xl disabled:bg-zinc-900 disabled:text-zinc-600 transition-all shadow-md shadow-emerald-500/5 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center shrink-0"
                  >
                    <Send className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </form>

              </div>
            )}

          </div>

        </section>

      </div>

      {/* AUTHENTICATION LIGHTWEIGHT MODAL */}
      <AnimatePresence>
        {isLoginModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLoginModalOpen(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="p-6 relative space-y-5">
                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setIsLoginModalOpen(false)}
                  className="absolute top-4 right-4 text-zinc-400 hover:text-white text-lg p-1.5 hover:bg-zinc-800 rounded-lg transition-all cursor-pointer"
                >
                  &times;
                </button>

                <div className="text-center space-y-2 mb-4">
                  <div className="mx-auto w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-zinc-950 font-black italic text-xl shadow-lg shadow-emerald-500/20">
                    S
                  </div>
                  <h2 className="text-sm font-bold tracking-tight text-white mt-3">Link Workspace Profile</h2>
                  <p className="text-[11px] text-zinc-400 max-w-xs mx-auto leading-relaxed">
                    Access your isolated chapters, custom notes draft, quiz outcomes, and flashcards by typing your User ID.
                  </p>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  {loginError && (
                    <div className="bg-red-950/40 border border-red-500/20 p-2.5 rounded-xl text-[11px] text-red-200 font-mono">
                      {loginError}
                    </div>
                  )}

                  <div className="space-y-1 text-left">
                    <label className="text-[9px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">
                      Study User ID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. milan, guest_dev"
                      value={loginInputId}
                      onChange={(e) => setLoginInputId(e.target.value)}
                      maxLength={20}
                      required
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-650 focus:outline-none focus:ring-1 focus:ring-emerald-500/10 transition-all font-mono"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[9px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">
                      Passcode PIN <span className="text-zinc-650 lowercase font-normal"> (optional)</span>
                    </label>
                    <input
                      type="password"
                      placeholder="Enter or set PIN"
                      value={loginPasscode}
                      onChange={(e) => setLoginPasscode(e.target.value)}
                      maxLength={6}
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-605 focus:outline-none focus:ring-1 focus:ring-emerald-500/10 transition-all font-mono tracking-widest text-center"
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsLoginModalOpen(false)}
                      className="flex-1 bg-zinc-850 hover:bg-zinc-800 border border-zinc-800 text-zinc-350 font-semibold text-xs py-2 rounded-xl transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1 shadow-md shadow-emerald-500/5"
                    >
                      <span>Link Profile</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>

                <div className="pt-3 border-t border-zinc-805 space-y-2 text-left">
                  <div className="flex items-start space-x-1.5 text-[10px] text-zinc-550 leading-normal">
                    <p>
                      <span className="font-mono bg-zinc-800 text-zinc-350 px-1 py-0.5 rounded text-[8px] font-bold mr-1">INFO</span>
                      A new User ID allocates a fresh workspace. If you provide a passcode, it registers as your secure credentials!
                    </p>
                  </div>

                  <div className="bg-emerald-500/5 border border-emerald-500/10 p-2.5 rounded-xl flex items-start space-x-2">
                    <Settings2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5 text-[9px] text-zinc-400">
                      <span className="block font-bold text-emerald-400">Default Demo Profile:</span>
                      <span className="block font-mono">
                        User ID:{" "}
                        <button
                          type="button"
                          className="text-emerald-300 hover:underline cursor-pointer"
                          onClick={() => {
                            setLoginInputId("milan");
                            setLoginPasscode("1234");
                          }}
                        >
                          milan
                        </button>
                      </span>
                      <span className="block font-mono">Passcode: <span className="text-zinc-550">1234</span></span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

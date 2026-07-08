"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  MessageSquare,
  X,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  Send,
  Loader2,
  Sparkles
} from "lucide-react";
import { useAuth } from "./providers";

type ChatMessage = {
  sender: "user" | "ai";
  text: string;
};

export default function FloatingChatbot() {
  const pathname = usePathname();
  const { token, user } = useAuth();
  
  // Smart startup ID detection
  const match = pathname ? pathname.match(/^\/project\/([^/]+)/) : null;
  const currentUrlStartupId = match ? match[1] : null;

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Speech Synthesis states
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState<number>(1.0);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Sync active startup to localStorage memory
  useEffect(() => {
    if (currentUrlStartupId) {
      localStorage.setItem("startupforge-last-startup", currentUrlStartupId);
    }
  }, [currentUrlStartupId]);

  // Load conversation memory from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("startupforge-chat-history");
    if (savedHistory) {
      try {
        setMessages(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse chat memory", e);
      }
    } else {
      // Default welcome message
      setMessages([
        {
          sender: "ai",
          text: "Hello! I am your AI Startup Advisor. Let's forge your venture. Ask me about your startup score, market research TAM, competitor positioning, or recent activities!"
        }
      ]);
    }

    const savedMuted = localStorage.getItem("startupforge-chat-muted");
    if (savedMuted) {
      setIsMuted(savedMuted === "true");
    }
    
    const savedSpeed = localStorage.getItem("startupforge-chat-speed");
    if (savedSpeed) {
      setSpeed(parseFloat(savedSpeed));
    }
  }, []);

  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("startupforge-chat-history", JSON.stringify(messages));
    }
  }, [messages]);

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Monitor SpeechSynthesis state
  useEffect(() => {
    const checkSpeechState = () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        setIsPlaying(window.speechSynthesis.speaking);
        setIsPaused(window.speechSynthesis.paused);
      }
    };
    const timer = setInterval(checkSpeechState, 500);
    return () => clearInterval(timer);
  }, []);

  // Speak AI responses
  const speakText = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    // Clear current speech
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);

    if (isMuted) return;

    // Strip Markdown formatting for clean reading
    const cleanText = text
      .replace(/[*#`_\-]/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = speed;

    // Pick professional voice if available
    const voices = window.speechSynthesis.getVoices();
    const premiumVoice = voices.find(
      (v) =>
        v.name.includes("Google") ||
        v.name.includes("Premium") ||
        (v.lang.startsWith("en") && v.name.includes("Natural"))
    );
    if (premiumVoice) {
      utterance.voice = premiumVoice;
    }

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      currentUtteranceRef.current = null;
    };
    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
      currentUtteranceRef.current = null;
    };

    currentUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessageText = inputValue.trim();
    setInputValue("");
    
    // Add user message to history
    const nextMessages = [...messages, { sender: "user" as const, text: userMessageText }];
    setMessages(nextMessages);
    setIsLoading(true);

    const activeStartupId = currentUrlStartupId || localStorage.getItem("startupforge-last-startup");

    try {
      const chatHistoryPayload = messages.map((m) => ({
        sender: m.sender,
        text: m.text
      }));

      const res = await axios.post(
        "/api/v1/cofounder/chat",
        {
          startup_id: activeStartupId,
          message: userMessageText,
          chat_history: chatHistoryPayload
        },
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );

      const aiReply = res.data.response;
      setMessages((prev) => [...prev, { sender: "ai", text: aiReply }]);
      speakText(aiReply);
    } catch (err) {
      console.error("Cofounder chat query failed:", err);
      const errorMsg = "Apologies, I encountered an operational bottleneck. Please verify your connection and active startup selection.";
      setMessages((prev) => [...prev, { sender: "ai", text: errorMsg }]);
      speakText(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // TTS Controls
  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    localStorage.setItem("startupforge-chat-muted", String(nextMuted));
    if (nextMuted && typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
    } else if (!nextMuted && messages.length > 0) {
      // Speak last AI message if unmuted
      const lastAiMessage = [...messages].reverse().find((m) => m.sender === "ai");
      if (lastAiMessage) speakText(lastAiMessage.text);
    }
  };

  const handlePauseSpeech = () => {
    if (typeof window !== "undefined" && window.speechSynthesis && isPlaying) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const handleResumeSpeech = () => {
    if (typeof window !== "undefined" && window.speechSynthesis && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  };

  const handleStopSpeech = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
      currentUtteranceRef.current = null;
    }
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    localStorage.setItem("startupforge-chat-speed", String(newSpeed));
    if (isPlaying && messages.length > 0) {
      // Re-speak current message at new speed
      const lastAiMessage = [...messages].reverse().find((m) => m.sender === "ai");
      if (lastAiMessage) speakText(lastAiMessage.text);
    }
  };

  const handleClearDiscussion = () => {
    if (confirm("Are you sure you want to clear this conversation history?")) {
      handleStopSpeech();
      const defaultMsg = [
        {
          sender: "ai" as const,
          text: "Conversation cleared. I am ready for your next question!"
        }
      ];
      setMessages(defaultMsg);
      localStorage.setItem("startupforge-chat-history", JSON.stringify(defaultMsg));
    }
  };

  // Only render if logged in
  if (!user || !token) return null;

  return (
    <div className="fixed bottom-[92px] lg:bottom-6 right-6 z-50 font-sans">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          type="button"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white dark:text-background shadow-lg shadow-accent/10 border border-accent/20 transition-all duration-300"
          aria-label="Open AI Co-founder Chat"
        >
          <MessageSquare className="h-6 w-6" strokeWidth={2.25} />
        </button>
      )}

      {/* Expandable Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            transition={{ duration: 0.2, ease: [0.22, 0.61, 0.36, 1] }}
            className="flex h-[550px] w-[380px] flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
          >
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-card-secondary/60 px-4 py-3.5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-white dark:text-background font-bold text-xs shadow-sm">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-foreground">AI Startup Advisor</h3>
                <span className="text-[9px] font-bold text-textSecondary uppercase tracking-wider block mt-0.5">Venture Partner</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleClearDiscussion}
                title="Clear discussion"
                className="rounded-lg p-1.5 text-textSecondary hover:bg-card-secondary hover:text-foreground transition-colors text-[10px] font-bold"
              >
                Clear
              </button>
              <button
                onClick={() => {
                  handleStopSpeech();
                  setIsOpen(false);
                }}
                className="rounded-lg p-1.5 text-textSecondary hover:bg-card-secondary hover:text-foreground transition-colors"
                aria-label="Close Chat"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* Voice Controls Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-card-secondary/20 px-4 py-2 text-xs">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleMute}
                title={isMuted ? "Unmute Voice" : "Mute Voice"}
                className={`rounded-lg p-1.5 transition ${
                  isMuted 
                    ? "bg-error/10 text-error border border-error/15" 
                    : "text-textSecondary hover:bg-card-secondary hover:text-foreground"
                }`}
              >
                {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              </button>
              
              {/* Play / Pause / Stop TTS Buttons */}
              {isPlaying && !isPaused ? (
                <button
                  type="button"
                  onClick={handlePauseSpeech}
                  title="Pause speaking"
                  className="rounded-lg p-1.5 text-textSecondary hover:bg-card-secondary hover:text-foreground transition"
                >
                  <Pause className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleResumeSpeech}
                  disabled={!isPaused}
                  title="Resume speaking"
                  className="rounded-lg p-1.5 text-textSecondary hover:bg-card-secondary hover:text-foreground transition disabled:opacity-40"
                >
                  <Play className="h-3.5 w-3.5" />
                </button>
              )}
              
              <button
                type="button"
                onClick={handleStopSpeech}
                disabled={!isPlaying}
                title="Stop speaking"
                className="rounded-lg p-1.5 text-textSecondary hover:bg-card-secondary hover:text-foreground transition disabled:opacity-40"
              >
                <Square className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Speed Selector */}
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-bold text-textSecondary uppercase tracking-wider">Speed:</span>
              <select
                value={speed}
                onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                className="rounded-lg border border-border bg-card px-1.5 py-0.5 text-[10px] font-semibold text-textSecondary outline-none transition"
              >
                <option value="0.75">0.75x</option>
                <option value="1">1.0x</option>
                <option value="1.25">1.25x</option>
                <option value="1.5">1.5x</option>
              </select>
            </div>
          </div>

          {/* Dialogue Area */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin bg-card"
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed transition ${
                    msg.sender === "user"
                      ? "bg-accent text-white dark:text-background font-semibold rounded-br-sm"
                      : "bg-card-secondary/80 border border-border/80 text-foreground font-medium rounded-bl-sm"
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl border border-border bg-card-secondary/80 px-4 py-3 text-xs text-textSecondary">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
                  <span>Synthesizing startup advice...</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer Input */}
          <form
            onSubmit={handleSendMessage}
            className="border-t border-border bg-card-secondary/40 p-3 flex gap-2"
          >
            <input
              required
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about score, budget, or tasks..."
              className="flex-1 rounded-xl border border-border bg-card px-3.5 py-2 text-xs outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white dark:text-background shadow-sm hover:opacity-90 disabled:opacity-50 transition"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

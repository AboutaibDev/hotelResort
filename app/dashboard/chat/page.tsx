"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { useRouter } from "next/navigation";
import {
  Bot,
  User,
  Send,
  Sparkles,
  Loader2,
  Hotel,
} from "lucide-react";

interface ChatMessage {
  id: number;
  role: "user" | "ai";
  message: string;
  time: string;
}

function MarkdownText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="flex flex-col gap-1">
      {lines.map((line, i) => {
        if (line.startsWith("• ") || line.startsWith("- ")) {
          return (
            <div key={i} className="flex gap-2">
              <span className="text-primary mt-0.5 shrink-0">•</span>
              <span dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
            </div>
          );
        }
        if (line.trim() === "") return <div key={i} className="h-1" />;
        return <p key={i} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />;
      })}
    </div>
  );
}

const QUICK_PROMPTS = [
  "What suites are available?",
  "Tell me about your activities",
  "What are check-in hours?",
  "How does payment work?",
  "I need help from a staff member",
];

const WELCOME_REPLY =
  "Welcome to Amanora Resort's AI concierge! 🌿 I'm here to help you with:\n\n• Room and suite information & booking\n• Resort activity recommendations\n• Check-in / check-out queries\n• Payment and cancellation policies\n• Connecting you with our support team\n\nHow may I assist you today?";

export default function AIChatPage() {
  const router = useRouter();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 0,
      role: "ai",
      message: WELCOME_REPLY,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/dashboard/chat");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput("");

    const userMsg: ChatMessage = {
      id: Date.now(),
      role: "user",
      message: userText,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    // Simulate a short AI "thinking" delay — pure UI for now
    await new Promise((res) => setTimeout(res, 1000 + Math.random() * 800));

    const aiMsg: ChatMessage = {
      id: Date.now() + 1,
      role: "ai",
      message:
        "Thank you for your message! Our AI assistant is currently being set up. In the meantime, you can:\n\n• Visit our **Rooms** page to browse luxury suites\n• Explore **Activities** for resort experiences\n• Submit a **Support Ticket** via the Contact page\n• Call us at **+1 (800) 123-4567** (24/7 front desk)",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, aiMsg]);
    setLoading(false);
  };

  return (
    <div className="bg-stone-50 min-h-screen py-10 transition-colors">
      <div className="max-w-4xl mx-auto px-6 flex flex-col gap-6 animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 text-primary">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-950">
              Amanora AI Concierge
            </h1>
            <p className="text-slate-600 text-xs font-light mt-0.5">
              Ask me anything about rooms, activities, reservations, or resort policies.
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-3 py-1.5 rounded-full text-xs font-bold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Active</span>
          </div>
        </div>

        {/* Chat window */}
        <div
          className="bg-white rounded-3xl border border-slate-200/80 shadow-sm flex flex-col overflow-hidden"
          style={{ minHeight: "560px" }}
        >
          {/* Messages area */}
          <div
            className="flex-grow overflow-y-auto p-6 flex flex-col gap-4"
            style={{ maxHeight: "500px" }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div
                  className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-white ${
                    msg.role === "user"
                      ? "bg-slate-700"
                      : "bg-gradient-to-br from-primary to-amber-500"
                  }`}
                >
                  {msg.role === "user" ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-slate-900 text-white rounded-tr-none"
                      : "bg-stone-50 text-slate-800 border border-slate-200 rounded-tl-none"
                  }`}
                >
                  {msg.role === "ai" ? (
                    <MarkdownText text={msg.message} />
                  ) : (
                    msg.message
                  )}
                  <div className="text-[10px] mt-2 text-slate-400">{msg.time}</div>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex gap-3 flex-row">
                <div className="shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center text-white">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="px-5 py-3.5 rounded-2xl bg-stone-50 border border-slate-200 rounded-tl-none">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Quick prompts strip */}
          {!loading && (
            <div className="px-6 py-3 border-t border-slate-200 flex gap-2 flex-wrap">
              {QUICK_PROMPTS.slice(0, 4).map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setInput(prompt)}
                  className="text-[10px] px-3 py-1.5 rounded-full bg-stone-50 border border-slate-200 text-slate-600 hover:border-primary hover:text-primary transition-colors cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input area */}
          <div className="p-4 border-t border-slate-200 bg-stone-50/50">
            <form onSubmit={handleSend} className="flex gap-3 items-end">
              <textarea
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
                placeholder="Ask about rooms, activities, check-in times..."
                className="flex-grow resize-none px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-primary transition-colors text-slate-800"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="shrink-0 p-3.5 bg-primary hover:bg-amber-400 text-slate-950 rounded-2xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-40 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </form>
            <p className="text-[10px] text-center text-slate-400 mt-2">
              Press Enter to send • Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

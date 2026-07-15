"use client";
import { useState, useEffect, useRef, FormEvent } from "react";

interface Message {
  date: string;
  text: string;
  sender: "user" | "ai";
  isPartial?: boolean;
}

interface VoiceAssistantProps {
  userId: number;
  userName: string | null;
}

export default function VoiceAssistant({ userId, userName }: VoiceAssistantProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [uiError, setUiError] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typeInput, setTypeInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const vapiRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
  const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;

  useEffect(() => {
    if (!publicKey) return;

    let isMounted = true;
    let vapiInstance: any = null;

    // Dynamically import @vapi-ai/web to prevent SSR errors
    import("@vapi-ai/web").then(({ default: Vapi }) => {
      if (!isMounted) return;

      vapiInstance = new Vapi(publicKey);
      vapiRef.current = vapiInstance;

      vapiInstance.on("call-start", () => {
        setIsConnecting(false);
        setIsActive(true);
        setIsChatOpen(true);
        setUiError(null);
        setMessages([]);
      });

      vapiInstance.on("call-end", () => {
        setIsConnecting(false);
        setIsActive(false);
        setIsTyping(false);
      });

      vapiInstance.on("error", (error: any) => {
        console.error("Vapi Error:", error);
        setUiError("Voice stream unavailable.");
        setIsConnecting(false);
        setIsActive(false);
      });

      vapiInstance.on("message", (message: any) => {
        // Assistant transcripts
        if (message.type === "transcript" && message.role === "assistant") {
          if (message.transcriptType === "partial") {
            setIsTyping(true);
            if (typingTimer.current) clearTimeout(typingTimer.current);
            typingTimer.current = setTimeout(() => setIsTyping(false), 1500);
          } else {
            setIsTyping(false);
          }

          setMessages((prev) => {
            const filtered = prev.filter((m) => !m.isPartial);
            return [
              ...filtered,
              {
                text: message.transcript,
                date: message.timestamp || Date.now().toString(),
                sender: "ai",
                isPartial: message.transcriptType === "partial",
              },
            ];
          });
        }

        // User transcripts (from voice)
        if (message.type === "transcript" && message.role === "user") {
          setMessages((prev) => {
            const filtered = prev.filter((m) => !m.isPartial || m.sender !== "user");
            return [
              ...filtered,
              {
                text: message.transcript,
                date: message.timestamp || Date.now().toString(),
                sender: "user",
                isPartial: message.transcriptType === "partial",
              },
            ];
          });
        }
      });
    });

    return () => {
      isMounted = false;
      if (vapiInstance) {
        vapiInstance.stop();
        vapiInstance.removeAllListeners();
      }
    };
  }, [publicKey, userName]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isChatOpen, isTyping]);

  // ==================== NEW: Text Message Handler ====================
  const handleSendText = (e: FormEvent) => {
    e.preventDefault();
    if (!typeInput.trim() || !vapiRef.current || !isActive) return;

    const userMessage = typeInput.trim();

    // Add user message immediately to UI
    setMessages((prev) => [
      ...prev,
      {
        text: userMessage,
        date: Date.now().toString(),
        sender: "user",
      },
    ]);

    // Send to Vapi
    vapiRef.current.send({
      type: "add-message",
      message: {
        role: "user",
        content: userMessage,
      },
    });

    setTypeInput(""); // Clear input
  };

  const handleVoiceCall = async () => {
    setUiError(null);
    if (!vapiRef.current || !assistantId) {
      setUiError("Configuration keys missing.");
      return;
    }

    if (isActive) {
      vapiRef.current.stop();
    } else {
      setIsConnecting(true);
      try {
        await vapiRef.current.start(assistantId, {
          variableValues: {
            guest_id: userId,
            guest_name: userName,
          },
        });
      } catch {
        setUiError("Microphone access denied.");
        setIsConnecting(false);
      }
    }
  };

  return (
    <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 9999, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "12px" }}>
      {/* CHAT WINDOW */}
      {isChatOpen && (
        <div style={{
          width: "340px",
          borderRadius: "24px",
          background: "rgba(247, 245, 240, 0.92)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(217, 163, 98, 0.35)",
          overflow: "hidden",
          boxShadow: "0 20px 48px rgba(30, 34, 41, 0.12)",
          display: "flex",
          flexDirection: "column",
        }}>
          {/* Header */}
          <div style={{
            padding: "16px 20px",
            background: "linear-gradient(135deg, #d9a362 0%, #b88548 100%)",
            display: "flex", justifyContent: "space-between", alignItems: "center"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ position: "relative", width: "32px", height: "32px" }}>
                <div style={{
                  width: "32px", height: "32px", borderRadius: "50%",
                  background: "rgba(255,255,255,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "14px", color: "#1e2229", fontWeight: "700"
                }}>✦</div>
                {isActive && (
                  <div style={{
                    position: "absolute", bottom: "0", right: "0",
                    width: "10px", height: "10px", borderRadius: "50%",
                    background: "#22c55e", border: "2px solid #d9a362"
                  }} />
                )}
              </div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "#1e2229", fontFamily: "serif" }}>Amanora AI</div>
                <div style={{ fontSize: "10px", color: "rgba(30, 34, 41, 0.7)", marginTop: "1px", fontWeight: "500" }}>
                  {isActive ? "🟢 Streaming live..." : "🔴 Session idle"}
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsChatOpen(false)}
              style={{
                width: "26px", height: "26px", borderRadius: "50%",
                background: "rgba(30, 34, 41, 0.12)", border: "none",
                cursor: "pointer", color: "#1e2229", fontSize: "12px",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: "bold"
              }}
            >✕</button>
          </div>

          {/* Messages Area */}
          <div style={{
            padding: "16px", display: "flex", flexDirection: "column",
            gap: "10px", maxHeight: "280px", overflowY: "auto",
            scrollbarWidth: "none"
          }}>
            {messages.length === 0 ? (
              <p style={{ fontSize: "12px", color: "rgba(30, 34, 41, 0.4)", textAlign: "center", margin: "auto", fontStyle: "italic" }}>
                Start a voice call to begin.
              </p>
            ) : (
              messages.map((msg, i) => (
                <div key={i} style={{
                  display: "flex", gap: "8px",
                  alignItems: "flex-end",
                  flexDirection: msg.sender === "user" ? "row-reverse" : "row",
                  alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                  opacity: msg.isPartial ? 0.6 : 1,
                }}>
                  <div style={{
                    width: "24px", height: "24px", borderRadius: "50%", flexShrink: 0,
                    background: msg.sender === "user" ? "#d9a362" : "rgba(30, 34, 41, 0.08)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "10px", color: "#1e2229",
                    fontWeight: "bold",
                    border: msg.sender === "user" ? "none" : "1px solid rgba(217, 163, 98, 0.25)"
                  }}>
                    {msg.sender === "user" ? "U" : "✦"}
                  </div>
                  <div style={{
                    padding: "10px 14px",
                    borderRadius: msg.sender === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    fontSize: "12px", lineHeight: "1.55", color: "#1e2229",
                    background: msg.sender === "user" ? "#dbc4a5" : "#ffffff",
                    border: `1px solid ${msg.sender === "user" ? "rgba(217, 163, 98, 0.25)" : "rgba(217, 163, 98, 0.2)"}`,
                    fontStyle: msg.isPartial ? "italic" : "normal",
                    boxShadow: "0 2px 8px rgba(30, 34, 41, 0.04)"
                  }}>
                    {msg.text}
                  </div>
                </div>
              ))
            )}

            {/* Typing indicator */}
            {isTyping && (
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-end", maxWidth: "85%" }}>
                <div style={{
                  width: "24px", height: "24px", borderRadius: "50%",
                  background: "rgba(30, 34, 41, 0.08)",
                  border: "1px solid rgba(217, 163, 98, 0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "10px", color: "#1e2229", fontWeight: "bold"
                }}>✦</div>
                <div style={{
                  padding: "10px 14px",
                  borderRadius: "18px 18px 18px 4px",
                  background: "#ffffff",
                  border: "1px solid rgba(217, 163, 98, 0.2)",
                  display: "flex", gap: "4px", alignItems: "center",
                  boxShadow: "0 2px 8px rgba(30, 34, 41, 0.04)"
                }}>
                  {[0, 1, 2].map((i) => (
                    <span key={i} style={{
                      width: "6px", height: "6px", borderRadius: "50%",
                      background: "#d9a362",
                      display: "inline-block",
                      animation: "bounce 1.2s infinite",
                      animationDelay: `${i * 0.2}s`
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Text Input */}
          {isActive && (
            <form onSubmit={handleSendText} style={{
              padding: "12px 14px",
              background: "rgba(255, 255, 255, 0.5)",
              display: "flex", gap: "8px", alignItems: "center",
              borderTop: "1px solid rgba(217, 163, 98, 0.25)"
            }}>
              <input
                type="text"
                value={typeInput}
                onChange={(e) => setTypeInput(e.target.value)}
                placeholder="Type your question..."
                style={{
                  flex: 1, background: "#ffffff",
                  border: "1px solid rgba(217, 163, 98, 0.35)",
                  borderRadius: "20px", padding: "8px 16px",
                  fontSize: "12px", color: "#1e2229",
                  outline: "none",
                  boxShadow: "inset 0 1px 3px rgba(0,0,0,0.02)"
                }}
              />
              <button type="submit" disabled={!typeInput.trim()} style={{
                width: "32px", height: "32px", borderRadius: "50%",
                background: typeInput.trim() ? "#d9a362" : "rgba(30, 34, 41, 0.08)",
                border: "none", cursor: typeInput.trim() ? "pointer" : "default",
                color: typeInput.trim() ? "#1e2229" : "rgba(30, 34, 41, 0.4)", fontSize: "14px", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.15s",
                fontWeight: "bold"
              }}>↑</button>
            </form>
          )}
        </div>
      )}

      {/* Error Message */}
      {uiError && (
        <div style={{
          padding: "10px 14px", fontSize: "12px", color: "#b91c1c",
          background: "rgba(239,68,68,0.06)", borderRadius: "12px",
          border: "1px solid rgba(239,68,68,0.2)", maxWidth: "240px", textAlign: "center"
        }}>{uiError}</div>
      )}

      {/* Floating Dock */}
      <div style={{
        display: "flex", alignItems: "center", gap: "12px",
        background: "rgba(247, 245, 240, 0.92)", backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(217, 163, 98, 0.35)",
        borderRadius: "50px", padding: "8px 16px 8px 8px",
        boxShadow: "0 8px 32px rgba(30, 34, 41, 0.08)",
        transition: "all 0.3s"
      }}>
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: "48px", height: "48px" }}>
          {isActive && [0, 1, 2].map((i) => (
            <span key={i} style={{
              position: "absolute", width: "48px", height: "48px",
              borderRadius: "50%", border: "2px solid #d9a362",
              opacity: 0,
              animation: `pulse 2s ease-out infinite`,
              animationDelay: `${i * 0.5}s`,
              pointerEvents: "none"
            }} />
          ))}
          <button
            onClick={handleVoiceCall}
            disabled={isConnecting}
            style={{
              width: "48px", height: "48px", borderRadius: "50%",
              background: isActive ? "#dc2626" : "#d9a362",
              border: "none", cursor: isConnecting ? "not-allowed" : "pointer",
              fontSize: "20px", display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.2s, transform 0.1s",
              position: "relative", zIndex: 1,
              color: isActive ? "#ffffff" : "#1e2229"
            }}
          >
            {isConnecting ? "⏳" : isActive ? "🛑" : "🎙️"}
          </button>
        </div>

        <div>
          <div style={{ fontSize: "14px", fontWeight: "700", color: "#1e2229", fontFamily: "serif" }}>Amanora AI</div>
          <div style={{ fontSize: "10px", color: "rgba(30, 34, 41, 0.6)", marginTop: "1px" }}>
            {isConnecting ? "Connecting..." : isActive ? "Connected — speaking" : "Tap to speak"}
          </div>
        </div>

        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          style={{
            padding: "6px 14px", borderRadius: "20px",
            background: isChatOpen ? "rgba(217, 163, 98, 0.15)" : "rgba(30, 34, 41, 0.05)",
            border: isChatOpen ? "1px solid #d9a362" : "1px solid rgba(217, 163, 98, 0.2)",
            color: isChatOpen ? "#b88548" : "rgba(30, 34, 41, 0.7)", fontSize: "11px",
            cursor: "pointer", fontWeight: "600", whiteSpace: "nowrap",
            transition: "all 0.2s"
          }}
        >
          {isChatOpen ? "Hide" : "💬 Chat"}
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}
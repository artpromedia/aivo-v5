"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AivoApiClient } from "@aivo/api-client";
import { useAivoTheme } from "@aivo/ui";

const client = new AivoApiClient("http://localhost:4000");

type ChatMessage = {
  id: string;
  role: "learner" | "tutor";
  content: string;
  timestamp: string;
};

export default function TutorChatPage() {
  const theme = useAivoTheme();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "tutor",
      content: "Hi there! 👋 I'm AIVO, your friendly learning buddy. What would you like to explore today?",
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState("");
  const [feedbackGiven, setFeedbackGiven] = useState<Set<string>>(new Set());
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;

    // Add learner message
    const learnerMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "learner",
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, learnerMsg]);
    setInput("");
    setIsTyping(true);

    // Simulate tutor response with typing delay
    setTimeout(() => {
      const tutorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "tutor",
        content: "That's a great question! 🌟 Let me help you think through this step by step. Take your time - there's no rush!",
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, tutorMsg]);
      setIsTyping(false);
    }, 1500);
  };

  const handleFeedback = async (messageId: string, rating: number, label: string) => {
    try {
      await client.recordFeedback({
        targetType: "tutor_turn",
        targetId: messageId,
        rating,
        label
      });
      setFeedbackGiven((prev) => new Set(prev).add(messageId));
    } catch (e) {
      console.error("Failed to record feedback:", e);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-lavender-100 via-white to-slate-50">
      {/* Decorative elements */}
      <div className="fixed top-20 left-10 w-32 h-32 bg-primary-100 rounded-full opacity-40 blur-3xl" />
      <div className="fixed bottom-20 right-10 w-40 h-40 bg-mint/30 rounded-full opacity-40 blur-3xl" />
      
      <div className="max-w-4xl mx-auto p-6 relative">
        {/* Header */}
        <header className="mb-6">
          <button
            onClick={() => router.push("/")}
            className="mb-4 flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
          >
            ← Back to home
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-400 rounded-2xl flex items-center justify-center shadow-soft-primary">
              <span className="text-2xl">🤖</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Chat with AIVO</h1>
              <p className="text-sm text-slate-500">Your friendly, patient learning companion 💚</p>
            </div>
          </div>
        </header>

        {/* Chat container */}
        <div className="bg-white rounded-3xl shadow-card overflow-hidden">
          {/* Messages area */}
          <div className="h-[500px] overflow-y-auto p-6 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "learner" ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex items-start gap-3 max-w-[80%] ${msg.role === "learner" ? "flex-row-reverse" : ""}`}>
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    msg.role === "learner" 
                      ? "bg-primary-100" 
                      : "bg-gradient-to-br from-primary-500 to-primary-400"
                  }`}>
                    {msg.role === "learner" ? "😊" : "🤖"}
                  </div>
                  
                  {/* Message bubble */}
                  <div className={`rounded-2xl px-5 py-4 ${
                    msg.role === "learner"
                      ? "bg-primary-600 text-white"
                      : "bg-lavender-100 text-slate-800"
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <p className={`text-xs mt-2 ${msg.role === "learner" ? "text-white/60" : "text-slate-400"}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>

                    {/* Feedback buttons for tutor messages */}
                    {msg.role === "tutor" && !feedbackGiven.has(msg.id) && msg.id !== "1" && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleFeedback(msg.id, 5, "helpful")}
                          className="text-xs bg-mint/20 text-mint-dark px-3 py-1 rounded-lg hover:bg-mint/30 transition-colors"
                        >
                          👍 Helpful
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFeedback(msg.id, 2, "not_helpful")}
                          className="text-xs bg-coral-light text-coral-dark px-3 py-1 rounded-lg hover:bg-coral-light/80 transition-colors"
                        >
                          👎 Not helpful
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFeedback(msg.id, 3, "too_easy")}
                          className="text-xs bg-sunshine/20 text-sunshine-dark px-3 py-1 rounded-lg hover:bg-sunshine/30 transition-colors"
                        >
                          Too easy
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFeedback(msg.id, 3, "too_hard")}
                          className="text-xs bg-sky/20 text-sky-dark px-3 py-1 rounded-lg hover:bg-sky/30 transition-colors"
                        >
                          Too hard
                        </button>
                      </div>
                    )}

                    {feedbackGiven.has(msg.id) && (
                      <p className="text-xs text-mint-dark mt-2 flex items-center gap-1">
                        <span>✓</span> Thanks for your feedback!
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-400">
                    🤖
                  </div>
                  <div className="bg-lavender-100 rounded-2xl px-5 py-4">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="border-t border-slate-100 p-4 bg-slate-50">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type your question..."
                className="flex-1 rounded-2xl bg-white border border-slate-200 px-5 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim()}
                className="rounded-2xl bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-3 text-sm font-semibold text-white shadow-soft-primary hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:opacity-50 disabled:hover:translate-y-0"
              >
                Send 💬
              </button>
            </div>
          </div>
        </div>

        {/* Helper tips */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-400">
            💡 This is a demo. Your feedback helps AIVO learn and improve!
          </p>
        </div>
      </div>
    </main>
  );
}

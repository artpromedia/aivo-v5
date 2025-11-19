"use client";

import { useState } from "react";
import { AivoApiClient } from "@aivo/api-client";

const client = new AivoApiClient("http://localhost:4000");

type ChatMessage = {
  id: string;
  role: "learner" | "tutor";
  content: string;
  timestamp: string;
};

export default function TutorChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "tutor",
      content: "Hi! I'm AIVO, your calm and patient tutor. What would you like to work on today?",
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState("");
  const [feedbackGiven, setFeedbackGiven] = useState<Set<string>>(new Set());

  const handleSend = () => {
    if (!input.trim()) return;

    // Add learner message
    const learnerMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "learner",
      content: input,
      timestamp: new Date().toISOString()
    };

    // Simulate tutor response
    const tutorMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: "tutor",
      content: "That's a great question! Let me help you think through this step by step...",
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, learnerMsg, tutorMsg]);
    setInput("");
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
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <header className="border-b border-slate-800 pb-4">
          <h1 className="text-2xl font-semibold">AIVO Tutor Chat</h1>
          <p className="text-sm text-slate-400">Your calm, neurodiversity-affirming learning companion</p>
        </header>

        <div className="space-y-4 min-h-[500px] max-h-[600px] overflow-y-auto rounded-xl bg-slate-900/50 border border-slate-800 p-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "learner" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === "learner"
                    ? "bg-coral text-white"
                    : "bg-slate-800 text-slate-100"
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                <p className="text-[10px] opacity-60 mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </p>

                {/* Feedback buttons for tutor messages */}
                {msg.role === "tutor" && !feedbackGiven.has(msg.id) && (
                  <div className="mt-2 flex gap-3 text-[10px]">
                    <button
                      type="button"
                      onClick={() => handleFeedback(msg.id, 5, "helpful")}
                      className="flex items-center gap-1 hover:text-emerald-300 transition-colors"
                    >
                      👍 Helpful
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFeedback(msg.id, 2, "not_helpful")}
                      className="flex items-center gap-1 hover:text-red-300 transition-colors"
                    >
                      👎 Not helpful
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFeedback(msg.id, 3, "too_easy")}
                      className="flex items-center gap-1 hover:text-amber-300 transition-colors"
                    >
                      😊 Too easy
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFeedback(msg.id, 3, "too_hard")}
                      className="flex items-center gap-1 hover:text-amber-300 transition-colors"
                    >
                      😓 Too hard
                    </button>
                  </div>
                )}

                {feedbackGiven.has(msg.id) && (
                  <p className="text-[10px] text-emerald-400 mt-2">✓ Thanks for your feedback!</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type your question or message..."
            className="flex-1 rounded-pill bg-slate-900 border border-slate-700 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-coral"
          />
          <button
            type="button"
            onClick={handleSend}
            className="rounded-pill bg-coral px-6 py-2 text-sm font-semibold text-white hover:bg-coral/90 transition-colors"
          >
            Send
          </button>
        </div>

        <div className="text-xs text-slate-500 text-center">
          💡 This is a demo interface. Your feedback helps AIVO improve!
        </div>
      </div>
    </main>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";

const QUICK = [
  "Who owes me the most?",
  "What should I do tomorrow?",
  "How is my stock looking?",
  "Which customers have gone quiet?",
];

export default function AssistantPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text) {
    const content = (text !== undefined ? text : input).trim();
    if (!content || loading) return;

    const next = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      setMessages([
        ...next,
        { role: "assistant", content: data.reply || data.error || "Something went wrong." },
      ]);
    } catch (e) {
      setMessages([
        ...next,
        {
          role: "assistant",
          content: "Could not reach the assistant. Check your connection or log in again.",
        },
      ]);
    }
    setLoading(false);
  }

  const bubble = (role) => ({
    alignSelf: role === "user" ? "flex-end" : "flex-start",
    background: role === "user" ? "#166534" : "#f1f5f9",
    color: role === "user" ? "#ffffff" : "#0f172a",
    padding: "10px 14px",
    borderRadius: 16,
    maxWidth: "85%",
    whiteSpace: "pre-wrap",
    lineHeight: 1.4,
    fontSize: 15,
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100dvh",
        maxWidth: 640,
        margin: "0 auto",
        padding: 16,
        boxSizing: "border-box",
      }}
    >
      <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>YK Farms Assistant</h1>
      <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 12px" }}>
        Ask about sales, profit, debts, stock or customers.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        {messages.length === 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {QUICK.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                style={{
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  borderRadius: 999,
                  padding: "8px 12px",
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} style={bubble(m.role)}>
            {m.content}
          </div>
        ))}

        {loading && <div style={bubble("assistant")}>Thinking...</div>}
        <div ref={endRef} />
      </div>

      <div
        style={{
          position: "sticky",
          bottom: 0,
          display: "flex",
          gap: 8,
          padding: "12px 0",
          background: "#ffffff",
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything about the business..."
          rows={2}
          style={{
            flex: 1,
            border: "1px solid #cbd5e1",
            borderRadius: 12,
            padding: 10,
            fontSize: 16,
            resize: "none",
          }}
        />
        <button
          onClick={() => send()}
          disabled={loading || !input.trim()}
          style={{
            background: loading || !input.trim() ? "#94a3b8" : "#166534",
            color: "#ffffff",
            border: "none",
            borderRadius: 12,
            padding: "0 18px",
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

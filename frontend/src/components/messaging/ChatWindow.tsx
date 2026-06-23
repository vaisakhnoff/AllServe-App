"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Loader2, MessageSquare } from "lucide-react";
import { messagingService } from "@/services/messaging";
import { useSocket } from "@/hooks/useSocket";
import { Conversation, Message } from "@/types/messaging.types";

interface ChatWindowProps {
  conversation: Conversation | null;
  currentUserId: string;
  role: "user" | "provider";
}

export function ChatWindow({ conversation, currentUserId, role }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const { emit, on } = useSocket(role);

  // Load messages
  useEffect(() => {
    if (!conversation) return;
    setLoading(true);
    messagingService.getMessages(conversation._id)
      .then((r) => setMessages(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [conversation]);

  // Join conversation room & listen for new messages
  useEffect(() => {
    if (!conversation) return;
    emit("conversation:join", conversation._id);
    emit("message:read", conversation._id);

    const offNew = on("message:new", (msg: unknown) => {
      const m = msg as Message;
      setMessages((prev) => {
        if (prev.some((p) => p._id === m._id)) return prev;
        return [...prev, m];
      });
      if (m.senderId !== currentUserId) emit("message:read", conversation._id);
    });

    const offTypingStart = on("typing:start", (data: unknown) => {
      const d = data as { userId: string };
      if (d.userId !== currentUserId) setTyping(true);
    });
    const offTypingStop = on("typing:stop", (data: unknown) => {
      const d = data as { userId: string };
      if (d.userId !== currentUserId) setTyping(false);
    });
    const offRead = on("message:read", () => {
      setMessages((prev) => prev.map((m) => ({ ...m, isRead: true })));
    });

    return () => {
      emit("conversation:leave", conversation._id);
      offNew?.();
      offTypingStart?.();
      offTypingStop?.();
      offRead?.();
    };
  }, [conversation, currentUserId, emit, on]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const handleSend = async () => {
    if (!text.trim() || !conversation) return;
    const content = text.trim();
    setText("");
    setSending(true);
    // Send via socket for real-time delivery to both parties
    emit("message:send", { conversationId: conversation._id, content });
    setSending(false);
  };

  const handleTyping = () => {
    if (!conversation) return;
    emit("typing:start", conversation._id);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => emit("typing:stop", conversation._id), 1500);
  };

  if (!conversation) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <div>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <MessageSquare size={30} />
          </div>
          <h2 className="mt-5 text-2xl font-black">Select a conversation</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">Choose a conversation from the list to start messaging.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col min-h-0">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3 bg-gradient-to-b from-slate-50 to-slate-100/50">
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-[var(--primary)]" /></div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center mb-3"><MessageSquare size={20} className="text-purple-400" /></div>
            <p className="text-sm font-semibold text-slate-500">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId === currentUserId;
            return (
              <div key={msg._id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] px-4 py-3 text-sm leading-relaxed ${isMine ? "bg-gradient-to-br from-[#6D28FF] to-[#8B5CF6] text-white rounded-2xl rounded-br-md shadow-md shadow-purple-500/10" : "bg-white text-slate-800 rounded-2xl rounded-bl-md shadow-sm border border-slate-100"}`}>
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  <div className={`mt-1.5 flex items-center gap-1.5 text-[10px] ${isMine ? "text-purple-200 justify-end" : "text-slate-400"}`}>
                    <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    {isMine && <span className="text-[11px]">{msg.isRead ? "✓✓" : "✓"}</span>}
                  </div>
                </div>
              </div>
            );
          })
        )}
        {typing && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md bg-white px-4 py-3 text-sm text-slate-500 shadow-sm border border-slate-100">
              <span className="inline-flex gap-1"><span className="animate-bounce" style={{animationDelay:"0ms"}}>·</span><span className="animate-bounce" style={{animationDelay:"150ms"}}>·</span><span className="animate-bounce" style={{animationDelay:"300ms"}}>·</span></span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-200/60 bg-white p-4">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-3">
          <input
            value={text}
            onChange={(e) => { setText(e.target.value); handleTyping(); }}
            placeholder="Type a message..."
            maxLength={2000}
            className="flex-1 rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-3 text-sm outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-500/8 focus:bg-white transition-all"
          />
          <button type="submit" disabled={!text.trim() || sending} className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6D28FF] to-[#8B5CF6] text-white hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-40 transition-all shrink-0">
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </form>
      </div>
    </div>
  );
}

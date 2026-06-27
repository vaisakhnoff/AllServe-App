"use client";

import { useEffect, useState, useCallback } from "react";
import { MessageSquare, Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { RootState } from "@/store";
import { messagingService } from "@/services/messaging";
import { Conversation } from "@/types/messaging.types";
import { ChatWindow } from "@/components/messaging/ChatWindow";

const LIMIT = 20;

export default function UserMessagesPage() {
  const { user } = useSelector((s: RootState) => s.auth);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const totalPages = Math.ceil(total / LIMIT);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await messagingService.getConversationsWithPagination(debouncedSearch || undefined, page, LIMIT);
      setConversations(res.data.data.items);
      setTotal(res.data.data.total);
    } catch {
      setConversations([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => {
    const timer = setTimeout(() => { setPage(1); setDebouncedSearch(searchQuery.trim()); }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  const getName = (c: Conversation) => {
    const p = typeof c.providerId === "object" ? c.providerId : null;
    return p?.businessName || p?.name || "Provider";
  };

  const selectConversation = (c: Conversation) => {
    setActive(c);
    setMobileShowChat(true);
    setConversations((prev) => prev.map((conv) => conv._id === c._id ? { ...conv, userUnread: 0 } : conv));
  };

  if (loading && conversations.length === 0) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 size={28} className="animate-spin text-[var(--primary)]" /></div>;
  }

  return (
    <div className="pb-2">
      <div className="mb-5">
        <h1 className="text-[2rem] font-[800] tracking-[-0.03em] text-[var(--text-primary)]">Messages</h1>
        <p className="mt-1 text-[15px] text-[var(--text-secondary)]">{total} conversations</p>
      </div>

      <div className="overflow-hidden rounded-[22px] border border-[var(--border)] bg-white shadow-[var(--shadow-card)] grid h-[calc(100vh-220px)] min-h-[480px] lg:grid-cols-[360px_1fr]">
        {/* Sidebar */}
        <aside className={`flex flex-col border-r border-[var(--border-light)] ${mobileShowChat ? "hidden lg:flex" : "flex"}`}>
          <div className="p-4 border-b border-[var(--border-light)]">
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] py-2.5 pl-10 pr-3 text-sm font-medium outline-none transition focus:border-[var(--primary)] focus:bg-white"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-10 text-center">
                <MessageSquare size={28} className="mb-3 text-[var(--text-disabled)]" />
                <p className="text-sm font-bold text-[var(--text-secondary)]">No conversations yet</p>
              </div>
            ) : (
              conversations.map((c) => (
                <button
                  key={c._id}
                  onClick={() => selectConversation(c)}
                  className={`w-full text-left px-4 py-3.5 border-b border-[var(--border-light)] transition-colors hover:bg-[var(--surface-2)] ${
                    active?._id === c._id ? "bg-[var(--primary-light)] border-l-[3px] border-l-[var(--primary)]" : "border-l-[3px] border-l-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--primary-light)] to-[var(--surface-3)] text-[13px] font-[800] text-[var(--primary)]">
                      {getName(c)[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="truncate text-[14px] font-bold text-[var(--text-primary)]">{getName(c)}</p>
                        {c.lastMessageAt && (
                          <span className="ml-2 shrink-0 text-[10px] text-[var(--text-muted)]">{new Date(c.lastMessageAt).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="truncate text-[12px] text-[var(--text-muted)]">{c.lastMessage || "No messages"}</p>
                        {c.userUnread > 0 && (
                          <span className="ml-2 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] px-1.5 text-[10px] font-bold text-white">{c.userUnread}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 border-t border-[var(--border-light)] p-3">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-1.5 rounded-lg border border-[var(--border)] disabled:opacity-40"><ChevronLeft size={14} /></button>
              <span className="text-[11px] font-semibold text-[var(--text-muted)]">{page}/{totalPages}</span>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg border border-[var(--border)] disabled:opacity-40"><ChevronRight size={14} /></button>
            </div>
          )}
        </aside>

        {/* Chat */}
        <section className={`flex min-h-0 flex-col bg-[var(--surface-2)] ${!mobileShowChat ? "hidden lg:flex" : "flex"}`}>
          {active ? (
            <>
              <div className="flex items-center gap-3 border-b border-[var(--border-light)] bg-white px-5 py-3.5">
                <button onClick={() => setMobileShowChat(false)} className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--surface-3)] text-[var(--text-muted)]"><ChevronLeft size={16} /></button>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[var(--primary-light)] to-[var(--surface-3)] text-[12px] font-[800] text-[var(--primary)]">{getName(active)[0]}</div>
                <div>
                  <p className="text-[14px] font-bold text-[var(--text-primary)]">{getName(active)}</p>
                  {typeof active.serviceId === "object" && active.serviceId?.name && (
                    <p className="text-[11px] text-[var(--text-muted)]">{active.serviceId.name}</p>
                  )}
                </div>
              </div>
              <ChatWindow conversation={active} currentUserId={user?.id || ""} role="user" />
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-center p-10">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface-3)]">
                <MessageSquare size={28} className="text-[var(--text-disabled)]" />
              </div>
              <p className="text-lg font-bold text-[var(--text-primary)]">Select a conversation</p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">Pick one from the sidebar to start chatting</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

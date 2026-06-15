"use client";

import { useEffect, useState, useCallback } from "react";
import { MessageSquare, Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { messagingService } from "@/services/messaging";
import { Conversation } from "@/types/messaging.types";
import { ChatWindow } from "@/components/messaging/ChatWindow";
import { getErrorMessage } from "@/utils/errorHandler";

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
      const data = res.data.data;
      setConversations(data.items);
      setTotal(data.total);
    } catch {
      setConversations([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const getProviderName = (c: Conversation) => {
    const p = typeof c.providerId === "object" ? c.providerId : null;
    return p?.businessName || p?.name || "Provider";
  };

  const getProviderInitial = (c: Conversation) => getProviderName(c).charAt(0).toUpperCase();

  const selectConversation = (c: Conversation) => {
    setActive(c);
    setMobileShowChat(true);
    setConversations((prev) => prev.map((conv) => conv._id === c._id ? { ...conv, userUnread: 0 } : conv));
  };

  if (loading && conversations.length === 0) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 size={28} className="animate-spin text-[var(--primary)]" /></div>;
  }

  return (
    <div className="mx-auto w-full max-w-6xl fade-up">
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">Messages</h1>
        <p className="mt-1 text-sm text-slate-500">{total} conversations • Chat with your service providers</p>
      </div>

      <div className="overflow-hidden rounded-[18px] border border-slate-200/60 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.03)] grid h-[calc(100vh-178px)] min-h-[460px] lg:grid-cols-[340px_1fr]">
        {/* Sidebar */}
        <aside className={`border-r border-slate-200/60 flex flex-col ${mobileShowChat ? "hidden lg:flex" : "flex"}`}>
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search conversations..." className="w-full rounded-xl border border-slate-200/80 bg-slate-50/50 py-2.5 pl-10 pr-3 text-sm font-medium outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-500/8 transition-all" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading && conversations.length === 0 ? (
              <div className="p-10 text-center">
                <Loader2 size={20} className="animate-spin text-slate-300 mx-auto" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare size={22} className="text-purple-400" />
                </div>
                <p className="text-sm font-bold text-slate-600">No conversations yet</p>
                <p className="text-xs text-slate-400 mt-1">Start by messaging a provider</p>
              </div>
            ) : (
              conversations.map((c) => (
                <button key={c._id} onClick={() => selectConversation(c)} className={`w-full text-left p-4 border-b border-slate-100/60 transition-all hover:bg-purple-50/40 ${active?._id === c._id ? "bg-purple-50/60 border-l-[3px] border-l-[var(--primary)]" : "border-l-[3px] border-l-transparent"}`}>
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-violet-100 text-[var(--primary)] font-bold text-sm ring-1 ring-purple-100">
                      {getProviderInitial(c)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-slate-900 text-sm truncate">{getProviderName(c)}</p>
                        {c.lastMessageAt && <span className="text-[10px] text-slate-400 font-medium shrink-0 ml-2">{new Date(c.lastMessageAt).toLocaleDateString([], { month: "short", day: "numeric" })}</span>}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-slate-500 truncate">{c.lastMessage || "No messages"}</p>
                        {c.userUnread > 0 && <span className="ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-[10px] font-bold text-white">{c.userUnread}</span>}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && conversations.length > 0 && (
            <div className="border-t border-slate-100 p-3 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-medium text-slate-600">
                {page}/{totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </aside>

        {/* Chat area */}
        <section className={`flex min-h-0 flex-col ${!mobileShowChat ? "hidden lg:flex" : "flex"}`}>
          {active ? (
            <div className="border-b border-slate-100 bg-white p-4 flex items-center gap-3.5">
              <button onClick={() => setMobileShowChat(false)} className="lg:hidden text-slate-500 hover:text-[var(--primary)] mr-1 font-bold">←</button>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-violet-100 text-[var(--primary)] font-bold text-sm">{getProviderInitial(active)}</div>
              <div>
                <p className="font-bold text-slate-900 text-sm">{getProviderName(active)}</p>
                {typeof active.serviceId === "object" && active.serviceId?.name && <p className="text-xs text-slate-500">{active.serviceId.name}</p>}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
              <div className="w-18 h-18 rounded-2xl bg-purple-50 flex items-center justify-center mb-5">
                <MessageSquare size={32} className="text-purple-300" />
              </div>
              <p className="font-extrabold text-slate-700 text-lg">Select a conversation</p>
              <p className="text-sm text-slate-400 mt-1.5">Choose a conversation from the sidebar to start chatting</p>
            </div>
          )}
          {active && <ChatWindow conversation={active} currentUserId={user?.id || ""} role="user" />}
        </section>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useMemo } from "react";
import { Search, Loader2, MessageSquare } from "lucide-react";
import { ProviderPortalShell } from "@/components/provider/ProviderPortalShell";
import { messagingService } from "@/services/messaging";
import { Conversation } from "@/types/messaging.types";
import { ChatWindow } from "@/components/messaging/ChatWindow";
import { token, decodeToken } from "@/utils/token";

export default function ProviderMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Conversation | null>(null);
  const [search, setSearch] = useState("");
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const currentUserId = useMemo(() => {
    const t = token.getAccess("provider");
    if (!t) return "";
    return decodeToken(t)?.id || "";
  }, []);

  useEffect(() => {
    messagingService.getConversations()
      .then((r) => {
        const data = r.data?.data;
        setConversations(Array.isArray(data) ? data : (data as { items?: Conversation[] } | null)?.items ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter((c) => {
      const u = typeof c.userId === "object" ? c.userId : null;
      return u?.name?.toLowerCase().includes(q) || u?.email?.toLowerCase().includes(q) || c.lastMessage?.toLowerCase().includes(q);
    });
  }, [conversations, search]);

  const getUserName = (c: Conversation) => {
    const u = typeof c.userId === "object" ? c.userId : null;
    return u?.name || "Customer";
  };

  const selectConversation = (c: Conversation) => {
    setActive(c);
    setMobileShowChat(true);
    setConversations((prev) => prev.map((conv) => conv._id === c._id ? { ...conv, providerUnread: 0 } : conv));
  };

  return (
    <ProviderPortalShell>
      <div className="mb-6">
        <p className="text-sm font-bold text-indigo-600">Messages</p>
        <h1 className="mt-1 text-2xl font-black text-slate-950">Customer conversations</h1>
      </div>

      {loading ? (
        <div className="flex min-h-[400px] items-center justify-center"><Loader2 size={28} className="animate-spin text-indigo-500" /></div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white grid min-h-[600px] lg:grid-cols-[340px_1fr]">
          {/* Sidebar */}
          <aside className={`border-r border-slate-200 flex flex-col ${mobileShowChat ? "hidden lg:flex" : "flex"}`}>
            <div className="p-4 border-b border-slate-200">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search conversations" className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-400" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="p-6 text-center">
                  <MessageSquare size={28} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-sm text-slate-500">No conversations yet</p>
                </div>
              ) : (
                filtered.map((c) => (
                  <button key={c._id} onClick={() => selectConversation(c)} className={`w-full text-left p-4 border-b border-slate-100 transition hover:bg-indigo-50/50 ${active?._id === c._id ? "bg-indigo-50" : ""}`}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm">
                        {getUserName(c).charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-slate-900 text-sm truncate">{getUserName(c)}</p>
                          {c.lastMessageAt && <span className="text-[10px] text-slate-400 shrink-0 ml-2">{new Date(c.lastMessageAt).toLocaleDateString([], { month: "short", day: "numeric" })}</span>}
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-xs text-slate-500 truncate">{c.lastMessage || "No messages"}</p>
                          {c.providerUnread > 0 && <span className="ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">{c.providerUnread}</span>}
                        </div>
                        {typeof c.serviceId === "object" && c.serviceId?.name && <p className="text-[10px] text-indigo-500 font-semibold mt-0.5 truncate">{c.serviceId.name}</p>}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </aside>

          {/* Chat area */}
          <section className={`flex flex-col min-h-[600px] ${!mobileShowChat ? "hidden lg:flex" : "flex"}`}>
            {active && (
              <div className="border-b border-slate-200 bg-white p-4 flex items-center gap-3">
                <button onClick={() => setMobileShowChat(false)} className="lg:hidden text-slate-500 hover:text-indigo-600 mr-1">←</button>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm">{getUserName(active).charAt(0).toUpperCase()}</div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">{getUserName(active)}</p>
                  {typeof active.serviceId === "object" && active.serviceId?.name && <p className="text-xs text-slate-500">{active.serviceId.name}</p>}
                  {typeof active.bookingId === "object" && active.bookingId?.bookingStatus && <p className="text-[10px] text-indigo-500 font-semibold capitalize">Booking: {active.bookingId.bookingStatus}</p>}
                </div>
              </div>
            )}
            <ChatWindow conversation={active} currentUserId={currentUserId} role="provider" />
          </section>
        </div>
      )}
    </ProviderPortalShell>
  );
}

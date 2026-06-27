"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Plus, Clock, CheckCircle2, XCircle, MessageSquare,
  MapPin, IndianRupee, Zap, FileText, ArrowUpRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { serviceRequestService } from "@/services/serviceRequest";
import { ServiceRequest, ServiceRequestStatus } from "@/types/serviceRequest.types";
import { getErrorMessage } from "@/utils/errorHandler";

const tabs: { label: string; value: ServiceRequestStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "Receiving Quotes", value: "receiving_quotes" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

const statusConfig: Record<string, { label: string; bg: string }> = {
  open: { label: "Open", bg: "bg-blue-50 text-blue-700" },
  receiving_quotes: { label: "Receiving Quotes", bg: "bg-amber-50 text-amber-700" },
  quote_selected: { label: "Quote Selected", bg: "bg-purple-50 text-purple-700" },
  booking_created: { label: "Booking Created", bg: "bg-emerald-50 text-emerald-700" },
  completed: { label: "Completed", bg: "bg-green-50 text-green-700" },
  cancelled: { label: "Cancelled", bg: "bg-red-50 text-red-700" },
  expired: { label: "Expired", bg: "bg-slate-100 text-slate-600" },
};

const formatBudget = (r: ServiceRequest) => {
  if (r.budgetType === "quote_needed") return "Need Quote";
  if (r.budgetType === "fixed") return r.budgetMin ? `₹${r.budgetMin.toLocaleString()}` : "—";
  return r.budgetMin && r.budgetMax ? `₹${r.budgetMin.toLocaleString()} – ₹${r.budgetMax.toLocaleString()}` : r.budgetMin ? `₹${r.budgetMin.toLocaleString()}+` : "—";
};

export default function MyRequestsPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ServiceRequestStatus | "all">("all");
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0 });

  useEffect(() => {
    fetchRequests();
    serviceRequestService.getStats().then((res) => setStats(res.data.data)).catch(() => {});
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = activeTab === "all" ? {} : { status: activeTab };
      const res = await serviceRequestService.getMyRequests(params);
      setRequests(res.data.data.items);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-12">
      {/* Header */}
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[2rem] font-[800] tracking-[-0.03em] text-[var(--text-primary)]">My Requests</h1>
          <p className="mt-1 text-[15px] text-[var(--text-secondary)]">Track requests and manage incoming quotes</p>
        </div>
        <Link
          href="/post-request"
          className="group inline-flex items-center gap-2 rounded-full bg-[#141414] py-2.5 pl-5 pr-2.5 text-sm font-bold text-white transition hover:bg-black"
        >
          <Plus size={14} /> Post Request
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--primary)] text-white transition group-hover:rotate-[-45deg]">
            <ArrowUpRight size={13} />
          </span>
        </Link>
      </div>

      {/* Stats strip */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          { label: "Total", value: stats.total, icon: FileText },
          { label: "Active", value: stats.active, icon: Zap },
          { label: "Completed", value: stats.completed, icon: CheckCircle2 },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-white p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-3)]">
              <s.icon size={16} className="text-[var(--primary)]" />
            </div>
            <div>
              <p className="text-xl font-[800] text-[var(--text-primary)]">{s.value}</p>
              <p className="text-[11px] font-semibold text-[var(--text-muted)]">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1.5 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition ${
              activeTab === tab.value
                ? "bg-[#141414] text-white shadow-sm"
                : "bg-white border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex h-48 items-center justify-center text-sm font-semibold text-[var(--text-muted)]">Loading...</div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface-3)]">
            <FileText size={28} className="text-[var(--text-muted)]" />
          </div>
          <p className="text-lg font-bold text-[var(--text-primary)]">No requests yet</p>
          <p className="mt-1 max-w-sm text-sm text-[var(--text-muted)]">Post a service request to get quotes from verified providers</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req, i) => {
            const status = statusConfig[req.status] || statusConfig.open;
            return (
              <motion.div
                key={req._id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.03 * i, duration: 0.3 }}
              >
                <Link href={`/my-requests/${req._id}`} className="group block rounded-[18px] border border-[var(--border)] bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-[var(--border-hover)] hover:shadow-[var(--shadow-card-hover)]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${status.bg}`}>{status.label}</span>
                        {req.quoteCount > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--primary-light)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--primary)]">
                            <MessageSquare size={10} /> {req.quoteCount} quote{req.quoteCount > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <h3 className="text-[15px] font-bold text-[var(--text-primary)] truncate group-hover:text-[var(--primary)]">{req.title}</h3>
                      <p className="mt-1 text-[13px] text-[var(--text-muted)] line-clamp-1">{req.description}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-[12px] text-[var(--text-muted)]">
                        <span className="flex items-center gap-1 font-semibold"><IndianRupee size={11} /> {formatBudget(req)}</span>
                        <span className="flex items-center gap-1"><MapPin size={11} /> {req.address.city}</span>
                        <span className="flex items-center gap-1"><Clock size={11} /> {new Date(req.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <span className="mt-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--surface-3)] text-[var(--text-muted)] transition group-hover:bg-[var(--primary)] group-hover:text-white group-hover:rotate-[-45deg]">
                      <ArrowUpRight size={14} />
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

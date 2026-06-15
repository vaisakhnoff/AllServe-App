"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus, Clock, CheckCircle2, XCircle, MessageSquare,
  MapPin, IndianRupee, Zap, FileText, ArrowRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { serviceRequestService } from "@/services/serviceRequest";
import { ServiceRequest, ServiceRequestStatus } from "@/types/serviceRequest.types";
import { getErrorMessage } from "@/utils/errorHandler";

const tabs: { label: string; value: ServiceRequestStatus | "all"; icon: React.ElementType }[] = [
  { label: "All", value: "all", icon: FileText },
  { label: "Open", value: "open", icon: Zap },
  { label: "Receiving Quotes", value: "receiving_quotes", icon: MessageSquare },
  { label: "Completed", value: "completed", icon: CheckCircle2 },
  { label: "Cancelled", value: "cancelled", icon: XCircle },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  open: { label: "Open", color: "bg-blue-100 text-blue-700" },
  receiving_quotes: { label: "Receiving Quotes", color: "bg-amber-100 text-amber-700" },
  quote_selected: { label: "Quote Selected", color: "bg-purple-100 text-purple-700" },
  booking_created: { label: "Booking Created", color: "bg-emerald-100 text-emerald-700" },
  completed: { label: "Completed", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700" },
  expired: { label: "Expired", color: "bg-slate-100 text-slate-600" },
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
  }, [activeTab]);

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
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-purple-600">Request Marketplace</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">My Service Requests</h1>
          <p className="mt-1 text-sm text-slate-500">Track your requests and manage incoming quotes</p>
        </div>
        <Link href="/post-request" className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/35 transition-all">
          <Plus size={16} /> Post New Request
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        {[
          { label: "Total Requests", value: stats.total, color: "from-blue-500 to-cyan-500" },
          { label: "Active", value: stats.active, color: "from-amber-500 to-orange-500" },
          { label: "Completed", value: stats.completed, color: "from-emerald-500 to-teal-500" },
        ].map((s) => (
          <div key={s.label} className="premium-card p-4 text-center">
            <p className="text-2xl font-black">{s.value}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50/50 p-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                activeTab === tab.value
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Request List */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="animate-pulse text-sm font-semibold text-slate-500">Loading requests...</div>
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <FileText size={28} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No requests yet</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm">Post your first service request and get quotes from verified providers near you.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const status = statusConfig[req.status] || statusConfig.open;
            return (
              <Link
                key={req._id}
                href={`/my-requests/${req._id}`}
                className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-purple-200 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${status.color}`}>
                        {status.label}
                      </span>
                      {req.quoteCount > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-bold text-purple-700">
                          <MessageSquare size={10} /> {req.quoteCount} quote{req.quoteCount > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-purple-700 transition-colors truncate">{req.title}</h3>
                    <p className="mt-1 text-sm text-slate-500 line-clamp-1">{req.description}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-semibold">
                        <IndianRupee size={12} /> {formatBudget(req)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={12} /> {req.address.city}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <ArrowRight size={18} className="text-slate-300 group-hover:text-purple-500 transition-colors mt-2 shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

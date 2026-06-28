"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Loader2, Clock, Calendar, MapPin, FileText, AlertCircle, Filter, ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { ProviderPortalShell } from "@/components/provider/ProviderPortalShell";
import { orderService } from "@/services/order";
import { ServiceOrder, OrderDeliveryModel } from "@/types/order.types";
import { getErrorMessage } from "@/utils/errorHandler";

const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string }> = {
  awaiting_provider_response: { label: "Pending", dot: "bg-amber-400", bg: "bg-amber-50 text-amber-700 border-amber-200" },
  accepted: { label: "Accepted", dot: "bg-emerald-400", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  in_progress: { label: "In Progress", dot: "bg-blue-500", bg: "bg-blue-50 text-blue-700 border-blue-200" },
  work_completed: { label: "Work Done", dot: "bg-violet-400", bg: "bg-violet-50 text-violet-700 border-violet-200" },
  awaiting_payment: { label: "Awaiting Payment", dot: "bg-indigo-400", bg: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  completed: { label: "Completed", dot: "bg-emerald-400", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected_by_provider: { label: "Rejected", dot: "bg-red-400", bg: "bg-red-50 text-red-600 border-red-200" },
  cancelled: { label: "Cancelled", dot: "bg-slate-300", bg: "bg-slate-100 text-slate-500 border-slate-200" },
  inspection_accepted: { label: "Inspection Accepted", dot: "bg-sky-400", bg: "bg-sky-50 text-sky-700 border-sky-200" },
  inspection_completed: { label: "Inspected", dot: "bg-teal-400", bg: "bg-teal-50 text-teal-700 border-teal-200" },
  quotation_submitted: { label: "Quote Sent", dot: "bg-indigo-400", bg: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  quotation_accepted: { label: "Quote Accepted", dot: "bg-emerald-400", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  dropped_by_provider: { label: "Dropped", dot: "bg-red-300", bg: "bg-red-50 text-red-600 border-red-200" },
  dropped_by_customer: { label: "Customer Dropped", dot: "bg-slate-300", bg: "bg-slate-100 text-slate-500 border-slate-200" },
};

const MODEL_BADGES: Record<OrderDeliveryModel, { label: string; emoji: string; color: string }> = {
  direct: { label: "Direct", emoji: "⚡", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  inspection_required: { label: "Inspection", emoji: "🏠", color: "bg-blue-50 text-blue-700 border-blue-200" },
  custom: { label: "Custom", emoji: "🎨", color: "bg-purple-50 text-purple-700 border-purple-200" },
};

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "awaiting_provider_response", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "in_progress", label: "In Progress" },
  { value: "work_completed", label: "Work Done" },
  { value: "awaiting_payment", label: "Awaiting Pay" },
  { value: "completed", label: "Completed" },
];

export default function ProviderBookingsPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderDeliveryModel | "">("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await orderService.getProviderOrders({
        ...(filter ? { deliveryModel: filter } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
        page, limit: 20,
      });
      setOrders(res.data.data.items);
      setTotal(res.data.data.total);
    } catch (err) { toast.error(getErrorMessage(err) || "Failed to load bookings"); }
    finally { setLoading(false); }
  }, [filter, statusFilter, page]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  return (
    <ProviderPortalShell>
      <div className="mb-8">
        <h1 className="text-[2rem] font-[800] tracking-tight text-slate-950">Bookings</h1>
        <p className="mt-1 text-[15px] text-slate-500">{total} total orders</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
          <Filter size={14} className="text-slate-400" />
          <select value={filter} onChange={(e) => { setFilter(e.target.value as OrderDeliveryModel | ""); setPage(1); }}
            className="bg-transparent text-sm font-semibold outline-none cursor-pointer">
            <option value="">All types</option>
            <option value="direct">⚡ Direct</option>
            <option value="inspection_required">🏠 Inspection</option>
            <option value="custom">🎨 Custom</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s) => (
            <button key={s.value || "all"} onClick={() => { setStatusFilter(s.value); setPage(1); }}
              className={`rounded-full px-4 py-2 text-[13px] font-semibold transition ${
                statusFilter === s.value ? "bg-slate-900 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
              }`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex h-60 items-center justify-center"><Loader2 size={28} className="animate-spin text-indigo-500" /></div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
            <FileText size={32} className="text-slate-300" />
          </div>
          <p className="text-lg font-bold text-slate-700">No bookings found</p>
          <p className="mt-1 text-sm text-slate-400">Customer bookings will appear here</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {orders.map((order) => {
            const statusCfg = STATUS_CONFIG[order.status] || { label: order.status, dot: "bg-slate-300", bg: "bg-slate-50 text-slate-600 border-slate-200" };
            const badge = MODEL_BADGES[order.deliveryModel];
            const isUrgent = order.status === "awaiting_provider_response" && order.subMode === "instant";

            return (
              <Link key={order._id} href={`/provider-portal/bookings/${order._id}`}
                className={`group flex flex-col rounded-2xl border bg-white shadow-sm transition hover:shadow-md hover:-translate-y-0.5 ${isUrgent ? "border-amber-300 ring-1 ring-amber-100" : "border-slate-200"}`}>
                <div className="p-5">
                  {/* Badges row */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${badge.color}`}>
                        {badge.emoji} {badge.label}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusCfg.bg}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                        {statusCfg.label}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">{order.orderId}</span>
                  </div>

                  {/* Title */}
                  <h3 className="text-[15px] font-bold text-slate-900 line-clamp-2 leading-snug mb-2 group-hover:text-indigo-600 transition-colors">
                    {order.title || order.description.slice(0, 80)}
                  </h3>

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1"><MapPin size={11} /> {order.address.city}</span>
                    {order.preferredDate && <span className="flex items-center gap-1"><Calendar size={11} /> {order.preferredDate}</span>}
                    <span className="flex items-center gap-1"><Clock size={11} /> {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                  </div>

                  {/* Urgent warning */}
                  {isUrgent && (
                    <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                      <AlertCircle size={13} className="text-amber-600 shrink-0" />
                      <p className="text-[11px] font-semibold text-amber-700">Respond within 30 minutes</p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="border-t border-slate-100 px-5 py-3 mt-auto flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-indigo-600 group-hover:text-indigo-800 transition flex items-center gap-1">
                    Open <ChevronRight size={11} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition">Previous</button>
          <span className="text-sm font-medium text-slate-500">Page {page} of {Math.ceil(total / 20)}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(total / 20)}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition">Next</button>
        </div>
      )}
    </ProviderPortalShell>
  );
}

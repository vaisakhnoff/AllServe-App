"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Loader2, Calendar, MapPin, Clock, ArrowUpRight, Package, Zap,
  ChevronRight, Ban,
} from "lucide-react";
import toast from "react-hot-toast";
import { orderService } from "@/services/order";
import { ServiceOrder, OrderDeliveryModel } from "@/types/order.types";
import { getErrorMessage } from "@/utils/errorHandler";

const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string }> = {
  awaiting_provider_response: { label: "Waiting for provider", dot: "bg-amber-400", bg: "bg-amber-50 text-amber-700" },
  accepted: { label: "Accepted", dot: "bg-emerald-400", bg: "bg-emerald-50 text-emerald-700" },
  in_progress: { label: "In progress", dot: "bg-blue-500", bg: "bg-blue-50 text-blue-700" },
  work_completed: { label: "Work done", dot: "bg-violet-400", bg: "bg-violet-50 text-violet-700" },
  rejected_by_provider: { label: "Rejected", dot: "bg-red-400", bg: "bg-red-50 text-red-600" },
  provider_unresponsive: { label: "No response", dot: "bg-slate-400", bg: "bg-slate-100 text-slate-600" },
  awaiting_payment: { label: "Invoice ready", dot: "bg-blue-400", bg: "bg-blue-50 text-blue-700" },
  completed: { label: "Completed", dot: "bg-emerald-400", bg: "bg-emerald-50 text-emerald-700" },
  cancelled: { label: "Cancelled", dot: "bg-slate-300", bg: "bg-slate-100 text-slate-500" },
  cancelled_with_refund: { label: "Refunded", dot: "bg-slate-300", bg: "bg-slate-100 text-slate-500" },
  inspection_accepted: { label: "Inspection scheduled", dot: "bg-sky-400", bg: "bg-sky-50 text-sky-700" },
  inspection_completed: { label: "Inspection done", dot: "bg-teal-400", bg: "bg-teal-50 text-teal-700" },
  quotation_submitted: { label: "Quote received", dot: "bg-indigo-400", bg: "bg-indigo-50 text-indigo-700" },
  quotation_accepted: { label: "Quote accepted", dot: "bg-emerald-400", bg: "bg-emerald-50 text-emerald-700" },
  dropped_by_provider: { label: "Dropped by provider", dot: "bg-red-300", bg: "bg-red-50 text-red-600" },
  dropped_by_customer: { label: "Dropped", dot: "bg-slate-300", bg: "bg-slate-100 text-slate-500" },
  awaiting_advance: { label: "Advance pending", dot: "bg-amber-400", bg: "bg-amber-50 text-amber-700" },
  awaiting_final_payment: { label: "Payment pending", dot: "bg-indigo-400", bg: "bg-indigo-50 text-indigo-700" },
  broadcast_open: { label: "Receiving quotes", dot: "bg-purple-400", bg: "bg-purple-50 text-purple-700" },
  receiving_quotations: { label: "Receiving quotes", dot: "bg-purple-400", bg: "bg-purple-50 text-purple-700" },
  expired: { label: "Expired", dot: "bg-slate-300", bg: "bg-slate-100 text-slate-500" },
};

const MODEL_LABELS: Record<OrderDeliveryModel, { label: string; emoji: string }> = {
  direct: { label: "Direct", emoji: "⚡" },
  inspection_required: { label: "Inspection", emoji: "🏠" },
  custom: { label: "Custom", emoji: "🎨" },
};

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "awaiting_provider_response", label: "Waiting" },
  { value: "in_progress", label: "In Progress" },
  { value: "awaiting_payment", label: "Pay Now" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function BookingsPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await orderService.getMyOrders({
        ...(statusFilter ? { status: statusFilter } : {}),
        page, limit: 20,
      });
      setOrders(res.data.data.items);
      setTotal(res.data.data.total);
    } catch (err) { toast.error(getErrorMessage(err) || "Failed to load bookings"); }
    finally { setLoading(false); }
  }, [statusFilter, page]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleDrop = async (orderId: string) => {
    const reason = prompt("Why do you want to drop this service?");
    if (!reason?.trim()) return;
    try {
      await orderService.dropByCustomer(orderId, reason.trim());
      toast.success("Service dropped");
      fetchOrders();
    } catch (err) { toast.error(getErrorMessage(err) || "Failed"); }
  };

  return (
    <div className="pb-12">
      {/* Header */}
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[2rem] font-[800] tracking-[-0.03em] text-[var(--text-primary)]">My Bookings</h1>
          <p className="mt-1 text-[15px] text-[var(--text-secondary)]">{total} orders</p>
        </div>
        <Link href="/dashboard"
          className="group inline-flex items-center gap-2 rounded-full bg-[#141414] py-2.5 pl-5 pr-2.5 text-sm font-bold text-white transition hover:bg-black">
          <Zap size={14} /> New booking
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--primary)] text-white transition group-hover:rotate-[-45deg]">
            <ArrowUpRight size={13} />
          </span>
        </Link>
      </div>

      {/* Status filter pills */}
      <div className="mb-6 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <button key={s.value || "all"} onClick={() => { setStatusFilter(s.value); setPage(1); }}
            className={`rounded-full px-4 py-2 text-[13px] font-semibold transition ${
              statusFilter === s.value
                ? "bg-[#141414] text-white shadow-sm"
                : "bg-white border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]"
            }`}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex h-60 items-center justify-center">
          <Loader2 size={28} className="animate-spin text-[var(--primary)]" />
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--surface-3)]">
            <Package size={32} className="text-[var(--text-muted)]" />
          </div>
          <p className="text-xl font-bold text-[var(--text-primary)]">No bookings yet</p>
          <p className="mt-1.5 max-w-sm text-sm text-[var(--text-muted)]">Browse services to make your first request</p>
          <Link href="/dashboard" className="mt-5 inline-flex rounded-full bg-[#141414] px-6 py-3 text-sm font-bold text-white hover:bg-black">
            Browse Services
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order, i) => {
            const statusCfg = STATUS_CONFIG[order.status] || { label: order.status, dot: "bg-slate-300", bg: "bg-slate-50 text-slate-600" };
            const model = MODEL_LABELS[order.deliveryModel];
            const needsChoice = ["rejected_by_provider", "provider_unresponsive"].includes(order.status);
            const canDrop = ["awaiting_provider_response", "inspection_accepted", "inspection_completed", "quotation_submitted"].includes(order.status) && order.deliveryModel === "inspection_required";
            const hasPayment = order.status === "awaiting_payment";

            return (
              <motion.div key={order._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 * i, duration: 0.25 }}>
                <Link href={`/bookings/${order._id}`} className="block">
                  <div className={`group rounded-2xl border bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg ${
                    needsChoice ? "border-amber-200 bg-amber-50/30" : hasPayment ? "border-indigo-200 bg-indigo-50/20" : "border-[var(--border)]"
                  }`}>
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-mono text-[var(--text-muted)]">{order.orderId}</span>
                        <span className="text-[11px] font-bold text-slate-500">{model.emoji} {model.label}</span>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${statusCfg.bg}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                        {statusCfg.label}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-[15px] font-bold text-[var(--text-primary)] line-clamp-1 group-hover:text-[var(--primary)] transition-colors">
                      {order.title || order.description.slice(0, 80)}
                    </h3>

                    {/* Meta */}
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px] text-[var(--text-muted)]">
                      <span className="flex items-center gap-1"><MapPin size={11} /> {order.address.city}, {order.address.state}</span>
                      {order.preferredDate && <span className="flex items-center gap-1"><Calendar size={11} /> {order.preferredDate}</span>}
                      <span className="flex items-center gap-1"><Clock size={11} /> {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>

                    {/* Action hints */}
                    {needsChoice && (
                      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[12px] font-semibold text-amber-700">
                        Provider didn&apos;t respond — tap to choose another provider or cancel
                      </div>
                    )}
                    {hasPayment && (
                      <div className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-[12px] font-semibold text-indigo-700 flex items-center justify-between">
                        <span>Invoice ready — tap to pay</span>
                        <ChevronRight size={14} />
                      </div>
                    )}
                  </div>
                </Link>

                {/* Drop button (outside the link) */}
                {canDrop && (
                  <div className="mt-1 px-5">
                    <button onClick={() => handleDrop(order._id)}
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-red-500 hover:text-red-700 transition">
                      <Ban size={11} /> Drop this service
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--text-secondary)] disabled:opacity-40 hover:bg-[var(--surface-2)] transition">Previous</button>
          <span className="text-sm font-medium text-[var(--text-muted)]">Page {page} of {Math.ceil(total / 20)}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(total / 20)}
            className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--text-secondary)] disabled:opacity-40 hover:bg-[var(--surface-2)] transition">Next</button>
        </div>
      )}
    </div>
  );
}

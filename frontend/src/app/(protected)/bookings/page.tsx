"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Loader2, Calendar, MapPin, Clock, RefreshCw, Ban,
  ArrowUpRight, Package, Zap,
} from "lucide-react";
import toast from "react-hot-toast";
import { orderService } from "@/services/order";
import { ServiceOrder, OrderDeliveryModel } from "@/types/order.types";
import { getErrorMessage } from "@/utils/errorHandler";

const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string }> = {
  awaiting_provider_response: { label: "Waiting for provider", dot: "bg-amber-400", bg: "bg-amber-50 text-amber-700" },
  accepted: { label: "Accepted", dot: "bg-emerald-400", bg: "bg-emerald-50 text-emerald-700" },
  rejected_by_provider: { label: "Rejected", dot: "bg-red-400", bg: "bg-red-50 text-red-600" },
  provider_unresponsive: { label: "No response", dot: "bg-slate-400", bg: "bg-slate-100 text-slate-600" },
  awaiting_payment: { label: "Invoice ready", dot: "bg-blue-400", bg: "bg-blue-50 text-blue-700" },
  completed: { label: "Completed", dot: "bg-emerald-400", bg: "bg-emerald-50 text-emerald-700" },
  cancelled: { label: "Cancelled", dot: "bg-slate-300", bg: "bg-slate-100 text-slate-500" },
  cancelled_with_refund: { label: "Refunded", dot: "bg-slate-300", bg: "bg-slate-100 text-slate-500" },
  inspection_pending: { label: "Inspection pending", dot: "bg-blue-400", bg: "bg-blue-50 text-blue-700" },
  quotation_submitted: { label: "Quote received", dot: "bg-indigo-400", bg: "bg-indigo-50 text-indigo-700" },
  quotation_accepted: { label: "Quote accepted", dot: "bg-emerald-400", bg: "bg-emerald-50 text-emerald-700" },
  awaiting_advance: { label: "Advance pending", dot: "bg-amber-400", bg: "bg-amber-50 text-amber-700" },
  in_progress: { label: "In progress", dot: "bg-blue-500", bg: "bg-blue-50 text-blue-700" },
  awaiting_final_payment: { label: "Payment pending", dot: "bg-indigo-400", bg: "bg-indigo-50 text-indigo-700" },
  broadcast_open: { label: "Receiving quotes", dot: "bg-purple-400", bg: "bg-purple-50 text-purple-700" },
  receiving_quotations: { label: "Receiving quotes", dot: "bg-purple-400", bg: "bg-purple-50 text-purple-700" },
  expired: { label: "Expired", dot: "bg-slate-300", bg: "bg-slate-100 text-slate-500" },
};

const MODEL_LABELS: Record<OrderDeliveryModel, string> = {
  direct: "⚡ Direct",
  inspection_required: "🏠 Inspection",
  custom: "🎨 Custom",
};

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "awaiting_provider_response", label: "Waiting" },
  { value: "accepted", label: "Accepted" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function BookingsPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderDeliveryModel | "">("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await orderService.getMyOrders({
        ...(filter ? { deliveryModel: filter } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
        page,
        limit: 20,
      });
      setOrders(res.data.data.items);
      setTotal(res.data.data.total);
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [filter, statusFilter, page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCustomerChoice = async (orderId: string, choice: "reroute" | "refund") => {
    try {
      await orderService.customerChoice(orderId, { choice });
      toast.success(choice === "refund" ? "Refund initiated" : "Looking for another provider...");
      fetchOrders();
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to process");
    }
  };

  return (
    <div className="pb-12">
      {/* Header */}
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[2rem] font-[800] tracking-[-0.03em] text-[var(--text-primary)]">My Bookings</h1>
          <p className="mt-1 text-[15px] text-[var(--text-secondary)]">{total} service orders</p>
        </div>
        <Link
          href="/dashboard"
          className="group inline-flex items-center gap-2 rounded-full bg-[#141414] py-2.5 pl-5 pr-2.5 text-sm font-bold text-white transition hover:bg-black"
        >
          <Zap size={14} /> New booking
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--primary)] text-white transition group-hover:rotate-[-45deg]">
            <ArrowUpRight size={13} />
          </span>
        </Link>
      </div>

      {/* Pill filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s.value || "all"}
            onClick={() => { setStatusFilter(s.value); setPage(1); }}
            className={`rounded-full px-4 py-2 text-[13px] font-semibold transition ${
              statusFilter === s.value
                ? "bg-[#141414] text-white shadow-sm"
                : "bg-white border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]"
            }`}
          >
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
            const needsChoice = ["rejected_by_provider", "provider_unresponsive"].includes(order.status);
            const hasAction = ["awaiting_payment", "awaiting_final_payment", "quotation_submitted"].includes(order.status);

            return (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.03 * i, duration: 0.3 }}
              >
                <Link href={`/bookings/${order._id}`} className="block">
                  <div className={`group relative flex gap-4 rounded-[20px] border bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] ${
                    needsChoice ? "border-amber-200" : hasAction ? "border-[var(--primary)]/20" : "border-[var(--border)]"
                  }`}>
                    {/* Status dot rail */}
                    <div className="relative flex flex-col items-center pt-1">
                      <span className={`h-3 w-3 rounded-full ${statusCfg.dot} ring-4 ring-white`} />
                      <span className="mt-2 h-full w-[2px] bg-[var(--border-light)] rounded-full" />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusCfg.bg}`}>{statusCfg.label}</span>
                            <span className="text-[11px] font-semibold text-[var(--text-muted)]">{MODEL_LABELS[order.deliveryModel]}</span>
                          </div>
                          <p className="line-clamp-1 text-[15px] font-bold text-[var(--text-primary)]">
                            {order.title || order.description}
                          </p>
                        </div>
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--surface-3)] text-[var(--text-muted)] transition group-hover:bg-[var(--primary)] group-hover:text-white group-hover:rotate-[-45deg]">
                          <ArrowUpRight size={14} />
                        </span>
                      </div>

                      <div className="mt-2.5 flex flex-wrap gap-4 text-[12px] text-[var(--text-muted)]">
                        {order.preferredDate && (
                          <span className="inline-flex items-center gap-1">
                            <Calendar size={11} />
                            {new Date(order.preferredDate + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            {order.preferredTime && ` · ${order.preferredTime}`}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1"><MapPin size={11} /> {order.address.city}</span>
                        <span className="inline-flex items-center gap-1"><Clock size={11} /> {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                        <span className="font-mono text-[11px]">{order.orderId}</span>
                      </div>

                      {/* Action strip */}
                      {hasAction && (
                        <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[var(--primary-light)] px-3 py-1.5 text-[11px] font-bold text-[var(--primary)]">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--primary)]" /> Action needed
                        </div>
                      )}

                      {needsChoice && (
                        <div className="mt-3 flex gap-2" onClick={(e) => e.preventDefault()}>
                          <button
                            onClick={(e) => { e.preventDefault(); handleCustomerChoice(order._id, "reroute"); }}
                            className="inline-flex items-center gap-1.5 rounded-full bg-[#141414] px-3.5 py-1.5 text-[11px] font-bold text-white"
                          >
                            <RefreshCw size={11} /> Try another
                          </button>
                          <button
                            onClick={(e) => { e.preventDefault(); handleCustomerChoice(order._id, "refund"); }}
                            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-white px-3.5 py-1.5 text-[11px] font-bold text-[var(--text-secondary)]"
                          >
                            <Ban size={11} /> Refund
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-full border border-[var(--border)] bg-white px-5 py-2.5 text-sm font-semibold transition hover:border-[var(--text-muted)] disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm font-semibold text-[var(--text-secondary)]">{page} / {Math.ceil(total / 20)}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(total / 20)}
            className="rounded-full border border-[var(--border)] bg-white px-5 py-2.5 text-sm font-semibold transition hover:border-[var(--text-muted)] disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Loader2, Calendar, MapPin, Clock, ArrowUpRight, Package, Zap,
  ChevronRight, Ban, X, Search, Filter, MessageSquare, CheckCircle2,
  AlertCircle, ShieldCheck, CreditCard, Sparkles, User, RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import { orderService } from "@/services/order";
import { ServiceOrder, OrderDeliveryModel } from "@/types/order.types";
import { getErrorMessage } from "@/utils/errorHandler";
import { UserShell } from "@/components/layout/UserShell";

// ── Drop Reason Modal ─────────────────────────────────────────────────────────
function DropModal({
  onConfirm,
  onClose,
  loading,
}: {
  onConfirm: (reason: string) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-black text-slate-950">Cancel & Drop Service</h3>
            <p className="mt-1 text-xs text-slate-500">Please provide a reason for cancelling this request.</p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
          >
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        <textarea
          value={reason}
          onChange={(e) => { setReason(e.target.value); setError(""); }}
          rows={3}
          placeholder="Briefly state your reason..."
          className={`w-full rounded-2xl border px-4 py-3 text-xs outline-none resize-none transition focus:ring-2 focus:ring-rose-100 ${
            error ? "border-rose-300 bg-rose-50" : "border-slate-200 focus:border-rose-400"
          }`}
        />
        {error && <p className="mt-1 text-xs font-medium text-rose-500">{error}</p>}

        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-xl border border-slate-200 py-3 text-xs font-extrabold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (!reason.trim()) { setError("Reason is required"); return; }
              onConfirm(reason.trim());
            }}
            disabled={loading}
            className="flex-1 rounded-xl bg-rose-600 py-3 text-xs font-extrabold text-white hover:bg-rose-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-rose-600/20"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Confirm Drop
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Status Config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string }> = {
  awaiting_provider_response: { label: "Waiting for provider", dot: "bg-amber-400 animate-pulse", bg: "bg-amber-50 text-amber-800 border border-amber-200" },
  accepted: { label: "Provider Accepted", dot: "bg-emerald-500", bg: "bg-emerald-50 text-emerald-800 border border-emerald-200" },
  in_progress: { label: "Work In Progress", dot: "bg-indigo-500 animate-pulse", bg: "bg-indigo-50 text-indigo-800 border border-indigo-200" },
  work_completed: { label: "Work Done - Pending Invoice", dot: "bg-violet-500", bg: "bg-violet-50 text-violet-800 border border-violet-200" },
  rejected_by_provider: { label: "Request Declined", dot: "bg-rose-500", bg: "bg-rose-50 text-rose-700 border border-rose-200" },
  provider_unresponsive: { label: "No Provider Response", dot: "bg-slate-400", bg: "bg-slate-100 text-slate-700 border border-slate-200" },
  awaiting_payment: { label: "Payment Invoice Ready", dot: "bg-emerald-500 animate-bounce", bg: "bg-emerald-100 text-emerald-900 border border-emerald-300" },
  completed: { label: "Completed & Paid", dot: "bg-emerald-500", bg: "bg-emerald-50 text-emerald-800 border border-emerald-200" },
  cancelled: { label: "Cancelled", dot: "bg-slate-300", bg: "bg-slate-100 text-slate-600" },
  cancelled_with_refund: { label: "Cancelled (Refunded)", dot: "bg-slate-300", bg: "bg-slate-100 text-slate-600" },
  inspection_accepted: { label: "Inspection Scheduled", dot: "bg-sky-500", bg: "bg-sky-50 text-sky-800 border border-sky-200" },
  inspection_completed: { label: "Inspection Completed", dot: "bg-teal-500", bg: "bg-teal-50 text-teal-800 border border-teal-200" },
  quotation_submitted: { label: "Quotation Received", dot: "bg-indigo-500", bg: "bg-indigo-50 text-indigo-800 border border-indigo-200" },
  quotation_accepted: { label: "Quote Accepted", dot: "bg-emerald-500", bg: "bg-emerald-50 text-emerald-800 border border-emerald-200" },
  dropped_by_provider: { label: "Dropped by Provider", dot: "bg-rose-400", bg: "bg-rose-50 text-rose-700 border border-rose-200" },
  dropped_by_customer: { label: "Cancelled by You", dot: "bg-slate-300", bg: "bg-slate-100 text-slate-600" },
};

const STATUS_TABS = [
  { value: "", label: "All Bookings" },
  { value: "awaiting_provider_response,accepted,inspection_accepted,inspection_completed,quotation_submitted,quotation_accepted", label: "Waiting / Accepted" },
  { value: "in_progress", label: "In Progress" },
  { value: "work_completed,awaiting_payment", label: "Ready for Payment" },
  { value: "completed", label: "Completed" },
  { value: "cancelled,cancelled_with_refund,dropped_by_provider,dropped_by_customer,rejected_by_provider,provider_unresponsive", label: "Cancelled" },
];

export default function CustomerBookingsPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [modelFilter, setModelFilter] = useState<OrderDeliveryModel | "">("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  // Drop modal state
  const [dropOrderId, setDropOrderId] = useState<string | null>(null);
  const [dropLoading, setDropLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await orderService.getMyOrders({
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(modelFilter ? { deliveryModel: modelFilter } : {}),
        page,
        limit: 20,
      });

      let items = res.data.data.items || [];

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        items = items.filter(
          (o) =>
            o.title?.toLowerCase().includes(term) ||
            o.description.toLowerCase().includes(term) ||
            o.orderId.toLowerCase().includes(term) ||
            o.address?.city?.toLowerCase().includes(term)
        );
      }

      setOrders(items);
      setTotal(res.data.data.total);
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, modelFilter, searchTerm, page]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleDrop = async (reason: string) => {
    if (!dropOrderId) return;
    setDropLoading(true);
    try {
      await orderService.dropByCustomer(dropOrderId, reason);
      toast.success("Service request cancelled");
      setDropOrderId(null);
      fetchOrders();
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to drop service");
    } finally {
      setDropLoading(false);
    }
  };

  return (
    <UserShell>
      <div className="pb-16 max-w-5xl mx-auto">
        {/* ── Page Header ─────────────────────────────────────────────── */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-600">
              Customer Portal
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
              My Bookings & Orders
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Track status, pay invoices, and communicate with service professionals.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-5 py-3 text-xs font-black text-white shadow-lg shadow-emerald-600/20 transition-all"
          >
            <Zap size={15} />
            Book New Service
            <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        {/* ── Filter Tabs & Search ───────────────────────────────────── */}
        <div className="mb-6 space-y-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {STATUS_TABS.map((s) => {
              const active = statusFilter === s.value;
              return (
                <button
                  key={s.value || "all"}
                  onClick={() => { setStatusFilter(s.value); setPage(1); }}
                  className={`shrink-0 rounded-2xl px-4 py-2.5 text-xs font-extrabold transition-all ${
                    active
                      ? "bg-slate-950 text-white shadow-md"
                      : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by service title, order ID, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-xs font-semibold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 shadow-2xs"
            />
          </div>
        </div>

        {/* ── Bookings List Content ───────────────────────────────────── */}
        {loading ? (
          <div className="flex h-64 items-center justify-center rounded-3xl border border-slate-100 bg-white shadow-2xs">
            <Loader2 size={32} className="animate-spin text-emerald-600" />
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-xs">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-4">
              <Package size={32} />
            </div>
            <h3 className="text-lg font-black text-slate-950">No Bookings Found</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              You don&apos;t have any active bookings matching this filter.
            </p>
            <Link
              href="/dashboard"
              className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-slate-950 hover:bg-slate-800 px-5 py-3 text-xs font-extrabold text-white shadow-md"
            >
              Explore Available Services
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, i) => {
              const statusCfg = STATUS_CONFIG[order.status] || {
                label: order.status,
                dot: "bg-slate-300",
                bg: "bg-slate-50 text-slate-700",
              };

              const isPayable = order.status === "awaiting_payment";
              const canDrop = ["awaiting_provider_response", "inspection_accepted", "inspection_completed", "quotation_submitted"].includes(order.status);
              const providerName = typeof order.providerId === "object" ? order.providerId.name : null;

              return (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.03 * i, duration: 0.2 }}
                  className={`rounded-3xl border bg-white p-5 sm:p-6 transition-all duration-200 hover:shadow-lg ${
                    isPayable
                      ? "border-emerald-300 ring-2 ring-emerald-400/20 bg-gradient-to-r from-emerald-50/40 via-white to-white"
                      : "border-slate-200/80"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Main details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold ${statusCfg.bg}`}>
                          <span className={`h-2 w-2 rounded-full ${statusCfg.dot}`} />
                          {statusCfg.label}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                          #{order.orderId || order._id.slice(-6)}
                        </span>
                      </div>

                      <Link href={`/bookings/${order._id}`} className="group block">
                        <h3 className="text-base font-black text-slate-950 group-hover:text-emerald-600 transition-colors leading-snug">
                          {order.title || order.description.slice(0, 90)}
                        </h3>
                      </Link>

                      <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {order.description}
                      </p>

                      {/* Metas */}
                      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-600 pt-3 border-t border-slate-100">
                        {providerName && (
                          <span className="flex items-center gap-1.5 text-slate-900 font-bold">
                            <User size={13} className="text-emerald-600" />
                            {providerName}
                          </span>
                        )}

                        {order.address && (
                          <span className="flex items-center gap-1 text-slate-500">
                            <MapPin size={13} className="text-slate-400" />
                            {order.address.city}, {order.address.state}
                          </span>
                        )}

                        {order.preferredDate && (
                          <span className="flex items-center gap-1 text-slate-700 font-bold">
                            <Calendar size={13} className="text-indigo-600" />
                            {order.preferredDate} {order.preferredTime ? `(${order.preferredTime})` : ""}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                      {isPayable && (
                        <Link
                          href={`/bookings/${order._id}`}
                          className="flex items-center gap-1.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-emerald-600/20 transition-all animate-pulse"
                        >
                          <CreditCard size={14} /> Pay Invoice <ChevronRight size={13} />
                        </Link>
                      )}

                      <div className="flex items-center gap-2">
                        {canDrop && (
                          <button
                            onClick={() => setDropOrderId(order._id)}
                            className="flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 px-3 py-2 text-xs font-bold text-rose-600 transition-all"
                          >
                            <Ban size={13} /> Drop Request
                          </button>
                        )}

                        <Link
                          href={`/bookings/${order._id}`}
                          className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-800 transition-all"
                        >
                          View Order <ChevronRight size={13} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ── Pagination ──────────────────────────────────────────────── */}
        {total > 20 && (
          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-extrabold text-slate-700 disabled:opacity-40 hover:bg-slate-50"
            >
              Previous
            </button>
            <span className="text-xs font-bold text-slate-500">
              Page {page} of {Math.ceil(total / 20)}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= Math.ceil(total / 20)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-extrabold text-slate-700 disabled:opacity-40 hover:bg-slate-50"
            >
              Next
            </button>
          </div>
        )}

        {/* Drop Modal */}
        {dropOrderId && (
          <DropModal
            onConfirm={handleDrop}
            onClose={() => setDropOrderId(null)}
            loading={dropLoading}
          />
        )}
      </div>
    </UserShell>
  );
}

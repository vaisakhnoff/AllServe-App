"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Loader2, Clock, Calendar, MapPin, FileText, ChevronRight, ListFilter, Search,
  Briefcase, CheckCircle2, AlertCircle, Phone, ArrowUpRight, Zap, Check, X,
  User, Filter, Sparkles, AlertTriangle, ExternalLink, MessageSquare, Play, ShieldAlert,
} from "lucide-react";
import toast from "react-hot-toast";
import { ProviderPortalShell } from "@/components/provider/ProviderPortalShell";
import { orderService } from "@/services/order";
import { OrderStatusBadge } from "@/components/provider/orders";
import { ServiceOrder, OrderDeliveryModel } from "@/types/order.types";
import { getErrorMessage } from "@/utils/errorHandler";

type ViewTab = "all" | "requests" | "in_progress" | "completed" | "cancelled";

const VIEW_TABS: { value: ViewTab; label: string; icon: typeof Briefcase; color: string }[] = [
  { value: "all", label: "All Bookings", icon: Briefcase, color: "indigo" },
  { value: "requests", label: "Action Needed", icon: AlertCircle, color: "amber" },
  { value: "in_progress", label: "In Progress", icon: Zap, color: "blue" },
  { value: "completed", label: "Completed", icon: CheckCircle2, color: "emerald" },
  { value: "cancelled", label: "Cancelled", icon: X, color: "slate" },
];

const DELIVERY_MODELS: { value: OrderDeliveryModel | ""; label: string; emoji: string }[] = [
  { value: "", label: "All Delivery Models", emoji: "📦" },
  { value: "direct", label: "Direct Instant & Scheduled", emoji: "⚡" },
  { value: "inspection_required", label: "Inspection First", emoji: "🔍" },
  { value: "custom", label: "Custom Service Requests", emoji: "📋" },
];

export default function UnifiedBookingsPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ViewTab>("all");
  const [deliveryFilter, setDeliveryFilter] = useState<OrderDeliveryModel | "">("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [page, setPage] = useState(1);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Map view tab to status query
  const getStatusParamForTab = (tab: ViewTab): string | undefined => {
    if (tab === "requests")
      return "awaiting_provider_response,inspection_accepted,quotation_submitted,quotation_accepted";
    if (tab === "in_progress")
      return "accepted,in_progress";
    if (tab === "completed")
      return "work_completed,inspection_completed,awaiting_payment,completed";
    if (tab === "cancelled")
      return "rejected_by_provider,cancelled,cancelled_with_refund,dropped_by_provider,dropped_by_customer,provider_unresponsive";
    return undefined;
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const statusParam = getStatusParamForTab(activeTab);
      const res = await orderService.getProviderOrders({
        ...(deliveryFilter ? { deliveryModel: deliveryFilter } : {}),
        ...(statusParam ? { status: statusParam } : {}),
        page,
        limit: 30,
      });

      let items = res.data.data.items || [];

      // Sort
      items = items.sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return sortBy === "newest" ? timeB - timeA : timeA - timeB;
      });

      // Search filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        items = items.filter((o) => {
          const titleMatch = o.title?.toLowerCase().includes(term);
          const descMatch = o.description.toLowerCase().includes(term);
          const idMatch = o.orderId.toLowerCase().includes(term);
          const cityMatch = o.address?.city?.toLowerCase().includes(term);
          const custName =
            typeof o.customerId === "object" ? o.customerId.name.toLowerCase() : "";
          return titleMatch || descMatch || idMatch || cityMatch || custName.includes(term);
        });
      }

      setOrders(items);
      setTotal(res.data.data.total);
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [activeTab, deliveryFilter, searchTerm, sortBy, page]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, deliveryFilter, searchTerm, sortBy]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Quick Action Handler directly from list card!
  const handleQuickAction = async (order: ServiceOrder, action: "accept" | "reject" | "start" | "complete") => {
    setActionLoadingId(order._id);
    try {
      if (action === "accept") {
        if (order.deliveryModel === "custom") {
          await orderService.acceptCustom(order._id);
        } else if (order.deliveryModel === "inspection_required") {
          await orderService.acceptInspection(order._id);
        } else {
          await orderService.accept(order._id);
        }
        toast.success("Order accepted!");
      } else if (action === "reject") {
        if (order.deliveryModel === "custom") {
          await orderService.rejectCustom(order._id);
        } else if (order.deliveryModel === "inspection_required") {
          await orderService.rejectInspection(order._id);
        } else {
          await orderService.reject(order._id);
        }
        toast.success("Order rejected");
      } else if (action === "start") {
        if (order.deliveryModel === "custom") {
          await orderService.customStartWork(order._id);
        } else if (order.deliveryModel === "inspection_required") {
          await orderService.inspectionStartWork(order._id);
        } else {
          await orderService.startWork(order._id);
        }
        toast.success("Work started!");
      } else if (action === "complete") {
        if (order.deliveryModel === "custom") {
          await orderService.customCompleteWork(order._id);
        } else if (order.deliveryModel === "inspection_required") {
          await orderService.inspectionCompleteWork(order._id);
        } else {
          await orderService.completeWork(order._id);
        }
        toast.success("Work marked as completed!");
      }
      fetchOrders();
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to update order");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Metrics summary
  const metrics = useMemo(() => {
    const actionNeeded = orders.filter((o) =>
      ["awaiting_provider_response", "quotation_accepted"].includes(o.status)
    ).length;
    const active = orders.filter((o) =>
      ["accepted", "in_progress"].includes(o.status)
    ).length;
    const completed = orders.filter((o) =>
      ["work_completed", "completed"].includes(o.status)
    ).length;

    return { actionNeeded, active, completed };
  }, [orders]);

  return (
    <ProviderPortalShell>
      {/* ── Page Header ───────────────────────────────────────────────── */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            Order Management
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
            Bookings & Work Orders
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage client requests, track active jobs, and update work status in real-time.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition-all"
        >
          <Clock size={14} className="text-indigo-600" />
          Refresh Orders
        </button>
      </div>

      {/* ── Metric KPI Quick Cards ────────────────────────────────────── */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50/80 to-white p-5 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
            <AlertCircle size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Action Required
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-950">
                {metrics.actionNeeded}
              </span>
              <span className="text-xs font-semibold text-amber-600">
                new requests
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-white p-5 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
            <Zap size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Jobs
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-950">
                {metrics.active}
              </span>
              <span className="text-xs font-semibold text-blue-600">
                in progress
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white p-5 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-500/20">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Completed Works
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-950">
                {metrics.completed}
              </span>
              <span className="text-xs font-semibold text-emerald-600">
                finished
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab Selector Navigation ──────────────────────────────────── */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          {VIEW_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-extrabold transition-all ${
                  active
                    ? "bg-slate-950 text-white shadow-md shadow-slate-950/20"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <Icon size={14} className={active ? "text-indigo-400" : "text-slate-400"} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500">Sort:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "newest" | "oldest")}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-900 outline-none focus:border-indigo-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* ── Search & Filter Controls ─────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-12">
        <div className="relative sm:col-span-8">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Order ID, Client Name, Service Title, City..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-xs font-semibold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-2xs placeholder:text-slate-400"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={deliveryFilter}
            onChange={(e) => setDeliveryFilter(e.target.value as OrderDeliveryModel | "")}
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 px-3.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 shadow-2xs"
          >
            {DELIVERY_MODELS.map((m) => (
              <option key={m.value || "all"} value={m.value}>
                {m.emoji} {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Order List View ─────────────────────────────────────────── */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-3xl border border-slate-100 bg-white shadow-sm">
          <Loader2 size={32} className="animate-spin text-indigo-600" />
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500 mb-4">
            <FileText size={32} />
          </div>
          <h3 className="text-lg font-black text-slate-900">No Bookings Found</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm || deliveryFilter
              ? "No orders match your active search filters. Try clearing filters."
              : "You currently have no bookings in this category."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const customerName =
              typeof order.customerId === "object"
                ? order.customerId.name
                : "Customer";
            const customerPhone =
              typeof order.customerId === "object"
                ? order.customerId.phone
                : order.contactPhone;

            const isAwaitingResponse = order.status === "awaiting_provider_response";
            const isInstantUrgent = isAwaitingResponse && order.subMode === "instant";
            const isAccepted = order.status === "accepted" || order.status === "quotation_accepted" || order.status === "inspection_accepted";
            const isInProgress = order.status === "in_progress";
            const isActionLoading = actionLoadingId === order._id;

            return (
              <div
                key={order._id}
                className={`group rounded-3xl border bg-white p-5 sm:p-6 transition-all duration-200 hover:shadow-xl hover:shadow-slate-100 ${
                  isInstantUrgent
                    ? "border-amber-300 ring-2 ring-amber-400/20 bg-gradient-to-r from-amber-50/40 via-white to-white"
                    : isInProgress
                    ? "border-indigo-200/80 ring-1 ring-indigo-100"
                    : "border-slate-200/80"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Info & Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <OrderStatusBadge order={order} size="sm" />
                      <span className="text-[11px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                        #{order.orderId || order._id.slice(-6)}
                      </span>
                      <span className="text-[11px] font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                        {order.deliveryModel === "direct"
                          ? `⚡ Direct (${order.subMode || "instant"})`
                          : order.deliveryModel === "inspection_required"
                          ? "🔍 Inspection"
                          : "📋 Custom"}
                      </span>
                    </div>

                    {/* Order Title */}
                    <h3 className="text-base font-black text-slate-950 group-hover:text-indigo-600 transition-colors leading-snug">
                      {order.title || order.description.slice(0, 90)}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {order.description}
                    </p>

                    {/* Customer & Location Metadata Bar */}
                    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-600 pt-3 border-t border-slate-100">
                      <span className="flex items-center gap-1.5 text-slate-900 font-bold">
                        <User size={13} className="text-indigo-600" />
                        {customerName}
                      </span>

                      {customerPhone && (
                        <a
                          href={`tel:${customerPhone}`}
                          className="flex items-center gap-1 text-indigo-600 hover:underline font-bold"
                        >
                          <Phone size={12} /> {customerPhone}
                        </a>
                      )}

                      {order.address && (
                        <span className="flex items-center gap-1 text-slate-500">
                          <MapPin size={13} className="text-slate-400" />
                          {order.address.city}, {order.address.state}
                        </span>
                      )}

                      {order.preferredDate && (
                        <span className="flex items-center gap-1 text-slate-700 font-bold">
                          <Calendar size={13} className="text-emerald-600" />
                          {order.preferredDate} {order.preferredTime ? `(${order.preferredTime})` : ""}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Actions & Direct Buttons */}
                  <div className="flex flex-wrap lg:flex-col items-end justify-between gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
                    <div className="text-right">
                      <span className="text-xs text-slate-400 font-semibold block">Total Price</span>
                      <span className="text-lg font-black text-slate-950">
                        {order.budget ? `₹${order.budget}` : order.platformFee ? `₹${order.platformFee}` : "Standard"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Accept/Reject for New Requests */}
                      {isAwaitingResponse && (
                        <>
                          <button
                            onClick={() => handleQuickAction(order, "accept")}
                            disabled={isActionLoading}
                            className="flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 text-xs font-extrabold text-white shadow-xs transition-all"
                          >
                            {isActionLoading ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                            Accept
                          </button>
                          <button
                            onClick={() => handleQuickAction(order, "reject")}
                            disabled={isActionLoading}
                            className="flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 px-3 py-2 text-xs font-bold text-rose-700 transition-all"
                          >
                            <X size={13} /> Reject
                          </button>
                        </>
                      )}

                      {/* Start Work Button */}
                      {isAccepted && (
                        <button
                          onClick={() => handleQuickAction(order, "start")}
                          disabled={isActionLoading}
                          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-extrabold text-white shadow-md shadow-indigo-600/20 transition-all"
                        >
                          {isActionLoading ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
                          Start Work
                        </button>
                      )}

                      {/* Complete Work Button */}
                      {isInProgress && (
                        <button
                          onClick={() => handleQuickAction(order, "complete")}
                          disabled={isActionLoading}
                          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-extrabold text-white shadow-md shadow-emerald-600/20 transition-all"
                        >
                          {isActionLoading ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                          Complete Work
                        </button>
                      )}

                      {/* View Details Link */}
                      <Link
                        href={`/provider-portal/bookings/${order._id}`}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-800 transition-all"
                      >
                        Details <ChevronRight size={13} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ──────────────────────────────────────────────── */}
      {total > 30 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-extrabold text-slate-700 disabled:opacity-40 hover:bg-slate-50"
          >
            Previous
          </button>
          <span className="text-xs font-bold text-slate-500">
            Page {page} of {Math.ceil(total / 30)}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(total / 30)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-extrabold text-slate-700 disabled:opacity-40 hover:bg-slate-50"
          >
            Next
          </button>
        </div>
      )}
    </ProviderPortalShell>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Loader2, CheckCircle2, XCircle, Clock, Zap, Calendar, MapPin,
  FileText, AlertCircle, Filter, Send, Play, IndianRupee, Receipt,
  CreditCard, Ban,
} from "lucide-react";
import toast from "react-hot-toast";
import { ProviderPortalShell } from "@/components/provider/ProviderPortalShell";
import { orderService } from "@/services/order";
import { invoiceService } from "@/services/invoice";
import { ServiceOrder, OrderDeliveryModel } from "@/types/order.types";
import { getErrorMessage } from "@/utils/errorHandler";

// ── Status & Model Config ─────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string }> = {
  awaiting_provider_response: { label: "Pending", dot: "bg-amber-400", bg: "bg-amber-50 text-amber-700 border-amber-200" },
  accepted: { label: "Accepted", dot: "bg-emerald-400", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  in_progress: { label: "In Progress", dot: "bg-blue-500", bg: "bg-blue-50 text-blue-700 border-blue-200" },
  work_completed: { label: "Work Done", dot: "bg-violet-400", bg: "bg-violet-50 text-violet-700 border-violet-200" },
  rejected_by_provider: { label: "Rejected", dot: "bg-red-400", bg: "bg-red-50 text-red-600 border-red-200" },
  provider_unresponsive: { label: "Expired", dot: "bg-slate-400", bg: "bg-slate-100 text-slate-600 border-slate-200" },
  awaiting_payment: { label: "Awaiting Payment", dot: "bg-indigo-400", bg: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  completed: { label: "Completed", dot: "bg-emerald-400", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cancelled: { label: "Cancelled", dot: "bg-slate-300", bg: "bg-slate-100 text-slate-500 border-slate-200" },
  cancelled_with_refund: { label: "Refunded", dot: "bg-slate-300", bg: "bg-slate-100 text-slate-500 border-slate-200" },
  inspection_accepted: { label: "Inspection Accepted", dot: "bg-sky-400", bg: "bg-sky-50 text-sky-700 border-sky-200" },
  inspection_completed: { label: "Inspected", dot: "bg-teal-400", bg: "bg-teal-50 text-teal-700 border-teal-200" },
  quotation_submitted: { label: "Quote Sent", dot: "bg-indigo-400", bg: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  quotation_accepted: { label: "Quote Accepted", dot: "bg-emerald-400", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  dropped_by_provider: { label: "Dropped", dot: "bg-red-300", bg: "bg-red-50 text-red-600 border-red-200" },
  dropped_by_customer: { label: "Customer Dropped", dot: "bg-slate-300", bg: "bg-slate-100 text-slate-500 border-slate-200" },
  broadcast_open: { label: "Open", dot: "bg-purple-400", bg: "bg-purple-50 text-purple-700 border-purple-200" },
  receiving_quotations: { label: "Receiving Quotes", dot: "bg-purple-400", bg: "bg-purple-50 text-purple-700 border-purple-200" },
  expired: { label: "Expired", dot: "bg-slate-300", bg: "bg-slate-100 text-slate-500 border-slate-200" },
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

// ── Invoice Modal Form ────────────────────────────────────────────────────────
function InvoiceModal({ orderId, onClose, onSuccess }: { orderId: string; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ labour: "", material: "", additional: "", discount: "", remark: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.labour || Number(form.labour) <= 0) e.labour = "Labour charge is required and must be > 0";
    if (form.material && Number(form.material) < 0) e.material = "Cannot be negative";
    if (form.additional && Number(form.additional) < 0) e.additional = "Cannot be negative";
    if (form.discount && Number(form.discount) < 0) e.discount = "Cannot be negative";
    const total = (Number(form.labour) || 0) + (Number(form.material) || 0) + (Number(form.additional) || 0) - (Number(form.discount) || 0);
    if (total <= 0) e.labour = "Total must be greater than 0";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await invoiceService.generate({
        orderId,
        labourCharge: Number(form.labour),
        materialCost: Number(form.material) || 0,
        additionalCharges: Number(form.additional) || 0,
        discount: Number(form.discount) || 0,
        overallRemark: form.remark || undefined,
      });
      toast.success("Invoice generated successfully");
      onSuccess();
    } catch (err) { toast.error(getErrorMessage(err) || "Failed to generate invoice"); }
    finally { setLoading(false); }
  };

  const total = (Number(form.labour) || 0) + (Number(form.material) || 0) + (Number(form.additional) || 0) - (Number(form.discount) || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-[800] text-slate-900 mb-1">Generate Invoice</h2>
        <p className="text-sm text-slate-500 mb-6">Fill in the charges for this service</p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Labour Charge (₹) *</label>
            <input type="number" value={form.labour} onChange={(e) => setForm({ ...form, labour: e.target.value })}
              className={`w-full rounded-xl border px-4 py-3 text-sm font-medium outline-none transition focus:ring-2 focus:ring-indigo-100 ${errors.labour ? "border-red-300 bg-red-50" : "border-slate-200 focus:border-indigo-400"}`}
              placeholder="e.g. 500" />
            {errors.labour && <p className="mt-1 text-xs text-red-500">{errors.labour}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Material (₹)</label>
              <input type="number" value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })}
                className={`w-full rounded-xl border px-4 py-3 text-sm font-medium outline-none transition focus:ring-2 focus:ring-indigo-100 ${errors.material ? "border-red-300 bg-red-50" : "border-slate-200 focus:border-indigo-400"}`}
                placeholder="0" />
              {errors.material && <p className="mt-1 text-xs text-red-500">{errors.material}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Additional (₹)</label>
              <input type="number" value={form.additional} onChange={(e) => setForm({ ...form, additional: e.target.value })}
                className={`w-full rounded-xl border px-4 py-3 text-sm font-medium outline-none transition focus:ring-2 focus:ring-indigo-100 ${errors.additional ? "border-red-300 bg-red-50" : "border-slate-200 focus:border-indigo-400"}`}
                placeholder="0" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Discount (₹)</label>
            <input type="number" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })}
              className={`w-full rounded-xl border px-4 py-3 text-sm font-medium outline-none transition focus:ring-2 focus:ring-indigo-100 ${errors.discount ? "border-red-300 bg-red-50" : "border-slate-200 focus:border-indigo-400"}`}
              placeholder="0" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Remark (optional)</label>
            <textarea value={form.remark} onChange={(e) => setForm({ ...form, remark: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none transition resize-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
              rows={2} placeholder="Any notes for the customer..." />
          </div>
        </div>

        {/* Total preview */}
        <div className="mt-5 rounded-2xl bg-slate-900 p-4 flex items-center justify-between text-white">
          <span className="text-sm font-bold">Total Amount</span>
          <span className="text-2xl font-[900]">₹{Math.max(0, total).toLocaleString("en-IN")}</span>
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition">Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Receipt size={14} />} Generate Invoice
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page Component ───────────────────────────────────────────────────────
export default function ProviderBookingsPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderDeliveryModel | "">("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [invoiceModal, setInvoiceModal] = useState<string | null>(null);

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

  // ── Action handlers ─────────────────────────────────────────────────────
  const handleAction = async (id: string, action: () => Promise<unknown>, successMsg: string) => {
    setActionLoading(id);
    try { await action(); toast.success(successMsg); fetchOrders(); }
    catch (err) { toast.error(getErrorMessage(err) || "Action failed"); }
    finally { setActionLoading(null); }
  };

  const handleMarkCash = async (orderId: string) => {
    if (!confirm("Confirm cash payment received?")) return;
    setActionLoading(orderId);
    try {
      const invRes = await invoiceService.getByOrder(orderId);
      if (invRes.data.data) {
        await invoiceService.markCash(invRes.data.data._id);
        toast.success("Payment confirmed");
        fetchOrders();
      }
    } catch (err) { toast.error(getErrorMessage(err) || "Failed"); }
    finally { setActionLoading(null); }
  };

  const handleDrop = async (id: string) => {
    const reason = prompt("Please provide a reason for dropping this service:");
    if (!reason?.trim()) return;
    handleAction(id, () => orderService.dropByProvider(id, reason.trim()), "Service dropped");
  };

  // ── Get available actions per order ─────────────────────────────────────
  const getActions = (order: ServiceOrder) => {
    const a: { label: string; icon: typeof CheckCircle2; onClick: () => void; variant: "primary" | "success" | "danger" | "secondary" }[] = [];

    // Direct flow
    if (order.status === "awaiting_provider_response" && order.deliveryModel === "direct") {
      a.push({ label: "Accept", icon: CheckCircle2, onClick: () => handleAction(order._id, () => orderService.accept(order._id), "Booking accepted"), variant: "success" });
      a.push({ label: "Reject", icon: XCircle, onClick: () => { if (confirm("Reject this booking?")) handleAction(order._id, () => orderService.reject(order._id), "Rejected"); }, variant: "danger" });
    }
    if (order.status === "accepted" && order.deliveryModel === "direct")
      a.push({ label: "Start Work", icon: Play, onClick: () => handleAction(order._id, () => orderService.startWork(order._id), "Work started"), variant: "primary" });
    if (order.status === "in_progress" && order.deliveryModel === "direct")
      a.push({ label: "Finish Work", icon: CheckCircle2, onClick: () => handleAction(order._id, () => orderService.completeWork(order._id), "Work completed"), variant: "success" });
    if (order.status === "work_completed")
      a.push({ label: "Generate Invoice", icon: Receipt, onClick: () => setInvoiceModal(order._id), variant: "primary" });

    // Inspection flow
    if (order.status === "awaiting_provider_response" && order.deliveryModel === "inspection_required") {
      a.push({ label: "Accept Inspection", icon: CheckCircle2, onClick: () => handleAction(order._id, () => orderService.acceptInspection(order._id), "Inspection accepted"), variant: "success" });
      a.push({ label: "Reject", icon: XCircle, onClick: () => { if (confirm("Reject?")) handleAction(order._id, () => orderService.rejectInspection(order._id), "Rejected"); }, variant: "danger" });
    }
    if (order.status === "inspection_accepted" && order.deliveryModel === "inspection_required") {
      a.push({ label: "Mark Inspection Done", icon: CheckCircle2, onClick: () => handleAction(order._id, () => orderService.markInspectionDone(order._id), "Inspection done"), variant: "primary" });
      a.push({ label: "Drop", icon: Ban, onClick: () => handleDrop(order._id), variant: "danger" });
    }
    if (order.status === "inspection_completed" && order.deliveryModel === "inspection_required") {
      a.push({ label: "Send Quotation", icon: Send, onClick: () => { /* TODO: quotation modal */ toast("Quotation modal coming soon"); }, variant: "primary" });
      a.push({ label: "Drop", icon: Ban, onClick: () => handleDrop(order._id), variant: "danger" });
    }
    if (order.status === "quotation_accepted" && order.deliveryModel === "inspection_required")
      a.push({ label: "Start Work", icon: Play, onClick: () => handleAction(order._id, () => orderService.inspectionStartWork(order._id), "Work started"), variant: "primary" });
    if (order.status === "in_progress" && order.deliveryModel === "inspection_required")
      a.push({ label: "Finish Work", icon: CheckCircle2, onClick: () => handleAction(order._id, () => orderService.inspectionCompleteWork(order._id), "Work completed"), variant: "success" });

    // Payment
    if (order.status === "awaiting_payment") {
      a.push({ label: "Mark Cash Paid", icon: IndianRupee, onClick: () => handleMarkCash(order._id), variant: "success" });
      a.push({ label: "Request Online Pay", icon: CreditCard, onClick: () => toast.success("Payment request sent to customer"), variant: "secondary" });
    }

    return a;
  };

  const VARIANT_STYLES = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700",
    success: "bg-emerald-600 text-white hover:bg-emerald-700",
    danger: "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50",
  };

  return (
    <ProviderPortalShell>
      {/* Header */}
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
            const actions = getActions(order);
            const isUrgent = order.status === "awaiting_provider_response" && order.subMode === "instant";

            return (
              <div key={order._id} className={`group relative flex flex-col rounded-2xl border bg-white shadow-sm transition hover:shadow-md ${isUrgent ? "border-amber-300 ring-1 ring-amber-100" : "border-slate-200"}`}>
                {/* Card Header */}
                <div className="p-5 pb-3">
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
                    <span className="text-[10px] font-mono text-slate-400">{order.orderId}</span>
                  </div>

                  {/* Title */}
                  <h3 className="text-[15px] font-bold text-slate-900 line-clamp-2 leading-snug mb-2">
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

                {/* Actions */}
                {actions.length > 0 && (
                  <div className="relative z-10 border-t border-slate-100 px-5 py-3 mt-auto">
                    <div className="flex flex-wrap gap-2">
                      {actions.map((action) => {
                        const Icon = action.icon;
                        return (
                          <button key={action.label} onClick={action.onClick} disabled={actionLoading === order._id}
                            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[11px] font-bold transition disabled:opacity-50 ${VARIANT_STYLES[action.variant]}`}>
                            {actionLoading === order._id ? <Loader2 size={11} className="animate-spin" /> : <Icon size={11} />}
                            {action.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
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

      {/* Invoice Modal */}
      {invoiceModal && (
        <InvoiceModal orderId={invoiceModal} onClose={() => setInvoiceModal(null)} onSuccess={() => { setInvoiceModal(null); fetchOrders(); }} />
      )}
    </ProviderPortalShell>
  );
}

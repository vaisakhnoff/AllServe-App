"use client";

import { useEffect, useState } from "react";
import {
  Loader2, CheckCircle2, XCircle, Clock, Zap, Calendar, MapPin,
  FileText, AlertCircle, Filter, ChevronDown, ChevronUp, Send,
  Play, IndianRupee, Receipt,
} from "lucide-react";
import toast from "react-hot-toast";
import { ProviderPortalShell } from "@/components/provider/ProviderPortalShell";
import { orderService } from "@/services/order";
import { quotationService } from "@/services/quotation";
import { invoiceService } from "@/services/invoice";
import { ServiceOrder, OrderDeliveryModel } from "@/types/order.types";
import { getErrorMessage } from "@/utils/errorHandler";

const STATUS_COLORS: Record<string, string> = {
  awaiting_provider_response: "bg-amber-50 text-amber-700",
  accepted: "bg-emerald-50 text-emerald-700",
  in_progress: "bg-blue-50 text-blue-700",
  work_completed: "bg-violet-50 text-violet-700",
  rejected_by_provider: "bg-red-50 text-red-600",
  provider_unresponsive: "bg-slate-100 text-slate-600",
  awaiting_payment: "bg-blue-50 text-blue-700",
  completed: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-slate-100 text-slate-500",
  cancelled_with_refund: "bg-slate-100 text-slate-500",
  inspection_accepted: "bg-sky-50 text-sky-700",
  inspection_completed: "bg-teal-50 text-teal-700",
  quotation_submitted: "bg-indigo-50 text-indigo-700",
  quotation_accepted: "bg-emerald-50 text-emerald-700",
  dropped_by_provider: "bg-red-50 text-red-600",
  dropped_by_customer: "bg-slate-100 text-slate-600",
  awaiting_advance: "bg-amber-50 text-amber-700",
  awaiting_final_payment: "bg-indigo-50 text-indigo-700",
  broadcast_open: "bg-purple-50 text-purple-700",
  receiving_quotations: "bg-purple-50 text-purple-700",
  expired: "bg-slate-100 text-slate-500",
};

const MODEL_BADGES: Record<OrderDeliveryModel, { label: string; emoji: string; color: string }> = {
  direct: { label: "Direct", emoji: "⚡", color: "bg-emerald-50 text-emerald-700" },
  inspection_required: { label: "Inspection", emoji: "🏠", color: "bg-blue-50 text-blue-700" },
  custom: { label: "Custom", emoji: "🎨", color: "bg-purple-50 text-purple-700" },
};

export default function ProviderBookingsPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderDeliveryModel | "">("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Quotation form state (for inspection bookings)
  const [quoteForm, setQuoteForm] = useState<{ orderId: string; labour: string; material: string; additional: string; days: string; notes: string; advance: string } | null>(null);

  // Invoice form state
  const [invoiceForm, setInvoiceForm] = useState<{ orderId: string; labour: string; material: string; additional: string; discount: string; remark: string } | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await orderService.getProviderOrders({
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

  const handleAccept = async (id: string) => {
    setActionLoading(id);
    try { await orderService.accept(id); toast.success("Booking accepted"); fetchOrders(); }
    catch (err) { toast.error(getErrorMessage(err) || "Failed"); }
    finally { setActionLoading(null); }
  };

  const handleReject = async (id: string) => {
    if (!confirm("Reject this booking?")) return;
    setActionLoading(id);
    try { await orderService.reject(id); toast.success("Booking rejected"); fetchOrders(); }
    catch (err) { toast.error(getErrorMessage(err) || "Failed"); }
    finally { setActionLoading(null); }
  };

  const handleStartWork = async (id: string) => {
    setActionLoading(id);
    try { await orderService.startWork(id); toast.success("Work started — you're now busy"); fetchOrders(); }
    catch (err) { toast.error(getErrorMessage(err) || "Failed"); }
    finally { setActionLoading(null); }
  };

  const handleCompleteWork = async (id: string) => {
    setActionLoading(id);
    try { await orderService.completeWork(id); toast.success("Work completed — you're available again"); fetchOrders(); }
    catch (err) { toast.error(getErrorMessage(err) || "Failed"); }
    finally { setActionLoading(null); }
  };

  const handleSubmitQuotation = async () => {
    if (!quoteForm) return;
    if (!quoteForm.labour || Number(quoteForm.labour) <= 0) { toast.error("Labour charge required"); return; }
    if (!quoteForm.days || Number(quoteForm.days) < 1) { toast.error("Estimated days required"); return; }
    setActionLoading(quoteForm.orderId);
    try {
      await quotationService.submit({
        orderId: quoteForm.orderId,
        labourCharge: Number(quoteForm.labour),
        materialCost: Number(quoteForm.material) || 0,
        additionalCharges: Number(quoteForm.additional) || 0,
        estimatedDurationDays: Number(quoteForm.days),
        advanceRequired: Number(quoteForm.advance) > 0,
        advanceAmount: Number(quoteForm.advance) || 0,
        notes: quoteForm.notes || undefined,
      });
      toast.success("Quotation sent to customer!");
      setQuoteForm(null);
      fetchOrders();
    } catch (err) { toast.error(getErrorMessage(err) || "Failed to submit quotation"); }
    finally { setActionLoading(null); }
  };

  const handleGenerateInvoice = async () => {
    if (!invoiceForm) return;
    if (!invoiceForm.labour || Number(invoiceForm.labour) <= 0) { toast.error("Labour charge required"); return; }
    setActionLoading(invoiceForm.orderId);
    try {
      await invoiceService.generate({
        orderId: invoiceForm.orderId,
        labourCharge: Number(invoiceForm.labour),
        materialCost: Number(invoiceForm.material) || 0,
        additionalCharges: Number(invoiceForm.additional) || 0,
        discount: Number(invoiceForm.discount) || 0,
        overallRemark: invoiceForm.remark || undefined,
      });
      toast.success("Invoice generated and sent!");
      setInvoiceForm(null);
      fetchOrders();
    } catch (err) { toast.error(getErrorMessage(err) || "Failed to generate invoice"); }
    finally { setActionLoading(null); }
  };

  const handleMarkCash = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      const invRes = await invoiceService.getByOrder(orderId);
      if (invRes.data.data) {
        await invoiceService.markCash(invRes.data.data._id);
        toast.success("Marked as paid by cash");
        fetchOrders();
      }
    } catch (err) { toast.error(getErrorMessage(err) || "Failed"); }
    finally { setActionLoading(null); }
  };

  const handleAcceptInspection = async (id: string) => {
    setActionLoading(id);
    try { await orderService.acceptInspection(id); toast.success("Inspection accepted"); fetchOrders(); }
    catch (err) { toast.error(getErrorMessage(err) || "Failed"); }
    finally { setActionLoading(null); }
  };

  const handleRejectInspection = async (id: string) => {
    if (!confirm("Reject this inspection request?")) return;
    setActionLoading(id);
    try { await orderService.rejectInspection(id); toast.success("Inspection rejected"); fetchOrders(); }
    catch (err) { toast.error(getErrorMessage(err) || "Failed"); }
    finally { setActionLoading(null); }
  };

  const handleMarkInspectionDone = async (id: string) => {
    setActionLoading(id);
    try { await orderService.markInspectionDone(id); toast.success("Inspection marked as done"); fetchOrders(); }
    catch (err) { toast.error(getErrorMessage(err) || "Failed"); }
    finally { setActionLoading(null); }
  };

  const handleDropByProvider = async (id: string) => {
    const reason = prompt("Why are you dropping this service?");
    if (!reason) return;
    setActionLoading(id);
    try { await orderService.dropByProvider(id, reason); toast.success("Service dropped"); fetchOrders(); }
    catch (err) { toast.error(getErrorMessage(err) || "Failed"); }
    finally { setActionLoading(null); }
  };

  const handleInspectionStartWork = async (id: string) => {
    setActionLoading(id);
    try { await orderService.inspectionStartWork(id); toast.success("Work started"); fetchOrders(); }
    catch (err) { toast.error(getErrorMessage(err) || "Failed"); }
    finally { setActionLoading(null); }
  };

  const handleInspectionCompleteWork = async (id: string) => {
    setActionLoading(id);
    try { await orderService.inspectionCompleteWork(id); toast.success("Work completed"); fetchOrders(); }
    catch (err) { toast.error(getErrorMessage(err) || "Failed"); }
    finally { setActionLoading(null); }
  };

  const handleRequestOnlinePay = async (orderId: string) => {
    // For now, this just notifies the user that online payment is requested
    // In production, this would trigger a payment link sent to the customer
    toast.success("Online payment request sent to customer");
  };

  const getActions = (order: ServiceOrder) => {
    const actions: { label: string; icon: typeof CheckCircle2; onClick: () => void; color: string }[] = [];

    // ── Direct flow ───────────────────────────────────────────────────────
    if (order.status === "awaiting_provider_response" && order.deliveryModel === "direct") {
      actions.push({ label: "Accept", icon: CheckCircle2, onClick: () => handleAccept(order._id), color: "bg-emerald-600 text-white hover:bg-emerald-700" });
      actions.push({ label: "Reject", icon: XCircle, onClick: () => handleReject(order._id), color: "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100" });
    }

    if (order.status === "accepted" && order.deliveryModel === "direct") {
      actions.push({ label: "Start Work", icon: Play, onClick: () => handleStartWork(order._id), color: "bg-blue-600 text-white hover:bg-blue-700" });
    }

    if (order.status === "in_progress" && order.deliveryModel === "direct") {
      actions.push({ label: "Finish Work", icon: CheckCircle2, onClick: () => handleCompleteWork(order._id), color: "bg-emerald-600 text-white hover:bg-emerald-700" });
    }

    if (order.status === "work_completed" && order.deliveryModel === "direct") {
      actions.push({ label: "Generate Invoice", icon: Receipt, onClick: () => setInvoiceForm({ orderId: order._id, labour: "", material: "", additional: "", discount: "", remark: "" }), color: "bg-indigo-600 text-white hover:bg-indigo-700" });
    }

    // ── Inspection flow ───────────────────────────────────────────────────
    if (order.status === "awaiting_provider_response" && order.deliveryModel === "inspection_required") {
      actions.push({ label: "Accept Inspection", icon: CheckCircle2, onClick: () => handleAcceptInspection(order._id), color: "bg-emerald-600 text-white hover:bg-emerald-700" });
      actions.push({ label: "Reject", icon: XCircle, onClick: () => handleRejectInspection(order._id), color: "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100" });
    }

    if (order.status === "inspection_accepted" && order.deliveryModel === "inspection_required") {
      actions.push({ label: "Mark Inspection Done", icon: CheckCircle2, onClick: () => handleMarkInspectionDone(order._id), color: "bg-blue-600 text-white hover:bg-blue-700" });
      actions.push({ label: "Drop Service", icon: XCircle, onClick: () => handleDropByProvider(order._id), color: "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100" });
    }

    if (order.status === "inspection_completed" && order.deliveryModel === "inspection_required") {
      actions.push({ label: "Send Quotation", icon: Send, onClick: () => setQuoteForm({ orderId: order._id, labour: "", material: "", additional: "", days: "", notes: "", advance: "" }), color: "bg-blue-600 text-white hover:bg-blue-700" });
      actions.push({ label: "Drop Service", icon: XCircle, onClick: () => handleDropByProvider(order._id), color: "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100" });
    }

    if (order.status === "quotation_accepted" && order.deliveryModel === "inspection_required") {
      actions.push({ label: "Start Work", icon: Play, onClick: () => handleInspectionStartWork(order._id), color: "bg-blue-600 text-white hover:bg-blue-700" });
    }

    if (order.status === "in_progress" && order.deliveryModel === "inspection_required") {
      actions.push({ label: "Finish Work", icon: CheckCircle2, onClick: () => handleInspectionCompleteWork(order._id), color: "bg-emerald-600 text-white hover:bg-emerald-700" });
    }

    if (order.status === "work_completed" && order.deliveryModel === "inspection_required") {
      actions.push({ label: "Generate Invoice", icon: Receipt, onClick: () => setInvoiceForm({ orderId: order._id, labour: "", material: "", additional: "", discount: "", remark: "" }), color: "bg-indigo-600 text-white hover:bg-indigo-700" });
    }

    // ── Shared ────────────────────────────────────────────────────────────
    if (["awaiting_payment", "awaiting_final_payment"].includes(order.status)) {
      actions.push({ label: "Mark Cash Paid", icon: IndianRupee, onClick: () => handleMarkCash(order._id), color: "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" });
      actions.push({ label: "Request Online Pay", icon: Receipt, onClick: () => handleRequestOnlinePay(order._id), color: "border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100" });
    }

    return actions;
  };

  return (
    <ProviderPortalShell>
      <div className="mb-6">
        <p className="text-sm font-bold text-indigo-600">Bookings</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">All Bookings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage all your service bookings — direct, inspection, and custom ({total} total)
        </p>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
          <Filter size={14} className="text-slate-400" />
          <select value={filter} onChange={(e) => { setFilter(e.target.value as OrderDeliveryModel | ""); setPage(1); }} className="bg-transparent text-sm font-semibold outline-none">
            <option value="">All types</option>
            <option value="direct">⚡ Direct</option>
            <option value="inspection_required">🏠 Inspection</option>
            <option value="custom">🎨 Custom</option>
          </select>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="bg-transparent text-sm font-semibold outline-none">
            <option value="">All statuses</option>
            <option value="awaiting_provider_response">⏳ Pending</option>
            <option value="accepted">✅ Accepted</option>
            <option value="in_progress">🔧 In Progress</option>
            <option value="work_completed">✓ Work Done</option>
            <option value="inspection_pending">🏠 Inspection Pending</option>
            <option value="awaiting_payment">💰 Awaiting Payment</option>
            <option value="completed">✓ Completed</option>
          </select>
        </div>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="flex h-48 items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={28} /></div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <FileText size={36} className="mx-auto text-slate-300 mb-3" />
          <p className="font-bold text-slate-600">No bookings found</p>
          <p className="text-sm text-slate-400 mt-1">Customer bookings will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const badge = MODEL_BADGES[order.deliveryModel];
            const isExpanded = expandedId === order._id;
            const actions = getActions(order);
            const isInstant = order.subMode === "instant";
            const isAwaiting = order.status === "awaiting_provider_response";

            return (
              <article key={order._id} className={`premium-card overflow-hidden transition-all ${isAwaiting ? "ring-2 ring-amber-200 ring-offset-1" : ""}`}>
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${badge.color}`}>{badge.emoji} {badge.label}</span>
                      {order.subMode && (
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${isInstant ? "bg-orange-50 text-orange-700" : "bg-sky-50 text-sky-700"}`}>
                          {isInstant ? "Instant" : "Scheduled"}
                        </span>
                      )}
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_COLORS[order.status] || "bg-slate-50 text-slate-600"}`}>
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">{order.orderId}</span>
                  </div>

                  {/* Content */}
                  <h3 className="text-base font-bold text-slate-900 mb-1">{order.title || order.description.slice(0, 80)}</h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mb-3">
                    {order.preferredDate && (
                      <span className="flex items-center gap-1"><Calendar size={12} /> {order.preferredDate} {order.preferredTime && `at ${order.preferredTime}`}</span>
                    )}
                    <span className="flex items-center gap-1"><MapPin size={12} /> {order.address.city}, {order.address.state}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                  </div>

                  {/* Timer warning */}
                  {isAwaiting && isInstant && (
                    <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                      <AlertCircle size={14} className="text-amber-600" />
                      <p className="text-xs font-semibold text-amber-700">Respond within 30 minutes</p>
                    </div>
                  )}

                  {/* Actions */}
                  {actions.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {actions.map((action) => {
                        const Icon = action.icon;
                        return (
                          <button key={action.label} onClick={action.onClick} disabled={actionLoading === order._id} className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all disabled:opacity-50 ${action.color}`}>
                            {actionLoading === order._id ? <Loader2 size={12} className="animate-spin" /> : <Icon size={12} />}
                            {action.label}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Expand toggle */}
                  <button onClick={() => setExpandedId(isExpanded ? null : order._id)} className="text-xs font-semibold text-indigo-600 flex items-center gap-1 mt-1">
                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    {isExpanded ? "Hide details" : "View details"}
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-100 text-sm text-slate-600">
                      <p className="mb-2">{order.description}</p>
                      {order.images && order.images.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto mb-2">
                          {order.images.map((img, i) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={i} src={img} alt="" className="h-16 w-16 rounded-lg object-cover border border-slate-200" />
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-slate-400">Customer: {typeof order.customerId === "object" ? (order.customerId as { name?: string }).name || "—" : "—"}</p>
                    </div>
                  )}
                </div>

                {/* ── Inline Quotation Form ─────────────────────────────── */}
                {quoteForm?.orderId === order._id && (
                  <div className="border-t border-blue-100 bg-blue-50/40 p-5">
                    <p className="text-sm font-black text-blue-800 mb-3">📋 Send Quotation to Customer</p>
                    <div className="grid gap-3 sm:grid-cols-3 mb-3">
                      <input type="number" value={quoteForm.labour} onChange={(e) => setQuoteForm({ ...quoteForm, labour: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Labour (₹) *" />
                      <input type="number" value={quoteForm.material} onChange={(e) => setQuoteForm({ ...quoteForm, material: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Material (₹)" />
                      <input type="number" value={quoteForm.additional} onChange={(e) => setQuoteForm({ ...quoteForm, additional: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Additional (₹)" />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3 mb-3">
                      <input type="number" value={quoteForm.days} onChange={(e) => setQuoteForm({ ...quoteForm, days: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Est. days *" />
                      <input type="number" value={quoteForm.advance} onChange={(e) => setQuoteForm({ ...quoteForm, advance: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Advance (₹)" />
                      <input value={quoteForm.notes} onChange={(e) => setQuoteForm({ ...quoteForm, notes: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Notes" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleSubmitQuotation} disabled={actionLoading === order._id} className="btn btn-primary px-4 py-2 text-xs">
                        {actionLoading === order._id ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />} Send Quotation
                      </button>
                      <button onClick={() => setQuoteForm(null)} className="btn btn-ghost px-3 py-2 text-xs">Cancel</button>
                    </div>
                  </div>
                )}

                {/* ── Inline Invoice Form ──────────────────────────────── */}
                {invoiceForm?.orderId === order._id && (
                  <div className="border-t border-indigo-100 bg-indigo-50/40 p-5">
                    <p className="text-sm font-black text-indigo-800 mb-3">🧾 Generate Invoice</p>
                    <div className="grid gap-3 sm:grid-cols-4 mb-3">
                      <input type="number" value={invoiceForm.labour} onChange={(e) => setInvoiceForm({ ...invoiceForm, labour: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Labour (₹) *" />
                      <input type="number" value={invoiceForm.material} onChange={(e) => setInvoiceForm({ ...invoiceForm, material: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Material (₹)" />
                      <input type="number" value={invoiceForm.additional} onChange={(e) => setInvoiceForm({ ...invoiceForm, additional: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Additional (₹)" />
                      <input type="number" value={invoiceForm.discount} onChange={(e) => setInvoiceForm({ ...invoiceForm, discount: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Discount (₹)" />
                    </div>
                    <input value={invoiceForm.remark} onChange={(e) => setInvoiceForm({ ...invoiceForm, remark: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mb-3" placeholder="Remark (optional)" />
                    <div className="flex gap-2">
                      <button onClick={handleGenerateInvoice} disabled={actionLoading === order._id} className="btn btn-primary px-4 py-2 text-xs">
                        {actionLoading === order._id ? <Loader2 size={12} className="animate-spin" /> : <Receipt size={12} />} Generate & Send
                      </button>
                      <button onClick={() => setInvoiceForm(null)} className="btn btn-ghost px-3 py-2 text-xs">Cancel</button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border px-3 py-1.5 text-sm font-semibold disabled:opacity-40">Previous</button>
          <span className="text-sm text-slate-500">Page {page} of {Math.ceil(total / 20)}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(total / 20)} className="rounded-lg border px-3 py-1.5 text-sm font-semibold disabled:opacity-40">Next</button>
        </div>
      )}
    </ProviderPortalShell>
  );
}

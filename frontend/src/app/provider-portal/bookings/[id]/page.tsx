"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Loader2, ArrowLeft, MapPin, Calendar, Clock, CheckCircle2,
  XCircle, Play, Receipt, IndianRupee, Send, Ban, CreditCard,
} from "lucide-react";
import toast from "react-hot-toast";
import { ProviderPortalShell } from "@/components/provider/ProviderPortalShell";
import { orderService } from "@/services/order";
import { quotationService } from "@/services/quotation";
import { invoiceService } from "@/services/invoice";
import { ServiceOrder, Invoice } from "@/types/order.types";
import { getErrorMessage } from "@/utils/errorHandler";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  awaiting_provider_response: { label: "Pending Response", color: "bg-amber-50 text-amber-700 border-amber-200" },
  accepted: { label: "Accepted", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  in_progress: { label: "In Progress", color: "bg-blue-50 text-blue-700 border-blue-200" },
  work_completed: { label: "Work Completed", color: "bg-violet-50 text-violet-700 border-violet-200" },
  inspection_accepted: { label: "Inspection Accepted", color: "bg-sky-50 text-sky-700 border-sky-200" },
  inspection_completed: { label: "Inspection Done", color: "bg-teal-50 text-teal-700 border-teal-200" },
  quotation_submitted: { label: "Quotation Sent", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  quotation_accepted: { label: "Quote Accepted", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  awaiting_payment: { label: "Awaiting Payment", color: "bg-blue-50 text-blue-700 border-blue-200" },
  completed: { label: "Completed", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected_by_provider: { label: "Rejected", color: "bg-red-50 text-red-600 border-red-200" },
  dropped_by_provider: { label: "Dropped", color: "bg-red-50 text-red-600 border-red-200" },
  dropped_by_customer: { label: "Customer Dropped", color: "bg-slate-100 text-slate-600 border-slate-200" },
  cancelled: { label: "Cancelled", color: "bg-slate-100 text-slate-500 border-slate-200" },
};

// ── Confirmation Modal ────────────────────────────────────────────────────────
function ConfirmModal({ title, message, confirmLabel, variant, onConfirm, onClose, loading }: {
  title: string; message: string; confirmLabel: string; variant: "success" | "danger";
  onConfirm: () => void; onClose: () => void; loading: boolean;
}) {
  const btnClass = variant === "success" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-[800] text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-600 mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={onConfirm} disabled={loading} className={`flex-1 rounded-xl py-2.5 text-sm font-bold text-white disabled:opacity-50 flex items-center justify-center gap-2 ${btnClass}`}>
            {loading && <Loader2 size={14} className="animate-spin" />} {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Drop Reason Modal ─────────────────────────────────────────────────────────
function DropModal({ onConfirm, onClose, loading }: { onConfirm: (reason: string) => void; onClose: () => void; loading: boolean }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-[800] text-slate-900 mb-2">Drop Service</h3>
        <p className="text-sm text-slate-600 mb-4">Please provide a reason for dropping this service.</p>
        <textarea value={reason} onChange={(e) => { setReason(e.target.value); setError(""); }}
          className={`w-full rounded-xl border px-4 py-3 text-sm outline-none resize-none transition focus:ring-2 focus:ring-red-100 ${error ? "border-red-300 bg-red-50" : "border-slate-200 focus:border-red-400"}`}
          rows={3} placeholder="Why are you dropping this service?" />
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={() => { if (!reason.trim()) { setError("Reason is required"); return; } onConfirm(reason.trim()); }} disabled={loading}
            className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader2 size={14} className="animate-spin" />} Drop Service
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Invoice Modal ─────────────────────────────────────────────────────────────
function InvoiceFormModal({ orderId, onClose, onSuccess }: { orderId: string; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ labour: "", material: "", additional: "", discount: "", remark: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [initialFetchLoading, setInitialFetchLoading] = useState(true);

  useEffect(() => {
    const fetchPrefill = async () => {
      try {
        const res = await invoiceService.getPrefill(orderId);
        const data = res.data.data;
        if (data.fromQuotation) {
          setIsLocked(true);
          setForm((prev) => ({
            ...prev,
            labour: String(data.labourCharge || 0),
            material: String(data.materialCost || 0),
            additional: "0",
          }));
        }
      } catch (err) {
        console.error("Failed to fetch prefill data", err);
      } finally {
        setInitialFetchLoading(false);
      }
    };
    fetchPrefill();
  }, [orderId]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.labour || Number(form.labour) <= 0) e.labour = "Required, must be greater than 0";
    if (form.material && Number(form.material) < 0) e.material = "Cannot be negative";
    if (form.additional && Number(form.additional) < 0) e.additional = "Cannot be negative";
    if (form.discount && Number(form.discount) < 0) e.discount = "Cannot be negative";
    const total = (Number(form.labour) || 0) + (Number(form.material) || 0) + (Number(form.additional) || 0) - (Number(form.discount) || 0);
    if (total <= 0) e.labour = "Total amount must be greater than 0";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await invoiceService.generate({ orderId, labourCharge: Number(form.labour), materialCost: Number(form.material) || 0, additionalCharges: Number(form.additional) || 0, discount: Number(form.discount) || 0, overallRemark: form.remark || undefined });
      toast.success("Invoice generated");
      onSuccess();
    } catch (err) { toast.error(getErrorMessage(err) || "Failed"); }
    finally { setLoading(false); }
  };

  const total = (Number(form.labour) || 0) + (Number(form.material) || 0) + (Number(form.additional) || 0) - (Number(form.discount) || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-[800] text-slate-900 mb-1">Generate Invoice</h2>
        <p className="text-sm text-slate-500 mb-6">Breakdown of charges for this service</p>
        
        {initialFetchLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="animate-spin text-indigo-500" size={24} />
          </div>
        ) : (
          <>
            {isLocked && (
              <div className="mb-4 rounded-xl bg-blue-50 p-3 text-xs font-semibold text-blue-700">
                Labour and Material costs are locked from the accepted quotation. You may only add additional charges if necessary.
              </div>
            )}
            <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Labour Charge (₹) *</label>
            <input type="number" value={form.labour} disabled={isLocked} onChange={(e) => setForm({ ...form, labour: e.target.value })} className={`w-full rounded-xl border px-4 py-3 text-sm font-medium outline-none transition focus:ring-2 focus:ring-indigo-100 ${errors.labour ? "border-red-300 bg-red-50" : "border-slate-200 focus:border-indigo-400"} ${isLocked ? "bg-slate-50 text-slate-500 cursor-not-allowed" : ""}`} placeholder="e.g. 500" />
            {errors.labour && <p className="mt-1 text-xs text-red-500">{errors.labour}</p>}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="block text-xs font-bold text-slate-600 mb-1.5">Material (₹)</label><input type="number" value={form.material} disabled={isLocked} onChange={(e) => setForm({ ...form, material: e.target.value })} className={`w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none focus:border-indigo-400 ${isLocked ? "bg-slate-50 text-slate-500 cursor-not-allowed" : ""}`} placeholder="0" /></div>
            <div><label className="block text-xs font-bold text-slate-600 mb-1.5">Additional (₹)</label><input type="number" value={form.additional} onChange={(e) => setForm({ ...form, additional: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none focus:border-indigo-400" placeholder="0" /></div>
            <div><label className="block text-xs font-bold text-slate-600 mb-1.5">Discount (₹)</label><input type="number" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none focus:border-indigo-400" placeholder="0" /></div>
          </div>
          <div><label className="block text-xs font-bold text-slate-600 mb-1.5">Remark</label><textarea value={form.remark} onChange={(e) => setForm({ ...form, remark: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none resize-none focus:border-indigo-400" rows={2} placeholder="Optional notes..." /></div>
        </div>
        <div className="mt-5 rounded-2xl bg-slate-900 p-4 flex items-center justify-between text-white">
          <span className="text-sm font-bold">Total</span><span className="text-2xl font-[900]">₹{Math.max(0, total).toLocaleString("en-IN")}</span>
        </div>
        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Receipt size={14} />} Generate
          </button>
        </div>
        </>
        )}
      </div>
    </div>
  );
}

// ── Quotation Modal ───────────────────────────────────────────────────────────
function QuotationFormModal({ orderId, onClose, onSuccess }: { orderId: string; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ labour: "", material: "", additional: "", days: "", advance: "", notes: "", startDate: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.labour || Number(form.labour) <= 0) e.labour = "Required, must be > 0";
    if (form.material && Number(form.material) < 0) e.material = "Cannot be negative";
    if (form.additional && Number(form.additional) < 0) e.additional = "Cannot be negative";
    if (!form.days || Number(form.days) < 1) e.days = "Required, minimum 1 day";
    if (form.advance && Number(form.advance) < 0) e.advance = "Cannot be negative";
    if (form.startDate && new Date(form.startDate) < new Date(new Date().toDateString())) e.startDate = "Cannot be in the past";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await quotationService.submit({ orderId, labourCharge: Number(form.labour), materialCost: Number(form.material) || 0, additionalCharges: Number(form.additional) || 0, estimatedDurationDays: Number(form.days), advanceRequired: Number(form.advance) > 0, advanceAmount: Number(form.advance) || 0, notes: form.notes || undefined });
      toast.success("Quotation sent to customer");
      onSuccess();
    } catch (err) { toast.error(getErrorMessage(err) || "Failed"); }
    finally { setLoading(false); }
  };

  const total = (Number(form.labour) || 0) + (Number(form.material) || 0) + (Number(form.additional) || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-[800] text-slate-900 mb-1">Send Quotation</h2>
        <p className="text-sm text-slate-500 mb-6">Provide pricing and timeline for this job</p>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Labour Charge (₹) *</label>
            <input type="number" value={form.labour} onChange={(e) => setForm({ ...form, labour: e.target.value })} className={`w-full rounded-xl border px-4 py-3 text-sm font-medium outline-none transition focus:ring-2 focus:ring-blue-100 ${errors.labour ? "border-red-300 bg-red-50" : "border-slate-200 focus:border-blue-400"}`} placeholder="e.g. 2000" />
            {errors.labour && <p className="mt-1 text-xs text-red-500">{errors.labour}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-bold text-slate-600 mb-1.5">Material (₹)</label><input type="number" value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400" placeholder="0" /></div>
            <div><label className="block text-xs font-bold text-slate-600 mb-1.5">Additional (₹)</label><input type="number" value={form.additional} onChange={(e) => setForm({ ...form, additional: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400" placeholder="0" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Estimated Days *</label>
              <input type="number" value={form.days} onChange={(e) => setForm({ ...form, days: e.target.value })} className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ${errors.days ? "border-red-300 bg-red-50" : "border-slate-200 focus:border-blue-400"}`} placeholder="e.g. 3" />
              {errors.days && <p className="mt-1 text-xs text-red-500">{errors.days}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Advance (₹)</label>
              <input type="number" value={form.advance} onChange={(e) => setForm({ ...form, advance: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400" placeholder="0" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Estimated Start Date</label>
            <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ${errors.startDate ? "border-red-300 bg-red-50" : "border-slate-200 focus:border-blue-400"}`} />
            {errors.startDate && <p className="mt-1 text-xs text-red-500">{errors.startDate}</p>}
          </div>
          <div><label className="block text-xs font-bold text-slate-600 mb-1.5">Notes</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none resize-none focus:border-blue-400" rows={2} placeholder="Scope of work, materials..." /></div>
        </div>
        <div className="mt-5 rounded-2xl bg-blue-900 p-4 flex items-center justify-between text-white">
          <span className="text-sm font-bold">Quoted Amount</span><span className="text-2xl font-[900]">₹{Math.max(0, total).toLocaleString("en-IN")}</span>
        </div>
        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Send Quotation
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Detail Page ──────────────────────────────────────────────────────────
export default function ProviderBookingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id || "";

  const [order, setOrder] = useState<ServiceOrder | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal states
  const [showConfirm, setShowConfirm] = useState<{ title: string; message: string; label: string; variant: "success" | "danger"; action: () => Promise<unknown> } | null>(null);
  const [showDrop, setShowDrop] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showQuotation, setShowQuotation] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await orderService.getById(id);
      setOrder(res.data.data);
      try { const invRes = await invoiceService.getByOrder(id); setInvoice(invRes.data.data || null); } catch { setInvoice(null); }
    } catch (err) { toast.error(getErrorMessage(err) || "Failed to load"); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (id) loadData(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConfirmAction = async () => {
    if (!showConfirm) return;
    setActionLoading(true);
    try { await showConfirm.action(); toast.success("Done"); setShowConfirm(null); loadData(); }
    catch (err) { toast.error(getErrorMessage(err) || "Failed"); }
    finally { setActionLoading(false); }
  };

  const handleDrop = async (reason: string) => {
    setActionLoading(true);
    try { await orderService.dropByProvider(id, reason); toast.success("Service dropped"); setShowDrop(false); loadData(); }
    catch (err) { toast.error(getErrorMessage(err) || "Failed"); }
    finally { setActionLoading(false); }
  };

  const handleMarkCash = async () => {
    setActionLoading(true);
    try {
      const invRes = await invoiceService.getByOrder(id);
      if (invRes.data.data) { await invoiceService.markCash(invRes.data.data._id); toast.success("Cash payment confirmed"); loadData(); }
    } catch (err) { toast.error(getErrorMessage(err) || "Failed"); }
    finally { setActionLoading(false); }
  };

  if (loading) return <ProviderPortalShell><div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={28} /></div></ProviderPortalShell>;
  if (!order) return <ProviderPortalShell><div className="flex h-64 flex-col items-center justify-center"><p className="font-bold text-slate-700">Booking not found</p></div></ProviderPortalShell>;

  const statusCfg = STATUS_CONFIG[order.status] || { label: order.status, color: "bg-slate-100 text-slate-600 border-slate-200" };

  return (
    <ProviderPortalShell>
      <button onClick={() => router.push("/provider-portal/bookings-unified")} className="group mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition">
        <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-0.5" /> Back to bookings
      </button>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left — Details */}
        <div className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-[11px] font-mono text-slate-400 mb-1">{order.orderId}</p>
                <h1 className="text-xl font-[800] text-slate-900">{order.title || order.description.slice(0, 100)}</h1>
              </div>
              <span className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-bold ${statusCfg.color}`}>{statusCfg.label}</span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">{order.description}</p>
            {order.intakeResponses && Object.keys(order.intakeResponses).length > 0 && (
              <div className="mb-4 rounded-xl border border-purple-100 bg-purple-50/60 p-4">
                <p className="text-xs font-bold text-purple-800 mb-3 flex items-center gap-1.5">
                  📋 Customer Requirements
                </p>
                <dl className="space-y-2">
                  {Object.entries(order.intakeResponses).map(([key, val]) => (
                    <div key={key}>
                      <dt className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{key.replace(/_/g, " ")}</dt>
                      <dd className="text-sm text-slate-800">{val}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
            <div className="flex flex-wrap gap-4 text-[12px] text-slate-500">
              <span className="flex items-center gap-1.5"><MapPin size={12} /> {order.address.street ? `${order.address.street}, ` : ""}{order.address.city}, {order.address.state} {order.address.zip}</span>
              {order.preferredDate && <span className="flex items-center gap-1.5"><Calendar size={12} /> {order.preferredDate} {order.preferredTime}</span>}
              <span className="flex items-center gap-1.5"><Clock size={12} /> {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
            </div>
            {order.images && order.images.length > 0 && (
              <div className="mt-4 flex gap-2 overflow-x-auto">
                {order.images.map((img, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={img} alt="" className="h-20 w-20 rounded-xl object-cover border border-slate-200 shrink-0" />
                ))}
              </div>
            )}
          </section>

          {/* Customer Contact & Location */}
          {(() => {
            const customer = typeof order.customerId === "object" ? order.customerId : null;
            return (
              <section className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5 space-y-4">
                <h2 className="text-[14px] font-bold text-slate-900 flex items-center gap-2">
                  <span className="text-base">👤</span> Customer Contact
                </h2>

                {/* Name + contact */}
                <div className="grid gap-3 sm:grid-cols-2">
                  {customer && (
                    <div className="rounded-xl bg-white border border-slate-100 p-3.5">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Customer</p>
                      <p className="text-sm font-bold text-slate-900">{customer.name}</p>
                      {customer.email && (
                        <a href={`mailto:${customer.email}`} className="text-xs text-indigo-600 hover:underline block mt-0.5">
                          {customer.email}
                        </a>
                      )}
                    </div>
                  )}

                  <div className="rounded-xl bg-white border border-slate-100 p-3.5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Contact Number</p>
                    {order.contactPhone ? (
                      <a
                        href={`tel:+91${order.contactPhone}`}
                        className="text-sm font-black text-slate-900 hover:text-indigo-600 flex items-center gap-1.5"
                      >
                        📞 +91 {order.contactPhone}
                      </a>
                    ) : customer?.phone ? (
                      <a
                        href={`tel:${customer.phone}`}
                        className="text-sm font-black text-slate-900 hover:text-indigo-600 flex items-center gap-1.5"
                      >
                        📞 {customer.phone}
                      </a>
                    ) : (
                      <p className="text-xs text-slate-400 italic">Not provided</p>
                    )}
                  </div>
                </div>

                {/* Full address */}
                <div className="rounded-xl bg-white border border-slate-100 p-3.5">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">
                    Service Address
                  </p>
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      {order.address.street && (
                        <p className="text-sm font-bold text-slate-900">{order.address.street}</p>
                      )}
                      <p className="text-sm text-slate-700">
                        {order.address.city}, {order.address.state} – {order.address.zip}
                      </p>
                      <p className="text-xs text-slate-500">{order.address.country}</p>
                    </div>
                  </div>
                </div>

                {order.preferredDate && (
                  <div className="rounded-xl bg-white border border-slate-100 p-3.5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Preferred Schedule</p>
                    <p className="text-sm font-bold text-slate-900">
                      📅 {order.preferredDate}
                      {order.preferredTime && ` at ${order.preferredTime}`}
                    </p>
                  </div>
                )}
              </section>
            );
          })()}

          {/* Timeline */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-[15px] font-bold text-slate-900 mb-4">Timeline</h2>
              <div className="space-y-3">
                {[...order.statusHistory].reverse().map((entry, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className={`h-2.5 w-2.5 rounded-full ${i === 0 ? "bg-indigo-500" : "bg-slate-300"}`} />
                      {i < order.statusHistory.length - 1 && <span className="mt-1 h-full w-[2px] bg-slate-200" />}
                    </div>
                    <div className="pb-3">
                      <p className="text-[13px] font-semibold text-slate-700 capitalize">{entry.status.replace(/_/g, " ")}</p>
                      <p className="text-[11px] text-slate-400">{new Date(entry.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Invoice */}
          {invoice && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[15px] font-bold text-slate-900 flex items-center gap-2"><IndianRupee size={15} className="text-indigo-500" /> Invoice</h2>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${invoice.paymentStatus === "pending" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                  {invoice.paymentStatus === "pending" ? "Unpaid" : "Paid"}
                </span>
              </div>
              <div className="rounded-xl bg-slate-900 p-4 flex items-center justify-between text-white">
                <span className="text-sm font-bold">Total</span>
                <span className="text-xl font-[900]">₹{invoice.total.toLocaleString("en-IN")}</span>
              </div>
            </section>
          )}
        </div>

        {/* Right — Actions */}
        <div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sticky top-5">
            <h3 className="text-[14px] font-bold text-slate-900 mb-5">Actions</h3>
            <div className="space-y-3">
              {/* Direct: Accept/Reject */}
              {order.status === "awaiting_provider_response" && (order.deliveryModel === "direct") && (<>
                <button onClick={() => setShowConfirm({ title: "Accept Booking", message: "You'll be committing to this service request.", label: "Accept", variant: "success", action: () => orderService.accept(id) })} className="w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white hover:bg-emerald-700 flex items-center justify-center gap-2"><CheckCircle2 size={15} /> Accept Booking</button>
                <button onClick={() => setShowConfirm({ title: "Reject Booking", message: "The customer will be notified and can choose another provider.", label: "Reject", variant: "danger", action: () => orderService.reject(id) })} className="w-full rounded-xl border border-red-200 bg-red-50 py-3.5 text-sm font-bold text-red-600 hover:bg-red-100 flex items-center justify-center gap-2"><XCircle size={15} /> Reject</button>
              </>)}
              {order.status === "accepted" && order.deliveryModel === "direct" && (
                <button onClick={() => setShowConfirm({ title: "Start Work", message: "Your status will change to busy.", label: "Start", variant: "success", action: () => orderService.startWork(id) })} className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white hover:bg-blue-700 flex items-center justify-center gap-2"><Play size={15} /> Start Work</button>
              )}
              {order.status === "in_progress" && order.deliveryModel === "direct" && (
                <button onClick={() => setShowConfirm({ title: "Finish Work", message: "Mark this job as completed. You can then generate an invoice.", label: "Finish", variant: "success", action: () => orderService.completeWork(id) })} className="w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white hover:bg-emerald-700 flex items-center justify-center gap-2"><CheckCircle2 size={15} /> Finish Work</button>
              )}

              {/* Custom order flow: accept → send quote → user accepts → start → finish → invoice */}
              {order.status === "awaiting_provider_response" && order.deliveryModel === "custom" && (<>
                <div className="rounded-xl border border-purple-100 bg-purple-50 p-3 mb-1">
                  <p className="text-xs font-semibold text-purple-800">
                    Review the customer&apos;s requirements below, then accept to send a quotation.
                  </p>
                </div>
                <button onClick={() => setShowConfirm({ title: "Accept Request", message: "You'll be committing to review this job and send a quotation.", label: "Accept", variant: "success", action: () => orderService.acceptCustom(id) })} className="w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white hover:bg-emerald-700 flex items-center justify-center gap-2"><CheckCircle2 size={15} /> Accept & Quote</button>
                <button onClick={() => setShowConfirm({ title: "Decline Request", message: "The customer will be notified you declined.", label: "Decline", variant: "danger", action: () => orderService.rejectCustom(id) })} className="w-full rounded-xl border border-red-200 bg-red-50 py-3.5 text-sm font-bold text-red-600 hover:bg-red-100 flex items-center justify-center gap-2"><XCircle size={15} /> Decline</button>
              </>)}
              {order.status === "quotation_submitted" && order.deliveryModel === "custom" && (<>
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 mb-1">
                  <p className="text-xs font-semibold text-blue-800">
                    Send your quotation to the customer. They&apos;ll accept or request changes.
                  </p>
                </div>
                <button onClick={() => setShowQuotation(true)} className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white hover:bg-blue-700 flex items-center justify-center gap-2"><Send size={15} /> Send Quotation</button>
                <button onClick={() => setShowDrop(true)} className="w-full rounded-xl border border-red-200 bg-red-50 py-3.5 text-sm font-bold text-red-600 hover:bg-red-100 flex items-center justify-center gap-2"><Ban size={15} /> Drop Request</button>
              </>)}
              {order.status === "quotation_accepted" && order.deliveryModel === "custom" && (
                <button onClick={() => setShowConfirm({ title: "Start Work", message: "Customer accepted your quote. Begin the project.", label: "Start", variant: "success", action: () => orderService.customStartWork(id) })} className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white hover:bg-blue-700 flex items-center justify-center gap-2"><Play size={15} /> Start Work</button>
              )}
              {order.status === "in_progress" && order.deliveryModel === "custom" && (
                <button onClick={() => setShowConfirm({ title: "Finish Work", message: "Mark as done. You can then generate an invoice.", label: "Finish", variant: "success", action: () => orderService.customCompleteWork(id) })} className="w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white hover:bg-emerald-700 flex items-center justify-center gap-2"><CheckCircle2 size={15} /> Finish Work</button>
              )}
              {order.status === "work_completed" && !invoice && (
                <button onClick={() => setShowInvoice(true)} className="w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white hover:bg-indigo-700 flex items-center justify-center gap-2"><Receipt size={15} /> Generate Invoice</button>
              )}
              {order.status === "awaiting_provider_response" && order.deliveryModel === "inspection_required" && (<>
                <button onClick={() => setShowConfirm({ title: "Accept Inspection", message: "You're committing to visit and inspect this job.", label: "Accept", variant: "success", action: () => orderService.acceptInspection(id) })} className="w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white hover:bg-emerald-700 flex items-center justify-center gap-2"><CheckCircle2 size={15} /> Accept Inspection</button>
                <button onClick={() => setShowConfirm({ title: "Reject", message: "Customer will be notified.", label: "Reject", variant: "danger", action: () => orderService.rejectInspection(id) })} className="w-full rounded-xl border border-red-200 bg-red-50 py-3.5 text-sm font-bold text-red-600 hover:bg-red-100 flex items-center justify-center gap-2"><XCircle size={15} /> Reject</button>
              </>)}
              {order.status === "inspection_accepted" && (<>
                <button onClick={() => setShowConfirm({ title: "Inspection Done", message: "Mark the site visit as complete. You can then send a quotation.", label: "Done", variant: "success", action: () => orderService.markInspectionDone(id) })} className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white hover:bg-blue-700 flex items-center justify-center gap-2"><CheckCircle2 size={15} /> Mark Inspection Done</button>
                <button onClick={() => setShowDrop(true)} className="w-full rounded-xl border border-red-200 bg-red-50 py-3.5 text-sm font-bold text-red-600 hover:bg-red-100 flex items-center justify-center gap-2"><Ban size={15} /> Drop Service</button>
              </>)}
              {order.status === "inspection_completed" && (<>
                <button onClick={() => setShowQuotation(true)} className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white hover:bg-blue-700 flex items-center justify-center gap-2"><Send size={15} /> Send Quotation</button>
                <button onClick={() => setShowDrop(true)} className="w-full rounded-xl border border-red-200 bg-red-50 py-3.5 text-sm font-bold text-red-600 hover:bg-red-100 flex items-center justify-center gap-2"><Ban size={15} /> Drop Service</button>
              </>)}
              {order.status === "quotation_accepted" && order.deliveryModel === "inspection_required" && (
                <button onClick={() => setShowConfirm({ title: "Start Work", message: "Begin the project.", label: "Start", variant: "success", action: () => orderService.inspectionStartWork(id) })} className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white hover:bg-blue-700 flex items-center justify-center gap-2"><Play size={15} /> Start Work</button>
              )}
              {order.status === "in_progress" && order.deliveryModel === "inspection_required" && (
                <button onClick={() => setShowConfirm({ title: "Finish Work", message: "Mark as done, then generate invoice.", label: "Finish", variant: "success", action: () => orderService.inspectionCompleteWork(id) })} className="w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white hover:bg-emerald-700 flex items-center justify-center gap-2"><CheckCircle2 size={15} /> Finish Work</button>
              )}

              {/* Payment */}
              {order.status === "awaiting_payment" && (<>
                <button onClick={() => setShowConfirm({ title: "Confirm Cash Payment", message: "Confirm you received cash from the customer.", label: "Confirm Cash", variant: "success", action: handleMarkCash })} className="w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white hover:bg-emerald-700 flex items-center justify-center gap-2"><IndianRupee size={15} /> Cash Received</button>
                <button onClick={() => toast.success("Payment request sent to customer")} className="w-full rounded-xl border border-blue-200 bg-blue-50 py-3.5 text-sm font-bold text-blue-700 hover:bg-blue-100 flex items-center justify-center gap-2"><CreditCard size={15} /> Request Online Pay</button>
              </>)}

              {["completed", "cancelled", "dropped_by_provider", "dropped_by_customer", "rejected_by_provider"].includes(order.status) && (
                <p className="text-sm text-slate-400 text-center py-6">No further actions available</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showConfirm && <ConfirmModal title={showConfirm.title} message={showConfirm.message} confirmLabel={showConfirm.label} variant={showConfirm.variant} onConfirm={handleConfirmAction} onClose={() => setShowConfirm(null)} loading={actionLoading} />}
      {showDrop && <DropModal onConfirm={handleDrop} onClose={() => setShowDrop(false)} loading={actionLoading} />}
      {showInvoice && <InvoiceFormModal orderId={id} onClose={() => setShowInvoice(false)} onSuccess={() => { setShowInvoice(false); loadData(); }} />}
      {showQuotation && <QuotationFormModal orderId={id} onClose={() => setShowQuotation(false)} onSuccess={() => { setShowQuotation(false); loadData(); }} />}
    </ProviderPortalShell>
  );
}

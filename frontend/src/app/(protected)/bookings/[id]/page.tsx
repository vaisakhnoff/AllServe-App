"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Loader2, ArrowLeft, MapPin, Calendar, Clock, CheckCircle2,
  XCircle, Edit3, CreditCard, FileText, IndianRupee,
  MessageSquare, Banknote,
} from "lucide-react";
import toast from "react-hot-toast";
import { orderService } from "@/services/order";
import { quotationService } from "@/services/quotation";
import { invoiceService } from "@/services/invoice";
import { ServiceOrder, Quotation, Invoice } from "@/types/order.types";
import { getErrorMessage } from "@/utils/errorHandler";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  awaiting_provider_response: { label: "Waiting for provider", color: "bg-amber-50 text-amber-700" },
  accepted: { label: "Accepted", color: "bg-emerald-50 text-emerald-700" },
  rejected_by_provider: { label: "Rejected", color: "bg-red-50 text-red-600" },
  provider_unresponsive: { label: "No response", color: "bg-slate-100 text-slate-600" },
  awaiting_payment: { label: "Invoice ready", color: "bg-blue-50 text-blue-700" },
  completed: { label: "Completed", color: "bg-emerald-50 text-emerald-700" },
  cancelled: { label: "Cancelled", color: "bg-slate-100 text-slate-500" },
  cancelled_with_refund: { label: "Refunded", color: "bg-slate-100 text-slate-500" },
  inspection_pending: { label: "Inspection pending", color: "bg-blue-50 text-blue-700" },
  quotation_submitted: { label: "Quote received", color: "bg-indigo-50 text-indigo-700" },
  quotation_accepted: { label: "Quote accepted", color: "bg-emerald-50 text-emerald-700" },
  awaiting_advance: { label: "Advance pending", color: "bg-amber-50 text-amber-700" },
  in_progress: { label: "In progress", color: "bg-blue-50 text-blue-700" },
  awaiting_final_payment: { label: "Payment pending", color: "bg-indigo-50 text-indigo-700" },
  broadcast_open: { label: "Receiving quotes", color: "bg-purple-50 text-purple-700" },
  receiving_quotations: { label: "Receiving quotes", color: "bg-purple-50 text-purple-700" },
  expired: { label: "Expired", color: "bg-slate-100 text-slate-500" },
};

export default function BookingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id || "";

  const [order, setOrder] = useState<ServiceOrder | null>(null);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [modComment, setModComment] = useState("");
  const [showModForm, setShowModForm] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const orderRes = await orderService.getById(id);
      setOrder(orderRes.data.data);

      const dm = orderRes.data.data.deliveryModel;
      if (dm === "inspection_required" || dm === "custom") {
        try {
          const qRes = await quotationService.getForOrder(id);
          setQuotations(qRes.data.data || []);
        } catch { setQuotations([]); }
      }

      try {
        const invRes = await invoiceService.getByOrder(id);
        setInvoice(invRes.data.data || null);
      } catch { setInvoice(null); }
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to load booking");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id) loadData(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAcceptQuote = async (quotationId: string) => {
    setActionLoading(true);
    try {
      await quotationService.accept(quotationId);
      toast.success("Quotation accepted!");
      loadData();
    } catch (err) { toast.error(getErrorMessage(err) || "Failed"); }
    finally { setActionLoading(false); }
  };

  const handleRejectQuote = async (quotationId: string) => {
    setActionLoading(true);
    try {
      await quotationService.reject(quotationId);
      toast.success("Quotation rejected");
      loadData();
    } catch (err) { toast.error(getErrorMessage(err) || "Failed"); }
    finally { setActionLoading(false); }
  };

  const handleRequestMod = async (quotationId: string) => {
    if (!modComment.trim()) { toast.error("Please describe what changes you need"); return; }
    setActionLoading(true);
    try {
      await quotationService.requestModification(quotationId, modComment.trim());
      toast.success("Modification requested");
      setShowModForm(null); setModComment("");
      loadData();
    } catch (err) { toast.error(getErrorMessage(err) || "Failed"); }
    finally { setActionLoading(false); }
  };

  const handlePayOnline = async () => {
    if (!invoice) return;
    setActionLoading(true);
    try {
      await invoiceService.payOnline(invoice._id);
      toast.success("Payment recorded!");
      loadData();
    } catch (err) { toast.error(getErrorMessage(err) || "Payment failed"); }
    finally { setActionLoading(false); }
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;
  }

  if (!order) {
    return <div className="flex h-64 items-center justify-center"><p className="font-bold text-slate-600">Booking not found</p></div>;
  }

  const statusCfg = STATUS_CONFIG[order.status] || { label: order.status, color: "bg-slate-50 text-slate-600" };

  return (
    <div>
      <button onClick={() => router.push("/bookings")} className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-indigo-600">
        <ArrowLeft size={14} /> Back to bookings
      </button>

      {/* ── Order Header ──────────────────────────────────────────── */}
      <div className="premium-card p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-bold text-indigo-600">{order.orderId}</p>
            <h1 className="text-2xl font-black text-slate-950 mt-1">{order.title || order.description.slice(0, 60)}</h1>
          </div>
          <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${statusCfg.color}`}>
            {statusCfg.label}
          </span>
        </div>

        <p className="text-sm text-slate-600 mb-4">{order.description}</p>

        <div className="flex flex-wrap gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1"><MapPin size={12} /> {order.address.city}, {order.address.state}</span>
          {order.preferredDate && <span className="flex items-center gap-1"><Calendar size={12} /> {order.preferredDate} {order.preferredTime}</span>}
          <span className="flex items-center gap-1"><Clock size={12} /> Created {new Date(order.createdAt).toLocaleDateString("en-IN")}</span>
        </div>

        {/* Status timeline */}
        {order.statusHistory.length > 1 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-600 mb-2">Timeline</p>
            <div className="space-y-2">
              {order.statusHistory.slice(-5).map((entry, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                  <span className="font-semibold capitalize">{entry.status.replace(/_/g, " ")}</span>
                  <span className="text-slate-400">· {new Date(entry.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Quotations ────────────────────────────────────────────── */}
      {quotations.length > 0 && (
        <section className="premium-card p-6 mb-6">
          <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
            <FileText size={18} className="text-indigo-600" />
            Quotations ({quotations.length})
          </h2>

          <div className="space-y-4">
            {quotations.map((q) => (
              <div key={q._id} className={`rounded-xl border p-4 ${
                q.status === "submitted" ? "border-blue-200 bg-blue-50/30" :
                q.status === "accepted" ? "border-emerald-200 bg-emerald-50/30" :
                "border-slate-200"
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">
                      {typeof q.providerId === "object" ? (q.providerId.businessName || q.providerId.name) : "Provider"}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      q.status === "submitted" ? "bg-blue-100 text-blue-700" :
                      q.status === "accepted" ? "bg-emerald-100 text-emerald-700" :
                      q.status === "rejected" ? "bg-red-100 text-red-600" :
                      q.status === "modification_requested" ? "bg-amber-100 text-amber-700" :
                      "bg-slate-100 text-slate-500"
                    }`}>
                      {q.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <span className="text-xl font-black text-slate-900">₹{q.totalAmount.toLocaleString("en-IN")}</span>
                </div>

                <div className="grid gap-2 sm:grid-cols-4 text-xs text-slate-500 mb-3">
                  <span>Labour: ₹{q.currentRevision.labourCharge.toLocaleString("en-IN")}</span>
                  <span>Material: ₹{q.currentRevision.materialCost.toLocaleString("en-IN")}</span>
                  <span>{q.currentRevision.estimatedDurationDays} days</span>
                  {q.currentRevision.advanceRequired && (
                    <span className="text-amber-600 font-semibold">Advance: ₹{q.currentRevision.advanceAmount.toLocaleString("en-IN")}</span>
                  )}
                </div>

                {q.currentRevision.notes && <p className="text-xs text-slate-500 mb-3 italic">&ldquo;{q.currentRevision.notes}&rdquo;</p>}

                {q.status === "submitted" && (
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
                    <button onClick={() => handleAcceptQuote(q._id)} disabled={actionLoading} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
                      <CheckCircle2 size={12} /> Accept
                    </button>
                    <button onClick={() => handleRejectQuote(q._id)} disabled={actionLoading} className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-100 disabled:opacity-50">
                      <XCircle size={12} /> Reject
                    </button>
                    <button onClick={() => setShowModForm(showModForm === q._id ? null : q._id)} className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-700 hover:bg-amber-100">
                      <Edit3 size={12} /> Request Changes
                    </button>
                  </div>
                )}

                {showModForm === q._id && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <textarea value={modComment} onChange={(e) => setModComment(e.target.value)} rows={2} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none resize-none focus:border-indigo-400 mb-2" placeholder="Describe what changes you'd like..." />
                    <div className="flex gap-2">
                      <button onClick={() => handleRequestMod(q._id)} disabled={actionLoading} className="btn btn-primary px-3 py-1.5 text-xs">
                        {actionLoading ? <Loader2 size={12} className="animate-spin" /> : <MessageSquare size={12} />} Send
                      </button>
                      <button onClick={() => { setShowModForm(null); setModComment(""); }} className="btn btn-ghost px-3 py-1.5 text-xs">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Invoice ───────────────────────────────────────────────── */}
      {invoice && (
        <section className="premium-card p-6">
          <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
            <IndianRupee size={18} className="text-indigo-600" /> Invoice
            <span className={`ml-auto rounded-full px-3 py-1 text-xs font-bold ${
              invoice.paymentStatus === "pending" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
            }`}>
              {invoice.paymentStatus === "pending" ? "Payment Due" : invoice.paymentStatus === "paid_online" ? "Paid Online" : "Paid (Cash)"}
            </span>
          </h2>

          <div className="grid gap-3 sm:grid-cols-2 mb-4">
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Labour</p><p className="text-lg font-black">₹{invoice.labourCharge.toLocaleString("en-IN")}</p></div>
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Material</p><p className="text-lg font-black">₹{invoice.materialCost.toLocaleString("en-IN")}</p></div>
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Additional</p><p className="text-lg font-black">₹{invoice.additionalCharges.toLocaleString("en-IN")}</p></div>
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Discount</p><p className="text-lg font-black text-emerald-600">-₹{invoice.discount.toLocaleString("en-IN")}</p></div>
          </div>

          <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4 flex items-center justify-between mb-4">
            <span className="text-base font-bold">Total</span>
            <span className="text-3xl font-black text-indigo-600">₹{invoice.total.toLocaleString("en-IN")}</span>
          </div>

          {invoice.overallRemark && <p className="text-sm text-slate-500 italic mb-4">&ldquo;{invoice.overallRemark}&rdquo;</p>}

          {invoice.paymentStatus === "pending" && (
            <button onClick={handlePayOnline} disabled={actionLoading} className="btn btn-primary w-full py-3.5 text-base">
              {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
              Pay ₹{invoice.total.toLocaleString("en-IN")} Online
            </button>
          )}

          {invoice.paymentStatus !== "pending" && (
            <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-4">
              <CheckCircle2 size={20} className="text-emerald-600" />
              <span className="text-sm font-bold text-emerald-700">
                Payment completed via {invoice.settlementMethod === "cash" ? "cash" : "online payment"}
              </span>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

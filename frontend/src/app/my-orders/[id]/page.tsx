"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Loader2, ArrowLeft, MapPin, Calendar, Clock, CheckCircle2,
  XCircle, Edit3, CreditCard, Banknote, FileText, IndianRupee,
  AlertCircle, MessageSquare,
} from "lucide-react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { orderService } from "@/services/order";
import { quotationService } from "@/services/quotation";
import { invoiceService } from "@/services/invoice";
import { ServiceOrder, Quotation, Invoice } from "@/types/order.types";
import { getErrorMessage } from "@/utils/errorHandler";
import { LoginRequiredPrompt } from "@/components/auth/LoginRequiredPrompt";
import { Role } from "@/enums/role.enum";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id || "";
  const { isAuthenticated, isInitialized, role } = useSelector((s: RootState) => s.auth);
  const canAccess = isInitialized && isAuthenticated && role === Role.USER;

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

      // Load quotations if applicable
      const dm = orderRes.data.data.deliveryModel;
      if (dm === "inspection_required" || dm === "custom") {
        try {
          const qRes = await quotationService.getForOrder(id);
          setQuotations(qRes.data.data || []);
        } catch { setQuotations([]); }
      }

      // Load invoice if exists
      try {
        const invRes = await invoiceService.getByOrder(id);
        setInvoice(invRes.data.data || null);
      } catch { setInvoice(null); }
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to load order");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (canAccess && id) loadData(); }, [canAccess, id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAcceptQuote = async (quotationId: string) => {
    setActionLoading(true);
    try {
      await quotationService.accept(quotationId);
      toast.success("Quotation accepted!");
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to accept");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectQuote = async (quotationId: string) => {
    setActionLoading(true);
    try {
      await quotationService.reject(quotationId);
      toast.success("Quotation rejected");
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to reject");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestMod = async (quotationId: string) => {
    if (!modComment.trim()) { toast.error("Please describe what changes you need"); return; }
    setActionLoading(true);
    try {
      await quotationService.requestModification(quotationId, modComment.trim());
      toast.success("Modification requested");
      setShowModForm(null);
      setModComment("");
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePayOnline = async () => {
    if (!invoice) return;
    setActionLoading(true);
    try {
      await invoiceService.payOnline(invoice._id);
      toast.success("Payment recorded!");
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err) || "Payment failed");
    } finally {
      setActionLoading(false);
    }
  };

  if (isInitialized && !canAccess) {
    return <LoginRequiredPrompt title="Login required" message="Sign in to view order details." />;
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--surface-2)] flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-[var(--surface-2)] flex items-center justify-center">
        <p className="font-bold text-slate-600">Order not found</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--surface-2)]">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <button onClick={() => router.back()} className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-indigo-600">
          <ArrowLeft size={14} /> Back to orders
        </button>

        {/* ── Order Header ──────────────────────────────────────────── */}
        <div className="premium-card p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-bold text-indigo-600">{order.orderId}</p>
              <h1 className="text-2xl font-black text-slate-950 mt-1">{order.title || order.description.slice(0, 60)}</h1>
            </div>
            <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">
              {order.status.replace(/_/g, " ")}
            </span>
          </div>
          <p className="text-sm text-slate-600 mb-4">{order.description}</p>
          <div className="flex flex-wrap gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1"><MapPin size={12} /> {order.address.city}, {order.address.state}</span>
            {order.preferredDate && <span className="flex items-center gap-1"><Calendar size={12} /> {order.preferredDate} {order.preferredTime}</span>}
            <span className="flex items-center gap-1"><Clock size={12} /> Created {new Date(order.createdAt).toLocaleDateString("en-IN")}</span>
          </div>
        </div>

        {/* ── Quotations Section ──────────────────────────────────────── */}
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

                  {q.currentRevision.notes && (
                    <p className="text-xs text-slate-500 mb-3 italic">&ldquo;{q.currentRevision.notes}&rdquo;</p>
                  )}

                  {/* Actions for submitted quotations */}
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

                  {/* Modification request form */}
                  {showModForm === q._id && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <textarea
                        value={modComment}
                        onChange={(e) => setModComment(e.target.value)}
                        rows={2}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none resize-none focus:border-indigo-400 mb-2"
                        placeholder="Describe what changes you'd like..."
                      />
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

        {/* ── Invoice Section ─────────────────────────────────────────── */}
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
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Labour</p>
                <p className="text-lg font-black">₹{invoice.labourCharge.toLocaleString("en-IN")}</p>
                {invoice.lineItemNotes?.labour && <p className="text-[11px] text-slate-400 mt-0.5">{invoice.lineItemNotes.labour}</p>}
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Material</p>
                <p className="text-lg font-black">₹{invoice.materialCost.toLocaleString("en-IN")}</p>
                {invoice.lineItemNotes?.material && <p className="text-[11px] text-slate-400 mt-0.5">{invoice.lineItemNotes.material}</p>}
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Additional</p>
                <p className="text-lg font-black">₹{invoice.additionalCharges.toLocaleString("en-IN")}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Discount</p>
                <p className="text-lg font-black text-emerald-600">-₹{invoice.discount.toLocaleString("en-IN")}</p>
              </div>
            </div>

            <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4 flex items-center justify-between mb-4">
              <span className="text-base font-bold">Total Amount</span>
              <span className="text-3xl font-black text-indigo-600">₹{invoice.total.toLocaleString("en-IN")}</span>
            </div>

            {invoice.overallRemark && (
              <p className="text-sm text-slate-500 italic mb-4">&ldquo;{invoice.overallRemark}&rdquo;</p>
            )}

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
    </main>
  );
}

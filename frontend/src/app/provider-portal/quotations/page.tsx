"use client";

import { useEffect, useState } from "react";
import {
  Loader2, FileText, Send, Clock, IndianRupee, MapPin,
  ChevronDown, ChevronUp, AlertCircle, Edit3, Users,
} from "lucide-react";
import toast from "react-hot-toast";
import { ProviderPortalShell } from "@/components/provider/ProviderPortalShell";
import { orderService } from "@/services/order";
import { quotationService } from "@/services/quotation";
import { ServiceOrder, Quotation } from "@/types/order.types";
import { getErrorMessage } from "@/utils/errorHandler";

const STATUS_COLORS: Record<string, string> = {
  submitted: "bg-blue-50 text-blue-700",
  accepted: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-600",
  modification_requested: "bg-amber-50 text-amber-700",
  withdrawn: "bg-slate-100 text-slate-500",
  rejected_by_selection: "bg-slate-100 text-slate-500",
};

export default function ProviderQuotationsPage() {
  const [tab, setTab] = useState<"open" | "my">("open");

  // Open requests (broadcast custom orders needing quotes)
  const [openRequests, setOpenRequests] = useState<ServiceOrder[]>([]);
  const [openTotal, setOpenTotal] = useState(0);
  const [openLoading, setOpenLoading] = useState(true);

  // My submitted quotations
  const [myQuotations, setMyQuotations] = useState<Quotation[]>([]);
  const [myTotal, setMyTotal] = useState(0);
  const [myLoading, setMyLoading] = useState(true);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Quote form for open requests
  const [quoteForm, setQuoteForm] = useState<{ orderId: string; labour: string; material: string; additional: string; days: string; notes: string; advance: string } | null>(null);

  // Revise form
  const [reviseForm, setReviseForm] = useState<{ quotationId: string; labour: string; material: string; additional: string; days: string; notes: string; advance: string } | null>(null);

  const fetchOpenRequests = async () => {
    setOpenLoading(true);
    try {
      // Fetch custom orders that are open for bidding
      const res = await orderService.getProviderOrders({ deliveryModel: "custom", status: "broadcast_open", page: 1, limit: 50 });
      const res2 = await orderService.getProviderOrders({ deliveryModel: "custom", status: "receiving_quotations", page: 1, limit: 50 });
      const all = [...(res.data.data.items || []), ...(res2.data.data.items || [])];
      setOpenRequests(all);
      setOpenTotal(all.length);
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to load requests");
    } finally {
      setOpenLoading(false);
    }
  };

  const fetchMyQuotations = async () => {
    setMyLoading(true);
    try {
      const res = await quotationService.getMyQuotations({ page: 1, limit: 50 });
      setMyQuotations(res.data.data.items);
      setMyTotal(res.data.data.total);
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to load quotations");
    } finally {
      setMyLoading(false);
    }
  };

  useEffect(() => { fetchOpenRequests(); fetchMyQuotations(); }, []);

  const handleSubmitQuote = async () => {
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
      toast.success("Quote submitted!");
      setQuoteForm(null);
      fetchOpenRequests();
      fetchMyQuotations();
    } catch (err) { toast.error(getErrorMessage(err) || "Failed"); }
    finally { setActionLoading(null); }
  };

  const handleRevise = async () => {
    if (!reviseForm) return;
    if (!reviseForm.labour || Number(reviseForm.labour) <= 0) { toast.error("Labour charge required"); return; }
    setActionLoading(reviseForm.quotationId);
    try {
      await quotationService.revise(reviseForm.quotationId, {
        labourCharge: Number(reviseForm.labour),
        materialCost: Number(reviseForm.material) || 0,
        additionalCharges: Number(reviseForm.additional) || 0,
        estimatedDurationDays: Number(reviseForm.days) || 1,
        advanceRequired: Number(reviseForm.advance) > 0,
        advanceAmount: Number(reviseForm.advance) || 0,
        notes: reviseForm.notes || undefined,
      });
      toast.success("Quote revised!");
      setReviseForm(null);
      fetchMyQuotations();
    } catch (err) { toast.error(getErrorMessage(err) || "Failed"); }
    finally { setActionLoading(null); }
  };

  return (
    <ProviderPortalShell>
      <div className="mb-6">
        <p className="text-sm font-bold text-indigo-600">Quotations</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Service Requests & Quotes</h1>
        <p className="mt-1 text-sm text-slate-500">
          Browse customer requests and submit competitive quotations
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
        <button onClick={() => setTab("open")} className={`rounded-lg px-4 py-2 text-sm font-bold transition ${tab === "open" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
          <Users size={14} className="inline mr-1.5" /> Open Requests ({openTotal})
        </button>
        <button onClick={() => setTab("my")} className={`rounded-lg px-4 py-2 text-sm font-bold transition ${tab === "my" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
          <FileText size={14} className="inline mr-1.5" /> My Quotes ({myTotal})
        </button>
      </div>

      {/* ── Open Requests Tab ──────────────────────────────────────────── */}
      {tab === "open" && (
        openLoading ? (
          <div className="flex h-48 items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={28} /></div>
        ) : openRequests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <Users size={36} className="mx-auto text-slate-300 mb-3" />
            <p className="font-bold text-slate-600">No open requests</p>
            <p className="text-sm text-slate-400 mt-1">New custom requests from customers will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {openRequests.map((order) => (
              <article key={order._id} className="premium-card overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="rounded-full bg-purple-50 px-2.5 py-1 text-[11px] font-bold text-purple-700">🎨 Custom Request</span>
                      <span className="ml-2 text-xs text-slate-400">{order.quoteCount} quote(s) received</span>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">{order.orderId}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-2">{order.title || order.description.slice(0, 80)}</h3>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">{order.description}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-2">
                    <span className="flex items-center gap-1"><MapPin size={11} /> {order.address.city}</span>
                    {order.budget && <span className="flex items-center gap-1"><IndianRupee size={11} /> Budget: ₹{order.budget.toLocaleString("en-IN")}</span>}
                    <span className="flex items-center gap-1"><Clock size={11} /> {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                  </div>

                  {!quoteForm || quoteForm.orderId !== order._id ? (
                    <button onClick={() => setQuoteForm({ orderId: order._id, labour: "", material: "", additional: "", days: "", notes: "", advance: "" })} className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700">
                      <Send size={12} /> Submit Quote
                    </button>
                  ) : null}
                </div>

                {/* Inline quote form */}
                {quoteForm?.orderId === order._id && (
                  <div className="border-t border-purple-100 bg-purple-50/40 p-5">
                    <p className="text-sm font-black text-purple-800 mb-3">Submit Your Quotation</p>
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
                      <button onClick={handleSubmitQuote} disabled={actionLoading === order._id} className="btn btn-primary px-4 py-2 text-xs">
                        {actionLoading === order._id ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />} Submit
                      </button>
                      <button onClick={() => setQuoteForm(null)} className="btn btn-ghost px-3 py-2 text-xs">Cancel</button>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        )
      )}

      {/* ── My Quotes Tab ──────────────────────────────────────────────── */}
      {tab === "my" && (
        myLoading ? (
          <div className="flex h-48 items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={28} /></div>
        ) : myQuotations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <FileText size={36} className="mx-auto text-slate-300 mb-3" />
            <p className="font-bold text-slate-600">No quotations submitted yet</p>
            <p className="text-sm text-slate-400 mt-1">Submit quotes on open requests to see them here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myQuotations.map((q) => {
              const needsRevision = q.status === "modification_requested";
              return (
                <article key={q._id} className={`premium-card overflow-hidden ${needsRevision ? "ring-2 ring-amber-200" : ""}`}>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_COLORS[q.status] || "bg-slate-50 text-slate-600"}`}>
                          {q.status.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs text-slate-400">Rev {q.currentRevision.revisionNumber}</span>
                      </div>
                      <span className="text-lg font-black text-slate-900">₹{q.totalAmount.toLocaleString("en-IN")}</span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                      <span>Labour: ₹{q.currentRevision.labourCharge.toLocaleString("en-IN")}</span>
                      <span>Material: ₹{q.currentRevision.materialCost.toLocaleString("en-IN")}</span>
                      <span>{q.currentRevision.estimatedDurationDays} days</span>
                      {q.currentRevision.advanceRequired && <span className="text-amber-600">Advance: ₹{q.currentRevision.advanceAmount.toLocaleString("en-IN")}</span>}
                    </div>

                    {needsRevision && q.modificationComment && (
                      <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                        <p className="text-xs font-bold text-amber-800 flex items-center gap-1"><AlertCircle size={12} /> Customer wants changes:</p>
                        <p className="text-xs text-amber-700 mt-1">{q.modificationComment}</p>
                      </div>
                    )}

                    {needsRevision && !reviseForm && (
                      <button onClick={() => setReviseForm({ quotationId: q._id, labour: String(q.currentRevision.labourCharge), material: String(q.currentRevision.materialCost), additional: String(q.currentRevision.additionalCharges), days: String(q.currentRevision.estimatedDurationDays), notes: q.currentRevision.notes || "", advance: String(q.currentRevision.advanceAmount) })} className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700">
                        <Edit3 size={12} /> Revise Quote
                      </button>
                    )}
                  </div>

                  {reviseForm?.quotationId === q._id && (
                    <div className="border-t border-amber-100 bg-amber-50/40 p-5">
                      <p className="text-sm font-black text-amber-800 mb-3">Revise Quotation</p>
                      <div className="grid gap-3 sm:grid-cols-3 mb-3">
                        <input type="number" value={reviseForm.labour} onChange={(e) => setReviseForm({ ...reviseForm, labour: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Labour (₹)" />
                        <input type="number" value={reviseForm.material} onChange={(e) => setReviseForm({ ...reviseForm, material: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Material (₹)" />
                        <input type="number" value={reviseForm.days} onChange={(e) => setReviseForm({ ...reviseForm, days: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Days" />
                      </div>
                      <input value={reviseForm.notes} onChange={(e) => setReviseForm({ ...reviseForm, notes: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mb-3" placeholder="Updated notes" />
                      <div className="flex gap-2">
                        <button onClick={handleRevise} disabled={actionLoading === q._id} className="btn btn-primary px-4 py-2 text-xs">
                          {actionLoading === q._id ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />} Submit Revision
                        </button>
                        <button onClick={() => setReviseForm(null)} className="btn btn-ghost px-3 py-2 text-xs">Cancel</button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )
      )}
    </ProviderPortalShell>
  );
}

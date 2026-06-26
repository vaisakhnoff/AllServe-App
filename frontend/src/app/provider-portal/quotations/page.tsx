"use client";

import { useEffect, useState } from "react";
import {
  Loader2, FileText, Plus, Send, Clock, IndianRupee,
  ChevronDown, ChevronUp, CheckCircle2, XCircle, Edit3, AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { ProviderPortalShell } from "@/components/provider/ProviderPortalShell";
import { quotationService } from "@/services/quotation";
import { orderService } from "@/services/order";
import { Quotation, ServiceOrder } from "@/types/order.types";
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
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form state
  const [formOrderId, setFormOrderId] = useState("");
  const [labourCharge, setLabourCharge] = useState("");
  const [materialCost, setMaterialCost] = useState("");
  const [additionalCharges, setAdditionalCharges] = useState("");
  const [estimatedDays, setEstimatedDays] = useState("");
  const [advanceRequired, setAdvanceRequired] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");

  // Revise form
  const [revisingId, setRevisingId] = useState<string | null>(null);

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const res = await quotationService.getMyQuotations({ page: 1, limit: 50 });
      setQuotations(res.data.data.items);
      setTotal(res.data.data.total);
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to load quotations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQuotations(); }, []);

  const resetForm = () => {
    setLabourCharge(""); setMaterialCost(""); setAdditionalCharges("");
    setEstimatedDays(""); setAdvanceRequired(false); setAdvanceAmount("");
    setNotes(""); setTerms(""); setFormOrderId(""); setSelectedOrder(null);
  };

  const handleLoadOrder = async () => {
    if (!formOrderId.trim()) { toast.error("Enter an order ID"); return; }
    try {
      const res = await orderService.getById(formOrderId.trim());
      setSelectedOrder(res.data.data);
    } catch {
      toast.error("Order not found or you don't have access");
    }
  };

  const handleSubmit = async () => {
    if (!formOrderId) { toast.error("Order ID required"); return; }
    if (!labourCharge || Number(labourCharge) <= 0) { toast.error("Labour charge required"); return; }
    if (!estimatedDays || Number(estimatedDays) < 1) { toast.error("Estimated days required"); return; }

    setSubmitting(true);
    try {
      await quotationService.submit({
        orderId: formOrderId,
        labourCharge: Number(labourCharge),
        materialCost: Number(materialCost) || 0,
        additionalCharges: Number(additionalCharges) || 0,
        estimatedDurationDays: Number(estimatedDays),
        advanceRequired,
        advanceAmount: advanceRequired ? Number(advanceAmount) || 0 : 0,
        notes: notes.trim() || undefined,
        termsAndConditions: terms.trim() || undefined,
      });
      toast.success("Quotation submitted!");
      setShowForm(false);
      resetForm();
      fetchQuotations();
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to submit quotation");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevise = async (id: string) => {
    if (!labourCharge || Number(labourCharge) <= 0) { toast.error("Labour charge required"); return; }
    setSubmitting(true);
    try {
      await quotationService.revise(id, {
        labourCharge: Number(labourCharge),
        materialCost: Number(materialCost) || 0,
        additionalCharges: Number(additionalCharges) || 0,
        estimatedDurationDays: Number(estimatedDays) || 1,
        advanceRequired,
        advanceAmount: advanceRequired ? Number(advanceAmount) || 0 : 0,
        notes: notes.trim() || undefined,
        termsAndConditions: terms.trim() || undefined,
      });
      toast.success("Quotation revised!");
      setRevisingId(null);
      resetForm();
      fetchQuotations();
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to revise");
    } finally {
      setSubmitting(false);
    }
  };

  const startRevise = (q: Quotation) => {
    setRevisingId(q._id);
    setLabourCharge(String(q.currentRevision.labourCharge));
    setMaterialCost(String(q.currentRevision.materialCost));
    setAdditionalCharges(String(q.currentRevision.additionalCharges));
    setEstimatedDays(String(q.currentRevision.estimatedDurationDays));
    setAdvanceRequired(q.currentRevision.advanceRequired);
    setAdvanceAmount(String(q.currentRevision.advanceAmount));
    setNotes(q.currentRevision.notes || "");
    setTerms(q.currentRevision.termsAndConditions || "");
  };

  const computeTotal = () => (Number(labourCharge) || 0) + (Number(materialCost) || 0) + (Number(additionalCharges) || 0);

  return (
    <ProviderPortalShell>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-indigo-600">Quotations</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">My Quotations</h1>
          <p className="mt-1 text-sm text-slate-500">{total} quotations submitted</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); resetForm(); }} className="btn btn-primary px-4 py-2.5 text-sm">
          <Plus size={16} /> New Quotation
        </button>
      </div>

      {/* ── New Quotation Form ─────────────────────────────────────────── */}
      {showForm && (
        <section className="premium-card p-6 mb-6 fade-up">
          <h2 className="text-lg font-black text-slate-950 mb-4">Submit Quotation</h2>

          {/* Order ID lookup */}
          <div className="mb-4">
            <label className="mb-1 block text-xs font-bold text-slate-600">Order ID</label>
            <div className="flex gap-2">
              <input
                value={formOrderId}
                onChange={(e) => setFormOrderId(e.target.value)}
                placeholder="Paste the order ID (from orders page)"
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
              />
              <button onClick={handleLoadOrder} className="btn btn-ghost px-3 py-2 text-sm">Load</button>
            </div>
            {selectedOrder && (
              <div className="mt-2 rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs">
                <p className="font-bold text-slate-700">{selectedOrder.title || selectedOrder.description.slice(0, 60)}</p>
                <p className="text-slate-500 mt-0.5">{selectedOrder.deliveryModel} · {selectedOrder.status}</p>
              </div>
            )}
          </div>

          {/* Cost breakdown */}
          <div className="grid gap-4 sm:grid-cols-3 mb-4">
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600">Labour charge (₹) *</label>
              <input type="number" min={0} value={labourCharge} onChange={(e) => setLabourCharge(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" placeholder="5000" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600">Material cost (₹)</label>
              <input type="number" min={0} value={materialCost} onChange={(e) => setMaterialCost(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" placeholder="2000" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600">Additional charges (₹)</label>
              <input type="number" min={0} value={additionalCharges} onChange={(e) => setAdditionalCharges(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" placeholder="500" />
            </div>
          </div>

          {/* Total display */}
          <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-3 mb-4 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700">Total Amount</span>
            <span className="text-xl font-black text-indigo-600">₹{computeTotal().toLocaleString("en-IN")}</span>
          </div>

          {/* Duration & advance */}
          <div className="grid gap-4 sm:grid-cols-2 mb-4">
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600">Estimated duration (days) *</label>
              <input type="number" min={1} value={estimatedDays} onChange={(e) => setEstimatedDays(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" placeholder="3" />
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer mt-5">
                <input type="checkbox" checked={advanceRequired} onChange={(e) => setAdvanceRequired(e.target.checked)} className="h-4 w-4 rounded accent-indigo-600" />
                <span className="text-xs font-bold text-slate-600">Require advance payment</span>
              </label>
              {advanceRequired && (
                <input type="number" min={1} value={advanceAmount} onChange={(e) => setAdvanceAmount(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" placeholder="Advance amount (₹)" />
              )}
            </div>
          </div>

          {/* Notes & terms */}
          <div className="grid gap-4 sm:grid-cols-2 mb-4">
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600">Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none resize-none focus:border-indigo-400" placeholder="Any additional details..." />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600">Terms & Conditions</label>
              <textarea value={terms} onChange={(e) => setTerms(e.target.value)} rows={3} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none resize-none focus:border-indigo-400" placeholder="Payment terms, warranty..." />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={() => { setShowForm(false); resetForm(); }} className="btn btn-ghost px-4 py-2 text-sm">Cancel</button>
            <button onClick={handleSubmit} disabled={submitting} className="btn btn-primary px-5 py-2.5 text-sm">
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Submit Quotation
            </button>
          </div>
        </section>
      )}

      {/* ── Quotation List ─────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex h-48 items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={28} /></div>
      ) : quotations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <FileText size={36} className="mx-auto text-slate-300 mb-3" />
          <p className="font-bold text-slate-600">No quotations yet</p>
          <p className="text-sm text-slate-400 mt-1">Submit a quotation when you receive an inspection or custom order</p>
        </div>
      ) : (
        <div className="space-y-3">
          {quotations.map((q) => {
            const isExpanded = expandedId === q._id;
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

                  <div className="flex flex-wrap gap-4 text-xs text-slate-500 mb-2">
                    <span className="flex items-center gap-1"><IndianRupee size={11} /> Labour: ₹{q.currentRevision.labourCharge}</span>
                    <span className="flex items-center gap-1">Material: ₹{q.currentRevision.materialCost}</span>
                    <span className="flex items-center gap-1"><Clock size={11} /> {q.currentRevision.estimatedDurationDays} days</span>
                  </div>

                  {needsRevision && q.modificationComment && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 mb-3">
                      <p className="text-xs font-bold text-amber-800 flex items-center gap-1"><AlertCircle size={12} /> Customer requested changes:</p>
                      <p className="text-xs text-amber-700 mt-1">{q.modificationComment}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button onClick={() => setExpandedId(isExpanded ? null : q._id)} className="text-xs font-semibold text-indigo-600 flex items-center gap-1">
                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />} Details
                    </button>
                    {needsRevision && (
                      <button onClick={() => startRevise(q)} className="text-xs font-semibold text-amber-700 flex items-center gap-1 ml-auto">
                        <Edit3 size={12} /> Revise
                      </button>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                      {q.currentRevision.notes && <p><span className="font-bold">Notes:</span> {q.currentRevision.notes}</p>}
                      {q.currentRevision.termsAndConditions && <p><span className="font-bold">Terms:</span> {q.currentRevision.termsAndConditions}</p>}
                      {q.currentRevision.advanceRequired && <p><span className="font-bold">Advance:</span> ₹{q.currentRevision.advanceAmount}</p>}
                      <p><span className="font-bold">Submitted:</span> {new Date(q.currentRevision.submittedAt).toLocaleString("en-IN")}</p>
                    </div>
                  )}

                  {/* Inline revise form */}
                  {revisingId === q._id && (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                      <p className="text-xs font-black text-slate-700">Revise Quotation</p>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <input type="number" value={labourCharge} onChange={(e) => setLabourCharge(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Labour (₹)" />
                        <input type="number" value={materialCost} onChange={(e) => setMaterialCost(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Material (₹)" />
                        <input type="number" value={estimatedDays} onChange={(e) => setEstimatedDays(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Days" />
                      </div>
                      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none" placeholder="Updated notes..." />
                      <div className="flex gap-2">
                        <button onClick={() => handleRevise(q._id)} disabled={submitting} className="btn btn-primary px-4 py-2 text-xs">
                          {submitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />} Submit Revision
                        </button>
                        <button onClick={() => { setRevisingId(null); resetForm(); }} className="btn btn-ghost px-3 py-2 text-xs">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </ProviderPortalShell>
  );
}

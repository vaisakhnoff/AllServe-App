"use client";

import { useState } from "react";
import {
  Loader2, FileText, Send, IndianRupee, Receipt, CheckCircle2, Banknote,
} from "lucide-react";
import toast from "react-hot-toast";
import { ProviderPortalShell } from "@/components/provider/ProviderPortalShell";
import { invoiceService } from "@/services/invoice";
import { orderService } from "@/services/order";
import { ServiceOrder, Invoice } from "@/types/order.types";
import { getErrorMessage } from "@/utils/errorHandler";

export default function ProviderInvoicesPage() {
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState<ServiceOrder | null>(null);
  const [existingInvoice, setExistingInvoice] = useState<Invoice | null>(null);

  // Form
  const [labourCharge, setLabourCharge] = useState("");
  const [materialCost, setMaterialCost] = useState("");
  const [additionalCharges, setAdditionalCharges] = useState("");
  const [discount, setDiscount] = useState("");
  const [labourNote, setLabourNote] = useState("");
  const [materialNote, setMaterialNote] = useState("");
  const [remark, setRemark] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [markingCash, setMarkingCash] = useState<string | null>(null);

  const subtotal = (Number(labourCharge) || 0) + (Number(materialCost) || 0) + (Number(additionalCharges) || 0);
  const total = subtotal - (Number(discount) || 0);

  const loadOrder = async () => {
    if (!orderId.trim()) { toast.error("Enter an order ID"); return; }
    try {
      const res = await orderService.getById(orderId.trim());
      setOrder(res.data.data);
      // Check for existing invoice
      try {
        const invRes = await invoiceService.getByOrder(orderId.trim());
        setExistingInvoice(invRes.data.data || null);
      } catch { setExistingInvoice(null); }
    } catch {
      toast.error("Order not found");
    }
  };

  const handleGenerate = async () => {
    if (!orderId) { toast.error("Load an order first"); return; }
    if (!labourCharge || Number(labourCharge) <= 0) { toast.error("Labour charge is required"); return; }
    if (Number(discount) > subtotal) { toast.error("Discount cannot exceed subtotal"); return; }

    setSubmitting(true);
    try {
      const inv = await invoiceService.generate({
        orderId,
        labourCharge: Number(labourCharge),
        materialCost: Number(materialCost) || 0,
        additionalCharges: Number(additionalCharges) || 0,
        discount: Number(discount) || 0,
        lineItemNotes: {
          labour: labourNote.trim() || undefined,
          material: materialNote.trim() || undefined,
        },
        overallRemark: remark.trim() || undefined,
      });
      setExistingInvoice(inv.data.data);
      toast.success("Invoice generated and sent to customer!");
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to generate invoice");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkCash = async (invoiceId: string) => {
    setMarkingCash(invoiceId);
    try {
      const res = await invoiceService.markCash(invoiceId);
      setExistingInvoice(res.data.data);
      toast.success("Marked as paid by cash");
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to mark as cash");
    } finally {
      setMarkingCash(null);
    }
  };

  return (
    <ProviderPortalShell>
      <div className="mb-8">
        <p className="text-sm font-bold text-indigo-600">Invoices</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Generate Invoice</h1>
        <p className="mt-1 text-sm text-slate-500">Create and send a detailed invoice after completing work</p>
      </div>

      {/* ── Order Lookup ──────────────────────────────────────────────── */}
      <section className="premium-card p-6 mb-6">
        <h2 className="text-base font-black text-slate-900 mb-3 flex items-center gap-2">
          <FileText size={16} className="text-indigo-600" /> Load Order
        </h2>
        <div className="flex gap-2">
          <input
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Enter the order ID"
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
          />
          <button onClick={loadOrder} className="btn btn-ghost px-4 py-2.5 text-sm">Load</button>
        </div>

        {order && (
          <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-indigo-600">{order.orderId}</span>
              <span className="text-xs text-slate-400">{order.deliveryModel} · {order.status}</span>
            </div>
            <p className="text-sm font-semibold text-slate-700">{order.title || order.description.slice(0, 80)}</p>
          </div>
        )}
      </section>

      {/* ── Existing Invoice Display ──────────────────────────────────── */}
      {existingInvoice && (
        <section className="premium-card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Receipt size={18} className="text-emerald-600" />
            <h2 className="text-lg font-black text-slate-900">Invoice Generated</h2>
            <span className={`ml-auto rounded-full px-3 py-1 text-xs font-bold ${
              existingInvoice.paymentStatus === "paid_online" ? "bg-emerald-50 text-emerald-700" :
              existingInvoice.paymentStatus === "paid_cash" ? "bg-emerald-50 text-emerald-700" :
              "bg-amber-50 text-amber-700"
            }`}>
              {existingInvoice.paymentStatus === "pending" ? "Awaiting Payment" :
               existingInvoice.paymentStatus === "paid_online" ? "Paid Online" : "Paid (Cash)"}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 mb-4">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Labour</p>
              <p className="text-lg font-black">₹{existingInvoice.labourCharge.toLocaleString("en-IN")}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Material</p>
              <p className="text-lg font-black">₹{existingInvoice.materialCost.toLocaleString("en-IN")}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Additional</p>
              <p className="text-lg font-black">₹{existingInvoice.additionalCharges.toLocaleString("en-IN")}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Discount</p>
              <p className="text-lg font-black text-red-600">-₹{existingInvoice.discount.toLocaleString("en-IN")}</p>
            </div>
          </div>

          <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4 flex items-center justify-between">
            <span className="text-base font-bold text-slate-800">Total</span>
            <span className="text-2xl font-black text-indigo-600">₹{existingInvoice.total.toLocaleString("en-IN")}</span>
          </div>

          {existingInvoice.paymentStatus === "pending" && (
            <button
              onClick={() => handleMarkCash(existingInvoice._id)}
              disabled={markingCash === existingInvoice._id}
              className="mt-4 btn btn-ghost px-5 py-2.5 text-sm w-full border-emerald-200 hover:!bg-emerald-50 hover:!text-emerald-700"
            >
              {markingCash ? <Loader2 size={14} className="animate-spin" /> : <Banknote size={14} />}
              Mark as Paid by Cash
            </button>
          )}
        </section>
      )}

      {/* ── Invoice Form (only if no existing invoice) ─────────────────── */}
      {order && !existingInvoice && (
        <section className="premium-card p-6 fade-up">
          <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
            <IndianRupee size={18} className="text-indigo-600" /> Invoice Details
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 mb-4">
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600">Labour charge (₹) *</label>
              <input type="number" min={0} value={labourCharge} onChange={(e) => setLabourCharge(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400" placeholder="5000" />
              <input value={labourNote} onChange={(e) => setLabourNote(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-100 px-3 py-1.5 text-xs outline-none" placeholder="Note (optional)" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600">Material cost (₹)</label>
              <input type="number" min={0} value={materialCost} onChange={(e) => setMaterialCost(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400" placeholder="2000" />
              <input value={materialNote} onChange={(e) => setMaterialNote(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-100 px-3 py-1.5 text-xs outline-none" placeholder="Note (optional)" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600">Additional charges (₹)</label>
              <input type="number" min={0} value={additionalCharges} onChange={(e) => setAdditionalCharges(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400" placeholder="500" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600">Discount (₹)</label>
              <input type="number" min={0} value={discount} onChange={(e) => setDiscount(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400" placeholder="0" />
            </div>
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-xs font-bold text-slate-600">Overall remark</label>
            <textarea value={remark} onChange={(e) => setRemark(e.target.value)} rows={2} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none resize-none focus:border-indigo-400" placeholder="Thank you for choosing us!" />
          </div>

          {/* Total preview */}
          <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4 flex items-center justify-between mb-5">
            <div>
              <p className="text-xs text-slate-500">Subtotal: ₹{subtotal.toLocaleString("en-IN")}</p>
              <p className="text-base font-bold text-slate-800 mt-0.5">Total after discount</p>
            </div>
            <span className="text-3xl font-black text-indigo-600">₹{Math.max(0, total).toLocaleString("en-IN")}</span>
          </div>

          <button onClick={handleGenerate} disabled={submitting} className="btn btn-primary w-full py-3 text-sm">
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Generate & Send Invoice
          </button>
        </section>
      )}
    </ProviderPortalShell>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  Loader2, Receipt,  Banknote, CheckCircle2,
  Clock, FileText, Send,
} from "lucide-react";
import toast from "react-hot-toast";
import { ProviderPortalShell } from "@/components/provider/ProviderPortalShell";
import { orderService } from "@/services/order";
import { invoiceService } from "@/services/invoice";
import { ServiceOrder, } from "@/types/order.types";
import { getErrorMessage } from "@/utils/errorHandler";

export default function ProviderInvoicesPage() {
  const [tab, setTab] = useState<"pending" | "generated">("pending");

  // Orders needing invoice (accepted/in_progress without invoice yet)
  const [pendingOrders, setPendingOrders] = useState<ServiceOrder[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);

  // Orders with invoices (awaiting_payment/awaiting_final_payment/completed)
  const [invoicedOrders, setInvoicedOrders] = useState<ServiceOrder[]>([]);
  const [invoicedLoading, setInvoicedLoading] = useState(true);

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [invoiceForm, setInvoiceForm] = useState<{ orderId: string; labour: string; material: string; additional: string; discount: string; remark: string } | null>(null);

  const fetchPending = async () => {
    setPendingLoading(true);
    try {
      // Orders in "accepted" or "in_progress" where invoice can be generated
      const res1 = await orderService.getProviderOrders({ status: "accepted", page: 1, limit: 50 });
      const res2 = await orderService.getProviderOrders({ status: "in_progress", page: 1, limit: 50 });
      setPendingOrders([...(res1.data.data.items || []), ...(res2.data.data.items || [])]);
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to load");
    } finally {
      setPendingLoading(false);
    }
  };

  const fetchInvoiced = async () => {
    setInvoicedLoading(true);
    try {
      const res1 = await orderService.getProviderOrders({ status: "awaiting_payment", page: 1, limit: 50 });
      const res2 = await orderService.getProviderOrders({ status: "awaiting_final_payment", page: 1, limit: 50 });
      const res3 = await orderService.getProviderOrders({ status: "completed", page: 1, limit: 50 });
      setInvoicedOrders([...(res1.data.data.items || []), ...(res2.data.data.items || []), ...(res3.data.data.items || [])]);
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to load");
    } finally {
      setInvoicedLoading(false);
    }
  };

  useEffect(() => { fetchPending(); fetchInvoiced(); }, []);

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
      toast.success("Invoice sent to customer!");
      setInvoiceForm(null);
      fetchPending();
      fetchInvoiced();
    } catch (err) { toast.error(getErrorMessage(err) || "Failed"); }
    finally { setActionLoading(null); }
  };

  const handleMarkCash = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      const invRes = await invoiceService.getByOrder(orderId);
      if (invRes.data.data) {
        await invoiceService.markCash(invRes.data.data._id);
        toast.success("Marked as paid by cash");
        fetchInvoiced();
      }
    } catch (err) { toast.error(getErrorMessage(err) || "Failed"); }
    finally { setActionLoading(null); }
  };

  return (
    <ProviderPortalShell>
      <div className="mb-6">
        <p className="text-sm font-bold text-indigo-600">Invoices</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Invoice Management</h1>
        <p className="mt-1 text-sm text-slate-500">Generate invoices for completed work and track payments</p>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
        <button onClick={() => setTab("pending")} className={`rounded-lg px-4 py-2 text-sm font-bold transition ${tab === "pending" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>
          <Clock size={14} className="inline mr-1.5" /> Ready for Invoice ({pendingOrders.length})
        </button>
        <button onClick={() => setTab("generated")} className={`rounded-lg px-4 py-2 text-sm font-bold transition ${tab === "generated" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>
          <Receipt size={14} className="inline mr-1.5" /> Invoiced ({invoicedOrders.length})
        </button>
      </div>

      {/* ── Pending Tab ────────────────────────────────────────────────── */}
      {tab === "pending" && (
        pendingLoading ? (
          <div className="flex h-48 items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={28} /></div>
        ) : pendingOrders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <Receipt size={36} className="mx-auto text-slate-300 mb-3" />
            <p className="font-bold text-slate-600">No bookings ready for invoicing</p>
            <p className="text-sm text-slate-400 mt-1">Complete work first, then generate an invoice</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingOrders.map((order) => (
              <article key={order._id} className="premium-card overflow-hidden">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-400">{order.orderId}</span>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${order.status === "accepted" ? "bg-emerald-50 text-emerald-700" : "bg-violet-50 text-violet-700"}`}>
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">{order.deliveryModel}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{order.title || order.description.slice(0, 60)}</h3>
                  <p className="text-xs text-slate-500 mt-1">{order.address.city} · {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>

                  {invoiceForm?.orderId !== order._id ? (
                    <button onClick={() => setInvoiceForm({ orderId: order._id, labour: "", material: "", additional: "", discount: "", remark: "" })} className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700">
                      <Receipt size={12} /> Generate Invoice
                    </button>
                  ) : null}
                </div>

                {invoiceForm?.orderId === order._id && (
                  <div className="border-t border-indigo-100 bg-indigo-50/40 p-5">
                    <p className="text-sm font-black text-indigo-800 mb-3">🧾 Create Invoice</p>
                    <div className="grid gap-3 sm:grid-cols-4 mb-3">
                      <input type="number" value={invoiceForm.labour} onChange={(e) => setInvoiceForm({ ...invoiceForm, labour: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Labour (₹) *" />
                      <input type="number" value={invoiceForm.material} onChange={(e) => setInvoiceForm({ ...invoiceForm, material: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Material (₹)" />
                      <input type="number" value={invoiceForm.additional} onChange={(e) => setInvoiceForm({ ...invoiceForm, additional: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Additional (₹)" />
                      <input type="number" value={invoiceForm.discount} onChange={(e) => setInvoiceForm({ ...invoiceForm, discount: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Discount (₹)" />
                    </div>
                    <input value={invoiceForm.remark} onChange={(e) => setInvoiceForm({ ...invoiceForm, remark: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mb-3" placeholder="Remark (optional)" />
                    {invoiceForm.labour && (
                      <div className="mb-3 rounded-lg bg-white border border-indigo-200 p-3 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-600">Total</span>
                        <span className="text-lg font-black text-indigo-600">
                          ₹{Math.max(0, (Number(invoiceForm.labour) || 0) + (Number(invoiceForm.material) || 0) + (Number(invoiceForm.additional) || 0) - (Number(invoiceForm.discount) || 0)).toLocaleString("en-IN")}
                        </span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button onClick={handleGenerateInvoice} disabled={actionLoading === order._id} className="btn btn-primary px-4 py-2 text-xs">
                        {actionLoading === order._id ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />} Send Invoice
                      </button>
                      <button onClick={() => setInvoiceForm(null)} className="btn btn-ghost px-3 py-2 text-xs">Cancel</button>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        )
      )}

      {/* ── Generated Tab ──────────────────────────────────────────────── */}
      {tab === "generated" && (
        invoicedLoading ? (
          <div className="flex h-48 items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={28} /></div>
        ) : invoicedOrders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <FileText size={36} className="mx-auto text-slate-300 mb-3" />
            <p className="font-bold text-slate-600">No invoices yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invoicedOrders.map((order) => {
              const isPending = ["awaiting_payment", "awaiting_final_payment"].includes(order.status);
              const isCompleted = order.status === "completed";

              return (
                <article key={order._id} className="premium-card p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-400">{order.orderId}</span>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        isCompleted ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                      }`}>
                        {isCompleted ? "✓ Paid" : "⏳ Awaiting Payment"}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{order.title || order.description.slice(0, 60)}</h3>

                  {isPending && (
                    <button onClick={() => handleMarkCash(order._id)} disabled={actionLoading === order._id} className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50">
                      {actionLoading === order._id ? <Loader2 size={12} className="animate-spin" /> : <Banknote size={12} />} Mark as Paid (Cash)
                    </button>
                  )}

                  {isCompleted && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                      <CheckCircle2 size={12} /> Payment received
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

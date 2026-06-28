"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Loader2, ArrowLeft, MapPin, Calendar, Clock, CheckCircle2,
  XCircle, Play, Receipt, IndianRupee, Send, Ban, CreditCard,
  FileText, Image as ImageIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { ProviderPortalShell } from "@/components/provider/ProviderPortalShell";
import { orderService } from "@/services/order";
import { quotationService } from "@/services/quotation";
import { invoiceService } from "@/services/invoice";
import { ServiceOrder, Quotation, Invoice } from "@/types/order.types";
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

export default function ProviderBookingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id || "";

  const [order, setOrder] = useState<ServiceOrder | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

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

  const handleAction = async (action: () => Promise<unknown>, msg: string) => {
    setActionLoading(true);
    try { await action(); toast.success(msg); loadData(); }
    catch (err) { toast.error(getErrorMessage(err) || "Failed"); }
    finally { setActionLoading(false); }
  };

  const handleMarkCash = async () => {
    if (!confirm("Confirm cash payment received from customer?")) return;
    setActionLoading(true);
    try {
      const invRes = await invoiceService.getByOrder(id);
      if (invRes.data.data) {
        await invoiceService.markCash(invRes.data.data._id);
        toast.success("Cash payment confirmed");
        loadData();
      }
    } catch (err) { toast.error(getErrorMessage(err) || "Failed"); }
    finally { setActionLoading(false); }
  };

  if (loading) return (
    <ProviderPortalShell>
      <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={28} /></div>
    </ProviderPortalShell>
  );

  if (!order) return (
    <ProviderPortalShell>
      <div className="flex h-64 flex-col items-center justify-center">
        <p className="font-bold text-slate-700">Booking not found</p>
        <button onClick={() => router.push("/provider-portal/bookings")} className="mt-3 text-sm text-indigo-600 font-semibold hover:underline">Back to bookings</button>
      </div>
    </ProviderPortalShell>
  );

  const statusCfg = STATUS_CONFIG[order.status] || { label: order.status, color: "bg-slate-100 text-slate-600 border-slate-200" };

  return (
    <ProviderPortalShell>
      {/* Back button */}
      <button onClick={() => router.push("/provider-portal/bookings")} className="group mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition">
        <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-0.5" /> Back to bookings
      </button>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left — Order details */}
        <div className="space-y-5">
          {/* Header card */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-[11px] font-mono text-slate-400 mb-1">{order.orderId}</p>
                <h1 className="text-xl font-[800] text-slate-900">{order.title || order.description.slice(0, 100)}</h1>
              </div>
              <span className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-bold ${statusCfg.color}`}>{statusCfg.label}</span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{order.description}</p>
            <div className="mt-4 flex flex-wrap gap-4 text-[12px] text-slate-500">
              <span className="flex items-center gap-1.5"><MapPin size={12} /> {order.address.city}, {order.address.state} {order.address.zip}</span>
              {order.preferredDate && <span className="flex items-center gap-1.5"><Calendar size={12} /> {order.preferredDate} {order.preferredTime}</span>}
              <span className="flex items-center gap-1.5"><Clock size={12} /> Created {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
            </div>
            {/* Images */}
            {order.images && order.images.length > 0 && (
              <div className="mt-4 flex gap-2 overflow-x-auto">
                {order.images.map((img, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={img} alt="" className="h-20 w-20 rounded-xl object-cover border border-slate-200 shrink-0" />
                ))}
              </div>
            )}
          </section>

          {/* Status timeline */}
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
                      <p className="text-[13px] font-semibold text-slate-700">{entry.status.replace(/_/g, " ")}</p>
                      <p className="text-[11px] text-slate-400">{new Date(entry.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Invoice section */}
          {invoice && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="flex items-center gap-2 text-[15px] font-bold text-slate-900"><IndianRupee size={15} className="text-indigo-500" /> Invoice</h2>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${invoice.paymentStatus === "pending" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                  {invoice.paymentStatus === "pending" ? "Unpaid" : "Paid"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-bold text-slate-400">LABOUR</p><p className="text-lg font-[800] text-slate-900">₹{invoice.labourCharge}</p></div>
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-bold text-slate-400">MATERIAL</p><p className="text-lg font-[800] text-slate-900">₹{invoice.materialCost}</p></div>
              </div>
              <div className="rounded-xl bg-slate-900 p-4 flex items-center justify-between text-white">
                <span className="text-sm font-bold">Total</span>
                <span className="text-xl font-[900]">₹{invoice.total.toLocaleString("en-IN")}</span>
              </div>
            </section>
          )}
        </div>

        {/* Right — Actions sidebar */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sticky top-5">
            <h3 className="text-[14px] font-bold text-slate-900 mb-4">Actions</h3>
            <div className="space-y-2.5">
              {/* Direct: Accept/Reject */}
              {order.status === "awaiting_provider_response" && order.deliveryModel === "direct" && (<>
                <button onClick={() => handleAction(() => orderService.accept(id), "Accepted")} disabled={actionLoading} className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"><CheckCircle2 size={14} /> Accept Booking</button>
                <button onClick={() => { if (confirm("Reject?")) handleAction(() => orderService.reject(id), "Rejected"); }} disabled={actionLoading} className="w-full rounded-xl border border-red-200 bg-red-50 py-3 text-sm font-bold text-red-600 hover:bg-red-100 disabled:opacity-50 flex items-center justify-center gap-2"><XCircle size={14} /> Reject</button>
              </>)}
              {/* Direct: Start Work */}
              {order.status === "accepted" && order.deliveryModel === "direct" && (
                <button onClick={() => handleAction(() => orderService.startWork(id), "Work started")} disabled={actionLoading} className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"><Play size={14} /> Start Work</button>
              )}
              {/* Direct: Finish Work */}
              {order.status === "in_progress" && order.deliveryModel === "direct" && (
                <button onClick={() => handleAction(() => orderService.completeWork(id), "Work completed")} disabled={actionLoading} className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"><CheckCircle2 size={14} /> Mark Work Done</button>
              )}
              {/* Work completed: Generate Invoice */}
              {order.status === "work_completed" && (
                <button onClick={() => router.push(`/provider-portal/bookings?invoiceFor=${id}`)} disabled={actionLoading} className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"><Receipt size={14} /> Generate Invoice</button>
              )}
              {/* Inspection: Accept/Reject */}
              {order.status === "awaiting_provider_response" && order.deliveryModel === "inspection_required" && (<>
                <button onClick={() => handleAction(() => orderService.acceptInspection(id), "Inspection accepted")} disabled={actionLoading} className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"><CheckCircle2 size={14} /> Accept Inspection</button>
                <button onClick={() => { if (confirm("Reject?")) handleAction(() => orderService.rejectInspection(id), "Rejected"); }} disabled={actionLoading} className="w-full rounded-xl border border-red-200 bg-red-50 py-3 text-sm font-bold text-red-600 hover:bg-red-100 disabled:opacity-50 flex items-center justify-center gap-2"><XCircle size={14} /> Reject</button>
              </>)}
              {/* Inspection: Mark Done */}
              {order.status === "inspection_accepted" && (
                <button onClick={() => handleAction(() => orderService.markInspectionDone(id), "Inspection done")} disabled={actionLoading} className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"><CheckCircle2 size={14} /> Mark Inspection Done</button>
              )}
              {/* Inspection: Send Quotation */}
              {order.status === "inspection_completed" && (
                <button onClick={() => router.push(`/provider-portal/bookings?quoteFor=${id}`)} disabled={actionLoading} className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"><Send size={14} /> Send Quotation</button>
              )}
              {/* Inspection: Start/Complete Work */}
              {order.status === "quotation_accepted" && order.deliveryModel === "inspection_required" && (
                <button onClick={() => handleAction(() => orderService.inspectionStartWork(id), "Work started")} disabled={actionLoading} className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"><Play size={14} /> Start Work</button>
              )}
              {order.status === "in_progress" && order.deliveryModel === "inspection_required" && (
                <button onClick={() => handleAction(() => orderService.inspectionCompleteWork(id), "Work completed")} disabled={actionLoading} className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"><CheckCircle2 size={14} /> Mark Work Done</button>
              )}
              {/* Payment */}
              {order.status === "awaiting_payment" && (<>
                <button onClick={handleMarkCash} disabled={actionLoading} className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"><IndianRupee size={14} /> Mark Cash Paid</button>
                <button onClick={() => toast.success("Online payment request sent")} className="w-full rounded-xl border border-blue-200 bg-blue-50 py-3 text-sm font-bold text-blue-700 hover:bg-blue-100 flex items-center justify-center gap-2"><CreditCard size={14} /> Request Online Pay</button>
              </>)}
              {/* Drop */}
              {["inspection_accepted", "inspection_completed"].includes(order.status) && (
                <button onClick={() => { const r = prompt("Reason for dropping?"); if (r?.trim()) handleAction(() => orderService.dropByProvider(id, r.trim()), "Dropped"); }} disabled={actionLoading} className="w-full rounded-xl border border-red-200 bg-red-50 py-3 text-sm font-bold text-red-600 hover:bg-red-100 disabled:opacity-50 flex items-center justify-center gap-2"><Ban size={14} /> Drop Service</button>
              )}
              {/* No actions available */}
              {["completed", "cancelled", "dropped_by_provider", "dropped_by_customer", "rejected_by_provider"].includes(order.status) && (
                <p className="text-sm text-slate-400 text-center py-4">No actions available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProviderPortalShell>
  );
}

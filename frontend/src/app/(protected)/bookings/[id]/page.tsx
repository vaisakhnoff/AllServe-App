"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Loader2, ArrowLeft, MapPin, Calendar, Clock, CheckCircle2,
  XCircle, Edit3, CreditCard, FileText, IndianRupee,
  MessageSquare,
} from "lucide-react";
import toast from "react-hot-toast";
import { orderService } from "@/services/order";
import { quotationService } from "@/services/quotation";
import { invoiceService } from "@/services/invoice";
import { ServiceOrder, Quotation, Invoice } from "@/types/order.types";
import { getErrorMessage } from "@/utils/errorHandler";

const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string }> = {
  awaiting_provider_response: { label: "Waiting for provider", dot: "bg-amber-400", bg: "bg-amber-50 text-amber-700" },
  accepted: { label: "Accepted", dot: "bg-emerald-400", bg: "bg-emerald-50 text-emerald-700" },
  in_progress: { label: "In progress", dot: "bg-blue-500", bg: "bg-blue-50 text-blue-700" },
  work_completed: { label: "Work done — invoice pending", dot: "bg-violet-400", bg: "bg-violet-50 text-violet-700" },
  rejected_by_provider: { label: "Rejected", dot: "bg-red-400", bg: "bg-red-50 text-red-600" },
  provider_unresponsive: { label: "No response", dot: "bg-slate-400", bg: "bg-slate-100 text-slate-600" },
  awaiting_payment: { label: "Invoice ready", dot: "bg-blue-400", bg: "bg-blue-50 text-blue-700" },
  completed: { label: "Completed", dot: "bg-emerald-400", bg: "bg-emerald-50 text-emerald-700" },
  cancelled: { label: "Cancelled", dot: "bg-slate-300", bg: "bg-slate-100 text-slate-500" },
  cancelled_with_refund: { label: "Refunded", dot: "bg-slate-300", bg: "bg-slate-100 text-slate-500" },
  inspection_accepted: { label: "Inspection scheduled", dot: "bg-sky-400", bg: "bg-sky-50 text-sky-700" },
  inspection_completed: { label: "Inspection done — quote pending", dot: "bg-teal-400", bg: "bg-teal-50 text-teal-700" },
  quotation_submitted: { label: "Quote received", dot: "bg-indigo-400", bg: "bg-indigo-50 text-indigo-700" },
  quotation_accepted: { label: "Quote accepted", dot: "bg-emerald-400", bg: "bg-emerald-50 text-emerald-700" },
  dropped_by_provider: { label: "Dropped by provider", dot: "bg-red-300", bg: "bg-red-50 text-red-600" },
  dropped_by_customer: { label: "Dropped", dot: "bg-slate-300", bg: "bg-slate-100 text-slate-500" },
  awaiting_advance: { label: "Advance pending", dot: "bg-amber-400", bg: "bg-amber-50 text-amber-700" },
  awaiting_final_payment: { label: "Payment pending", dot: "bg-indigo-400", bg: "bg-indigo-50 text-indigo-700" },
  broadcast_open: { label: "Receiving quotes", dot: "bg-purple-400", bg: "bg-purple-50 text-purple-700" },
  receiving_quotations: { label: "Receiving quotes", dot: "bg-purple-400", bg: "bg-purple-50 text-purple-700" },
  expired: { label: "Expired", dot: "bg-slate-300", bg: "bg-slate-100 text-slate-500" },
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
        try { const qRes = await quotationService.getForOrder(id); setQuotations(qRes.data.data || []); } catch { setQuotations([]); }
      }
      try { const invRes = await invoiceService.getByOrder(id); setInvoice(invRes.data.data || null); } catch { setInvoice(null); }
    } catch (err) { toast.error(getErrorMessage(err) || "Failed to load booking"); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (id) loadData(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAcceptQuote = async (qId: string) => { setActionLoading(true); try { await quotationService.accept(qId); toast.success("Accepted!"); loadData(); } catch (e) { toast.error(getErrorMessage(e) || "Failed"); } finally { setActionLoading(false); } };
  const handleRejectQuote = async (qId: string) => { setActionLoading(true); try { await quotationService.reject(qId); toast.success("Rejected"); loadData(); } catch (e) { toast.error(getErrorMessage(e) || "Failed"); } finally { setActionLoading(false); } };
  const handleRequestMod = async (qId: string) => { if (!modComment.trim()) { toast.error("Describe changes needed"); return; } setActionLoading(true); try { await quotationService.requestModification(qId, modComment.trim()); toast.success("Requested"); setShowModForm(null); setModComment(""); loadData(); } catch (e) { toast.error(getErrorMessage(e) || "Failed"); } finally { setActionLoading(false); } };
  const handlePayOnline = async () => { if (!invoice) return; setActionLoading(true); try { await invoiceService.payOnline(invoice._id); toast.success("Paid!"); loadData(); } catch (e) { toast.error(getErrorMessage(e) || "Failed"); } finally { setActionLoading(false); } };

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-[var(--primary)]" size={28} /></div>;
  if (!order) return <div className="flex h-64 flex-col items-center justify-center"><p className="font-bold text-[var(--text-primary)]">Booking not found</p></div>;

  const statusCfg = STATUS_CONFIG[order.status] || { label: order.status, dot: "bg-slate-300", bg: "bg-slate-50 text-slate-600" };

  return (
    <div className="pb-12">
      <button onClick={() => router.push("/bookings")} className="group mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--primary)]">
        <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-0.5" /> Back to bookings
      </button>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Main */}
        <div className="space-y-5">
          {/* Order header */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[22px] border border-[var(--border)] bg-white p-6"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="min-w-0">
                <p className="text-[12px] font-bold text-[var(--primary)] tracking-wide">{order.orderId}</p>
                <h1 className="mt-1 text-xl font-[800] text-[var(--text-primary)] leading-tight">{order.title || order.description.slice(0, 80)}</h1>
              </div>
              <span className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold ${statusCfg.bg}`}>{statusCfg.label}</span>
            </div>
            <p className="text-[14px] leading-relaxed text-[var(--text-secondary)]">{order.description}</p>
            {order.intakeResponses && Object.keys(order.intakeResponses).length > 0 && (
              <div className="mt-4 rounded-2xl border border-purple-100 bg-purple-50/60 p-4">
                <p className="text-[12px] font-bold text-purple-800 mb-3">📋 Your Requirements</p>
                <dl className="space-y-2">
                  {Object.entries(order.intakeResponses).map(([key, val]) => (
                    <div key={key}>
                      <dt className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{key.replace(/_/g, " ")}</dt>
                      <dd className="text-[13px] text-slate-800">{val}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-4 text-[12px] text-[var(--text-muted)]">
              <span className="flex items-center gap-1"><MapPin size={12} /> {order.address.city}, {order.address.state}</span>
              {order.preferredDate && <span className="flex items-center gap-1"><Calendar size={12} /> {order.preferredDate} {order.preferredTime}</span>}
              <span className="flex items-center gap-1"><Clock size={12} /> {new Date(order.createdAt).toLocaleDateString("en-IN")}</span>
            </div>
          </motion.section>

          {/* Quotations */}
          {quotations.length > 0 && (
            <section className="rounded-[22px] border border-[var(--border)] bg-white p-6">
              <h2 className="flex items-center gap-2 text-[17px] font-[800] text-[var(--text-primary)] mb-5">
                <FileText size={17} className="text-[var(--primary)]" /> Quotations
                <span className="ml-auto text-[12px] font-semibold text-[var(--text-muted)]">{quotations.length} received</span>
              </h2>
              <div className="space-y-4">
                {quotations.map((q) => (
                  <div key={q._id} className={`rounded-2xl border p-5 ${q.status === "accepted" ? "border-emerald-200 bg-emerald-50/40" : q.status === "submitted" ? "border-blue-200 bg-blue-50/30" : "border-[var(--border)]"}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[14px] font-bold text-[var(--text-primary)]">
                          {typeof q.providerId === "object" ? (q.providerId.businessName || q.providerId.name) : "Provider"}
                        </span>
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${q.status === "accepted" ? "bg-emerald-100 text-emerald-700" : q.status === "submitted" ? "bg-blue-100 text-blue-700" : q.status === "rejected" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"}`}>
                          {q.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <span className="text-xl font-[800] text-[var(--text-primary)]">₹{q.totalAmount.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-3 text-[12px] text-[var(--text-muted)] mb-3">
                      <span>Labour: ₹{q.currentRevision.labourCharge.toLocaleString("en-IN")}</span>
                      <span>Material: ₹{q.currentRevision.materialCost.toLocaleString("en-IN")}</span>
                      <span>{q.currentRevision.estimatedDurationDays} days est.</span>
                    </div>
                    {q.currentRevision.notes && <p className="text-[12px] italic text-[var(--text-muted)] mb-3">&ldquo;{q.currentRevision.notes}&rdquo;</p>}
                    {q.status === "submitted" && (
                      <div className="flex flex-wrap gap-2 pt-3 border-t border-[var(--border-light)]">
                        <button onClick={() => handleAcceptQuote(q._id)} disabled={actionLoading} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-[12px] font-bold text-white disabled:opacity-50"><CheckCircle2 size={12} /> Accept</button>
                        <button onClick={() => handleRejectQuote(q._id)} disabled={actionLoading} className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-[12px] font-bold text-red-600 disabled:opacity-50"><XCircle size={12} /> Reject</button>
                        <button onClick={() => setShowModForm(showModForm === q._id ? null : q._id)} className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-[12px] font-bold text-amber-700"><Edit3 size={12} /> Request Changes</button>
                      </div>
                    )}
                    {showModForm === q._id && (
                      <div className="mt-3 pt-3 border-t border-[var(--border-light)]">
                        <textarea value={modComment} onChange={(e) => setModComment(e.target.value)} rows={2} className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5 text-sm outline-none resize-none focus:border-[var(--primary)] mb-2" placeholder="Describe what changes..." />
                        <div className="flex gap-2">
                          <button onClick={() => handleRequestMod(q._id)} disabled={actionLoading} className="rounded-full bg-[#141414] px-4 py-2 text-[12px] font-bold text-white">{actionLoading ? <Loader2 size={12} className="animate-spin" /> : <MessageSquare size={12} />} Send</button>
                          <button onClick={() => { setShowModForm(null); setModComment(""); }} className="rounded-full border border-[var(--border)] px-4 py-2 text-[12px] font-bold text-[var(--text-secondary)]">Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Invoice */}
          {invoice && (
            <section className="rounded-[22px] border border-[var(--border)] bg-white p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="flex items-center gap-2 text-[17px] font-[800] text-[var(--text-primary)]">
                  <IndianRupee size={17} className="text-[var(--primary)]" /> Invoice
                </h2>
                <span className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${invoice.paymentStatus === "pending" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                  {invoice.paymentStatus === "pending" ? "Payment Due" : "Paid"}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 mb-4">
                {[
                  { label: "Labour", value: invoice.labourCharge },
                  { label: "Material", value: invoice.materialCost },
                  { label: "Additional", value: invoice.additionalCharges },
                  { label: "Discount", value: -invoice.discount, green: true },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl bg-[var(--surface-3)] p-3.5">
                    <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase">{item.label}</p>
                    <p className={`mt-0.5 text-lg font-[800] ${item.green ? "text-emerald-600" : "text-[var(--text-primary)]"}`}>
                      {item.green ? "-" : ""}₹{Math.abs(item.value).toLocaleString("en-IN")}
                    </p>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl bg-[#141414] p-5 flex items-center justify-between text-white mb-4">
                <span className="text-[14px] font-bold">Total Amount</span>
                <span className="text-2xl font-[900]">₹{invoice.total.toLocaleString("en-IN")}</span>
              </div>
              {invoice.paymentStatus === "pending" ? (
                <button onClick={handlePayOnline} disabled={actionLoading} className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] py-3.5 text-[14px] font-bold text-white transition hover:opacity-90 disabled:opacity-50">
                  {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />} Pay ₹{invoice.total.toLocaleString("en-IN")}
                </button>
              ) : (
                <div className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <CheckCircle2 size={18} className="text-emerald-600" />
                  <span className="text-[13px] font-bold text-emerald-700">Paid via {invoice.settlementMethod === "cash" ? "cash" : "online"}</span>
                </div>
              )}
            </section>
          )}
        </div>

        {/* Sidebar — timeline + meta */}
        <aside className="space-y-5">
          {/* Timeline */}
          {order.statusHistory.length > 1 && (
            <section className="rounded-[22px] border border-[var(--border)] bg-white p-5">
              <h3 className="text-[14px] font-[800] text-[var(--text-primary)] mb-4">Timeline</h3>
              <div className="relative space-y-4 pl-5 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-[var(--border-light)] before:rounded-full">
                {order.statusHistory.slice(-6).reverse().map((entry, i) => (
                  <div key={i} className="relative">
                    <span className={`absolute -left-5 top-1 h-3 w-3 rounded-full ring-3 ring-white ${i === 0 ? "bg-[var(--primary)]" : "bg-[var(--border)]"}`} />
                    <p className="text-[13px] font-semibold text-[var(--text-primary)] capitalize">{entry.status.replace(/_/g, " ")}</p>
                    <p className="text-[11px] text-[var(--text-muted)]">{new Date(entry.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Quick info */}
          <section className="rounded-[22px] border border-[var(--border)] bg-white p-5 space-y-3.5">
            <h3 className="text-[14px] font-[800] text-[var(--text-primary)]">Details</h3>
            {[
              { icon: MapPin, label: "Location", value: `${order.address.street}, ${order.address.city}` },
              ...(order.preferredDate ? [{ icon: Calendar, label: "Date", value: `${order.preferredDate} ${order.preferredTime || ""}` }] : []),
              { icon: Clock, label: "Created", value: new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-3)]">
                  <item.icon size={14} className="text-[var(--primary)]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase">{item.label}</p>
                  <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate">{item.value}</p>
                </div>
              </div>
            ))}
          </section>
        </aside>
      </div>
    </div>
  );
}

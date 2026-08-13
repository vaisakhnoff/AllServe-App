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
    <div className="pb-12 max-w-5xl mx-auto">
      <button
        onClick={() => router.push("/bookings")}
        className="group mb-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-600 shadow-2xs hover:bg-slate-50 transition"
      >
        <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
        Back to bookings
      </button>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Main Content Area */}
        <div className="space-y-6">
          {/* Order Header Card */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-slate-100 bg-white p-6 shadow-2xs"
          >
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div className="min-w-0">
                <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                  {order.orderId}
                </span>
                <h1 className="mt-2 text-xl font-extrabold text-slate-900 leading-tight">
                  {order.title || order.description.slice(0, 80)}
                </h1>
              </div>
              <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold ${statusCfg.bg} flex items-center gap-1.5`}>
                <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                {statusCfg.label}
              </span>
            </div>
            
            <p className="text-sm leading-relaxed text-slate-600 border-t border-slate-50 pt-4">{order.description}</p>
            
            {order.intakeResponses && Object.keys(order.intakeResponses).length > 0 && (
              <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
                <h4 className="text-xs font-bold text-slate-900 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={13} className="text-[#00B761]" /> Custom Requirements
                </h4>
                <dl className="grid gap-3 sm:grid-cols-2">
                  {Object.entries(order.intakeResponses).map(([key, val]) => (
                    <div key={key} className="bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
                      <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{key.replace(/_/g, " ")}</dt>
                      <dd className="mt-1 text-sm font-semibold text-slate-800">{val}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
            
            <div className="mt-6 flex flex-wrap gap-4 text-xs font-medium text-slate-500 border-t border-slate-100 pt-4">
              <span className="flex items-center gap-1.5"><MapPin size={13} className="text-slate-400" /> {order.address.city}, {order.address.state}</span>
              {order.preferredDate && <span className="flex items-center gap-1.5"><Calendar size={13} className="text-slate-400" /> {order.preferredDate} {order.preferredTime}</span>}
              <span className="flex items-center gap-1.5"><Clock size={13} className="text-slate-400" /> {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
            </div>
          </motion.section>

          {/* Quotations Section */}
          {quotations.length > 0 && (
            <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-2xs">
              <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-900 mb-5">
                <FileText size={16} className="text-[#00B761]" /> Quotations
                <span className="ml-auto text-xs font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg">{quotations.length} received</span>
              </h2>
              <div className="space-y-4">
                {quotations.map((q) => (
                  <div key={q._id} className={`rounded-xl border p-5 transition-all ${q.status === "accepted" ? "border-emerald-200 bg-emerald-50/10" : q.status === "submitted" ? "border-blue-200 bg-blue-50/10" : "border-slate-100"}`}>
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 font-bold text-slate-600 text-sm">
                          {typeof q.providerId === "object" ? (q.providerId.businessName || q.providerId.name)?.[0]?.toUpperCase() : "P"}
                        </div>
                        <div>
                          <span className="block text-sm font-bold text-slate-900">
                            {typeof q.providerId === "object" ? (q.providerId.businessName || q.providerId.name) : "Provider"}
                          </span>
                          <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold mt-0.5 ${
                            q.status === "accepted" ? "bg-emerald-100 text-emerald-700" : q.status === "submitted" ? "bg-blue-100 text-blue-700" : q.status === "rejected" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"
                          }`}>
                            {q.status.replace(/_/g, " ")}
                          </span>
                        </div>
                      </div>
                      <span className="text-lg font-black text-slate-900">₹{q.totalAmount.toLocaleString("en-IN")}</span>
                    </div>

                    <div className="grid gap-3 grid-cols-3 text-xs bg-slate-50/50 p-3 rounded-lg border border-slate-100 mb-4 text-center">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Labour</p>
                        <p className="mt-0.5 font-bold text-slate-700">₹{q.currentRevision.labourCharge.toLocaleString("en-IN")}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Material</p>
                        <p className="mt-0.5 font-bold text-slate-700">₹{q.currentRevision.materialCost.toLocaleString("en-IN")}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Duration</p>
                        <p className="mt-0.5 font-bold text-slate-700">{q.currentRevision.estimatedDurationDays} Days</p>
                      </div>
                    </div>

                    {q.currentRevision.notes && (
                      <div className="relative pl-3 border-l-2 border-slate-200 text-xs italic text-slate-500 my-4 py-0.5">
                        &ldquo;{q.currentRevision.notes}&rdquo;
                      </div>
                    )}

                    {q.status === "submitted" && (
                      <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
                        <button
                          onClick={() => handleAcceptQuote(q._id)}
                          disabled={actionLoading}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[#00B761] hover:bg-[#009E52] px-4 py-2 text-xs font-bold text-white shadow-xs transition disabled:opacity-50 cursor-pointer"
                        >
                          <CheckCircle2 size={12} /> Accept
                        </button>
                        <button
                          onClick={() => handleRejectQuote(q._id)}
                          disabled={actionLoading}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 px-4 py-2 text-xs font-bold text-red-600 transition disabled:opacity-50 cursor-pointer"
                        >
                          <XCircle size={12} /> Reject
                        </button>
                        <button
                          onClick={() => setShowModForm(showModForm === q._id ? null : q._id)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 px-4 py-2 text-xs font-bold text-amber-700 transition cursor-pointer"
                        >
                          <Edit3 size={12} /> Request Changes
                        </button>
                      </div>
                    )}

                    {showModForm === q._id && (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <textarea
                          value={modComment}
                          onChange={(e) => setModComment(e.target.value)}
                          rows={2}
                          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs outline-none resize-none focus:border-[#00B761] focus:ring-1 focus:ring-[#00B761] transition mb-3"
                          placeholder="Describe the changes you want..."
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRequestMod(q._id)}
                            disabled={actionLoading}
                            className="rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-2 text-xs font-bold text-white transition flex items-center gap-1.5 cursor-pointer"
                          >
                            {actionLoading ? <Loader2 size={12} className="animate-spin" /> : <MessageSquare size={12} />}
                            Send Request
                          </button>
                          <button
                            onClick={() => { setShowModForm(null); setModComment(""); }}
                            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Invoice Section - Redesigned Stripe-like Digital Receipt */}
          {invoice && (
            <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-2xs">
              <div className="flex items-center justify-between mb-5">
                <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-900">
                  <IndianRupee size={16} className="text-[#00B761]" /> Invoice Receipt
                </h2>
                <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                  invoice.paymentStatus === "pending" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
                }`}>
                  {invoice.paymentStatus === "pending" ? "Payment Due" : "Paid"}
                </span>
              </div>

              {/* Receipt Body */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/30 p-5 font-sans">
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">Labour Charge</span>
                    <span className="text-slate-700 font-bold">₹{invoice.labourCharge.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">Material Cost</span>
                    <span className="text-slate-700 font-bold">₹{invoice.materialCost.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">Additional Charges</span>
                    <span className="text-slate-700 font-bold">₹{invoice.additionalCharges.toLocaleString("en-IN")}</span>
                  </div>
                  {invoice.discount > 0 && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-medium">Discount Applied</span>
                      <span className="text-emerald-600 font-bold">-₹{invoice.discount.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                </div>

                {/* Receipt Dashed Divider */}
                <div className="border-t border-dashed border-slate-200 my-4" />

                {/* Receipt Total */}
                <div className="flex justify-between items-center">
                  <div>
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Total Amount</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Inclusive of platform commission</span>
                  </div>
                  <span className="text-2xl font-black text-slate-900">₹{invoice.total.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Receipt Footer Action */}
              <div className="mt-5">
                {invoice.paymentStatus === "pending" ? (
                  <button
                    onClick={handlePayOnline}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#00B761] hover:bg-[#009E52] py-3 text-sm font-bold text-white transition-all shadow-md shadow-[#00B761]/10 hover:shadow-lg disabled:opacity-50 cursor-pointer"
                  >
                    {actionLoading ? <Loader2 size={15} className="animate-spin" /> : <CreditCard size={15} />}
                    Pay Online (₹{invoice.total.toLocaleString("en-IN")})
                  </button>
                ) : (
                  <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/30 p-3.5">
                    <CheckCircle2 size={16} className="text-[#00B761]" />
                    <span className="text-xs font-bold text-[#00B761]">
                      Paid via {invoice.settlementMethod === "cash" ? "Cash" : "Online Checkout"}
                    </span>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar Info & Timeline */}
        <aside className="space-y-6">
          {/* Order Details */}
          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Order Details</h3>
            <div className="space-y-4">
              {[
                { icon: MapPin, label: "Location", value: `${order.address.street ? order.address.street + ', ' : ''}${order.address.city}` },
                ...(order.preferredDate ? [{ icon: Calendar, label: "Preferred Date", value: `${order.preferredDate} ${order.preferredTime || ""}` }] : []),
                { icon: Clock, label: "Created Date", value: new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) },
              ].map((item, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500 border border-slate-100">
                    <item.icon size={13} className="text-[#00B761]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</p>
                    <p className="mt-0.5 text-xs font-bold text-slate-800 line-clamp-2">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Timeline History */}
          {order.statusHistory.length > 0 && (
            <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-2xs">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Activity Timeline</h3>
              <div className="relative space-y-5 pl-5 before:absolute before:left-[6px] before:top-2 before:bottom-2 before:w-[1.5px] before:bg-slate-100">
                {order.statusHistory.slice(-6).reverse().map((entry, i) => (
                  <div key={i} className="relative">
                    {i === 0 ? (
                      <span className="absolute -left-5 top-1 h-3.5 w-3.5 rounded-full bg-white ring-4 ring-[#E6F7F0] flex items-center justify-center">
                        <span className="h-2 w-2 rounded-full bg-[#00B761] animate-pulse" />
                      </span>
                    ) : (
                      <span className="absolute -left-5 top-1.5 h-2 w-2 rounded-full bg-slate-200 ring-4 ring-white" />
                    )}
                    <p className={`text-xs font-bold capitalize ${i === 0 ? "text-[#00B761]" : "text-slate-700"}`}>
                      {entry.status.replace(/_/g, " ")}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(entry.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

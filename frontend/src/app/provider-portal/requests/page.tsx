"use client";

import { useEffect, useState, useCallback } from "react";
import {
  MapPin, IndianRupee, Clock, Send, Filter,
  FileText, MessageSquare, TrendingUp, CheckCircle2, X,
} from "lucide-react";
import toast from "react-hot-toast";
import { ProviderPortalShell } from "@/components/provider/ProviderPortalShell";
import { serviceRequestService } from "@/services/serviceRequest";
import { orderService } from "@/services/order";
import { providerQuoteService } from "@/services/provider";
import { ServiceRequest, ProviderQuote } from "@/types/serviceRequest.types";
import { ServiceOrder } from "@/types/order.types";
import { getErrorMessage } from "@/utils/errorHandler";

const urgencyColors: Record<string, string> = {
  low: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

export default function ProviderRequestsPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [customOrders, setCustomOrders] = useState<ServiceOrder[]>([]);
  const [myQuotes, setMyQuotes] = useState<ProviderQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, accepted: 0, pending: 0, acceptanceRate: 0 });
  const [activeView, setActiveView] = useState<"browse" | "my-quotes">("browse");
  const [quoteModal, setQuoteModal] = useState<ServiceRequest | null>(null);
  const [quoteForm, setQuoteForm] = useState({ price: "", message: "", estimatedDuration: "", availabilityNote: "" });
  const [quoteErrors, setQuoteErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({ city: "" });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeView === "browse") {
        const [srRes, customRes] = await Promise.all([
          serviceRequestService.browse({ city: filters.city || undefined }),
          orderService.getBroadcastCustom(),
        ]);
        setRequests(srRes.data.data.items);
        setCustomOrders(customRes.data.data.items || []);
      } else {
        const res = await providerQuoteService.getMyQuotes();
        setMyQuotes(res.data.data.items);
      }
      const statsRes = await providerQuoteService.getStats();
      setStats(statsRes.data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [activeView, filters.city]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteModal) return;

    const errs: Record<string, string> = {};
    if (!quoteForm.price || Number(quoteForm.price) <= 0) errs.price = "Enter a valid price";
    if (!quoteForm.message.trim()) errs.message = "Message is required";
    else if (quoteForm.message.trim().length < 5) errs.message = "Message must be at least 5 characters";
    if (!quoteForm.estimatedDuration.trim()) errs.estimatedDuration = "Duration is required";
    setQuoteErrors(errs);
    if (Object.keys(errs).length > 0) { toast.error("Please fix the errors"); return; }

    setSubmitting(true);
    try {
      await providerQuoteService.submit({
        serviceRequestId: quoteModal._id,
        price: Number(quoteForm.price),
        message: quoteForm.message,
        estimatedDuration: quoteForm.estimatedDuration,
        availabilityNote: quoteForm.availabilityNote || undefined,
      });
      toast.success("Quote submitted successfully!");
      setQuoteModal(null);
      setQuoteForm({ price: "", message: "", estimatedDuration: "", availabilityNote: "" });
      setQuoteErrors({});
      fetchData();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async (quoteId: string) => {
    if (!confirm("Withdraw this quote?")) return;
    try {
      await providerQuoteService.withdraw(quoteId);
      toast.success("Quote withdrawn");
      fetchData();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <ProviderPortalShell>
      <div className="mb-8">
        <p className="text-sm font-bold text-indigo-600">Quote Marketplace</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">Service Requests</h1>
        <p className="mt-1 text-sm text-slate-500">Browse nearby requests and submit competitive quotes</p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Quotes Sent", value: stats.total, icon: Send, color: "text-indigo-600 bg-indigo-50" },
          { label: "Pending", value: stats.pending, icon: Clock, color: "text-amber-600 bg-amber-50" },
          { label: "Accepted", value: stats.accepted, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
          { label: "Win Rate", value: `${stats.acceptanceRate}%`, icon: TrendingUp, color: "text-purple-600 bg-purple-50" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="premium-card p-4">
              <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-xl ${s.color}`}>
                <Icon size={16} />
              </div>
              <p className="text-xl font-black">{s.value}</p>
              <p className="text-xs font-semibold text-slate-500">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* View Toggle */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
          <button
            onClick={() => setActiveView("browse")}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${activeView === "browse" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
          >
            Browse Requests
          </button>
          <button
            onClick={() => setActiveView("my-quotes")}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${activeView === "my-quotes" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
          >
            My Quotes
          </button>
        </div>

        {activeView === "browse" && (
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <input
              type="text"
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
              placeholder="Filter by city..."
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs w-36 focus:border-indigo-300 outline-none"
            />
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex h-48 items-center justify-center"><p className="animate-pulse text-sm font-semibold text-slate-500">Loading...</p></div>
      ) : activeView === "browse" ? (
        requests.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-slate-200 py-16 text-center">
            <FileText size={32} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-bold text-slate-700">No matching requests</p>
            <p className="mt-1 text-xs text-slate-500">New requests from customers in your area will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div key={req._id} className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-indigo-200 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${urgencyColors[req.urgency]}`}>
                        {req.urgency.toUpperCase()}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{req.title}</h3>
                    <p className="mt-1 text-sm text-slate-500 line-clamp-2">{req.description}</p>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-600">
                      <span className="flex items-center gap-1 font-semibold">
                        <IndianRupee size={12} />
                        {req.budgetType === "quote_needed" ? "Need Quote" : req.budgetMin ? `₹${req.budgetMin.toLocaleString()}${req.budgetMax ? ` – ₹${req.budgetMax.toLocaleString()}` : ""}` : "—"}
                      </span>
                      <span className="flex items-center gap-1"><MapPin size={12} /> {req.address.city}, {req.address.state}</span>
                      {req.preferredDate && <span className="flex items-center gap-1"><Clock size={12} /> {req.preferredDate}</span>}
                      <span className="flex items-center gap-1"><MessageSquare size={12} /> {req.quoteCount} quotes</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setQuoteModal(req)}
                    className="shrink-0 flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    <Send size={13} /> Quote
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        myQuotes.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-slate-200 py-16 text-center">
            <Send size={32} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-bold text-slate-700">No quotes submitted yet</p>
            <p className="mt-1 text-xs text-slate-500">Browse requests and submit your first quote</p>
          </div>
        ) : (
          <div className="space-y-4">
            {myQuotes.map((quote) => {
              const req = quote.serviceRequestId as any;
              const statusColors: Record<string, string> = {
                pending: "bg-amber-100 text-amber-700",
                accepted: "bg-emerald-100 text-emerald-700",
                rejected: "bg-red-100 text-red-700",
                withdrawn: "bg-slate-100 text-slate-600",
              };
              return (
                <div key={quote._id} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${statusColors[quote.status]}`}>
                          {quote.status.toUpperCase()}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{req?.title || "Service Request"}</h4>
                      {req?.address && <p className="text-xs text-slate-500 flex items-center gap-1 mt-1"><MapPin size={10} /> {req.address.city}</p>}
                      <div className="mt-2 flex gap-3 text-xs">
                        <span className="font-bold text-indigo-700">₹{quote.price.toLocaleString()}</span>
                        <span className="text-slate-500">{quote.estimatedDuration}</span>
                      </div>
                    </div>
                    {quote.status === "pending" && (
                      <button onClick={() => handleWithdraw(quote._id)} className="text-xs font-bold text-red-600 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-all">
                        Withdraw
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Quote Submission Modal */}
      {quoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black text-slate-900">Submit Quote</h3>
              <button onClick={() => setQuoteModal(null)} className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="mb-5 rounded-xl bg-slate-50 p-4">
              <p className="text-sm font-bold text-slate-900">{quoteModal.title}</p>
              <p className="mt-1 text-xs text-slate-500 line-clamp-2">{quoteModal.description}</p>
              <div className="mt-2 flex gap-3 text-xs text-slate-600">
                <span className="flex items-center gap-1"><IndianRupee size={11} />
                  {quoteModal.budgetType === "quote_needed" ? "Need Quote" : quoteModal.budgetMin ? `₹${quoteModal.budgetMin.toLocaleString()}` : "—"}
                </span>
                <span className="flex items-center gap-1"><MapPin size={11} /> {quoteModal.address.city}</span>
              </div>
            </div>

            <form onSubmit={handleSubmitQuote} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Your Price (₹) *</label>
                <input
                  type="number"
                  value={quoteForm.price}
                  onChange={(e) => { setQuoteForm({ ...quoteForm, price: e.target.value }); setQuoteErrors((p) => ({ ...p, price: "" })); }}
                  placeholder="e.g., 13500"
                  className={`w-full rounded-xl border ${quoteErrors.price ? "border-red-300 ring-2 ring-red-100" : "border-slate-200"} px-4 py-3 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none`}
                />
                {quoteErrors.price && <p className="mt-1 text-xs font-medium text-red-600">{quoteErrors.price}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Message *</label>
                <textarea
                  value={quoteForm.message}
                  onChange={(e) => { setQuoteForm({ ...quoteForm, message: e.target.value }); setQuoteErrors((p) => ({ ...p, message: "" })); }}
                  placeholder="Describe your approach, experience, and why you're the best fit..."
                  className={`w-full rounded-xl border ${quoteErrors.message ? "border-red-300 ring-2 ring-red-100" : "border-slate-200"} px-4 py-3 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none resize-none`}
                  rows={3}
                />
                {quoteErrors.message && <p className="mt-1 text-xs font-medium text-red-600">{quoteErrors.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Estimated Duration *</label>
                <input
                  type="text"
                  value={quoteForm.estimatedDuration}
                  onChange={(e) => { setQuoteForm({ ...quoteForm, estimatedDuration: e.target.value }); setQuoteErrors((p) => ({ ...p, estimatedDuration: "" })); }}
                  placeholder="e.g., 3 days"
                  className={`w-full rounded-xl border ${quoteErrors.estimatedDuration ? "border-red-300 ring-2 ring-red-100" : "border-slate-200"} px-4 py-3 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none`}
                />
                {quoteErrors.estimatedDuration && <p className="mt-1 text-xs font-medium text-red-600">{quoteErrors.estimatedDuration}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Availability Note</label>
                <input
                  type="text"
                  value={quoteForm.availabilityNote}
                  onChange={(e) => setQuoteForm({ ...quoteForm, availabilityNote: e.target.value })}
                  placeholder="e.g., Can start tomorrow"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {submitting ? "Submitting..." : <><Send size={14} /> Submit Quote</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </ProviderPortalShell>
  );
}

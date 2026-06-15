"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, MapPin, Calendar, Clock, IndianRupee, Star,
  CheckCircle2, XCircle, MessageSquare, User, Zap, AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { serviceRequestService } from "@/services/serviceRequest";
import { providerQuoteService } from "@/services/provider";
import { ServiceRequest, ProviderQuote } from "@/types/serviceRequest.types";
import { getErrorMessage } from "@/utils/errorHandler";

const statusTimeline = [
  { key: "open", label: "Posted" },
  { key: "receiving_quotes", label: "Receiving Quotes" },
  { key: "quote_selected", label: "Quote Selected" },
  { key: "booking_created", label: "Booking Created" },
  { key: "completed", label: "Completed" },
];

const statusIndex: Record<string, number> = { open: 0, receiving_quotes: 1, quote_selected: 2, booking_created: 3, completed: 4 };

export default function RequestDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [quotes, setQuotes] = useState<ProviderQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"price" | "rating" | "time">("price");

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [reqRes, quotesRes] = await Promise.all([
        serviceRequestService.getById(id as string),
        providerQuoteService.getForRequest(id as string),
      ]);
      setRequest(reqRes.data.data);
      setQuotes(quotesRes.data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (quoteId: string) => {
    if (!confirm("Accept this quote? A booking will be created and other quotes will be rejected.")) return;
    setAccepting(quoteId);
    try {
      await providerQuoteService.accept(quoteId);
      toast.success("Quote accepted! Booking created.");
      fetchData();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAccepting(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Cancel this request? This cannot be undone.")) return;
    try {
      await serviceRequestService.cancel(id as string);
      toast.success("Request cancelled");
      fetchData();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const sortedQuotes = [...quotes].sort((a, b) => {
    if (sortBy === "price") return a.price - b.price;
    if (sortBy === "rating") return ((b.providerId as any)?.rating || 0) - ((a.providerId as any)?.rating || 0);
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><p className="animate-pulse text-sm font-semibold text-slate-500">Loading...</p></div>;
  }

  if (!request) {
    return <div className="text-center py-16"><p className="text-slate-500">Request not found</p></div>;
  }

  const currentStep = statusIndex[request.status] ?? 0;
  const isCancelled = request.status === "cancelled" || request.status === "expired";

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <button onClick={() => router.back()} className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft size={16} /> Back to My Requests
      </button>

      {/* Request Info Card */}
      <div className="premium-card p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl font-black text-slate-900">{request.title}</h1>
            <p className="mt-1 text-sm text-slate-500">{request.categoryId?.name} → {request.subCategory}</p>
          </div>
          {!isCancelled && !["booking_created", "completed"].includes(request.status) && (
            <button onClick={handleCancel} className="text-xs font-bold text-red-600 hover:text-red-700 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-all">
              Cancel
            </button>
          )}
        </div>

        <p className="text-sm text-slate-700 leading-relaxed mb-4">{request.description}</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Budget</p>
            <p className="mt-1 text-sm font-bold text-slate-900 flex items-center gap-1">
              <IndianRupee size={12} />
              {request.budgetType === "quote_needed" ? "Need Quote" : request.budgetMin ? `${request.budgetMin.toLocaleString()}${request.budgetMax ? ` – ${request.budgetMax.toLocaleString()}` : ""}` : "—"}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Location</p>
            <p className="mt-1 text-sm font-bold text-slate-900 flex items-center gap-1"><MapPin size={12} /> {request.address.city}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Date</p>
            <p className="mt-1 text-sm font-bold text-slate-900 flex items-center gap-1"><Calendar size={12} /> {request.preferredDate || "Flexible"}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Urgency</p>
            <p className="mt-1 text-sm font-bold text-slate-900 capitalize flex items-center gap-1"><Zap size={12} /> {request.urgency}</p>
          </div>
        </div>
      </div>

      {/* Status Timeline */}
      {!isCancelled && (
        <div className="premium-card p-6 mb-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Request Timeline</h3>
          <div className="flex items-center gap-0">
            {statusTimeline.map((step, i) => (
              <div key={step.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    i <= currentStep ? "bg-purple-600 text-white" : "bg-slate-200 text-slate-500"
                  }`}>
                    {i < currentStep ? <CheckCircle2 size={16} /> : i + 1}
                  </div>
                  <p className={`mt-2 text-[10px] font-bold text-center ${i <= currentStep ? "text-purple-700" : "text-slate-400"}`}>{step.label}</p>
                </div>
                {i < statusTimeline.length - 1 && (
                  <div className={`h-0.5 flex-1 -mt-5 ${i < currentStep ? "bg-purple-500" : "bg-slate-200"}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {isCancelled && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-4">
          <XCircle size={20} className="text-red-600" />
          <p className="text-sm font-bold text-red-800">This request has been {request.status}</p>
        </div>
      )}

      {/* Quotes Section */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-black text-slate-900">
          Received Quotes <span className="text-purple-600">({quotes.length})</span>
        </h2>
        {quotes.length > 1 && (
          <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
            {(["price", "rating", "time"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={`rounded-lg px-3 py-1.5 text-[10px] font-bold transition-all ${
                  sortBy === s ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                }`}
              >
                {s === "price" ? "Price" : s === "rating" ? "Rating" : "Fastest"}
              </button>
            ))}
          </div>
        )}
      </div>

      {quotes.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 py-12 text-center">
          <Clock size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-bold text-slate-700">Waiting for quotes</p>
          <p className="mt-1 text-xs text-slate-500">Providers matching your request will send quotes soon</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedQuotes.map((quote) => {
            const provider = quote.providerId as any;
            const isAccepted = quote.status === "accepted";
            const isRejected = quote.status === "rejected";

            return (
              <div
                key={quote._id}
                className={`rounded-2xl border p-5 transition-all ${
                  isAccepted ? "border-emerald-300 bg-emerald-50/50 shadow-sm" :
                  isRejected ? "border-slate-200 bg-slate-50 opacity-60" :
                  "border-slate-200 bg-white hover:border-purple-200 hover:shadow-sm"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Provider Avatar */}
                  <div className="h-12 w-12 shrink-0 rounded-full bg-gradient-to-br from-slate-800 to-indigo-700 flex items-center justify-center text-white overflow-hidden">
                    {provider?.headshot ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={provider.headshot} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <User size={20} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-bold text-slate-900">{provider?.businessName || provider?.name}</h4>
                      {provider?.rating > 0 && (
                        <span className="flex items-center gap-0.5 text-xs font-bold text-amber-600">
                          <Star size={11} fill="currentColor" /> {provider.rating.toFixed(1)}
                        </span>
                      )}
                      {isAccepted && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Accepted</span>}
                      {isRejected && <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">Rejected</span>}
                    </div>
                    {provider?.city && <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={10} /> {provider.city}</p>}

                    <p className="mt-2 text-sm text-slate-700">{quote.message}</p>

                    <div className="mt-3 flex flex-wrap gap-3">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700">
                        <IndianRupee size={11} /> ₹{quote.price.toLocaleString()}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                        <Clock size={11} /> {quote.estimatedDuration}
                      </span>
                      {quote.availabilityNote && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
                          <AlertCircle size={11} /> {quote.availabilityNote}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {quote.status === "pending" && !isCancelled && !["booking_created", "completed"].includes(request.status) && (
                    <div className="flex flex-col gap-2 shrink-0">
                      <button
                        onClick={() => handleAccept(quote._id)}
                        disabled={accepting === quote._id}
                        className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle2 size={13} /> {accepting === quote._id ? "..." : "Accept"}
                      </button>
                      <Link
                        href={`/messages?provider=${provider?._id}`}
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <MessageSquare size={13} /> Message
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

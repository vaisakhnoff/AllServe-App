"use client";

import {  useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  ArrowLeft, Star, BadgeCheck, MapPin, Loader2, MessageSquarePlus,
   ArrowUpRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { RootState } from "@/store";
import { providerService } from "@/services/provider";
import { messagingService } from "@/services/messaging";
import { PublicProviderDetails } from "@/types/provider.types";
import { getErrorMessage } from "@/utils/errorHandler";
import { Role } from "@/enums/role.enum";
import { LoginRequiredPrompt } from "@/components/auth/LoginRequiredPrompt";
import { useProviderStatus } from "@/hooks/useProviderStatus";
import { UserShell } from "@/components/layout/UserShell";

export default function ProviderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id ?? "";
  const { user, isAuthenticated, isInitialized, role } = useSelector((state: RootState) => state.auth);
 

  const [provider, setProvider] = useState<PublicProviderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSubCategory, setActiveSubCategory] = useState<string | null>(null);

  // Real-time provider status via WebSocket
  const liveStatus = useProviderStatus(
    provider?.id ?? null,
    { onlineStatus: provider?.onlineStatus, engagementStatus: provider?.engagementStatus }
  );


  useEffect(() => {
    if (!id) return;
    let c = false;
    setLoading(true);
    providerService.getPublicProviderById(id)
      .then((res) => { if (!c) setProvider(res.data.data); })
      .catch((err) => { if (!c) toast.error(getErrorMessage(err) || "Failed to load provider"); })
      .finally(() => { if (!c) setLoading(false); });
    return () => { c = true; };
  }, [id]);


const filteredServices = useMemo(() => {
  if (!provider) return [];
  if (!activeSubCategory) return provider.services;
  return provider.services.filter((s) => s.subCategory === activeSubCategory);
}, [provider, activeSubCategory]);

  const startConversation = async () => {
    if (!user || !provider || !isAuthenticated) { router.push(`/login?redirect=/providers/${id}`); return; }
    try {
      await messagingService.getOrCreateConversation({ providerId: provider.id });
      router.push("/messages");
    } catch { toast.error("Failed to start conversation"); }
  };

  
  

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 size={28} className="animate-spin text-[var(--primary)]" /></div>;
  }

  if (!provider) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <p className="text-lg font-bold text-[var(--text-primary)]">Provider not found</p>
        <Link href="/providers" className="mt-3 text-sm font-semibold text-[var(--primary)] hover:underline">Back to providers</Link>
      </div>
    );
  }

  return (
    <UserShell>
    <div className="pb-12">
      {/* Breadcrumb */}
      <button onClick={() => router.back()} className="group mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--primary)]">
        <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-0.5" /> Back
      </button>

      <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
        {/* LEFT — Sticky profile card */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-white shadow-[var(--shadow-card)]"
          >
            {/* Avatar region */}
            <div className="relative bg-gradient-to-br from-[#141414] to-[#2d2d2d] px-6 pb-14 pt-8 text-center text-white">
              <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-[var(--primary)]/20 blur-[60px]" />
              <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-full border-4 border-white/20 shadow-xl">
                {provider.profileImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={provider.profileImage} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[var(--primary)] text-3xl font-[900]">{provider.name[0]}</div>
                )}
              </div>
              <h1 className="mt-4 truncate text-xl font-[800] tracking-tight">{provider.businessName ?? provider.name}</h1>
              <div className="mt-2 flex items-center justify-center gap-3 text-[13px] text-white/60">
                <span className="flex items-center gap-1"><BadgeCheck size={13} /> Verified</span>
                <span className="flex items-center gap-1"><Star size={12} fill="#fbbf24" strokeWidth={0} /> {provider.rating || "New"}</span>
              </div>
              {provider.category && (
                <span className="mt-3 inline-block rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold backdrop-blur-sm">{provider.category.name}</span>
              )}
              {/* Online / Availability status */}
              {liveStatus.onlineStatus && (
                <div className="mt-3 flex items-center justify-center">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold backdrop-blur-sm ${
                    liveStatus.onlineStatus === "online"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-white/10 text-white/50"
                  }`}>
                    <span className={`h-2 w-2 rounded-full ${
                      liveStatus.onlineStatus === "online" ? "bg-emerald-400 animate-pulse" : "bg-white/40"
                    }`} />
                    {liveStatus.onlineStatus === "online"
                      ? (liveStatus.engagementStatus === "busy" ? "Online · Busy" : "Online · Available")
                      : "Offline"}
                  </span>
                </div>
              )}
            </div>

            {/* Stats + actions */}
            <div className="relative -mt-6 rounded-t-[24px] bg-white px-6 pt-8 pb-6 space-y-5">
              {/* Pricing */}
              <div className="rounded-2xl bg-[var(--surface-3)] p-4 text-center">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Starting from</p>
                <p className="mt-1 text-[1.75rem] font-[900] tracking-tight text-[var(--text-primary)]">
                  {provider.price !== null ? `₹${provider.price.toFixed(0)}` : "On request"}
                </p>
              </div>

              {/* Service areas */}
              {provider.serviceAreas && provider.serviceAreas.length > 0 && (
                <div className="flex items-start gap-2.5">
                  <MapPin size={15} className="mt-0.5 shrink-0 text-[var(--primary)]" />
                  <p className="text-[13px] leading-relaxed text-[var(--text-secondary)]">{provider.serviceAreas.join(", ")}</p>
                </div>
              )}

              {/* CTA */}
              <button
                onClick={startConversation}
                className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#141414] py-3.5 text-[14px] font-bold text-white transition hover:bg-black"
              >
                <MessageSquarePlus size={16} /> Message
              </button>
            </div>
          </motion.div>
        </aside>

        {/* RIGHT — Scrollable content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="space-y-6"
        >
          {/* About */}
          <section className="rounded-[22px] border border-[var(--border)] bg-white p-6">
            <h2 className="text-[17px] font-[800] text-[var(--text-primary)]">About</h2>
            {provider.description ? (
              <p className="mt-3 text-[14px] leading-[1.8] text-[var(--text-secondary)]">{provider.description}</p>
            ) : (
              <p className="mt-3 text-sm italic text-[var(--text-muted)]">No description provided.</p>
            )}
          </section>

      

          {/* Sub-categories */}
         {/* Services — table style */}

{/* Offline/Busy banner */}
{(liveStatus.onlineStatus === "offline" || liveStatus.engagementStatus === "busy") && filteredServices.length > 0 && (
  <div className="rounded-[16px] border border-amber-200 bg-amber-50 px-5 py-3 flex items-center gap-3">
    <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shrink-0" />
    <p className="text-[13px] font-semibold text-amber-800">
      {liveStatus.onlineStatus === "offline"
        ? "This provider is currently offline. Services cannot be booked right now."
        : "This provider is currently busy. Services cannot be booked right now."}
    </p>
  </div>
)}

{filteredServices.length > 0 && (
  <section className="rounded-[22px] border border-[var(--border)] bg-white p-6 space-y-4">
    <div className="flex items-center justify-between">
      <h2 className="text-[17px] font-[800] text-[var(--text-primary)]">Services</h2>
      <span className="text-[12px] font-bold text-[#00B761] bg-[#E6F7F0] px-3 py-1 rounded-full">
        {filteredServices.length} available
      </span>
    </div>

    {/* Services Grid (Cards) */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {filteredServices.map((s) => {
        const isUnavailable = liveStatus.onlineStatus === "offline" || liveStatus.engagementStatus === "busy";

        if (isUnavailable) {
          return (
            <div
              key={s.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/70 p-4.5 opacity-60 cursor-not-allowed"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-800 truncate">{s.name}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-600 shrink-0">
                    {liveStatus.onlineStatus === "offline" ? "Offline" : "Busy"}
                  </span>
                </div>
                {s.description && (
                  <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {s.description}
                  </p>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-200/80 pt-3">
                <span className="text-base font-extrabold text-slate-800">
                  &#8377;{s.price.toFixed(0)}
                </span>
                <span className="text-xs font-semibold text-slate-400">Unavailable</span>
              </div>
            </div>
          );
        }

        return (
          <Link
            key={s.id}
            href={`/services/${s.id}`}
            className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4.5 shadow-sm transition-all duration-200 hover:border-[#00B761] hover:shadow-md hover:-translate-y-0.5"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#00B761] transition-colors truncate">
                  {s.name}
                </h3>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E6F7F0] text-[#00B761] transition-transform group-hover:scale-110 group-hover:rotate-[-45deg] shrink-0">
                  <ArrowUpRight size={13} />
                </span>
              </div>
              {s.description && (
                <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {s.description}
                </p>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Price</span>
                <span className="text-base font-extrabold text-slate-900">
                  &#8377;{s.price.toFixed(0)}
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-[#00B761] bg-[#E6F7F0] group-hover:bg-[#00B761] group-hover:text-white px-3 py-1.5 rounded-xl transition-all shadow-sm">
                Book Service
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  </section>
)}

{/* Empty state when filter yields nothing */}
{activeSubCategory && filteredServices.length === 0 && (
  <section className="rounded-[22px] border border-dashed border-[var(--border)] bg-white p-8 text-center">
    <p className="font-semibold text-[var(--text-secondary)]">No services in &ldquo;{activeSubCategory}&rdquo;</p>
    <button
      onClick={() => setActiveSubCategory(null)}
      className="mt-2 text-sm font-semibold text-[var(--primary)] hover:underline"
    >
      Show all services
    </button>
  </section>
)}


        
         
        </motion.div>
      </div>
    </div>
    </UserShell>
  );
}

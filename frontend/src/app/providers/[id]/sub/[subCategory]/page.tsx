"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import {
  ArrowLeft, Loader2, Clock, ChevronRight, Image as ImageIcon, Tag,
} from "lucide-react";
import toast from "react-hot-toast";
import { serviceService } from "@/services/service";
import { providerService } from "@/services/provider";
import { Service } from "@/types/service.types";
import { PublicProviderDetails } from "@/types/provider.types";
import { getErrorMessage } from "@/utils/errorHandler";
import { RootState } from "@/store";
import { useProviderStatus } from "@/hooks/useProviderStatus";
import { UserShell } from "@/components/layout/UserShell";

export default function ProviderSubcategoryPage() {
  const params = useParams<{ id: string; subCategory: string }>();
  const router = useRouter();

  const id = params?.id ?? "";
  const subCategory = params?.subCategory ? decodeURIComponent(params.subCategory) : "";
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const [provider, setProvider] = useState<PublicProviderDetails | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // Real-time provider status via WebSocket
  const liveStatus = useProviderStatus(
    provider?.id ?? null,
    { onlineStatus: provider?.onlineStatus, engagementStatus: provider?.engagementStatus }
  );
  const isUnavailable = liveStatus.onlineStatus === "offline" || liveStatus.engagementStatus === "busy";

  useEffect(() => {
    if (!id || !subCategory) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      providerService.getPublicProviderById(id),
      serviceService.publicList({ providerId: id, subCategory, limit: 50 }),
    ])
      .then(([pRes, sRes]) => {
        if (cancelled) return;
        setProvider(pRes.data.data);
        setServices(sRes.data.data.items);
      })
      .catch((err) => {
        if (!cancelled) toast.error(getErrorMessage(err) || "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, subCategory]);

  return (
    <UserShell>
      <div className="pb-12 max-w-5xl mx-auto">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-6">
          <Link href={isAuthenticated ? "/dashboard" : "/"} className="hover:text-slate-700">Home</Link>
          <ChevronRight size={12} />
          <Link href="/providers" className="hover:text-slate-700">Providers</Link>
          <ChevronRight size={12} />
          <Link href={`/providers/${id}`} className="hover:text-slate-700">{provider?.businessName ?? provider?.name ?? "Provider"}</Link>
          <ChevronRight size={12} />
          <span className="text-slate-900 font-bold">{subCategory}</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={26} className="animate-spin text-[#00B761]" />
          </div>
        ) : (
          <>
            <header className="mb-5">
              <h1 className="text-xl font-extrabold text-slate-900 leading-tight">{subCategory}</h1>
              <p className="mt-1 text-xs text-slate-500">
                Services from <span className="font-semibold text-slate-800">{provider?.businessName ?? provider?.name ?? "this provider"}</span>
                {liveStatus.onlineStatus && (
                  <span className={`ml-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    liveStatus.onlineStatus === "online"
                      ? liveStatus.engagementStatus === "busy"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      liveStatus.onlineStatus === "online"
                        ? liveStatus.engagementStatus === "busy"
                          ? "bg-amber-500"
                          : "bg-emerald-500 animate-pulse"
                        : "bg-slate-400"
                    }`} />
                    {liveStatus.onlineStatus === "online"
                      ? (liveStatus.engagementStatus === "busy" ? "Busy" : "Available")
                      : "Offline"}
                  </span>
                )}
              </p>
            </header>

            {/* Unavailable banner */}
            {isUnavailable && services.length > 0 && (
              <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />
                <p className="text-xs font-semibold text-amber-800">
                  {liveStatus.onlineStatus === "offline"
                    ? "This provider is currently offline. Services cannot be booked right now."
                    : "This provider is currently busy. Services cannot be booked right now."}
                </p>
              </div>
            )}

            {services.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
                <Tag size={32} className="mx-auto text-slate-300" />
                <p className="mt-3 font-bold text-slate-600 text-xs">
                  This provider does not have any services in &ldquo;{subCategory}&rdquo; right now.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {services.map((svc) =>
                  isUnavailable ? (
                    <div
                      key={svc.id}
                      className="flex overflow-hidden rounded-2xl border border-slate-200 bg-white opacity-60 cursor-not-allowed"
                    >
                      <div className="relative h-32 w-32 shrink-0 bg-slate-100 sm:h-36 sm:w-36">
                        {svc.images.length > 0 ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={svc.images[0]} alt={svc.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-300">
                            <ImageIcon size={24} />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col p-4">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-xs font-bold text-slate-900 line-clamp-1">{svc.name}</h3>
                          <p className="shrink-0 text-sm font-black text-slate-900">&#8377;{svc.price.toFixed(0)}</p>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-500">{svc.description}</p>
                        <div className="mt-auto flex items-center justify-between gap-3 pt-3 text-[10px] font-bold text-slate-400">
                          <span className="inline-flex items-center gap-1">
                            <Clock size={11} /> {svc.duration} min
                          </span>
                          <span className="text-[10px]">
                            {liveStatus.onlineStatus === "offline" ? "Offline" : "Busy"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Link
                      key={svc.id}
                      href={`/services/${svc.id}`}
                      className="group flex overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-[#00B761] hover:shadow-xs"
                    >
                      <div className="relative h-32 w-32 shrink-0 bg-slate-100 sm:h-36 sm:w-36">
                        {svc.images.length > 0 ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={svc.images[0]} alt={svc.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-300">
                            <ImageIcon size={24} />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col p-4">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-xs font-bold text-slate-900 group-hover:text-[#00B761] transition-colors line-clamp-1">{svc.name}</h3>
                          <p className="shrink-0 text-sm font-black text-slate-900">&#8377;{svc.price.toFixed(0)}</p>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-500">{svc.description}</p>
                        <div className="mt-auto flex items-center justify-between gap-3 pt-3 text-[10px] font-bold text-slate-400">
                          <span className="inline-flex items-center gap-1">
                            <Clock size={11} /> {svc.duration} min
                          </span>
                          <span className="inline-flex items-center gap-1 text-[#00B761] group-hover:translate-x-0.5 transition">
                            View <ChevronRight size={11} />
                          </span>
                        </div>
                      </div>
                    </Link>
                  )
                )}
              </div>
            )}
          </>
        )}
      </div>
    </UserShell>
  );
}

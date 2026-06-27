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
import { Role } from "@/enums/role.enum";
import { LoginRequiredPrompt } from "@/components/auth/LoginRequiredPrompt";

export default function ProviderSubcategoryPage() {
  const params = useParams<{ id: string; subCategory: string }>();
  const router = useRouter();

  const id = params?.id ?? "";
  const subCategory = params?.subCategory ? decodeURIComponent(params.subCategory) : "";
  const { isAuthenticated, isInitialized, role } = useSelector((state: RootState) => state.auth);
  const canViewDetails = isInitialized && isAuthenticated && role === Role.USER;

  const [provider, setProvider] = useState<PublicProviderDetails | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !subCategory || !canViewDetails) return;
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
  }, [id, subCategory, canViewDetails]);

  if (isInitialized && !canViewDetails) {
    return (
      <LoginRequiredPrompt
        title="Login to view provider services"
        message="Please login or sign up to browse this provider's services."
      />
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6">
        <button
          onClick={() => router.back()}
          className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-indigo-600"
        >
          <ArrowLeft size={14} /> Back
        </button>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={26} className="animate-spin text-indigo-500" />
          </div>
        ) : (
          <>
            <header className="mb-5">
              <h1 className="text-2xl font-black text-slate-950">{subCategory}</h1>
              <p className="mt-1 text-sm text-slate-500">
                Services from <span className="font-semibold">{provider?.businessName ?? provider?.name ?? "this provider"}</span>
                {provider?.onlineStatus && (
                  <span className={`ml-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    provider.onlineStatus === "online"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      provider.onlineStatus === "online" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                    }`} />
                    {provider.onlineStatus === "online"
                      ? (provider.engagementStatus === "busy" ? "Busy" : "Available")
                      : "Offline"}
                  </span>
                )}
              </p>
            </header>

            {services.length === 0 ? (
              <div className="rounded-[18px] border border-dashed border-slate-300 bg-white p-10 text-center">
                <Tag size={32} className="mx-auto text-slate-300" />
                <p className="mt-4 font-bold text-slate-600">
                  This provider does not have any services in {subCategory} right now.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {services.map((svc) => (
                  <Link
                    key={svc.id}
                    href={`/services/${svc.id}`}
                    className="group flex overflow-hidden rounded-[18px] border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
                  >
                    <div className="relative h-32 w-32 shrink-0 bg-slate-100 sm:h-40 sm:w-40">
                      {svc.images.length > 0 ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={svc.images[0]} alt={svc.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-300">
                          <ImageIcon size={28} />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-base font-black text-slate-950 line-clamp-1">{svc.name}</h3>
                        <p className="shrink-0 text-base font-black text-slate-900">₹{svc.price.toFixed(0)}</p>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm text-slate-500">{svc.description}</p>
                      <div className="mt-auto flex items-center justify-between gap-3 pt-3 text-xs font-semibold text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Clock size={12} /> {svc.duration} min
                        </span>
                        <span className="inline-flex items-center gap-1 text-indigo-600 group-hover:translate-x-0.5 transition">
                          View <ChevronRight size={12} />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

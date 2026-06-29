"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Loader2, ArrowLeft, ImagePlus, Trash2, CheckCircle2,
  ChevronRight, Home,
} from "lucide-react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { serviceService } from "@/services/service";
import { orderService } from "@/services/order";
import { userService } from "@/services/user";
import { Service } from "@/types/service.types";
import { Address } from "@/types/user.types";
import { getErrorMessage } from "@/utils/errorHandler";
import { LoginRequiredPrompt } from "@/components/auth/LoginRequiredPrompt";
import { Role } from "@/enums/role.enum";
import { AddressContactStep } from "@/components/booking/AddressContactStep";

export default function RequestInspectionPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, isInitialized, role } = useSelector((s: RootState) => s.auth);
  const canAccess = isInitialized && isAuthenticated && role === Role.USER;

  const serviceId = searchParams?.get("serviceId") || "";
  const providerId = searchParams?.get("providerId") || "";

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [contactPhone, setContactPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [addressError, setAddressError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState("");

  useEffect(() => {
    if (!serviceId || !canAccess) return;
    Promise.all([
      serviceService.publicGet(serviceId),
      userService.getProfile(),
    ]).then(([sRes, uRes]) => {
      setService(sRes.data.data);
      const addrs = uRes.data.data.addresses || [];
      setAddresses(addrs);
      setSelectedAddress(addrs.find((a) => a.isDefault) || addrs[0] || null);
      if (uRes.data.data.phone) setContactPhone(uRes.data.data.phone.replace(/^\+91/, "").replace(/\D/g, "").slice(0, 10));
    }).catch(() => toast.error("Failed to load data"))
      .finally(() => setLoading(false));
  }, [serviceId, canAccess]);

  const handleSubmit = async () => {
    let valid = true;
    if (description.trim().length < 10) {
      toast.error("Description must be at least 10 characters");
      valid = false;
    }
    if (!selectedAddress) {
      setAddressError("Please select a service address");
      valid = false;
    } else {
      setAddressError("");
    }
    const phone = contactPhone.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setPhoneError("Enter a valid 10-digit Indian mobile number");
      valid = false;
    } else {
      setPhoneError("");
    }
    if (!valid || !selectedAddress) return;

    setSubmitting(true);
    try {
      const res = await orderService.createInspection({
        serviceId,
        providerId,
        description: description.trim(),
        address: {
          street: selectedAddress.street,
          city: selectedAddress.city,
          state: selectedAddress.state,
          zip: selectedAddress.zip,
          country: selectedAddress.country,
        },
        contactPhone: phone,
        images,
      });
      setOrderId(res.data.data.orderId);
      setSuccess(true);
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleImage = async (files: FileList | null) => {
    if (!files || images.length >= 10) return;
    const file = files[0];
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }
    const reader = new FileReader();
    reader.onload = () => setImages((p) => [...p, reader.result as string]);
    reader.readAsDataURL(file);
  };

  if (isInitialized && !canAccess) return <LoginRequiredPrompt title="Login required" message="Sign in to request an inspection." />;
  if (loading) return <main className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={32} /></main>;

  if (success) {
    return (
      <main className="min-h-screen bg-[var(--surface-2)] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl border border-slate-100">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
            <Home size={36} className="text-blue-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-950">Inspection Requested!</h1>
          <p className="mt-2 text-sm text-slate-500">
            The provider will contact you to schedule an inspection visit. You&apos;ll receive a detailed quotation after they assess the work.
          </p>
          <div className="mt-5 rounded-xl bg-slate-50 border border-slate-100 p-4">
            <p className="text-xs text-slate-500">Order ID</p>
            <p className="text-lg font-black text-indigo-600">{orderId}</p>
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={() => router.push("/dashboard")} className="btn btn-ghost flex-1 py-3 text-sm">Home</button>
            <button onClick={() => router.push("/bookings")} className="btn btn-primary flex-1 py-3 text-sm">My Bookings</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--surface-2)]">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <button onClick={() => router.back()} className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-indigo-600">
          <ArrowLeft size={14} /> Back
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">🏠 Inspection Required</span>
          </div>
          <h1 className="text-2xl font-black text-slate-950">Request Inspection</h1>
          <p className="text-sm text-slate-500 mt-1">
            {service?.name} — The provider will visit to assess and quote
          </p>
        </div>

        {/* Info banner */}
        <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 mb-6 flex items-start gap-3">
          <Home size={18} className="text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-800 leading-relaxed">
            <p className="font-bold mb-1">How it works:</p>
            <ol className="list-decimal pl-4 space-y-0.5">
              <li>You submit this inspection request</li>
              <li>Provider contacts you to schedule a visit</li>
              <li>Provider inspects and sends a detailed quotation</li>
              <li>You review, accept, or request changes to the quote</li>
              <li>Work begins after your approval</li>
            </ol>
          </div>
        </div>

        {/* Description */}
        <section className="premium-card p-5 mb-5">
          <h3 className="text-sm font-black text-slate-900 mb-3">Describe the work needed *</h3>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            maxLength={3000}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none resize-none focus:border-indigo-400"
            placeholder="Describe the project in detail — dimensions, materials preferred, current condition, any specific requirements..."
          />
          <p className="mt-1 text-right text-xs text-slate-400">{description.length}/3000</p>

          {/* Images */}
          <div className="mt-3">
            <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-indigo-600">
              <ImagePlus size={14} /> Add reference photos ({images.length}/10)
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImage(e.target.files)} />
            </label>
            {images.length > 0 && (
              <div className="mt-2 flex gap-2 overflow-x-auto">
                {images.map((img, i) => (
                  <div key={i} className="relative h-16 w-16 shrink-0 rounded-lg overflow-hidden border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="" className="h-full w-full object-cover" />
                    <button onClick={() => setImages((p) => p.filter((_, idx) => idx !== i))} className="absolute top-0 right-0 rounded-full bg-white/90 p-0.5 text-red-500"><Trash2 size={10} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Address + Contact */}
        <AddressContactStep
          addresses={addresses}
          selectedAddress={selectedAddress}
          onSelectAddress={(a) => { setSelectedAddress(a); setAddressError(""); }}
          contactPhone={contactPhone}
          onPhoneChange={(v) => { setContactPhone(v); setPhoneError(""); }}
          phoneError={phoneError}
          addressError={addressError}
          onAddressAdded={(addr) => setAddresses((prev) => [...prev, addr])}
          accentColor="blue"
        />

        {/* Fee info */}
        {service && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 mb-6 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">Inspection fee</span>
            <span className="text-lg font-black text-indigo-600">
              {service.freeInspection ? "Free" : `₹${service.inspectionFee}`}
            </span>
          </div>
        )}

        <button onClick={handleSubmit} disabled={submitting} className="btn btn-primary w-full py-4 text-base">
          {submitting ? <Loader2 size={18} className="animate-spin" /> : <ChevronRight size={18} />}
          Request Inspection Visit
        </button>
      </div>
    </main>
  );
}

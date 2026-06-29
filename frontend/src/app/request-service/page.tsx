"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Zap, Calendar, Clock, Loader2, CheckCircle2, ArrowLeft,
  ImagePlus, Trash2, ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { serviceService } from "@/services/service";
import { providerScheduleService } from "@/services/providerSchedule";
import { orderService } from "@/services/order";
import { userService } from "@/services/user";
import { Service } from "@/types/service.types";
import { TimeWindow } from "@/types/providerSchedule.types";
import { Address } from "@/types/user.types";
import { getErrorMessage } from "@/utils/errorHandler";
import { LoginRequiredPrompt } from "@/components/auth/LoginRequiredPrompt";
import { Role } from "@/enums/role.enum";
import { AddressContactStep } from "@/components/booking/AddressContactStep";

type RequestMode = "instant" | "scheduled";

export default function RequestServicePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, isInitialized, role } = useSelector((s: RootState) => s.auth);
  const canAccess = isInitialized && isAuthenticated && role === Role.USER;

  const serviceId = searchParams?.get("serviceId") || "";
  const providerId = searchParams?.get("providerId") || "";

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<RequestMode>("instant");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);

  // Scheduled fields
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [windows, setWindows] = useState<TimeWindow[]>([]);
  const [windowsLoading, setWindowsLoading] = useState(false);

  // Address
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [contactPhone, setContactPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [addressError, setAddressError] = useState("");

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState("");

  // Dates for scheduled mode
  const next14Days = useMemo(() => {
    const days: string[] = [];
    const d = new Date();
    d.setDate(d.getDate() + 1); // Start from tomorrow
    for (let i = 0; i < 14; i++) {
      days.push(d.toISOString().slice(0, 10));
      d.setDate(d.getDate() + 1);
    }
    return days;
  }, []);

  // Load service
  useEffect(() => {
    if (!serviceId || !canAccess) return;
    serviceService.publicGet(serviceId)
      .then((r) => setService(r.data.data))
      .catch(() => toast.error("Failed to load service"))
      .finally(() => setLoading(false));
  }, [serviceId, canAccess]);

  // Load addresses
  useEffect(() => {
    if (!canAccess) return;
    userService.getProfile()
      .then((r) => {
        const addrs = r.data.data.addresses || [];
        setAddresses(addrs);
        setSelectedAddress(addrs.find((a) => a.isDefault) || addrs[0] || null);
        // Pre-fill phone if user has one saved
        if (r.data.data.phone) setContactPhone(r.data.data.phone.replace(/^\+91/, "").replace(/\D/g, "").slice(0, 10));
      })
      .catch(() => {});
  }, [canAccess]);

  // Load available windows when date changes
  useEffect(() => {
    if (!selectedDate || !providerId || mode !== "scheduled") return;
    setWindowsLoading(true);
    setSelectedTime("");
    providerScheduleService.getAvailableWindows(providerId, selectedDate, serviceId || undefined)
      .then((r) => setWindows(r.data.data?.windows || []))
      .catch(() => setWindows([]))
      .finally(() => setWindowsLoading(false));
  }, [selectedDate, providerId, serviceId, mode]);

  const handleSubmit = async () => {
    let valid = true;

    if (!description.trim() || description.trim().length < 5) {
      toast.error("Please describe the work needed (min 5 characters)");
      valid = false;
    }
    if (mode === "scheduled" && (!selectedDate || !selectedTime)) {
      toast.error("Please select a date and time");
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
    if (!valid || !service || !selectedAddress) return;

    setSubmitting(true);
    try {
      const address = {
        street: selectedAddress.street,
        city: selectedAddress.city,
        state: selectedAddress.state,
        zip: selectedAddress.zip,
        country: selectedAddress.country,
      };

      let res;
      if (mode === "instant") {
        res = await orderService.createDirectInstant({
          serviceId,
          providerId,
          description: description.trim(),
          address,
          contactPhone: phone,
          images,
        });
      } else {
        res = await orderService.createDirectScheduled({
          serviceId,
          providerId,
          description: description.trim(),
          preferredDate: selectedDate,
          preferredTime: selectedTime,
          address,
          contactPhone: phone,
          images,
        });
      }
      setOrderId(res.data.data.orderId);
      setSuccess(true);
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to create request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleImagePick = async (files: FileList | null) => {
    if (!files) return;
    const MAX = 5;
    if (images.length >= MAX) { toast.error(`Max ${MAX} images`); return; }
    const file = files[0];
    if (file.size > 5 * 1024 * 1024) { toast.error("Image too large (max 5MB)"); return; }
    const reader = new FileReader();
    reader.onload = () => setImages((prev) => [...prev, reader.result as string]);
    reader.readAsDataURL(file);
  };

  if (isInitialized && !canAccess) {
    return <LoginRequiredPrompt title="Login to request a service" message="Sign in to continue." />;
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--surface-2)] flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </main>
    );
  }

  // Success state
  if (success) {
    return (
      <main className="min-h-screen bg-[var(--surface-2)] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl border border-slate-100">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 size={40} className="text-emerald-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-950">Request Sent!</h1>
          <p className="mt-2 text-sm text-slate-500">
            {mode === "instant"
              ? "The provider has 30 minutes to respond. We'll notify you."
              : "Your scheduled request has been sent to the provider."}
          </p>
          <div className="mt-5 rounded-xl bg-slate-50 border border-slate-100 p-4">
            <p className="text-xs text-slate-500">Order ID</p>
            <p className="text-lg font-black text-indigo-600">{orderId}</p>
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={() => router.push("/dashboard")} className="btn btn-ghost flex-1 py-3 text-sm">
              Back to Home
            </button>
            <button onClick={() => router.push("/bookings")} className="btn btn-primary flex-1 py-3 text-sm">
              View Bookings
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--surface-2)]">
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Back */}
        <button onClick={() => router.back()} className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-indigo-600">
          <ArrowLeft size={14} /> Back
        </button>

        <h1 className="text-2xl font-black text-slate-950 mb-1">Request Service</h1>
        <p className="text-sm text-slate-500 mb-6">
          {service?.name} · Choose instant or scheduled
        </p>

        {/* ── Mode Selection ─────────────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-2 mb-6">
          <button
            onClick={() => setMode("instant")}
            className={`rounded-2xl border-2 p-5 text-left transition-all ${
              mode === "instant"
                ? "border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-500/10"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                mode === "instant" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"
              }`}>
                <Zap size={18} />
              </div>
              <h3 className="text-base font-black text-slate-900">Instant Request</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Need it ASAP? Provider must respond within 30 minutes.
            </p>
          </button>

          <button
            onClick={() => setMode("scheduled")}
            className={`rounded-2xl border-2 p-5 text-left transition-all ${
              mode === "scheduled"
                ? "border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-500/10"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                mode === "scheduled" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"
              }`}>
                <Calendar size={18} />
              </div>
              <h3 className="text-base font-black text-slate-900">Scheduled</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Pick a preferred date and time from available windows.
            </p>
          </button>
        </div>

        {/* ── Scheduled: Date & Time Picker ──────────────────────────── */}
        {mode === "scheduled" && (
          <section className="premium-card p-5 mb-6">
            <h3 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
              <Calendar size={16} className="text-indigo-600" />
              Select Date & Time
            </h3>

            {/* Date pills */}
            <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
              {next14Days.map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDate(d)}
                  className={`shrink-0 rounded-xl px-4 py-2.5 text-center transition-all ${
                    d === selectedDate
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-indigo-300"
                  }`}
                >
                  <p className="text-[10px] font-bold uppercase">
                    {new Intl.DateTimeFormat("en", { weekday: "short" }).format(new Date(d))}
                  </p>
                  <p className="text-sm font-extrabold mt-0.5">{new Date(d).getDate()}</p>
                </button>
              ))}
            </div>

            {/* Time windows */}
            {selectedDate && (
              <div>
                <p className="text-xs font-bold text-slate-600 mb-2">Available time windows</p>
                {windowsLoading ? (
                  <div className="py-6 text-center">
                    <Loader2 className="mx-auto animate-spin text-indigo-400" size={20} />
                  </div>
                ) : windows.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                    <Clock size={20} className="mx-auto text-slate-300 mb-1" />
                    <p className="text-sm font-semibold text-slate-500">No available windows</p>
                    <p className="text-xs text-slate-400">Try another date</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {windows.map((w) => (
                      <button
                        key={w.startTime}
                        onClick={() => setSelectedTime(w.startTime)}
                        className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                          selectedTime === w.startTime
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                            : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        }`}
                      >
                        {w.startTime} – {w.endTime}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* ── Description ────────────────────────────────────────────── */}
        <section className="premium-card p-5 mb-6">
          <h3 className="text-sm font-black text-slate-900 mb-3">Describe the work</h3>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            maxLength={2000}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none resize-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            placeholder="Briefly describe what you need done..."
          />
          <p className="mt-1 text-right text-xs text-slate-400">{description.length}/2000</p>

          {/* Images */}
          <div className="mt-3">
            <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
              <ImagePlus size={14} /> Add photos (optional)
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImagePick(e.target.files)} />
            </label>
            {images.length > 0 && (
              <div className="mt-2 flex gap-2 overflow-x-auto">
                {images.map((img, i) => (
                  <div key={i} className="relative h-16 w-16 shrink-0 rounded-lg overflow-hidden border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="" className="h-full w-full object-cover" />
                    <button onClick={() => setImages((p) => p.filter((_, idx) => idx !== i))} className="absolute top-0.5 right-0.5 rounded-full bg-white/90 p-0.5 text-red-500">
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Address + Contact (shared component) ──────────────────── */}
        <AddressContactStep
          addresses={addresses}
          selectedAddress={selectedAddress}
          onSelectAddress={(a) => { setSelectedAddress(a); setAddressError(""); }}
          contactPhone={contactPhone}
          onPhoneChange={(v) => { setContactPhone(v); setPhoneError(""); }}
          phoneError={phoneError}
          addressError={addressError}
          onAddressAdded={(addr) => setAddresses((prev) => [...prev, addr])}
          accentColor="indigo"
        />

        {/* ── Submit ──────────────────────────────────────────────────── */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="btn btn-primary w-full py-4 text-base"
        >
          {submitting ? <Loader2 size={18} className="animate-spin" /> : <ChevronRight size={18} />}
          {mode === "instant" ? "Send Instant Request" : "Send Scheduled Request"}
        </button>
      </div>
    </main>
  );
}

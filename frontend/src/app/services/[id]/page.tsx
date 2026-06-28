"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  ArrowLeft, Clock, MapPin, Tag as TagIcon, Loader2, CalendarDays,
  Image as ImageIcon, BadgeCheck, ChevronLeft, ChevronRight, CheckCircle2,
  MapPinned, ClipboardList, Shield, MessageSquare, Palette,
} from "lucide-react";
import toast from "react-hot-toast";
import { RootState } from "@/store";
import { serviceService } from "@/services/service";
import { slotService, Slot } from "@/services/provider";
import { bookingService } from "@/services/booking";
import { userService } from "@/services/user";
import { messagingService } from "@/services/messaging";
import { Service } from "@/types/service.types";
import { Address, AddressDto } from "@/types/user.types";
import { Booking, BookingAddress } from "@/types/booking.types";
import { Role } from "@/enums/role.enum";
import { getErrorMessage } from "@/utils/errorHandler";
import { UI_MESSAGES } from "@/shared/messages";
import { LoginRequiredPrompt } from "@/components/auth/LoginRequiredPrompt";
import { useProviderStatus } from "@/hooks/useProviderStatus";
import {
  getDisplayPrice,
  getPriceSubline,
  getBookingFlowDescription,
  getPaymentFlowDescription,
  getBookingCTA,
  getSlotSectionTitle,
  getServiceTypeBadgeClass,
  getServiceTypeLabel,
  getServiceTypeEmoji,
  canBookThroughSlots,
  requiresServiceRequest,
  requiresInspection,
} from "@/utils/serviceType.utils";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateLabel(iso: string) {
  return new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short" }).format(new Date(iso));
}

function getNext7Days(): string[] {
  const days: string[] = [];
  const d = new Date();
  for (let i = 0; i < 7; i++) {
    days.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

type BookingStep = "checkout" | "success";

export default function ServiceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id ?? "";
  const { isAuthenticated, isInitialized, role } = useSelector((s: RootState) => s.auth);
  const canViewDetails = isInitialized && isAuthenticated && role === Role.USER;

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  // Slots
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayIso());

  // Booking flow
  const [step, setStep] = useState<BookingStep | null>(null);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addrForm, setAddrForm] = useState({ street: "", city: "", state: "", zip: "", country: "India" });

  // Fetch service
  useEffect(() => {
    if (!id || !canViewDetails) return;
    let c = false;
    setLoading(true);
    serviceService.publicGet(id)
      .then((r) => { if (!c) setService(r.data.data); })
      .catch((e) => { if (!c) toast.error(getErrorMessage(e) || UI_MESSAGES.SERVICE_LOAD_FAILED); })
      .finally(() => { if (!c) setLoading(false); });
    return () => { c = true; };
  }, [id, canViewDetails]);

  const provider = useMemo(() => {
    if (!service) return null;
    return typeof service.providerId === "object" ? service.providerId : null;
  }, [service]);

  const providerId = useMemo(() => {
    if (!service) return null;
    return typeof service.providerId === "object" ? service.providerId.id : service.providerId;
  }, [service]);

  // Fetch slots
  useEffect(() => {
    if (!providerId || !canViewDetails) return;
    let c = false;
    setSlotsLoading(true);
    slotService.getAvailable(providerId, selectedDate)
      .then((r) => { if (!c) setSlots(r.data.data); })
      .catch(() => { if (!c) setSlots([]); })
      .finally(() => { if (!c) setSlotsLoading(false); });
    return () => { c = true; };
  }, [providerId, selectedDate, canViewDetails]);

  // Fetch addresses when booking flow starts
  const loadAddresses = useCallback(async () => {
    try {
      const r = await userService.getProfile();
      const addrs = r.data.data.addresses || [];
      setAddresses(addrs);
      setSelectedAddress(addrs.find((a) => a.isDefault) || addrs[0] || null);
    } catch {}
  }, []);

  const startBooking = (slot: Slot) => {
    if (!isAuthenticated || role !== Role.USER) {
      toast.error(UI_MESSAGES.BOOKING_LOGIN_REQUIRED);
      router.push(`/login?next=${encodeURIComponent(`/services/${id}`)}`);
      return;
    }
    setSelectedSlot(slot);
    setShowSlotModal(true);
  };

  const confirmSlotAndProceed = () => {
    setShowSlotModal(false);
    setStep("checkout");
    loadAddresses();
  };

  const handleAddAddress = async () => {
    const { street, city, state, zip, country } = addrForm;
    if (!street || !city || !state || !zip || !country) {
      toast.error(UI_MESSAGES.BOOKING_ADDRESS_INCOMPLETE);
      return;
    }
    try {
      const r = await userService.addAddress(addrForm as AddressDto);
      const addrs = r.data.data;
      setAddresses(addrs);
      setSelectedAddress(addrs[addrs.length - 1]);
      setShowAddForm(false);
      setAddrForm({ street: "", city: "", state: "", zip: "", country: "India" });
    } catch (e) {
      toast.error(getErrorMessage(e) || UI_MESSAGES.BOOKING_ADDRESS_ADD_FAILED);
    }
  };

  const confirmBooking = async () => {
    if (!selectedSlot || !selectedAddress || !service) return;
    setBookingLoading(true);
    try {
      const addr: BookingAddress = {
        street: selectedAddress.street,
        city: selectedAddress.city,
        state: selectedAddress.state,
        zip: selectedAddress.zip,
        country: selectedAddress.country,
      };
      const r = await bookingService.create({ serviceId: service.id, slotId: selectedSlot._id, address: addr });
      setCreatedBooking(r.data.data);
      setStep("success");
      setSlots((prev) => prev.filter((s) => s._id !== selectedSlot._id));
    } catch (e) {
      toast.error(getErrorMessage(e) || UI_MESSAGES.BOOKING_FAILED);
    } finally {
      setBookingLoading(false);
    }
  };

  const dates = useMemo(() => getNext7Days(), []);

  // Real-time provider status via WebSocket
  const liveStatus = useProviderStatus(
    providerId,
    { onlineStatus: provider?.onlineStatus, engagementStatus: provider?.engagementStatus }
  );
  const isProviderOffline = liveStatus.onlineStatus === "offline" || liveStatus.engagementStatus === "busy";

  if (isInitialized && !canViewDetails) {
    return (
      <LoginRequiredPrompt
        title="Login to view service details"
        message="Please login or sign up to view service details, slots, and booking options."
      />
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--surface-2)]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="skeleton h-4 w-16 mb-8 rounded-lg" />
          <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
            <div>
              <div className="skeleton aspect-[16/10] w-full rounded-[24px]" />
              <div className="mt-8 space-y-3">
                <div className="skeleton h-3.5 w-32 rounded-lg" />
                <div className="skeleton h-9 w-3/4 rounded-lg" />
                <div className="skeleton h-4 w-48 rounded-lg" />
              </div>
              <div className="skeleton mt-8 h-44 w-full rounded-[22px]" />
              <div className="skeleton mt-6 h-56 w-full rounded-[22px]" />
            </div>
            <div className="hidden lg:block space-y-5">
              <div className="skeleton h-48 w-full rounded-[22px]" />
              <div className="skeleton h-44 w-full rounded-[22px]" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!service) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50">
        <p className="font-bold text-slate-600">Service not found.</p>
        <Link href="/dashboard" className="mt-4 text-sm font-semibold text-indigo-600 hover:underline">Back to dashboard</Link>
      </main>
    );
  }

  // Booking flow modal
  if (step) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 py-8">
          {/* Header */}
          <button
            onClick={() => {
              if (step === "checkout") { setStep(null); }
              else if (step === "success") { setStep(null); setCreatedBooking(null); }
            }}
            className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-indigo-600"
          >
            <ArrowLeft size={14} /> {step === "success" ? "Back to service" : "Back"}
          </button>

          {/* Step: Checkout (address + review side by side) */}
          {step === "checkout" && selectedSlot && (
            <div>
              <h2 className="text-xl font-black text-slate-900 mb-6">Complete your booking</h2>
              <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
                {/* Left: Address selection */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <h3 className="text-base font-bold text-slate-900 mb-1">Service address</h3>
                  <p className="text-sm text-slate-500 mb-5">Where should the provider come?</p>

                  {addresses.length === 0 && !showAddForm && (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center mb-4">
                      <MapPinned size={28} className="mx-auto text-slate-400 mb-2" />
                      <p className="font-semibold text-slate-600 text-sm">No saved addresses</p>
                      <p className="text-xs text-slate-500 mt-1">Add one to continue</p>
                    </div>
                  )}

                  <div className="space-y-3 mb-4">
                    {addresses.map((a) => (
                      <button key={a._id} onClick={() => setSelectedAddress(a)} className={`w-full text-left rounded-xl border-2 p-4 transition ${selectedAddress?._id === a._id ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-slate-300"}`}>
                        <p className="font-semibold text-slate-900">{a.street}</p>
                        <p className="text-sm text-slate-500">{a.city}, {a.state} {a.zip}</p>
                        {a.isDefault && <span className="mt-1 inline-block text-xs font-bold text-indigo-600">Default</span>}
                      </button>
                    ))}
                  </div>

                  {showAddForm ? (
                    <div className="rounded-xl border border-indigo-200 bg-indigo-50/30 p-4 space-y-3">
                      <input placeholder="Street" value={addrForm.street} onChange={(e) => setAddrForm({ ...addrForm, street: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" />
                      <div className="grid grid-cols-2 gap-3">
                        <input placeholder="City" value={addrForm.city} onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" />
                        <input placeholder="State" value={addrForm.state} onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input placeholder="ZIP" value={addrForm.zip} onChange={(e) => setAddrForm({ ...addrForm, zip: e.target.value.replace(/\D/g, "").slice(0, 6) })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" />
                        <input placeholder="Country" value={addrForm.country} onChange={(e) => setAddrForm({ ...addrForm, country: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleAddAddress} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700">Save</button>
                        <button onClick={() => setShowAddForm(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setShowAddForm(true)} className="text-sm font-bold text-indigo-600 hover:underline">+ Add new address</button>
                  )}
                </div>

                {/* Right: Order summary */}
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-6">
                    <h3 className="text-base font-bold text-slate-900 mb-4">Order summary</h3>
                    <div className="space-y-3">
                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-bold uppercase text-slate-500 mb-1">Service</p>
                        <p className="font-bold text-slate-900">{service.name}</p>
                        <p className="text-sm text-slate-500">{service.duration} min</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-bold uppercase text-slate-500 mb-1">Date &amp; Time</p>
                        <p className="font-bold text-slate-900">{formatDateLabel(selectedSlot.date)}</p>
                        <p className="text-sm text-slate-500">{selectedSlot.startTime} – {selectedSlot.endTime}</p>
                      </div>
                      {selectedAddress && (
                        <div className="rounded-xl bg-slate-50 p-4">
                          <p className="text-xs font-bold uppercase text-slate-500 mb-1">Address</p>
                          <p className="font-bold text-slate-900">{selectedAddress.street}</p>
                          <p className="text-sm text-slate-500">{selectedAddress.city}, {selectedAddress.state} {selectedAddress.zip}</p>
                        </div>
                      )}
                      {provider && (
                        <div className="rounded-xl bg-slate-50 p-4">
                          <p className="text-xs font-bold uppercase text-slate-500 mb-1">Provider</p>
                          <p className="font-bold text-slate-900">{provider.businessName ?? provider.name}</p>
                        </div>
                      )}
                      <div className="rounded-xl border-2 border-indigo-100 bg-indigo-50 p-4 flex items-center justify-between">
                        <span className="font-bold text-slate-900">
                          {(service.deliveryModel ?? service.serviceType) === "inspection_required" ? "Inspection fee" : "Total"}
                        </span>
                        <span className="text-2xl font-black text-indigo-600">
                          {(service.deliveryModel ?? service.serviceType) === "inspection_required"
                            ? (service.freeInspection ? "Free" : `₹${service.inspectionFee}`)
                            : getDisplayPrice(service.price, service.pricingModel ?? "fixed", service.priceUnit)}
                        </span>
                      </div>
                    </div>

                    <p className="mt-3 flex items-center gap-1 text-xs text-slate-500">
                      <Shield size={12} />
                      {(service.deliveryModel ?? service.serviceType) === "inspection_required"
                        ? "Provider will visit and send a detailed quote"
                        : "Payment collected after service completion"}
                    </p>

                    <button
                      onClick={() => { if (selectedAddress) confirmBooking(); else toast.error(UI_MESSAGES.BOOKING_SELECT_ADDRESS); }}
                      disabled={bookingLoading || !selectedAddress}
                      className="mt-5 w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {bookingLoading && <Loader2 size={16} className="animate-spin" />}
                      {(service.deliveryModel ?? service.serviceType) === "inspection_required" ? "Confirm Inspection Visit" : "Confirm Booking"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step: Success */}
          {step === "success" && createdBooking && (
            <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 size={32} className="text-emerald-600" />
              </div>
              <h2 className="text-xl font-black text-slate-900">
                {(service.deliveryModel ?? service.serviceType) === "inspection_required" ? "Inspection Scheduled!" : "Booking Confirmed!"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {(service.deliveryModel ?? service.serviceType) === "inspection_required"
                  ? "The provider will visit and send you a quote"
                  : "Your service has been booked successfully"}
              </p>

              <div className="mt-6 rounded-xl bg-slate-50 p-4 text-left space-y-3">
                <div className="flex justify-between"><span className="text-xs text-slate-500">Booking ID</span><span className="text-xs font-bold text-slate-900">{createdBooking._id.slice(-8).toUpperCase()}</span></div>
                <div className="flex justify-between"><span className="text-xs text-slate-500">Service</span><span className="text-xs font-bold text-slate-900">{service.name}</span></div>
                <div className="flex justify-between"><span className="text-xs text-slate-500">Date</span><span className="text-xs font-bold text-slate-900">{formatDateLabel(createdBooking.date)}</span></div>
                <div className="flex justify-between"><span className="text-xs text-slate-500">Time</span><span className="text-xs font-bold text-slate-900">{createdBooking.startTime} – {createdBooking.endTime}</span></div>
                <div className="flex justify-between"><span className="text-xs text-slate-500">Amount</span><span className="text-xs font-bold text-indigo-600">₹{createdBooking.amount}</span></div>
                <div className="flex justify-between"><span className="text-xs text-slate-500">Status</span><span className="text-xs font-bold text-emerald-600 capitalize">{createdBooking.bookingStatus}</span></div>
              </div>

              <div className="mt-6 flex gap-3">
                <Link href={`/bookings/${createdBooking._id}`} className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-700 text-center">View Booking</Link>
                <Link href="/bookings" className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 text-center">My Bookings</Link>
              </div>
            </div>
          )}
        </div>
      </main>
    );
  }

  // Main service details view
  return (
    <main className="min-h-screen bg-[var(--surface-2)]">
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
        <button onClick={() => router.back()} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-[var(--primary)] transition-colors">
          <ArrowLeft size={15} /> Back
        </button>

        <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          {/* Left column */}
          <section className="fade-up">
            {/* Image gallery */}
            <div className="overflow-hidden rounded-[18px] border border-slate-200/60 bg-white shadow-sm">
              <div className="relative aspect-[16/11] w-full bg-slate-100">
                {service.images.length > 0 ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={service.images[activeImage]} alt={service.name} className="h-full w-full object-cover transition-all duration-500" />
                    {service.images.length > 1 && (
                      <>
                        <button onClick={() => setActiveImage((p) => (p - 1 + service.images.length) % service.images.length)} className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 backdrop-blur-sm p-3 shadow-lg hover:bg-white hover:scale-105 transition-all" aria-label="Previous image"><ChevronLeft size={18} /></button>
                        <button onClick={() => setActiveImage((p) => (p + 1) % service.images.length)} className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 backdrop-blur-sm p-3 shadow-lg hover:bg-white hover:scale-105 transition-all" aria-label="Next image"><ChevronRight size={18} /></button>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                          {service.images.map((_, i) => (
                            <button key={i} onClick={() => setActiveImage(i)} className={`h-2 rounded-full transition-all ${i === activeImage ? "w-7 bg-white shadow-md" : "w-2 bg-white/50"}`} aria-label={`Image ${i + 1}`} />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-200"><ImageIcon size={56} /></div>
                )}
              </div>
              {service.images.length > 1 && (
                <div className="flex gap-2.5 overflow-x-auto p-4">
                  {service.images.map((img, i) => (
                    <button key={i} onClick={() => setActiveImage(i)} className={`h-18 w-22 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${i === activeImage ? "border-[var(--primary)] shadow-md" : "border-transparent opacity-60 hover:opacity-100"}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Service info */}
            <header className="mt-5">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
                  {service.category?.name}{service.subCategory ? ` · ${service.subCategory}` : ""}
                </p>
                {/* Service-type badge */}
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${getServiceTypeBadgeClass((service.deliveryModel ?? service.serviceType) ?? "direct")}`}>
                  {getServiceTypeEmoji((service.deliveryModel ?? service.serviceType) ?? "direct")}{" "}
                  {getServiceTypeLabel((service.deliveryModel ?? service.serviceType) ?? "direct")}
                </span>
              </div>
              <h1 className="mt-1 text-2xl sm:text-[2rem] font-extrabold text-slate-950 tracking-tight leading-tight">{service.name}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                <span className="inline-flex items-center gap-1.5 font-semibold">
                  <Clock size={15} className="text-[var(--primary)]" />
                  {requiresInspection((service.deliveryModel ?? service.serviceType) ?? "direct")
                    ? `${service.duration} min inspection`
                    : `${service.duration} min`}
                </span>
                {service.serviceArea && (
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    <MapPin size={15} className="text-[var(--primary)]" /> {service.serviceArea}
                  </span>
                )}
                {((service.deliveryModel ?? service.serviceType) === "inspection_required") && service.estimatedProjectDays && (
                  <span className="inline-flex items-center gap-1.5 font-semibold text-blue-600">
                    ~{service.estimatedProjectDays} day{service.estimatedProjectDays > 1 ? "s" : ""} project
                  </span>
                )}
              </div>
            </header>

            {/* Booking-flow info panel */}
            <div className={`mt-4 rounded-[14px] border p-4 flex items-start gap-3 ${
              (service.deliveryModel ?? service.serviceType) === "inspection_required" ? "border-blue-100 bg-blue-50/60" :
              (service.deliveryModel ?? service.serviceType) === "custom"      ? "border-purple-100 bg-purple-50/60" :
              "border-emerald-100 bg-emerald-50/60"
            }`}>
              <div className="mt-0.5 text-xl shrink-0">
                {(service.deliveryModel ?? service.serviceType) === "inspection_required" ? "🏠" :
                 (service.deliveryModel ?? service.serviceType) === "custom"      ? "🎨" : "⚡"}
              </div>
              <div>
                <p className="text-xs font-black text-slate-700">How this booking works</p>
                <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">
                  {getBookingFlowDescription((service.deliveryModel ?? service.serviceType) ?? "direct")}
                </p>
                {(service.deliveryModel ?? service.serviceType) === "inspection_required" && (
                  <p className="mt-1.5 text-xs font-semibold text-blue-700">
                    {service.freeInspection
                      ? "✓ Free inspection visit included"
                      : `Inspection visit fee: ₹${service.inspectionFee}`}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <article className="mt-5 rounded-[18px] border border-slate-200/60 bg-white p-5 sm:p-6">
              <h2 className="text-lg font-extrabold text-slate-900">About this service</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{service.description}</p>
              {service.tags.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {service.tags.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 rounded-full bg-slate-50 border border-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"><TagIcon size={11} /> {t}</span>
                  ))}
                </div>
              )}
            </article>

            {/* Slot picker — only for instant and visit_first */}
            {isProviderOffline ? (
            <section id="available-slots" className="mt-5 rounded-[18px] border border-slate-200/60 bg-slate-50 p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                </span>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-700">
                    {liveStatus.onlineStatus === "offline" ? "Provider Offline" : "Provider Busy"}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {liveStatus.onlineStatus === "offline"
                      ? "This provider is currently offline and cannot accept new requests right now."
                      : "This provider is currently busy and cannot accept new requests right now."}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-500">
                You can still send them a message — they&apos;ll respond when they&apos;re available.
              </p>
            </section>
            ) : (service.deliveryModel ?? service.serviceType) === "direct" ? (
            <section id="available-slots" className="mt-5 rounded-[18px] border border-slate-200/60 bg-white p-5 sm:p-6">
              <h2 className="flex items-center gap-2.5 text-lg font-extrabold text-slate-900 mb-1">
                <CalendarDays size={18} className="text-[var(--primary)]" />
                Request this Service
              </h2>
              <p className="text-sm text-slate-500 mb-4">
                Choose instant (provider responds within 30 min) or pick a preferred date &amp; time.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/request-service?serviceId=${service.id}&providerId=${providerId}`}
                  className="inline-flex items-center gap-2 rounded-[14px] bg-gradient-to-r from-[#6D28FF] to-[#8B5CF6] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-purple-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                  Request Service
                </Link>
              </div>
            </section>
            ) : (service.deliveryModel ?? service.serviceType) === "inspection_required" ? (
            <section id="available-slots" className="mt-5 rounded-[18px] border border-blue-200/60 bg-blue-50/40 p-5 sm:p-6">
              <h2 className="flex items-center gap-2.5 text-lg font-extrabold text-slate-900 mb-2">
                🏠 Request Inspection Visit
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                This service requires an on-site inspection before pricing. The provider will visit, assess the work, and send you a detailed quotation.
              </p>
              <Link
                href={`/request-inspection?serviceId=${service.id}&providerId=${providerId}`}
                className="inline-flex items-center gap-2 rounded-[14px] bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                Request Inspection
              </Link>
            </section>
            ) : (
            /* custom service — redirect to custom request flow */
            <section id="available-slots" className="mt-5 rounded-[18px] border border-purple-200/60 bg-purple-50/40 p-5 sm:p-6">
              <h2 className="flex items-center gap-2.5 text-lg font-extrabold text-slate-900 mb-2">
                <Palette size={18} className="text-purple-600" /> Custom Service Request
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                This is a custom-scoped service. Describe your exact requirements and receive
                competitive quotes from multiple providers.
              </p>
              <Link
                href={`/request-custom?categoryId=${service.category?.id ?? ""}&providerId=${providerId}&serviceId=${service.id}`}
                className="mt-4 inline-flex items-center gap-2 rounded-[14px] bg-gradient-to-r from-purple-600 to-violet-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-purple-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                Post a Custom Request
              </Link>
            </section>
            )}
          </section>

          {/* Right: Sticky booking card (desktop) */}
          <aside className="hidden lg:block">
            <div className="sticky top-5 space-y-4 fade-up" style={{ animationDelay: "0.1s" }}>
              <div className="rounded-[18px] border border-slate-200/60 bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.04)]">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Price</p>
                <p className="mt-2 text-[2.25rem] font-extrabold text-slate-950 tracking-tight">
                  {getDisplayPrice(service.price, service.pricingModel ?? "fixed", service.priceUnit)}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {getPriceSubline(service.pricingModel ?? "fixed", service.duration, service.estimatedProjectDays) ??
                    `${service.duration} min`}
                </p>

                {/* Booking flow info box */}
                <div className={`mt-4 rounded-2xl border p-3 ${
                  (service.deliveryModel ?? service.serviceType) === "inspection_required" ? "border-blue-100 bg-blue-50" :
                  (service.deliveryModel ?? service.serviceType) === "custom"      ? "border-purple-100 bg-purple-50" :
                  "border-purple-100/60 bg-gradient-to-br from-purple-50 to-violet-50/50"
                }`}>
                  <p className={`text-xs font-bold flex items-center gap-2 ${
                    (service.deliveryModel ?? service.serviceType) === "inspection_required" ? "text-blue-700" :
                    (service.deliveryModel ?? service.serviceType) === "custom"      ? "text-purple-700" :
                    "text-[var(--primary)]"
                  }`}>
                    <ClipboardList size={14} />
                    {(service.deliveryModel ?? service.serviceType) === "direct"
                      ? "Request instantly or schedule a preferred time"
                      : (service.deliveryModel ?? service.serviceType) === "inspection_required"
                      ? "Request an inspection visit"
                      : "Post a request to receive quotes"}
                  </p>
                </div>

                {/* Trust elements */}
                <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                  <p className="flex items-center gap-2.5 text-sm font-semibold text-slate-600">
                    <Shield size={14} className="text-emerald-500" />
                    {getPaymentFlowDescription((service.deliveryModel ?? service.serviceType) ?? "direct")}
                  </p>
                  <p className="flex items-center gap-2.5 text-sm font-semibold text-slate-600">
                    <BadgeCheck size={14} className="text-[var(--primary)]" /> Verified professional
                  </p>
                  <p className="flex items-center gap-2.5 text-sm font-semibold text-slate-600">
                    <Clock size={14} className="text-amber-500" /> Quick response time
                  </p>
                </div>
              </div>

              {provider && (
                <div className="rounded-[18px] border border-slate-200/60 bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.04)]">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Provider</p>
                  <Link href={`/providers/${providerId}`} className="mt-4 flex items-center gap-3.5 group">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-violet-100 text-[var(--primary)] font-extrabold text-lg overflow-hidden ring-1 ring-purple-100">
                      {(provider as { headshot?: string }).headshot ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={(provider as { headshot?: string }).headshot} alt="" className="h-full w-full object-cover" />
                      ) : (provider.businessName ?? provider.name ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-900 group-hover:text-[var(--primary)] transition-colors">{provider.businessName ?? provider.name}</p>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[var(--primary)] mt-0.5"><BadgeCheck size={12} /> Verified</span>
                    </div>
                  </Link>

                    
    {liveStatus.onlineStatus && (
      <div className="mt-3">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold ${
          liveStatus.onlineStatus === "online"
            ? "bg-emerald-50 text-emerald-700"
            : "bg-slate-100 text-slate-500"
        }`}>
          <span className={`h-2 w-2 rounded-full ${
            liveStatus.onlineStatus === "online" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
          }`} />
          {liveStatus.onlineStatus === "online"
            ? (liveStatus.engagementStatus === "busy" ? "Online · Busy" : "Online · Available")
            : "Currently Offline"}
        </span>
      </div>
    )}

                  {isAuthenticated && role === Role.USER && providerId && (
                    <button
                      onClick={async () => {
                        try {
                          await messagingService.getOrCreateConversation({ providerId: providerId!, serviceId: id });
                          router.push("/messages");
                        } catch (e) {
                          toast.error(getErrorMessage(e) || "Failed to start conversation");
                        }
                      }}
                      className="mt-5 w-full rounded-2xl border border-purple-200 bg-purple-50 py-3 text-sm font-bold text-[var(--primary)] hover:bg-purple-100 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
                    >
                      <MessageSquare size={15} /> Message Provider
                    </button>
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile bottom bar */}
      <div className="fixed bottom-0 inset-x-0 lg:hidden border-t border-slate-200/60 bg-white/95 backdrop-blur-lg px-5 py-4 flex items-center justify-between z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
        <div>
          <p className="text-xl font-extrabold text-slate-950">
            {getDisplayPrice(service.price, service.pricingModel ?? "fixed", service.priceUnit)}
          </p>
          <p className="text-xs text-slate-500">
            {requiresInspection((service.deliveryModel ?? service.serviceType) ?? "direct")
              ? `${service.duration} min inspection`
              : `${service.duration} min`}
          </p>
        </div>
        {isProviderOffline ? (
          <span className="rounded-[14px] bg-slate-200 px-6 py-3 text-sm font-bold text-slate-500 cursor-not-allowed">
            {liveStatus.onlineStatus === "offline" ? "Provider Offline" : "Provider Busy"}
          </span>
        ) : requiresServiceRequest((service.deliveryModel ?? service.serviceType) ?? "direct") ? (
          <Link
            href={`/request-custom?categoryId=${service.category?.id ?? ""}&providerId=${providerId}&serviceId=${service.id}`}
            className="rounded-[14px] bg-gradient-to-r from-purple-600 to-violet-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-purple-500/20 hover:shadow-xl transition-all"
          >
            Post Request
          </Link>
        ) : requiresInspection((service.deliveryModel ?? service.serviceType) ?? "direct") ? (
          <Link
            href={`/request-inspection?serviceId=${service.id}&providerId=${providerId}`}
            className="rounded-[14px] bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:shadow-xl transition-all"
          >
            Request Inspection
          </Link>
        ) : (
          <Link
            href={`/request-service?serviceId=${service.id}&providerId=${providerId}`}
            className="rounded-[14px] bg-gradient-to-r from-[#6D28FF] to-[#8B5CF6] px-7 py-3 text-sm font-bold text-white shadow-lg shadow-purple-500/20 hover:shadow-xl transition-all"
          >
            {getBookingCTA((service.deliveryModel ?? service.serviceType) ?? "direct")}
          </Link>
        )}
      </div>

      {/* Slot confirmation modal */}
      {showSlotModal && selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-black text-slate-900 mb-1">
              {(service.deliveryModel ?? service.serviceType) === "inspection_required" ? "Confirm inspection visit" : "Confirm slot"}
            </h3>
            <p className="text-sm text-slate-500 mb-5">
              {(service.deliveryModel ?? service.serviceType) === "inspection_required"
                ? "The provider will visit to assess the work and send you a quote."
                : "You're about to book this time slot"}
            </p>

            <div className="rounded-xl bg-slate-50 p-4 space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Service</span>
                <span className="font-bold text-slate-900">{service?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Date</span>
                <span className="font-bold text-slate-900">{formatDateLabel(selectedSlot.date)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Time</span>
                <span className="font-bold text-slate-900">{selectedSlot.startTime} – {selectedSlot.endTime}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">
                  {(service.deliveryModel ?? service.serviceType) === "inspection_required" ? "Inspection" : "Price"}
                </span>
                <span className="font-black text-indigo-600">
                  {(service.deliveryModel ?? service.serviceType) === "inspection_required"
                    ? (service.freeInspection ? "Free" : `₹${service.inspectionFee}`)
                    : getDisplayPrice(service.price, service.pricingModel ?? "fixed", service.priceUnit)}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowSlotModal(false); setSelectedSlot(null); }}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmSlotAndProceed}
                className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";

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
import { UserShell } from "@/components/layout/UserShell";
import { useProviderStatus } from "@/hooks/useProviderStatus";
import {
  getDisplayPrice,
  getPriceSubline,
  getBookingFlowDescription,
  getPaymentFlowDescription,
  getBookingCTA,
  
  getServiceTypeBadgeClass,
  getServiceTypeLabel,
  getServiceTypeEmoji,
  
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

import { BookingStep } from "@/types/booking.types";
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
    if (!id) return;
    let c = false;
    setLoading(true);
    serviceService.publicGet(id)
      .then((r) => { if (!c) setService(r.data.data); })
      .catch((e) => { if (!c) toast.error(getErrorMessage(e) || UI_MESSAGES.SERVICE_LOAD_FAILED); })
      .finally(() => { if (!c) setLoading(false); });
    return () => { c = true; };
  }, [id]);

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
    if (!providerId) return;
    let c = false;
    setSlotsLoading(true);
    slotService.getAvailable(providerId, selectedDate)
      .then((r) => { if (!c) setSlots(r.data.data); })
      .catch(() => { if (!c) setSlots([]); })
      .finally(() => { if (!c) setSlotsLoading(false); });
    return () => { c = true; };
  }, [providerId, selectedDate]);

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
      <main className="min-h-screen bg-slate-50/50">
        <div className="mx-auto max-w-5xl px-4 py-8">
          {/* Header */}
          <button
            onClick={() => {
              if (step === "checkout") { setStep(null); }
              else if (step === "success") { setStep(null); setCreatedBooking(null); }
            }}
            className="group mb-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-600 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
          >
            <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
            {step === "success" ? "Back to service" : "Back"}
          </button>

          {/* Step: Checkout (address + review side by side) */}
          {step === "checkout" && selectedSlot && (
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 mb-6">Complete your booking</h2>
              <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                {/* Left: Address selection */}
                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-2xs">
                  <h3 className="text-sm font-bold text-slate-950">Service address</h3>
                  <p className="text-xs text-slate-400 mt-0.5 mb-5">Where should the provider visit?</p>

                  {addresses.length === 0 && !showAddForm && (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center mb-4">
                      <MapPinned size={24} className="mx-auto text-slate-300 mb-2" />
                      <p className="font-bold text-slate-700 text-sm">No saved addresses</p>
                      <p className="text-xs text-slate-400 mt-0.5">Add an address to proceed</p>
                    </div>
                  )}

                  <div className="space-y-3 mb-4">
                    {addresses.map((a) => (
                      <button
                        key={a._id}
                        onClick={() => setSelectedAddress(a)}
                        className={`w-full text-left rounded-xl border p-4 transition cursor-pointer ${
                          selectedAddress?._id === a._id
                            ? "border-[#00B761] bg-[#E6F7F0]/30 shadow-2xs"
                            : "border-slate-100 hover:border-slate-200"
                        }`}
                      >
                        <p className="font-bold text-slate-900 text-sm">{a.street}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{a.city}, {a.state} {a.zip}</p>
                        {a.isDefault && <span className="mt-2 inline-block text-[10px] font-bold text-[#00B761] bg-[#E6F7F0] px-1.5 py-0.5 rounded">Default</span>}
                      </button>
                    ))}
                  </div>

                  {showAddForm ? (
                    <div className="rounded-xl border border-[#99E2C0] bg-[#E6F7F0]/10 p-4 space-y-3">
                      <input
                        placeholder="Street Address"
                        value={addrForm.street}
                        onChange={(e) => setAddrForm({ ...addrForm, street: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-[#00B761] transition"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          placeholder="City"
                          value={addrForm.city}
                          onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })}
                          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-[#00B761] transition"
                        />
                        <input
                          placeholder="State"
                          value={addrForm.state}
                          onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })}
                          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-[#00B761] transition"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          placeholder="ZIP"
                          value={addrForm.zip}
                          onChange={(e) => setAddrForm({ ...addrForm, zip: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-[#00B761] transition"
                        />
                        <input
                          placeholder="Country"
                          value={addrForm.country}
                          onChange={(e) => setAddrForm({ ...addrForm, country: e.target.value })}
                          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-[#00B761] transition"
                        />
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button onClick={handleAddAddress} className="rounded-xl bg-[#00B761] hover:bg-[#009E52] px-4 py-2 text-xs font-bold text-white transition cursor-pointer">Save</button>
                        <button onClick={() => setShowAddForm(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setShowAddForm(true)} className="text-xs font-bold text-[#00B761] hover:underline cursor-pointer">+ Add new address</button>
                  )}
                </div>

                {/* Right: Order summary */}
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-2xs">
                    <h3 className="text-sm font-bold text-slate-900 mb-4">Order summary</h3>
                    <div className="space-y-3">
                      <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                        <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Service</p>
                        <p className="font-bold text-slate-800 text-sm">{service.name}</p>
                        <p className="text-sm text-slate-500">{service.duration} min</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                        <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Date &amp; Time</p>
                        <p className="font-bold text-slate-800 text-sm">{formatDateLabel(selectedSlot.date)}</p>
                        <p className="text-sm text-slate-500">{selectedSlot.startTime} – {selectedSlot.endTime}</p>
                      </div>
                      {selectedAddress && (
                        <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                          <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Address</p>
                          <p className="font-bold text-slate-800 text-xs">{selectedAddress.street}</p>
                          <p className="text-sm text-slate-500">{selectedAddress.city}, {selectedAddress.state} {selectedAddress.zip}</p>
                        </div>
                      )}
                      {provider && (
                        <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                          <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Provider</p>
                          <p className="font-bold text-slate-800 text-sm">{provider.businessName ?? provider.name}</p>
                        </div>
                      )}
                      <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-4 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">
                          {(service.deliveryModel ?? service.serviceType) === "inspection_required" ? "Inspection fee" : "Total"}
                        </span>
                        <span className="text-xl font-black text-[#00B761]">
                          {(service.deliveryModel ?? service.serviceType) === "inspection_required"
                            ? (service.freeInspection ? "Free" : `₹${service.inspectionFee}`)
                            : getDisplayPrice(service.price, service.pricingModel ?? "fixed", service.priceUnit)}
                        </span>
                      </div>
                    </div>

                    <p className="mt-4 flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider justify-center">
                      <Shield size={11} className="text-[#00B761]" />
                      {(service.deliveryModel ?? service.serviceType) === "inspection_required"
                        ? "Provider will visit & quote"
                        : "Pay after service completion"}
                    </p>

                    <button
                      onClick={() => { if (selectedAddress) confirmBooking(); else toast.error(UI_MESSAGES.BOOKING_SELECT_ADDRESS); }}
                      disabled={bookingLoading || !selectedAddress}
                      className="mt-5 w-full rounded-xl bg-[#00B761] hover:bg-[#009E52] py-3 text-sm font-bold text-white transition-all shadow-md shadow-[#00B761]/10 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {bookingLoading && <Loader2 size={15} className="animate-spin" />}
                      {(service.deliveryModel ?? service.serviceType) === "inspection_required" ? "Confirm Inspection Visit" : "Confirm Booking"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step: Success */}
          {step === "success" && createdBooking && (
            <div className="mx-auto max-w-md rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-2xs">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 size={28} className="text-[#00B761]" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">
                {(service.deliveryModel ?? service.serviceType) === "inspection_required" ? "Inspection Scheduled!" : "Booking Confirmed!"}
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                {(service.deliveryModel ?? service.serviceType) === "inspection_required"
                  ? "The provider will visit and send you a quote"
                  : "Your service has been booked successfully"}
              </p>

              <div className="mt-6 rounded-xl bg-slate-50 p-4 text-left space-y-3 border border-slate-100">
                <div className="flex justify-between"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Booking ID</span><span className="text-xs font-bold text-slate-900">{createdBooking._id.slice(-8).toUpperCase()}</span></div>
                <div className="flex justify-between"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Service</span><span className="text-xs font-bold text-slate-900">{service.name}</span></div>
                <div className="flex justify-between"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</span><span className="text-xs font-bold text-slate-900">{formatDateLabel(createdBooking.date)}</span></div>
                <div className="flex justify-between"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Time</span><span className="text-xs font-bold text-slate-900">{createdBooking.startTime} – {createdBooking.endTime}</span></div>
                <div className="flex justify-between"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amount</span><span className="text-xs font-bold text-[#00B761]">₹{createdBooking.amount}</span></div>
                <div className="flex justify-between"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</span><span className="text-xs font-bold text-emerald-600 capitalize">{createdBooking.bookingStatus}</span></div>
              </div>

              <div className="mt-6 flex gap-3">
                <Link href={`/bookings/${createdBooking._id}`} className="flex-1 rounded-xl bg-[#00B761] hover:bg-[#009E52] py-3 text-xs font-bold text-white text-center transition">View Booking</Link>
                <Link href="/bookings" className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 text-center transition">My Bookings</Link>
              </div>
            </div>
          )}
        </div>
      </main>
    );
  }

  // Main service details view
  return (
    <UserShell>
      <main className="min-h-screen bg-[var(--surface-2)]">

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <button
          onClick={() => router.back()}
          className="group mb-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-600 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
        >
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
          Back
        </button>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* Left column */}
          <section className="space-y-6">
            {/* Image gallery */}
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xs p-4">
              <div className="relative aspect-[16/10] w-full bg-slate-50 rounded-xl overflow-hidden">
                {service.images.length > 0 ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={service.images[activeImage]} alt={service.name} className="h-full w-full object-cover transition-all duration-500" />
                    {service.images.length > 1 && (
                      <>
                        <button onClick={() => setActiveImage((p) => (p - 1 + service.images.length) % service.images.length)} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-xl bg-white/95 backdrop-blur-xs p-2 shadow-2xs hover:bg-white hover:scale-105 transition cursor-pointer" aria-label="Previous image"><ChevronLeft size={16} /></button>
                        <button onClick={() => setActiveImage((p) => (p + 1) % service.images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl bg-white/95 backdrop-blur-xs p-2 shadow-2xs hover:bg-white hover:scale-105 transition cursor-pointer" aria-label="Next image"><ChevronRight size={16} /></button>
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                          {service.images.map((_, i) => (
                            <button key={i} onClick={() => setActiveImage(i)} className={`h-1.5 rounded-full transition-all ${i === activeImage ? "w-5 bg-white shadow-2xs" : "w-1.5 bg-white/50"}`} aria-label={`Image ${i + 1}`} />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-200"><ImageIcon size={44} /></div>
                )}
              </div>
              {service.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pt-3">
                  {service.images.map((img, i) => (
                    <button key={i} onClick={() => setActiveImage(i)} className={`h-14 w-18 shrink-0 overflow-hidden rounded-lg border transition cursor-pointer ${i === activeImage ? "border-[#00B761] shadow-2xs" : "border-slate-100 opacity-60 hover:opacity-100"}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Service info */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#00B761]">
                  {service.category?.name}{service.subCategory ? ` · ${service.subCategory}` : ""}
                </p>
                {/* Service-type badge */}
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${getServiceTypeBadgeClass((service.deliveryModel ?? service.serviceType) ?? "direct")} flex items-center gap-1`}>
                  <span>{getServiceTypeEmoji((service.deliveryModel ?? service.serviceType) ?? "direct")}</span>
                  <span>{getServiceTypeLabel((service.deliveryModel ?? service.serviceType) ?? "direct")}</span>
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">{service.name}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Clock size={13} className="text-[#00B761]" />
                  {requiresInspection((service.deliveryModel ?? service.serviceType) ?? "direct")
                    ? `${service.duration} min inspection`
                    : `${service.duration} min`}
                </span>
                {service.serviceArea && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={13} className="text-[#00B761]" /> {service.serviceArea}
                  </span>
                )}
                {((service.deliveryModel ?? service.serviceType) === "inspection_required") && service.estimatedProjectDays && (
                  <span className="inline-flex items-center gap-1 text-blue-600">
                    ~{service.estimatedProjectDays} day{service.estimatedProjectDays > 1 ? "s" : ""} project
                  </span>
                )}
              </div>
            </div>

            {/* Booking-flow info panel */}
            <div className={`rounded-2xl border p-5 flex items-start gap-3.5 ${
              (service.deliveryModel ?? service.serviceType) === "inspection_required" ? "border-blue-100 bg-blue-50/30" :
              (service.deliveryModel ?? service.serviceType) === "custom"      ? "border-emerald-100 bg-emerald-50/30" :
              "border-emerald-100 bg-[#E6F7F0]/30"
            }`}>
              <div className="mt-0.5 text-lg shrink-0">
                {(service.deliveryModel ?? service.serviceType) === "inspection_required" ? "🏠" :
                 (service.deliveryModel ?? service.serviceType) === "custom"      ? "🎨" : "⚡"}
              </div>
              <div>
                <p className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">How this booking works</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  {getBookingFlowDescription((service.deliveryModel ?? service.serviceType) ?? "direct")}
                </p>
                {(service.deliveryModel ?? service.serviceType) === "inspection_required" && (
                  <p className="mt-2 text-xs font-bold text-blue-700">
                    {service.freeInspection
                      ? "✓ Free inspection visit included"
                      : `Inspection visit fee: ₹${service.inspectionFee}`}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <article className="rounded-2xl border border-slate-100 bg-white p-6 shadow-2xs">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">About this service</h2>
              <p className="mt-3 whitespace-pre-line text-xs sm:text-sm leading-relaxed text-slate-600">{service.description}</p>
              {service.tags.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {service.tags.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500"><TagIcon size={10} /> {t}</span>
                  ))}
                </div>
              )}
            </article>

            {/* Slot picker — only for instant and visit_first */}
            {isProviderOffline ? (
              <section id="available-slots" className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 text-center">
                <div className="max-w-md mx-auto">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-slate-500">
                    <Clock size={16} />
                  </div>
                  <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                    {liveStatus.onlineStatus === "offline" ? "Provider Offline" : "Provider Busy"}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {liveStatus.onlineStatus === "offline"
                      ? "This provider is currently offline and cannot accept new requests right now."
                      : "This provider is currently busy and cannot accept new requests right now."}
                  </p>
                  <p className="mt-3 text-xs text-slate-500">
                    You can still send them a message — they&apos;ll respond when they&apos;re available.
                  </p>
                </div>
              </section>
            ) : (service.deliveryModel ?? service.serviceType) === "direct" ? (
              <section id="available-slots" className="rounded-2xl border border-slate-100 bg-white p-6 shadow-2xs">
                <h2 className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">
                  <CalendarDays size={14} className="text-[#00B761]" />
                  Request this Service
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  Request an instant order response (within 30 minutes) or schedule a specific time with the provider.
                </p>
                <div className="flex">
                  <Link
                    href={`/request-service?serviceId=${service.id}&providerId=${providerId}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#00B761] hover:bg-[#009E52] px-5 py-2.5 text-xs font-bold text-white transition-all shadow-md shadow-[#00B761]/10 cursor-pointer"
                  >
                    Request Service
                  </Link>
                </div>
              </section>
            ) : (service.deliveryModel ?? service.serviceType) === "inspection_required" ? (
              <section id="available-slots" className="rounded-2xl border border-blue-100 bg-blue-50/20 p-6">
                <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-2">
                  🏠 Request Inspection Visit
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  This service requires an on-site inspection before pricing. The provider will visit, assess the work, and send you a detailed quotation.
                </p>
                <Link
                  href={`/request-inspection?serviceId=${service.id}&providerId=${providerId}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-slate-900/10 transition-all cursor-pointer"
                >
                  Request Inspection
                </Link>
              </section>
            ) : (
              /* custom service — redirect to custom request flow */
              <section id="available-slots" className="rounded-2xl border border-[#99E2C0] bg-[#E6F7F0]/20 p-6">
                <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-2">
                  <Palette size={14} className="text-[#00B761]" /> Custom Service Request
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  This is a custom-scoped service. Describe your exact requirements and receive
                  competitive quotes from multiple providers.
                </p>
                <Link
                  href={`/request-custom?categoryId=${service.category?.id ?? ""}&providerId=${providerId}&serviceId=${service.id}`}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#00B761] hover:bg-[#009E52] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#00B761]/10 transition-all cursor-pointer"
                >
                  Post a Custom Request
                </Link>
              </section>
            )}
          </section>

          {/* Right: Sticky booking card (desktop) */}
          <aside className="hidden lg:block">
            <div className="sticky top-5 space-y-4">
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-2xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Price</p>
                <p className="mt-1 text-2xl font-black text-slate-950 tracking-tight">
                  {getDisplayPrice(service.price, service.pricingModel ?? "fixed", service.priceUnit)}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {getPriceSubline(service.pricingModel ?? "fixed", service.duration, service.estimatedProjectDays) ??
                    `${service.duration} min`}
                </p>

                {/* Booking flow info box */}
                <div className={`mt-4 rounded-xl border p-3 ${
                  (service.deliveryModel ?? service.serviceType) === "inspection_required" ? "border-blue-100 bg-blue-50/50" :
                  (service.deliveryModel ?? service.serviceType) === "custom"      ? "border-emerald-100 bg-emerald-50/50" :
                  "border-emerald-100 bg-[#E6F7F0]/30"
                }`}>
                  <p className={`text-[10px] font-bold flex items-center gap-1.5 uppercase ${
                    (service.deliveryModel ?? service.serviceType) === "inspection_required" ? "text-blue-700" :
                    (service.deliveryModel ?? service.serviceType) === "custom"      ? "text-emerald-700" :
                    "text-[#00B761]"
                  }`}>
                    <ClipboardList size={12} />
                    {(service.deliveryModel ?? service.serviceType) === "direct"
                      ? "Request or Schedule"
                      : (service.deliveryModel ?? service.serviceType) === "inspection_required"
                      ? "Request Inspection"
                      : "Post Custom Request"}
                  </p>
                </div>

                {/* Trust elements */}
                <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-600">
                  <p className="flex items-center gap-2">
                    <Shield size={13} className="text-[#00B761]" />
                    {getPaymentFlowDescription((service.deliveryModel ?? service.serviceType) ?? "direct")}
                  </p>
                  <p className="flex items-center gap-2">
                    <BadgeCheck size={13} className="text-[#00B761]" /> Verified professional
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock size={13} className="text-amber-500" /> Quick response time
                  </p>
                </div>
              </div>

              {provider && (
                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-2xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Provider</p>
                  <Link href={`/providers/${providerId}`} className="mt-3.5 flex items-center gap-3.5 group">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-[#00B761] font-bold text-base overflow-hidden shrink-0">
                      {(provider as { headshot?: string }).headshot ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={(provider as { headshot?: string }).headshot} alt="" className="h-full w-full object-cover" />
                      ) : (provider.businessName ?? provider.name ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-xs sm:text-sm truncate group-hover:text-[#00B761] transition-colors">{provider.businessName ?? provider.name}</p>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#00B761] mt-0.5"><BadgeCheck size={11} /> Verified</span>
                    </div>
                  </Link>

                  {liveStatus.onlineStatus && (
                    <div className="mt-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        liveStatus.onlineStatus === "online"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-50 text-slate-500 border border-slate-100"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          liveStatus.onlineStatus === "online" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                        }`} />
                        {liveStatus.onlineStatus === "online"
                          ? (liveStatus.engagementStatus === "busy" ? "Online · Busy" : "Online · Available")
                          : "Offline"}
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
                      className="mt-4 w-full rounded-xl border border-emerald-100 bg-[#E6F7F0]/30 py-2.5 text-xs font-bold text-[#00B761] hover:bg-[#E6F7F0]/60 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <MessageSquare size={13} /> Message Provider
                    </button>
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile bottom bar */}
      <div className="fixed bottom-0 inset-x-0 lg:hidden border-t border-slate-200/60 bg-white/95 backdrop-blur-md px-5 py-4 flex items-center justify-between z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
        <div>
          <p className="text-lg font-black text-slate-900">
            {getDisplayPrice(service.price, service.pricingModel ?? "fixed", service.priceUnit)}
          </p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
            {requiresInspection((service.deliveryModel ?? service.serviceType) ?? "direct")
              ? `${service.duration} min inspection`
              : `${service.duration} min`}
          </p>
        </div>
        {isProviderOffline ? (
          <span className="rounded-xl bg-slate-100 border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-400 cursor-not-allowed">
            {liveStatus.onlineStatus === "offline" ? "Offline" : "Busy"}
          </span>
        ) : requiresServiceRequest((service.deliveryModel ?? service.serviceType) ?? "direct") ? (
          <Link
            href={`/request-custom?categoryId=${service.category?.id ?? ""}&providerId=${providerId}&serviceId=${service.id}`}
            className="rounded-xl bg-[#00B761] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#00B761]/10 hover:shadow-lg transition-all cursor-pointer"
          >
            Post Request
          </Link>
        ) : requiresInspection((service.deliveryModel ?? service.serviceType) ?? "direct") ? (
          <Link
            href={`/request-inspection?serviceId=${service.id}&providerId=${providerId}`}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-slate-900/10 hover:shadow-lg transition-all cursor-pointer"
          >
            Request Inspection
          </Link>
        ) : (
          <Link
            href={`/request-service?serviceId=${service.id}&providerId=${providerId}`}
            className="rounded-xl bg-[#00B761] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#00B761]/10 hover:shadow-lg transition-all cursor-pointer"
          >
            {getBookingCTA((service.deliveryModel ?? service.serviceType) ?? "direct")}
          </Link>
        )}
      </div>

      {/* Slot confirmation modal */}
      {showSlotModal && selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {(service.deliveryModel ?? service.serviceType) === "inspection_required" ? "Confirm inspection visit" : "Confirm slot"}
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              {(service.deliveryModel ?? service.serviceType) === "inspection_required"
                ? "The provider will visit to assess the work and send you a quote."
                : "You're about to book this time slot"}
            </p>

            <div className="rounded-xl bg-slate-50 p-4 space-y-2 mb-6 border border-slate-100">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-medium">Service</span>
                <span className="font-bold text-slate-900">{service?.name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-medium">Date</span>
                <span className="font-bold text-slate-900">{formatDateLabel(selectedSlot.date)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-medium">Time</span>
                <span className="font-bold text-slate-900">{selectedSlot.startTime} – {selectedSlot.endTime}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-medium">
                  {(service.deliveryModel ?? service.serviceType) === "inspection_required" ? "Inspection" : "Price"}
                </span>
                <span className="font-black text-[#00B761]">
                  {(service.deliveryModel ?? service.serviceType) === "inspection_required"
                    ? (service.freeInspection ? "Free" : `₹${service.inspectionFee}`)
                    : getDisplayPrice(service.price, service.pricingModel ?? "fixed", service.priceUnit)}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowSlotModal(false); setSelectedSlot(null); }}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmSlotAndProceed}
                className="flex-1 rounded-xl bg-[#00B761] py-2.5 text-xs font-bold text-white hover:bg-[#009E52] transition cursor-pointer"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
      </main>
    </UserShell>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Loader2, ArrowLeft, ImagePlus, Trash2, CheckCircle2,
  ChevronRight, Palette, FileText,
} from "lucide-react";
import { AddressContactStep } from "@/components/booking/AddressContactStep";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { serviceService } from "@/services/service";
import { orderService } from "@/services/order";
import { userService } from "@/services/user";
import { Service, IntakeField } from "@/types/service.types";
import { Address } from "@/types/user.types";
import { getErrorMessage } from "@/utils/errorHandler";
import { LoginRequiredPrompt } from "@/components/auth/LoginRequiredPrompt";
import { Role } from "@/enums/role.enum";

// ── Dynamic intake field renderer ────────────────────────────────────────────
function IntakeFieldInput({
  field,
  value,
  onChange,
  error,
}: {
  field: IntakeField;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const base =
    `w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-purple-100 ` +
    (error ? "border-red-300 bg-red-50 focus:border-red-400" : "border-slate-200 focus:border-purple-400");

  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
        {field.label}
        {field.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      {field.type === "textarea" && (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? ""}
          rows={3}
          className={`${base} resize-none`}
        />
      )}

      {field.type === "select" && (
        <select value={value} onChange={(e) => onChange(e.target.value)} className={base}>
          <option value="">Select an option</option>
          {(field.options ?? []).filter(Boolean).map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      )}

      {field.type === "date" && (
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={new Date().toISOString().split("T")[0]}
          className={base}
        />
      )}

      {(field.type === "text" || field.type === "number" || field.type === "file") && (
        <input
          type={field.type === "file" ? "text" : field.type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? ""}
          className={base}
        />
      )}

      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function RequestCustomPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, isInitialized, role } = useSelector((s: RootState) => s.auth);
  const canAccess = isInitialized && isAuthenticated && role === Role.USER;

  const prefilledServiceId = searchParams?.get("serviceId") || "";
  const prefilledProviderId = searchParams?.get("providerId") || "";
  const prefilledCategoryId = searchParams?.get("categoryId") || "";

  const [service, setService] = useState<Service | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [budgetType, setBudgetType] = useState<"fixed" | "flexible" | "quote_needed">("quote_needed");
  const [images, setImages] = useState<string[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [intakeResponses, setIntakeResponses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [contactPhone, setContactPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const intakeFields: IntakeField[] = service?.intakeFields ?? [];

  useEffect(() => {
    if (!canAccess) return;

    const fetches: Promise<unknown>[] = [userService.getProfile()];
    if (prefilledServiceId) {
      fetches.push(serviceService.publicGet(prefilledServiceId));
    }

    Promise.all(fetches)
      .then(([uRes, sRes]) => {
        const profile = (uRes as { data: { data: { addresses?: Address[]; phone?: string } } }).data.data;
        const addrs = profile.addresses || [];
        setAddresses(addrs);
        setSelectedAddress(addrs.find((a) => a.isDefault) || addrs[0] || null);
        if (profile.phone) setContactPhone(profile.phone.replace(/^\+91/, "").replace(/\D/g, "").slice(0, 10));

        if (sRes) {
          const svc = (sRes as { data: { data: Service } }).data.data;
          setService(svc);
          // Pre-populate title from service name
          setTitle(svc.name);
        }
      })
      .catch(() => toast.error("Failed to load data"))
      .finally(() => setLoading(false));
  }, [canAccess, prefilledServiceId]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!title.trim() || title.trim().length < 5) e.title = "Title must be at least 5 characters";
    if (!description.trim() || description.trim().length < 10) e.description = "Description must be at least 10 characters";
    if (!selectedAddress) e.address = "Please select a service address";
    const phone = contactPhone.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setPhoneError("Enter a valid 10-digit Indian mobile number");
      e.phone = "invalid";
    } else {
      setPhoneError("");
    }

    // Validate required intake fields
    for (const field of intakeFields) {
      if (field.required && !intakeResponses[field.id]?.trim()) {
        e[`intake_${field.id}`] = `${field.label} is required`;
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) { toast.error("Please fix the errors"); return; }
    if (!prefilledProviderId) { toast.error("No provider specified"); return; }
    if (!selectedAddress) return;

    const categoryId = prefilledCategoryId || service?.category?.id || "";
    if (!categoryId) { toast.error("Category is missing"); return; }

    setSubmitting(true);
    try {
      const res = await orderService.createCustom({
        categoryId,
        providerId: prefilledProviderId,
        serviceId: prefilledServiceId || undefined,
        title: title.trim(),
        description: description.trim(),
        budget: budget ? Number(budget) : undefined,
        budgetType,
        address: {
          street: selectedAddress.street,
          city: selectedAddress.city,
          state: selectedAddress.state,
          zip: selectedAddress.zip,
          country: selectedAddress.country,
        },
        contactPhone: contactPhone.replace(/\D/g, ""),
        images,
        intakeResponses: Object.keys(intakeResponses).length > 0 ? intakeResponses : undefined,
      });
      setOrderId(res.data.data.orderId);
      setSuccess(true);
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to create request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleImage = (files: FileList | null) => {
    if (!files || images.length >= 10) return;
    const file = files[0];
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5MB per image"); return; }
    const reader = new FileReader();
    reader.onload = () => setImages((p) => [...p, reader.result as string]);
    reader.readAsDataURL(file);
  };

  if (isInitialized && !canAccess) {
    return <LoginRequiredPrompt title="Login required" message="Sign in to request this service." />;
  }
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-purple-500" size={32} />
      </main>
    );
  }

  if (success) {
    return (
      <main className="min-h-screen bg-[var(--surface-2)] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl border border-slate-100">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-purple-100">
            <CheckCircle2 size={40} className="text-purple-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-950">Request Sent!</h1>
          <p className="mt-2 text-sm text-slate-500">
            Your custom service request has been sent to the provider. They will review it and send you a quotation.
          </p>
          <div className="mt-5 rounded-xl bg-slate-50 border border-slate-100 p-4">
            <p className="text-xs text-slate-500">Order ID</p>
            <p className="text-lg font-black text-purple-600">{orderId}</p>
            <p className="text-xs text-slate-400 mt-1">You&apos;ll be notified when the provider responds</p>
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
      <div className="mx-auto max-w-2xl px-4 py-8">
        <button
          onClick={() => router.back()}
          className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-purple-600"
        >
          <ArrowLeft size={14} /> Back
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-full bg-purple-50 px-2.5 py-1 text-[11px] font-bold text-purple-700">
              🎨 Custom Request
            </span>
            {service && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                {service.name}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-black text-slate-950">Request Custom Service</h1>
          <p className="text-sm text-slate-500 mt-1">
            Describe your project — the provider will review and send you a personalised quotation
          </p>
        </div>

        {/* How it works */}
        <div className="rounded-xl border border-purple-100 bg-purple-50/60 p-4 mb-6 flex items-start gap-3">
          <Palette size={18} className="text-purple-600 shrink-0 mt-0.5" />
          <div className="text-xs text-purple-800 leading-relaxed">
            <p className="font-bold mb-1">How it works:</p>
            <ol className="list-decimal pl-4 space-y-0.5">
              <li>Fill in your requirements below</li>
              <li>Provider reviews and sends you a quotation</li>
              <li>Accept or request changes to the quote</li>
              <li>Provider starts work once you approve</li>
              <li>Pay via invoice after work is done</li>
            </ol>
          </div>
        </div>

        {/* Project title */}
        <section className="premium-card p-5 mb-5">
          <h3 className="text-sm font-black text-slate-900 mb-3">Project Title *</h3>
          <input
            value={title}
            onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: "" })); }}
            maxLength={200}
            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-purple-100 ${errors.title ? "border-red-300 bg-red-50" : "border-slate-200 focus:border-purple-400"}`}
            placeholder="e.g. Interior house painting – 3BHK apartment"
          />
          {errors.title && <p className="mt-1 text-xs font-medium text-red-600">{errors.title}</p>}
        </section>

        {/* Service-specific intake fields */}
        {intakeFields.length > 0 && (
          <section className="premium-card p-5 mb-5">
            <h3 className="text-sm font-black text-slate-900 mb-1 flex items-center gap-2">
              <FileText size={14} className="text-purple-600" />
              Service Details
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              The provider needs these details to prepare an accurate quote
            </p>
            <div className="space-y-4">
              {intakeFields.map((field) => (
                <IntakeFieldInput
                  key={field.id}
                  field={field}
                  value={intakeResponses[field.id] ?? ""}
                  onChange={(v) => {
                    setIntakeResponses((prev) => ({ ...prev, [field.id]: v }));
                    setErrors((p) => ({ ...p, [`intake_${field.id}`]: "" }));
                  }}
                  error={errors[`intake_${field.id}`]}
                />
              ))}
            </div>
          </section>
        )}

        {/* Description */}
        <section className="premium-card p-5 mb-5">
          <h3 className="text-sm font-black text-slate-900 mb-3">Additional Details *</h3>
          <textarea
            value={description}
            onChange={(e) => { setDescription(e.target.value); setErrors((p) => ({ ...p, description: "" })); }}
            rows={5}
            maxLength={3000}
            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none resize-none transition focus:ring-2 focus:ring-purple-100 ${errors.description ? "border-red-300 bg-red-50" : "border-slate-200 focus:border-purple-400"}`}
            placeholder="Describe your project in detail — timeline expectations, any special requirements, preferred approach..."
          />
          <div className="flex items-center justify-between mt-1">
            {errors.description
              ? <p className="text-xs font-medium text-red-600">{errors.description}</p>
              : <span className="text-xs text-slate-400">Min 10 characters</span>}
            <span className="text-xs text-slate-400">{description.length}/3000</span>
          </div>

          {/* Reference images */}
          <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs font-semibold text-purple-600 hover:text-purple-700">
            <ImagePlus size={14} /> Add reference images ({images.length}/10)
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImage(e.target.files)}
            />
          </label>
          {images.length > 0 && (
            <div className="mt-2 flex gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <div key={i} className="relative h-16 w-16 shrink-0 rounded-lg overflow-hidden border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" className="h-full w-full object-cover" />
                  <button
                    onClick={() => setImages((p) => p.filter((_, idx) => idx !== i))}
                    className="absolute top-0 right-0 rounded-full bg-white/90 p-0.5 text-red-500"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Budget */}
        <section className="premium-card p-5 mb-5">
          <h3 className="text-sm font-black text-slate-900 mb-3">Your Budget</h3>
          <div className="grid gap-2 sm:grid-cols-3 mb-3">
            {([
              { value: "quote_needed" as const, label: "Ask for quote", desc: "Let provider suggest" },
              { value: "flexible" as const, label: "Flexible", desc: "Have a rough range" },
              { value: "fixed" as const, label: "Fixed", desc: "Know exact budget" },
            ]).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setBudgetType(opt.value)}
                className={`rounded-xl border-2 p-3 text-left transition ${budgetType === opt.value ? "border-purple-500 bg-purple-50" : "border-slate-200 hover:border-slate-300"}`}
              >
                <p className="text-xs font-black text-slate-900">{opt.label}</p>
                <p className="text-[11px] text-slate-500">{opt.desc}</p>
              </button>
            ))}
          </div>
          {budgetType !== "quote_needed" && (
            <input
              type="number"
              min={0}
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-purple-400"
              placeholder={budgetType === "fixed" ? "Your budget (₹)" : "Approximate budget (₹)"}
            />
          )}
        </section>

        {/* Address + Contact */}
        <AddressContactStep
          addresses={addresses}
          selectedAddress={selectedAddress}
          onSelectAddress={(a) => { setSelectedAddress(a); setErrors((p) => ({ ...p, address: "" })); }}
          contactPhone={contactPhone}
          onPhoneChange={(v) => { setContactPhone(v); setPhoneError(""); }}
          phoneError={phoneError}
          addressError={errors.address}
          onAddressAdded={(addr) => setAddresses((prev) => [...prev, addr])}
          accentColor="purple"
        />

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="btn btn-primary w-full py-4 text-base"
        >
          {submitting
            ? <Loader2 size={18} className="animate-spin" />
            : <ChevronRight size={18} />}
          Send Request to Provider
        </button>
      </div>
    </main>
  );
}

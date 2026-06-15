"use client";

/* eslint-disable @next/next/no-img-element */

/**
 * Provider Reapply Page
 * Allows providers whose applications were rejected to update their details
 * and resubmit using the authenticated PUT /provider/reapply endpoint.
 * Only accessible to logged-in users who have a rejected application.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, Loader2, CheckCircle2,
  Camera, Edit2, UploadCloud, MapPin, ShieldCheck, BriefcaseBusiness, ChevronDown, AlertTriangle, CalendarDays, MessageSquare,
} from "lucide-react";
import toast from "react-hot-toast";
import { providerService } from "@/services/provider";
import { categoryService } from "@/services/category";
import { ImageCropper } from "@/components/common/ImageCropper";
import { LocationSelector } from "@/components/user/LocationSelector";
import { getErrorMessage } from "@/utils/errorHandler";
import { ProviderApplicationStatus } from "@/types/provider.types";
import { useDispatch } from "react-redux";
import { setApplicationStatus as setStoreApplicationStatus } from "@/features/auth";

function formatDate(iso: string | null | undefined) {
  if (!iso) return null;
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
}

type CategoryOption = { id: string; name: string; subcategories: string[] };
type CropTarget = "photo" | "idFront" | "idBack" | null;

type ReapplyForm = {
  category: string;
  subCategory: string;
  businessName: string;
  experience: string;
  description: string;
  documentType: string;
  photo: string | null;
  photoUrl: string;
  idFront: string | null;
  idFrontUrl: string;
  idBack: string | null;
  idBackUrl: string;
  street: string;
  city: string;
  zip: string;
};

export default function ProviderReapplyPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [_rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [applicationStatus, setApplicationStatus] = useState<ProviderApplicationStatus | null>(null);
  const [cropTarget, setCropTarget] = useState<CropTarget>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  // Structured location state — backed by LocationSelector component
  const [location, setLocation] = useState<import("@/components/user/LocationSelector").LocationValue>({
    country: "India",
    countryCode: "IN",
    state: "",
    stateCode: "",
    district: "",
    city: "",
    pincode: "",
    fullAddress: "",
    latitude: undefined,
    longitude: undefined,
  });

  const [form, setForm] = useState<ReapplyForm>({
    category: "",
    subCategory: "",
    businessName: "",
    experience: "1-3 Years",
    description: "",
    documentType: "Passport",
    photo: null,
    photoUrl: "",
    idFront: null,
    idFrontUrl: "",
    idBack: null,
    idBackUrl: "",
    street: "",
    city: "",
    zip: "",
  });

  // Load categories and current application status
  useEffect(() => {
    const init = async () => {
      try {
        const [catRes, statusRes] = await Promise.all([
          categoryService.getAll(),
          providerService.getApplicationStatus(),
        ]);

        const catData = catRes.data.data || catRes.data;
        const cats = (catData.items || (Array.isArray(catData) ? catData : [])).map((c) => ({
          id: c._id,
          name: c.name,
          subcategories: (c.subcategories || []).map((s) => s.name),
        }));
        setCategories(cats);

        const status = statusRes.data.data;
        setApplicationStatus(status);

        // Guard: only rejected applications can reapply
        if (status.status !== "rejected") {
          toast.error("You can only reapply if your application was rejected.");
          router.replace("/provider-portal/dashboard");
          return;
        }

        setRejectionReason(status.rejectionReason);

        // Pre-populate form with previously submitted data so provider only fixes issues
        const catId = typeof status.category === "object" && status.category
          ? (status.category as { _id: string })._id
          : "";
        const catName = cats.find((c) => c.id === catId)?.name || "";
        setForm((prev) => ({
          ...prev,
          category: catName,
          subCategory: status.subCategory || "",
          experience: status.experience || "1-3 Years",
          description: status.description || "",
          documentType: status.documentType || "Passport",
          street: status.address?.street || "",
          city: status.address?.city || "",
          zip: status.address?.zip || "",
          // Pre-populate headshot URL from stored data so provider sees their previous photo
          photoUrl: (status.headshot && !status.headshot.startsWith("data:") && status.headshot !== "photo.jpg")
            ? status.headshot
            : "",
        }));

        // Pre-fill structured location state from previous application
        const prevCity = status.address?.city || "";
        const prevPincode = status.address?.zip || "";
        if (prevCity || prevPincode) {
          setLocation((prev) => ({
            ...prev,
            city: prevCity,
            pincode: prevPincode,
            fullAddress: status.address?.street || "",
          }));
        }
      } catch {
        toast.error("Session expired or not logged in. Please sign in to continue.");
        router.replace("/provider-portal/login");
      } finally {
        setInitialLoading(false);
      }
    };
    init();
  }, [router]);

  const update = <K extends keyof ReapplyForm>(field: K, value: ReapplyForm[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.category) newErrors.category = "Category is required";
    if (!form.description.trim()) newErrors.description = "Description is required";
    else if (form.description.trim().length < 50) newErrors.description = "Description must be at least 50 characters";
    if (!form.photoUrl) newErrors.photo = "Headshot is required";
    if (!form.idFrontUrl) newErrors.idFront = "ID Front is required";
    if (!form.idBackUrl) newErrors.idBack = "ID Back is required";
    if (!location.country) newErrors.country = "Country is required";
    if (!location.state) newErrors.state = "State is required";
    if (!location.city) newErrors.city = "City is required";
    if (!location.pincode || location.pincode.length < 4) newErrors.pincode = "Valid pincode is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast.error("Please fix all validation errors before submitting.");
      return;
    }
    if (!applicationStatus) return;

    const categoryId = categories.find((c) => c.name === form.category)?.id || form.category;
    const street = location.fullAddress?.trim() || "";
    const serviceArea = [street, location.place, location.city, location.state, location.pincode].filter(Boolean).join(", ");

    setLoading(true);
    try {
      await providerService.reapply({
        // Use the stored personal details from the original application
        fullName: applicationStatus.fullName || "",
        email: applicationStatus.email || "",
        phone: applicationStatus.phone || "",
        businessName: form.businessName || undefined,
        categoryId,
        subCategory: form.subCategory,
        experience: form.experience,
        address: { street: street || serviceArea, city: location.city, zip: location.pincode },
        serviceArea,
        description: form.description,
        documentType: form.documentType,
        headshot: form.photo || "",
        documents: [form.idFront, form.idBack].filter((d): d is string => Boolean(d)),
        // Structured location for geospatial indexing
        state: location.state,
        district: location.district,
        city: location.city,
        pincode: location.pincode,
        fullAddress: serviceArea,
        ...(location.latitude && location.longitude
          ? { latitude: location.latitude, longitude: location.longitude }
          : {}),
        serviceRadius: 10,
      });
      setSubmitted(true);
      dispatch(setStoreApplicationStatus("pending"));
      toast.success("Application resubmitted successfully!");
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to resubmit application.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, target: CropTarget) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setSelectedImage(reader.result?.toString() || null);
        setCropTarget(target);
      });
      reader.readAsDataURL(e.target.files[0]);
    }
    e.target.value = "";
  };

  const onCropDone = (croppedFile: File) => {
    const url = URL.createObjectURL(croppedFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      if (cropTarget === "photo") { update("photo", base64); update("photoUrl", url); }
      else if (cropTarget === "idFront") { update("idFront", base64); update("idFrontUrl", url); }
      else if (cropTarget === "idBack") { update("idBack", base64); update("idBackUrl", url); }
      setCropTarget(null);
    };
    reader.readAsDataURL(croppedFile);
  };

  if (initialLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="flex min-h-screen flex-col bg-slate-50">
        <header className="flex h-16 items-center border-b bg-white px-6">
          <Link href="/provider-portal" className="flex items-center gap-2 text-indigo-700">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
              <BriefcaseBusiness size={18} />
            </div>
            <span className="text-xl font-black">AllServe Pro</span>
          </Link>
        </header>
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm border border-slate-100">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={34} />
            </div>
            <h1 className="mt-6 text-2xl font-bold text-slate-900">Application Resubmitted</h1>
            <p className="mt-3 text-sm text-slate-500">
              Your updated application is under review. We&apos;ll notify you once a decision is made.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Link href="/provider-portal/status" className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700">
                Check Status
              </Link>
              <Link href="/provider-portal" className="rounded-lg bg-slate-100 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-200">
                Back Home
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#F8F9FA]">
      {cropTarget && selectedImage && (
        <ImageCropper
          imageSrc={selectedImage}
          onCropDone={onCropDone}
          onCancel={() => setCropTarget(null)}
          aspectRatio={cropTarget === "photo" ? 1 : 1.58}
        />
      )}

      {/* Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
        <Link href="/provider-portal" className="flex items-center gap-2 text-indigo-700">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
            <BriefcaseBusiness size={18} />
          </div>
          <span className="text-xl font-black">AllServe Pro</span>
        </Link>
        <Link href="/provider-portal/status" className="text-sm font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1">
          <ArrowLeft size={14} /> Back to Status
        </Link>
      </header>

      <div className="flex-1 overflow-y-auto p-6 md:p-10">
        <div className="mx-auto max-w-3xl">

          {/* Page Title */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-1.5 text-sm font-semibold text-red-600 mb-4">
              <AlertTriangle size={14} /> Application Requires Updates
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Reapply as Provider</h1>
            <p className="mt-2 text-slate-600">
              Address the rejection feedback below and resubmit your updated application.
            </p>
          </div>

          {/* Rejection Reason Banner */}
          {applicationStatus && (
            <div className="mb-8 rounded-2xl border border-red-200 bg-white overflow-hidden shadow-sm">
              <div className="bg-red-50 px-5 py-4 border-b border-red-100 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600 shrink-0">
                  <AlertTriangle size={16} />
                </div>
                <div>
                  <p className="text-sm font-bold text-red-800">Why was your application rejected?</p>
                  {applicationStatus.rejectedAt && (
                    <p className="text-xs text-red-500 flex items-center gap-1 mt-0.5">
                      <CalendarDays size={10} /> Rejected on {formatDate(applicationStatus.rejectedAt)}
                    </p>
                  )}
                </div>
              </div>
              <div className="px-5 py-4 space-y-3">
                {applicationStatus.rejectionReason && (
                  <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                    <div className="mt-1 h-2 w-2 rounded-full bg-red-500 shrink-0" />
                    <p className="text-sm font-semibold text-red-800">{applicationStatus.rejectionReason}</p>
                  </div>
                )}
                {applicationStatus.adminRemarks && (
                  <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <MessageSquare size={11} /> Admin Remarks
                    </p>
                    <p className="text-sm text-slate-700 italic leading-relaxed">&ldquo;{applicationStatus.adminRemarks}&rdquo;</p>
                  </div>
                )}
                <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-3">
                  <p className="text-xs text-indigo-600 leading-relaxed">
                    ✦ Your previously submitted details have been pre-loaded below. Only update the fields that caused the rejection.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <div className="grid gap-6 md:grid-cols-2">

            {/* Left Column */}
            <div className="space-y-6">
              {/* Category & Experience */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-slate-900">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <BriefcaseBusiness size={18} />
                  </div>
                  Service Details
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Primary Category <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        className={`w-full appearance-none rounded-lg border bg-white px-4 py-2.5 text-sm outline-none transition ${errors.category ? "border-red-400" : "border-slate-200 focus:border-indigo-500"}`}
                        value={form.category}
                        onChange={(e) => update("category", e.target.value)}
                      >
                        <option value="">Select Category</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-3 text-slate-400 pointer-events-none" />
                    </div>
                    {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category}</p>}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Subcategory</label>
                    <div className="relative">
                      <select
                        className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-500"
                        value={form.subCategory}
                        onChange={(e) => update("subCategory", e.target.value)}
                      >
                        <option value="">Select Subcategory</option>
                        {categories.find((c) => c.name === form.category)?.subcategories?.map((sub) => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-3 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Years of Experience</label>
                    <div className="grid grid-cols-3 gap-2">
                      {["1-3 Years", "3-7 Years", "7+ Years"].map((exp) => (
                        <button
                          key={exp}
                          onClick={() => update("experience", exp)}
                          className={`rounded-lg border py-2.5 text-sm font-medium transition-colors ${form.experience === exp ? "border-indigo-500 bg-indigo-50 text-indigo-600" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                        >
                          {exp}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Business / Brand Name <span className="text-slate-400 text-xs font-normal">(optional)</span>
                    </label>
                    <input type="text" placeholder="e.g. QuickFix Plumbing, Sharma Electricals" className="w-full rounded-lg border border-slate-200 bg-[#F8FAFC] px-4 py-2.5 text-sm outline-none transition hover:border-slate-300 focus:border-indigo-500" value={form.businessName} onChange={e => setForm(prev => ({ ...prev, businessName: e.target.value }))} maxLength={100} />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Professional Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      className={`min-h-[120px] w-full resize-none rounded-lg border px-4 py-3 text-sm outline-none transition ${errors.description ? "border-red-400 bg-red-50" : "border-slate-200 focus:border-indigo-500"}`}
                      placeholder="Describe your expertise, certifications, and what makes you unique... (min 50 chars)"
                      value={form.description}
                      onChange={(e) => update("description", e.target.value.substring(0, 500))}
                    />
                    {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
                    <div className="mt-1 text-right text-xs text-slate-400">{form.description.length} / 500</div>
                  </div>
                </div>
              </div>

              {/* Profile Photo */}
              <div className={`rounded-2xl border bg-white p-6 shadow-sm ${errors.photo ? "border-red-400" : "border-slate-200"}`}>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <Camera size={18} />
                  </div>
                  Profile Headshot
                </h2>
                <div className="flex flex-col items-center py-4">
                  <div className="relative mb-4 h-28 w-28 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden bg-slate-50">
                    {form.photoUrl ? (
                      <img src={form.photoUrl} alt="Headshot" className="h-full w-full object-cover" />
                    ) : (
                      <Camera size={28} className="text-slate-400" />
                    )}
                    <label className="absolute bottom-1 right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-indigo-600 text-white shadow-md hover:bg-indigo-700 transition">
                      <Edit2 size={14} />
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageSelect(e, "photo")} />
                    </label>
                  </div>
                  <p className="text-xs text-slate-500">JPG, PNG up to 5MB</p>
                  {errors.photo && <p className="mt-2 text-xs text-red-500 font-medium">{errors.photo}</p>}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* ID Verification */}
              <div className={`rounded-2xl border bg-white p-6 shadow-sm ${errors.idFront || errors.idBack ? "border-red-400" : "border-slate-200"}`}>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <ShieldCheck size={18} />
                  </div>
                  ID Verification
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-700">Document Type</label>
                    <div className="relative">
                      <select
                        className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-500"
                        value={form.documentType}
                        onChange={(e) => update("documentType", e.target.value)}
                      >
                        <option value="Passport">Passport</option>
                        <option value="Driver's License">Driver&apos;s License</option>
                        <option value="National ID">National ID</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-3 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {(["idFront", "idBack"] as const).map((side) => (
                      <div key={side} className="flex flex-col">
                        <label className={`flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed py-6 transition overflow-hidden relative min-h-[110px] ${errors[side] ? "border-red-300 bg-red-50" : "border-indigo-200 bg-slate-50 hover:bg-indigo-50"}`}>
                          {form[`${side}Url`] && (
                            <img src={form[`${side}Url`]} alt={side} className="absolute inset-0 h-full w-full object-cover opacity-80" />
                          )}
                          <div className="relative z-10 flex flex-col items-center bg-white/70 backdrop-blur-sm p-2 rounded-lg">
                            <UploadCloud size={20} className="text-slate-600 mb-1" />
                            <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wide">
                              {side === "idFront" ? "Front Side" : "Back Side"}
                            </span>
                          </div>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageSelect(e, side === "idFront" ? "idFront" : "idBack")} />
                        </label>
                        {errors[side] && <span className="text-[10px] text-red-500 mt-1 text-center">{errors[side]}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Service Area */}
              <div className={`rounded-2xl border bg-white p-6 shadow-sm ${errors.country || errors.state || errors.city || errors.pincode ? "border-red-400" : "border-slate-200"}`}>
                <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-slate-900">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <MapPin size={18} />
                  </div>
                  Service Area
                </h2>
                <LocationSelector
                  value={location}
                  onChange={(next) => {
                    setLocation(next);
                    setErrors((prev) => {
                      const ne = { ...prev };
                      if (next.country) delete ne.country;
                      if (next.state) delete ne.state;
                      if (next.city) delete ne.city;
                      if (next.pincode) delete ne.pincode;
                      return ne;
                    });
                  }}
                  errors={{
                    country: errors.country,
                    state: errors.state,
                    city: errors.city,
                    pincode: errors.pincode,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Submit Footer */}
          <div className="mt-8 flex items-center justify-between">
            <Link href="/provider-portal/status" className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              <ArrowLeft size={16} /> Back to Status
            </Link>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/20 disabled:opacity-60"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <><ArrowRight size={16} /> Resubmit Application</>}
            </button>
          </div>

        </div>
      </div>
    </main>
  );
}

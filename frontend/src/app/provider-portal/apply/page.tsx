"use client";

/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  User, ShieldCheck, MapPin, Camera,
  ArrowRight, Loader2, CheckCircle2, ChevronDown, Edit2, UploadCloud, BriefcaseBusiness
} from "lucide-react";
import toast from "react-hot-toast";
import { providerService } from "@/services/provider";
import { categoryService } from "@/services/category";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { setApplicationStatus } from "@/features/auth";
import { ImageCropper } from "@/components/common/ImageCropper";
import { LocationSelector } from "@/components/user/LocationSelector";
import { getErrorMessage } from "@/utils/errorHandler";
import { useRouter } from "next/navigation";

type CategoryOption = { id: string; name: string; subcategories: string[] };

type ProviderApplicationForm = {
  name: string;
  email: string;
  phone: string;
  password: string;
  businessName: string;
  category: string;
  subCategory: string;
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

type CropTarget = "photo" | "idFront" | "idBack" | null;

const sanitizeIndianPhone = (value: string) => value.replace(/\D/g, "").slice(0, 10);
const formatIndianPhone = (value: string) => `+91${sanitizeIndianPhone(value)}`;

export default function ProviderApplicationPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, isAuthenticated, role, applicationStatus } = useSelector((state: RootState) => state.auth);
  
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  
  const [form, setForm] = useState<ProviderApplicationForm>({
    name: "",
    email: "",
    phone: "",
    password: "", // Not used
    businessName: "",
    category: "",
    subCategory: "",
    experience: "1-3 Years",
    description: "",
    documentType: "Passport",
    photo: null as string | null,
    photoUrl: "",
    idFront: null as string | null,
    idFrontUrl: "",
    idBack: null as string | null,
    idBackUrl: "",
    street: "",
    city: "",
    zip: "",
  });
  
  const [cropTarget, setCropTarget] = useState<CropTarget>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

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

  useEffect(() => {
    if (!isAuthenticated || role !== "provider") {
      router.replace("/provider-portal/login");
      return;
    }
    if (applicationStatus && applicationStatus !== "not_applied") {
      router.replace("/provider-portal/status");
      return;
    }

    if (user) {
      setForm(prev => ({
        ...prev,
        name: user.name,
        email: user.email,
        phone: (user as any).phone || "",
      }));
    }
  }, [user, isAuthenticated, role, applicationStatus, router]);

  useEffect(() => {
    categoryService.getAll().then((res) => {
      const data = res.data.data || res.data;
      const categories = data.items || (Array.isArray(data) ? data : []);
      setCategories(categories.map((c) => ({ id: c._id, name: c.name, subcategories: (c.subcategories || []).map((s) => s.name) })));
    }).catch(() => toast.error("Failed to load categories"));
  }, []);

  const update = <K extends keyof ProviderApplicationForm>(field: K, value: ProviderApplicationForm[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" })); // Clear error on change
  };

  const validateStep2 = () => {
    const newErrors: { [key: string]: string } = {};
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

  const handleFinalSubmit = async () => {
    if (!validateStep2()) {
      toast.error("Please complete all verification and location details");
      return;
    }
    
    const categoryId = categories.find(c => c.name === form.category)?.id || form.category;
    const street = location.fullAddress?.trim() || "";
    // Include place (locality) in the address so backend regex search can match it
    const serviceArea = [street, location.place, location.city, location.state, location.pincode].filter(Boolean).join(", ");

    setLoading(true);
    try {
      await providerService.apply({
        fullName: form.name,
        email: form.email,
        phone: formatIndianPhone(form.phone),
        businessName: form.businessName || undefined,
        categoryId: categoryId,
        subCategory: form.subCategory,
        experience: form.experience,
        address: { street: street || serviceArea, city: location.city, zip: location.pincode },
        serviceArea: serviceArea,
        description: form.description,
        documentType: form.documentType,
        headshot: form.photo || "photo.jpg",
        documents: [form.idFront, form.idBack].filter((doc): doc is string => Boolean(doc)),
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
      toast.success("Application submitted successfully!");
      dispatch(setApplicationStatus("pending"));
      setSuccess(true);
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to submit application");
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
    // Reset file input
    e.target.value = '';
  };

  const onCropDone = (croppedFile: File) => {
    const url = URL.createObjectURL(croppedFile);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;
      if (cropTarget === "photo") {
        update("photo", base64data);
        update("photoUrl", url);
      } else if (cropTarget === "idFront") {
        update("idFront", base64data);
        update("idFrontUrl", url);
      } else if (cropTarget === "idBack") {
        update("idBack", base64data);
        update("idBackUrl", url);
      }
      setCropTarget(null);
    };
    reader.readAsDataURL(croppedFile);
  };

  if (success) {
    return (
      <main className="flex min-h-screen flex-col bg-slate-50">
        <header className="flex h-16 items-center border-b bg-white px-6">
          <Link href="/provider-portal" className="flex items-center gap-2 text-indigo-700 hover:text-indigo-800 transition">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
              <BriefcaseBusiness size={18} />
            </div>
            <span className="text-xl font-black">AllServe Pro</span>
          </Link>
        </header>
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="max-w-lg rounded-2xl bg-white p-10 text-center shadow-sm border border-slate-100">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={40} />
            </div>
            <h1 className="mt-6 text-2xl font-bold text-slate-900">Application Submitted!</h1>
            <p className="mt-3 text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
              Your provider application is now under admin review. This usually takes 1–3 business days. You can track your application status anytime.
            </p>
            <div className="mt-4 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
              <p className="text-xs font-semibold text-amber-700">⏳ Status: Under Review</p>
            </div>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
              <Link href="/provider-portal/status" className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition">
                Track Application Status
              </Link>
              <Link href="/provider-portal" className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
                Back to Provider Portal
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
      
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
        <Link href="/provider-portal" className="flex items-center gap-2 text-indigo-700 hover:text-indigo-800 transition">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
            <BriefcaseBusiness size={18} />
          </div>
          <span className="text-xl font-black">AllServe Pro</span>
        </Link>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 shrink-0 flex flex-col justify-between border-r border-slate-200 bg-[#F8F9FA] p-6 hidden md:flex">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Onboarding</h2>
            <div className="mt-8 space-y-2">
              <div className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors bg-[#EEF2FF] text-[#4F46E5] border-l-4 border-[#4F46E5]">
                <ShieldCheck size={18} /> Application details
              </div>
            </div>
          </div>
          <button className="w-full rounded-lg bg-slate-100 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors">
            Save Progress
          </button>
        </aside>

        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="mx-auto max-w-3xl">
            
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900">Submit Application</h1>
              <p className="mt-2 text-slate-600">Complete your professional profile details.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-6">
                {/* Category Details */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-6 flex items-center gap-3 text-lg font-semibold text-slate-900">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#4F46E5]">
                      <BriefcaseBusiness size={18} />
                    </div>
                    Service Details
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">Primary Category <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <select className={`w-full appearance-none rounded-lg border bg-white px-4 py-2.5 text-sm outline-none transition ${errors.category ? "border-red-400 focus:border-red-500" : "border-slate-200 hover:border-slate-300 focus:border-[#4F46E5]"}`} value={form.category} onChange={e => update("category", e.target.value)}>
                          <option value="">Select Primary Category</option>
                          {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-3 text-slate-400 pointer-events-none" />
                      </div>
                      {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category}</p>}
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">Subcategory</label>
                      <div className="relative">
                        <select className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition hover:border-slate-300 focus:border-[#4F46E5]" value={form.subCategory} onChange={e => update("subCategory", e.target.value)}>
                          <option value="">Select Subcategory</option>
                          {categories.find(c => c.name === form.category)?.subcategories?.map(sub => (
                            <option key={sub} value={sub}>{sub}</option>
                          ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-3 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Years of Experience</label>
                      <div className="grid grid-cols-3 gap-3">
                        {["1-3 Years", "3-7 Years", "7+ Years"].map((exp) => (
                          <button
                            key={exp}
                            onClick={() => update("experience", exp)}
                            className={`rounded-lg border py-2.5 text-sm font-medium transition-colors ${
                              form.experience === exp ? "border-[#4F46E5] bg-[#EEF2FF] text-[#4F46E5]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            {exp}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">Business / Brand Name <span className="text-slate-400 text-xs font-normal">(optional)</span></label>
                      <input type="text" placeholder="e.g. QuickFix Plumbing, Sharma Electricals" className="w-full rounded-lg border border-slate-200 bg-[#F8FAFC] px-4 py-2.5 text-sm outline-none transition hover:border-slate-300 focus:border-[#4F46E5]" value={form.businessName} onChange={e => update("businessName", e.target.value)} maxLength={100} />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">Professional Description <span className="text-red-500">*</span></label>
                      <textarea 
                        placeholder="Describe your expertise, certifications, and what makes your service unique..."
                        className={`min-h-[120px] w-full resize-none rounded-lg border px-4 py-3 text-sm outline-none transition ${errors.description ? "border-red-400 focus:border-red-500 bg-red-50" : "border-slate-200 hover:border-slate-300 focus:border-[#4F46E5]"}`}
                        value={form.description}
                        onChange={e => update("description", e.target.value.substring(0, 500))}
                      />
                      {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
                      <div className="mt-1 text-right text-xs text-slate-400">{form.description.length} / 500 characters</div>
                    </div>
                  </div>
                </div>

                {/* Profile Identity */}
                <div className={`rounded-2xl border bg-white p-6 shadow-sm transition ${errors.photo ? "border-red-400" : "border-slate-200"}`}>
                  <div className="mb-6 flex items-center gap-3 text-lg font-semibold text-slate-900">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#4F46E5]">
                      <User size={18} />
                    </div>
                    Profile Identity
                  </div>
                  
                  <div className="flex flex-col items-center justify-center py-6">
                    <div className="relative mb-4 h-28 w-28 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden bg-slate-50">
                      {form.photoUrl ? (
                        <img src={form.photoUrl} alt="Cropped Headshot" className="h-full w-full object-cover" />
                      ) : (
                        <Camera size={28} className="text-slate-400" />
                      )}
                      <label className="absolute bottom-1 right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#4F46E5] text-white shadow-md hover:bg-[#4338CA] transition">
                        <Edit2 size={14} />
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleImageSelect(e, "photo")} />
                      </label>
                    </div>
                    <h4 className="font-semibold text-slate-900">Upload Headshot <span className="text-red-500">*</span></h4>
                    <p className="text-xs text-slate-500">JPG, PNG up to 5MB</p>
                    {errors.photo && <p className="mt-2 text-xs text-red-500 font-medium bg-red-50 px-3 py-1 rounded-full">{errors.photo}</p>}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* ID Verification */}
                <div className={`rounded-2xl border bg-white p-6 shadow-sm transition ${errors.idFront || errors.idBack ? "border-red-400" : "border-slate-200"}`}>
                  <div className="mb-6 flex items-center gap-3 text-lg font-semibold text-slate-900">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#4F46E5]">
                      <ShieldCheck size={18} />
                    </div>
                    ID Verification
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-slate-700">Document Type <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <select className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition hover:border-slate-300 focus:border-[#4F46E5]" value={form.documentType} onChange={e => update("documentType", e.target.value)}>
                          <option value="Passport">Passport</option>
                          <option value="Driver's License">Driver&apos;s License</option>
                          <option value="National ID">National ID</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-3 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <label className={`flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed py-6 transition overflow-hidden relative min-h-[110px] ${errors.idFront ? "border-red-300 bg-red-50 hover:bg-red-100" : "border-[#C7D2FE] bg-[#F8FAFC] hover:bg-[#EEF2FF]"}`}>
                          {form.idFrontUrl && (
                            <img src={form.idFrontUrl} alt="ID Front" className="absolute inset-0 h-full w-full object-cover opacity-80" />
                          )}
                          <div className="relative z-10 flex flex-col items-center bg-white/70 backdrop-blur-sm p-2 rounded-lg">
                            <UploadCloud size={20} className="text-slate-600 mb-1" />
                            <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wide">Front Side</span>
                          </div>
                          <input type="file" accept="image/*" className="hidden" onChange={e => handleImageSelect(e, "idFront")} />
                        </label>
                        {errors.idFront && <span className="text-[10px] text-red-500 mt-1 text-center font-medium">{errors.idFront}</span>}
                      </div>

                      <div className="flex flex-col">
                        <label className={`flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed py-6 transition overflow-hidden relative min-h-[110px] ${errors.idBack ? "border-red-300 bg-red-50 hover:bg-red-100" : "border-[#C7D2FE] bg-[#F8FAFC] hover:bg-[#EEF2FF]"}`}>
                          {form.idBackUrl && (
                            <img src={form.idBackUrl} alt="ID Back" className="absolute inset-0 h-full w-full object-cover opacity-80" />
                          )}
                          <div className="relative z-10 flex flex-col items-center bg-white/70 backdrop-blur-sm p-2 rounded-lg">
                            <UploadCloud size={20} className="text-slate-600 mb-1" />
                            <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wide">Back Side</span>
                          </div>
                          <input type="file" accept="image/*" className="hidden" onChange={e => handleImageSelect(e, "idBack")} />
                        </label>
                        {errors.idBack && <span className="text-[10px] text-red-500 mt-1 text-center font-medium">{errors.idBack}</span>}
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 text-center px-4 leading-tight">Please ensure the document is clear, glare-free, and all text is perfectly readable.</p>
                  </div>
                </div>

                {/* Service Area */}
                <div className={`rounded-2xl border bg-white p-6 shadow-sm flex flex-col transition ${errors.country || errors.state || errors.city || errors.pincode ? "border-red-400" : "border-slate-200"}`}>
                  <div className="mb-5 flex items-center gap-3 text-lg font-semibold text-slate-900">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#4F46E5]">
                      <MapPin size={18} />
                    </div>
                    Service Area
                  </div>
                  <LocationSelector
                    value={location}
                    onChange={(next) => {
                      setLocation(next);
                      // Clear field errors as user fills them
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

            <div className="mt-8 flex items-center justify-between">
              <div className="flex gap-3 ml-auto">
                <button className="rounded-lg bg-slate-100 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors">
                  Save as Draft
                </button>
                <button onClick={handleFinalSubmit} disabled={loading} className="flex items-center gap-2 rounded-lg bg-[#4F46E5] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#4338CA] transition-colors shadow-md shadow-indigo-500/20">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <>Submit Application <ArrowRight size={16} /></>}
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}

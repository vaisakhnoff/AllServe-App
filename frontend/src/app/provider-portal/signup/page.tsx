"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BriefcaseBusiness,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  TrendingUp,
  Clock,
  Sparkles,
  User,
  Mail,
  Phone,
  Lock,
} from "lucide-react";
import { PasswordStrength } from "@/components/common/PasswordStrength";
import { validatePasswordStrength, doPasswordsMatch } from "@/utils/validation";
import { UI_MESSAGES } from "@/shared/messages";
import { getErrorMessage } from "@/utils/errorHandler";
import { providerAuthService } from "@/services/auth";
import { ProviderSignupDto } from "@/types/auth.types";
import toast from "react-hot-toast";

const validators = {
  name: (v: string) => {
    if (!v.trim()) return UI_MESSAGES.NAME_REQUIRED;
    if (v.trim().length < 3) return UI_MESSAGES.NAME_MIN_3;
    if (!/^[a-zA-Z\s.'-]+$/.test(v)) return "Name can only contain letters, spaces, dots, hyphens";
    return "";
  },
  email: (v: string) => {
    if (!v.trim()) return UI_MESSAGES.EMAIL_REQUIRED;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return UI_MESSAGES.EMAIL_INVALID;
    return "";
  },
  phone: (v: string) => {
    if (!v.trim()) return UI_MESSAGES.PHONE_REQUIRED;
    const digits = v.replace(/\D/g, "");
    if (digits.length < 10) return UI_MESSAGES.PHONE_INVALID;
    if (digits.length > 12) return "Phone number is too long";
    return "";
  },
  password: (v: string) => {
    if (!v) return UI_MESSAGES.PASSWORD_REQUIRED;
    if (v.length < 8) return UI_MESSAGES.PASSWORD_TOO_WEAK;
    return "";
  },
};

export default function ProviderSignupPage() {
  const router = useRouter();
  const [form, setForm] = useState<Pick<ProviderSignupDto, "name" | "email" | "phone" | "password">>({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const pwdStrength = validatePasswordStrength(form.password);

  const fieldErrors = {
    name: validators.name(form.name),
    email: validators.email(form.email),
    phone: validators.phone(form.phone),
    password: validators.password(form.password),
    confirmPassword: !confirmPassword
      ? UI_MESSAGES.CONFIRM_PASSWORD_REQUIRED
      : !doPasswordsMatch(form.password, confirmPassword)
      ? UI_MESSAGES.PASSWORDS_DO_NOT_MATCH
      : "",
  };

  const hasErrors = Object.values(fieldErrors).some(Boolean);

  const handleBlur = (field: string) => setTouched((p) => ({ ...p, [field]: true }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    setTouched({ name: true, email: true, phone: true, password: true, confirmPassword: true });

    if (hasErrors) return;
    if (pwdStrength.score < 2) return setError(UI_MESSAGES.PASSWORD_TOO_WEAK);

    setLoading(true);
    try {
      await providerAuthService.signup({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        category: "",
        experience: "",
        serviceArea: "",
        description: "",
      });

      sessionStorage.setItem("provider_signup_email", form.email.trim());
      sessionStorage.setItem("provider_signup_password", form.password);

      setSignupSuccess(true);
      toast.success(UI_MESSAGES.PROVIDER_SIGNUP_SUCCESS);
      setTimeout(
        () => router.push(`/provider-portal/verify-otp?email=${encodeURIComponent(form.email.trim())}`),
        2000
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="provider-shell flex min-h-screen items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-900/95">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2.5rem] border border-slate-800 bg-white shadow-2xl shadow-indigo-950/20 lg:grid-cols-[0.95fr_1.05fr]">
        {/* Left Side: Brand & Benefits Banner */}
        <section className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-emerald-950 p-8 text-white lg:p-12">
          {/* Background Decorative Pattern */}
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <Link href="/provider-portal" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#00B761] text-white shadow-md shadow-[#00B761]/30">
                <BriefcaseBusiness size={22} />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight">AllServe Pro</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Partner Platform</span>
              </div>
            </Link>

            <div className="mt-12 space-y-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/20">
                <Sparkles size={14} /> Join 5,000+ Verified Professionals
              </span>
              <h1 className="text-3xl font-black leading-tight sm:text-4xl text-slate-50">
                Turn Your Expertise Into A Thriving Business
              </h1>
              <p className="text-sm leading-relaxed text-slate-300">
                Register as an official service partner to gain instant access to customer requests, manage jobs effortlessly, and secure reliable daily earnings.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="mt-8 space-y-3.5 border-t border-slate-800/80 pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                  <TrendingUp size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-100">Guaranteed Weekly Payouts</h4>
                  <p className="text-[11px] text-slate-400">Direct deposit into your bank account</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400">
                  <Clock size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-100">100% Flexible Schedule</h4>
                  <p className="text-[11px] text-slate-400">Accept bookings when you want to work</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-500/15 text-teal-400">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-100">Verified Customer Requests</h4>
                  <p className="text-[11px] text-slate-400">Genuine leads in your local service area</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-10 rounded-2xl bg-slate-900/60 p-4 border border-slate-800/80 backdrop-blur-xs">
            <p className="text-xs italic text-slate-300">
              &quot;AllServe helped me expand my electrical business by 300% in under 3 months!&quot;
            </p>
            <p className="mt-2 text-[11px] font-bold text-emerald-400">— Rajesh M., Certified Technician</p>
          </div>
        </section>

        {/* Right Side: Signup Form */}
        <section className="flex flex-col justify-center p-8 lg:p-12 bg-white">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-6">
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-[#00B761]">
                <User size={22} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight sm:text-3xl">Become a Partner</h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
                Fill in your basic information to get started.
              </p>
            </div>

            {/* Success state */}
            {signupSuccess ? (
              <div className="text-center py-8 px-4 rounded-3xl bg-emerald-50/50 border border-emerald-100">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#00B761]/10 text-[#00B761] mb-4">
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">Account Created Successfully!</h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                  We&apos;ve generated your provider profile and sent an OTP to <strong className="text-slate-900">{form.email}</strong>.
                </p>
                <div className="mt-6 flex items-center justify-center gap-2 text-[#00B761] text-xs font-bold bg-white py-2.5 px-4 rounded-xl border border-emerald-100 shadow-2xs">
                  <Loader2 size={16} className="animate-spin" /> Redirecting to verification...
                </div>
              </div>
            ) : (
              <>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-2xl px-4 py-3 mb-5 flex items-center gap-2">
                    <span>⚠️</span> {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  {/* Full Name */}
                  <div>
                    <label htmlFor="name" className="mb-1.5 block text-xs font-bold text-slate-700">
                      Full Name
                    </label>
                    <div className="relative">
                      <User size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        onBlur={() => handleBlur("name")}
                        className={`w-full rounded-xl border bg-slate-50/50 pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#00B761] focus:ring-2 focus:ring-[#00B761]/10 transition-all ${
                          touched.name && fieldErrors.name ? "border-red-300 bg-red-50/20" : "border-slate-200"
                        }`}
                      />
                    </div>
                    {touched.name && fieldErrors.name && (
                      <p className="text-[11px] font-semibold text-red-500 mt-1">{fieldErrors.name}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="mb-1.5 block text-xs font-bold text-slate-700">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        onBlur={() => handleBlur("email")}
                        className={`w-full rounded-xl border bg-slate-50/50 pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#00B761] focus:ring-2 focus:ring-[#00B761]/10 transition-all ${
                          touched.email && fieldErrors.email ? "border-red-300 bg-red-50/20" : "border-slate-200"
                        }`}
                      />
                    </div>
                    {touched.email && fieldErrors.email && (
                      <p className="text-[11px] font-semibold text-red-500 mt-1">{fieldErrors.email}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label htmlFor="phone" className="mb-1.5 block text-xs font-bold text-slate-700">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        id="phone"
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        onBlur={() => handleBlur("phone")}
                        className={`w-full rounded-xl border bg-slate-50/50 pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#00B761] focus:ring-2 focus:ring-[#00B761]/10 transition-all ${
                          touched.phone && fieldErrors.phone ? "border-red-300 bg-red-50/20" : "border-slate-200"
                        }`}
                      />
                    </div>
                    {touched.phone && fieldErrors.phone && (
                      <p className="text-[11px] font-semibold text-red-500 mt-1">{fieldErrors.phone}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="password" className="mb-1.5 block text-xs font-bold text-slate-700">
                      Password
                    </label>
                    <div className="relative">
                      <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        onBlur={() => handleBlur("password")}
                        className={`w-full rounded-xl border bg-slate-50/50 pl-10 pr-10 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#00B761] focus:ring-2 focus:ring-[#00B761]/10 transition-all ${
                          touched.password && fieldErrors.password ? "border-red-300 bg-red-50/20" : "border-slate-200"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {touched.password && fieldErrors.password && (
                      <p className="text-[11px] font-semibold text-red-500 mt-1">{fieldErrors.password}</p>
                    )}
                    {form.password && (
                      <div className="mt-1.5">
                        <PasswordStrength score={pwdStrength.score} message={pwdStrength.message} />
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label htmlFor="confirmPassword" className="mb-1.5 block text-xs font-bold text-slate-700">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onBlur={() => handleBlur("confirmPassword")}
                        className={`w-full rounded-xl border bg-slate-50/50 pl-10 pr-10 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#00B761] focus:ring-2 focus:ring-[#00B761]/10 transition-all ${
                          touched.confirmPassword && fieldErrors.confirmPassword
                            ? "border-red-300 bg-red-50/20"
                            : "border-slate-200"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {touched.confirmPassword && fieldErrors.confirmPassword && (
                      <p className="text-[11px] font-semibold text-red-500 mt-1">{fieldErrors.confirmPassword}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3 px-4 rounded-xl bg-[#00B761] hover:bg-[#009E52] active:scale-[0.99] text-white text-xs font-bold shadow-md shadow-[#00B761]/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : "Create Provider Account"}
                  </button>
                </form>

                {/* Footer Link */}
                <p className="text-center text-xs text-slate-500 mt-6 font-medium">
                  Already registered as a provider?{" "}
                  <Link href="/provider-portal/login" className="text-[#00B761] font-bold hover:underline">
                    Sign in here
                  </Link>
                </p>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

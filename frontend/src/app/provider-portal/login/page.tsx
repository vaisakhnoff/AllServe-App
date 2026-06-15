"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, LockKeyhole, Eye, EyeOff, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { providerAuthService } from "@/services/auth";
import { setAuth } from "@/features/auth";
import { RootState } from "@/store";
import { getErrorMessage } from "@/utils/errorHandler";
import { validateLoginForm } from "@/utils/validation";
import { UI_MESSAGES } from "@/shared/messages";

function getRedirectPath(status?: string | null) {
  if (status === "approved") return "/provider-portal/dashboard";
  return "/provider-portal";
}

export default function ProviderLoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated, role, applicationStatus } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (isAuthenticated && role === "provider") {
      router.replace(getRedirectPath(applicationStatus));
    }
  }, [isAuthenticated, role, applicationStatus]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});

  // Live validation (only show errors for fields the user has touched).
  const liveErrors = useMemo(() => validateLoginForm({ email, password }), [email, password]);
  const visibleErrors: { email?: string; password?: string } = {
    email: touched.email ? liveErrors.email : errors.email,
    password: touched.password ? liveErrors.password : errors.password,
  };
  const isFormValid = Object.keys(liveErrors).length === 0;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });

    const validationErrors = validateLoginForm({ email, password });
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});

    setLoading(true);
    try {
      const res = await providerAuthService.login({
        email: email.trim().toLowerCase(),
        password,
      });
      const { user, accessToken, refreshToken } = res.data.data;

      dispatch(setAuth({ user, accessToken, refreshToken }));
      toast.success(UI_MESSAGES.PROVIDER_LOGIN_SUCCESS);
      router.replace(getRedirectPath(user.applicationStatus));
    } catch (err) {
      toast.error(getErrorMessage(err) || UI_MESSAGES.PROVIDER_LOGIN_FAILED);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="provider-shell flex min-h-screen items-center justify-center px-4 py-12">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-indigo-900/10 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-800 p-8 text-white lg:p-10">
          <Link href="/provider-portal" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
              <BriefcaseBusiness size={20} />
            </div>
            <span className="text-xl font-black">AllServe Pro</span>
          </Link>
          <div className="mt-24">
            <p className="text-sm font-bold text-indigo-200">Provider access</p>
            <h1 className="mt-3 text-4xl font-black leading-tight">Manage jobs, services, and earnings in one place.</h1>
            <p className="mt-4 text-sm leading-6 text-indigo-100">Sign in to check your application status or access your provider dashboard.</p>
          </div>
        </section>

        <section className="p-8 lg:p-10">
          <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <LockKeyhole size={22} />
          </div>
          <h2 className="text-3xl font-black">Provider Login</h2>
          <p className="mt-2 text-sm text-slate-500">Access your dashboard or check application status.</p>

          <form onSubmit={handleLogin} className="mt-8 space-y-4" noValidate>
            <div>
              <label htmlFor="provider-email" className="mb-2 block text-sm font-bold text-slate-700">
                Email
              </label>
              <input
                id="provider-email"
                className={`input ${visibleErrors.email ? "input-error" : ""}`}
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="provider@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                aria-invalid={Boolean(visibleErrors.email)}
                aria-describedby={visibleErrors.email ? "provider-email-error" : undefined}
              />
              {visibleErrors.email && (
                <p id="provider-email-error" className="mt-1 text-xs text-red-500">
                  {visibleErrors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="provider-password" className="mb-2 block text-sm font-bold text-slate-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="provider-password"
                  className={`input pr-10 ${visibleErrors.password ? "input-error" : ""}`}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                  aria-invalid={Boolean(visibleErrors.password)}
                  aria-describedby={visibleErrors.password ? "provider-password-error" : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {visibleErrors.password && (
                <p id="provider-password-error" className="mt-1 text-xs text-red-500">
                  {visibleErrors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="btn btn-primary w-full py-3 disabled:opacity-60"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : "Login"}
            </button>
          </form>

          <div className="mt-4 text-right">
            <Link href="/provider-portal/forgot-password" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
              Forgot password?
            </Link>
          </div>

          <p className="mt-7 text-center text-sm text-slate-500">
            Not a provider yet?{" "}
            <Link href="/provider-portal/signup" className="font-bold text-indigo-600">
              Sign Up
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}

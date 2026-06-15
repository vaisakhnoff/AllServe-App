"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, CheckCircle2, Loader2 } from "lucide-react";
import { providerAuthService } from "@/services/auth";
import { getErrorMessage } from "@/utils/errorHandler";
import { validateForgotPasswordEmail } from "@/utils/validation";
import { UI_MESSAGES } from "@/shared/messages";
import { ROUTES } from "@/shared/routes";

export default function ProviderForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForgotPasswordEmail(email);
    setEmailError(validationError);
    if (validationError) { setError(null); return; }

    setLoading(true);
    setError(null);
    try {
      await providerAuthService.forgotPassword({ email: email.trim().toLowerCase() });
      localStorage.setItem("provider_reset_email", email.trim().toLowerCase());
      setSent(true);
      setTimeout(() => router.push(ROUTES.PROVIDER_PORTAL_RESET_PASSWORD), 2000);
    } catch (err) {
      setError(getErrorMessage(err) || UI_MESSAGES.SOMETHING_WENT_WRONG);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-12 bg-slate-50">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 size={32} className="text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Check your inbox</h2>
          <p className="mt-2 text-sm text-slate-500">
            We sent an OTP to <strong className="text-slate-900">{email}</strong>.<br />
            Redirecting to reset password…
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
            <Mail size={26} className="text-indigo-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Forgot your password?</h1>
          <p className="mt-2 text-sm text-slate-500">Enter your provider email and we&apos;ll send you a reset code.</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-bold text-slate-700">Email address</label>
            <input
              id="email"
              type="email"
              className={`input ${emailError ? "input-error" : ""}`}
              placeholder="provider@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(validateForgotPasswordEmail(e.target.value));
              }}
              onBlur={() => setEmailError(validateForgotPasswordEmail(email))}
            />
            {emailError && <p className="mt-1 text-xs text-red-500">{emailError}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary mt-5 w-full py-3 disabled:opacity-60"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : "Send Reset Code"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link href="/provider-portal/login" className="font-bold text-indigo-600 hover:text-indigo-700">
            ← Back to login
          </Link>
        </p>
      </div>
    </main>
  );
}

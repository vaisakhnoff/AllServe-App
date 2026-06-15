"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { providerAuthService } from "@/services/auth";
import { getErrorMessage } from "@/utils/errorHandler";
import { validatePasswordStrength, doPasswordsMatch } from "@/utils/validation";
import { UI_MESSAGES } from "@/shared/messages";

interface FormErrors {
  otp?: string;
  newPassword?: string;
  confirmPassword?: string;
}

function validateForm(otp: string, newPassword: string, confirmPassword: string): FormErrors {
  const errors: FormErrors = {};
  if (!otp.trim()) errors.otp = UI_MESSAGES.OTP_REQUIRED;
  else if (otp.trim().length !== 6) errors.otp = UI_MESSAGES.OTP_INCOMPLETE;

  if (!newPassword) errors.newPassword = UI_MESSAGES.PASSWORD_REQUIRED;
  else if (validatePasswordStrength(newPassword).score < 2) errors.newPassword = UI_MESSAGES.PASSWORD_TOO_WEAK;

  if (!confirmPassword) errors.confirmPassword = UI_MESSAGES.CONFIRM_PASSWORD_REQUIRED;
  else if (!doPasswordsMatch(newPassword, confirmPassword)) errors.confirmPassword = UI_MESSAGES.PASSWORDS_DO_NOT_MATCH;

  return errors;
}

export default function ProviderResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});

  useEffect(() => {
    const saved = localStorage.getItem("provider_reset_email");
    if (saved) setEmail(saved);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm(otp, newPassword, confirmPassword);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (!email) {
      setError("Email not found. Please go back and request a new code.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await providerAuthService.resetPassword({ email, otp: otp.trim(), newPassword });
      localStorage.removeItem("provider_reset_email");
      setSuccess(true);
      setTimeout(() => router.push("/provider-portal/login"), 2000);
    } catch (err) {
      setError(getErrorMessage(err) || UI_MESSAGES.SOMETHING_WENT_WRONG);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-12 bg-slate-50">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 size={32} className="text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">{UI_MESSAGES.PROVIDER_PASSWORD_RESET_SUCCESS}</h2>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
            <Lock size={26} className="text-indigo-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Reset Password</h1>
          <p className="mt-2 text-sm text-slate-500">
            Enter the OTP sent to <strong className="text-slate-700">{email || "your email"}</strong> and your new password.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="otp" className="mb-1.5 block text-sm font-bold text-slate-700">OTP Code</label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              className={`input ${fieldErrors.otp ? "input-error" : ""}`}
              placeholder="6-digit code"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
            {fieldErrors.otp && <p className="mt-1 text-xs text-red-500">{fieldErrors.otp}</p>}
          </div>

          <div>
            <label htmlFor="new-password" className="mb-1.5 block text-sm font-bold text-slate-700">New Password</label>
            <div className="relative">
              <input
                id="new-password"
                type={showPwd ? "text" : "password"}
                className={`input pr-10 ${fieldErrors.newPassword ? "input-error" : ""}`}
                placeholder="Min 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldErrors.newPassword && <p className="mt-1 text-xs text-red-500">{fieldErrors.newPassword}</p>}
          </div>

          <div>
            <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-bold text-slate-700">Confirm Password</label>
            <input
              id="confirm-password"
              type="password"
              className={`input ${fieldErrors.confirmPassword ? "input-error" : ""}`}
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {fieldErrors.confirmPassword && <p className="mt-1 text-xs text-red-500">{fieldErrors.confirmPassword}</p>}
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary w-full py-3 disabled:opacity-60">
            {loading ? <Loader2 size={18} className="animate-spin" /> : "Reset Password"}
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

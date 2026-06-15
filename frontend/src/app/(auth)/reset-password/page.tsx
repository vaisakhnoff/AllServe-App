"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/common/Button";
import { authService } from "@/services/auth";
import { getErrorMessage } from "@/utils/errorHandler";
import { ROUTES } from "@/shared/routes";
import { doPasswordsMatch, validatePasswordStrength } from "@/utils/validation";
import { UI_MESSAGES } from "@/shared/messages";
import { PasswordStrength } from "@/components/common/PasswordStrength";
import { Lock, CheckCircle2, Eye, EyeOff } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [form, setForm] = useState({ otp: "", newPassword: "" });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Custom Toast States
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Resend OTP states
  const [countdown, setCountdown] = useState(0);
  const [resending, setResending] = useState(false);

  const showSuccessToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const showErrorToast = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 5000);
  };

  useEffect(() => {
    const saved = localStorage.getItem("reset_email");
    if (saved) setEmail(saved);
  }, []);

  useEffect(() => {
    if (countdown === 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const pwdStrength = validatePasswordStrength(form.newPassword);

  const handleResendOtp = async () => {
    if (!email || countdown > 0 || resending) return;
    setResending(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await authService.forgotPassword({ email });
      setCountdown(30); // 30s cooldown
      showSuccessToast(UI_MESSAGES.OTP_RESENT_EMAIL);
    } catch (err) {
      showErrorToast(getErrorMessage(err));
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!doPasswordsMatch(form.newPassword, confirmPassword)) {
      showErrorToast(UI_MESSAGES.PASSWORDS_DO_NOT_MATCH);
      return;
    }
    if (pwdStrength.score < 2) {
      showErrorToast(UI_MESSAGES.PROFILE_PASSWORD_TOO_WEAK);
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword({ email, ...form });
      localStorage.removeItem("reset_email");
      showSuccessToast(UI_MESSAGES.PASSWORD_RESET_SUCCESS);
      setSuccess(true);
      setTimeout(() => router.push(ROUTES.LOGIN), 2000);
    } catch (err) {
      showErrorToast(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fade-up" style={{ textAlign: "center", padding: "2rem 0" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
          <CheckCircle2 size={36} color="#16a34a" />
        </div>
        <h2 style={{ fontSize: "1.375rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>Password Reset!</h2>
        <p style={{ color: "#64748b" }}>Redirecting you to login…</p>
      </div>
    );
  }

  return (
    <div className="fade-up">
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
          <Lock size={30} color="#4f46e5" />
        </div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.375rem" }}>Reset your password</h1>
        <p style={{ color: "#64748b", fontSize: "0.9375rem" }}>Enter the OTP from your email and set a new password.</p>
      </div>

      <div style={{ position: "fixed", top: "1.5rem", right: "1.5rem", zIndex: 9999, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {successMsg && (
          <div className="fade-up" style={{ background: "#dcfce7", border: "1px solid #86efac", borderRadius: 12, padding: "0.875rem 1.25rem", display: "flex", alignItems: "center", gap: "0.625rem", color: "#15803d", fontWeight: 500, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}>
            <CheckCircle2 size={18} /> {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="fade-up" style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "0.875rem 1.25rem", color: "#dc2626", fontWeight: 500, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}>
            ⚠️ {errorMsg}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}>
        <div>
          <label className="input-label" htmlFor="otp">OTP Code</label>
          <input id="otp" className="input" placeholder="Enter 6-digit OTP" maxLength={6}
            value={form.otp} onChange={(e) => setForm({ ...form, otp: e.target.value })} required />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.375rem" }}>
            <button
              type="button"
              disabled={countdown > 0 || resending || !email}
              onClick={handleResendOtp}
              style={{
                background: "none",
                border: "none",
                color: (countdown > 0 || resending || !email) ? "#cbd5e1" : "#4f46e5",
                fontSize: "0.8125rem",
                fontWeight: 600,
                cursor: (countdown > 0 || resending || !email) ? "not-allowed" : "pointer",
                padding: 0,
                transition: "color 0.15s ease",
                fontFamily: "inherit"
              }}
            >
              {resending ? "Sending..." : countdown > 0 ? `Resend OTP in ${countdown}s` : "Resend OTP"}
            </button>
          </div>
        </div>

        <div>
          <label className="input-label" htmlFor="newPwd">New Password</label>
          <div style={{ position: "relative" }}>
            <input id="newPwd" type={showPwd ? "text" : "password"} className="input" placeholder="Min. 8 characters"
              value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              style={{ paddingRight: "2.75rem" }} required />
            <button type="button" onClick={() => setShowPwd(!showPwd)}
              style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex" }}>
              {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <PasswordStrength score={pwdStrength.score} message={pwdStrength.message} />
        </div>

        <div>
          <label className="input-label" htmlFor="confirmPwd">Confirm New Password</label>
          <div style={{ position: "relative" }}>
            <input id="confirmPwd" type={showConfirmPwd ? "text" : "password"} className="input" placeholder="Re-enter password"
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              style={{ paddingRight: "2.75rem" }} required />
            <button type="button" onClick={() => setShowConfirmPwd(!showConfirmPwd)}
              style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex" }}>
              {showConfirmPwd ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <Button type="submit" size="full" loading={loading} style={{ borderRadius: 10, height: 46, marginTop: "0.25rem" }}>
          Reset Password
        </Button>
      </form>

      <p style={{ textAlign: "center", fontSize: "0.875rem", color: "#64748b", marginTop: "1.5rem" }}>
        <Link href={ROUTES.LOGIN} style={{ color: "#4f46e5", fontWeight: 600, textDecoration: "none" }}>← Back to login</Link>
      </p>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/common/Button";
import { authService } from "@/services/auth";
import { getErrorMessage } from "@/utils/errorHandler";
import { ROUTES } from "@/shared/routes";
import { UI_MESSAGES } from '@/shared/messages';
import { MailCheck, RefreshCw, CheckCircle2 } from "lucide-react";

export default function VerifyOtpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [timer, setTimer] = useState(300);
  const [resendCooldown, setResendCooldown] = useState(30);
  const [resending, setResending] = useState(false);

  // Custom Toast States
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const showSuccessToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const showErrorToast = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 5000);
  };

  useEffect(() => {
    const saved = localStorage.getItem("pending_email");
    if (saved) setEmail(saved);
  }, []);

  useEffect(() => {
    if (timer > 0) {
      const id = setInterval(() => setTimer((p) => p - 1), 1000);
      return () => clearInterval(id);
    }
  }, [timer]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const id = setInterval(() => setResendCooldown((p) => p - 1), 1000);
      return () => clearInterval(id);
    }
  }, [resendCooldown]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const handleOtpChange = (val: string, idx: number) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) {
      const el = document.getElementById(`otp-${idx + 1}`);
      el?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      document.getElementById(`otp-${idx - 1}`)?.focus();
    }
  };

  const otpValue = otp.join("");

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (otpValue.length < 6) {
      showErrorToast(UI_MESSAGES.OTP_INCOMPLETE);
      return;
    }

    setLoading(true);
    try {
      await authService.verifyOtp({ email, otp: otpValue });
      localStorage.removeItem("pending_email");
      showSuccessToast(UI_MESSAGES.VERIFY_SUCCESS_REDIRECT);
      setSuccess(true);
      setTimeout(() => router.push(ROUTES.LOGIN), 2000);
    } catch (err) {
      showErrorToast(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setResending(true);
    try {
      await authService.resendOtp({ email });
      setTimer(300);
      setResendCooldown(30);
      showSuccessToast(UI_MESSAGES.OTP_RESENT_EMAIL);
    } catch (err) {
      showErrorToast(getErrorMessage(err));
    } finally {
      setResending(false);
    }
  };

  if (success) {
    return (
      <div className="fade-up" style={{ textAlign: "center", padding: "2rem 0" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
          <CheckCircle2 size={36} color="#16a34a" />
        </div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>Email Verified!</h2>
        <p style={{ color: "#64748b" }}>Redirecting you to login…</p>
      </div>
    );
  }

  return (
    <div className="fade-up">
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
          <MailCheck size={30} color="#4f46e5" />
        </div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.375rem" }}>Verify your email</h1>
        <p style={{ fontSize: "0.9375rem", color: "#64748b" }}>
          We sent a 6-digit code to<br />
          <strong style={{ color: "#0f172a" }}>{email || "your email"}</strong>
        </p>
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

      {timer <= 0 && (
        <div style={{ background: "#fefce8", border: "1px solid #fde68a", color: "#92400e", borderRadius: 10, padding: "0.75rem 1rem", marginBottom: "1.25rem", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>⚠️</span> OTP expired. Please request a new one.
        </div>
      )}

      <form onSubmit={handleVerify}>
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", marginBottom: "1.5rem" }}>
          {otp.map((digit, i) => (
            <input
              key={i}
              id={`otp-${i}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(e.target.value, i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              style={{
                width: 52,
                height: 56,
                textAlign: "center",
                fontSize: "1.25rem",
                fontWeight: 700,
                border: `2px solid ${digit ? "#4f46e5" : "#e2e8f0"}`,
                borderRadius: 12,
                background: digit ? "#eef2ff" : "#fff",
                color: "#0f172a",
                outline: "none",
                transition: "all 0.15s",
                fontFamily: "monospace",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#4f46e5")}
              onBlur={(e) => (e.target.style.borderColor = digit ? "#4f46e5" : "#e2e8f0")}
            />
          ))}
        </div>

        {timer > 0 && (
          <p style={{ textAlign: "center", fontSize: "0.8125rem", color: "#94a3b8", marginBottom: "1.25rem" }}>
            Code expires in <span style={{ color: timer < 60 ? "#ef4444" : "#4f46e5", fontWeight: 600 }}>{formatTime(timer)}</span>
          </p>
        )}

        <Button type="submit" size="full" loading={loading} disabled={otpValue.length < 6 || timer <= 0} style={{ borderRadius: 10, height: 46 }}>
          Verify Email
        </Button>
      </form>

      <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
        <button
          onClick={handleResend}
          disabled={resendCooldown > 0 || resending}
          style={{
            background: "none",
            border: "none",
            cursor: resendCooldown > 0 || resending ? "not-allowed" : "pointer",
            color: resendCooldown > 0 || resending ? "#94a3b8" : "#4f46e5",
            fontSize: "0.875rem",
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: "0.375rem",
            fontFamily: "inherit",
          }}
        >
          <RefreshCw size={14} className={resending ? "animate-spin" : ""} />
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
        </button>
        <br />
        <Link href={ROUTES.LOGIN} style={{ fontSize: "0.8125rem", color: "#94a3b8", textDecoration: "none", marginTop: "0.75rem", display: "inline-block" }}>
          ← Back to login
        </Link>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useDispatch } from "react-redux";
import { Button } from "@/components/common/Button";
import { providerAuthService } from "@/services/auth";
import { setAuth } from "@/features/auth";
import { getErrorMessage } from "@/utils/errorHandler";
import { MailCheck, RefreshCw, CheckCircle2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { UI_MESSAGES } from '@/shared/messages';

export default function ProviderVerifyOtpPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [autoLogging, setAutoLogging] = useState(false);
  const [timer, setTimer] = useState(300);
  const [resendCooldown, setResendCooldown] = useState(30);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const queryEmail = searchParams.get("email");
    if (queryEmail) setEmail(queryEmail);
  }, [searchParams]);

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
    if (val && idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      document.getElementById(`otp-${idx - 1}`)?.focus();
    }
  };

  const otpValue = otp.join("");

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpValue.length < 6) return toast.error(UI_MESSAGES.OTP_INCOMPLETE);

    setLoading(true);
    try {
      await providerAuthService.verifyOtp({ email, otp: otpValue });
      toast.success(UI_MESSAGES.VERIFY_SUCCESS_REDIRECT);

      // Auto-login using stored credentials
      const storedEmail = sessionStorage.getItem("provider_signup_email");
      const storedPassword = sessionStorage.getItem("provider_signup_password");

      if (storedEmail && storedPassword) {
        setAutoLogging(true);
        try {
          const res = await providerAuthService.login({ email: storedEmail, password: storedPassword });
          sessionStorage.removeItem("provider_signup_email");
          sessionStorage.removeItem("provider_signup_password");

          dispatch(setAuth({
            user: res.data.data.user,
            accessToken: res.data.data.accessToken,
            refreshToken: res.data.data.refreshToken,
          }));

          toast.success(UI_MESSAGES.VERIFY_SUCCESS_REDIRECT);
          router.push("/provider-portal");
        } catch {
          // Auto-login failed, fall back to manual login
          sessionStorage.removeItem("provider_signup_email");
          sessionStorage.removeItem("provider_signup_password");
          toast(UI_MESSAGES.SESSION_EXPIRED, { icon: "ℹ️" });
          router.push("/provider-portal/login");
        }
      } else {
        // No stored credentials, redirect to login
        router.push("/provider-portal/login");
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setResending(true);
    try {
      await providerAuthService.resendOtp({ email });
      setTimer(300);
      setResendCooldown(30);
      toast.success(UI_MESSAGES.OTP_RESENT_EMAIL);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setResending(false);
    }
  };

  if (autoLogging) {
    return (
      <div className="card p-8 text-center max-w-md mx-auto mt-10">
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
          <CheckCircle2 size={36} color="#16a34a" />
        </div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff", marginBottom: "0.5rem" }}>Email Verified!</h2>
        <p style={{ color: "#94a3b8", marginBottom: "1rem" }}>Setting up your session...</p>
        <Loader2 className="animate-spin mx-auto text-indigo-400" size={24} />
      </div>
    );
  }

  return (
    <div className="card p-8 max-w-md mx-auto mt-10">
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: "#1e1b4b", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
          <MailCheck size={30} color="#818cf8" />
        </div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff", marginBottom: "0.375rem" }}>Verify your email</h1>
        <p style={{ fontSize: "0.9375rem", color: "#94a3b8" }}>
          We sent a 6-digit code to<br />
          <strong style={{ color: "#fff" }}>{email || "your email"}</strong>
        </p>
      </div>

      {timer <= 0 && (
        <div style={{ background: "#451a03", border: "1px solid #78350f", color: "#fef3c7", borderRadius: 10, padding: "0.75rem 1rem", marginBottom: "1.25rem", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
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
                width: 52, height: 56, textAlign: "center", fontSize: "1.25rem", fontWeight: 700,
                border: `2px solid ${digit ? "#818cf8" : "#334155"}`, borderRadius: 12,
                background: digit ? "#312e81" : "#1e293b", color: "#fff", outline: "none",
                transition: "all 0.15s", fontFamily: "monospace",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#818cf8")}
              onBlur={(e) => (e.target.style.borderColor = digit ? "#818cf8" : "#334155")}
            />
          ))}
        </div>

        {timer > 0 && (
          <p style={{ textAlign: "center", fontSize: "0.8125rem", color: "#94a3b8", marginBottom: "1.25rem" }}>
            Code expires in <span style={{ color: timer < 60 ? "#ef4444" : "#818cf8", fontWeight: 600 }}>{formatTime(timer)}</span>
          </p>
        )}

        <Button type="submit" variant="primary" loading={loading} disabled={otpValue.length < 6 || timer <= 0} className="w-full">
          Verify & Continue
        </Button>
      </form>

      <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
        <button
          onClick={handleResend}
          disabled={resendCooldown > 0 || resending}
          style={{
            background: "none", border: "none",
            cursor: resendCooldown > 0 || resending ? "not-allowed" : "pointer",
            color: resendCooldown > 0 || resending ? "#64748b" : "#818cf8",
            fontSize: "0.875rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.375rem", fontFamily: "inherit",
          }}
        >
          <RefreshCw size={14} className={resending ? "animate-spin" : ""} />
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
        </button>
        <br />
        <Link href="/provider-portal/login" style={{ fontSize: "0.8125rem", color: "#94a3b8", textDecoration: "none", marginTop: "0.75rem", display: "inline-block" }}>
          ← Back to login
        </Link>
      </div>
    </div>
  );
}

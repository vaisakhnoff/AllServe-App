"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/common/Button";
import { authService } from "@/services/auth";
import { getErrorMessage } from "@/utils/errorHandler";
import { ROUTES } from "@/shared/routes";
import { Mail, CheckCircle2 } from "lucide-react";
import { validateForgotPasswordEmail } from "@/utils/validation";
import { UI_MESSAGES } from "@/shared/messages";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError,setEmailError] = useState<string | null>(null);

  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForgotPasswordEmail(email);
    setEmailError(validationError);

    if(validationError){
      setError(null);
      return
    }

    const normalizedEmail = email.trim();


    setLoading(true);
    setError(null);
    try {
      await authService.forgotPassword({ email : normalizedEmail });
      localStorage.setItem("reset_email", normalizedEmail);
      setSent(true);
      setTimeout(() => router.push(ROUTES.RESET_PASSWORD), 2000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="fade-up" style={{ textAlign: "center", padding: "2rem 0" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
          <CheckCircle2 size={36} color="#16a34a" />
        </div>
        <h2 style={{ fontSize: "1.375rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>Check your inbox</h2>
        <p style={{ color: "#64748b", lineHeight: 1.6 }}>
          We sent an OTP to <strong style={{ color: "#0f172a" }}>{email}</strong>.<br />
          Redirecting to reset password…
        </p>
      </div>
    );
  }

  return (
    <div className="fade-up">
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
          <Mail size={30} color="#4f46e5" />
        </div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.375rem" }}>Forgot your password?</h1>
        <p style={{ color: "#64748b", fontSize: "0.9375rem", lineHeight: 1.6 }}>
          No worries. Enter your email and we&apos;ll send you a reset code.
        </p>
      </div>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: 10, padding: "0.75rem 1rem", marginBottom: "1.25rem", fontSize: "0.875rem" }}>
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}noValidate>
        <div>
          <label className="input-label" htmlFor="email">Email address</label>
          <input
  id="email"
  type="email"
  className={`input ${emailError ? "input-error" : ""}`}
  placeholder="you@example.com"
  value={email}
  onChange={(e) => {
    const nextEmail = e.target.value;
    setEmail(nextEmail);

    if (emailError) {
      setEmailError(validateForgotPasswordEmail(nextEmail));
    }
  }}
  onBlur={() => setEmailError(validateForgotPasswordEmail(email))}
  required
/>
{emailError && (
  <p style={{ fontSize: "0.75rem", color: "#ef4444", marginTop: "0.25rem" }}>
    {emailError}
  </p>
)}
        </div>
        <Button type="submit" size="full" loading={loading} style={{ borderRadius: 10, height: 46 }}>
          Send Reset Code
        </Button>
      </form>

      <p style={{ textAlign: "center", fontSize: "0.875rem", color: "#64748b", marginTop: "1.5rem" }}>
        <Link href={ROUTES.LOGIN} style={{ color: "#4f46e5", fontWeight: 600, textDecoration: "none" }}>
          ← Back to login
        </Link>
      </p>
    </div>
  );
}

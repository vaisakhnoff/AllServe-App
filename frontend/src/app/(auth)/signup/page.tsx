"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/common/Button";
import { authService } from "@/services/auth";
import {
  PASSWORD_RULES,
  validatePasswordStrength,
  validateSignupForm,
} from "@/utils/validation";
import type { SignupErrors, SignupField } from "@/utils/validation";
import { getErrorMessage } from "@/utils/errorHandler";
import { logger } from "@/utils/logger";
import { ROUTES } from "@/shared/routes";
import { SignupDto } from "@/types/auth.types";
import { Globe, Eye, EyeOff, Check, X, CheckCircle2, Loader2 as Loader } from "lucide-react";
import { UI_MESSAGES } from "@/shared/messages";

const StrengthBar = ({ score }: { score: number }) => {
  const levels = [
    { label: "Weak", color: "#ef4444" },
    { label: "Fair", color: "#f59e0b" },
    { label: "Good", color: "#3b82f6" },
    { label: "Strong", color: "#10b981" },
  ];
  const lvl = levels[Math.min(score, 3)];
  return (
    <div style={{ marginTop: "0.5rem" }}>
      <div style={{ display: "flex", gap: "0.25rem", marginBottom: "0.25rem" }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 99, background: i <= score - 1 ? lvl.color : "#e2e8f0", transition: "background 0.2s" }} />
        ))}
      </div>
      {score > 0 && <p style={{ fontSize: "0.75rem", color: lvl.color, fontWeight: 500 }}>{lvl.label} password</p>}
    </div>
  );
};

const PasswordRule = ({ met, text }: { met: boolean; text: string }) => (
  <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.75rem", color: met ? "#10b981" : "#94a3b8" }}>
    {met ? <Check size={12} /> : <X size={12} />} {text}
  </div>
);

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState<SignupDto>({ name: "", email: "", password: "" });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ name: false, email: false, password: false, confirm: false });
  const [fieldErrors, setFieldErrors] = useState<SignupErrors>({});
  // Custom Toast States
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const showSuccessToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const showErrorToast = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 5000);
  };

  const pwdStrength = validatePasswordStrength(form.password);

  const getFieldError = (field: SignupField) => {
    return touched[field] ? fieldErrors[field] : undefined;
  };

  const hasTouchedField = () => Object.values(touched).some(Boolean);

  const handleFieldBlur = (field: SignupField) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setFieldErrors(validateSignupForm(form, confirmPassword));
  };

  const handleFormChange = (nextForm: SignupDto, nextConfirmPassword = confirmPassword) => {
    setForm(nextForm);

    if (hasTouchedField()) {
      setFieldErrors(validateSignupForm(nextForm, nextConfirmPassword));
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);

    if (hasTouchedField()) {
      setFieldErrors(validateSignupForm(form, value));
    }
  };

  const rules = PASSWORD_RULES.map((rule) => ({
    text: rule.text,
    met: rule.test(form.password),
  }));
  const nameError = getFieldError("name");
  const emailError = getFieldError("email");
  const passwordError = getFieldError("password");
  const confirmError = getFieldError("confirm");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const allTouched = { name: true, email: true, password: true, confirm: true };
    const validationErrors = validateSignupForm(form, confirmPassword);

    setTouched(allTouched);
    setFieldErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setLoading(true);
    try {
      const signupPayload = { ...form, name: form.name.trim(), email: form.email.trim() };
      await authService.signup(signupPayload);
      localStorage.setItem("pending_email", signupPayload.email);
      logger.info("Signup successful, redirecting to OTP", { email: signupPayload.email });
      setSignupSuccess(true);
      showSuccessToast(UI_MESSAGES.SIGNUP_SUCCESS);
      setTimeout(() => router.push(ROUTES.VERIFY_OTP), 2000);
    } catch (err) {
      const msg = getErrorMessage(err);
      showErrorToast(msg);
      logger.error("Signup failed", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-up">
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ fontSize: "1.625rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em", marginBottom: "0.375rem" }}>
          Create your account
        </h1>
        <p style={{ fontSize: "0.9375rem", color: "#64748b" }}>Join thousands of users on AllServe</p>
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

      {/* Success state — show after signup, before redirect */}
      {signupSuccess ? (
        <div className="fade-up" style={{ textAlign: "center", padding: "2rem 1rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 64, height: 64, borderRadius: "50%", background: "#dcfce7", marginBottom: "1rem" }}>
            <CheckCircle2 size={32} style={{ color: "#16a34a" }} />
          </div>
          <h2 style={{ fontSize: "1.375rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.5rem" }}>
            Account Created Successfully!
          </h2>
          <p style={{ fontSize: "0.9375rem", color: "#64748b", lineHeight: 1.6 }}>
            We&apos;ve sent a verification code to <strong style={{ color: "#334155" }}>{form.email}</strong>.<br />
            Redirecting you to verify your email...
          </p>
          <div style={{ marginTop: "1.5rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", color: "#6366f1", fontSize: "0.875rem", fontWeight: 600 }}>
            <Loader size={16} className="animate-spin" /> Redirecting...
          </div>
        </div>
      ) : (
      <>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }} noValidate>
        <div>
          <label className="input-label" htmlFor="name">Full Name</label>
          <input
            id="name"
            type="text"
            className={`input ${nameError ? "input-error" : ""}`}
            placeholder="John Doe"
            value={form.name}
            onChange={(e) => handleFormChange({ ...form, name: e.target.value })}
            onBlur={() => handleFieldBlur("name")}
          />
          {nameError && (
            <p style={{ fontSize: "0.75rem", color: "#ef4444", marginTop: "0.25rem" }}>
              {nameError}
            </p>
          )}
        </div>

        <div>
          <label className="input-label" htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            className={`input ${emailError ? "input-error" : ""}`}
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => handleFormChange({ ...form, email: e.target.value })}
            onBlur={() => handleFieldBlur("email")}
          />
          {emailError && (
            <p style={{ fontSize: "0.75rem", color: "#ef4444", marginTop: "0.25rem" }}>
              {emailError}
            </p>
          )}
        </div>

        <div>
          <label className="input-label" htmlFor="password">Password</label>
          <div style={{ position: "relative" }}>
            <input
              id="password"
              type={showPwd ? "text" : "password"}
              className={`input ${passwordError ? "input-error" : ""}`}
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={(e) => handleFormChange({ ...form, password: e.target.value })}
              onBlur={() => handleFieldBlur("password")}
              style={{ paddingRight: "2.75rem" }}
            />
            <button type="button" onClick={() => setShowPwd(!showPwd)}
              style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex" }}>
              {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {passwordError && (
            <p style={{ fontSize: "0.75rem", color: "#ef4444", marginTop: "0.25rem" }}>
              {passwordError}
            </p>
          )}
          {form.password && <StrengthBar score={pwdStrength.score} />}
          {touched.password && form.password && (
            <div style={{ marginTop: "0.5rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.25rem 0.75rem" }}>
              {rules.map(r => <PasswordRule key={r.text} met={r.met} text={r.text} />)}
            </div>
          )}
        </div>

        <div>
          <label className="input-label" htmlFor="confirm">Confirm Password</label>
          <div style={{ position: "relative" }}>
            <input
              id="confirm"
              type={showConfirmPwd ? "text" : "password"}
              className={`input ${confirmError ? "input-error" : ""}`}
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => handleConfirmPasswordChange(e.target.value)}
              onBlur={() => handleFieldBlur("confirm")}
              style={{ paddingRight: "2.75rem" }}
            />
            <button type="button" onClick={() => setShowConfirmPwd(!showConfirmPwd)}
              style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex" }}>
              {showConfirmPwd ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {confirmError && (
            <p style={{ fontSize: "0.75rem", color: "#ef4444", marginTop: "0.25rem" }}>
              {confirmError}
            </p>
          )}
          {!confirmError && confirmPassword && form.password === confirmPassword && (
            <p style={{ fontSize: "0.75rem", color: "#10b981", marginTop: "0.25rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <Check size={12} /> {UI_MESSAGES.PASSWORDS_MATCH}
            </p>
          )}
        </div>

        <Button type="submit" size="full" loading={loading} style={{ marginTop: "0.5rem", borderRadius: 10, height: 46 }}>
          Create Account
        </Button>
      </form>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: "1.25rem 0" }}>
        <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
        <span style={{ fontSize: "0.8125rem", color: "#94a3b8", fontWeight: 500 }}>or</span>
        <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
      </div>

      <button onClick={() => (window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`)}
        style={{ width: "100%", height: 46, background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.625rem", fontWeight: 600, fontSize: "0.875rem", color: "#334155", cursor: "pointer", fontFamily: "inherit" }}>
        <Globe size={18} /> Continue with Google
      </button>

      <p style={{ textAlign: "center", fontSize: "0.875rem", color: "#64748b", marginTop: "1.5rem" }}>
        Already have an account?{" "}
        <Link href={ROUTES.LOGIN} style={{ color: "#4f46e5", fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
      </p>
      </>
      )}
    </div>
  );
}

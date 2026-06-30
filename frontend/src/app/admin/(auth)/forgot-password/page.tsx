"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

import { UI_MESSAGES } from '@/shared/messages';

export default function AdminForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; newPassword?: string; confirmPassword?: string }>({});

  const errorStyle: React.CSSProperties = { color: "#dc2626", fontSize: "0.75rem", marginTop: "0.25rem" };

  const handleSendLink = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};
    if (!email.trim()) {
      newErrors.email = UI_MESSAGES.ADMIN_EMAIL_REQUIRED;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = UI_MESSAGES.EMAIL_INVALID;
    }
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setStep(2);
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};
    if (!newPassword) {
      newErrors.newPassword = UI_MESSAGES.PASSWORD_REQUIRED;
    } else if (newPassword.length < 6) {
      newErrors.newPassword = UI_MESSAGES.PASSWORD_TOO_WEAK;
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = UI_MESSAGES.CONFIRM_PASSWORD_REQUIRED;
    } else if (newPassword && newPassword !== confirmPassword) {
      newErrors.confirmPassword = UI_MESSAGES.PASSWORDS_DO_NOT_MATCH;
    }
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setStep(3);
  };

  return (
    <div className="admin-auth-card">
      <div style={{ textAlign: "center", marginBottom: "2rem", position: "relative" }}>
        {step < 3 && (
          <button
            onClick={() => router.push("/admin/login")}
            style={{ position: "absolute", left: 0, top: "4px", background: "none", border: "none", color: "#64748b", cursor: "pointer" }}
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>
          {step === 1 ? "Reset Password" : step === 2 ? "Create New Password" : "Password Reset"}
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.875rem" }}>
          {step === 1 ? "Enter your email to receive a reset token" : step === 2 ? "Secure your admin account" : "You can now log in securely"}
        </p>
      </div>

      {step === 1 && (
        <form onSubmit={handleSendLink} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#334155", marginBottom: "0.5rem" }}>
              Admin Email
            </label>
            <div style={{ position: "relative" }}>
              <Mail size={18} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="email"
                className="admin-input"
                style={{ paddingLeft: "2.5rem", borderColor: errors.email ? "#dc2626" : undefined }}
                placeholder="admin@allserve.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors((prev) => ({ ...prev, email: undefined })); }}
              />
            </div>
            {errors.email && <p style={errorStyle}>{errors.email}</p>}
          </div>
          <button type="submit" className="admin-btn-primary" style={{ width: "100%", justifyContent: "center", padding: "0.75rem", marginTop: "0.5rem" }}>
            Send Reset Link
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleReset} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#334155", marginBottom: "0.5rem" }}>
              New Password
            </label>
            <div style={{ position: "relative" }}>
              <Lock size={18} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="password"
                className="admin-input"
                style={{ paddingLeft: "2.5rem", borderColor: errors.newPassword ? "#dc2626" : undefined }}
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setErrors((prev) => ({ ...prev, newPassword: undefined })); }}
              />
            </div>
            {errors.newPassword && <p style={errorStyle}>{errors.newPassword}</p>}
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#334155", marginBottom: "0.5rem" }}>
              Confirm Password
            </label>
            <div style={{ position: "relative" }}>
              <Lock size={18} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="password"
                className="admin-input"
                style={{ paddingLeft: "2.5rem", borderColor: errors.confirmPassword ? "#dc2626" : undefined }}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setErrors((prev) => ({ ...prev, confirmPassword: undefined })); }}
              />
            </div>
            {errors.confirmPassword && <p style={errorStyle}>{errors.confirmPassword}</p>}
          </div>
          <button type="submit" className="admin-btn-primary" style={{ width: "100%", justifyContent: "center", padding: "0.75rem", marginTop: "0.5rem" }}>
            Reset Password
          </button>
        </form>
      )}

      {step === 3 && (
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}>
          <CheckCircle2 size={48} color="#10b981" />
          <p style={{ color: "#334155", fontSize: "0.875rem" }}>
            Your admin password has been successfully reset.
          </p>
          <button 
            onClick={() => router.push("/admin/login")} 
            className="admin-btn-primary" 
            style={{ width: "100%", justifyContent: "center", padding: "0.75rem" }}
          >
            Return to Login
          </button>
        </div>
      )}
    </div>
  );
}

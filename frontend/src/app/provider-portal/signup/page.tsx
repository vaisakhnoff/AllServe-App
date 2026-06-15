"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
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
    name: "", email: "", phone: "", password: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const pwdStrength = validatePasswordStrength(form.password);

  const fieldErrors = {
    name: validators.name(form.name),
    email: validators.email(form.email),
    phone: validators.phone(form.phone),
    password: validators.password(form.password),
    confirmPassword: !confirmPassword ? UI_MESSAGES.CONFIRM_PASSWORD_REQUIRED : !doPasswordsMatch(form.password, confirmPassword) ? UI_MESSAGES.PASSWORDS_DO_NOT_MATCH : "",
  };

  const hasErrors = Object.values(fieldErrors).some(Boolean);

  const handleBlur = (field: string) => setTouched((p) => ({ ...p, [field]: true }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Mark all touched
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
        category: "", experience: "", serviceArea: "", description: "",
      });

      sessionStorage.setItem("provider_signup_email", form.email.trim());
      sessionStorage.setItem("provider_signup_password", form.password);

      toast.success(UI_MESSAGES.PROVIDER_SIGNUP_SUCCESS);
      router.push(`/provider-portal/verify-otp?email=${encodeURIComponent(form.email.trim())}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-8 w-full max-w-md mx-auto mt-10">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Become a Provider</h2>
        <p className="text-sm text-gray-400">Create an account to start offering your services.</p>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700/50 text-red-400 text-sm rounded-xl px-4 py-3 mb-5">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <Input
            id="name"
            label="Full Name"
            placeholder="John Doe"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            onBlur={() => handleBlur("name")}
          />
          {touched.name && fieldErrors.name && <p className="text-xs text-red-400 mt-1">{fieldErrors.name}</p>}
        </div>

        <div>
          <Input
            id="email"
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            onBlur={() => handleBlur("email")}
          />
          {touched.email && fieldErrors.email && <p className="text-xs text-red-400 mt-1">{fieldErrors.email}</p>}
        </div>

        <div>
          <Input
            id="phone"
            label="Phone"
            type="tel"
            placeholder="+91 98765 43210"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            onBlur={() => handleBlur("phone")}
          />
          {touched.phone && fieldErrors.phone && <p className="text-xs text-red-400 mt-1">{fieldErrors.phone}</p>}
        </div>

        <div>
          <div className="relative">
            <Input
              id="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              onBlur={() => handleBlur("password")}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-200">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {touched.password && fieldErrors.password && <p className="text-xs text-red-400 mt-1">{fieldErrors.password}</p>}
          {form.password && <PasswordStrength score={pwdStrength.score} message={pwdStrength.message} />}
        </div>

        <div>
          <div className="relative">
            <Input
              id="confirmPassword"
              label="Confirm Password"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onBlur={() => handleBlur("confirmPassword")}
            />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-200">
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {touched.confirmPassword && fieldErrors.confirmPassword && <p className="text-xs text-red-400 mt-1">{fieldErrors.confirmPassword}</p>}
        </div>

        <Button type="submit" variant="primary" loading={loading} disabled={loading} className="w-full mt-4">
          Create Account
        </Button>
      </form>

      <p className="text-center text-sm text-gray-400 mt-6">
        Already a provider?{" "}
        <Link href="/provider-portal/login" className="text-blue-400 hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}

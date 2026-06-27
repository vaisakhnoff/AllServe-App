"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { UserProfile } from "@/types/user.types";
import { userService } from "@/services/user";
import { getErrorMessage } from "@/utils/errorHandler";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { AddressList } from "@/components/user/AddressList";
import { Loader } from "@/components/common/Loader";
import { ImageCropper } from "@/components/common/ImageCropper";
import { validatePasswordStrength, validateProfileForm, validateProfilePasswordForm, ProfileErrors, ProfilePwdErrors } from "@/utils/validation";
import { UI_MESSAGES } from "@/shared/messages";
import { PasswordStrength } from "@/components/common/PasswordStrength";
import { Camera, Mail, Phone, MapPin, Shield, CheckCircle2, Pencil, LogOut, Eye, EyeOff, User, CalendarDays } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const sanitizeIndianPhone = (value: string) => value.replace(/\D/g, "").slice(0, 10);
const getIndianPhoneDigits = (value?: string) => {
  const digits = (value || "").replace(/\D/g, "");
  return digits.startsWith("91") && digits.length > 10 ? digits.slice(2, 12) : digits.slice(0, 10);
};
const formatIndianPhone = (value: string) => `+91${sanitizeIndianPhone(value)}`;

const FieldError = ({ message }: { message?: string }) => {
  if (!message) return null;
  return <p className="mt-1 text-xs font-medium text-red-600">{message}</p>;
};

export default function ProfilePage() {
  const { logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [basicForm, setBasicForm] = useState({ name: "", phone: "" });
  const [pwdForm, setPwdForm] = useState({ oldPassword: "", newPassword: "" });
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showOldPwd, setShowOldPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [cropperSrc, setCropperSrc] = useState<string | null>(null);
  const [phoneOtpMode, setPhoneOtpMode] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState("");
  const [profileErrors, setProfileErrors] = useState<ProfileErrors>({});
  const [pwdErrors, setPwdErrors] = useState<ProfilePwdErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);

  const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(null), 5000); };

  const fetchProfile = useCallback(async () => {
    try {
      const res = await userService.getProfile();
      setProfile(res.data.data);
      setBasicForm({ name: res.data.data.name, phone: getIndianPhoneDigits(res.data.data.phone) });
    } catch (err) { setApiError(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void fetchProfile(); }, [fetchProfile]);

  const handleUpdateBasic = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateProfileForm(basicForm);
    setProfileErrors(errors);
    if (Object.keys(errors).length > 0) return;
    const phoneDigits = sanitizeIndianPhone(basicForm.phone);
    const formattedPhone = phoneDigits ? formatIndianPhone(phoneDigits) : "";
    const currentFormattedPhone = profile?.phone || "";
    if (formattedPhone && formattedPhone !== currentFormattedPhone) {
      setSaving(true);
      try {
        await userService.sendPhoneOtp(formattedPhone);
        setPhoneOtpMode(true);
        showSuccess(`OTP sent to ${formattedPhone}`);
      } catch (err) { setApiError(getErrorMessage(err)); }
      finally { setSaving(false); }
      return;
    }
    setSaving(true);
    try {
      const res = await userService.updateProfile({ ...basicForm, phone: formattedPhone });
      setProfile(res.data.data);
      setEditMode(false);
      showSuccess(UI_MESSAGES.PROFILE_UPDATED);
    } catch (err) { setApiError(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneOtp.length < 6) { setOtpError(UI_MESSAGES.OTP_INCOMPLETE); return; }
    setSaving(true);
    setOtpError(null);
    try {
      const formattedPhone = formatIndianPhone(basicForm.phone);
      const res = await userService.verifyPhoneOtp(formattedPhone, phoneOtp);
      setPhoneOtpMode(false);
      setPhoneOtp("");
      let updatedProfile = res.data.data;
      if (basicForm.name !== profile?.name) {
        const updateRes = await userService.updateProfile({ name: basicForm.name });
        updatedProfile = updateRes.data.data;
      }
      setProfile(updatedProfile);
      setEditMode(false);
      showSuccess(UI_MESSAGES.PROFILE_UPDATED);
    } catch (err) { setOtpError(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const pwdStrength = validatePasswordStrength(pwdForm.newPassword);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateProfilePasswordForm(pwdForm, confirmPwd);
    setPwdErrors(errors);
    if (Object.keys(errors).length > 0) return;
    try {
      await userService.changePassword(pwdForm);
      setPwdForm({ oldPassword: "", newPassword: "" });
      setConfirmPwd("");
      setShowOldPwd(false); setShowNewPwd(false); setShowConfirmPwd(false);
      setPwdErrors({});
      showSuccess(UI_MESSAGES.PASSWORD_UPDATED);
    } catch (err) { setApiError(getErrorMessage(err)); }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setCropperSrc(reader.result as string);
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  const handleCropDone = async (croppedFile: File) => {
    setCropperSrc(null);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      try {
        const res = await userService.uploadProfileImage(base64);
        setProfile(res.data.data);
        showSuccess("Profile image updated!");
      } catch (err) { setApiError(getErrorMessage(err)); setImagePreview(null); }
    };
    reader.readAsDataURL(croppedFile);
  };

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader /></div>;
  if (!profile) return <div className="p-8 text-red-500 font-semibold">Error loading profile.</div>;

  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "recently";

  return (
    <div className="pb-12">
      {/* Success toast */}
      {successMsg && (
        <div className="fixed right-6 top-6 z-[99999]">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3.5 text-sm font-semibold text-emerald-700 shadow-lg"
          >
            <CheckCircle2 size={18} /> {successMsg}
          </motion.div>
        </div>
      )}

      {apiError && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-3.5 text-sm font-semibold text-red-700">⚠️ {apiError}</div>
      )}

      {/* Profile hero — wide horizontal banner with avatar */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative mb-8 overflow-hidden rounded-[28px] bg-[#141414] p-6 text-white sm:p-8"
      >
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[var(--primary)]/20 blur-[70px]" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          {/* Avatar */}
          <div className="relative">
            <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-white/10 shadow-xl sm:h-24 sm:w-24">
              {imagePreview || profile.profileImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imagePreview ?? profile.profileImage} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[var(--primary)] text-3xl font-[900]">{profile.name?.[0]?.toUpperCase()}</div>
              )}
            </div>
            <label htmlFor="avatar-upload" className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white text-[#141414] shadow-lg transition hover:scale-110">
              <Camera size={14} />
              <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="truncate text-xl font-[800] sm:text-2xl">{profile.name}</h1>
            <p className="mt-1 text-[13px] text-white/50">{profile.email}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-[12px] font-semibold text-white/50">
              {profile.isVerified && (
                <span className="inline-flex items-center gap-1 text-emerald-300"><CheckCircle2 size={13} /> Verified</span>
              )}
              <span className="inline-flex items-center gap-1"><CalendarDays size={12} /> Since {memberSince}</span>
              <span className="inline-flex items-center gap-1"><MapPin size={12} /> {profile.addresses?.length || 0} addresses</span>
            </div>
          </div>
          {/* Edit toggle */}
          <button
            onClick={() => { setEditMode(!editMode); setProfileErrors({}); }}
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2.5 text-[13px] font-bold backdrop-blur-sm transition hover:bg-white/20"
          >
            <Pencil size={13} /> {editMode ? "Cancel" : "Edit"}
          </button>
        </div>
      </motion.section>

      {/* Content — two column */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Main column */}
        <div className="space-y-5">
          {/* Personal info */}
          <section className="rounded-[22px] border border-[var(--border)] bg-white p-6">
            <h2 className="text-[17px] font-[800] text-[var(--text-primary)]">Personal Information</h2>
            {editMode ? (
              <form onSubmit={handleUpdateBasic} className="mt-5 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Input id="name" label="Full Name" value={basicForm.name} onChange={e => { setBasicForm({ ...basicForm, name: e.target.value }); setProfileErrors(prev => ({ ...prev, name: undefined })); }} />
                    <FieldError message={profileErrors.name} />
                  </div>
                  <div>
                    <label className="input-label" htmlFor="phone">Phone Number</label>
                    <div className="flex gap-2">
                      <div className="flex h-[46px] items-center rounded-xl border border-[var(--border)] bg-[var(--surface-3)] px-3 text-sm font-bold text-[var(--text-muted)]">+91</div>
                      <input id="phone" type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} className="input flex-1" placeholder="9876543210"
                        value={basicForm.phone} onChange={e => { setBasicForm({ ...basicForm, phone: sanitizeIndianPhone(e.target.value) }); setProfileErrors(prev => ({ ...prev, phone: undefined })); }} />
                    </div>
                    <FieldError message={profileErrors.phone} />
                  </div>
                </div>
                <Input id="email" label="Email Address" value={profile.email} readOnly disabled />
                <div className="flex gap-3 pt-1">
                  <Button type="submit" loading={saving}>Save Changes</Button>
                  <Button type="button" variant="ghost" onClick={() => { setEditMode(false); setBasicForm({ name: profile.name, phone: getIndianPhoneDigits(profile.phone) }); setProfileErrors({}); }}>Cancel</Button>
                </div>
              </form>
            ) : (
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                {[
                  { icon: User, label: "Name", value: profile.name },
                  { icon: Mail, label: "Email", value: profile.email },
                  { icon: Phone, label: "Phone", value: profile.phone || "Not added" },
                ].map((f) => (
                  <div key={f.label} className="flex items-center gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-3)]">
                      <f.icon size={16} className="text-[var(--primary)]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{f.label}</p>
                      <p className="truncate text-[14px] font-semibold text-[var(--text-primary)]">{f.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Saved Addresses */}
          <section className="rounded-[22px] border border-[var(--border)] bg-white p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-[17px] font-[800] text-[var(--text-primary)]">
                <MapPin size={17} className="text-[var(--primary)]" /> Saved Addresses
              </h2>
            </div>
            <AddressList
              addresses={profile.addresses || []}
              onAdd={async (addr) => { try { const res = await userService.addAddress(addr); setProfile({ ...profile, addresses: res.data.data }); showSuccess("Address added!"); } catch (err) { setApiError(getErrorMessage(err)); } }}
              onUpdate={async (id, addr) => { try { const res = await userService.updateAddress(id, addr); setProfile({ ...profile, addresses: res.data.data }); showSuccess("Address updated!"); } catch (err) { setApiError(getErrorMessage(err)); } }}
              onDelete={async (id) => { try { const res = await userService.deleteAddress(id); setProfile({ ...profile, addresses: res.data.data }); showSuccess("Address deleted!"); } catch (err) { setApiError(getErrorMessage(err)); } }}
              onSetDefault={async (id) => { try { const res = await userService.setDefaultAddress(id); setProfile({ ...profile, addresses: res.data.data }); showSuccess("Default address updated!"); } catch (err) { setApiError(getErrorMessage(err)); } }}
            />
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">
          {/* Security */}
          <section className="rounded-[22px] border border-[var(--border)] bg-white p-6">
            <h2 className="flex items-center gap-2 text-[17px] font-[800] text-[var(--text-primary)]">
              <Shield size={17} className="text-[var(--primary)]" /> Security
            </h2>
            <form onSubmit={handleChangePassword} className="mt-5 space-y-3.5">
              <div>
                <label className="input-label" htmlFor="oldPwd">Current Password</label>
                <div className="relative">
                  <input id="oldPwd" type={showOldPwd ? "text" : "password"} className="input pr-11" placeholder="••••••••"
                    value={pwdForm.oldPassword} onChange={e => { setPwdForm({ ...pwdForm, oldPassword: e.target.value }); setPwdErrors(prev => ({ ...prev, oldPassword: undefined })); }} />
                  <button type="button" onClick={() => setShowOldPwd(!showOldPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                    {showOldPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <FieldError message={pwdErrors.oldPassword} />
              </div>
              <div>
                <label className="input-label" htmlFor="newPwd">New Password</label>
                <div className="relative">
                  <input id="newPwd" type={showNewPwd ? "text" : "password"} className="input pr-11" placeholder="Min. 8 chars"
                    value={pwdForm.newPassword} onChange={e => { setPwdForm({ ...pwdForm, newPassword: e.target.value }); setPwdErrors(prev => ({ ...prev, newPassword: undefined })); }} />
                  <button type="button" onClick={() => setShowNewPwd(!showNewPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                    {showNewPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <FieldError message={pwdErrors.newPassword} />
                <PasswordStrength score={pwdStrength.score} message={pwdStrength.message} />
              </div>
              <div>
                <label className="input-label" htmlFor="confirmPwd">Confirm Password</label>
                <div className="relative">
                  <input id="confirmPwd" type={showConfirmPwd ? "text" : "password"} className="input pr-11" placeholder="Re-enter"
                    value={confirmPwd} onChange={e => { setConfirmPwd(e.target.value); setPwdErrors(prev => ({ ...prev, confirmPassword: undefined })); }} />
                  <button type="button" onClick={() => setShowConfirmPwd(!showConfirmPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                    {showConfirmPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <FieldError message={pwdErrors.confirmPassword} />
              </div>
              <Button type="submit" variant="ghost" size="sm">Update Password</Button>
            </form>
          </section>

          {/* Sign out */}
          <button onClick={logout} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 py-3.5 text-[14px] font-bold text-red-600 transition hover:bg-red-100">
            <LogOut size={16} /> Sign out
          </button>
        </aside>
      </div>

      {/* OTP Modal */}
      {phoneOtpMode && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/30 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-[90%] max-w-[400px] rounded-[24px] bg-white p-7 shadow-2xl"
          >
            <h2 className="text-xl font-[800] text-[var(--text-primary)]">Verify Phone</h2>
            <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
              Enter the 6-digit code sent to <span className="font-bold text-[var(--text-primary)]">+91 {basicForm.phone}</span>
            </p>
            <form onSubmit={handleVerifyPhoneOtp} className="mt-5">
              <Input id="phoneOtp" value={phoneOtp} onChange={e => { setPhoneOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setOtpError(null); }} placeholder="Enter 6-digit code" />
              {otpError && <p className="mt-1.5 text-xs font-medium text-red-600">{otpError}</p>}
              <div className="mt-5 flex gap-3">
                <Button type="button" variant="ghost" size="full" onClick={() => { setPhoneOtpMode(false); setPhoneOtp(""); setOtpError(null); }}>Cancel</Button>
                <Button type="submit" size="full" loading={saving}>Verify</Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {cropperSrc && <ImageCropper imageSrc={cropperSrc} onCropDone={handleCropDone} onCancel={() => setCropperSrc(null)} />}
    </div>
  );
}

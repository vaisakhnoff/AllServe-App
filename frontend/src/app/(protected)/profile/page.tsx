"use client";

import { useCallback, useEffect, useState } from "react";
import { UserProfile } from "@/types/user.types";
import { userService } from "@/services/user";
import { getErrorMessage } from "@/utils/errorHandler";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { AddressList } from "@/components/user/AddressList";
import { Loader } from "@/components/common/Loader";
import { ImageCropper } from "@/components/common/ImageCropper";
import { validatePasswordStrength, doPasswordsMatch, validateProfileForm, validateProfilePasswordForm, ProfileErrors, ProfilePwdErrors } from "@/utils/validation";
import { UI_MESSAGES } from '@/shared/messages';
import { PasswordStrength } from "@/components/common/PasswordStrength";
import { Camera, Mail, Phone, MapPin, CreditCard, Shield, CheckCircle2, Pencil, ArrowLeft, LogOut, Eye, EyeOff, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { ROUTES } from "@/shared/routes";

const sanitizeIndianPhone = (value: string) => value.replace(/\D/g, "").slice(0, 10);
const getIndianPhoneDigits = (value?: string) => {
  const digits = (value || "").replace(/\D/g, "");
  return digits.startsWith("91") && digits.length > 10 ? digits.slice(2, 12) : digits.slice(0, 10);
};
const formatIndianPhone = (value: string) => `+91${sanitizeIndianPhone(value)}`;

const FieldError = ({ message }: { message?: string }) => {
  if (!message) return null;
  return <p className="text-red-600 text-xs mt-1 font-medium">{message}</p>;
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

  const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(null), 3000); };

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

  if (loading) return <div className="flex justify-center items-center min-h-[60vh]"><Loader /></div>;
  if (!profile) return <div className="p-8 text-red-500 font-semibold">Error loading profile.</div>;

  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "recently";

  return (
    <div className="max-w-[1040px] mx-auto space-y-6 fade-up">
      {/* Success toast */}
      {successMsg && (
        <div className="fixed top-6 right-6 z-[99999]">
          <div className="fade-up bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-3.5 flex items-center gap-3 text-emerald-700 font-semibold shadow-lg shadow-emerald-500/10">
            <CheckCircle2 size={18} /> {successMsg}
          </div>
        </div>
      )}

      {apiError && (
        <div className="bg-red-50 border border-red-100 rounded-2xl px-5 py-4 text-red-600 font-semibold text-sm">⚠️ {apiError}</div>
      )}

      {/* Top bar */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link href={ROUTES.DASHBOARD} className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 hover:text-[var(--primary)] hover:bg-purple-50 transition-all">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Profile</h1>
            <p className="text-sm text-slate-500 mt-0.5">Manage your account settings</p>
          </div>
        </div>
        <button
          onClick={() => { setEditMode(!editMode); setProfileErrors({}); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-50 text-[var(--primary)] font-bold text-sm hover:bg-purple-100 transition-all">
          <Pencil size={14} /> {editMode ? "Cancel" : "Edit Profile"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6 items-start">
        {/* LEFT COLUMN */}
        <div className="space-y-4">
          {/* Avatar card */}
          <div className="card p-8 text-center">
            <div className="relative w-[110px] h-[110px] mx-auto mb-5">
              <div className="w-[110px] h-[110px] rounded-full overflow-hidden bg-gradient-to-br from-purple-100 to-violet-100 border-4 border-white shadow-lg shadow-purple-500/10 flex items-center justify-center">
                {imagePreview || profile.profileImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imagePreview ?? profile.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-extrabold text-[var(--primary)]">{profile.name?.[0]?.toUpperCase()}</span>
                )}
              </div>
              <label htmlFor="avatar-upload" className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-[var(--primary)] border-3 border-white flex items-center justify-center cursor-pointer shadow-lg shadow-purple-500/30 hover:scale-110 transition-transform">
                <Camera size={14} color="white" />
                <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            </div>
            <p className="font-extrabold text-slate-900 text-lg">{profile.name}</p>
            <p className="text-slate-500 text-sm mt-1">Member since {memberSince}</p>
            {profile.isVerified && (
              <div className="inline-flex items-center gap-1.5 bg-purple-50 text-[var(--primary)] text-xs font-bold px-3.5 py-1.5 rounded-full mt-3 border border-purple-100">
                <CheckCircle2 size={13} /> Verified Client
              </div>
            )}
          </div>

          {/* Contact details */}
          <div className="card p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Contact Details</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                  <Mail size={16} className="text-[var(--primary)]" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Email</p>
                  <p className="text-sm text-slate-900 font-semibold mt-0.5">{profile.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <Phone size={16} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Phone</p>
                  <p className="text-sm text-slate-900 font-semibold mt-0.5">
                    {profile.phone || <span className="text-slate-400 italic font-normal">Not added</span>}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-4">
          {/* Personal info */}
          <div className="card p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-5">Personal Information</h3>
            {editMode ? (
              <form onSubmit={handleUpdateBasic} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Input id="name" label="Full Name" value={basicForm.name} onChange={e => { setBasicForm({ ...basicForm, name: e.target.value }); setProfileErrors(prev => ({ ...prev, name: undefined })); }} />
                    <FieldError message={profileErrors.name} />
                  </div>
                  <div>
                    <label className="input-label" htmlFor="phone">Phone Number</label>
                    <div className="flex gap-2">
                      <div className="px-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center font-bold text-slate-500 text-sm h-[46px]">+91</div>
                      <input id="phone" type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} className="input flex-1" placeholder="9876543210"
                        value={basicForm.phone} onChange={e => { setBasicForm({ ...basicForm, phone: sanitizeIndianPhone(e.target.value) }); setProfileErrors(prev => ({ ...prev, phone: undefined })); }} />
                    </div>
                    <FieldError message={profileErrors.phone} />
                  </div>
                </div>
                <Input id="email" label="Email Address" value={profile.email} readOnly disabled />
                <div className="flex gap-3 pt-2">
                  <Button type="submit" loading={saving}>Save Changes</Button>
                  <Button type="button" variant="ghost" onClick={() => { setEditMode(false); setBasicForm({ name: profile.name, phone: getIndianPhoneDigits(profile.phone) }); setProfileErrors({}); }}>Cancel</Button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[
                  { label: "First Name", value: profile.name?.split(" ")[0] },
                  { label: "Last Name", value: profile.name?.split(" ").slice(1).join(" ") || "—" },
                  { label: "Email Address", value: profile.email },
                  { label: "Phone Number", value: profile.phone || "Not added" },
                ].map(field => (
                  <div key={field.label}>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{field.label}</p>
                    <p className="text-[0.9375rem] font-semibold text-slate-900">{field.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Addresses */}
          <div className="card p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MapPin size={15} className="text-[var(--primary)]" /> Saved Addresses
              </h3>
            </div>
            <AddressList
              addresses={profile.addresses || []}
              onAdd={async (addr) => { try { const res = await userService.addAddress(addr); setProfile({ ...profile, addresses: res.data.data }); showSuccess("Address added!"); } catch (err) { setApiError(getErrorMessage(err)); } }}
              onUpdate={async (id, addr) => { try { const res = await userService.updateAddress(id, addr); setProfile({ ...profile, addresses: res.data.data }); showSuccess("Address updated!"); } catch (err) { setApiError(getErrorMessage(err)); } }}
              onDelete={async (id) => { try { const res = await userService.deleteAddress(id); setProfile({ ...profile, addresses: res.data.data }); showSuccess("Address deleted!"); } catch (err) { setApiError(getErrorMessage(err)); } }}
              onSetDefault={async (id) => { try { const res = await userService.setDefaultAddress(id); setProfile({ ...profile, addresses: res.data.data }); showSuccess("Default address updated!"); } catch (err) { setApiError(getErrorMessage(err)); } }}
            />
          </div>

          {/* Payment + Security */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card p-6">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                <CreditCard size={15} className="text-[var(--primary)]" /> Payment Methods
              </h3>
              <div className="bg-slate-900 rounded-xl px-3 py-2 inline-flex items-center gap-2 mb-3">
                <span className="text-[11px] font-extrabold text-blue-400 tracking-wider">VISA</span>
              </div>
              <p className="text-sm text-slate-900 font-semibold">Ending in 4242</p>
              <button onClick={() => showSuccess("Payment management coming soon!")} className="text-[var(--primary)] font-bold text-sm mt-3 hover:text-purple-700 transition-colors">
                Manage payments →
              </button>
            </div>

            <div className="card p-6">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Shield size={15} className="text-[var(--primary)]" /> Account Security
              </h3>
              <form onSubmit={handleChangePassword} className="space-y-3.5">
                <div>
                  <label className="input-label" htmlFor="oldPwd">Current Password</label>
                  <div className="relative">
                    <input id="oldPwd" type={showOldPwd ? "text" : "password"} className="input pr-11" placeholder="Enter current password"
                      value={pwdForm.oldPassword} onChange={e => { setPwdForm({ ...pwdForm, oldPassword: e.target.value }); setPwdErrors(prev => ({ ...prev, oldPassword: undefined })); }} />
                    <button type="button" onClick={() => setShowOldPwd(!showOldPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showOldPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <FieldError message={pwdErrors.oldPassword} />
                </div>
                <div>
                  <label className="input-label" htmlFor="newPwd">New Password</label>
                  <div className="relative">
                    <input id="newPwd" type={showNewPwd ? "text" : "password"} className="input pr-11" placeholder="Min. 8 characters"
                      value={pwdForm.newPassword} onChange={e => { setPwdForm({ ...pwdForm, newPassword: e.target.value }); setPwdErrors(prev => ({ ...prev, newPassword: undefined })); }} />
                    <button type="button" onClick={() => setShowNewPwd(!showNewPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showNewPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <FieldError message={pwdErrors.newPassword} />
                  <PasswordStrength score={pwdStrength.score} message={pwdStrength.message} />
                </div>
                <div>
                  <label className="input-label" htmlFor="confirmPwd">Confirm Password</label>
                  <div className="relative">
                    <input id="confirmPwd" type={showConfirmPwd ? "text" : "password"} className="input pr-11" placeholder="Re-enter new password"
                      value={confirmPwd} onChange={e => { setConfirmPwd(e.target.value); setPwdErrors(prev => ({ ...prev, confirmPassword: undefined })); }} />
                    <button type="button" onClick={() => setShowConfirmPwd(!showConfirmPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showConfirmPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <FieldError message={pwdErrors.confirmPassword} />
                </div>
                <Button type="submit" variant="ghost" size="sm" style={{ marginTop: 4, height: 40 }}>Update Password</Button>
              </form>
            </div>
          </div>

          {/* Sign out */}
          <div className="text-center pt-2">
            <button onClick={logout} className="text-red-500 font-bold text-sm inline-flex items-center gap-2 hover:text-red-600 transition-colors">
              <LogOut size={15} /> Sign out of account
            </button>
          </div>
        </div>
      </div>

      {/* OTP Modal */}
      {phoneOtpMode && (
        <div className="fixed inset-0 z-[10000] bg-black/30 backdrop-blur-md flex items-center justify-center">
          <div className="fade-up bg-white rounded-[24px] p-8 w-[90%] max-w-[420px] shadow-2xl">
            <h2 className="text-xl font-extrabold text-slate-900 mb-2">Verify Phone Number</h2>
            <p className="text-slate-500 text-sm mb-6">
              We sent a 6-digit code to <strong className="text-slate-900">+91 {basicForm.phone}</strong>.
            </p>
            <form onSubmit={handleVerifyPhoneOtp}>
              <div className="mb-6">
                <Input id="phoneOtp" value={phoneOtp} onChange={e => { setPhoneOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setOtpError(null); }} placeholder="Enter 6-digit code" />
                {otpError && <p className="text-red-600 text-xs mt-1.5 font-medium">{otpError}</p>}
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="ghost" size="full" onClick={() => { setPhoneOtpMode(false); setPhoneOtp(""); setOtpError(null); }}>Cancel</Button>
                <Button type="submit" size="full" loading={saving}>Verify</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {cropperSrc && <ImageCropper imageSrc={cropperSrc} onCropDone={handleCropDone} onCancel={() => setCropperSrc(null)} />}
    </div>
  );
}

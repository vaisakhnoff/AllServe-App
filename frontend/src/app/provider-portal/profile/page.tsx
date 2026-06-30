"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useState } from "react";
import { providerService } from "@/services/provider";
import { ProviderProfile } from "@/types/provider.types";
import { ImageCropper } from "@/components/common/ImageCropper";
import { ProviderPortalShell } from "@/components/provider/ProviderPortalShell";
import { PasswordStrength } from "@/components/common/PasswordStrength";
import { validatePasswordStrength } from "@/utils/validation";
import { UI_MESSAGES } from "@/shared/messages";
import { Camera, Mail, Phone, MapPin, Shield, CheckCircle2, Pencil, Eye, EyeOff, UserRound, Briefcase } from "lucide-react";
import toast from "react-hot-toast";

export default function ProviderProfilePage() {
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form
  const [description, setDescription] = useState("");
  const [experience, setExperience] = useState("");

  // Password
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showOldPwd, setShowOldPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  // Photo
  const [cropperSrc, setCropperSrc] = useState<string | null>(null);

  // Success message
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(null), 5000); };

  const fetchProfile = useCallback(async () => {
    try {
      const res = await providerService.getProfile();
      const p = res.data.data;
      setProfile(p);
      setDescription(p.description);
      setExperience(p.experience);
    } catch {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await providerService.updateProfile({ description, experience });
      setProfile(res.data.data);
      setEditMode(false);
      showSuccess(UI_MESSAGES.PROFILE_UPDATED);
      toast.success(UI_MESSAGES.PROFILE_UPDATED);
    } catch { toast.error("Failed to update profile"); }
    finally { setSaving(false); }
  };

  const pwdStrength = validatePasswordStrength(newPassword);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword) { toast.error("Enter current password"); return; }
    if (newPassword.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (newPassword !== confirmPwd) { toast.error("Passwords do not match"); return; }
    try {
      await providerService.changePassword({ oldPassword, newPassword });
      setOldPassword(""); setNewPassword(""); setConfirmPwd("");
      setShowOldPwd(false); setShowNewPwd(false); setShowConfirmPwd(false);
      showSuccess(UI_MESSAGES.PASSWORD_UPDATED);
      toast.success(UI_MESSAGES.PASSWORD_UPDATED);
    } catch (err: unknown) {
      toast.error(err?.response?.data?.message || "Failed to update password");
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        const res = await providerService.uploadHeadshot(base64);
        setProfile(res.data.data);
        toast.success("Profile photo updated!");
      } catch { toast.error("Failed to upload photo"); }
    };
    reader.readAsDataURL(croppedFile);
  };

  if (loading) {
    return (
      <ProviderPortalShell>
        <div className="flex h-64 items-center justify-center">
          <p className="text-slate-500">Loading profile...</p>
        </div>
      </ProviderPortalShell>
    );
  }

  if (!profile) return null;

  const categoryName = typeof profile.categoryId === "object" ? profile.categoryId?.name : "Specialist";

  return (
    <ProviderPortalShell>
      {/* Success banner */}
      {successMsg && (
        <div className="fixed top-6 right-6 z-[99999]">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-6 py-4 flex items-center gap-3 text-emerald-700 font-semibold shadow-xl shadow-emerald-500/10 min-w-[280px]">
            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
            <p className="text-sm font-bold">{successMsg}</p>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Profile</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage your professional profile</p>
        </div>
        <button
          onClick={() => setEditMode(!editMode)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 text-indigo-600 font-bold text-sm hover:bg-indigo-100 transition-all"
        >
          <Pencil size={14} /> {editMode ? "Cancel" : "Edit Profile"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6 items-start">
        {/* LEFT COLUMN */}
        <div className="space-y-4">
          {/* Avatar card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="relative w-[110px] h-[110px] mx-auto mb-5">
              <div className="w-[110px] h-[110px] rounded-full overflow-hidden bg-gradient-to-br from-indigo-100 to-slate-100 border-4 border-white shadow-lg flex items-center justify-center">
                {profile.headshot ? (
                  <img src={profile.headshot} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <UserRound size={40} className="text-indigo-600" />
                )}
              </div>
              <label className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-indigo-600 border-3 border-white flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-transform">
                <Camera size={14} color="white" />
                <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              </label>
            </div>
            <p className="font-extrabold text-slate-900 text-lg">{profile.name}</p>
            {profile.businessName && <p className="text-sm text-slate-500">{profile.businessName}</p>}
            <p className="text-sm font-semibold text-indigo-600 mt-1">{categoryName}</p>
            <div className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-600 text-xs font-bold px-3.5 py-1.5 rounded-full mt-3 border border-indigo-100">
              <CheckCircle2 size={13} /> Verified Provider
            </div>
          </div>

          {/* Contact details */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Contact Details</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                  <Mail size={16} className="text-indigo-600" />
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
                  <p className="text-sm text-slate-900 font-semibold mt-0.5">{profile.phone || "Not added"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                  <MapPin size={16} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Service Area</p>
                  <p className="text-sm text-slate-900 font-semibold mt-0.5">{profile.serviceAreas.join(", ") || "Not set"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                  <Briefcase size={16} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Experience</p>
                  <p className="text-sm text-slate-900 font-semibold mt-0.5">{profile.experience || "Not set"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-4">
          {/* Personal info / edit */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-5">Professional Details</h3>
            {editMode ? (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 block">Experience</label>
                  <select
                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-400"
                    value={experience}
                    onChange={e => setExperience(e.target.value)}
                  >
                    <option value="1-3 Years">1-3 Years</option>
                    <option value="3-7 Years">3-7 Years</option>
                    <option value="7+ Years">7+ Years</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 block">Description</label>
                  <textarea
                    className="w-full resize-none rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400 min-h-[120px]"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    maxLength={500}
                  />
                  <p className="text-xs text-slate-400 text-right mt-1">{description.length}/500</p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-50">
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                  <button type="button" onClick={() => { setEditMode(false); setDescription(profile.description); setExperience(profile.experience); }} className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name</p>
                  <p className="text-[0.9375rem] font-semibold text-slate-900">{profile.name}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Business Name</p>
                  <p className="text-[0.9375rem] font-semibold text-slate-900">{profile.businessName || "—"}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Category</p>
                  <p className="text-[0.9375rem] font-semibold text-slate-900">{categoryName}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Experience</p>
                  <p className="text-[0.9375rem] font-semibold text-slate-900">{profile.experience || "—"}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{profile.description || "No description provided."}</p>
                </div>
              </div>
            )}
          </div>

          {/* Password change */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Shield size={15} className="text-indigo-600" /> Change Password
            </h3>
            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Current Password</label>
                <div className="relative">
                  <input type={showOldPwd ? "text" : "password"} className="w-full rounded-lg border border-slate-200 px-4 py-2.5 pr-11 text-sm outline-none focus:border-indigo-400" placeholder="Enter current password"
                    value={oldPassword} onChange={e => setOldPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowOldPwd(!showOldPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showOldPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">New Password</label>
                <div className="relative">
                  <input type={showNewPwd ? "text" : "password"} className="w-full rounded-lg border border-slate-200 px-4 py-2.5 pr-11 text-sm outline-none focus:border-indigo-400" placeholder="Min. 8 characters"
                    value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowNewPwd(!showNewPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showNewPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {newPassword && <PasswordStrength score={pwdStrength.score} message={pwdStrength.message} />}
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Confirm Password</label>
                <div className="relative">
                  <input type={showConfirmPwd ? "text" : "password"} className="w-full rounded-lg border border-slate-200 px-4 py-2.5 pr-11 text-sm outline-none focus:border-indigo-400" placeholder="Re-enter new password"
                    value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} />
                  <button type="button" onClick={() => setShowConfirmPwd(!showConfirmPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showConfirmPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 mt-1">
                Update Password
              </button>
            </form>
          </div>
        </div>
      </div>

      {cropperSrc && <ImageCropper imageSrc={cropperSrc} onCropDone={handleCropDone} onCancel={() => setCropperSrc(null)} aspectRatio={1} />}
    </ProviderPortalShell>
  );
}

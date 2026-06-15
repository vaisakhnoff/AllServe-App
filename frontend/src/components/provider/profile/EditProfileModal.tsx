"use client";

import { useState } from "react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { OtpInput } from "@/components/common/OtpInput";
import { ProviderProfile } from "@/types/provider.types";
import { userService } from "@/services/user";
import { providerService } from "@/services/provider";
import toast from "react-hot-toast";
import { getErrorMessage } from "@/utils/errorHandler";
import { validateProviderProfileForm, ProviderProfileErrors } from "@/utils/validation";
import { UI_MESSAGES } from "@/shared/messages";

const sanitizeIndianPhone = (value: string) => value.replace(/\D/g, "").slice(0, 10);
const getIndianPhoneDigits = (value?: string) => {
  const digits = (value || "").replace(/\D/g, "");
  return digits.startsWith("91") && digits.length > 10 ? digits.slice(2, 12) : digits.slice(0, 10);
};
const formatIndianPhone = (value: string) => `+91${sanitizeIndianPhone(value)}`;

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ProviderProfile;
  onProfileUpdate: () => void;
}

export function EditProfileModal({ isOpen, onClose, profile, onProfileUpdate }: EditProfileModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Forms State
  const [name, setName] = useState(profile.name || "");
  const [description, setDescription] = useState(profile.description || "");
  const [experience, setExperience] = useState(profile.experience || "");
  const [serviceAreas, setServiceAreas] = useState(profile.serviceAreas.join(", ") || "");

  const [email, setEmail] = useState(profile.email || "");
  const [phone, setPhone] = useState(getIndianPhoneDigits(profile.phone));
  const [newPassword, setNewPassword] = useState("");
  const [otp, setOtp] = useState("");
  
  const [otpSentFor, setOtpSentFor] = useState<"email" | "phone" | "password" | null>(null);
  const [errors, setErrors] = useState<ProviderProfileErrors>({});

  const handleSaveAll = async () => {
    const validationErrors = validateProviderProfileForm({ name, description, experience, serviceAreas });
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      setIsLoading(true);
      const areas = serviceAreas.split(",").map(a => a.trim()).filter(Boolean);
      await providerService.updateProfile({ experience, description, serviceAreas: areas });
      if (name !== profile.name) {
        await userService.updateProfile({ name });
      }
      toast.success(UI_MESSAGES.PROVIDER_PROFILE_UPDATED);
      onProfileUpdate();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err) || UI_MESSAGES.SOMETHING_WENT_WRONG);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestOtp = async (type: "email" | "phone" | "password") => {
    try {
      setIsLoading(true);
      if (type === "email") {
        await userService.sendEmailOtp(email);
      } else if (type === "phone") {
        await userService.sendPhoneOtp(formatIndianPhone(phone));
      } else if (type === "password") {
        await userService.sendPasswordOtp();
      }
      setOtpSentFor(type);
      toast.success(UI_MESSAGES.OTP_SENT);
    } catch (err) {
      toast.error(getErrorMessage(err) || UI_MESSAGES.SOMETHING_WENT_WRONG);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      setIsLoading(true);
      if (otpSentFor === "email") {
        await userService.verifyEmailOtp(email, otp);
      } else if (otpSentFor === "phone") {
        await userService.verifyPhoneOtp(formatIndianPhone(phone), otp);
      } else if (otpSentFor === "password") {
        await userService.verifyPasswordOtp(otp, newPassword);
      }
      toast.success(UI_MESSAGES.VERIFY_SUCCESS);
      setOtpSentFor(null);
      setOtp("");
      onProfileUpdate();
    } catch (err) {
      toast.error(getErrorMessage(err) || UI_MESSAGES.OTP_INVALID);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Provider Profile" className="max-w-2xl">
      <div className="space-y-8 mt-2">
        
        {/* Professional Identity */}
        <section>
          <h3 className="text-sm font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Professional Identity</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
            </div>
            <div>
              <Input label="Experience (Years)" value={experience} onChange={(e) => setExperience(e.target.value)} />
              {errors.experience && <p className="mt-1 text-xs text-red-500">{errors.experience}</p>}
            </div>
          </div>
          <div className="mt-4">
            <label className="input-label">Description</label>
            <textarea
              className="input mt-1"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
          </div>
          <div className="mt-4">
            <Input label="Service Areas (Comma separated)" value={serviceAreas} onChange={(e) => setServiceAreas(e.target.value)} />
            {errors.serviceAreas && <p className="mt-1 text-xs text-red-500">{errors.serviceAreas}</p>}
          </div>
        </section>

        {/* Contact & Security */}
        <section>
          <h3 className="text-sm font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Account Security</h3>
          
          {!otpSentFor ? (
            <div className="space-y-4">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Input type="email" label="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <Button 
                  variant="ghost" 
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 h-[42px]" 
                  onClick={() => handleRequestOtp("email")} 
                  disabled={!email || isLoading || email === profile.email}
                >
                  Verify Change
                </Button>
              </div>

              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="input-label">Phone Number</label>
                  <div className="flex gap-2 mt-1">
                    <div className="flex h-[42px] items-center rounded-lg border border-slate-200 bg-slate-50 px-4 font-semibold text-slate-500">+91</div>
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]{10}"
                      maxLength={10}
                      className="input flex-1"
                      placeholder="9876543210"
                      value={phone}
                      onChange={(e) => setPhone(sanitizeIndianPhone(e.target.value))}
                    />
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 h-[42px]" 
                  onClick={() => handleRequestOtp("phone")} 
                  disabled={phone.length !== 10 || isLoading || formatIndianPhone(phone) === profile.phone}
                >
                  Verify Change
                </Button>
              </div>
              
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Input type="password" label="New Password" placeholder="Leave blank to keep current" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                </div>
                <Button 
                  variant="ghost" 
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 h-[42px]" 
                  onClick={() => handleRequestOtp("password")} 
                  disabled={!newPassword || isLoading}
                >
                  Update Password
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-5">
              <h4 className="text-sm font-bold text-slate-900 mb-4">Enter OTP for {otpSentFor} verification</h4>
              <OtpInput value={otp} onChange={setOtp} />
              <div className="mt-5 flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={() => setOtpSentFor(null)}>Cancel</Button>
                <Button className="flex-1" onClick={handleVerifyOtp} disabled={otp.length !== 6 || isLoading}>Verify & Save {otpSentFor}</Button>
              </div>
            </div>
          )}
        </section>

      </div>

      {/* Main Save Buttons */}
      <div className="mt-8 flex gap-3 pt-5 border-t border-slate-100">
        <Button onClick={handleSaveAll} loading={isLoading} className="flex-1">Save Profile Changes</Button>
        <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
      </div>
    </Modal>
  );
}

"use client";

/**
 * AddressContactStep
 *
 * Reusable pre-booking step used on all service request pages.
 * Lets the user:
 *   1. Select from their saved addresses
 *   2. Add a brand-new address inline (full validation)
 *   3. Confirm / edit their contact phone number
 *
 * Props:
 *   addresses       - saved addresses from the user profile
 *   selectedAddress - currently selected Address | null
 *   onSelectAddress - callback when user picks a saved address
 *   contactPhone    - current phone string
 *   onPhoneChange   - callback on phone field change
 *   phoneError      - external error string (from parent validation)
 *   addressError    - external error string
 *   onAddressAdded  - called after user successfully adds a new address
 *                     (parent must save it to the backend and refresh addresses)
 *   accentColor     - tailwind color prefix e.g. "indigo" | "purple" | "blue"
 */

import { useState } from "react";
import { MapPin, Phone, Plus,   ChevronUp, CheckCircle2, AlertCircle } from "lucide-react";
import { Address, AddressDto } from "@/types/user.types";
import { userService } from "@/services/user";
import toast from "react-hot-toast";

interface AddressContactStepProps {
  addresses: Address[];
  selectedAddress: Address | null;
  onSelectAddress: (addr: Address) => void;
  contactPhone: string;
  onPhoneChange: (v: string) => void;
  phoneError?: string;
  addressError?: string;
  /** Called after a new address is created and should be added to the list */
  onAddressAdded: (addr: Address) => void;
  accentColor?: "indigo" | "purple" | "blue";
}

// ── blank address form state ──────────────────────────────────────────────────
interface NewAddrForm {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

const BLANK_ADDR: NewAddrForm = {
  street: "",
  city: "",
  state: "",
  zip: "",
  country: "India",
  isDefault: false,
};

// Indian state list for the dropdown
const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman and Nicobar Islands","Chandigarh","Dadra and Nagar Haveli and Daman and Diu",
  "Delhi","Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry",
];

export function AddressContactStep({
  addresses,
  selectedAddress,
  onSelectAddress,
  contactPhone,
  onPhoneChange,
  phoneError,
  addressError,
  onAddressAdded,
  accentColor = "indigo",
}: AddressContactStepProps) {
  const [showNewForm, setShowNewForm] = useState(false);
  const [newAddr, setNewAddr] = useState<NewAddrForm>(BLANK_ADDR);
  const [newAddrErrors, setNewAddrErrors] = useState<Partial<Record<keyof NewAddrForm, string>>>({});
  const [saving, setSaving] = useState(false);

  const accent = {
    indigo: {
      ring: "focus:border-indigo-400 focus:ring-indigo-100",
      selected: "border-indigo-500 bg-indigo-50",
      btn: "bg-indigo-600 hover:bg-indigo-700",
      link: "text-indigo-600 hover:text-indigo-700",
      badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
    },
    purple: {
      ring: "focus:border-purple-400 focus:ring-purple-100",
      selected: "border-purple-500 bg-purple-50",
      btn: "bg-purple-600 hover:bg-purple-700",
      link: "text-purple-600 hover:text-purple-700",
      badge: "bg-purple-50 text-purple-700 border-purple-200",
    },
    blue: {
      ring: "focus:border-blue-400 focus:ring-blue-100",
      selected: "border-blue-500 bg-blue-50",
      btn: "bg-blue-600 hover:bg-blue-700",
      link: "text-blue-600 hover:text-blue-700",
      badge: "bg-blue-50 text-blue-700 border-blue-200",
    },
  }[accentColor];

  const inputClass = (error?: string) =>
    `w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 ${accent.ring} ` +
    (error ? "border-red-300 bg-red-50" : "border-slate-200");

  // ── Validate new address form ─────────────────────────────────────────────
  const validateNewAddr = (): boolean => {
    const e: Partial<Record<keyof NewAddrForm, string>> = {};
    if (!newAddr.street.trim()) e.street = "Street address is required";
    else if (newAddr.street.trim().length < 5) e.street = "Street must be at least 5 characters";
    if (!newAddr.city.trim()) e.city = "City is required";
    if (!newAddr.state.trim()) e.state = "State is required";
    if (!newAddr.zip.trim()) e.zip = "PIN code is required";
    else if (!/^\d{6}$/.test(newAddr.zip.trim())) e.zip = "PIN code must be 6 digits";
    setNewAddrErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSaveNewAddr = async () => {
    if (!validateNewAddr()) return;
    setSaving(true);
    try {
      const dto: AddressDto = {
        street: newAddr.street.trim(),
        city: newAddr.city.trim(),
        state: newAddr.state.trim(),
        zip: newAddr.zip.trim(),
        country: newAddr.country,
        isDefault: newAddr.isDefault,
      };
      const res = await userService.addAddress(dto);
      // API returns the updated addresses array
      const saved = res.data.data;
      const newest = saved[saved.length - 1];
      toast.success("Address saved");
      onAddressAdded(newest);
      onSelectAddress(newest);
      setNewAddr(BLANK_ADDR);
      setNewAddrErrors({});
      setShowNewForm(false);
    } catch {
      toast.error("Failed to save address");
    } finally {
      setSaving(false);
    }
  };

  const field = (
    key: keyof NewAddrForm,
    label: string,
    placeholder: string,
    type: "text" | "select" = "text"
  ) => (
    <div>
      <label className="block text-xs font-bold text-slate-600 mb-1.5">{label}</label>
      {type === "select" ? (
        <select
          value={newAddr[key] as string}
          onChange={(e) => {
            setNewAddr((p) => ({ ...p, [key]: e.target.value }));
            setNewAddrErrors((p) => ({ ...p, [key]: undefined }));
          }}
          className={inputClass(newAddrErrors[key])}
        >
          <option value="">Select state</option>
          {INDIAN_STATES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          value={newAddr[key] as string}
          onChange={(e) => {
            setNewAddr((p) => ({ ...p, [key]: e.target.value }));
            setNewAddrErrors((p) => ({ ...p, [key]: undefined }));
          }}
          placeholder={placeholder}
          className={inputClass(newAddrErrors[key])}
        />
      )}
      {newAddrErrors[key] && (
        <p className="mt-1 text-xs font-medium text-red-600">{newAddrErrors[key]}</p>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      {/* ── Phone number ─────────────────────────────────────────────── */}
      <section className="premium-card p-5">
        <h3 className="text-sm font-black text-slate-900 mb-1 flex items-center gap-2">
          <Phone size={14} className={accent.link.split(" ")[0]} />
          Contact Number *
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          The provider will call this number to coordinate your service
        </p>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500 pointer-events-none">
            +91
          </span>
          <input
            type="tel"
            inputMode="numeric"
            value={contactPhone}
            onChange={(e) => {
              // Only allow digits, max 10
              const val = e.target.value.replace(/\D/g, "").slice(0, 10);
              onPhoneChange(val);
            }}
            placeholder="9876543210"
            maxLength={10}
            className={`w-full rounded-xl border pl-14 pr-4 py-3 text-sm outline-none transition focus:ring-2 ${accent.ring} ${
              phoneError ? "border-red-300 bg-red-50" : "border-slate-200"
            }`}
          />
          {contactPhone.length === 10 && !phoneError && (
            <CheckCircle2
              size={16}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500"
            />
          )}
        </div>
        {phoneError ? (
          <p className="mt-1.5 text-xs font-medium text-red-600 flex items-center gap-1">
            <AlertCircle size={12} /> {phoneError}
          </p>
        ) : (
          <p className="mt-1.5 text-xs text-slate-400">
            Indian mobile number starting with 6–9 ({contactPhone.length}/10)
          </p>
        )}
      </section>

      {/* ── Service address ───────────────────────────────────────────── */}
      <section className="premium-card p-5">
        <h3 className="text-sm font-black text-slate-900 mb-1 flex items-center gap-2">
          <MapPin size={14} className={accent.link.split(" ")[0]} />
          Service Location *
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          The provider will come to this address to perform the service
        </p>

        {/* Saved addresses */}
        <div className="space-y-2 mb-3">
          {addresses.map((a) => (
            <button
              key={a._id}
              type="button"
              onClick={() => onSelectAddress(a)}
              className={`w-full text-left rounded-xl border-2 p-3.5 transition-all ${
                selectedAddress?._id === a._id
                  ? accent.selected
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{a.street}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {a.city}, {a.state} — {a.zip}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {a.isDefault && (
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${accent.badge}`}>
                      Default
                    </span>
                  )}
                  {selectedAddress?._id === a._id && (
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {addressError && !showNewForm && (
          <p className="mb-3 text-xs font-medium text-red-600 flex items-center gap-1">
            <AlertCircle size={12} /> {addressError}
          </p>
        )}

        {/* Toggle to add new address */}
        <button
          type="button"
          onClick={() => setShowNewForm((v) => !v)}
          className={`inline-flex items-center gap-1.5 text-xs font-semibold ${accent.link} transition-colors`}
        >
          {showNewForm ? <ChevronUp size={14} /> : <Plus size={14} />}
          {showNewForm ? "Cancel new address" : "Add a new address"}
        </button>

        {/* Inline new address form */}
        {showNewForm && (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
            <p className="text-xs font-bold text-slate-700 mb-1">New Address</p>

            {field("street", "Street / House No. / Landmark *", "e.g. 42, MG Road, Opp. State Bank")}

            <div className="grid gap-3 sm:grid-cols-2">
              {field("city", "City *", "e.g. Bangalore")}
              {field("state", "State *", "", "select")}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {field("zip", "PIN Code *", "e.g. 560001")}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Country</label>
                <input
                  type="text"
                  value="India"
                  readOnly
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500 cursor-not-allowed outline-none"
                />
              </div>
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={newAddr.isDefault}
                onChange={(e) => setNewAddr((p) => ({ ...p, isDefault: e.target.checked }))}
                className={`h-4 w-4 rounded border-slate-300 accent-${accentColor}-600`}
              />
              <span className="text-xs font-semibold text-slate-700">Set as my default address</span>
            </label>

            <button
              type="button"
              onClick={handleSaveNewAddr}
              disabled={saving}
              className={`w-full rounded-xl py-2.5 text-sm font-bold text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${accent.btn}`}
            >
              {saving ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} /> Save Address
                </>
              )}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

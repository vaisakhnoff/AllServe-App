import React, { useState } from "react";
import { Address } from "@/types/user.types";
import { Button } from "../common/Button";
import { Input } from "../common/Input";
import { MapPin, Star, Trash2, Edit2 } from "lucide-react";
import { normalizeAddressForm, validateAddressForm } from "@/utils/validation";
import type { AddressErrors, AddressField } from "@/utils/validation";

const COUNTRIES = [
  "India", "United States", "United Kingdom", "Canada", "Australia",
  "Germany", "France", "Japan", "Singapore", "United Arab Emirates",
  "Saudi Arabia", "Qatar", "Kuwait", "Oman", "Bahrain",
  "Malaysia", "New Zealand", "South Africa", "Brazil", "Netherlands",
];

interface Props {
  addresses: Address[];
  onAdd: (address: Omit<Address, "_id">) => void;
  onUpdate: (id: string, address: Omit<Address, "_id">) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
}

export const AddressList: React.FC<Props> = ({ addresses, onAdd, onUpdate, onDelete, onSetDefault }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ street: "", city: "", state: "", zip: "", country: "", isDefault: false });
  const [errors, setErrors] = useState<AddressErrors>({});
  const [touched, setTouched] = useState<Partial<Record<AddressField, boolean>>>({});

  const resetValidation = () => {
    setErrors({});
    setTouched({});
  };

  const handleOpenEdit = (address?: Address) => {
    if (address) {
      setForm({
        street: address.street,
        city: address.city,
        state: address.state,
        zip: address.zip,
        country: address.country,
        isDefault: address.isDefault,
      });
      setEditingId(address._id);
    } else {
      setForm({
        street: "",
        city: "",
        state: "",
        zip: "",
        country: "",
        isDefault: addresses.length === 0,
      });
      setEditingId(null);
    }

    resetValidation();
    setIsEditing(true);
  };

  const getFieldError = (field: AddressField) => {
    return touched[field] ? errors[field] : undefined;
  };

  const handleFieldChange = (field: AddressField, value: string) => {
    const nextForm = { ...form, [field]: value };
    setForm(nextForm);

    if (touched[field]) {
      setErrors(validateAddressForm(nextForm));
    }
  };

  const handleFieldBlur = (field: AddressField) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validateAddressForm(form));
  };

  const handleSave = () => {
    const validationErrors = validateAddressForm(form);

    setTouched({
      street: true,
      city: true,
      state: true,
      zip: true,
      country: true,
    });
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const payload = normalizeAddressForm(form);

    if (editingId) {
      onUpdate(editingId, payload);
    } else {
      onAdd(payload);
    }

    setIsEditing(false);
    resetValidation();
  };

  return (
    <div className="flex flex-col gap-4">
      {addresses.length === 0 && !isEditing && (
        <div className="text-center p-6 border border-dashed border-gray-700 rounded-xl">
          <MapPin className="mx-auto text-gray-500 mb-2" size={24} />
          <p className="text-sm text-gray-400">No addresses saved yet.</p>
        </div>
      )}

      {addresses.map((addr) => (
        <div key={addr._id} className="card p-4 flex justify-between items-start">
          <div className="flex gap-3">
            <div className="mt-1 text-gray-400"><MapPin size={18} /></div>
            <div>
              <p className="text-white font-medium">{addr.street}</p>
              <p className="text-sm text-gray-400">{addr.city}, {addr.state} {addr.zip}</p>
              <p className="text-xs text-gray-500">{addr.country}</p>
              {addr.isDefault && <span className="inline-flex mt-2 items-center gap-1 text-xs bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded-full"><Star size={10} /> Default</span>}
            </div>
          </div>
          <div className="flex gap-2">
            {!addr.isDefault && (
              <button onClick={() => onSetDefault(addr._id)} className="p-2 text-gray-400 hover:text-white transition" title="Set Default">
                <Star size={16} />
              </button>
            )}
            <button onClick={() => handleOpenEdit(addr)} className="p-2 text-gray-400 hover:text-white transition">
              <Edit2 size={16} />
            </button>
            <button onClick={() => onDelete(addr._id)} className="p-2 text-red-400 hover:text-red-300 transition">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}

      {isEditing ? (
        <div className="card p-4 border border-blue-500/30">
          <h4 className="text-sm font-semibold mb-3">{editingId ? "Edit Address" : "New Address"}</h4>
          <div className="flex flex-col gap-3">
            <Input
              id="street"
              placeholder="Street Address"
              value={form.street}
              error={getFieldError("street")}
              onChange={(e: unknown) => handleFieldChange("street", e.target.value)}
              onBlur={() => handleFieldBlur("street")}
            />
            <div className="flex gap-3">
              <Input
                id="city"
                placeholder="City"
                value={form.city}
                error={getFieldError("city")}
                onChange={(e: unknown) => handleFieldChange("city", e.target.value)}
                onBlur={() => handleFieldBlur("city")}
              />
              <Input
                id="state"
                placeholder="State"
                value={form.state}
                error={getFieldError("state")}
                onChange={(e: unknown) => handleFieldChange("state", e.target.value)}
                onBlur={() => handleFieldBlur("state")}
              />
            </div>
            <div className="flex gap-3">
              <Input
                id="zip"
                placeholder="Zip Code"
                value={form.zip}
                error={getFieldError("zip")}
                onChange={(e: unknown) => handleFieldChange("zip", e.target.value.replace(/\D/g, "").slice(0, 6))}
                onBlur={() => handleFieldBlur("zip")}
              />
              <div className="flex-1 flex flex-col">
                <select
                  id="country"
                  value={form.country}
                  onChange={(e: unknown) => handleFieldChange("country", e.target.value)}
                  onBlur={() => handleFieldBlur("country")}
                  className="input"
                  style={{ height: 46 }}
                >
                  <option value="">Select Country</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {getFieldError("country") && (
                  <p style={{ color: "#dc2626", fontSize: "0.75rem", marginTop: "0.25rem" }}>{getFieldError("country")}</p>
                )}
              </div>
            </div>
            {!editingId && (
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input type="checkbox" checked={form.isDefault} onChange={(e: unknown) => setForm({ ...form, isDefault: e.target.checked })} className="rounded bg-gray-900 border-gray-700" />
                Set as default address
              </label>
            )}
            <div className="flex gap-2 mt-2">
              <Button onClick={handleSave} className="flex-1">Save</Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsEditing(false);
                  resetValidation();
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Button variant="ghost" onClick={() => handleOpenEdit()}>+ Add New Address</Button>
      )}
    </div>
  );
};

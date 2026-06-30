import React, { useState } from "react";
import { ProviderService } from "@/types/provider.types";
import { Button } from "../common/Button";
import { Input } from "../common/Input";

interface Props {
  service?: ProviderService;
  onSave: (service: { name: string; price: number; description: string }) => void;
  onClose: () => void;
}

export const ServicePricingModal: React.FC<Props> = ({ service, onSave, onClose }) => {
  const [form, setForm] = useState({
    name: service?.name || "",
    price: service?.price?.toString() || "",
    description: service?.description || ""
  });

  const handleSave = () => {
    if (!form.name || !form.price || !form.description) return;
    onSave({
      name: form.name,
      price: Number(form.price),
      description: form.description
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        <h3 className="text-xl font-bold text-white mb-4">{service ? "Edit Service" : "Add Service"}</h3>
        
        <div className="flex flex-col gap-4">
          <Input 
            id="serviceName" 
            label="Service Name" 
            placeholder="e.g. Basic Plumbing Repair" 
            value={form.name} 
            onChange={(e: unknown) => setForm({ ...form, name: e.target.value })} 
          />
          
          <Input 
            id="servicePrice" 
            label="Price ($)" 
            type="number" 
            placeholder="e.g. 50" 
            value={form.price} 
            onChange={(e: unknown) => setForm({ ...form, price: e.target.value })} 
          />
          
          <div className="flex flex-col gap-1.5">
            <label htmlFor="serviceDesc" className="text-sm font-medium text-gray-300">Description</label>
            <textarea 
              id="serviceDesc" 
              className="input min-h-[100px] resize-none" 
              placeholder="Describe what's included..." 
              value={form.description} 
              onChange={(e: unknown) => setForm({ ...form, description: e.target.value })} 
            />
          </div>

          <div className="flex gap-3 mt-4">
            <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={handleSave} className="flex-1">Save Service</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

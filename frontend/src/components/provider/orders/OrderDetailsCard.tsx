"use client";

import { MapPin, Phone, Mail, Calendar, Clock, IndianRupee, Image as ImageIcon } from "lucide-react";
import { ServiceOrder, OrderCustomerRef, OrderProviderRef } from "@/types/order.types";
import Image from "next/image";

interface OrderDetailsCardProps {
  order: ServiceOrder;
  showCustomer?: boolean;
  showProvider?: boolean;
}

function getCustomerRef(ref: unknown): OrderCustomerRef | null {
  if (typeof ref === "string") return null;
  if (ref && typeof ref === "object" && "_id" in ref) {
    return ref as OrderCustomerRef;
  }
  return null;
}

function getProviderRef(ref: unknown): OrderProviderRef | null {
  if (typeof ref === "string") return null;
  if (ref && typeof ref === "object" && "_id" in ref) {
    return ref as OrderProviderRef;
  }
  return null;
}

export function OrderDetailsCard({
  order,
  showCustomer = true,
  showProvider = false,
}: OrderDetailsCardProps) {
  const customer = typeof order.customerId === "object" ? order.customerId : null;
  const provider = typeof order.providerId === "object" ? order.providerId : null;

  return (
    <div className="space-y-4">
      {/* Order Info */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="font-bold text-slate-900 mb-3">Order Details</h3>
        {order.title && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-slate-600 uppercase">Title</p>
            <p className="text-sm font-bold text-slate-900">{order.title}</p>
          </div>
        )}
        <div className="mb-3">
          <p className="text-xs font-semibold text-slate-600 uppercase">Description</p>
          <p className="text-sm text-slate-700 line-clamp-3">{order.description}</p>
        </div>
        {order.budget && (
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-600 uppercase">Budget</p>
            <p className="font-bold text-indigo-600 flex items-center gap-1">
              <IndianRupee size={14} />
              {order.budget.toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {/* Location & Timing */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="font-bold text-slate-900 mb-3">Location & Schedule</h3>
        <div className="space-y-3">
          <div className="flex gap-3">
            <MapPin size={16} className="shrink-0 text-slate-400 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase">Address</p>
              <p className="text-sm text-slate-900">
                {order.address.street && `${order.address.street}, `}
                {order.address.city}, {order.address.state} - {order.address.zip}
              </p>
            </div>
          </div>
          {order.preferredDate && (
            <div className="flex gap-3">
              <Calendar size={16} className="shrink-0 text-slate-400 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase">Preferred Date</p>
                <p className="text-sm text-slate-900">{order.preferredDate}</p>
              </div>
            </div>
          )}
          {order.preferredTime && (
            <div className="flex gap-3">
              <Clock size={16} className="shrink-0 text-slate-400 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase">Preferred Time</p>
                <p className="text-sm text-slate-900">{order.preferredTime}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Customer Info */}
      {showCustomer && customer && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="font-bold text-slate-900 mb-3">Customer Information</h3>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-semibold text-slate-700">Name:</span> {customer.name}
            </p>
            {customer.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail size={14} className="text-slate-400" />
                <a href={`mailto:${customer.email}`} className="text-indigo-600 hover:underline">
                  {customer.email}
                </a>
              </div>
            )}
            {customer.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone size={14} className="text-slate-400" />
                <a href={`tel:${customer.phone}`} className="text-indigo-600 hover:underline">
                  {customer.phone}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Provider Info */}
      {showProvider && provider && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="font-bold text-slate-900 mb-3">Provider Information</h3>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-semibold text-slate-700">Name:</span> {provider.name}
            </p>
            {provider.businessName && (
              <p className="text-sm">
                <span className="font-semibold text-slate-700">Business:</span> {provider.businessName}
              </p>
            )}
            {provider.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail size={14} className="text-slate-400" />
                <a href={`mailto:${provider.email}`} className="text-indigo-600 hover:underline">
                  {provider.email}
                </a>
              </div>
            )}
            {provider.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone size={14} className="text-slate-400" />
                <a href={`tel:${provider.phone}`} className="text-indigo-600 hover:underline">
                  {provider.phone}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Images */}
      {order.images && order.images.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
            <ImageIcon size={16} /> Images ({order.images.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {order.images.map((img, idx) => (
              <a
                key={idx}
                href={img}
                target="_blank"
                rel="noopener noreferrer"
                className="relative group overflow-hidden rounded-lg bg-slate-100 aspect-square"
              >
                <Image
                  src={img}
                  alt={`Order image ${idx + 1}`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

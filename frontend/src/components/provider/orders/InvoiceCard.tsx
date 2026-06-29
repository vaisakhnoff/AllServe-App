"use client";

import { DollarSign, FileText, Calendar, Check } from "lucide-react";
import { Invoice } from "@/types/order.types";

interface InvoiceCardProps {
  invoice: Invoice;
  onViewDetails?: () => void;
  onPaymentAction?: () => void;
  compact?: boolean;
}

export function InvoiceCard({
  invoice,
  onViewDetails,
  onPaymentAction,
  compact = false,
}: InvoiceCardProps) {
  const isPaid = invoice.paymentStatus === "paid_online" || invoice.paymentStatus === "paid_cash";

  if (compact) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-slate-400" />
            <div>
              <p className="text-sm font-bold text-slate-900">Invoice</p>
              <p className="text-xs text-slate-600">{invoice._id.slice(-8)}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-slate-900">₹{invoice.total.toLocaleString()}</p>
            <p
              className={`text-xs font-semibold ${
                isPaid ? "text-emerald-600" : "text-amber-600"
              }`}
            >
              {isPaid ? "✓ Paid" : "Pending"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <FileText size={18} className="text-slate-400" /> Invoice
          </h3>
          <p className="text-xs text-slate-600 mt-1">
            <Calendar size={12} className="inline mr-1" />
            Created {new Date(invoice.createdAt).toLocaleDateString()}
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold ${
            isPaid
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-amber-50 text-amber-700 border border-amber-200"
          }`}
        >
          {isPaid ? "✓ Paid" : "Pending"}
        </span>
      </div>

      {/* Line Items */}
      <div className="space-y-3 mb-4 pb-4 border-b border-slate-100">
        {invoice.labourCharge > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Labour Charge</span>
            <span className="font-semibold text-slate-900">
              ₹{invoice.labourCharge.toLocaleString()}
            </span>
          </div>
        )}
        {invoice.materialCost > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Material Cost</span>
            <span className="font-semibold text-slate-900">
              ₹{invoice.materialCost.toLocaleString()}
            </span>
          </div>
        )}
        {invoice.additionalCharges > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Additional Charges</span>
            <span className="font-semibold text-slate-900">
              ₹{invoice.additionalCharges.toLocaleString()}
            </span>
          </div>
        )}
        {invoice.discount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Discount</span>
            <span className="font-semibold text-red-600">
              -₹{invoice.discount.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Total */}
      <div className="flex justify-between mb-4">
        <span className="font-bold text-slate-900">Total Amount</span>
        <span className="text-xl font-black text-indigo-600">
          ₹{invoice.total.toLocaleString()}
        </span>
      </div>

      {/* Commission Notice */}
      {invoice.settlementMethod && (
        <div className="mb-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
          <p>
            Platform Commission: ₹{invoice.platformCommission.toLocaleString()} (
            {invoice.settlementMethod === "online" ? "Online Settlement" : "Cash Payment"})
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {onViewDetails && (
          <button
            onClick={onViewDetails}
            className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <FileText size={14} className="inline mr-2" />
            View Details
          </button>
        )}
        {!isPaid && onPaymentAction && (
          <button
            onClick={onPaymentAction}
            className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition-colors"
          >
            <DollarSign size={14} className="inline mr-2" />
            Record Payment
          </button>
        )}
        {isPaid && (
          <div className="flex-1 rounded-lg bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700 flex items-center justify-center gap-2">
            <Check size={14} /> Payment Done
          </div>
        )}
      </div>

      {/* Notes */}
      {invoice.overallRemark && (
        <div className="mt-4 rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-800">
          <p className="font-semibold mb-1">Notes:</p>
          <p>{invoice.overallRemark}</p>
        </div>
      )}
    </div>
  );
}

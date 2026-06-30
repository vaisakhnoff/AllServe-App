"use client";

import React, { useState } from "react";
import { Search, Filter, Download, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { DataTable, ColumnDef } from "@/components/common/DataTable";

import { Payment } from "@/types/payment.types";
const columns: ColumnDef<Payment>[] = [
  {
    header: "Transaction Details",
    cell: (p) => (
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div style={{
          width: "36px", height: "36px", borderRadius: "50%",
          backgroundColor: p.type === "credit" ? "#dcfce7" : "#fee2e2",
          color: p.type === "credit" ? "#16a34a" : "#dc2626",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {p.type === "credit" ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
        </div>
        <div>
          <div style={{ fontWeight: 600, color: "#0f172a" }}>{p.id}</div>
          <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Ref: {p.bookingId}</div>
        </div>
      </div>
    ),
  },
  {
    header: "Amount",
    cell: (p) => (
      <span style={{ fontWeight: 700, color: p.type === "credit" ? "#16a34a" : "#0f172a" }}>
        {p.type === "credit" ? "+" : "-"}{p.amount}
      </span>
    ),
  },
  {
    header: "Payment Method",
    cell: (p) => <span style={{ color: "#334155" }}>{p.method}</span>,
  },
  {
    header: "Date & Time",
    cell: (p) => <span style={{ color: "#64748b", fontSize: "0.875rem" }}>{p.date}</span>,
  },
  {
    header: "Status",
    cell: (p) => (
      <span className={`admin-badge ${p.status === "completed" ? "active" : p.status === "refunded" ? "blocked" : "pending"}`}>
        {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
      </span>
    ),
  },
];

export default function AdminPaymentsPage() {
  const [filterStatus, setFilterStatus] = useState("all");

  const mockPayments: Payment[] = [
    { id: "TXN-9012", bookingId: "B-8492",     amount: "$120.00", date: "Oct 24, 2023, 10:30 AM", method: "Credit Card ending in 4242", status: "completed", type: "credit" },
    { id: "TXN-9013", bookingId: "B-8493",     amount: "$85.00",  date: "Oct 25, 2023, 02:15 PM", method: "PayPal",                     status: "pending",   type: "credit" },
    { id: "TXN-9014", bookingId: "B-8494",     amount: "$210.00", date: "Oct 26, 2023, 09:45 AM", method: "Refund to Card",             status: "refunded",  type: "debit"  },
    { id: "TXN-9015", bookingId: "Payout-P201", amount: "$450.00", date: "Oct 27, 2023, 05:00 PM", method: "Bank Transfer",              status: "completed", type: "debit"  },
  ];

  const filteredPayments =
    filterStatus === "all" ? mockPayments : mockPayments.filter((p) => p.status === filterStatus);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: "1.875rem", fontWeight: 700, color: "#0f172a" }}>Payments &amp; Transactions</h1>
          <p style={{ color: "#64748b", marginTop: "0.25rem" }}>Monitor platform revenue, provider payouts, and refunds</p>
        </div>
        <button className="admin-btn-primary">
          Export CSV <Download size={16} />
        </button>
      </div>

      <div className="admin-card">
        {/* Toolbar */}
        <div style={{ padding: "1.5rem", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ position: "relative", width: "300px" }}>
            <Search size={18} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input type="text" className="admin-input" placeholder="Search by TXN ID or Booking..." style={{ paddingLeft: "2.5rem" }} />
          </div>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <span style={{ color: "#64748b", fontSize: "0.875rem", fontWeight: 500, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Filter size={16} /> Status:
            </span>
            <select className="admin-input" style={{ width: "150px" }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All Transactions</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredPayments}
          rowKey={(p) => p.id}
          emptyMessage="No transactions found."
        />
      </div>
    </div>
  );
}

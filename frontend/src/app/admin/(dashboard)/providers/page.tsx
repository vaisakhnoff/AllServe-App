"use client";

import React, { useState, useEffect } from "react";
import { Search, Filter, ShieldBan, ShieldCheck, Star, ArrowLeft, Mail, Phone, MapPin, Briefcase, DollarSign } from "lucide-react";
import { adminService } from "@/services/admin";
import { ProviderProfile } from "@/types/provider.types";
import { getErrorMessage } from "@/utils/errorHandler";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { DataTable, ColumnDef } from "@/components/common/DataTable";

export default function AdminProvidersPage() {
  const [filterStatus, setFilterStatus] = useState("all");
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<ProviderProfile | null>(null);
  const [toggleProvider, setToggleProvider] = useState<ProviderProfile | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const res = await adminService.getProviders();
      setProviders(res.data.data);
    } catch (err) {
      setError(getErrorMessage(err) || "Failed to load providers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProviders(); }, []);

  const handleConfirmToggle = async () => {
    if (!toggleProvider) return;
    setActionLoading(true);
    try {
      if (toggleProvider.applicationStatus === "approved") {
        await adminService.blockProvider(toggleProvider._id);
      } else {
        await adminService.unblockProvider(toggleProvider._id);
      }
      setToggleProvider(null);
      await fetchProviders();
    } catch (err) {
      setError(getErrorMessage(err) || "Failed to update provider status");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredProviders = providers.filter((p) => {
    const matchesStatus = filterStatus === "all" || p.applicationStatus === filterStatus;
    const matchesSearch = (p.name || p.businessName || "").toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // ─── Column definitions ────────────────────────────────────────────────────
  const columns: ColumnDef<ProviderProfile>[] = [
    {
      header: "Provider Info",
      cell: (provider) => {
        const pName = provider.businessName || provider.name || "Provider";
        return (
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div className="admin-avatar" style={{ background: "linear-gradient(135deg, #f59e0b, #ea580c)", width: "40px", height: "40px" }}>
              {pName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 600, color: "#0f172a" }}>{pName}</div>
              <div style={{ fontSize: "0.75rem", color: "#64748b" }}>ID: {provider._id.substring(0, 8)}...</div>
            </div>
          </div>
        );
      },
    },
    {
      header: "Category",
      cell: (provider) => (
        <span style={{ color: "#334155", fontWeight: 500 }}>
          {typeof provider.categoryId === "object" ? provider.categoryId?.name : "Unknown Category"}
        </span>
      ),
    },
    {
      header: "Rating",
      cell: (provider) => (
        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "#f59e0b", fontWeight: 600 }}>
          <Star size={14} fill="currentColor" /> {provider.rating?.toFixed(1) || "0.0"}
        </div>
      ),
    },
    {
      header: "Earnings",
      cell: (provider) => (
        <span style={{ fontWeight: 600, color: "#0f172a" }}>${provider.earnings || 0}</span>
      ),
    },
    {
      header: "Status",
      cell: (provider) => (
        <span className={`admin-badge ${provider.applicationStatus === "approved" ? "active" : "blocked"}`}>
          {provider.applicationStatus.charAt(0).toUpperCase() + provider.applicationStatus.slice(1)}
        </span>
      ),
    },
    {
      header: "Actions",
      style: { textAlign: "right" },
      cell: (provider) => (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
          <button
            className={provider.applicationStatus === "approved" ? "admin-btn-danger" : "admin-btn-secondary"}
            style={{ padding: "0.4rem", borderColor: provider.applicationStatus === "approved" ? "" : "#10b981", color: provider.applicationStatus === "approved" ? "" : "#10b981" }}
            title={provider.applicationStatus === "approved" ? "Suspend Provider" : "Reinstate Provider"}
            onClick={(e) => { e.stopPropagation(); setToggleProvider(provider); }}
          >
            {provider.applicationStatus === "approved" ? <ShieldBan size={16} /> : <ShieldCheck size={16} />}
          </button>
        </div>
      ),
    },
  ];

  // ─── Detail view ───────────────────────────────────────────────────────────
  if (selectedProvider) {
    const pName = selectedProvider.businessName || selectedProvider.name || "Provider";
    const categoryName = typeof selectedProvider.categoryId === "object" ? selectedProvider.categoryId?.name : "Unknown";

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <button
          onClick={() => setSelectedProvider(null)}
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: "0.875rem", fontWeight: 500, padding: 0 }}
        >
          <ArrowLeft size={18} /> Back to Providers
        </button>

        <div className="admin-card" style={{ padding: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginBottom: "2rem" }}>
            <div className="admin-avatar" style={{ background: "linear-gradient(135deg, #f59e0b, #ea580c)", width: "64px", height: "64px", fontSize: "1.5rem" }}>
              {pName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>{pName}</h2>
              <p style={{ color: "#64748b", margin: "0.25rem 0 0" }}>ID: {selectedProvider._id}</p>
            </div>
            <span className={`admin-badge ${selectedProvider.applicationStatus === "approved" ? "active" : "blocked"}`} style={{ marginLeft: "auto" }}>
              {selectedProvider.applicationStatus.charAt(0).toUpperCase() + selectedProvider.applicationStatus.slice(1)}
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <Mail size={18} color="#64748b" />
              <div>
                <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: 0 }}>Email</p>
                <p style={{ fontSize: "0.875rem", color: "#0f172a", fontWeight: 500, margin: 0 }}>{selectedProvider.email}</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <Phone size={18} color="#64748b" />
              <div>
                <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: 0 }}>Phone</p>
                <p style={{ fontSize: "0.875rem", color: "#0f172a", fontWeight: 500, margin: 0 }}>{selectedProvider.phone || "N/A"}</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <Briefcase size={18} color="#64748b" />
              <div>
                <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: 0 }}>Category</p>
                <p style={{ fontSize: "0.875rem", color: "#0f172a", fontWeight: 500, margin: 0 }}>{categoryName}</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <Star size={18} color="#f59e0b" />
              <div>
                <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: 0 }}>Rating</p>
                <p style={{ fontSize: "0.875rem", color: "#0f172a", fontWeight: 500, margin: 0 }}>{selectedProvider.rating?.toFixed(1) || "0.0"}</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <DollarSign size={18} color="#64748b" />
              <div>
                <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: 0 }}>Earnings</p>
                <p style={{ fontSize: "0.875rem", color: "#0f172a", fontWeight: 500, margin: 0 }}>${selectedProvider.earnings || 0}</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <Briefcase size={18} color="#64748b" />
              <div>
                <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: 0 }}>Experience</p>
                <p style={{ fontSize: "0.875rem", color: "#0f172a", fontWeight: 500, margin: 0 }}>{selectedProvider.experience || "N/A"}</p>
              </div>
            </div>
            {selectedProvider.serviceAreas && selectedProvider.serviceAreas.length > 0 && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", gridColumn: "1 / -1" }}>
                <MapPin size={18} color="#64748b" style={{ marginTop: "2px" }} />
                <div>
                  <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: 0 }}>Service Areas</p>
                  <p style={{ fontSize: "0.875rem", color: "#0f172a", fontWeight: 500, margin: 0 }}>{selectedProvider.serviceAreas.join(", ")}</p>
                </div>
              </div>
            )}
            {selectedProvider.description && (
              <div style={{ gridColumn: "1 / -1" }}>
                <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: "0 0 0.25rem" }}>Description</p>
                <p style={{ fontSize: "0.875rem", color: "#334155", margin: 0 }}>{selectedProvider.description}</p>
              </div>
            )}
          </div>

          {selectedProvider.services && selectedProvider.services.length > 0 && (
            <div style={{ marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#0f172a", marginBottom: "0.75rem" }}>Services</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {selectedProvider.services.map((s) => (
                  <div key={s._id} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0.75rem", backgroundColor: "#f8fafc", borderRadius: "6px" }}>
                    <span style={{ color: "#334155", fontWeight: 500 }}>{s.name}</span>
                    <span style={{ color: "#0f172a", fontWeight: 600 }}>${s.price}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid #e2e8f0", display: "flex", gap: "0.75rem" }}>
            <button
              className={selectedProvider.applicationStatus === "approved" ? "admin-btn-danger" : "admin-btn-secondary"}
              style={{ padding: "0.5rem 1rem", borderColor: selectedProvider.applicationStatus === "approved" ? "" : "#10b981", color: selectedProvider.applicationStatus === "approved" ? "" : "#10b981" }}
              onClick={() => setToggleProvider(selectedProvider)}
            >
              {selectedProvider.applicationStatus === "approved" ? <ShieldBan size={16} /> : <ShieldCheck size={16} />}
              <span style={{ marginLeft: "0.5rem" }}>{selectedProvider.applicationStatus === "approved" ? "Suspend Provider" : "Reinstate Provider"}</span>
            </button>
          </div>
        </div>

        <Modal isOpen={!!toggleProvider} onClose={() => setToggleProvider(null)} title="Confirm Status Change">
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <p className="text-gray-300">
              Are you sure you want to <strong>{toggleProvider?.applicationStatus === "approved" ? "suspend" : "reinstate"}</strong> provider <strong>{toggleProvider?.name || toggleProvider?.businessName}</strong>?
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setToggleProvider(null)}>Cancel</Button>
              <Button variant={toggleProvider?.applicationStatus === "approved" ? "danger" : "primary"} onClick={handleConfirmToggle} loading={actionLoading}>
                Confirm
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  // ─── List view ─────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h1 style={{ fontSize: "1.875rem", fontWeight: 700, color: "#0f172a" }}>Provider Management</h1>
        <p style={{ color: "#64748b", marginTop: "0.25rem" }}>View and manage service providers on the platform</p>
      </div>

      <div className="admin-card">
        {error && (
          <div style={{ padding: "1rem", color: "#dc2626", backgroundColor: "#fef2f2", borderBottom: "1px solid #fecaca" }}>
            {error}
          </div>
        )}

        {/* Toolbar */}
        <div style={{ padding: "1.5rem", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ position: "relative", width: "300px" }}>
            <Search size={18} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              className="admin-input"
              placeholder="Search providers..."
              style={{ paddingLeft: "2.5rem" }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <span style={{ color: "#64748b", fontSize: "0.875rem", fontWeight: 500, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Filter size={16} /> Filter:
            </span>
            <select className="admin-input" style={{ width: "150px" }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredProviders}
          rowKey={(p) => p._id}
          isLoading={loading}
          emptyMessage="No providers found matching your criteria."
          onRowClick={(provider) => setSelectedProvider(provider)}
          footer={<span style={{ textAlign: "right", display: "block" }}>Total {filteredProviders.length} providers</span>}
        />
      </div>

      <Modal isOpen={!!toggleProvider} onClose={() => setToggleProvider(null)} title="Confirm Status Change">
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <p className="text-gray-300">
            Are you sure you want to <strong>{toggleProvider?.applicationStatus === "approved" ? "suspend" : "reinstate"}</strong> provider <strong>{toggleProvider?.name || toggleProvider?.businessName}</strong>?
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setToggleProvider(null)}>Cancel</Button>
            <Button variant={toggleProvider?.applicationStatus === "approved" ? "danger" : "primary"} onClick={handleConfirmToggle} loading={actionLoading}>
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

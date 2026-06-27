"use client";

import React, { useState, useEffect } from "react";
import { Search, Filter, ShieldBan, ShieldCheck, ArrowLeft, Mail, Calendar, Shield, CheckCircle2, XCircle } from "lucide-react";
import { adminService } from "@/services/admin";
import { UserListItem } from "@/types/user.types";
import { getErrorMessage } from "@/utils/errorHandler";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { DataTable, ColumnDef } from "@/components/common/DataTable";
import { displayId } from "@/utils/displayId";


export default function AdminUsersPage() {
  const [filterStatus, setFilterStatus] = useState("all");
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [toggleUser, setToggleUser] = useState<UserListItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await adminService.getUsers();
      setUsers(res.data.data);
    } catch (err) {
      setError(getErrorMessage(err) || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleConfirmToggle = async () => {
    if (!toggleUser) return;
    setActionLoading(true);
    try {
      if (toggleUser.status === "active") {
        await adminService.blockUser(toggleUser._id);
      } else {
        await adminService.unblockUser(toggleUser._id);
      }
      setToggleUser(null);
      await fetchUsers();
    } catch (err) {
      setError(getErrorMessage(err) || "Failed to update user status");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesStatus = filterStatus === "all" || u.status === filterStatus;
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // ─── Column definitions ────────────────────────────────────────────────────
  const columns: ColumnDef<UserListItem>[] = [
    {
      header: "User",
      cell: (user) => (
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div className="admin-avatar" style={{ background: "linear-gradient(135deg, #0ea5e9, #2563eb)", width: "40px", height: "40px" }}>
            {user.name.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: "#0f172a" }}>{user.name}</div>
            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>ID: {displayId.user(user._id)}...</div>
          </div>
        </div>
      ),
    },
    {
      header: "Contact Info",
      cell: (user) => (
        <>
          <div style={{ color: "#334155" }}>{user.email}</div>
          {user.isVerified && <div style={{ fontSize: "0.75rem", color: "#10b981", fontWeight: 500 }}>Verified</div>}
        </>
      ),
    },
    {
      header: "Role",
      cell: (user) => <span style={{ fontWeight: 500, textTransform: "capitalize" }}>{user.role}</span>,
    },
    {
      header: "Status",
      cell: (user) => (
        <span className={`admin-badge ${user.status}`}>
          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
        </span>
      ),
    },
    {
      header: "Actions",
      style: { textAlign: "right" },
      cell: (user) => (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
          <button
            className={user.status === "active" ? "admin-btn-danger" : "admin-btn-secondary"}
            style={{ padding: "0.4rem", borderColor: user.status === "active" ? "" : "#10b981", color: user.status === "active" ? "" : "#10b981" }}
            title={user.status === "active" ? "Block User" : "Unblock User"}
            onClick={(e) => { e.stopPropagation(); setToggleUser(user); }}
            disabled={user.role === "admin"}
          >
            {user.status === "active" ? <ShieldBan size={16} /> : <ShieldCheck size={16} />}
          </button>
        </div>
      ),
    },
  ];

  // ─── Detail view ───────────────────────────────────────────────────────────
  if (selectedUser) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <button
          onClick={() => setSelectedUser(null)}
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: "0.875rem", fontWeight: 500, padding: 0 }}
        >
          <ArrowLeft size={18} /> Back to Users
        </button>

        <div className="admin-card" style={{ padding: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginBottom: "2rem" }}>
            <div className="admin-avatar" style={{ background: "linear-gradient(135deg, #0ea5e9, #2563eb)", width: "64px", height: "64px", fontSize: "1.5rem" }}>
              {selectedUser.name.charAt(0)}
            </div>
            <div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>{selectedUser.name}</h2>
              <p style={{ color: "#64748b", margin: "0.25rem 0 0" }}>ID: {displayId.user(selectedUser._id)}</p>
            </div>
            <span className={`admin-badge ${selectedUser.status}`} style={{ marginLeft: "auto" }}>
              {selectedUser.status.charAt(0).toUpperCase() + selectedUser.status.slice(1)}
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <Mail size={18} color="#64748b" />
              <div>
                <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: 0 }}>Email</p>
                <p style={{ fontSize: "0.875rem", color: "#0f172a", fontWeight: 500, margin: 0 }}>{selectedUser.email}</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <Shield size={18} color="#64748b" />
              <div>
                <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: 0 }}>Role</p>
                <p style={{ fontSize: "0.875rem", color: "#0f172a", fontWeight: 500, margin: 0, textTransform: "capitalize" }}>{selectedUser.role}</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              {selectedUser.isVerified ? <CheckCircle2 size={18} color="#10b981" /> : <XCircle size={18} color="#ef4444" />}
              <div>
                <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: 0 }}>Verification</p>
                <p style={{ fontSize: "0.875rem", color: selectedUser.isVerified ? "#10b981" : "#ef4444", fontWeight: 500, margin: 0 }}>
                  {selectedUser.isVerified ? "Verified" : "Not Verified"}
                </p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <Calendar size={18} color="#64748b" />
              <div>
                <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: 0 }}>Joined</p>
                <p style={{ fontSize: "0.875rem", color: "#0f172a", fontWeight: 500, margin: 0 }}>
                  {new Date(selectedUser.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>
            </div>
          </div>

          <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid #e2e8f0", display: "flex", gap: "0.75rem" }}>
            <button
              className={selectedUser.status === "active" ? "admin-btn-danger" : "admin-btn-secondary"}
              style={{ padding: "0.5rem 1rem", borderColor: selectedUser.status === "active" ? "" : "#10b981", color: selectedUser.status === "active" ? "" : "#10b981" }}
              onClick={() => setToggleUser(selectedUser)}
              disabled={selectedUser.role === "admin"}
            >
              {selectedUser.status === "active" ? <ShieldBan size={16} /> : <ShieldCheck size={16} />}
              <span style={{ marginLeft: "0.5rem" }}>{selectedUser.status === "active" ? "Block User" : "Unblock User"}</span>
            </button>
          </div>
        </div>

        <Modal isOpen={!!toggleUser} onClose={() => setToggleUser(null)} title="Confirm Status Change">
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <p className="text-gray-300">
              Are you sure you want to <strong>{toggleUser?.status === "active" ? "block" : "unblock"}</strong> user <strong>{toggleUser?.name}</strong>?
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setToggleUser(null)}>Cancel</Button>
              <Button variant={toggleUser?.status === "active" ? "danger" : "primary"} onClick={handleConfirmToggle} loading={actionLoading}>
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
        <h1 style={{ fontSize: "1.875rem", fontWeight: 700, color: "#0f172a" }}>User Management</h1>
        <p style={{ color: "#64748b", marginTop: "0.25rem" }}>View and manage registered platform users</p>
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
              placeholder="Search users by name or email..."
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
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredUsers}
          rowKey={(u) => u._id}
          isLoading={loading}
          emptyMessage="No users found matching your criteria."
          onRowClick={(user) => setSelectedUser(user)}
          footer={<span style={{ textAlign: "right", display: "block" }}>Total {filteredUsers.length} users</span>}
        />
      </div>

      <Modal isOpen={!!toggleUser} onClose={() => setToggleUser(null)} title="Confirm Status Change">
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <p className="text-gray-300">
            Are you sure you want to <strong>{toggleUser?.status === "active" ? "block" : "unblock"}</strong> user <strong>{toggleUser?.name}</strong>?
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setToggleUser(null)}>Cancel</Button>
            <Button variant={toggleUser?.status === "active" ? "danger" : "primary"} onClick={handleConfirmToggle} loading={actionLoading}>
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

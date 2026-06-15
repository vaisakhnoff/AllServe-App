"use client";

import React, { useState, useEffect } from "react";
import StatCard from "@/components/admin/StatCard";
import { Users, UserSquare2, CalendarCheck, Activity, ArrowRight, UserPlus, FileText, Loader } from "lucide-react";
import { adminService } from "@/services/admin";
import { getErrorMessage } from "@/utils/errorHandler";
import { useRouter } from "next/navigation";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({ totalUsers: 0, totalProviders: 0, pendingApplications: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await adminService.getDashboardStats();
        setStats(res.data.data);
      } catch (err) {
        setError(getErrorMessage(err) || "Failed to load dashboard statistics");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div>
        <h1 style={{ fontSize: "1.875rem", fontWeight: 700, color: "#0f172a" }}>Dashboard Overview</h1>
        <p style={{ color: "#64748b" }}>Monitor system metrics and recent activities</p>
      </div>

      {error && (
        <div style={{ padding: "1rem", color: "#dc2626", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px" }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100px" }}>
          <Loader className="animate-spin text-primary" size={32} />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem" }}>
          <StatCard title="Total Users" value={stats.totalUsers.toString()} trend={0} icon={<Users size={20} />} />
          <StatCard title="Total Providers" value={stats.totalProviders.toString()} trend={0} icon={<UserSquare2 size={20} />} />
          <StatCard title="Pending Applications" value={stats.pendingApplications.toString()} trend={0} icon={<FileText size={20} />} />
          <StatCard title="Total Bookings" value="0" trend={0} icon={<CalendarCheck size={20} />} />
        </div>
      )}

      {/* Main Content Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem" }}>
        
        {/* Charts Section */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="admin-card" style={{ padding: "1.5rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#0f172a", marginBottom: "1rem" }}>System Traffic</h2>
            <div className="admin-chart-placeholder">
              {/* CSS Bar Chart Placeholder */}
              {[40, 60, 35, 80, 50, 90, 65, 100, 75, 45, 85, 60].map((height, i) => (
                <div key={i} className="admin-chart-bar" style={{ height: `${height}%` }}></div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem", color: "#64748b", fontSize: "0.75rem" }}>
              <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
              <span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
            </div>
          </div>
          
          <div className="admin-card" style={{ padding: "1.5rem" }}>
             <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#0f172a", marginBottom: "1rem" }}>Platform Growth Overview</h2>
             <div style={{ height: "200px", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", borderRadius: "8px", border: "1px dashed #cbd5e1" }}>
                <span style={{ color: "#94a3b8", display: "flex", alignItems: "center", gap: "0.5rem" }}><Activity size={20} /> Data Visualization Coming Soon</span>
             </div>
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* Provider Applications Summary */}
          <div className="admin-card" style={{ padding: "1.5rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#0f172a", marginBottom: "1rem" }}>Provider Applications</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#64748b", fontSize: "0.875rem" }}>Pending Review</span>
                <span className="admin-badge pending">{stats.pendingApplications}</span>
              </div>
            </div>
            <button onClick={() => router.push("/admin/applications")} className="admin-btn-primary" style={{ width: "100%", justifyContent: "center" }}>
              Process Applications <ArrowRight size={16} />
            </button>
          </div>

          {/* Recent Activity Feed */}
          <div className="admin-card" style={{ padding: "1.5rem", flex: 1 }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#0f172a", marginBottom: "1.5rem" }}>Platform Highlights</h2>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {[
                { icon: <UserPlus size={16} />, title: "Live User Count", desc: `${stats.totalUsers} registered users`, time: "Live", color: "#3b82f6", bg: "#dbeafe" },
                { icon: <FileText size={16} />, title: "Active Providers", desc: `${stats.totalProviders} verified providers`, time: "Live", color: "#f59e0b", bg: "#fef3c7" },
              ].map((activity, index) => (
                <div key={index} style={{ display: "flex", gap: "1rem" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: activity.bg, color: activity.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {activity.icon}
                  </div>
                  <div>
                    <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "#0f172a", margin: 0 }}>{activity.title}</p>
                    <p style={{ fontSize: "0.75rem", color: "#64748b", margin: "0.25rem 0 0 0" }}>{activity.desc}</p>
                  </div>
                  <div style={{ marginLeft: "auto", fontSize: "0.75rem", color: "#94a3b8" }}>
                    {activity.time}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

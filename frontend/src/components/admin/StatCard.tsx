import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  trend: number; // positive for up, negative for down
  icon: React.ReactNode;
}

export default function StatCard({ title, value, trend, icon }: StatCardProps) {
  const isUp = trend >= 0;

  return (
    <div className="admin-card admin-stat-card">
      <div className="admin-stat-title">
        {title}
        <span style={{ color: "#94a3b8" }}>{icon}</span>
      </div>
      <div className="admin-stat-value">{value}</div>
      <div className={isUp ? "admin-stat-trend-up" : "admin-stat-trend-down"}>
        {isUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
        <span>{isUp ? "+" : ""}{trend}% from last month</span>
      </div>
    </div>
  );
}

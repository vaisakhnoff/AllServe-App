import React from "react";
import { Status } from "@/enums/status.enum";
import { ApplicationStatus } from "@/enums/application-status.enum";

interface BadgeProps {
  status: string;
}

const statusClass: Record<string, string> = {
  [Status.ACTIVE]: "badge-active",
  [Status.BLOCKED]: "badge-blocked",
  [Status.PENDING]: "badge-pending",
  [ApplicationStatus.APPROVED]: "badge-approved",
  [ApplicationStatus.REJECTED]: "badge-rejected",
};

export const Badge: React.FC<BadgeProps> = ({ status }) => {
  const cls = statusClass[status] ?? "badge bg-gray-700 text-gray-300";
  return <span className={cls}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
};

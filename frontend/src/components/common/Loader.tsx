import React from "react";
import { Loader2 } from "lucide-react";

interface LoaderProps {
  size?: number;
  className?: string;
  fullScreen?: boolean;
}

export const Loader: React.FC<LoaderProps> = ({ size = 24, className = "", fullScreen = false }) => {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm flex items-center justify-center z-50">
        <Loader2 size={40} className="animate-spin text-blue-500" />
      </div>
    );
  }
  return <Loader2 size={size} className={`animate-spin text-blue-500 ${className}`} />;
};

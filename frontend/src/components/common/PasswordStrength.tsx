import React from "react";

interface PasswordStrengthProps {
  score: number;
  message: string;
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({ score, message }) => {
  if (score === 0) return null;

  const getColor = (idx: number) => {
    if (score === 0) return "bg-gray-700";
    if (score < 2) return idx < 1 ? "bg-red-500" : "bg-gray-700";
    if (score < 3) return idx < 2 ? "bg-yellow-500" : "bg-gray-700";
    return "bg-green-500";
  };

  return (
    <div className="flex flex-col gap-1 mt-1">
      <div className="flex gap-1 h-1.5 w-full rounded-full overflow-hidden">
        {[0, 1, 2].map((idx) => (
          <div key={idx} className={`h-full flex-1 transition-colors ${getColor(idx)}`} />
        ))}
      </div>
      <p className="text-xs text-right text-gray-400 font-medium">{message}</p>
    </div>
  );
};

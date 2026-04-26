import React from "react";

/**
 * Enhanced Tooltip component for showing warnings or info
 * Props:
 *  - content: string or JSX to show in tooltip
 *  - children: element that triggers tooltip on hover
 *  - type: "info" | "warning" (optional, default "info")
 */
export const Tooltip = ({ content, children, type = "info" }) => {
  // Define tooltip background based on type
  const bgColor =
    type === "warning"
      ? "bg-red-100 text-red-700 border border-red-300"
      : "bg-gray-800 text-white";

  return (
    <div className="relative group inline-block">
      {children}
      {content && (
        <div
          className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-max max-w-xs px-3 py-1 text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 whitespace-nowrap ${bgColor}`}
        >
          {content}
        </div>
      )}
    </div>
  );
};
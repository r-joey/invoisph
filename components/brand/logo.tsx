import React from "react";

interface LogoProps {
  className?: string;
  showTagline?: boolean;
  size?: "sm" | "md" | "lg";
}

export function InvoisPHLogo({ className = "", showTagline = false, size = "md" }: LogoProps) {
  const heightMap = {
    sm: "h-7",
    md: "h-9",
    lg: "h-12",
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg
        viewBox="0 0 200 48"
        className={`${heightMap[size]} w-auto drop-shadow-sm`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Icon Mark: Document + Check Stamp */}
        <rect x="4" y="6" width="36" height="36" rx="8" fill="#0B192C" />
        <path d="M12 16H32" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M12 22H26" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M12 28H20" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="30" cy="30" r="7" fill="#10B981" />
        <path
          d="M27.5 30L29.5 32L33 28.5"
          stroke="#FFFFFF"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Typography */}
        <text
          x="48"
          y="32"
          fontFamily="var(--font-plus-jakarta), sans-serif"
          fontWeight="800"
          fontSize="24"
          fill="#0B192C"
          letterSpacing="-0.5"
        >
          Invois<tspan fill="#1E40AF">PH</tspan>
        </text>
      </svg>
      {showTagline && (
        <span className="hidden text-xs font-medium text-slate-500 sm:inline-block border-l border-slate-200 pl-2.5">
          BIR EoPT Service Invoicing
        </span>
      )}
    </div>
  );
}

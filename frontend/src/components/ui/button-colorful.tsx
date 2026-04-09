import React from "react";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";

interface ButtonColorfulProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  showArrow?: boolean;
}

export function ButtonColorful({
  className,
  label = "Action",
  showArrow = true,
  disabled,
  ...props
}: ButtonColorfulProps) {
  return (
    // Wrapper holds the bloom so it isn't clipped by overflow-hidden on the button
    <div className="relative inline-flex group">
      {/* Bloom glow — outside the button so blur renders freely */}
      <div
        className="absolute -inset-1 rounded-xl opacity-0 group-hover:opacity-60 blur-lg transition-opacity duration-500 pointer-events-none"
        style={{ background: "linear-gradient(to right, #6366f1, #a855f7, #ec4899)" }}
      />

      <button
        disabled={disabled}
        className={cn(
          "relative h-9 px-4 rounded-lg overflow-hidden",
          "transition-all duration-200",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        {...props}
      >
        {/* Solid gradient base */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to right, #4f46e5, #7c3aed, #db2877)" }}
        />

        {/* Subtle lighten on hover */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300"
          style={{ background: "linear-gradient(to right, #ffffff, #ffffff)" }}
        />

        {/* Content */}
        <div className="relative flex items-center justify-center gap-1.5">
          <span className="text-white text-sm font-medium leading-none">{label}</span>
          {showArrow && (
            <ArrowUpRight className="w-3.5 h-3.5 text-white/80 flex-shrink-0" />
          )}
        </div>
      </button>
    </div>
  );
}

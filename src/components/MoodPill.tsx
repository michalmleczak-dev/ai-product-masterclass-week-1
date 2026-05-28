"use client";

import { cn } from "@/lib/utils";
import { getMoodDef } from "@/lib/moods";

interface MoodPillProps {
  label: string;
  selected?: boolean;
  size?: "sm" | "md";
  onClick?: () => void;
  asButton?: boolean;
  className?: string;
}

export function MoodPill({
  label,
  selected = false,
  size = "md",
  onClick,
  asButton = true,
  className,
}: MoodPillProps) {
  const def = getMoodDef(label);
  const bg = selected ? def?.bg ?? "#1A1A1A" : "transparent";
  const color = selected ? def?.text ?? "#FFFFFF" : "#1A1A1A";
  const border = selected ? "transparent" : "#E5E5E5";

  const classes = cn(
    "inline-flex items-center justify-center whitespace-nowrap rounded-full border font-medium transition-colors",
    size === "md" ? "px-4 py-2 text-sm" : "px-2.5 py-1 text-xs",
    className
  );

  const style = {
    backgroundColor: bg,
    color,
    borderColor: border,
  } as React.CSSProperties;

  if (!asButton) {
    return (
      <span className={classes} style={style}>
        {label}
      </span>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      style={style}
      onClick={onClick}
      aria-pressed={selected}
    >
      {label}
    </button>
  );
}

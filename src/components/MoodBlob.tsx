import type { MoodFace } from "@/lib/moods";

interface MoodBlobProps {
  face: MoodFace;
  color: string;
  size?: number;
  className?: string;
}

export function MoodBlob({ face, color, size = 180, className }: MoodBlobProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 180 180"
      className={className}
      aria-hidden
    >
      <circle cx="90" cy="90" r="78" fill="rgba(255,255,255,0.25)" />
      <circle cx="90" cy="90" r="62" fill={color} />
      {/* eyes */}
      {face === "angry" ? (
        <>
          <path
            d="M58 78 L78 86"
            stroke="#1A1A1A"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M122 78 L102 86"
            stroke="#1A1A1A"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <circle cx="68" cy="84" r="5" fill="#1A1A1A" />
          <circle cx="112" cy="84" r="5" fill="#1A1A1A" />
        </>
      )}
      {/* mouth */}
      {face === "happy" && (
        <path
          d="M62 110 Q90 134 118 110"
          stroke="#1A1A1A"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
        />
      )}
      {face === "neutral" && (
        <path
          d="M66 114 L114 114"
          stroke="#1A1A1A"
          strokeWidth="5"
          strokeLinecap="round"
        />
      )}
      {face === "sad" && (
        <path
          d="M62 122 Q90 100 118 122"
          stroke="#1A1A1A"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
        />
      )}
      {face === "angry" && (
        <path
          d="M62 122 Q90 102 118 122"
          stroke="#1A1A1A"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

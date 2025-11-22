import * as React from "react";
import Image from "next/image";

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: { className: "h-8 w-8 text-xs", size: 32 },
  md: { className: "h-10 w-10 text-sm", size: 40 },
  lg: { className: "h-16 w-16 text-base", size: 64 }
} as const;

export function Avatar({ src, name, size = "md" }: AvatarProps) {
  const initials = React.useMemo(() => {
    if (!name) return "";
    return name
      .split(" ")
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  }, [name]);

  if (src) {
    const metrics = sizeMap[size];
    return (
      <Image
        src={src}
        alt={name ?? "Avatar"}
        width={metrics.size}
        height={metrics.size}
        className={`rounded-full object-cover ${metrics.className}`}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-400 text-slate-700 font-semibold ${sizeMap[size].className}`}
      aria-label={name ?? "Avatar"}
    >
      {initials || "?"}
    </div>
  );
}

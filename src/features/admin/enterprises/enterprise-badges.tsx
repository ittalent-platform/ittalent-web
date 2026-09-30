import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function EnterpriseStatusBadge({ status }: { status?: string }) {
  const normalized = status?.toLowerCase() ?? "pending";

  if (normalized === "active") {
    return (
      <Badge className="bg-[#e8f5ee] text-[#12764a] border-emerald-200/80 font-semibold px-2.5 py-0.5 rounded-full text-xs">
        Active
      </Badge>
    );
  }

  if (normalized === "suspended") {
    return (
      <Badge className="bg-[#fbe9e7] text-[#b42318] border-red-200/80 font-semibold px-2.5 py-0.5 rounded-full text-xs">
        Suspended
      </Badge>
    );
  }

  if (normalized === "pending") {
    return (
      <Badge className="bg-[#fcf3e3] text-[#b45309] border-amber-200/80 font-semibold px-2.5 py-0.5 rounded-full text-xs">
        Pending
      </Badge>
    );
  }

  if (normalized === "rejected") {
    return (
      <Badge className="bg-[#fbe9e7] text-[#b42318] border-red-200/80 font-semibold px-2.5 py-0.5 rounded-full text-xs">
        Rejected
      </Badge>
    );
  }

  return (
    <Badge className="bg-[#f1efea] text-[#64646b] border-gray-200 font-semibold px-2.5 py-0.5 rounded-full text-xs">
      {status ?? "Inactive"}
    </Badge>
  );
}

export function CompanyTypeBadge({ type }: { type?: string | null }) {
  if (!type) return null;

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#f1efea] text-[#4a4a50] border border-transparent whitespace-nowrap">
      {type}
    </span>
  );
}

const MONOGRAM_PALETTE = [
  "#f2470c",
  "#1c6b3f",
  "#8a4b06",
  "#2a55a8",
  "#6941c6",
  "#0e7090",
  "#be123c",
  "#4338ca",
];

export function getInitials(name?: string): string {
  if (!name) return "EN";
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export function getMonogramColor(name?: string): string {
  if (!name) return MONOGRAM_PALETTE[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return MONOGRAM_PALETTE[Math.abs(hash) % MONOGRAM_PALETTE.length];
}

export function formatEnterpriseId(id?: string): string {
  if (!id) return "ENT-0000";
  if (id.startsWith("ENT-")) return id;
  // If standard 24-char ObjectId, pick last 4 hex characters
  return `ENT-${id.slice(-4).toUpperCase()}`;
}

type EnterpriseAvatarProps = {
  name?: string;
  logoUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

export function EnterpriseAvatar({
  name,
  logoUrl,
  size = "md",
  className,
}: EnterpriseAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const initials = getInitials(name);
  const bgColor = getMonogramColor(name);

  const sizeClasses = {
    sm: "w-8 h-8 rounded-lg text-xs",
    md: "w-9 h-9 rounded-[10px] text-xs",
    lg: "w-13 h-13 rounded-[14px] text-base",
    xl: "w-14 h-14 rounded-2xl text-lg",
  }[size];

  if (logoUrl && !imageError) {
    return (
      <img
        alt={name ?? "Enterprise logo"}
        className={cn(
          sizeClasses,
          "object-cover border border-border/40 shrink-0 bg-white shadow-2xs",
          className,
        )}
        onError={() => setImageError(true)}
        src={logoUrl}
      />
    );
  }

  return (
    <span
      className={cn(
        sizeClasses,
        "shrink-0 font-bold font-['Space_Grotesk'] text-white flex items-center justify-center select-none shadow-2xs",
        className,
      )}
      style={{ backgroundColor: bgColor }}
    >
      {initials}
    </span>
  );
}

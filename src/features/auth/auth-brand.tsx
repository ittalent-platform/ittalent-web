import { Link } from "react-router";

export function AuthBrand({ className }: { className?: string } = {}) {
  return (
    <Link className={`flex items-center gap-2.5 ${className ?? ""}`} to="/">
      <svg width="34" height="34" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <rect width="40" height="40" rx="11" fill="#ffffff" />
        <circle cx="20" cy="10.4" r="4.4" fill="#cf3a05" />
        <path d="M9 24 Q20 13.2 31 24" stroke="#cf3a05" strokeWidth="5.4" strokeLinecap="round" />
        <rect x="17.3" y="19" width="5.4" height="15" rx="2.7" fill="#cf3a05" />
      </svg>
      <span className="font-['Space_Grotesk',sans-serif] text-[19px] font-bold tracking-[0.04em]">ITTALENT</span>
    </Link>
  );
}

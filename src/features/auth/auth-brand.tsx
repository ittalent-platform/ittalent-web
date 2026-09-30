import { Link } from "react-router";

export function AuthBrand({ className }: { className?: string } = {}) {
  return (
    <Link className={`flex items-center gap-2.5 ${className ?? ""}`} to="/">
      <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect width="34" height="34" rx="8" fill="white" />
        <circle cx="17" cy="11" r="3" stroke="#ea4315" strokeWidth="2.5" />
        <path d="M17 14V26" stroke="#ea4315" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M10 21C10 17.134 13.134 14 17 14C20.866 14 24 17.134 24 21" stroke="#ea4315" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <span className="font-['Space_Grotesk',sans-serif] text-[19px] font-bold tracking-[0.04em]">ITTALENT</span>
    </Link>
  );
}

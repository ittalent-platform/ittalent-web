import { Link } from "react-router";

export function AuthBrand() {
  return (
    <Link className="flex items-center gap-2.5" to="/">
      <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true">
        <rect x="1.5" y="1.5" width="31" height="31" rx="8" stroke="var(--primary)" strokeWidth="3" />
        <path d="M11 11L23 23M23 11L11 23" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <span className="font-['Space_Grotesk',sans-serif] text-[19px] font-bold tracking-[0.04em]">ITTALENT</span>
    </Link>
  );
}

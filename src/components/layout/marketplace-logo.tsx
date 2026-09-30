export function MarketplaceLogo({ size = 32 }: { size?: number }) {
  return (
    <svg aria-hidden="true" height={size} viewBox="0 0 32 32" width={size}>
      <rect fill="#f2470c" height="32" rx="8" width="32" />
      <circle cx="16" cy="10" fill="#ffffff" r="3.2" />
      <path
        d="M7 25c1.6-6.2 4.8-9.4 9-9.4s7.4 3.2 9 9.4"
        fill="none"
        stroke="#ffffff"
        strokeLinecap="round"
        strokeWidth="2.6"
      />
    </svg>
  );
}
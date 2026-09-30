/** ITTalent mark from the Design-Doc public header/footer. */
export function MarketplaceLogo({ size = 32 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 40 40"
      width={size}
    >
      <rect fill="#f2470c" height="40" rx="11" width="40" />
      <circle cx="20" cy="10.4" fill="#ffffff" r="4.4" />
      <path
        d="M9 24 Q20 13.2 31 24"
        stroke="#ffffff"
        strokeLinecap="round"
        strokeWidth="5.4"
      />
      <rect fill="#ffffff" height="15" rx="2.7" width="5.4" x="17.3" y="19" />
    </svg>
  );
}

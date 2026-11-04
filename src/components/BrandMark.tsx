interface BrandMarkProps {
  className?: string;
  size?: number;
}

export default function BrandMark({ className = '', size = 48 }: BrandMarkProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 52 56" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M26 1C13.85 1 4 10.85 4 23C4 37.5 26 55 26 55C26 55 48 37.5 48 23C48 10.85 38.15 1 26 1Z" fill="#2DBD4E" />
      <circle cx="26" cy="22" r="16" fill="white" />
      <path d="M10.5 22.5L26 10L41.5 22.5" stroke="#1B2B4B" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 38V24C19 23.4 19.4 23 20 23H27C27.6 23 28 23.4 28 24V38Z" fill="#1B2B4B" />
      <circle cx="22" cy="31.5" r="1.1" fill="white" />
      <rect x="29.5" y="24.5" width="4" height="4" rx="0.8" fill="#4DC247" />
      <rect x="34.5" y="24.5" width="4" height="4" rx="0.8" fill="#4DC247" />
      <rect x="29.5" y="29.5" width="4" height="4" rx="0.8" fill="#4DC247" />
      <rect x="34.5" y="29.5" width="4" height="4" rx="0.8" fill="#4DC247" />
    </svg>
  );
}

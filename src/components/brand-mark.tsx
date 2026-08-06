type BrandMarkProps = {
  className?: string;
  decorative?: boolean;
};

export function BrandMark({ className, decorative = false }: BrandMarkProps) {
  return (
    <svg
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : "创剧 AI 场记折页标志"}
      className={className}
      fill="none"
      role={decorative ? undefined : "img"}
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7 18.5h34v22H7z"
        fill="currentColor"
      />
      <path d="M7 18.5h34L36 12H12L7 18.5Z" fill="currentColor" />
      <path d="m11.5 12 5-6h7l-5 6h-7Zm12 0 5-6h7l-5 6h-7Zm12 0 3.75-4.5L42 12h-6.5Z" fill="currentColor" />
      <path d="M16 40.5v-16M25 40.5v-16M34 40.5v-16" stroke="var(--paper-50)" strokeWidth="1.4" />
      <path
        d="M9.5 36.5c9.2-8.3 18.7-12.8 31.5-14.5"
        stroke="var(--persimmon-500)"
        strokeLinecap="round"
        strokeWidth="3"
      />
      <path d="M34 18.5h7v7l-7-7Z" fill="var(--paper-50)" />
    </svg>
  );
}


export function IndusLogo({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="100" fill="#1a2e44" />
      {/* Back wave - blue */}
      <path
        d="M25 90 C50 60, 85 58, 112 76 C138 93, 162 96, 182 78"
        stroke="url(#waveBlue)"
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
        opacity="0.9"
      />
      {/* Front wave - green to teal */}
      <path
        d="M22 80 C48 50, 82 47, 108 67 C132 85, 158 88, 180 68"
        stroke="url(#waveGreen)"
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />
      {/* Indus italic bold */}
      <text x="100" y="130" textAnchor="middle" fontFamily="'Sora','Inter',Georgia,sans-serif" fontWeight="800" fontSize="34" fill="white" fontStyle="italic" letterSpacing="-1">Indus</text>
      {/* Service Flow green */}
      <text x="100" y="158" textAnchor="middle" fontFamily="'Sora','Inter',sans-serif" fontWeight="600" fontSize="22" fill="#4ade80" letterSpacing="0.5">Service Flow</text>
      <defs>
        <linearGradient id="waveGreen" x1="22" y1="70" x2="180" y2="70" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22c55e" />
          <stop offset="0.5" stopColor="#10b981" />
          <stop offset="1" stopColor="#06b6d4" />
        </linearGradient>
        <linearGradient id="waveBlue" x1="25" y1="84" x2="182" y2="84" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3b82f6" />
          <stop offset="1" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
    </svg>
  );
}

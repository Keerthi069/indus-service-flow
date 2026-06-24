export function OrchaSpLogo({ className = "h-12 w-12" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* White background circle */}
      <circle cx="80" cy="72" r="62" fill="white" />

      {/* Left triangle blade - dark blue */}
      <path
        d="M80,15 L38,95 L68,75 Z"
        fill="url(#bladeLeft)"
      />

      {/* Right triangle blade - medium blue */}
      <path
        d="M80,15 L122,95 L92,75 Z"
        fill="url(#bladeRight)"
      />

      {/* Center tall triangle - light blue (front) */}
      <path
        d="M80,10 L92,75 L68,75 Z"
        fill="url(#bladeCenter)"
      />

      {/* Water wave at bottom of triangles */}
      <path
        d="M42,92 Q55,82 68,88 Q80,94 92,88 Q105,82 118,90 Q108,100 92,96 Q80,100 68,96 Q52,102 42,92 Z"
        fill="url(#waveBlue)"
        opacity="0.85"
      />

      {/* ORCHASP text */}
      <text
        x="80"
        y="148"
        textAnchor="middle"
        fontFamily="'Arial','Helvetica',sans-serif"
        fontWeight="500"
        fontSize="16"
        fill="#6b7280"
        letterSpacing="3"
      >
        ORCHASP
      </text>

      <defs>
        <linearGradient id="bladeLeft" x1="38" y1="15" x2="75" y2="95" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1a6fba" />
          <stop offset="1" stopColor="#0d4a8a" />
        </linearGradient>
        <linearGradient id="bladeRight" x1="122" y1="15" x2="85" y2="95" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2585d4" />
          <stop offset="1" stopColor="#1060a8" />
        </linearGradient>
        <linearGradient id="bladeCenter" x1="80" y1="10" x2="80" y2="75" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#7dcff5" />
          <stop offset="1" stopColor="#3aaae8" />
        </linearGradient>
        <linearGradient id="waveBlue" x1="42" y1="90" x2="118" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2585d4" />
          <stop offset="0.5" stopColor="#5bbaf5" />
          <stop offset="1" stopColor="#2585d4" />
        </linearGradient>
      </defs>
    </svg>
  );
}

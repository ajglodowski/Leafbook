import React from 'react';

interface LeafbookIconProps {
  size?: number;
  className?: string;
  mossColor?: string;
  bgColor?: string;
}

export function LeafbookIcon({
  size = 48,
  className,
  mossColor = '#5a7a52',
  bgColor = '#f5f0e8',
}: LeafbookIconProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
    >
      {/* Background */}
      <rect x="0" y="0" width="120" height="120" rx="24" ry="24" fill={mossColor} opacity="0.12" />

      {/* Bookmark ribbon — top right corner */}
      <polygon points="82,0 82,28 90,22 98,28 98,0" fill={mossColor} opacity="0.8" />

      {/* Pointed leaf */}
      <g transform="translate(54, 56) rotate(-15)">
        <path
          d="M 0,-42 C 18,-34 27,-14 24,8 C 22,24 12,38 0,46 C -12,38 -22,24 -24,8 C -27,-14 -18,-34 0,-42 Z"
          fill={mossColor}
          opacity="0.9"
        />

        {/* Midrib */}
        <line x1="0" y1="-40" x2="0" y2="44" stroke={bgColor} strokeWidth="2.2" opacity="0.55" />

        {/* Vein pair 1 */}
        <line x1="0" y1="-18" x2="-19" y2="-6" stroke={bgColor} strokeWidth="1.6" opacity="0.45" />
        <line x1="0" y1="-18" x2="19" y2="-6" stroke={bgColor} strokeWidth="1.6" opacity="0.45" />

        {/* Vein pair 2 */}
        <line x1="0" y1="6" x2="-21" y2="18" stroke={bgColor} strokeWidth="1.6" opacity="0.35" />
        <line x1="0" y1="6" x2="21" y2="18" stroke={bgColor} strokeWidth="1.6" opacity="0.35" />

        {/* Stem */}
        <line x1="0" y1="44" x2="3" y2="56" stroke={mossColor} strokeWidth="2.5" strokeLinecap="round" />
      </g>
    </svg>
  );
}

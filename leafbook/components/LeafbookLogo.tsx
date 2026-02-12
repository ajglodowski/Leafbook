import React from 'react';

interface LeafbookLogoProps {
  width?: number;
  height?: number;
  className?: string;
  mossColor?: string;
  bgColor?: string;
  lineColor?: string;
}

export function LeafbookLogo({
  width = 200,
  height = 240,
  className,
  mossColor = '#5a7a52',
  bgColor = '#f5f0e8',
  lineColor = '#4a3f35',
}: LeafbookLogoProps) {
  return (
    <svg
      viewBox="0 0 200 240"
      width={width}
      height={height}
      className={className}
    >
      {/* Page */}
      <rect x="30" y="20" width="140" height="200" rx="12" ry="12" fill="none" stroke={mossColor} strokeWidth="3" />

      {/* Book hinge */}
      <line x1="52" y1="25" x2="52" y2="215" stroke={mossColor} strokeWidth="1" opacity="0.35" />

      {/* Bookmark */}
      <polygon points="122,20 122,62 131,53 140,62 140,20" fill={mossColor} opacity="0.8" />

      {/* Page lines — from hinge, progressively shorter */}
      <line x1="52" y1="178" x2="155" y2="178" stroke={lineColor} strokeWidth="1.4" opacity="0.45" />
      <line x1="52" y1="191" x2="130" y2="191" stroke={lineColor} strokeWidth="1.4" opacity="0.35" />
      <line x1="52" y1="204" x2="105" y2="204" stroke={lineColor} strokeWidth="1.4" opacity="0.25" />

      {/* Solid pointed leaf */}
      <g transform="translate(100, 105) rotate(-15)">
        <path
          d="M 0,-44 C 18,-36 26,-14 24,8 C 22,24 12,38 0,46 C -12,38 -22,24 -24,8 C -26,-14 -18,-36 0,-44 Z"
          fill={mossColor}
          opacity="0.75"
        />

        {/* Midrib */}
        <line x1="0" y1="-42" x2="0" y2="44" stroke={bgColor} strokeWidth="1.8" opacity="0.5" />

        {/* Vein pair 1 */}
        <line x1="0" y1="-18" x2="-19" y2="-6" stroke={bgColor} strokeWidth="1.2" opacity="0.4" />
        <line x1="0" y1="-18" x2="19" y2="-6" stroke={bgColor} strokeWidth="1.2" opacity="0.4" />

        {/* Vein pair 2 */}
        <line x1="0" y1="6" x2="-21" y2="18" stroke={bgColor} strokeWidth="1.2" opacity="0.3" />
        <line x1="0" y1="6" x2="21" y2="18" stroke={bgColor} strokeWidth="1.2" opacity="0.3" />

        {/* Stem */}
        <line x1="0" y1="44" x2="3" y2="56" stroke={mossColor} strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  );
}

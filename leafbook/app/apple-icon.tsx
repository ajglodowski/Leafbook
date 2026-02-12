import { ImageResponse } from 'next/og';

// Image metadata
export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

// Apple icon component
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f0e8',
          borderRadius: '28px',
        }}
      >
        <svg
          viewBox="0 0 120 120"
          width="100%"
          height="100%"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Bookmark ribbon — top right corner */}
          <polygon points="82,0 82,28 90,22 98,28 98,0" fill="#5a7a52" />

          {/* Pointed leaf */}
          <g transform="translate(54, 56) rotate(-15)">
            <path
              d="M 0,-42 C 18,-34 27,-14 24,8 C 22,24 12,38 0,46 C -12,38 -22,24 -24,8 C -27,-14 -18,-34 0,-42 Z"
              fill="#5a7a52"
            />

            {/* Midrib */}
            <line x1="0" y1="-40" x2="0" y2="44" stroke="#f5f0e8" strokeWidth="2.2" opacity="0.7" />

            {/* Vein pair 1 */}
            <line x1="0" y1="-18" x2="-19" y2="-6" stroke="#f5f0e8" strokeWidth="1.6" opacity="0.6" />
            <line x1="0" y1="-18" x2="19" y2="-6" stroke="#f5f0e8" strokeWidth="1.6" opacity="0.6" />

            {/* Vein pair 2 */}
            <line x1="0" y1="6" x2="-21" y2="18" stroke="#f5f0e8" strokeWidth="1.6" opacity="0.5" />
            <line x1="0" y1="6" x2="21" y2="18" stroke="#f5f0e8" strokeWidth="1.6" opacity="0.5" />

            {/* Stem */}
            <line x1="0" y1="44" x2="3" y2="56" stroke="#5a7a52" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}

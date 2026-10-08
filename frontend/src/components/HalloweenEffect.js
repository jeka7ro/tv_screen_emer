import React from 'react';

// Flying Bat SVG
const BatSvg = () => (
  <svg viewBox="0 0 48 24" fill="none" className="w-full h-full" style={{ overflow: 'visible' }}>
    <path
      d="M24 8c-2-3-4.5-5-8-5-4.5 0-9 3.5-12 8-2.5 4-4 5.5-4 5.5s3.5 0 7-2c1.5 3 4.5 5 8 5 3 0 5-1.5 7-4 2 2.5 4 4 7 4 3.5 0 6.5-2 8-5 3.5 2 7 2 7 2s-1.5-1.5-4-5.5c-3-4.5-7.5-8-12-8-3.5 0-6 2-8 5z"
      fill="#1e1b4b"
    />
    {/* Small red spooky eyes */}
    <circle cx="22.5" cy="7.5" r="0.9" fill="#ef4444" />
    <circle cx="25.5" cy="7.5" r="0.9" fill="#ef4444" />
  </svg>
);

// Glowing Carved Pumpkin (Jack-o'-lantern) SVG
const PumpkinSvg = () => (
  <svg viewBox="0 0 32 32" fill="none" className="w-full h-full" style={{ overflow: 'visible' }}>
    {/* Green Stem */}
    <path d="M15 4c0-2 1.5-3 3-3s1.5.5 1 2c-.5 1.5-1.5 2-2 3z" fill="#4ade80" />
    {/* Pumpkin Body */}
    <ellipse cx="16" cy="18" rx="13" ry="11" fill="#f97316" />
    <ellipse cx="16" cy="18" rx="9" ry="11" fill="#ea580c" opacity="0.55" />
    <ellipse cx="16" cy="18" rx="4.5" ry="11" fill="#c2410c" opacity="0.35" />
    {/* Carved Glowing Eyes */}
    <polygon points="11,13 8,17 14,17" fill="#fef08a" />
    <polygon points="21,13 18,17 24,17" fill="#fef08a" />
    {/* Carved Nose */}
    <polygon points="16,18 14,20 18,20" fill="#fef08a" />
    {/* Carved Toothy Smile */}
    <path d="M10 22c1.5 3 10.5 3 12 0-1 1-2 0-3 1s-2-1-3 0-2-1-3 0-2-1-3-1z" fill="#fef08a" />
  </svg>
);

// Cute Ethereal Ghost SVG
const GhostSvg = () => (
  <svg viewBox="0 0 32 36" fill="none" className="w-full h-full" style={{ overflow: 'visible' }}>
    {/* Ghost body */}
    <path
      d="M16 2C9 2 5 7 5 14v16c0 .8.8 1.4 1.5 1 1.2-.7 2.5-1 3.5 0 .8.8 2.2.8 3 0 1.2-.7 2.5-1 3.5 0 .8.8 2.2.8 3 0 1.2-.7 2.5-1 3.5 0 .8.8 2.2.8 3 0 .7.4 1.5-.2 1.5-1V14c0-7-4-12-11-12z"
      fill="rgba(248, 250, 252, 0.92)"
    />
    {/* Spooky cute dark eyes */}
    <ellipse cx="12" cy="13" rx="2" ry="2.8" fill="#1e1b4b" />
    <ellipse cx="20" cy="13" rx="2" ry="2.8" fill="#1e1b4b" />
    {/* Cute open mouth */}
    <ellipse cx="16" cy="19" rx="1.8" ry="2.5" fill="#1e1b4b" />
    {/* Subtle blushing cheeks */}
    <circle cx="9.5" cy="17" r="1.5" fill="#f472b6" opacity="0.6" />
    <circle cx="22.5" cy="17" r="1.5" fill="#f472b6" opacity="0.6" />
  </svg>
);

export const HalloweenEffect = ({ enabled = true, intensity = 'medium' }) => {
  if (!enabled) return null;

  return (
    <div className={`halloween-container intensity-${intensity}`}>
      {[...Array(20)].map((_, i) => {
        const typeIndex = i % 3;
        if (typeIndex === 0) {
          return (
            <div key={i} className="halloween-item halloween-bat">
              <BatSvg />
            </div>
          );
        } else if (typeIndex === 1) {
          return (
            <div key={i} className="halloween-item halloween-pumpkin">
              <PumpkinSvg />
            </div>
          );
        } else {
          return (
            <div key={i} className="halloween-item halloween-ghost">
              <GhostSvg />
            </div>
          );
        }
      })}
    </div>
  );
};

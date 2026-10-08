import React from 'react';

// Maple Leaf (Arțar) with realistic lobes, stem and veins
const MapleLeaf = () => (
  <svg viewBox="0 0 32 32" fill="currentColor" className="w-full h-full" style={{ overflow: 'visible' }}>
    <path d="M16 2l1.8 4.2 4-1.2-1.2 4.2 4.8 1.8-3.6 3 3.6 4.2-4.8-.6-1.2 5.4-2.4-4.8L16 28l-1-9.6-2.4 4.8-1.2-5.4-4.8.6 3.6-4.2-3.6-3 4.8-1.8-1.2-4.2 4 1.2L16 2z" />
    <path d="M16 7v23" stroke="rgba(0,0,0,0.28)" strokeWidth="1" strokeLinecap="round" />
    <path d="M16 13l5-3M16 18l6-2M16 22l4-1M16 13l-5-3M16 18l-6-2M16 22l-4-1" stroke="rgba(0,0,0,0.22)" strokeWidth="0.8" strokeLinecap="round" />
  </svg>
);

// Oak Leaf (Stejar) with wavy scalloped lobes and veins
const OakLeaf = () => (
  <svg viewBox="0 0 28 36" fill="currentColor" className="w-full h-full" style={{ overflow: 'visible' }}>
    <path d="M14 2c2 2.5 4 2 5 4.5.8 2-.5 4 .5 6 1 1.8 3.5 2.2 3.5 4.5 0 2-2 3-2 5 0 2 2.5 3.5 2 5.5-.5 2-3 2.5-3.5 4.5-.4 1.5.5 2.5 0 3.5-1 2-4 1.5-5.5 2V36h-2v-4.5c-1.5-.5-4.5 0-5.5-2-.5-1 .4-2 0-3.5-.5-2-3-2.5-3.5-4.5-.5-2 2-3.5 2-5.5 0-2-2-3-2-5 0-2.3 2.5-2.7 3.5-4.5 1-2-.3-4 .5-6 1-2.5 3-2 5-4.5z" />
    <path d="M14 5v29" stroke="rgba(0,0,0,0.28)" strokeWidth="1" strokeLinecap="round" />
    <path d="M14 11l5-2M14 16l6-1M14 21l5-1M14 11l-5-2M14 16l-6-1M14 21l-5-1" stroke="rgba(0,0,0,0.22)" strokeWidth="0.8" strokeLinecap="round" />
  </svg>
);

// Elm / Birch Leaf (Mesteacăn / Ulm) with elegant teardrop shape and veins
const ElmLeaf = () => (
  <svg viewBox="0 0 24 36" fill="currentColor" className="w-full h-full" style={{ overflow: 'visible' }}>
    <path d="M12 2C6 8 4 17 6 25c1.5 4 4 7 6 9v2h1v-2c2-2 4.5-5 6-9 2-8 0-17-6-23z" />
    <path d="M12.5 4v29" stroke="rgba(0,0,0,0.28)" strokeWidth="0.9" strokeLinecap="round" />
    <path d="M12.5 9l5-3M12.5 14l6-3M12.5 19l5-2M12.5 24l4-1M12.5 9l-5-3M12.5 14l-6-3M12.5 19l-5-2M12.5 24l-4-1" stroke="rgba(0,0,0,0.22)" strokeWidth="0.75" strokeLinecap="round" />
  </svg>
);

const LEAF_COLORS = ['leaf-gold', 'leaf-orange', 'leaf-crimson', 'leaf-rust', 'leaf-amber', 'leaf-brown'];

export const AutumnLeaves = ({ enabled = true, intensity = 'medium' }) => {
  if (!enabled) return null;

  return (
    <div className={`autumn-leaves-container intensity-${intensity}`}>
      {[...Array(25)].map((_, i) => {
        const typeIndex = i % 3;
        const colorClass = LEAF_COLORS[i % LEAF_COLORS.length];

        return (
          <div key={i} className={`autumn-leaf ${colorClass}`}>
            {typeIndex === 0 && <MapleLeaf />}
            {typeIndex === 1 && <OakLeaf />}
            {typeIndex === 2 && <ElmLeaf />}
          </div>
        );
      })}
    </div>
  );
};

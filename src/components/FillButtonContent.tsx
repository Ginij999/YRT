import React from 'react';

interface FillButtonContentProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Dual-layer GPU-synchronized liquid wave fill content for `.btn-brand` and `.btn-brand-outline`.
 * Hovering rises a sloshing white liquid wave from bottom to top in 1.5s; leaving drains it
 * top-to-bottom in 1.5s, flipping submerged typography cleanly from white to dark ink.
 */
export const FillButtonContent: React.FC<FillButtonContentProps> = ({
  children,
  className = 'gap-2',
}) => {
  return (
    <>
      {/* Base white typography visible above the water level */}
      <span className={`relative z-10 inline-flex items-center justify-center ${className}`}>
        {children}
      </span>

      {/* Liquid White Wave & Body Rising from Bottom to Top in 1.5s */}
      <span aria-hidden="true" className="btn-water-wave">
        <svg
          className="btn-wave-svg-back"
          viewBox="0 0 240 36"
          preserveAspectRatio="none"
        >
          <path
            d="M0 18 Q15 34 30 18 T60 18 T90 18 T120 18 T150 18 T180 18 T210 18 T240 18 L240 36 L0 36 Z"
            fill="rgba(255,255,255,0.52)"
          />
        </svg>
        <svg
          className="btn-wave-svg"
          viewBox="0 0 240 36"
          preserveAspectRatio="none"
        >
          <path
            d="M0 18 Q15 2 30 18 T60 18 T90 18 T120 18 T150 18 T180 18 T210 18 T240 18 L240 36 L0 36 Z"
            fill="#ffffff"
          />
        </svg>
        <span className="btn-water-body" />
      </span>

      {/* Clipped dark typography revealed strictly inside the rising white water */}
      <span aria-hidden="true" className="btn-water-text-clip">
        <span className={`btn-water-text-inner inline-flex items-center justify-center ${className}`}>
          {children}
        </span>
      </span>
    </>
  );
};

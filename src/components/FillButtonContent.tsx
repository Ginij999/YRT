import React from 'react';

interface FillButtonContentProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Renders dual-layer synchronized content inside `.btn-brand` or `.btn-brand-outline`
 * so both the rising white water wave fill and the button typography/icon fill smoothly
 * from bottom to top over 1.5s with crisp dark text along the curved meniscus.
 */
export const FillButtonContent: React.FC<FillButtonContentProps> = ({
  children,
  className = 'gap-2',
}) => {
  return (
    <>
      <span className={`relative z-10 inline-flex items-center justify-center ${className}`}>
        {children}
      </span>
      <span
        aria-hidden="true"
        className={`btn-fill-overlay z-20 inline-flex items-center justify-center ${className}`}
      >
        {children}
      </span>
    </>
  );
};

import React from 'react';
import { useSite } from '../context/SiteContext';

export const StarfieldBackground: React.FC = () => {
  const { settings } = useSite();
  const bgConfig = settings?.homepageBackground;

  const mode = bgConfig?.mode === 'stars' ? 'solid' : bgConfig?.mode || 'solid';
  const primaryColor = bgConfig?.primaryColor || '#050507';
  const secondaryColor = bgConfig?.secondaryColor || '#14090D';
  const imageUrl = bgConfig?.imageUrl || '';
  const overlayOpacity = Math.min(0.95, Math.max(0.1, Number(bgConfig?.overlayOpacity ?? 0.72)));

  const containerStyle: React.CSSProperties =
    mode === 'gradient'
      ? { background: `radial-gradient(circle at 20% 15%, ${secondaryColor} 0%, ${primaryColor} 65%)` }
      : { backgroundColor: primaryColor };

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
      style={containerStyle}
      aria-hidden="true"
    >
      {mode === 'image' && imageUrl && (
        <>
          <img
            src={imageUrl}
            alt=""
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{ backgroundColor: primaryColor, opacity: overlayOpacity }}
          />
        </>
      )}
    </div>
  );
};

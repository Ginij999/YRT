import React, { useEffect, useRef } from 'react';
import { useSite } from '../context/SiteContext';

interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
  vx: number;
  vy: number;
  alpha: number;
  twinkleOffset: number;
}

export const StarfieldBackground: React.FC = () => {
  const { settings } = useSite();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgConfig = settings?.homepageBackground;

  const mode = bgConfig?.mode || 'stars';
  const primaryColor = bgConfig?.primaryColor || '#08080A';
  const secondaryColor = bgConfig?.secondaryColor || '#18090D';
  const imageUrl = bgConfig?.imageUrl || '';
  const starsEnabled = bgConfig?.starsEnabled !== false;
  const starColor = bgConfig?.starColor || '#FFFFFF';
  const starDensity = Math.min(240, Math.max(30, Number(bgConfig?.starDensity ?? 110)));
  const overlayOpacity = Math.min(0.95, Math.max(0.1, Number(bgConfig?.overlayOpacity ?? 0.72)));

  useEffect(() => {
    if (!starsEnabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const mouse = { x: width * 0.5, y: height * 0.5, tx: width * 0.5, ty: height * 0.5 };
    const stars: Star[] = Array.from({ length: starDensity }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      z: 0.35 + Math.random() * 1.4,
      size: 0.7 + Math.random() * 1.7,
      vx: (Math.random() - 0.5) * 0.14,
      vy: (Math.random() - 0.5) * 0.14,
      alpha: 0.28 + Math.random() * 0.65,
      twinkleOffset: Math.random() * Math.PI * 2,
    }));

    const onResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const onPointerMove = (e: PointerEvent) => {
      mouse.tx = e.clientX;
      mouse.ty = e.clientY;
    };

    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    let rafId = 0;
    let time = 0;

    const render = () => {
      time += 0.016;
      mouse.x += (mouse.tx - mouse.x) * 0.06;
      mouse.y += (mouse.ty - mouse.y) * 0.06;

      const offsetX = (mouse.x - width * 0.5) * 0.035;
      const offsetY = (mouse.y - height * 0.5) * 0.035;

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        if (!prefersReduced) {
          s.x += s.vx * s.z;
          s.y += s.vy * s.z;
        }
        if (s.x < -20) s.x = width + 20;
        if (s.x > width + 20) s.x = -20;
        if (s.y < -20) s.y = height + 20;
        if (s.y > height + 20) s.y = -20;

        // Parallax + gentle cursor pull for nearby stars
        const px = s.x - offsetX * s.z;
        const py = s.y - offsetY * s.z;
        const dx = mouse.x - px;
        const dy = mouse.y - py;
        const dist = Math.hypot(dx, dy);
        const pull = dist < 170 ? (1 - dist / 170) * 14 * s.z : 0;
        const drawX = dist > 1 ? px + (dx / dist) * pull : px;
        const drawY = dist > 1 ? py + (dy / dist) * pull : py;

        const twinkle = 0.72 + 0.28 * Math.sin(time * 1.8 + s.twinkleOffset);
        ctx.globalAlpha = Math.min(1, s.alpha * twinkle);
        ctx.fillStyle = dist < 150 ? '#EF4444' : starColor;
        ctx.beginPath();
        ctx.arc(drawX, drawY, s.size * (dist < 140 ? 1.25 : 1), 0, Math.PI * 2);
        ctx.fill();

        if (dist < 130) {
          ctx.globalAlpha = (1 - dist / 130) * 0.22;
          ctx.strokeStyle = '#DC2626';
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(drawX, drawY);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }

      if (!prefersReduced) {
        rafId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointerMove);
    };
  }, [starsEnabled, starColor, starDensity]);

  const containerStyle: React.CSSProperties =
    mode === 'gradient'
      ? { background: `radial-gradient(circle at 20% 15%, ${secondaryColor} 0%, ${primaryColor} 65%)` }
      : { backgroundColor: primaryColor };

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" style={containerStyle} aria-hidden="true">
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
      {starsEnabled && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full block"
        />
      )}
    </div>
  );
};

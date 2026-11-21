import React from 'react';
import { StickyNote } from '../types/cms';
import { MediaImage } from './MediaImage';
import { X } from 'lucide-react';

export const STICKER_PALETTE: Record<string, { hex: string; label: string }> = {
  yellow: { hex: '#FFE066', label: 'Butter Yellow' },
  sky: { hex: '#9EE6FF', label: 'Sky Blue' },
  mint: { hex: '#C7FF9E', label: 'Mint Green' },
  pink: { hex: '#F9C5BD', label: 'Blush Peach' },
  amber: { hex: '#FCD34D', label: 'Warm Amber' },
  crimson: { hex: '#FCA5A5', label: 'Coral Red' },
  emerald: { hex: '#6EE7B7', label: 'Fresh Emerald' },
  slate: { hex: '#E2E8F0', label: 'Paper White' },
};

const PIN_COLORS: Record<string, { main: string; rim: string; shadow: string }> = {
  red: { main: '#DC2626', rim: '#F87171', shadow: '#7F1D1D' },
  blue: { main: '#2563EB', rim: '#60A5FA', shadow: '#1E3A8A' },
  amber: { main: '#D97706', rim: '#FBBF24', shadow: '#78350F' },
  emerald: { main: '#059669', rim: '#34D399', shadow: '#064E3B' },
  slate: { main: '#334155', rim: '#94A3B8', shadow: '#0F172A' },
};

export function resolveNoteHex(note: Pick<StickyNote, 'color' | 'customColor'>): string {
  const custom = (note.customColor || '').trim();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(custom)) {
    return custom;
  }
  return STICKER_PALETTE[note.color]?.hex || STICKER_PALETTE.yellow.hex;
}

export function getContrastInk(hexColor: string): { text: string; muted: string } {
  const clean = hexColor.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean.padEnd(6, 'F').slice(0, 6);
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  if (luminance < 0.52) {
    return { text: '#F8FAFC', muted: '#CBD5E1' };
  }
  return { text: '#16161B', muted: '#3F3F46' };
}

const PushpinHardware: React.FC<{
  styleType?: 'pin' | 'tape' | 'none';
  pinColor?: string;
  align?: 'left' | 'center' | 'right';
}> = ({ styleType = 'pin', pinColor = 'red', align = 'center' }) => {
  if (styleType === 'none') return null;

  const posClass =
    align === 'left'
      ? 'left-4 -top-4'
      : align === 'right'
      ? 'right-4 -top-4'
      : 'left-1/2 -translate-x-1/2 -top-4';

  if (styleType === 'tape') {
    const tapeBg =
      pinColor === 'red'
        ? 'rgba(244, 194, 194, 0.72)'
        : pinColor === 'blue'
        ? 'rgba(186, 230, 253, 0.72)'
        : 'rgba(229, 217, 178, 0.78)';
    return (
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute ${posClass} top-[-11px] w-16 h-6 rotate-[-4deg] shadow-sm`}
        style={{
          background: tapeBg,
          borderLeft: '1px dashed rgba(255,255,255,0.35)',
          borderRight: '1px dashed rgba(255,255,255,0.35)',
          backdropFilter: 'blur(2px)',
        }}
      />
    );
  }

  const palette = PIN_COLORS[pinColor] || PIN_COLORS.red;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute ${posClass} z-30 drop-shadow-[0_6px_6px_rgba(0,0,0,0.45)]`}
    >
      <svg width="34" height="36" viewBox="0 0 34 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Soft cast shadow on note paper */}
        <ellipse cx="20" cy="28" rx="6.5" ry="2.6" fill="rgba(0,0,0,0.28)" />
        {/* Metallic needle */}
        <path d="M16 17 L18.5 29" stroke="#CBD5E1" strokeWidth="2.1" strokeLinecap="round" />
        <path d="M16 17 L18.5 29" stroke="#475569" strokeWidth="0.8" strokeLinecap="round" />
        {/* Lower plastic skirt */}
        <ellipse cx="16" cy="14.5" rx="8.5" ry="4.6" fill={palette.shadow} />
        {/* Neck cylinder */}
        <path d="M11 8 L10 14.2 C12.5 16.4 19.5 16.4 22 14.2 L20 8 Z" fill={palette.main} />
        {/* Top glossy pin cap */}
        <ellipse cx="15" cy="7.2" rx="7.2" ry="4.1" fill={palette.main} />
        <ellipse cx="14.5" cy="6.4" rx="5.5" ry="2.7" fill={palette.rim} opacity="0.72" />
        <ellipse cx="13.2" cy="5.5" rx="2.1" ry="1.0" fill="#FFFFFF" opacity="0.75" />
      </svg>
    </div>
  );
};

interface StickerCardProps {
  note: StickyNote;
  compact?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export const StickerCard: React.FC<StickerCardProps> = ({
  note,
  compact = false,
  onDismiss,
  className = '',
}) => {
  const isPolaroid = note.noteType === 'polaroid';
  const paperHex = resolveNoteHex(note);
  const ink = getContrastInk(paperHex);
  const pinAlign: 'left' | 'center' | 'right' =
    (note.rotation || 0) < -3 ? 'left' : (note.rotation || 0) > 3 ? 'right' : 'center';

  if (isPolaroid) {
    return (
      <div
        className={`relative bg-[#F9F9F6] text-neutral-900 shadow-[0_22px_45px_rgba(0,0,0,0.68)] transition-transform duration-500 ${
          compact ? 'p-2 pb-4' : 'p-3 pb-5'
        } ${className}`}
        style={{
          border: '1px solid rgba(255,255,255,0.85)',
        }}
      >
        <PushpinHardware
          styleType={note.pinStyle || 'pin'}
          pinColor={note.pinColor || 'red'}
          align={pinAlign}
        />

        {onDismiss && (
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onDismiss}
            className="absolute top-1.5 right-1.5 z-40 p-1 rounded-full bg-black/60 text-white hover:bg-black"
            aria-label="Close sticker"
          >
            <X className="w-3 h-3" />
          </button>
        )}

        <div className={`w-full overflow-hidden bg-neutral-900 ${compact ? 'aspect-[4/3]' : 'aspect-[4/3.6]'}`}>
          {note.imageUrl ? (
            <MediaImage
              src={note.imageUrl}
              alt={note.title || note.content || 'YRT Studio moment'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400 p-4 text-center">
              Upload photo in Admin → Sticky Notes
            </div>
          )}
        </div>

        {!compact && (
          <div className="pt-3 px-1 flex items-baseline justify-between gap-2">
            <span className="text-xs font-medium text-neutral-800 truncate">
              {note.content || note.title}
            </span>
            {note.author && (
              <span className="text-[11px] font-mono-num text-neutral-500 shrink-0">
                — {note.author}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`relative shadow-[0_20px_42px_rgba(0,0,0,0.62)] transition-transform duration-500 flex flex-col justify-between ${
        compact ? 'p-3.5 min-h-[120px]' : 'p-6 min-h-[215px]'
      } ${className}`}
      style={{
        backgroundColor: paperHex,
        color: ink.text,
        boxShadow:
          '0 20px 38px rgba(0, 0, 0, 0.58), inset 0 -18px 34px rgba(0, 0, 0, 0.06)',
      }}
    >
      <PushpinHardware
        styleType={note.pinStyle || 'pin'}
        pinColor={note.pinColor || 'red'}
        align={pinAlign}
      />

      {onDismiss && (
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onDismiss}
          className="absolute top-2 right-2 z-40 p-1 rounded-full bg-black/15 hover:bg-black/30 transition-colors"
          style={{ color: ink.text }}
          aria-label="Hide sticky note"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Slight paper curl illusion in bottom-right */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 bottom-0 w-7 h-7"
        style={{
          background:
            'linear-gradient(135deg, rgba(0,0,0,0) 48%, rgba(0,0,0,0.14) 50%, rgba(0,0,0,0.03) 100%)',
        }}
      />

      <div className="space-y-3 pt-1">
        {note.imageUrl && (
          <div className={`w-full overflow-hidden rounded-sm border border-black/15 ${compact ? 'h-16' : 'h-28'}`}>
            <MediaImage
              src={note.imageUrl}
              alt={note.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <p
          className={`font-medium leading-snug whitespace-pre-line ${
            compact ? 'text-[11px] line-clamp-3' : 'text-[15px] md:text-base'
          }`}
        >
          {note.content || note.title}
        </p>
      </div>

      <div
        className={`pt-4 flex items-center justify-between gap-2 ${
          compact ? 'text-[10px]' : 'text-xs'
        }`}
        style={{ color: ink.muted }}
      >
        <span className="font-medium">— {note.author || 'YRT Esports'}</span>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { GripVertical, Layers, X } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { StickyNote } from '../types/cms';

const NOTE_PALETTES: Record<string, { bg: string; border: string; accent: string }> = {
  amber: {
    bg: 'rgba(38, 28, 12, 0.88)',
    border: 'rgba(245, 158, 11, 0.45)',
    accent: '#F59E0B',
  },
  crimson: {
    bg: 'rgba(38, 12, 16, 0.88)',
    border: 'rgba(220, 38, 38, 0.5)',
    accent: '#EF4444',
  },
  emerald: {
    bg: 'rgba(10, 34, 24, 0.88)',
    border: 'rgba(16, 185, 129, 0.45)',
    accent: '#10B981',
  },
  sky: {
    bg: 'rgba(12, 26, 40, 0.88)',
    border: 'rgba(56, 189, 248, 0.45)',
    accent: '#38BDF8',
  },
  slate: {
    bg: 'rgba(22, 22, 28, 0.9)',
    border: 'rgba(255, 255, 255, 0.22)',
    accent: '#E2E8F0',
  },
};

export const StickyNotesLayer: React.FC<{ pageSlug: string }> = ({ pageSlug }) => {
  const { stickyNotes, setStickyNotes, adminUser, apiFetch } = useSite();
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  const activeNotes = stickyNotes
    .filter(
      (n) =>
        n.visible &&
        (n.pageSlug === 'all' || n.pageSlug === pageSlug) &&
        !dismissedIds.includes(n._id)
    )
    .sort((a, b) => (a.zIndex || 20) - (b.zIndex || 20));

  useEffect(() => {
    if (!draggingId) return;

    const onPointerMove = (e: PointerEvent) => {
      const vw = Math.max(window.innerWidth, 320);
      const vh = Math.max(window.innerHeight, 480);
      const nextX = Math.min(88, Math.max(2, ((e.clientX - dragOffset.dx) / vw) * 100));
      const nextY = Math.min(82, Math.max(10, ((e.clientY - dragOffset.dy) / vh) * 100));

      setStickyNotes((prev) =>
        prev.map((note) =>
          note._id === draggingId
            ? { ...note, x: Number(nextX.toFixed(1)), y: Number(nextY.toFixed(1)) }
            : note
        )
      );
    };

    const onPointerUp = async () => {
      const finishedId = draggingId;
      setDraggingId(null);
      if (adminUser && finishedId) {
        const current = stickyNotes.find((n) => n._id === finishedId);
        if (current) {
          await apiFetch(`/api/admin/sticky-notes/${finishedId}`, {
            method: 'PUT',
            body: JSON.stringify({ x: current.x, y: current.y, zIndex: current.zIndex }),
          }).catch(() => {});
        }
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp, { once: true });
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [draggingId, dragOffset, adminUser, apiFetch, setStickyNotes, stickyNotes]);

  if (activeNotes.length === 0) return null;

  const bringToFront = (note: StickyNote) => {
    const maxZ = Math.max(30, ...stickyNotes.map((n) => n.zIndex || 20));
    const nextZ = maxZ + 1;
    setStickyNotes((prev) =>
      prev.map((n) => (n._id === note._id ? { ...n, zIndex: nextZ } : n))
    );
  };

  return (
    <div className="hidden lg:block fixed inset-0 pointer-events-none z-30" aria-label="Pinned Studio Notes">
      {activeNotes.map((note) => {
        const palette = NOTE_PALETTES[note.color] || NOTE_PALETTES.amber;
        const layerZ =
          note.layer === 'back' ? 15 : note.layer === 'mid' ? 28 : note.zIndex || 35;

        return (
          <div
            key={note._id}
            style={{
              left: `${note.x}%`,
              top: `${note.y}%`,
              width: `${note.width || 235}px`,
              transform: `rotate(${note.rotation || 0}deg)`,
              zIndex: draggingId === note._id ? 45 : layerZ,
              backgroundColor: palette.bg,
              borderColor: palette.border,
            }}
            onPointerDown={(e) => {
              const target = e.currentTarget.getBoundingClientRect();
              bringToFront(note);
              setDragOffset({ dx: e.clientX - target.left, dy: e.clientY - target.top });
              setDraggingId(note._id);
            }}
            className="pointer-events-auto fixed rounded-[2px] border backdrop-blur-xl shadow-2xl p-3.5 cursor-grab active:cursor-grabbing select-none transition-shadow hover:shadow-[0_18px_40px_rgba(0,0,0,0.55)]"
          >
            <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-white/10">
              <div className="flex items-center gap-1.5 min-w-0">
                <GripVertical className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span
                  className="text-xs font-bold truncate"
                  style={{ color: palette.accent }}
                >
                  {note.title}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[10px] font-mono-num text-neutral-400 inline-flex items-center gap-0.5" title={`Layer: ${note.layer}`}>
                  <Layers className="w-2.5 h-2.5" />
                  {note.layer}
                </span>
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => setDismissedIds((prev) => [...prev, note._id])}
                  className="p-0.5 text-neutral-400 hover:text-white"
                  aria-label="Hide sticky note"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-neutral-100 whitespace-pre-line">
              {note.content}
            </p>
          </div>
        );
      })}
    </div>
  );
};

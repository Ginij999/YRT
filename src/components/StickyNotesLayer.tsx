import React, { useEffect, useState } from 'react';
import { useSite } from '../context/SiteContext';
import { StickyNote } from '../types/cms';
import { StickerCard } from './StickerCard';

export const StickyNotesLayer: React.FC<{ pageSlug: string }> = ({ pageSlug }) => {
  const { stickyNotes, setStickyNotes, adminUser, apiFetch } = useSite();
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  const activeNotes = stickyNotes
    .filter(
      (n) =>
        n.visible &&
        (n.displayMode === 'floating' || n.displayMode === 'both') &&
        (n.pageSlug === 'all' || n.pageSlug === pageSlug) &&
        !dismissedIds.includes(n._id)
    )
    .sort((a, b) => (a.zIndex || 20) - (b.zIndex || 20));

  useEffect(() => {
    if (!draggingId) return;

    const onPointerMove = (e: PointerEvent) => {
      const vw = Math.max(window.innerWidth, 320);
      const vh = Math.max(window.innerHeight, 480);
      const nextX = Math.min(84, Math.max(2, ((e.clientX - dragOffset.dx) / vw) * 100));
      const nextY = Math.min(78, Math.max(10, ((e.clientY - dragOffset.dy) / vh) * 100));

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
        const layerZ =
          note.layer === 'back' ? 15 : note.layer === 'mid' ? 28 : note.zIndex || 35;

        return (
          <div
            key={note._id}
            style={{
              left: `${note.x}%`,
              top: `${note.y}%`,
              width: `${note.width || 245}px`,
              transform: `rotate(${note.rotation || 0}deg)`,
              zIndex: draggingId === note._id ? 45 : layerZ,
            }}
            onPointerDown={(e) => {
              const target = e.currentTarget.getBoundingClientRect();
              bringToFront(note);
              setDragOffset({ dx: e.clientX - target.left, dy: e.clientY - target.top });
              setDraggingId(note._id);
            }}
            className="pointer-events-auto fixed cursor-grab active:cursor-grabbing select-none"
          >
            <StickerCard
              note={note}
              onDismiss={() => setDismissedIds((prev) => [...prev, note._id])}
            />
          </div>
        );
      })}
    </div>
  );
};

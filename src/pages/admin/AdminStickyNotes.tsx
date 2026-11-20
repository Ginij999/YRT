import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Layers, Plus, Save, StickyNote as StickyIcon, Trash2 } from 'lucide-react';
import { useSite } from '../../context/SiteContext';
import { StickyNote } from '../../types/cms';

type NotifyFn = (msg: string, type?: 'success' | 'error') => void;

const COLOR_STYLES: Record<string, { bg: string; border: string; label: string }> = {
  amber: { bg: 'rgba(66, 46, 16, 0.92)', border: '#F59E0B', label: 'Amber' },
  crimson: { bg: 'rgba(64, 16, 22, 0.92)', border: '#EF4444', label: 'Crimson' },
  emerald: { bg: 'rgba(14, 52, 36, 0.92)', border: '#10B981', label: 'Emerald' },
  sky: { bg: 'rgba(14, 38, 62, 0.92)', border: '#38BDF8', label: 'Sky' },
  slate: { bg: 'rgba(34, 34, 44, 0.94)', border: '#94A3B8', label: 'Slate' },
};

const PAGE_SLUGS = [
  { value: 'all', label: 'All Public Pages' },
  { value: 'home', label: 'Home (/)' },
  { value: 'services', label: 'Services (/services)' },
  { value: 'portfolio', label: 'Portfolio (/portfolio)' },
  { value: 'events', label: 'Events (/events)' },
  { value: 'team', label: 'Teams (/team)' },
  { value: 'reviews', label: 'Reviews (/reviews)' },
  { value: 'contact', label: 'Contact (/contact)' },
];

export const AdminStickyNotes: React.FC<{ notify: NotifyFn }> = ({ notify }) => {
  const { apiFetch, refreshBootstrap } = useSite();
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const load = async () => {
    const res = await apiFetch('/api/admin/sticky-notes');
    if (res.ok) {
      const list: StickyNote[] = await res.json();
      setNotes(list);
      if (list.length > 0 && !selectedId) {
        setSelectedId(list[0]._id);
      }
    }
  };

  useEffect(() => {
    load();
  }, []);

  const selectedNote = notes.find((n) => n._id === selectedId) || null;

  const updateLocalNote = (id: string, patch: Partial<StickyNote>) => {
    setNotes((prev) => prev.map((n) => (n._id === id ? { ...n, ...patch } : n)));
  };

  const createNote = async () => {
    const maxZ = Math.max(20, ...notes.map((n) => n.zIndex || 20));
    const res = await apiFetch('/api/admin/sticky-notes', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Studio Announcement',
        content: 'Write a quick pinned message or schedule note here.',
        color: 'amber',
        x: 68,
        y: 22,
        width: 240,
        rotation: -1,
        zIndex: maxZ + 1,
        layer: 'front',
        pageSlug: 'home',
        visible: true,
      }),
    });
    if (res.ok) {
      const created: StickyNote = await res.json();
      await load();
      setSelectedId(created._id);
      await refreshBootstrap();
      notify('Sticky note created.');
    }
  };

  const saveSelectedNote = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedNote) return;
    setSaving(true);
    try {
      const res = await apiFetch(`/api/admin/sticky-notes/${selectedNote._id}`, {
        method: 'PUT',
        body: JSON.stringify(selectedNote),
      });
      if (res.ok) {
        await refreshBootstrap();
        notify('Sticky note saved & synced to live site.');
      } else {
        notify('Failed to save sticky note', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const saveAllLayoutLayers = async () => {
    setSaving(true);
    try {
      const res = await apiFetch('/api/admin/sticky-notes/batch', {
        method: 'PUT',
        body: JSON.stringify({
          notes: notes.map((n) => ({
            _id: n._id,
            x: n.x,
            y: n.y,
            zIndex: n.zIndex,
            layer: n.layer,
          })),
        }),
      });
      if (res.ok) {
        await refreshBootstrap();
        notify('All note positions and layers saved.');
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = async (id: string) => {
    const res = await apiFetch(`/api/admin/sticky-notes/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setNotes((prev) => prev.filter((n) => n._id !== id));
      if (selectedId === id) setSelectedId(null);
      await refreshBootstrap();
      notify('Sticky note deleted.');
    }
  };

  useEffect(() => {
    if (!draggingId) return;
    const onMove = (e: PointerEvent) => {
      const board = boardRef.current;
      if (!board) return;
      const rect = board.getBoundingClientRect();
      const x = Math.min(82, Math.max(2, ((e.clientX - rect.left) / rect.width) * 100 - 8));
      const y = Math.min(78, Math.max(4, ((e.clientY - rect.top) / rect.height) * 100 - 5));
      updateLocalNote(draggingId, { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) });
    };
    const onUp = () => setDraggingId(null);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [draggingId]);

  const sortedForList = [...notes].sort((a, b) => (b.zIndex || 20) - (a.zIndex || 20));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <StickyIcon className="w-5 h-5 text-red-500" />
            <span>Sticky Notes &amp; Layer Organizer</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Drag sticky notes across the viewport canvas, organize Front/Mid/Back z-index layers, and edit live content.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={saveAllLayoutLayers}
            disabled={saving || notes.length === 0}
            className="px-4 py-2 text-xs font-semibold border border-white/15 bg-white/5 hover:bg-white/10 text-white inline-flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save All Positions &amp; Layers</span>
          </button>
          <button
            type="button"
            onClick={createNote}
            className="px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Sticky Note</span>
          </button>
        </div>
      </div>

      {/* Visual Drag & Drop Viewport Stage */}
      <div className="p-4 bg-[#111115] border border-white/10 space-y-3">
        <div className="flex items-center justify-between text-xs text-neutral-400">
          <span>Interactive Position Canvas (drag any note to reposition across desktop screens)</span>
          <span className="font-mono-num">{notes.length} notes total</span>
        </div>

        <div
          ref={boardRef}
          className="relative w-full h-[360px] rounded-xl bg-[#07070a] border border-white/10 overflow-hidden select-none"
        >
          {/* Subtle grid backdrop */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          {notes.map((note) => {
            const palette = COLOR_STYLES[note.color] || COLOR_STYLES.amber;
            const isSelected = note._id === selectedId;
            return (
              <div
                key={note._id}
                onPointerDown={() => {
                  setSelectedId(note._id);
                  setDraggingId(note._id);
                }}
                style={{
                  left: `${note.x}%`,
                  top: `${note.y}%`,
                  zIndex: note.zIndex || 20,
                  backgroundColor: palette.bg,
                  borderColor: isSelected ? '#ffffff' : palette.border,
                  transform: `rotate(${note.rotation || 0}deg)`,
                  opacity: note.visible ? 1 : 0.45,
                }}
                className="absolute w-48 rounded-lg border p-3 cursor-grab active:cursor-grabbing shadow-xl"
              >
                <div className="flex items-center justify-between text-[11px] font-bold text-white mb-1 gap-1">
                  <span className="truncate">{note.title}</span>
                  <span className="font-mono-num text-[10px] text-neutral-300 shrink-0">z:{note.zIndex}</span>
                </div>
                <p className="text-[11px] text-neutral-200 line-clamp-2">{note.content}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Split: Layer Stack + Selected Note Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Layer Organizer Stack */}
        <div className="lg:col-span-5 bg-[#111115] border border-white/10 divide-y divide-white/5">
          <div className="p-4 flex items-center gap-2 text-sm font-semibold text-white">
            <Layers className="w-4 h-4 text-red-500" />
            <span>Layers Stack (Top to Bottom)</span>
          </div>

          {sortedForList.length === 0 ? (
            <div className="p-6 text-xs text-neutral-400">No sticky notes yet. Click &ldquo;New Sticky Note&rdquo; to create one.</div>
          ) : (
            sortedForList.map((note) => {
              const isSelected = note._id === selectedId;
              return (
                <div
                  key={note._id}
                  onClick={() => setSelectedId(note._id)}
                  className={`p-4 flex items-center justify-between gap-3 cursor-pointer ${
                    isSelected ? 'bg-white/10' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white truncate">{note.title}</div>
                    <div className="text-[11px] text-neutral-400 font-mono-num">
                      {note.layer.toUpperCase()} · z:{note.zIndex} · ({note.x}%, {note.y}%) · {note.pageSlug}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => updateLocalNote(note._id, { zIndex: (note.zIndex || 20) + 1 })}
                      className="p-1.5 border border-white/10 text-neutral-300 hover:text-white"
                      title="Bring Forward"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => updateLocalNote(note._id, { zIndex: Math.max(1, (note.zIndex || 20) - 1) })}
                      className="p-1.5 border border-white/10 text-neutral-300 hover:text-white"
                      title="Send Backward"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteNote(note._id)}
                      className="p-1.5 border border-white/10 text-neutral-400 hover:text-red-400"
                      title="Delete Note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Inspector Form */}
        {selectedNote && (
          <form onSubmit={saveSelectedNote} className="lg:col-span-7 p-6 bg-[#111115] border border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h2 className="text-sm font-semibold text-white">Edit Selected Sticky Note</h2>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white inline-flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save Note'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-neutral-300 mb-1">Note Title</label>
                <input
                  type="text"
                  required
                  value={selectedNote.title}
                  onChange={(e) => updateLocalNote(selectedNote._id, { title: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-300 mb-1">Target Page</label>
                <select
                  value={selectedNote.pageSlug}
                  onChange={(e) => updateLocalNote(selectedNote._id, { pageSlug: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white"
                >
                  {PAGE_SLUGS.map((p) => (
                    <option key={p.value} value={p.value} className="bg-neutral-900">
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-neutral-300 mb-1">Message Content</label>
              <textarea
                rows={3}
                value={selectedNote.content}
                onChange={(e) => updateLocalNote(selectedNote._id, { content: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-neutral-300 mb-1">Color Palette</label>
                <select
                  value={selectedNote.color}
                  onChange={(e) =>
                    updateLocalNote(selectedNote._id, { color: e.target.value as StickyNote['color'] })
                  }
                  className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white"
                >
                  {Object.entries(COLOR_STYLES).map(([key, val]) => (
                    <option key={key} value={key} className="bg-neutral-900">
                      {val.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-neutral-300 mb-1">Layer Group</label>
                <select
                  value={selectedNote.layer}
                  onChange={(e) =>
                    updateLocalNote(selectedNote._id, { layer: e.target.value as StickyNote['layer'] })
                  }
                  className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white"
                >
                  <option value="front" className="bg-neutral-900">Front</option>
                  <option value="mid" className="bg-neutral-900">Middle</option>
                  <option value="back" className="bg-neutral-900">Back</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-neutral-300 mb-1">Z-Index</label>
                <input
                  type="number"
                  value={selectedNote.zIndex}
                  onChange={(e) => updateLocalNote(selectedNote._id, { zIndex: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-300 mb-1">Tilt (deg)</label>
                <input
                  type="number"
                  min={-15}
                  max={15}
                  step={0.5}
                  value={selectedNote.rotation}
                  onChange={(e) => updateLocalNote(selectedNote._id, { rotation: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-neutral-300 mb-1">X Position (%)</label>
                <input
                  type="number"
                  min={1}
                  max={88}
                  value={selectedNote.x}
                  onChange={(e) => updateLocalNote(selectedNote._id, { x: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-300 mb-1">Y Position (%)</label>
                <input
                  type="number"
                  min={5}
                  max={85}
                  value={selectedNote.y}
                  onChange={(e) => updateLocalNote(selectedNote._id, { y: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-300 mb-1">Width (px)</label>
                <input
                  type="number"
                  min={180}
                  max={360}
                  value={selectedNote.width}
                  onChange={(e) => updateLocalNote(selectedNote._id, { width: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={selectedNote.visible}
                onChange={(e) => updateLocalNote(selectedNote._id, { visible: e.target.checked })}
                className="accent-red-600"
              />
              <span>Visible on public website</span>
            </label>
          </form>
        )}
      </div>
    </div>
  );
};

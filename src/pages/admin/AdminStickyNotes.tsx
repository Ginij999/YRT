import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  Layers,
  Pin,
  Plus,
  RotateCw,
  Save,
  StickyNote as StickyIcon,
  Trash2,
  Upload,
} from 'lucide-react';
import { useSite } from '../../context/SiteContext';
import { StickyNote, StickyNoteColor } from '../../types/cms';
import { StickerCard, STICKER_PALETTE, resolveNoteHex } from '../../components/StickerCard';

type NotifyFn = (msg: string, type?: 'success' | 'error') => void;

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

const PIN_COLOR_OPTIONS = [
  { value: 'red', hex: '#DC2626', label: 'Red' },
  { value: 'blue', hex: '#2563EB', label: 'Blue' },
  { value: 'amber', hex: '#D97706', label: 'Gold' },
  { value: 'emerald', hex: '#059669', label: 'Green' },
  { value: 'slate', hex: '#334155', label: 'Charcoal' },
];

export const AdminStickyNotes: React.FC<{ notify: NotifyFn }> = ({ notify }) => {
  const { apiFetch, refreshBootstrap, adminToken } = useSite();
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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

  const createNote = async (type: 'note' | 'polaroid' = 'note') => {
    const maxZ = Math.max(20, ...notes.map((n) => n.zIndex || 20));
    const res = await apiFetch('/api/admin/sticky-notes', {
      method: 'POST',
      body: JSON.stringify({
        title: type === 'polaroid' ? 'Studio Snapshot' : 'Studio Note',
        content:
          type === 'polaroid'
            ? 'Kathmandu Broadcast Moment'
            : 'Write a quick pinned message or guiding quote here.',
        author: 'YRT Team',
        color: type === 'polaroid' ? 'slate' : 'yellow',
        customColor: type === 'polaroid' ? '#FFFFFF' : '#FFE066',
        imageUrl: '',
        noteType: type,
        pinStyle: 'pin',
        pinColor: 'red',
        displayMode: 'pinboard',
        x: 35,
        y: 22,
        width: 245,
        rotation: -3,
        zIndex: maxZ + 1,
        layer: 'front',
        pageSlug: 'home',
        visible: true,
        pinned: true,
      }),
    });
    if (res.ok) {
      const created: StickyNote = await res.json();
      await load();
      setSelectedId(created._id);
      await refreshBootstrap();
      notify(type === 'polaroid' ? 'Polaroid sticker created.' : 'Sticky note created.');
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
        notify('Sticker saved & synced to live site.');
      } else {
        notify('Failed to save sticker', 'error');
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
        notify('All sticker positions and layers saved.');
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
      notify('Sticker deleted.');
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!selectedNote) return;
    setUploadingImg(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'stickers');
      fd.append('title', file.name);
      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
        body: fd,
        credentials: 'include',
      });
      if (!res.ok) {
        notify('Image upload failed.', 'error');
        return;
      }
      const uploaded = await res.json();
      if (uploaded?.url) {
        updateLocalNote(selectedNote._id, { imageUrl: uploaded.url });
        notify('Image uploaded! Click Save Sticker to publish.');
      }
    } catch {
      notify('Upload failed.', 'error');
    } finally {
      setUploadingImg(false);
    }
  };

  useEffect(() => {
    if (!draggingId) return;
    const onMove = (e: PointerEvent) => {
      const board = boardRef.current;
      if (!board) return;
      const rect = board.getBoundingClientRect();
      const x = Math.min(76, Math.max(1, ((e.clientX - rect.left) / rect.width) * 100 - 10));
      const y = Math.min(72, Math.max(2, ((e.clientY - rect.top) / rect.height) * 100 - 10));
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
            <span>Sticky Notes, Pushpins &amp; Photo Collage</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Drag sticky notes &amp; Polaroid photos, customize colors, tilt rotation, pushpins, author attribution, and upload photos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
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
            onClick={() => createNote('note')}
            className="px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Sticky Note</span>
          </button>
          <button
            type="button"
            onClick={() => createNote('polaroid')}
            className="px-4 py-2 text-xs font-semibold border border-white/20 bg-white/10 hover:bg-white/15 text-white inline-flex items-center gap-1.5"
          >
            <ImagePlus className="w-3.5 h-3.5" />
            <span>New Photo Polaroid</span>
          </button>
        </div>
      </div>

      {/* Live Interactive Pinboard Stage */}
      <div className="p-4 bg-[#111115] border border-white/10 space-y-3">
        <div className="flex items-center justify-between text-xs text-neutral-400">
          <span>Interactive Pinboard Preview (drag any sticker to rearrange the homepage collage)</span>
          <span className="font-mono-num">{notes.length} stickers total</span>
        </div>

        <div
          ref={boardRef}
          className="relative w-full h-[460px] rounded-xl bg-[#050507] border border-white/10 overflow-hidden select-none"
        >
          {notes.map((note) => {
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
                  width: `${Math.round((note.width || 245) * 0.78)}px`,
                  zIndex: note.zIndex || 20,
                  transform: `rotate(${note.rotation || 0}deg)`,
                  opacity: note.visible ? 1 : 0.42,
                }}
                className={`absolute cursor-grab active:cursor-grabbing ${
                  isSelected ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-[#050507]' : ''
                }`}
              >
                <StickerCard note={note} compact />
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Split: Layer Stack + Selected Sticker Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Layer Organizer Stack */}
        <div className="lg:col-span-5 bg-[#111115] border border-white/10 divide-y divide-white/5">
          <div className="p-4 flex items-center gap-2 text-sm font-semibold text-white">
            <Layers className="w-4 h-4 text-red-500" />
            <span>Sticker Layers Stack (Top to Bottom)</span>
          </div>

          {sortedForList.length === 0 ? (
            <div className="p-6 text-xs text-neutral-400">No sticky notes yet. Create one above.</div>
          ) : (
            sortedForList.map((note) => {
              const isSelected = note._id === selectedId;
              const hex = resolveNoteHex(note);
              return (
                <div
                  key={note._id}
                  onClick={() => setSelectedId(note._id)}
                  className={`p-4 flex items-center justify-between gap-3 cursor-pointer ${
                    isSelected ? 'bg-white/10' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-4 h-4 rounded-sm border border-white/25 shrink-0"
                      style={{ backgroundColor: note.noteType === 'polaroid' ? '#FFFFFF' : hex }}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white truncate">
                        {note.content || note.title}
                      </div>
                      <div className="text-[11px] text-neutral-400 font-mono-num truncate">
                        {note.noteType === 'polaroid' ? 'POLAROID' : 'NOTE'} · — {note.author || 'YRT'} · z:{note.zIndex} · {note.rotation}°
                      </div>
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
                      title="Delete Sticker"
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
          <form onSubmit={saveSelectedNote} className="lg:col-span-7 p-6 bg-[#111115] border border-white/10 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h2 className="text-sm font-semibold text-white">Edit Selected Sticker / Pin</h2>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white inline-flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save Sticker'}</span>
              </button>
            </div>

            {/* Type + Written By + Title */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-neutral-300 mb-1">Sticker Style</label>
                <select
                  value={selectedNote.noteType || 'note'}
                  onChange={(e) =>
                    updateLocalNote(selectedNote._id, { noteType: e.target.value as 'note' | 'polaroid' })
                  }
                  className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white"
                >
                  <option value="note" className="bg-neutral-900">Sticky Note Paper</option>
                  <option value="polaroid" className="bg-neutral-900">Polaroid Photo Card</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-neutral-300 mb-1">Written By (Author)</label>
                <input
                  type="text"
                  placeholder="e.g. Pradip, Founder"
                  value={selectedNote.author || ''}
                  onChange={(e) => updateLocalNote(selectedNote._id, { author: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-300 mb-1">Internal Title</label>
                <input
                  type="text"
                  required
                  value={selectedNote.title}
                  onChange={(e) => updateLocalNote(selectedNote._id, { title: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-neutral-300 mb-1">
                {selectedNote.noteType === 'polaroid' ? 'Photo Caption' : 'Note Quote / Text'}
              </label>
              <textarea
                rows={3}
                value={selectedNote.content}
                onChange={(e) => updateLocalNote(selectedNote._id, { content: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white"
              />
            </div>

            {/* Color Swatches + Custom Color Picker */}
            <div className="space-y-2 p-3.5 bg-black/30 border border-white/10">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs text-neutral-200 font-semibold">Sticker Paper Color</label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-neutral-400">Custom Color:</span>
                  <input
                    type="color"
                    value={resolveNoteHex(selectedNote)}
                    onChange={(e) =>
                      updateLocalNote(selectedNote._id, { customColor: e.target.value })
                    }
                    className="w-7 h-7 bg-transparent border border-white/20 cursor-pointer"
                    title="Pick any custom sticker color"
                  />
                  <input
                    type="text"
                    value={selectedNote.customColor || resolveNoteHex(selectedNote)}
                    onChange={(e) =>
                      updateLocalNote(selectedNote._id, { customColor: e.target.value })
                    }
                    className="w-20 px-2 py-1 text-[11px] font-mono-num bg-black/60 border border-white/10 text-white"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {Object.entries(STICKER_PALETTE).map(([key, val]) => {
                  const active = selectedNote.color === key && (!selectedNote.customColor || selectedNote.customColor.toLowerCase() === val.hex.toLowerCase());
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        updateLocalNote(selectedNote._id, {
                          color: key as StickyNoteColor,
                          customColor: val.hex,
                        })
                      }
                      className={`px-2.5 py-1.5 text-[11px] font-medium border inline-flex items-center gap-1.5 transition-all ${
                        active ? 'border-white text-white bg-white/10' : 'border-white/10 text-neutral-300 hover:border-white/30'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-black/25"
                        style={{ backgroundColor: val.hex }}
                      />
                      <span>{val.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pin Hardware + Image Upload / URL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 p-3.5 bg-black/30 border border-white/10">
                <label className="text-xs text-neutral-200 font-semibold flex items-center gap-1.5">
                  <Pin className="w-3.5 h-3.5 text-red-500" />
                  <span>Pushpin / Fastener</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={selectedNote.pinStyle || 'pin'}
                    onChange={(e) =>
                      updateLocalNote(selectedNote._id, {
                        pinStyle: e.target.value as StickyNote['pinStyle'],
                      })
                    }
                    className="px-2.5 py-2 text-xs bg-black/60 border border-white/10 text-white"
                  >
                    <option value="pin" className="bg-neutral-900">3D Pushpin</option>
                    <option value="tape" className="bg-neutral-900">Masking Tape</option>
                    <option value="none" className="bg-neutral-900">No Pin</option>
                  </select>
                  <div className="flex items-center gap-1.5 px-2 bg-black/60 border border-white/10">
                    {PIN_COLOR_OPTIONS.map((pc) => (
                      <button
                        key={pc.value}
                        type="button"
                        onClick={() => updateLocalNote(selectedNote._id, { pinColor: pc.value })}
                        title={pc.label}
                        className={`w-4 h-4 rounded-full border transition-transform ${
                          (selectedNote.pinColor || 'red') === pc.value
                            ? 'scale-125 border-white'
                            : 'border-white/30 opacity-75'
                        }`}
                        style={{ backgroundColor: pc.hex }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2 p-3.5 bg-black/30 border border-white/10">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-neutral-200 font-semibold flex items-center gap-1.5">
                    <ImagePlus className="w-3.5 h-3.5 text-red-500" />
                    <span>Attached Photo / Image</span>
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleImageUpload(f);
                      e.target.value = '';
                    }}
                  />
                  <button
                    type="button"
                    disabled={uploadingImg}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-white/10 hover:bg-white/20 text-white inline-flex items-center gap-1"
                  >
                    <Upload className="w-3 h-3" />
                    <span>{uploadingImg ? 'Uploading...' : 'Upload'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="/uploads/... or /assets/images/..."
                  value={selectedNote.imageUrl || ''}
                  onChange={(e) => updateLocalNote(selectedNote._id, { imageUrl: e.target.value })}
                  className="w-full px-2.5 py-2 text-xs bg-black/60 border border-white/10 text-white"
                />
              </div>
            </div>

            {/* Rotation Tilt + Display Mode + Page + Placement */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-neutral-300 mb-1 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1">
                    <RotateCw className="w-3 h-3 text-red-400" />
                    Tilt Rotation ({selectedNote.rotation}°)
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={-25}
                    max={25}
                    step={0.5}
                    value={selectedNote.rotation}
                    onChange={(e) =>
                      updateLocalNote(selectedNote._id, { rotation: Number(e.target.value) })
                    }
                    className="flex-1 accent-red-600"
                  />
                  <input
                    type="number"
                    min={-25}
                    max={25}
                    step={0.5}
                    value={selectedNote.rotation}
                    onChange={(e) =>
                      updateLocalNote(selectedNote._id, { rotation: Number(e.target.value) })
                    }
                    className="w-16 px-2 py-1.5 text-xs bg-black/50 border border-white/10 text-white font-mono-num"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-300 mb-1">Display Location</label>
                <select
                  value={selectedNote.displayMode || 'pinboard'}
                  onChange={(e) =>
                    updateLocalNote(selectedNote._id, {
                      displayMode: e.target.value as StickyNote['displayMode'],
                    })
                  }
                  className="w-full px-2.5 py-2 text-xs bg-black/50 border border-white/10 text-white"
                >
                  <option value="pinboard" className="bg-neutral-900">Pinboard Collage</option>
                  <option value="floating" className="bg-neutral-900">Floating Corner</option>
                  <option value="both" className="bg-neutral-900">Both</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-neutral-300 mb-1">Target Page</label>
                <select
                  value={selectedNote.pageSlug}
                  onChange={(e) => updateLocalNote(selectedNote._id, { pageSlug: e.target.value })}
                  className="w-full px-2.5 py-2 text-xs bg-black/50 border border-white/10 text-white"
                >
                  {PAGE_SLUGS.map((p) => (
                    <option key={p.value} value={p.value} className="bg-neutral-900">
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-neutral-300 mb-1">X Position (%)</label>
                <input
                  type="number"
                  min={0}
                  max={85}
                  value={selectedNote.x}
                  onChange={(e) => updateLocalNote(selectedNote._id, { x: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-300 mb-1">Y Position (%)</label>
                <input
                  type="number"
                  min={0}
                  max={80}
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
              <div>
                <label className="block text-xs text-neutral-300 mb-1">Z-Index</label>
                <input
                  type="number"
                  value={selectedNote.zIndex}
                  onChange={(e) => updateLocalNote(selectedNote._id, { zIndex: Number(e.target.value) })}
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

import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  ExternalLink,
  Plus,
  Save,
  Send,
  Trash2,
} from 'lucide-react';
import { useSite } from '../../context/SiteContext';
import { PageRecord, PageSection } from '../../types/cms';
import { ConfirmModal, ImagePickerField } from './AdminShared';

export const AdminPageBuilder: React.FC<{
  initialSlug?: string;
  notify: (msg: string, type?: 'success' | 'error') => void;
}> = ({ initialSlug = 'home', notify }) => {
  const { apiFetch } = useSite();
  const [pages, setPages] = useState<PageRecord[]>([]);
  const [selectedSlug, setSelectedSlug] = useState(initialSlug);
  const [sections, setSections] = useState<PageSection[]>([]);
  const [editingSec, setEditingSec] = useState<PageSection | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const loadPages = async () => {
    const res = await apiFetch('/api/admin/pages');
    if (res.ok) setPages(await res.json());
  };

  const loadSections = async (slug: string) => {
    const res = await apiFetch(`/api/admin/page-sections?pageSlug=${slug}`);
    if (res.ok) {
      const list: PageSection[] = await res.json();
      setSections(list);
      if (list.length > 0) {
        setEditingSec((prev) => list.find((s) => s._id === prev?._id) || list[0]);
      } else {
        setEditingSec(null);
      }
    }
  };

  useEffect(() => {
    loadPages();
  }, []);

  useEffect(() => {
    setSelectedSlug(initialSlug);
  }, [initialSlug]);

  useEffect(() => {
    loadSections(selectedSlug);
  }, [selectedSlug]);

  const moveSection = async (idx: number, direction: -1 | 1) => {
    const target = idx + direction;
    if (target < 0 || target >= sections.length) return;
    const copy = [...sections];
    const [moved] = copy.splice(idx, 1);
    copy.splice(target, 0, moved);
    setSections(copy);

    await apiFetch('/api/admin/page-sections/reorder', {
      method: 'POST',
      body: JSON.stringify({ orderedIds: copy.map((s) => s._id) }),
    });
    notify('Section order updated.');
  };

  const toggleEnabled = async (sec: PageSection) => {
    const res = await apiFetch(`/api/admin/page-sections/${sec._id}`, {
      method: 'PUT',
      body: JSON.stringify({ enabled: !sec.enabled }),
    });
    if (res.ok) {
      await loadSections(selectedSlug);
      notify(sec.enabled ? 'Section hidden from public page.' : 'Section enabled.');
    }
  };

  const saveSection = async (asDraft: boolean) => {
    if (!editingSec) return;
    const res = await apiFetch(`/api/admin/page-sections/${editingSec._id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...editingSec, isDraft: asDraft }),
    });
    if (res.ok) {
      await loadSections(selectedSlug);
      notify(asDraft ? 'Saved section as draft (use Preview to inspect).' : 'Section saved and published live.');
    } else {
      notify('Failed to save section', 'error');
    }
  };

  const publishAllDrafts = async () => {
    const res = await apiFetch(`/api/admin/pages/${selectedSlug}/publish`, { method: 'POST' });
    if (res.ok) {
      await loadSections(selectedSlug);
      notify(`Published all draft sections for /${selectedSlug === 'home' ? '' : selectedSlug}`);
    }
  };

  const addNewSection = async () => {
    setCreating(true);
    try {
      const res = await apiFetch('/api/admin/page-sections', {
        method: 'POST',
        body: JSON.stringify({
          pageSlug: selectedSlug,
          sectionKey: `custom_${Date.now()}`,
          title: 'New Custom Content Section',
          subtitle: 'Featured Highlight',
          description: 'Add your custom agency copy, imagery, or call-to-action here.',
          layout: 'split',
          order: sections.length + 1,
          enabled: true,
          isDraft: true,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        await loadSections(selectedSlug);
        setEditingSec(created);
        notify('Added new draft section. Edit and publish when ready.');
      }
    } finally {
      setCreating(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const res = await apiFetch(`/api/admin/page-sections/${deleteId}`, { method: 'DELETE' });
    setDeleteId(null);
    if (res.ok) {
      await loadSections(selectedSlug);
      notify('Section removed.');
    }
  };

  const previewHref = selectedSlug === 'home' ? '/?preview=true' : `/${selectedSlug}?preview=true`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Page Builder &amp; Visual Section Editor</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Edit headings, copy, images, videos, CTAs, background colors, reorder sections, save drafts, and publish live.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={previewHref}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 text-xs font-medium border border-white/15 bg-white/5 hover:bg-white/10 text-white inline-flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Preview Page</span>
          </a>
          <button
            type="button"
            onClick={publishAllDrafts}
            className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Publish All Drafts</span>
          </button>
        </div>
      </div>

      {/* Page Selector Bar */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-[#111115] border border-white/10">
        {pages.map((p) => (
          <button
            key={p.slug}
            type="button"
            onClick={() => setSelectedSlug(p.slug)}
            className={`px-3.5 py-2 text-xs font-semibold transition-colors ${
              selectedSlug === p.slug ? 'bg-red-600 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            {p.title}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Ordered Section List */}
        <div className="lg:col-span-5 bg-[#111115] border border-white/10 flex flex-col">
          <div className="px-4 py-3.5 border-b border-white/10 flex items-center justify-between">
            <span className="text-xs font-semibold text-white">Page Sections ({sections.length})</span>
            <button
              type="button"
              onClick={addNewSection}
              disabled={creating}
              className="px-2.5 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Section</span>
            </button>
          </div>

          <div className="divide-y divide-white/5 max-h-[640px] overflow-y-auto">
            {sections.map((sec, idx) => {
              const active = editingSec?._id === sec._id;
              return (
                <div
                  key={sec._id}
                  onClick={() => setEditingSec(sec)}
                  className={`p-3.5 cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                    active ? 'bg-white/10' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-neutral-400 tabular-nums">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="text-xs font-semibold text-white truncate">{sec.title}</span>
                    </div>
                    <div className="text-[11px] text-neutral-400 mt-0.5 flex items-center gap-2">
                      <span>{sec.layout}</span>
                      {sec.isDraft && <span className="text-amber-400 font-medium">· Draft</span>}
                      {!sec.enabled && <span className="text-red-400 font-medium">· Hidden</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => moveSection(idx, -1)}
                      disabled={idx === 0}
                      className="p-1 text-neutral-400 hover:text-white disabled:opacity-25"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSection(idx, 1)}
                      disabled={idx === sections.length - 1}
                      className="p-1 text-neutral-400 hover:text-white disabled:opacity-25"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleEnabled(sec)}
                      className="p-1 text-neutral-400 hover:text-white"
                      title={sec.enabled ? 'Disable section' : 'Enable section'}
                    >
                      {sec.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-red-400" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteId(sec._id)}
                      className="p-1 text-neutral-400 hover:text-red-400"
                      title="Remove section"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Active Section Editor */}
        <div className="lg:col-span-7 bg-[#111115] border border-white/10 p-6">
          {!editingSec ? (
            <div className="py-16 text-center text-xs text-neutral-400">
              Select a section on the left or click &ldquo;Add Section&rdquo; to edit content.
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
                <div>
                  <span className="text-[11px] font-mono text-neutral-400">{editingSec.sectionKey}</span>
                  <h2 className="text-base font-semibold text-white">Edit Section Content</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => saveSection(true)}
                    className="px-3.5 py-2 text-xs font-medium border border-white/15 bg-white/5 hover:bg-white/10 text-white"
                  >
                    Save Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => saveSection(false)}
                    className="px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white inline-flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save &amp; Publish</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-neutral-300 mb-1.5">Subtitle / Kicker</label>
                  <input
                    type="text"
                    value={editingSec.subtitle || ''}
                    onChange={(e) => setEditingSec({ ...editingSec, subtitle: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-300 mb-1.5">Section Layout</label>
                  <select
                    value={editingSec.layout}
                    onChange={(e) => setEditingSec({ ...editingSec, layout: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white"
                  >
                    <option value="split" className="bg-neutral-900">Split (Copy + Media)</option>
                    <option value="centered" className="bg-neutral-900">Centered Editorial</option>
                    <option value="grid" className="bg-neutral-900">Structured Grid</option>
                    <option value="banner" className="bg-neutral-900">Callout Banner</option>
                    <option value="stats" className="bg-neutral-900">Statistics Strip</option>
                    <option value="timeline" className="bg-neutral-900">Timeline</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-300 mb-1.5">Main Heading</label>
                <input
                  type="text"
                  value={editingSec.title}
                  onChange={(e) => setEditingSec({ ...editingSec, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-black/50 border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-300 mb-1.5">Description / Paragraph</label>
                <textarea
                  rows={4}
                  value={editingSec.description}
                  onChange={(e) => setEditingSec({ ...editingSec, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ImagePickerField
                  label="Section Image"
                  value={editingSec.imageUrl || ''}
                  onChange={(url) => setEditingSec({ ...editingSec, imageUrl: url })}
                  folder="general"
                />
                <ImagePickerField
                  label="Video URL (MP4 / Uploaded Video)"
                  value={editingSec.videoUrl || ''}
                  onChange={(url) => setEditingSec({ ...editingSec, videoUrl: url })}
                  folder="general"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-neutral-300 mb-1.5">Primary Button Text</label>
                  <input
                    type="text"
                    value={editingSec.ctaText || ''}
                    onChange={(e) => setEditingSec({ ...editingSec, ctaText: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-300 mb-1.5">Primary Button Link</label>
                  <input
                    type="text"
                    value={editingSec.ctaLink || ''}
                    onChange={(e) => setEditingSec({ ...editingSec, ctaLink: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-neutral-300 mb-1.5">Secondary Button Text</label>
                  <input
                    type="text"
                    value={editingSec.secondaryCtaText || ''}
                    onChange={(e) => setEditingSec({ ...editingSec, secondaryCtaText: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-300 mb-1.5">Secondary Button Link</label>
                  <input
                    type="text"
                    value={editingSec.secondaryCtaLink || ''}
                    onChange={(e) => setEditingSec({ ...editingSec, secondaryCtaLink: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-300 mb-1.5">Custom Background Color</label>
                  <input
                    type="text"
                    placeholder="e.g. #111115 (leave blank for theme)"
                    value={editingSec.backgroundColor || ''}
                    onChange={(e) => setEditingSec({ ...editingSec, backgroundColor: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white"
                  />
                </div>
              </div>

              {/* Editable Structured Items (for Stats, Timeline, Values, Gallery) */}
              {editingSec.items && editingSec.items.length > 0 && (
                <div className="pt-4 border-t border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">Structured Items</span>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingSec({
                          ...editingSec,
                          items: [
                            ...(editingSec.items || []),
                            { id: `item-${Date.now()}`, title: 'New Item', value: '', label: '', description: '' },
                          ],
                        })
                      }
                      className="text-xs text-red-400 hover:underline"
                    >
                      + Add Item
                    </button>
                  </div>
                  <div className="space-y-3">
                    {editingSec.items.map((item, i) => (
                      <div key={item.id || i} className="p-3 border border-white/10 bg-black/30 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="Title / Label"
                          value={item.title || item.label || ''}
                          onChange={(e) => {
                            const next = [...(editingSec.items || [])];
                            next[i] = { ...next[i], title: e.target.value, label: e.target.value };
                            setEditingSec({ ...editingSec, items: next });
                          }}
                          className="px-2.5 py-1.5 text-xs bg-black/50 border border-white/10 text-white"
                        />
                        <input
                          type="text"
                          placeholder="Value / Year"
                          value={item.value || item.year || ''}
                          onChange={(e) => {
                            const next = [...(editingSec.items || [])];
                            next[i] = { ...next[i], value: e.target.value, year: e.target.value };
                            setEditingSec({ ...editingSec, items: next });
                          }}
                          className="px-2.5 py-1.5 text-xs bg-black/50 border border-white/10 text-white"
                        />
                        <input
                          type="text"
                          placeholder="Description / Meta"
                          value={item.description || item.meta || ''}
                          onChange={(e) => {
                            const next = [...(editingSec.items || [])];
                            next[i] = { ...next[i], description: e.target.value, meta: e.target.value };
                            setEditingSec({ ...editingSec, items: next });
                          }}
                          className="px-2.5 py-1.5 text-xs bg-black/50 border border-white/10 text-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={!!deleteId}
        title="Delete Page Section"
        description="This will permanently remove the selected section from the database. You can re-add sections anytime."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { Edit2, Plus, Save, Star, Trash2, X } from 'lucide-react';
import { useSite } from '../../context/SiteContext';
import {
  BlogCategory,
  BlogPost,
  EventItem,
  NavigationItem,
  Partner,
  PortfolioItem,
  ReviewItem,
  SeoMetadata,
  ServiceItem,
  Testimonial,
} from '../../types/cms';
import { ConfirmModal, ImagePickerField, SimpleRichEditor } from './AdminShared';

type NotifyFn = (msg: string, type?: 'success' | 'error') => void;

// ==========================================
// 1. SERVICES MANAGEMENT
// ==========================================
export const AdminServices: React.FC<{ notify: NotifyFn }> = ({ notify }) => {
  const { apiFetch } = useSite();
  const [items, setItems] = useState<ServiceItem[]>([]);
  const [editing, setEditing] = useState<Partial<ServiceItem> | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    const res = await apiFetch('/api/admin/services');
    if (res.ok) setItems(await res.json());
  };
  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const isNew = !editing._id;
    const res = await apiFetch(isNew ? '/api/admin/services' : `/api/admin/services/${editing._id}`, {
      method: isNew ? 'POST' : 'PUT',
      body: JSON.stringify(editing),
    });
    if (res.ok) {
      setEditing(null);
      await load();
      notify(isNew ? 'Service created.' : 'Service updated.');
    } else notify('Failed to save service', 'error');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Services Management</h1>
          <p className="text-xs text-neutral-400 mt-1">Manage core agency services, deliverables, and detail pages.</p>
        </div>
        <button
          type="button"
          onClick={() =>
            setEditing({
              title: '',
              shortDescription: '',
              fullDescription: '',
              deliverables: ['Dedicated Operations Lead'],
              processSteps: [{ title: 'Discovery', detail: 'Scope & planning' }],
              imageUrl: '',
              iconName: 'Trophy',
              order: items.length + 1,
              featured: false,
              status: 'published',
            })
          }
          className="px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white inline-flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> Add Service
        </button>
      </div>

      <div className="bg-[#111115] border border-white/10 divide-y divide-white/5">
        {items.map((item) => (
          <div key={item._id} className="p-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white">{item.title}</div>
              <div className="text-xs text-neutral-400 truncate">/services/{item.slug} · {item.status}</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button type="button" onClick={() => setEditing(item)} className="p-2 text-neutral-300 hover:text-white">
                <Edit2 className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => setDeleteId(item._id)} className="p-2 text-neutral-400 hover:text-red-400">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/85 p-4 overflow-y-auto flex items-start justify-center">
          <form onSubmit={save} className="max-w-2xl w-full bg-[#111115] border border-white/15 p-6 my-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h2 className="text-base font-semibold text-white">{editing._id ? 'Edit Service' : 'New Service'}</h2>
              <button type="button" onClick={() => setEditing(null)} className="text-neutral-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-neutral-300 mb-1">Title *</label>
                <input required type="text" value={editing.title || ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
              </div>
              <div>
                <label className="block text-xs text-neutral-300 mb-1">Status</label>
                <select value={editing.status || 'published'} onChange={(e) => setEditing({ ...editing, status: e.target.value as any })} className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white">
                  <option value="published" className="bg-neutral-900">Published</option>
                  <option value="draft" className="bg-neutral-900">Draft</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-neutral-300 mb-1">Short Description *</label>
              <input required type="text" value={editing.shortDescription || ''} onChange={(e) => setEditing({ ...editing, shortDescription: e.target.value })} className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
            </div>
            <div>
              <label className="block text-xs text-neutral-300 mb-1">Full Description *</label>
              <textarea required rows={4} value={editing.fullDescription || ''} onChange={(e) => setEditing({ ...editing, fullDescription: e.target.value })} className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
            </div>
            <div>
              <label className="block text-xs text-neutral-300 mb-1">Deliverables (one per line)</label>
              <textarea rows={3} value={(editing.deliverables || []).join('\n')} onChange={(e) => setEditing({ ...editing, deliverables: e.target.value.split('\n').filter(Boolean) })} className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
            </div>
            <ImagePickerField label="Service Image" value={editing.imageUrl || ''} onChange={(url) => setEditing({ ...editing, imageUrl: url })} folder="general" />
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 text-xs border border-white/15 text-neutral-300">Cancel</button>
              <button type="submit" className="px-5 py-2 text-xs font-semibold bg-red-600 text-white">Save Service</button>
            </div>
          </form>
        </div>
      )}

      <ConfirmModal
        open={!!deleteId}
        title="Delete Service"
        description="Are you sure you want to remove this service?"
        onConfirm={async () => {
          if (deleteId) {
            await apiFetch(`/api/admin/services/${deleteId}`, { method: 'DELETE' });
            setDeleteId(null);
            await load();
            notify('Service deleted.');
          }
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};

// ==========================================
// 2. PORTFOLIO MANAGEMENT
// ==========================================
export const AdminPortfolio: React.FC<{ notify: NotifyFn }> = ({ notify }) => {
  const { apiFetch } = useSite();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [editing, setEditing] = useState<Partial<PortfolioItem> | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    const res = await apiFetch('/api/admin/portfolio');
    if (res.ok) setItems(await res.json());
  };
  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const isNew = !editing._id;
    const res = await apiFetch(isNew ? '/api/admin/portfolio' : `/api/admin/portfolio/${editing._id}`, {
      method: isNew ? 'POST' : 'PUT',
      body: JSON.stringify(editing),
    });
    if (res.ok) {
      setEditing(null);
      await load();
      notify(isNew ? 'Project added to portfolio.' : 'Portfolio project updated.');
    } else notify('Error saving project', 'error');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Portfolio &amp; Case Studies</h1>
          <p className="text-xs text-neutral-400 mt-1">Manage completed esports projects, galleries, videos, and featured status.</p>
        </div>
        <button
          type="button"
          onClick={() =>
            setEditing({
              title: '',
              thumbnailUrl: '',
              coverUrl: '',
              gallery: [],
              description: '',
              category: 'Arena Championship',
              projectType: 'End-to-End Production',
              gameTitle: 'Valorant',
              client: '',
              projectDate: 'November 2026',
              year: 2026,
              location: '',
              servicesProvided: [],
              videoUrl: '',
              externalUrl: '',
              metrics: '',
              featured: false,
              status: 'published',
            })
          }
          className="px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white inline-flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> Add Project
        </button>
      </div>

      <div className="bg-[#111115] border border-white/10 divide-y divide-white/5">
        {items.map((proj) => (
          <div key={proj._id} className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <img src={proj.thumbnailUrl} alt={proj.title} className="w-16 h-10 object-cover border border-white/10 shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white truncate">{proj.title}</div>
                <div className="text-xs text-neutral-400 tabular-nums">
                  {proj.category} · {proj.gameTitle} · {proj.year} · {proj.status}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={async () => {
                  await apiFetch(`/api/admin/portfolio/${proj._id}`, {
                    method: 'PUT',
                    body: JSON.stringify({ featured: !proj.featured }),
                  });
                  await load();
                }}
                className={`p-2 ${proj.featured ? 'text-amber-400' : 'text-neutral-500 hover:text-white'}`}
                title="Toggle Featured"
              >
                <Star className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => setEditing(proj)} className="p-2 text-neutral-300 hover:text-white">
                <Edit2 className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => setDeleteId(proj._id)} className="p-2 text-neutral-400 hover:text-red-400">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/85 p-4 overflow-y-auto flex items-start justify-center">
          <form onSubmit={save} className="max-w-3xl w-full bg-[#111115] border border-white/15 p-6 my-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h2 className="text-base font-semibold text-white">{editing._id ? 'Edit Portfolio Project' : 'New Portfolio Project'}</h2>
              <button type="button" onClick={() => setEditing(null)} className="text-neutral-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-neutral-300 mb-1">Project Title *</label>
                <input required type="text" value={editing.title || ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
              </div>
              <div>
                <label className="block text-xs text-neutral-300 mb-1">Client / Partner *</label>
                <input required type="text" value={editing.client || ''} onChange={(e) => setEditing({ ...editing, client: e.target.value })} className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-neutral-300 mb-1">Category</label>
                <input type="text" value={editing.category || ''} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
              </div>
              <div>
                <label className="block text-xs text-neutral-300 mb-1">Game Title</label>
                <input type="text" value={editing.gameTitle || ''} onChange={(e) => setEditing({ ...editing, gameTitle: e.target.value })} className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
              </div>
              <div>
                <label className="block text-xs text-neutral-300 mb-1">Year</label>
                <input type="number" value={editing.year || 2026} onChange={(e) => setEditing({ ...editing, year: Number(e.target.value) })} className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
              </div>
              <div>
                <label className="block text-xs text-neutral-300 mb-1">Status</label>
                <select value={editing.status || 'published'} onChange={(e) => setEditing({ ...editing, status: e.target.value as any })} className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white">
                  <option value="published" className="bg-neutral-900">Published</option>
                  <option value="draft" className="bg-neutral-900">Draft</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-neutral-300 mb-1">Location</label>
                <input type="text" value={editing.location || ''} onChange={(e) => setEditing({ ...editing, location: e.target.value })} className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
              </div>
              <div>
                <label className="block text-xs text-neutral-300 mb-1">Project Date</label>
                <input type="text" value={editing.projectDate || ''} onChange={(e) => setEditing({ ...editing, projectDate: e.target.value })} className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
              </div>
              <div>
                <label className="block text-xs text-neutral-300 mb-1">Project Type</label>
                <input type="text" value={editing.projectType || ''} onChange={(e) => setEditing({ ...editing, projectType: e.target.value })} className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-neutral-300 mb-1">Description *</label>
              <textarea required rows={3} value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ImagePickerField label="Thumbnail Image *" value={editing.thumbnailUrl || ''} onChange={(url) => setEditing({ ...editing, thumbnailUrl: url, coverUrl: editing.coverUrl || url })} folder="portfolio" />
              <ImagePickerField label="Cover Image" value={editing.coverUrl || ''} onChange={(url) => setEditing({ ...editing, coverUrl: url })} folder="portfolio" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-neutral-300 mb-1">Key Metrics Highlight</label>
                <input type="text" value={editing.metrics || ''} onChange={(e) => setEditing({ ...editing, metrics: e.target.value })} className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" placeholder="e.g. 280K Peak Concurrent" />
              </div>
              <div>
                <label className="block text-xs text-neutral-300 mb-1">YouTube Embed URL</label>
                <input type="url" value={editing.videoUrl || ''} onChange={(e) => setEditing({ ...editing, videoUrl: e.target.value })} className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-neutral-300 mb-1">Services Provided (comma-separated)</label>
                <input type="text" value={(editing.servicesProvided || []).join(', ')} onChange={(e) => setEditing({ ...editing, servicesProvided: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
              </div>
              <div>
                <label className="block text-xs text-neutral-300 mb-1">External Project URL</label>
                <input type="url" value={editing.externalUrl || ''} onChange={(e) => setEditing({ ...editing, externalUrl: e.target.value })} className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 text-xs border border-white/15 text-neutral-300">Cancel</button>
              <button type="submit" className="px-5 py-2 text-xs font-semibold bg-red-600 text-white">Save Project</button>
            </div>
          </form>
        </div>
      )}

      <ConfirmModal
        open={!!deleteId}
        title="Delete Portfolio Project"
        description="This case study will be permanently deleted from MongoDB."
        onConfirm={async () => {
          if (deleteId) {
            await apiFetch(`/api/admin/portfolio/${deleteId}`, { method: 'DELETE' });
            setDeleteId(null);
            await load();
            notify('Project deleted.');
          }
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};

// ==========================================
// 3. EVENTS & TOURNAMENTS MANAGEMENT
// ==========================================
export const AdminEvents: React.FC<{ notify: NotifyFn }> = ({ notify }) => {
  const { apiFetch } = useSite();
  const [items, setItems] = useState<EventItem[]>([]);
  const [editing, setEditing] = useState<Partial<EventItem> | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    const res = await apiFetch('/api/admin/events');
    if (res.ok) setItems(await res.json());
  };
  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const isNew = !editing._id;
    const res = await apiFetch(isNew ? '/api/admin/events' : `/api/admin/events/${editing._id}`, {
      method: isNew ? 'POST' : 'PUT',
      body: JSON.stringify(editing),
    });
    if (res.ok) {
      setEditing(null);
      await load();
      notify(isNew ? 'Tournament event created.' : 'Event updated.');
    } else notify('Failed to save event', 'error');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Events &amp; Tournaments</h1>
          <p className="text-xs text-neutral-400 mt-1">Manage upcoming, ongoing, and completed tournaments, banners, and final standings.</p>
        </div>
        <button
          type="button"
          onClick={() =>
            setEditing({
              title: '',
              status: 'upcoming',
              bannerUrl: '',
              description: '',
              gameCategory: 'Counter-Strike 2',
              location: '',
              startDate: '2026-12-01',
              endDate: '2026-12-05',
              prizePool: '$100,000',
              teamsCount: 16,
              results: [],
              gallery: [],
              featured: false,
            })
          }
          className="px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white inline-flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> Add Event
        </button>
      </div>

      <div className="bg-[#111115] border border-white/10 divide-y divide-white/5">
        {items.map((evt) => (
          <div key={evt._id} className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <img src={evt.bannerUrl} alt={evt.title} className="w-16 h-10 object-cover border border-white/10 shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white truncate">{evt.title}</div>
                <div className="text-xs text-neutral-400 capitalize tabular-nums">
                  {evt.status} · {evt.gameCategory} · {evt.prizePool} · {evt.startDate}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button type="button" onClick={() => setEditing(evt)} className="p-2 text-neutral-300 hover:text-white"><Edit2 className="w-4 h-4" /></button>
              <button type="button" onClick={() => setDeleteId(evt._id)} className="p-2 text-neutral-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/85 p-4 overflow-y-auto flex items-start justify-center">
          <form onSubmit={save} className="max-w-2xl w-full bg-[#111115] border border-white/15 p-6 my-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h2 className="text-base font-semibold text-white">{editing._id ? 'Edit Event' : 'New Event'}</h2>
              <button type="button" onClick={() => setEditing(null)} className="text-neutral-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-neutral-300 mb-1">Event Title *</label>
                <input required type="text" value={editing.title || ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
              </div>
              <div>
                <label className="block text-xs text-neutral-300 mb-1">Status</label>
                <select value={editing.status || 'upcoming'} onChange={(e) => setEditing({ ...editing, status: e.target.value as any })} className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white">
                  <option value="upcoming" className="bg-neutral-900">Upcoming</option>
                  <option value="ongoing" className="bg-neutral-900">Ongoing</option>
                  <option value="completed" className="bg-neutral-900">Completed</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-neutral-300 mb-1">Game Category</label>
                <input type="text" value={editing.gameCategory || ''} onChange={(e) => setEditing({ ...editing, gameCategory: e.target.value })} className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
              </div>
              <div>
                <label className="block text-xs text-neutral-300 mb-1">Location</label>
                <input type="text" value={editing.location || ''} onChange={(e) => setEditing({ ...editing, location: e.target.value })} className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
              </div>
              <div>
                <label className="block text-xs text-neutral-300 mb-1">Prize Pool</label>
                <input type="text" value={editing.prizePool || ''} onChange={(e) => setEditing({ ...editing, prizePool: e.target.value })} className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
              </div>
              <div>
                <label className="block text-xs text-neutral-300 mb-1">Teams Count</label>
                <input type="number" value={editing.teamsCount || 16} onChange={(e) => setEditing({ ...editing, teamsCount: Number(e.target.value) })} className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-neutral-300 mb-1">Start Date</label>
                <input type="date" value={editing.startDate || ''} onChange={(e) => setEditing({ ...editing, startDate: e.target.value })} className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
              </div>
              <div>
                <label className="block text-xs text-neutral-300 mb-1">End Date</label>
                <input type="date" value={editing.endDate || ''} onChange={(e) => setEditing({ ...editing, endDate: e.target.value })} className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-neutral-300 mb-1">Description *</label>
              <textarea required rows={3} value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
            </div>
            <ImagePickerField label="Tournament Banner *" value={editing.bannerUrl || ''} onChange={(url) => setEditing({ ...editing, bannerUrl: url })} folder="events" />
            <div className="flex items-center gap-2 text-xs text-neutral-300">
              <input type="checkbox" checked={!!editing.featured} onChange={(e) => setEditing({ ...editing, featured: e.target.checked })} />
              <span>Feature this tournament on Events spotlight</span>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 text-xs border border-white/15 text-neutral-300">Cancel</button>
              <button type="submit" className="px-5 py-2 text-xs font-semibold bg-red-600 text-white">Save Event</button>
            </div>
          </form>
        </div>
      )}

      <ConfirmModal
        open={!!deleteId}
        title="Delete Tournament Event"
        description="This tournament event and its standings will be removed."
        onConfirm={async () => {
          if (deleteId) {
            await apiFetch(`/api/admin/events/${deleteId}`, { method: 'DELETE' });
            setDeleteId(null);
            await load();
            notify('Event deleted.');
          }
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};

// ==========================================
// 4. BLOG & CATEGORIES MANAGEMENT
// ==========================================
export const AdminBlog: React.FC<{ notify: NotifyFn }> = ({ notify }) => {
  const { apiFetch } = useSite();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [editing, setEditing] = useState<Partial<BlogPost> | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    const [pRes, cRes] = await Promise.all([
      apiFetch('/api/admin/blog'),
      apiFetch('/api/admin/blog-categories'),
    ]);
    if (pRes.ok) setPosts(await pRes.json());
    if (cRes.ok) setCategories(await cRes.json());
  };
  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const isNew = !editing._id;
    const res = await apiFetch(isNew ? '/api/admin/blog' : `/api/admin/blog/${editing._id}`, {
      method: isNew ? 'POST' : 'PUT',
      body: JSON.stringify(editing),
    });
    if (res.ok) {
      setEditing(null);
      await load();
      notify(isNew ? 'Article created.' : 'Article updated.');
    } else notify('Failed to save article', 'error');
  };

  const addCategory = async () => {
    if (!newCatName.trim()) return;
    const res = await apiFetch('/api/admin/blog-categories', {
      method: 'POST',
      body: JSON.stringify({ name: newCatName.trim(), description: '' }),
    });
    if (res.ok) {
      setNewCatName('');
      await load();
      notify('Blog category added.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Blog &amp; Editorial Management</h1>
          <p className="text-xs text-neutral-400 mt-1">Create, edit, publish, unpublish, schedule articles, and manage SEO.</p>
        </div>
        <button
          type="button"
          onClick={() =>
            setEditing({
              title: '',
              excerpt: '',
              content: '<p>Write your article body here...</p>',
              coverImageUrl: '',
              category: categories[0]?.name || 'Company News',
              tags: [],
              authorName: 'YRT Editorial',
              authorRole: 'Editorial Desk',
              status: 'published',
              publishedAt: new Date().toISOString().slice(0, 10),
              featured: false,
              readTime: '4 min read',
            })
          }
          className="px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white inline-flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> New Article
        </button>
      </div>

      {/* Categories Strip */}
      <div className="p-4 bg-[#111115] border border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-300">
          <span className="font-semibold text-white">Categories:</span>
          {categories.map((c) => (
            <span key={c._id} className="px-2.5 py-1 bg-white/5 border border-white/10">{c.name}</span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="New category..."
            className="px-3 py-1.5 text-xs bg-black/50 border border-white/10 text-white"
          />
          <button type="button" onClick={addCategory} className="px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white">
            Add
          </button>
        </div>
      </div>

      <div className="bg-[#111115] border border-white/10 divide-y divide-white/5">
        {posts.map((post) => (
          <div key={post._id} className="p-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white truncate">{post.title}</div>
              <div className="text-xs text-neutral-400 capitalize tabular-nums">
                {post.status} · {post.category} · {post.publishedAt || post.scheduledFor}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={async () => {
                  const nextStatus = post.status === 'published' ? 'draft' : 'published';
                  await apiFetch(`/api/admin/blog/${post._id}`, {
                    method: 'PUT',
                    body: JSON.stringify({ status: nextStatus }),
                  });
                  await load();
                  notify(`Article marked as ${nextStatus}.`);
                }}
                className="px-2.5 py-1 text-[11px] border border-white/15 text-neutral-200 hover:text-white"
              >
                {post.status === 'published' ? 'Unpublish' : 'Publish'}
              </button>
              <button type="button" onClick={() => setEditing(post)} className="p-2 text-neutral-300 hover:text-white"><Edit2 className="w-4 h-4" /></button>
              <button type="button" onClick={() => setDeleteId(post._id)} className="p-2 text-neutral-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/85 p-4 overflow-y-auto flex items-start justify-center">
          <form onSubmit={save} className="max-w-3xl w-full bg-[#111115] border border-white/15 p-6 my-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h2 className="text-base font-semibold text-white">{editing._id ? 'Edit Article' : 'New Article'}</h2>
              <button type="button" onClick={() => setEditing(null)} className="text-neutral-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div>
              <label className="block text-xs text-neutral-300 mb-1">Article Title *</label>
              <input required type="text" value={editing.title || ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="w-full px-3 py-2 text-sm bg-black/50 border border-white/10 text-white" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-neutral-300 mb-1">Category</label>
                <select value={editing.category || ''} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white">
                  {categories.map((c) => <option key={c._id} value={c.name} className="bg-neutral-900">{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-neutral-300 mb-1">Status</label>
                <select value={editing.status || 'published'} onChange={(e) => setEditing({ ...editing, status: e.target.value as any })} className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white">
                  <option value="published" className="bg-neutral-900">Published</option>
                  <option value="draft" className="bg-neutral-900">Draft</option>
                  <option value="scheduled" className="bg-neutral-900">Scheduled</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-neutral-300 mb-1">{editing.status === 'scheduled' ? 'Schedule Date' : 'Publish Date'}</label>
                <input
                  type="date"
                  value={editing.status === 'scheduled' ? editing.scheduledFor || '' : editing.publishedAt || ''}
                  onChange={(e) =>
                    editing.status === 'scheduled'
                      ? setEditing({ ...editing, scheduledFor: e.target.value })
                      : setEditing({ ...editing, publishedAt: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-neutral-300 mb-1">Excerpt *</label>
              <textarea required rows={2} value={editing.excerpt || ''} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
            </div>
            <div>
              <label className="block text-xs text-neutral-300 mb-1">Rich Article Content</label>
              <SimpleRichEditor value={editing.content || ''} onChange={(html) => setEditing({ ...editing, content: html })} />
            </div>
            <ImagePickerField label="Cover Thumbnail *" value={editing.coverImageUrl || ''} onChange={(url) => setEditing({ ...editing, coverImageUrl: url })} folder="blog" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-neutral-300 mb-1">Author Name</label>
                <input type="text" value={editing.authorName || ''} onChange={(e) => setEditing({ ...editing, authorName: e.target.value })} className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
              </div>
              <div>
                <label className="block text-xs text-neutral-300 mb-1">Tags (comma-separated)</label>
                <input type="text" value={(editing.tags || []).join(', ')} onChange={(e) => setEditing({ ...editing, tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })} className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-neutral-300 mb-1">SEO Title</label>
                <input type="text" value={editing.seoTitle || ''} onChange={(e) => setEditing({ ...editing, seoTitle: e.target.value })} className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
              </div>
              <div>
                <label className="block text-xs text-neutral-300 mb-1">SEO Description</label>
                <input type="text" value={editing.seoDescription || ''} onChange={(e) => setEditing({ ...editing, seoDescription: e.target.value })} className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 text-xs border border-white/15 text-neutral-300">Cancel</button>
              <button type="submit" className="px-5 py-2 text-xs font-semibold bg-red-600 text-white">Save Article</button>
            </div>
          </form>
        </div>
      )}

      <ConfirmModal
        open={!!deleteId}
        title="Delete Article"
        description="Permanently delete this blog article?"
        onConfirm={async () => {
          if (deleteId) {
            await apiFetch(`/api/admin/blog/${deleteId}`, { method: 'DELETE' });
            setDeleteId(null);
            await load();
            notify('Article deleted.');
          }
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};

// ==========================================
// 5. TESTIMONIALS & PARTNERS & NAV & SEO
// ==========================================
export const AdminTestimonials: React.FC<{ notify: NotifyFn }> = ({ notify }) => {
  const { apiFetch } = useSite();
  const [items, setItems] = useState<Testimonial[]>([]);
  const [editing, setEditing] = useState<Partial<Testimonial> | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    const res = await apiFetch('/api/admin/testimonials');
    if (res.ok) setItems(await res.json());
  };
  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const isNew = !editing._id;
    const res = await apiFetch(isNew ? '/api/admin/testimonials' : `/api/admin/testimonials/${editing._id}`, {
      method: isNew ? 'POST' : 'PUT',
      body: JSON.stringify(editing),
    });
    if (res.ok) {
      setEditing(null);
      await load();
      notify('Testimonial saved.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Testimonials Management</h1>
          <p className="text-xs text-neutral-400 mt-1">Manage client quotes and verified outcome metrics.</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing({ authorName: '', role: '', organization: '', quote: '', outcomeMetric: '', featured: true, order: items.length + 1 })}
          className="px-4 py-2 text-xs font-semibold bg-red-600 text-white inline-flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> Add Testimonial
        </button>
      </div>

      <div className="bg-[#111115] border border-white/10 divide-y divide-white/5">
        {items.map((t) => (
          <div key={t._id} className="p-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white">{t.authorName} · {t.organization}</div>
              <div className="text-xs text-neutral-400 truncate">{t.outcomeMetric} — “{t.quote}”</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button type="button" onClick={() => setEditing(t)} className="p-2 text-neutral-300 hover:text-white"><Edit2 className="w-4 h-4" /></button>
              <button type="button" onClick={() => setDeleteId(t._id)} className="p-2 text-neutral-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/85 p-4 flex items-center justify-center">
          <form onSubmit={save} className="max-w-xl w-full bg-[#111115] border border-white/15 p-6 space-y-4">
            <h2 className="text-base font-semibold text-white">{editing._id ? 'Edit Testimonial' : 'New Testimonial'}</h2>
            <div className="grid grid-cols-2 gap-3">
              <input required placeholder="Author Name" value={editing.authorName || ''} onChange={(e) => setEditing({ ...editing, authorName: e.target.value })} className="px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
              <input required placeholder="Role" value={editing.role || ''} onChange={(e) => setEditing({ ...editing, role: e.target.value })} className="px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input required placeholder="Organization" value={editing.organization || ''} onChange={(e) => setEditing({ ...editing, organization: e.target.value })} className="px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
              <input placeholder="Outcome Metric (e.g. +140% Viewership)" value={editing.outcomeMetric || ''} onChange={(e) => setEditing({ ...editing, outcomeMetric: e.target.value })} className="px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
            </div>
            <textarea required rows={3} placeholder="Quote" value={editing.quote || ''} onChange={(e) => setEditing({ ...editing, quote: e.target.value })} className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 text-xs border border-white/15 text-neutral-300">Cancel</button>
              <button type="submit" className="px-4 py-2 text-xs font-semibold bg-red-600 text-white">Save</button>
            </div>
          </form>
        </div>
      )}

      <ConfirmModal
        open={!!deleteId}
        title="Delete Testimonial"
        description="Remove this testimonial from the website?"
        onConfirm={async () => {
          if (deleteId) {
            await apiFetch(`/api/admin/testimonials/${deleteId}`, { method: 'DELETE' });
            setDeleteId(null);
            await load();
            notify('Testimonial deleted.');
          }
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};

export const AdminPartners: React.FC<{ notify: NotifyFn }> = ({ notify }) => {
  const { apiFetch } = useSite();
  const [items, setItems] = useState<Partner[]>([]);
  const [editing, setEditing] = useState<Partial<Partner> | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    const res = await apiFetch('/api/admin/partners');
    if (res.ok) setItems(await res.json());
  };
  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const isNew = !editing._id;
    const res = await apiFetch(isNew ? '/api/admin/partners' : `/api/admin/partners/${editing._id}`, {
      method: isNew ? 'POST' : 'PUT',
      body: JSON.stringify(editing),
    });
    if (res.ok) {
      setEditing(null);
      await load();
      notify('Partner saved.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Partners &amp; Sponsors</h1>
          <p className="text-xs text-neutral-400 mt-1">Upload partner logos and configure sponsor tiers.</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing({ name: '', logoUrl: '', websiteUrl: '', tier: 'Global Partner', featured: true, order: items.length + 1 })}
          className="px-4 py-2 text-xs font-semibold bg-red-600 text-white inline-flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> Add Partner
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((p) => (
          <div key={p._id} className="p-4 bg-[#111115] border border-white/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {p.logoUrl && <img src={p.logoUrl} alt={p.name} className="h-8 w-16 object-contain bg-black/40 p-1" />}
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white truncate">{p.name}</div>
                <div className="text-xs text-neutral-400">{p.tier}</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setEditing(p)} className="p-1.5 text-neutral-300 hover:text-white"><Edit2 className="w-3.5 h-3.5" /></button>
              <button type="button" onClick={() => setDeleteId(p._id)} className="p-1.5 text-neutral-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/85 p-4 flex items-center justify-center">
          <form onSubmit={save} className="max-w-lg w-full bg-[#111115] border border-white/15 p-6 space-y-4">
            <h2 className="text-base font-semibold text-white">{editing._id ? 'Edit Partner' : 'New Partner'}</h2>
            <input required placeholder="Partner Name" value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Tier (e.g. Hardware Partner)" value={editing.tier || ''} onChange={(e) => setEditing({ ...editing, tier: e.target.value })} className="px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
              <input placeholder="Website URL" value={editing.websiteUrl || ''} onChange={(e) => setEditing({ ...editing, websiteUrl: e.target.value })} className="px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
            </div>
            <ImagePickerField label="Partner Logo" value={editing.logoUrl || ''} onChange={(url) => setEditing({ ...editing, logoUrl: url })} folder="logos" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 text-xs border border-white/15 text-neutral-300">Cancel</button>
              <button type="submit" className="px-4 py-2 text-xs font-semibold bg-red-600 text-white">Save</button>
            </div>
          </form>
        </div>
      )}

      <ConfirmModal
        open={!!deleteId}
        title="Remove Partner"
        description="Delete this partner or sponsor entry?"
        onConfirm={async () => {
          if (deleteId) {
            await apiFetch(`/api/admin/partners/${deleteId}`, { method: 'DELETE' });
            setDeleteId(null);
            await load();
            notify('Partner removed.');
          }
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};

export const AdminNavigation: React.FC<{ notify: NotifyFn }> = ({ notify }) => {
  const { apiFetch, refreshBootstrap } = useSite();
  const [items, setItems] = useState<NavigationItem[]>([]);
  const [editing, setEditing] = useState<Partial<NavigationItem> | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    const res = await apiFetch('/api/admin/navigation');
    if (res.ok) setItems(await res.json());
  };
  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const isNew = !editing._id;
    const res = await apiFetch(isNew ? '/api/admin/navigation' : `/api/admin/navigation/${editing._id}`, {
      method: isNew ? 'POST' : 'PUT',
      body: JSON.stringify(editing),
    });
    if (res.ok) {
      setEditing(null);
      await load();
      await refreshBootstrap();
      notify('Navigation link saved.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Navigation &amp; Footer Links</h1>
          <p className="text-xs text-neutral-400 mt-1">Manage top navbar links (max 5 visible recommended) and footer columns.</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing({ label: '', path: '/', order: items.length + 1, visible: true, isExternal: false, location: 'header' })}
          className="px-4 py-2 text-xs font-semibold bg-red-600 text-white inline-flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> Add Link
        </button>
      </div>

      <div className="bg-[#111115] border border-white/10 divide-y divide-white/5">
        {items.map((nav) => (
          <div key={nav._id} className="p-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-white">{nav.label}</div>
              <div className="text-xs text-neutral-400">{nav.location} · {nav.path} · Order #{nav.order} · {nav.visible ? 'Visible' : 'Hidden'}</div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setEditing(nav)} className="p-2 text-neutral-300 hover:text-white"><Edit2 className="w-4 h-4" /></button>
              <button type="button" onClick={() => setDeleteId(nav._id)} className="p-2 text-neutral-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/85 p-4 flex items-center justify-center">
          <form onSubmit={save} className="max-w-md w-full bg-[#111115] border border-white/15 p-6 space-y-4">
            <h2 className="text-base font-semibold text-white">{editing._id ? 'Edit Navigation Item' : 'New Navigation Item'}</h2>
            <input required placeholder="Label (e.g. Services)" value={editing.label || ''} onChange={(e) => setEditing({ ...editing, label: e.target.value })} className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
            <input required placeholder="Path or URL (e.g. /services)" value={editing.path || ''} onChange={(e) => setEditing({ ...editing, path: e.target.value })} className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
            <div className="grid grid-cols-2 gap-3">
              <select value={editing.location || 'header'} onChange={(e) => setEditing({ ...editing, location: e.target.value as any })} className="px-3 py-2 text-xs bg-black/50 border border-white/10 text-white">
                <option value="header" className="bg-neutral-900">Header Nav</option>
                <option value="footer_company" className="bg-neutral-900">Footer Company</option>
                <option value="footer_services" className="bg-neutral-900">Footer Services</option>
              </select>
              <input type="number" placeholder="Order" value={editing.order ?? 1} onChange={(e) => setEditing({ ...editing, order: Number(e.target.value) })} className="px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
            </div>
            <label className="flex items-center gap-2 text-xs text-neutral-300">
              <input type="checkbox" checked={editing.visible !== false} onChange={(e) => setEditing({ ...editing, visible: e.target.checked })} />
              <span>Visible in navigation</span>
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 text-xs border border-white/15 text-neutral-300">Cancel</button>
              <button type="submit" className="px-4 py-2 text-xs font-semibold bg-red-600 text-white">Save</button>
            </div>
          </form>
        </div>
      )}

      <ConfirmModal
        open={!!deleteId}
        title="Delete Navigation Link"
        description="Remove this item from site navigation?"
        onConfirm={async () => {
          if (deleteId) {
            await apiFetch(`/api/admin/navigation/${deleteId}`, { method: 'DELETE' });
            setDeleteId(null);
            await load();
            await refreshBootstrap();
            notify('Navigation item removed.');
          }
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};

export const AdminSeo: React.FC<{ notify: NotifyFn }> = ({ notify }) => {
  const { apiFetch, refreshBootstrap } = useSite();
  const [items, setItems] = useState<SeoMetadata[]>([]);
  const [selected, setSelected] = useState<SeoMetadata | null>(null);

  const load = async () => {
    const res = await apiFetch('/api/admin/seo');
    if (res.ok) {
      const data: SeoMetadata[] = await res.json();
      setItems(data);
      if (data.length > 0 && !selected) setSelected(data[0]);
    }
  };
  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    const res = await apiFetch(`/api/admin/seo/${selected._id}`, {
      method: 'PUT',
      body: JSON.stringify(selected),
    });
    if (res.ok) {
      await load();
      await refreshBootstrap();
      notify(`SEO metadata updated for /${selected.pageSlug}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">SEO &amp; OpenGraph Metadata</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Configure per-page meta titles, descriptions, and social OG images. Dynamic sitemap at <a href="/sitemap.xml" target="_blank" rel="noreferrer" className="text-red-400 underline">/sitemap.xml</a>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 bg-[#111115] border border-white/10 divide-y divide-white/5">
          {items.map((s) => (
            <button
              key={s._id}
              type="button"
              onClick={() => setSelected(s)}
              className={`w-full text-left p-4 text-xs ${selected?._id === s._id ? 'bg-white/10 text-white font-semibold' : 'text-neutral-300 hover:bg-white/5'}`}
            >
              /{s.pageSlug === 'home' ? '' : s.pageSlug} — {s.metaTitle}
            </button>
          ))}
        </div>

        {selected && (
          <form onSubmit={save} className="lg:col-span-8 bg-[#111115] border border-white/10 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-sm font-semibold text-white">Page: /{selected.pageSlug}</span>
              <button type="submit" className="px-4 py-2 text-xs font-semibold bg-red-600 text-white inline-flex items-center gap-1.5">
                <Save className="w-3.5 h-3.5" /> Save SEO
              </button>
            </div>
            <div>
              <label className="block text-xs text-neutral-300 mb-1">Meta Title (30–60 chars recommended)</label>
              <input type="text" value={selected.metaTitle} onChange={(e) => setSelected({ ...selected, metaTitle: e.target.value })} className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
            </div>
            <div>
              <label className="block text-xs text-neutral-300 mb-1">Meta Description (120–160 chars recommended)</label>
              <textarea rows={3} value={selected.metaDescription} onChange={(e) => setSelected({ ...selected, metaDescription: e.target.value })} className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white" />
            </div>
            <ImagePickerField label="OpenGraph Share Image" value={selected.ogImage || ''} onChange={(url) => setSelected({ ...selected, ogImage: url })} folder="general" />
          </form>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 6. CLIENT REVIEWS MODERATION
// ==========================================
export const AdminReviews: React.FC<{ notify: NotifyFn }> = ({ notify }) => {
  const { apiFetch } = useSite();
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    const res = await apiFetch('/api/admin/reviews');
    if (res.ok) setItems(await res.json());
  };
  useEffect(() => { load(); }, []);

  const toggleStatus = async (rev: ReviewItem) => {
    const nextStatus = rev.status === 'published' ? 'hidden' : 'published';
    const res = await apiFetch(`/api/admin/reviews/${rev._id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: nextStatus }),
    });
    if (res.ok) {
      await load();
      notify(`Review ${nextStatus}.`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Client Reviews Moderation</h1>
        <p className="text-xs text-neutral-400 mt-1">
          Approve, hide, or remove public client reviews. Configure submission limits under Contact &amp; Footer Info.
        </p>
      </div>

      <div className="bg-[#111115] border border-white/10 divide-y divide-white/5">
        {items.length === 0 ? (
          <div className="p-6 text-xs text-neutral-400">No client reviews submitted yet.</div>
        ) : (
          items.map((rev) => (
            <div key={rev._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-white">
                  <span>{rev.authorName}</span>
                  <span className="text-xs font-normal text-neutral-400">
                    {[rev.role, rev.organization].filter(Boolean).join(' · ')}
                  </span>
                  <span className="text-xs text-amber-400 font-mono-num">{rev.rating}/5 ★</span>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-semibold border ${
                      rev.status === 'published'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-neutral-800 text-neutral-400 border-white/10'
                    }`}
                  >
                    {rev.status}
                  </span>
                </div>
                <p className="text-xs text-neutral-300">“{rev.comment}”</p>
                {rev.serviceUsed && (
                  <div className="text-[11px] text-neutral-500">Service: {rev.serviceUsed}</div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleStatus(rev)}
                  className="px-3 py-1.5 text-xs border border-white/15 text-neutral-200 hover:text-white hover:bg-white/5"
                >
                  {rev.status === 'published' ? 'Hide' : 'Publish'}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteId(rev._id)}
                  className="p-2 text-neutral-400 hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmModal
        open={!!deleteId}
        title="Delete Review"
        description="Permanently remove this client review?"
        onConfirm={async () => {
          if (deleteId) {
            await apiFetch(`/api/admin/reviews/${deleteId}`, { method: 'DELETE' });
            setDeleteId(null);
            await load();
            notify('Review deleted.');
          }
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};


import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FolderKanban,
  Layers,
  Palette,
  RefreshCw,
  RotateCcw,
  Save,
  Trash2,
  Wrench,
} from 'lucide-react';
import { useSite } from '../../context/SiteContext';
import { SiteSettings, ThemeConfig } from '../../types/cms';

interface WorkspaceCounts {
  services: number;
  portfolio: number;
  events: number;
  staff: number;
  departments: number;
  jobs: number;
  applications: number;
  blog: number;
  blogCategories: number;
  testimonials: number;
  partners: number;
  messages: number;
  media: number;
  sections: number;
  reviews?: number;
  stickyNotes?: number;
}

export const AdminWorkspaceSetup: React.FC<{
  onNavigate: (tab: string) => void;
  notify: (msg: string, type?: 'success' | 'error') => void;
}> = ({ onNavigate, notify }) => {
  const { apiFetch, refreshBootstrap } = useSite();
  const [counts, setCounts] = useState<WorkspaceCounts | null>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [themes, setThemes] = useState<ThemeConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [confirmScope, setConfirmScope] = useState<string | null>(null);
  const [clearingScope, setClearingScope] = useState<string | null>(null);
  const [wipePhrase, setWipePhrase] = useState('');
  const [includeSections, setIncludeSections] = useState(false);
  const [wipingAll, setWipingAll] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const loadWorkspace = async () => {
    setLoading(true);
    try {
      const [cRes, sRes, tRes] = await Promise.all([
        apiFetch('/api/admin/workspace-counts'),
        apiFetch('/api/admin/site-settings'),
        apiFetch('/api/admin/themes'),
      ]);
      const [cData, sData, tData] = await Promise.all([cRes.json(), sRes.json(), tRes.json()]);
      setCounts(cData);
      setSettings(sData);
      setThemes(Array.isArray(tData) ? tData : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, []);

  const saveQuickSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      const res = await apiFetch('/api/admin/site-settings', {
        method: 'PUT',
        body: JSON.stringify({
          organizationName: settings.organizationName,
          tagline: settings.tagline,
          description: settings.description,
          contactEmail: settings.contactEmail,
          contactPhone: settings.contactPhone,
          headquarters: settings.headquarters,
          activeThemeId: settings.activeThemeId,
          setupCompleted: true,
        }),
      });
      if (res.ok) {
        await refreshBootstrap();
        notify('Workspace profile and theme updated.');
      } else {
        notify('Failed to save workspace setup.', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const clearScope = async (scope: string, label: string) => {
    setClearingScope(scope);
    try {
      const res = await apiFetch('/api/admin/workspace/clear', {
        method: 'POST',
        body: JSON.stringify({ scope }),
      });
      const data = await res.json();
      if (res.ok) {
        setConfirmScope(null);
        await loadWorkspace();
        await refreshBootstrap();
        notify(`Cleared ${label} (${data.removed} items removed).`);
      } else {
        notify(data.error || `Failed to clear ${label}`, 'error');
      }
    } finally {
      setClearingScope(null);
    }
  };

  const handleRemoveAll = async () => {
    if (wipePhrase.trim().toUpperCase() !== 'REMOVE ALL') {
      notify('Type REMOVE ALL to confirm deleting all content items.', 'error');
      return;
    }
    setWipingAll(true);
    try {
      const res = await apiFetch('/api/admin/workspace/clear', {
        method: 'POST',
        body: JSON.stringify({ scope: 'all', includeSections }),
      });
      const data = await res.json();
      if (res.ok) {
        setWipePhrase('');
        await loadWorkspace();
        await refreshBootstrap();
        notify(`All content removed (${data.removed} items cleared). Ready to add your own.`);
      } else {
        notify(data.error || 'Failed to remove all content.', 'error');
      }
    } finally {
      setWipingAll(false);
    }
  };

  const handleRestoreStarter = async () => {
    setRestoring(true);
    try {
      const res = await apiFetch('/api/admin/workspace/restore-starter', { method: 'POST' });
      if (res.ok) {
        await loadWorkspace();
        await refreshBootstrap();
        notify('Starter sample content restored for any empty modules.');
      } else {
        notify('Failed to restore starter content.', 'error');
      }
    } finally {
      setRestoring(false);
    }
  };

  const modulesList = [
    {
      scope: 'services',
      tab: 'services',
      label: 'Services',
      count: counts?.services ?? 0,
      desc: 'Tournament ops, broadcast production, consulting offerings.',
    },
    {
      scope: 'portfolio',
      tab: 'portfolio',
      label: 'Portfolio & Projects',
      count: counts?.portfolio ?? 0,
      desc: 'Completed event showcases, clients, and case studies.',
    },
    {
      scope: 'events',
      tab: 'events',
      label: 'Events & Tournaments',
      count: counts?.events ?? 0,
      desc: 'Upcoming, ongoing, and completed tournament calendars.',
    },
    {
      scope: 'staff',
      tab: 'staff',
      label: 'Staff & Departments',
      count: (counts?.staff ?? 0) + (counts?.departments ?? 0),
      desc: 'Leadership, production crew, and department categories.',
    },
    {
      scope: 'careers',
      tab: 'careers',
      label: 'Jobs & Applications',
      count: (counts?.jobs ?? 0) + (counts?.applications ?? 0),
      desc: 'Open positions and submitted candidate resumes.',
    },
    {
      scope: 'blog',
      tab: 'blog',
      label: 'Blog & Categories',
      count: (counts?.blog ?? 0) + (counts?.blogCategories ?? 0),
      desc: 'News articles, editorial posts, and blog taxonomy.',
    },
    {
      scope: 'partners',
      tab: 'partners',
      label: 'Partners & Sponsors',
      count: counts?.partners ?? 0,
      desc: 'Partner logos, sponsorships, and collaboration links.',
    },
    {
      scope: 'testimonials',
      tab: 'testimonials',
      label: 'Testimonials',
      count: counts?.testimonials ?? 0,
      desc: 'Client quotes and partner feedback entries.',
    },
    {
      scope: 'messages',
      tab: 'messages',
      label: 'Contact Messages',
      count: counts?.messages ?? 0,
      desc: 'Inbound contact inquiries from public forms.',
    },
    {
      scope: 'media',
      tab: 'media',
      label: 'Media Uploads (keeps logo.png)',
      count: counts?.media ?? 0,
      desc: 'Uploaded imagery and documents excluding your primary logo.',
    },
    {
      scope: 'sections',
      tab: 'page-builder',
      label: 'Page Builder Sections',
      count: counts?.sections ?? 0,
      desc: 'Hero, intro, stats, and custom sections on Home & About.',
    },
    {
      scope: 'reviews',
      tab: 'reviews',
      label: 'Client Reviews',
      count: counts?.reviews ?? 0,
      desc: 'Public customer feedback and ratings on /reviews.',
    },
    {
      scope: 'sticky_notes',
      tab: 'sticky-notes',
      label: 'Sticky Notes & Layers',
      count: counts?.stickyNotes ?? 0,
      desc: 'Movable floating annotations across site pages.',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Wrench className="w-5 h-5 text-red-500" />
            <span>Workspace Setup &amp; Content Reset</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Configure your organization identity, jump straight into adding your own content, or remove demo data cleanly.
          </p>
        </div>

        <button
          type="button"
          onClick={loadWorkspace}
          disabled={loading}
          className="px-3.5 py-2 border border-white/10 bg-[#111115] hover:bg-white/5 text-xs text-neutral-200 flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Counts</span>
        </button>
      </div>

      {/* 1. Organization Setup Form */}
      {settings && (
        <form onSubmit={saveQuickSetup} className="bg-[#111115] border border-white/10 p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Palette className="w-4 h-4 text-red-500" />
              <span>1. Organization Setup &amp; Active Theme</span>
            </div>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Logo: /logo.png
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-neutral-300 mb-1.5">Organization Name</label>
              <input
                type="text"
                required
                value={settings.organizationName}
                onChange={(e) => setSettings({ ...settings, organizationName: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-black/50 border border-white/10 text-white"
              />
            </div>

            <div>
              <label className="block text-xs text-neutral-300 mb-1.5">Active Visual Theme</label>
              <select
                value={settings.activeThemeId}
                onChange={(e) => setSettings({ ...settings, activeThemeId: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-black/50 border border-white/10 text-white"
              >
                {themes.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-neutral-300 mb-1.5">Tagline</label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-black/50 border border-white/10 text-white"
              />
            </div>

            <div>
              <label className="block text-xs text-neutral-300 mb-1.5">Contact Email</label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-black/50 border border-white/10 text-white"
              />
            </div>

            <div>
              <label className="block text-xs text-neutral-300 mb-1.5">Phone</label>
              <input
                type="text"
                value={settings.contactPhone}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-black/50 border border-white/10 text-white"
              />
            </div>

            <div>
              <label className="block text-xs text-neutral-300 mb-1.5">Headquarters / Location</label>
              <input
                type="text"
                value={settings.headquarters}
                onChange={(e) => setSettings({ ...settings, headquarters: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-black/50 border border-white/10 text-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs text-neutral-300 mb-1.5">Organization Description</label>
              <textarea
                rows={2}
                value={settings.description}
                onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-black/50 border border-white/10 text-white"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-xs font-semibold text-white inline-flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving Setup...' : 'Save Organization Setup'}</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('themes')}
              className="px-4 py-2.5 border border-white/15 bg-white/5 hover:bg-white/10 text-xs text-neutral-200"
            >
              Customize Colors, Fonts &amp; Logos
            </button>
          </div>
        </form>
      )}

      {/* 2. Add Your Own Content & Selective Clear */}
      <div className="bg-[#111115] border border-white/10">
        <div className="px-6 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <FolderKanban className="w-4 h-4 text-red-500" />
            <span>2. Add Your Own Items or Clear Individual Modules</span>
          </div>
          <span className="text-xs text-neutral-400">Open any module to create items or clear existing entries</span>
        </div>

        <div className="divide-y divide-white/5">
          {modulesList.map((mod) => (
            <div
              key={mod.scope}
              className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-white">{mod.label}</span>
                  <span className="px-2 py-0.5 text-[11px] font-mono bg-white/5 border border-white/10 text-neutral-300 tabular-nums">
                    {loading ? '—' : `${mod.count} items`}
                  </span>
                </div>
                <p className="text-xs text-neutral-400">{mod.desc}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onNavigate(mod.tab)}
                  className="px-3.5 py-2 text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-white inline-flex items-center gap-1.5"
                >
                  <span>Add / Manage</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                {mod.count > 0 && confirmScope !== mod.scope && (
                  <button
                    type="button"
                    onClick={() => setConfirmScope(mod.scope)}
                    className="px-3 py-2 text-xs font-medium border border-red-500/30 text-red-300 hover:bg-red-500/10 inline-flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                )}

                {confirmScope === mod.scope && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={clearingScope === mod.scope}
                      onClick={() => clearScope(mod.scope, mod.label)}
                      className="px-3 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                    >
                      {clearingScope === mod.scope ? 'Clearing...' : 'Confirm Clear'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmScope(null)}
                      className="px-3 py-2 text-xs border border-white/15 text-neutral-300 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Remove All Content (Blank Slate) / Restore Starter */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#160B0D] border border-red-500/30 p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-red-300">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span>3. Remove All Things (Blank Slate)</span>
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed">
            Clears all services, portfolio projects, events, staff, departments, jobs, applications, blog posts,
            testimonials, partners, contact messages, and uploaded non-logo media. Your admin login, themes, navigation,
            and <code className="px-1 bg-black/40 text-white">/logo.png</code> remain intact so you can build from scratch.
          </p>

          <label className="flex items-center gap-2.5 text-xs text-neutral-300 cursor-pointer">
            <input
              type="checkbox"
              checked={includeSections}
              onChange={(e) => setIncludeSections(e.target.checked)}
              className="accent-red-600"
            />
            <span>Also remove all Page Builder sections (Home &amp; About section blocks)</span>
          </label>

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <input
              type="text"
              placeholder='Type "REMOVE ALL" to confirm'
              value={wipePhrase}
              onChange={(e) => setWipePhrase(e.target.value)}
              className="flex-1 px-3.5 py-2.5 text-xs bg-black/60 border border-red-500/30 text-white placeholder:text-neutral-500"
            />
            <button
              type="button"
              disabled={wipingAll || wipePhrase.trim().toUpperCase() !== 'REMOVE ALL'}
              onClick={handleRemoveAll}
              className="px-4 py-2.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white inline-flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{wipingAll ? 'Removing...' : 'Remove All Content'}</span>
            </button>
          </div>
        </div>

        <div className="bg-[#111115] border border-white/10 p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Layers className="w-4 h-4 text-neutral-300" />
              <span>Starter Template Recovery</span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Need reference examples back? Restoring starter content populates only currently empty modules without
              overwriting your custom admin login, organization branding, or any content you have already added.
            </p>
          </div>

          <div>
            <button
              type="button"
              disabled={restoring}
              onClick={handleRestoreStarter}
              className="px-4 py-2.5 text-xs font-semibold border border-white/15 bg-white/5 hover:bg-white/10 text-white inline-flex items-center gap-2 disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{restoring ? 'Restoring...' : 'Restore Starter Content for Empty Modules'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

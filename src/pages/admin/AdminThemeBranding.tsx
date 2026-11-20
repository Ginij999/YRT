import React, { useEffect, useState } from 'react';
import { Check, Palette, Save } from 'lucide-react';
import { useSite } from '../../context/SiteContext';
import { SiteSettings, ThemeConfig } from '../../types/cms';
import { ImagePickerField } from './AdminShared';

const FONT_CHOICES = [
  'Barlow Condensed',
  'Outfit',
  'Plus Jakarta Sans',
  'Playfair Display',
  'DM Sans',
];

export const AdminThemeStudio: React.FC<{ notify: (msg: string, type?: 'success' | 'error') => void }> = ({
  notify,
}) => {
  const { apiFetch, refreshBootstrap } = useSite();
  const [themes, setThemes] = useState<ThemeConfig[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [editingTheme, setEditingTheme] = useState<ThemeConfig | null>(null);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    const [tRes, sRes] = await Promise.all([
      apiFetch('/api/admin/themes'),
      apiFetch('/api/admin/site-settings'),
    ]);
    const tList: ThemeConfig[] = await tRes.json();
    const sObj: SiteSettings = await sRes.json();
    setThemes(tList);
    setSettings(sObj);
    const active = tList.find((t) => t._id === sObj.activeThemeId) || tList[0] || null;
    setEditingTheme(active);
  };

  useEffect(() => {
    loadData();
  }, []);

  const activateTheme = async (theme: ThemeConfig) => {
    const res = await apiFetch(`/api/admin/themes/${theme._id}/activate`, { method: 'POST' });
    if (res.ok) {
      setEditingTheme(theme);
      await loadData();
      await refreshBootstrap();
      notify(`Activated theme: ${theme.name}`);
    } else {
      notify('Failed to switch theme', 'error');
    }
  };

  const saveThemeCustomizations = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTheme) return;
    setSaving(true);
    try {
      const res = await apiFetch(`/api/admin/themes/${editingTheme._id}`, {
        method: 'PUT',
        body: JSON.stringify(editingTheme),
      });
      if (res.ok) {
        await loadData();
        await refreshBootstrap();
        notify('Theme colors, typography, and button styles saved.');
      } else {
        notify('Error saving theme settings', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const saveBrandingLogos = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await apiFetch('/api/admin/site-settings', {
        method: 'PUT',
        body: JSON.stringify({
          organizationName: settings.organizationName,
          tagline: settings.tagline,
          logoLightUrl: settings.logoLightUrl,
          logoDarkUrl: settings.logoDarkUrl,
          faviconUrl: settings.faviconUrl,
        }),
      });
      if (res.ok) {
        await refreshBootstrap();
        notify('Brand name, logos, and favicon updated across site.');
      }
    } finally {
      setSaving(false);
    }
  };

  const bgConfig = settings?.homepageBackground || {
    mode: 'stars' as const,
    primaryColor: '#08080A',
    secondaryColor: '#18090D',
    imageUrl: '',
    starsEnabled: true,
    starColor: '#FFFFFF',
    starDensity: 110,
    overlayOpacity: 0.72,
  };

  const updateBg = (patch: Partial<NonNullable<SiteSettings['homepageBackground']>>) => {
    if (!settings) return;
    setSettings({
      ...settings,
      homepageBackground: { ...bgConfig, ...patch },
    });
  };

  const saveHomepageBackground = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await apiFetch('/api/admin/site-settings', {
        method: 'PUT',
        body: JSON.stringify({ homepageBackground: bgConfig }),
      });
      if (res.ok) {
        await refreshBootstrap();
        notify('Homepage background & moving starfield settings updated.');
      } else {
        notify('Failed to update homepage background', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Theme &amp; Brand Identity Studio</h1>
        <p className="text-xs text-neutral-400 mt-1">
          Switch between Competitive Esports and Luxury Gold themes, upload your organization logos, edit the homepage background, and customize typography.
        </p>
      </div>

      {/* Theme Switcher Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {themes.map((theme) => {
          const isActive = settings?.activeThemeId === theme._id;
          return (
            <div
              key={theme._id}
              className={`p-6 border space-y-4 transition-colors ${
                isActive ? 'bg-[#18181D] border-white/40' : 'bg-[#111115] border-white/10'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white">{theme.name}</h2>
                    {isActive && (
                      <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        Active Live
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">{theme.description}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="w-5 h-5 border border-white/20" style={{ backgroundColor: theme.bgColor }} title="Background" />
                  <span className="w-5 h-5 border border-white/20" style={{ backgroundColor: theme.primaryColor }} title="Primary Accent" />
                  <span className="w-5 h-5 border border-white/20" style={{ backgroundColor: theme.secondaryColor }} title="Secondary Accent" />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                {!isActive && (
                  <button
                    type="button"
                    onClick={() => activateTheme(theme)}
                    className="px-4 py-2 text-xs font-semibold bg-white text-black hover:bg-neutral-200 inline-flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Activate Theme</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setEditingTheme(theme)}
                  className="px-4 py-2 text-xs font-medium border border-white/15 text-white hover:bg-white/5 inline-flex items-center gap-1.5"
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>Customize Palette &amp; Type</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Homepage Background & Cursor-Tracking Starfield Studio */}
      {settings && (
        <div className="p-6 bg-[#111115] border border-white/10 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-white">Homepage Background &amp; Moving Stars</h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Customize the backdrop style, colors, wallpaper image, and interactive cursor-following star density.
              </p>
            </div>
            <button
              type="button"
              onClick={saveHomepageBackground}
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white inline-flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Background</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-neutral-300 mb-1.5">Background Mode</label>
              <select
                value={bgConfig.mode}
                onChange={(e) =>
                  updateBg({ mode: e.target.value as 'stars' | 'solid' | 'gradient' | 'image' })
                }
                className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white"
              >
                <option value="stars" className="bg-neutral-900">Obsidian + Moving Stars</option>
                <option value="gradient" className="bg-neutral-900">Radial Gradient</option>
                <option value="solid" className="bg-neutral-900">Solid Color</option>
                <option value="image" className="bg-neutral-900">Custom Wallpaper Image</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-neutral-300 mb-1.5">Primary Background Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bgConfig.primaryColor}
                  onChange={(e) => updateBg({ primaryColor: e.target.value })}
                  className="h-9 w-12 bg-transparent border border-white/15 cursor-pointer"
                />
                <input
                  type="text"
                  value={bgConfig.primaryColor}
                  onChange={(e) => updateBg({ primaryColor: e.target.value })}
                  className="w-full px-2.5 py-2 text-xs font-mono bg-black/50 border border-white/10 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-neutral-300 mb-1.5">Gradient Secondary Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bgConfig.secondaryColor}
                  onChange={(e) => updateBg({ secondaryColor: e.target.value })}
                  className="h-9 w-12 bg-transparent border border-white/15 cursor-pointer"
                />
                <input
                  type="text"
                  value={bgConfig.secondaryColor}
                  onChange={(e) => updateBg({ secondaryColor: e.target.value })}
                  className="w-full px-2.5 py-2 text-xs font-mono bg-black/50 border border-white/10 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-neutral-300 mb-1.5">Star Particle Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bgConfig.starColor}
                  onChange={(e) => updateBg({ starColor: e.target.value })}
                  className="h-9 w-12 bg-transparent border border-white/15 cursor-pointer"
                />
                <input
                  type="text"
                  value={bgConfig.starColor}
                  onChange={(e) => updateBg({ starColor: e.target.value })}
                  className="w-full px-2.5 py-2 text-xs font-mono bg-black/50 border border-white/10 text-white"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <label className="flex items-center gap-2.5 text-xs text-neutral-200 cursor-pointer">
              <input
                type="checkbox"
                checked={bgConfig.starsEnabled !== false}
                onChange={(e) => updateBg({ starsEnabled: e.target.checked })}
                className="accent-red-600"
              />
              <span>Enable Cursor-Tracking Moving Stars</span>
            </label>

            <div>
              <label className="block text-xs text-neutral-300 mb-1">
                Star Density ({bgConfig.starDensity} stars)
              </label>
              <input
                type="range"
                min={30}
                max={220}
                value={bgConfig.starDensity}
                onChange={(e) => updateBg({ starDensity: Number(e.target.value) })}
                className="w-full accent-red-600"
              />
            </div>

            <div>
              <label className="block text-xs text-neutral-300 mb-1">
                Backdrop Tint Opacity ({Math.round((bgConfig.overlayOpacity ?? 0.72) * 100)}%)
              </label>
              <input
                type="range"
                min={0.1}
                max={0.95}
                step={0.05}
                value={bgConfig.overlayOpacity ?? 0.72}
                onChange={(e) => updateBg({ overlayOpacity: Number(e.target.value) })}
                className="w-full accent-red-600"
              />
            </div>
          </div>

          {bgConfig.mode === 'image' && (
            <ImagePickerField
              label="Homepage Wallpaper Image"
              value={bgConfig.imageUrl || ''}
              onChange={(url) => updateBg({ imageUrl: url })}
              folder="general"
            />
          )}
        </div>
      )}

      {/* Logos & Organization Identity */}
      {settings && (
        <div className="p-6 bg-[#111115] border border-white/10 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Organization Logos &amp; Favicon</h2>
            <button
              type="button"
              onClick={saveBrandingLogos}
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white inline-flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Brand Assets</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">Organization Name</label>
              <input
                type="text"
                value={settings.organizationName}
                onChange={(e) => setSettings({ ...settings, organizationName: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-black/50 border border-white/10 text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">Tagline</label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-black/50 border border-white/10 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ImagePickerField
              label="Dark-Mode Logo (Navbar / Footer)"
              value={settings.logoDarkUrl}
              onChange={(url) => setSettings({ ...settings, logoDarkUrl: url })}
              folder="logos"
            />
            <ImagePickerField
              label="Light-Mode Logo"
              value={settings.logoLightUrl}
              onChange={(url) => setSettings({ ...settings, logoLightUrl: url })}
              folder="logos"
            />
            <ImagePickerField
              label="Website Favicon"
              value={settings.faviconUrl}
              onChange={(url) => setSettings({ ...settings, faviconUrl: url })}
              folder="logos"
            />
          </div>
        </div>
      )}

      {/* Theme Color, Typography & Button Editor */}
      {editingTheme && (
        <form onSubmit={saveThemeCustomizations} className="p-6 bg-[#111115] border border-white/10 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Customize: {editingTheme.name}</h2>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white inline-flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Theme Customization</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-neutral-300 mb-1.5">Primary Accent Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={editingTheme.primaryColor}
                  onChange={(e) => setEditingTheme({ ...editingTheme, primaryColor: e.target.value })}
                  className="h-9 w-12 bg-transparent border border-white/15 cursor-pointer"
                />
                <input
                  type="text"
                  value={editingTheme.primaryColor}
                  onChange={(e) => setEditingTheme({ ...editingTheme, primaryColor: e.target.value })}
                  className="w-full px-2.5 py-2 text-xs font-mono bg-black/50 border border-white/10 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-neutral-300 mb-1.5">Primary Hover Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={editingTheme.primaryHoverColor}
                  onChange={(e) => setEditingTheme({ ...editingTheme, primaryHoverColor: e.target.value })}
                  className="h-9 w-12 bg-transparent border border-white/15 cursor-pointer"
                />
                <input
                  type="text"
                  value={editingTheme.primaryHoverColor}
                  onChange={(e) => setEditingTheme({ ...editingTheme, primaryHoverColor: e.target.value })}
                  className="w-full px-2.5 py-2 text-xs font-mono bg-black/50 border border-white/10 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-neutral-300 mb-1.5">Secondary Highlight</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={editingTheme.secondaryColor}
                  onChange={(e) => setEditingTheme({ ...editingTheme, secondaryColor: e.target.value })}
                  className="h-9 w-12 bg-transparent border border-white/15 cursor-pointer"
                />
                <input
                  type="text"
                  value={editingTheme.secondaryColor}
                  onChange={(e) => setEditingTheme({ ...editingTheme, secondaryColor: e.target.value })}
                  className="w-full px-2.5 py-2 text-xs font-mono bg-black/50 border border-white/10 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-neutral-300 mb-1.5">Canvas Background</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={editingTheme.bgColor}
                  onChange={(e) => setEditingTheme({ ...editingTheme, bgColor: e.target.value })}
                  className="h-9 w-12 bg-transparent border border-white/15 cursor-pointer"
                />
                <input
                  type="text"
                  value={editingTheme.bgColor}
                  onChange={(e) => setEditingTheme({ ...editingTheme, bgColor: e.target.value })}
                  className="w-full px-2.5 py-2 text-xs font-mono bg-black/50 border border-white/10 text-white"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-neutral-300 mb-1.5">Display Heading Font</label>
              <select
                value={editingTheme.headingFont}
                onChange={(e) => setEditingTheme({ ...editingTheme, headingFont: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-black/50 border border-white/10 text-white"
              >
                {FONT_CHOICES.map((f) => (
                  <option key={f} value={f} className="bg-neutral-900">
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-neutral-300 mb-1.5">Body Copy Font</label>
              <select
                value={editingTheme.bodyFont}
                onChange={(e) => setEditingTheme({ ...editingTheme, bodyFont: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-black/50 border border-white/10 text-white"
              >
                {FONT_CHOICES.map((f) => (
                  <option key={f} value={f} className="bg-neutral-900">
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-neutral-300 mb-1.5">Button Geometry</label>
              <select
                value={editingTheme.buttonStyle}
                onChange={(e) =>
                  setEditingTheme({ ...editingTheme, buttonStyle: e.target.value as any })
                }
                className="w-full px-3 py-2 text-sm bg-black/50 border border-white/10 text-white"
              >
                <option value="sharp" className="bg-neutral-900">Sharp Competitive (2px)</option>
                <option value="editorial" className="bg-neutral-900">Editorial Square (0px)</option>
                <option value="rounded" className="bg-neutral-900">Modern Rounded (8px)</option>
              </select>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export const AdminSiteSettings: React.FC<{ notify: (msg: string, type?: 'success' | 'error') => void }> = ({
  notify,
}) => {
  const { apiFetch, refreshBootstrap } = useSite();
  const [form, setForm] = useState<SiteSettings | null>(null);

  useEffect(() => {
    apiFetch('/api/admin/site-settings')
      .then((r) => r.json())
      .then(setForm);
  }, [apiFetch]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    const res = await apiFetch('/api/admin/site-settings', {
      method: 'PUT',
      body: JSON.stringify(form),
    });
    if (res.ok) {
      await refreshBootstrap();
      notify('Site settings, contact details, and footer metadata saved.');
    } else {
      notify('Failed to save site settings', 'error');
    }
  };

  if (!form) return <div className="text-xs text-neutral-400">Loading settings...</div>;

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Contact Info &amp; Footer Settings</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Update global contact channels, social links, analytics ID, and footer bio.
          </p>
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white inline-flex items-center gap-1.5"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Settings</span>
        </button>
      </div>

      <div className="p-6 bg-[#111115] border border-white/10 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-neutral-300 mb-1.5">Contact Email</label>
            <input
              type="email"
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-black/50 border border-white/10 text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-300 mb-1.5">Phone Number</label>
            <input
              type="text"
              value={form.contactPhone}
              onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-black/50 border border-white/10 text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-300 mb-1.5">Headquarters / Offices</label>
            <input
              type="text"
              value={form.headquarters}
              onChange={(e) => setForm({ ...form, headquarters: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-black/50 border border-white/10 text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-neutral-300 mb-1.5">Footer Organization Summary</label>
          <textarea
            rows={2}
            value={form.footerBio}
            onChange={(e) => setForm({ ...form, footerBio: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-black/50 border border-white/10 text-white"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-neutral-300 mb-1.5">Copyright Line</label>
            <input
              type="text"
              value={form.footerCopyright}
              onChange={(e) => setForm({ ...form, footerCopyright: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-black/50 border border-white/10 text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-300 mb-1.5">Analytics Measurement ID</label>
            <input
              type="text"
              value={form.analyticsId || ''}
              onChange={(e) => setForm({ ...form, analyticsId: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-black/50 border border-white/10 text-white"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(['twitter', 'youtube', 'twitch', 'linkedin', 'instagram', 'discord'] as const).map((net) => (
            <div key={net}>
              <label className="block text-xs capitalize text-neutral-300 mb-1.5">{net} URL</label>
              <input
                type="url"
                value={form.socialLinks?.[net] || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    socialLinks: { ...form.socialLinks, [net]: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white"
              />
            </div>
          ))}
        </div>

        <div className="pt-5 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-black/40 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">Floating WhatsApp Button</span>
              <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.whatsappEnabled !== false}
                  onChange={(e) => setForm({ ...form, whatsappEnabled: e.target.checked })}
                  className="accent-red-600"
                />
                <span>Enabled</span>
              </label>
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">WhatsApp Link or Phone (e.g. https://wa.me/977...)</label>
              <input
                type="text"
                value={form.whatsappUrl || ''}
                onChange={(e) => setForm({ ...form, whatsappUrl: e.target.value })}
                placeholder="https://wa.me/9779800000000"
                className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white"
              />
            </div>
          </div>

          <div className="p-4 bg-black/40 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">Client Reviews Page Limits</span>
              <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.reviewsEnabled !== false}
                  onChange={(e) => setForm({ ...form, reviewsEnabled: e.target.checked })}
                  className="accent-red-600"
                />
                <span>Accept Reviews</span>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Max Total Published</label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={form.reviewMaxCount ?? 50}
                  onChange={(e) => setForm({ ...form, reviewMaxCount: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Limit Per Visitor</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={form.reviewPerSessionLimit ?? 2}
                  onChange={(e) => setForm({ ...form, reviewPerSessionLimit: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs bg-black/50 border border-white/10 text-white"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

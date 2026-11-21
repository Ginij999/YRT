import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AdminUser, NavigationItem, SeoMetadata, SiteSettings, StickyNote, ThemeConfig } from '../types/cms';
import {
  FALLBACK_NAVIGATION,
  FALLBACK_SEO,
  FALLBACK_SETTINGS,
  FALLBACK_STICKY_NOTES,
  FALLBACK_THEMES,
} from '../data/fallbackData';

interface BootstrapCachePayload {
  settings: SiteSettings | null;
  activeTheme: ThemeConfig | null;
  themes: ThemeConfig[];
  navigation: NavigationItem[];
  seo: SeoMetadata[];
  stickyNotes?: StickyNote[];
  cachedAt: number;
}

interface SiteContextValue {
  settings: SiteSettings | null;
  activeTheme: ThemeConfig | null;
  themes: ThemeConfig[];
  navigation: NavigationItem[];
  seoList: SeoMetadata[];
  stickyNotes: StickyNote[];
  loading: boolean;
  adminUser: AdminUser | null;
  adminToken: string | null;
  refreshBootstrap: () => Promise<void>;
  setStickyNotes: React.Dispatch<React.SetStateAction<StickyNote[]>>;
  setAdminSession: (token: string, user: AdminUser) => void;
  clearAdminSession: () => void;
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const SiteContext = createContext<SiteContextValue | undefined>(undefined);

const TOKEN_STORAGE_KEY = 'yrt_admin_token';
const BOOTSTRAP_CACHE_KEY = 'yrt_bootstrap_cache_v5';

function readBootstrapCache(): BootstrapCachePayload | null {
  try {
    const raw = localStorage.getItem(BOOTSTRAP_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BootstrapCachePayload;
    if (parsed && typeof parsed === 'object' && parsed.settings && Array.isArray(parsed.navigation) && parsed.navigation.length > 0) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function writeBootstrapCache(payload: Omit<BootstrapCachePayload, 'cachedAt'>) {
  try {
    localStorage.setItem(
      BOOTSTRAP_CACHE_KEY,
      JSON.stringify({ ...payload, cachedAt: Date.now() })
    );
  } catch {
    // Ignore storage quota errors
  }
}

function applyThemeCssVariables(theme: ThemeConfig | null) {
  if (!theme) return;
  const root = document.documentElement;
  root.style.setProperty('--brand-bg', theme.bgColor || '#050507');
  root.style.setProperty('--brand-surface', theme.surfaceColor || '#13141C');
  root.style.setProperty('--brand-surface-elevated', theme.surfaceElevatedColor || '#1B1D28');
  root.style.setProperty('--brand-text', theme.textColor || '#F8FAFC');
  root.style.setProperty('--brand-muted', theme.mutedTextColor || '#9AA6B8');
  root.style.setProperty('--brand-accent', theme.primaryColor || '#DC2626');
  root.style.setProperty('--brand-accent-hover', theme.primaryHoverColor || '#B91C1C');
  root.style.setProperty('--brand-accent-secondary', theme.secondaryColor || '#EF4444');
  root.style.setProperty(
    '--brand-border',
    !theme.borderColor || theme.borderColor === 'rgba(255, 255, 255, 0.09)'
      ? 'rgba(255,255,255,0.16)'
      : theme.borderColor
  );
  root.style.setProperty('--font-display', `"${theme.headingFont || 'Barlow Condensed'}", sans-serif`);
  root.style.setProperty('--font-body', `"${theme.bodyFont || 'Plus Jakarta Sans'}", sans-serif`);

  const radius =
    theme.buttonStyle === 'rounded' ? '4px' : theme.buttonStyle === 'editorial' ? '0px' : '2px';
  root.style.setProperty('--btn-radius', radius);
}

function updateFavicon(url?: string) {
  if (!url) return;
  let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = url;
}

const initialCache = typeof window !== 'undefined' ? readBootstrapCache() : null;
if (typeof document !== 'undefined') {
  applyThemeCssVariables(initialCache?.activeTheme || FALLBACK_THEMES[0]);
}

export const SiteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings | null>(() => initialCache?.settings || FALLBACK_SETTINGS);
  const [activeTheme, setActiveTheme] = useState<ThemeConfig | null>(() => initialCache?.activeTheme || FALLBACK_THEMES[0]);
  const [themes, setThemes] = useState<ThemeConfig[]>(() => initialCache?.themes || FALLBACK_THEMES);
  const [navigation, setNavigation] = useState<NavigationItem[]>(() =>
    initialCache?.navigation && initialCache.navigation.length > 0 ? initialCache.navigation : FALLBACK_NAVIGATION
  );
  const [seoList, setSeoList] = useState<SeoMetadata[]>(() =>
    initialCache?.seo && initialCache.seo.length > 0 ? initialCache.seo : FALLBACK_SEO
  );
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>(() =>
    initialCache?.stickyNotes || FALLBACK_STICKY_NOTES
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  });
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  const refreshBootstrap = useCallback(async () => {
    try {
      const res = await fetch('/api/public/bootstrap');
      if (!res.ok) return;
      const ct = res.headers.get('content-type') || '';
      if (!ct.toLowerCase().includes('application/json')) return;
      const data = await res.json();
      if (!data || typeof data !== 'object') return;

      const nextSettings = data.settings || FALLBACK_SETTINGS;
      const nextThemes = Array.isArray(data.themes) && data.themes.length > 0 ? data.themes : FALLBACK_THEMES;
      const nextTheme = data.activeTheme || nextThemes[0] || FALLBACK_THEMES[0];
      const nextNav =
        Array.isArray(data.navigation) && data.navigation.length > 0 ? data.navigation : FALLBACK_NAVIGATION;
      const nextSeo = Array.isArray(data.seo) && data.seo.length > 0 ? data.seo : FALLBACK_SEO;
      const nextSticky = Array.isArray(data.stickyNotes) ? data.stickyNotes : FALLBACK_STICKY_NOTES;

      setSettings(nextSettings);
      setActiveTheme(nextTheme);
      setThemes(nextThemes);
      setNavigation(nextNav);
      setSeoList(nextSeo);
      setStickyNotes(nextSticky);
      applyThemeCssVariables(nextTheme);
      updateFavicon(nextSettings?.faviconUrl);
      writeBootstrapCache({
        settings: nextSettings,
        activeTheme: nextTheme,
        themes: nextThemes,
        navigation: nextNav,
        seo: nextSeo,
        stickyNotes: nextSticky,
      });
    } catch {
      // Keep fallback/cached state seamlessly
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshBootstrap();
    try {
      if (!sessionStorage.getItem('yrt_map_preloaded')) {
        sessionStorage.setItem('yrt_map_preloaded', '1');
        fetch('/world-countries.json', { cache: 'force-cache' }).catch(() => {});
      }
      if (!sessionStorage.getItem('yrt_visited')) {
        sessionStorage.setItem('yrt_visited', '1');
        fetch('/api/public/track-visit', { method: 'POST' }).catch(() => {});
      }
    } catch {
      // ignore storage errors
    }
  }, [refreshBootstrap]);

  useEffect(() => {
    if (!adminToken) {
      setAdminUser(null);
      return;
    }
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setAdminUser(data.user);
        } else {
          setAdminToken(null);
          setAdminUser(null);
          try {
            sessionStorage.removeItem(TOKEN_STORAGE_KEY);
          } catch {
            // ignore
          }
        }
      })
      .catch(() => {});
  }, [adminToken]);

  const setAdminSession = useCallback((token: string, user: AdminUser) => {
    setAdminToken(token);
    setAdminUser(user);
    try {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    } catch {
      // ignore
    }
  }, []);

  const clearAdminSession = useCallback(() => {
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setAdminToken(null);
    setAdminUser(null);
    try {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const apiFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const headers = new Headers(options.headers || {});
      if (adminToken && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${adminToken}`);
      }
      if (!(options.body instanceof FormData) && options.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      return fetch(url, { ...options, headers, credentials: 'include' });
    },
    [adminToken]
  );

  return (
    <SiteContext.Provider
      value={{
        settings,
        activeTheme,
        themes,
        navigation,
        seoList,
        stickyNotes,
        loading,
        adminUser,
        adminToken,
        refreshBootstrap,
        setStickyNotes,
        setAdminSession,
        clearAdminSession,
        apiFetch,
      }}
    >
      {children}
    </SiteContext.Provider>
  );
};

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error('useSite must be used inside SiteProvider');
  return ctx;
}

export function usePageSeo(pageSlug: string, customTitle?: string, customDescription?: string) {
  const { seoList, settings } = useSite();
  useEffect(() => {
    const match = seoList.find((s) => s.pageSlug === pageSlug);
    const title =
      customTitle ||
      match?.metaTitle ||
      `${settings?.organizationName || 'YRT Esports'} – ${settings?.tagline || ''}`;
    const desc =
      customDescription || match?.metaDescription || settings?.description || '';

    document.title = title;
    const setMeta = (selector: string, val: string) => {
      const el = document.querySelector<HTMLMetaElement>(selector);
      if (el && val) el.content = val;
    };
    setMeta('meta[name="description"]', desc);
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', desc);
    setMeta('meta[name="twitter:title"]', title);
    setMeta('meta[name="twitter:description"]', desc);
  }, [pageSlug, customTitle, customDescription, seoList, settings]);
}

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AdminUser, NavigationItem, SeoMetadata, SiteSettings, StickyNote, ThemeConfig } from '../types/cms';

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
const BOOTSTRAP_CACHE_KEY = 'yrt_bootstrap_cache_v2';

function readBootstrapCache(): BootstrapCachePayload | null {
  try {
    const raw = localStorage.getItem(BOOTSTRAP_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BootstrapCachePayload;
    if (parsed && typeof parsed === 'object') {
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
  root.style.setProperty('--brand-bg', theme.bgColor || '#08080A');
  root.style.setProperty('--brand-surface', theme.surfaceColor || '#111115');
  root.style.setProperty('--brand-surface-elevated', theme.surfaceElevatedColor || '#18181D');
  root.style.setProperty('--brand-text', theme.textColor || '#F8FAFC');
  root.style.setProperty('--brand-muted', theme.mutedTextColor || '#94A3B8');
  root.style.setProperty('--brand-accent', theme.primaryColor || '#DC2626');
  root.style.setProperty('--brand-accent-hover', theme.primaryHoverColor || '#B91C1C');
  root.style.setProperty('--brand-accent-secondary', theme.secondaryColor || '#EF4444');
  root.style.setProperty('--brand-border', theme.borderColor || 'rgba(255,255,255,0.09)');
  root.style.setProperty('--font-display', `"${theme.headingFont || 'Barlow Condensed'}", sans-serif`);
  root.style.setProperty('--font-body', `"${theme.bodyFont || 'Plus Jakarta Sans'}", sans-serif`);

  const radius =
    theme.buttonStyle === 'rounded' ? '8px' : theme.buttonStyle === 'editorial' ? '0px' : '2px';
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
if (initialCache?.activeTheme && typeof document !== 'undefined') {
  applyThemeCssVariables(initialCache.activeTheme);
}

export const SiteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings | null>(() => initialCache?.settings || null);
  const [activeTheme, setActiveTheme] = useState<ThemeConfig | null>(() => initialCache?.activeTheme || null);
  const [themes, setThemes] = useState<ThemeConfig[]>(() => initialCache?.themes || []);
  const [navigation, setNavigation] = useState<NavigationItem[]>(() => initialCache?.navigation || []);
  const [seoList, setSeoList] = useState<SeoMetadata[]>(() => initialCache?.seo || []);
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>(() => initialCache?.stickyNotes || []);
  const [loading, setLoading] = useState<boolean>(() => !initialCache?.settings);
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
      const data = await res.json();
      setSettings(data.settings);
      setActiveTheme(data.activeTheme);
      setThemes(data.themes || []);
      setNavigation(data.navigation || []);
      setSeoList(data.seo || []);
      setStickyNotes(data.stickyNotes || []);
      applyThemeCssVariables(data.activeTheme);
      updateFavicon(data.settings?.faviconUrl);
      writeBootstrapCache({
        settings: data.settings,
        activeTheme: data.activeTheme,
        themes: data.themes || [],
        navigation: data.navigation || [],
        seo: data.seo || [],
        stickyNotes: data.stickyNotes || [],
      });
    } catch (err) {
      console.error('Bootstrap fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshBootstrap();
    // Preload world map geometry in background cache for instant map/globe render
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

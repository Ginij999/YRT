import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Compass,
  ExternalLink,
  FileEdit,
  FileText,
  FolderKanban,
  Globe,
  Image,
  LayoutDashboard,
  Layers,
  LogOut,
  Mail,
  Menu,
  MessageSquareQuote,
  Palette,
  Settings,
  ShieldCheck,
  StickyNote,
  Star,
  Trophy,
  UserCheck,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import { useSite } from '../../context/SiteContext';
import { AdminRole } from '../../types/cms';
import { ToastBanner } from './AdminShared';
import { AdminOverview } from './AdminOverview';
import { AdminWorkspaceSetup } from './AdminWorkspaceSetup';
import { AdminSiteSettings, AdminThemeStudio } from './AdminThemeBranding';
import { AdminPageBuilder } from './AdminPageBuilder';
import { AdminStickyNotes } from './AdminStickyNotes';
import {
  AdminBlog,
  AdminEvents,
  AdminNavigation,
  AdminPartners,
  AdminPortfolio,
  AdminReviews,
  AdminSeo,
  AdminServices,
  AdminTestimonials,
} from './AdminContentModules';
import {
  AdminApplications,
  AdminCareers,
  AdminMedia,
  AdminMessages,
  AdminStaff,
  AdminUsersManager,
} from './AdminPeopleHr';

interface NavModule {
  id: string;
  label: string;
  group: string;
  icon: React.FC<{ className?: string }>;
  roles: AdminRole[];
}

const MODULES: NavModule[] = [
  { id: 'overview', label: 'Dashboard Overview', group: 'Core', icon: LayoutDashboard, roles: ['super_admin', 'admin', 'editor', 'hr_manager', 'content_manager'] },
  { id: 'home-editor', label: 'Home Page Editor', group: 'Page Builder', icon: FileEdit, roles: ['super_admin', 'admin', 'editor', 'content_manager'] },
  { id: 'about-editor', label: 'About Page Editor', group: 'Page Builder', icon: FileEdit, roles: ['super_admin', 'admin', 'editor', 'content_manager'] },
  { id: 'page-builder', label: 'All Pages Builder', group: 'Page Builder', icon: Layers, roles: ['super_admin', 'admin', 'editor', 'content_manager'] },
  { id: 'sticky-notes', label: 'Sticky Notes & Layers', group: 'Page Builder', icon: StickyNote, roles: ['super_admin', 'admin', 'editor', 'content_manager'] },
  { id: 'themes', label: 'Theme & Brand Studio', group: 'Appearance', icon: Palette, roles: ['super_admin', 'admin', 'editor'] },
  { id: 'navigation', label: 'Navigation & Footer', group: 'Appearance', icon: Compass, roles: ['super_admin', 'admin', 'editor'] },
  { id: 'settings', label: 'Contact & Footer Info', group: 'Appearance', icon: Settings, roles: ['super_admin', 'admin'] },
  { id: 'seo', label: 'SEO & Sitemap', group: 'Appearance', icon: Globe, roles: ['super_admin', 'admin', 'editor', 'content_manager'] },
  { id: 'services', label: 'Services', group: 'Content', icon: Layers, roles: ['super_admin', 'admin', 'editor', 'content_manager'] },
  { id: 'portfolio', label: 'Portfolio & Work', group: 'Content', icon: FolderKanban, roles: ['super_admin', 'admin', 'editor', 'content_manager'] },
  { id: 'events', label: 'Events & Tournaments', group: 'Content', icon: Trophy, roles: ['super_admin', 'admin', 'editor', 'content_manager'] },
  { id: 'blog', label: 'Blog & Articles', group: 'Content', icon: FileText, roles: ['super_admin', 'admin', 'editor', 'content_manager'] },
  { id: 'testimonials', label: 'Testimonials', group: 'Content', icon: MessageSquareQuote, roles: ['super_admin', 'admin', 'editor', 'content_manager'] },
  { id: 'reviews', label: 'Client Reviews', group: 'Content', icon: Star, roles: ['super_admin', 'admin', 'editor', 'content_manager'] },
  { id: 'partners', label: 'Partners & Sponsors', group: 'Content', icon: Users, roles: ['super_admin', 'admin', 'editor', 'content_manager'] },
  { id: 'media', label: 'Media Library', group: 'Content', icon: Image, roles: ['super_admin', 'admin', 'editor', 'content_manager', 'hr_manager'] },
  { id: 'staff', label: 'Staff Directory', group: 'People & HR', icon: Users, roles: ['super_admin', 'admin', 'hr_manager'] },
  { id: 'careers', label: 'Careers & Positions', group: 'People & HR', icon: Briefcase, roles: ['super_admin', 'admin', 'hr_manager'] },
  { id: 'applications', label: 'Job Applications', group: 'People & HR', icon: UserCheck, roles: ['super_admin', 'admin', 'hr_manager'] },
  { id: 'messages', label: 'Contact Inbox', group: 'System', icon: Mail, roles: ['super_admin', 'admin', 'editor', 'hr_manager', 'content_manager'] },
  { id: 'workspace-setup', label: 'Setup & Reset', group: 'System', icon: Wrench, roles: ['super_admin', 'admin'] },
  { id: 'admin-users', label: 'Admin Users & RBAC', group: 'System', icon: ShieldCheck, roles: ['super_admin', 'admin'] },
];

export const AdminDashboard: React.FC = () => {
  const { settings, adminUser, setAdminSession, clearAdminSession } = useSite();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Standard Login Form State (First-Time Setup removed from login gate; Setup & Reset lives post-login)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || 'Authentication failed');
      } else {
        setAdminSession(data.token, data.user);
      }
    } catch {
      setLoginError('Network error during sign-in');
    } finally {
      setLoggingIn(false);
    }
  };

  if (!adminUser) {
    return (
      <div className="min-h-screen bg-[#08080A] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#111115] border border-white/10 p-8 space-y-6">
          <div className="flex items-center gap-3">
            <img
              src={settings?.logoDarkUrl || '/logo.png'}
              alt="YRT Esports Logo"
              className="h-14 w-14 object-contain"
            />
            <div>
              <h1 className="text-xl font-bold text-white">{settings?.organizationName || 'YRT Esports'} CMS</h1>
              <p className="text-xs text-neutral-400">Administrator Sign In</p>
            </div>
          </div>

          {loginError && (
            <div className="p-3 bg-red-950/60 border border-red-700 text-xs text-red-200">{loginError}</div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">Admin Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="Enter your admin email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-black/50 border border-white/10 text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">Password</label>
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-black/50 border border-white/10 text-white"
              />
            </div>
            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-3 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white"
            >
              {loggingIn ? 'Authenticating...' : 'Sign In to CMS Dashboard'}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-white/10">
            <Link to="/" className="text-xs text-neutral-400 hover:text-white underline">
              Return to Public Website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const permittedModules = MODULES.filter(
    (m) => adminUser.role === 'super_admin' || m.roles.includes(adminUser.role)
  );
  const groups = Array.from(new Set(permittedModules.map((m) => m.group)));
  const currentModule = permittedModules.find((m) => m.id === activeTab) || permittedModules[0];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <AdminOverview onNavigate={setActiveTab} />;
      case 'home-editor':
        return <AdminPageBuilder initialSlug="home" notify={notify} />;
      case 'about-editor':
        return <AdminPageBuilder initialSlug="about" notify={notify} />;
      case 'page-builder':
        return <AdminPageBuilder initialSlug="services" notify={notify} />;
      case 'sticky-notes':
        return <AdminStickyNotes notify={notify} />;
      case 'themes':
        return <AdminThemeStudio notify={notify} />;
      case 'settings':
        return <AdminSiteSettings notify={notify} />;
      case 'navigation':
        return <AdminNavigation notify={notify} />;
      case 'seo':
        return <AdminSeo notify={notify} />;
      case 'services':
        return <AdminServices notify={notify} />;
      case 'portfolio':
        return <AdminPortfolio notify={notify} />;
      case 'events':
        return <AdminEvents notify={notify} />;
      case 'blog':
        return <AdminBlog notify={notify} />;
      case 'testimonials':
        return <AdminTestimonials notify={notify} />;
      case 'reviews':
        return <AdminReviews notify={notify} />;
      case 'partners':
        return <AdminPartners notify={notify} />;
      case 'media':
        return <AdminMedia notify={notify} />;
      case 'staff':
        return <AdminStaff notify={notify} />;
      case 'careers':
        return <AdminCareers notify={notify} />;
      case 'applications':
        return <AdminApplications notify={notify} />;
      case 'messages':
        return <AdminMessages notify={notify} />;
      case 'workspace-setup':
        return <AdminWorkspaceSetup onNavigate={setActiveTab} notify={notify} />;
      case 'admin-users':
        return <AdminUsersManager notify={notify} />;
      default:
        return <AdminOverview onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#08080A] text-neutral-100 flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-[260px] bg-[#0D0D10] border-r border-white/10 flex flex-col transition-transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-16 px-5 border-b border-white/10 flex items-center justify-between shrink-0">
          <Link to="/admin" className="flex items-center gap-2.5 min-w-0">
            <img
              src={settings?.logoDarkUrl || '/logo.png'}
              alt="YRT Logo"
              className="h-11 w-11 object-contain shrink-0"
            />
            <span className="font-bold text-sm text-white truncate">
              {settings?.organizationName || 'YRT Esports'} CMS
            </span>
          </Link>
          <button type="button" onClick={() => setSidebarOpen(false)} className="lg:hidden text-neutral-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {groups.map((group) => (
            <div key={group} className="space-y-1">
              <div className="px-3 text-[11px] font-semibold text-neutral-500">{group}</div>
              {permittedModules
                .filter((m) => m.group === group)
                .map((mod) => {
                  const Icon = mod.icon;
                  const active = activeTab === mod.id;
                  return (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(mod.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors ${
                        active ? 'bg-red-600 text-white' : 'text-neutral-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{mod.label}</span>
                    </button>
                  );
                })}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-3 shrink-0">
          <div className="text-xs">
            <div className="font-semibold text-white truncate">{adminUser.name}</div>
            <div className="text-[11px] text-neutral-400 capitalize">{adminUser.role.replace('_', ' ')}</div>
          </div>
          <button
            type="button"
            onClick={clearAdminSession}
            className="w-full px-3 py-2 text-xs font-medium border border-white/10 text-neutral-300 hover:text-white hover:bg-white/5 inline-flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 px-6 border-b border-white/10 bg-[#0D0D10] flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 border border-white/10 text-white">
              <Menu className="w-4 h-4" />
            </button>
            <div className="text-xs text-neutral-400">
              <span>CMS</span>
              <span className="mx-2">/</span>
              <span className="text-white font-semibold">{currentModule?.label}</span>
            </div>
          </div>

          <Link
            to="/"
            target="_blank"
            className="px-3.5 py-2 text-xs font-semibold border border-white/15 bg-white/5 hover:bg-white/10 text-white inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>View Live Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </header>

        <main className="flex-1 p-6 md:p-8 max-w-[1400px] w-full mx-auto">
          {renderContent()}
        </main>
      </div>

      {toast && <ToastBanner message={toast.msg} type={toast.type} />}
    </div>
  );
};

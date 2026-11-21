import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSite } from '../context/SiteContext';

export const Navbar: React.FC = () => {
  const { settings, navigation } = useSite();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 28);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const headerLinks = navigation
    .filter((n) => n.location === 'header' && n.visible)
    .sort((a, b) => a.order - b.order)
    .slice(0, 6);

  const logoSrc = settings?.logoDarkUrl || settings?.logoLightUrl || '/logo.png';

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] pointer-events-none ${
        scrolled ? 'px-3 sm:px-6 pt-3' : 'px-0 pt-0'
      }`}
    >
      <div
        className={`mx-auto flex items-center justify-between gap-3 pointer-events-auto transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          scrolled
            ? 'max-w-[1180px] px-4 sm:px-5 h-[62px] rounded-md apple-glass-nav border border-white/15'
            : 'max-w-full px-5 sm:px-8 h-[70px] rounded-none bg-[#08080A]/80 backdrop-blur-md border-b border-white/10'
        }`}
      >
        {/* Left Cluster: Logo + Compact Wordmark + Tight Nav Links */}
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <Link
            to="/"
            className="flex items-center gap-2 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 group"
          >
            <motion.img
              whileHover={{ scale: 1.07, rotate: -2 }}
              transition={{ type: 'spring', stiffness: 360, damping: 20 }}
              src={logoSrc}
              alt={settings?.organizationName || 'YRT Esports'}
              className="h-10 w-10 object-contain shrink-0"
              referrerPolicy="no-referrer"
            />
            <span className="font-display text-xl font-bold tracking-tight text-white whitespace-nowrap shrink-0">
              {settings?.organizationName || 'YRT Esports'}
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-0.5 pl-1" aria-label="Primary Navigation">
            {headerLinks.map((item) => {
              const isActive =
                item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path);
              if (item.isExternal) {
                return (
                  <a
                    key={item._id}
                    href={item.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-[2px] text-sm font-medium whitespace-nowrap shrink-0 transition-colors hover:text-white hover:bg-white/[0.06]"
                    style={{ color: 'var(--brand-muted)' }}
                  >
                    {item.label}
                  </a>
                );
              }
              return (
                <Link
                  key={item._id}
                  to={item.path}
                  className="relative px-3 py-1.5 rounded-[2px] text-sm font-medium whitespace-nowrap shrink-0 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                  style={{ color: isActive ? '#ffffff' : 'var(--brand-muted)' }}
                >
                  {isActive && (
                    <motion.span
                      layoutId="nav-active-pill"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      className="absolute inset-0 rounded-[2px] bg-white/[0.1] border border-white/15 -z-10"
                    />
                  )}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Cluster: Primary Action + Mobile Menu Trigger (No Admin Links) */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/contact"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold tracking-wide btn-brand whitespace-nowrap shrink-0"
          >
            <span>Start a Project</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-[2px] text-white apple-glass"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Glass Drawer (Zero Admin Links) */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden max-w-[1180px] mx-auto mt-2 rounded-[2px] apple-glass px-6 py-6 space-y-4 pointer-events-auto"
          >
            <div className="flex flex-col space-y-2.5">
              <Link to="/about" className="text-base font-medium text-white py-1">
                About Us
              </Link>
              {headerLinks.map((item) => (
                <Link
                  key={item._id}
                  to={item.path}
                  className="text-base font-medium text-neutral-200 hover:text-white py-1"
                >
                  {item.label}
                </Link>
              ))}
              <Link to="/blog" className="text-base font-medium text-neutral-200 hover:text-white py-1">
                Journal
              </Link>
              <Link to="/careers" className="text-base font-medium text-neutral-200 hover:text-white py-1">
                Careers
              </Link>
              <Link to="/contact" className="text-base font-medium text-neutral-200 hover:text-white py-1">
                Contact
              </Link>
            </div>
            <div className="pt-4 border-t border-white/10">
              <Link
                to="/contact"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold btn-brand"
              >
                <span>Start a Project</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

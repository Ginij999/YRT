import React, { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { SiteProvider } from './context/SiteContext';
import { LoadingSplash } from './components/LoadingSplash';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { StarfieldBackground } from './components/StarfieldBackground';
import { StickyNotesLayer } from './components/StickyNotesLayer';
import { WhatsAppButton } from './components/WhatsAppButton';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { ServicesPage } from './pages/ServicesPage';
import { PortfolioPage } from './pages/PortfolioPage';
import { EventsPage } from './pages/EventsPage';
import { TeamPage } from './pages/TeamPage';
import { CareersPage } from './pages/CareersPage';
import { BlogPage } from './pages/BlogPage';
import { ReviewsPage } from './pages/ReviewsPage';
import { ContactPage } from './pages/ContactPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useLocation();
  const pageSlug = pathname === '/' ? 'home' : pathname.replace(/^\//, '').split('/')[0] || 'home';

  return (
    <div
      className="min-h-screen flex flex-col relative bg-[#08080A]"
      style={{ color: 'var(--brand-text)' }}
    >
      <StarfieldBackground />
      <LoadingSplash />
      <Navbar />
      <main className="flex-1 relative z-10">{children}</main>
      <div className="relative z-10">
        <Footer />
      </div>
      <StickyNotesLayer pageSlug={pageSlug} />
      <WhatsAppButton />
    </div>
  );
};

export default function App() {
  return (
    <SiteProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/admin/*" element={<AdminDashboard />} />
          <Route
            path="/"
            element={
              <PublicLayout>
                <HomePage />
              </PublicLayout>
            }
          />
          <Route
            path="/about"
            element={
              <PublicLayout>
                <AboutPage />
              </PublicLayout>
            }
          />
          <Route
            path="/services"
            element={
              <PublicLayout>
                <ServicesPage />
              </PublicLayout>
            }
          />
          <Route
            path="/services/:slug"
            element={
              <PublicLayout>
                <ServicesPage />
              </PublicLayout>
            }
          />
          <Route
            path="/portfolio"
            element={
              <PublicLayout>
                <PortfolioPage />
              </PublicLayout>
            }
          />
          <Route
            path="/events"
            element={
              <PublicLayout>
                <EventsPage />
              </PublicLayout>
            }
          />
          <Route
            path="/team"
            element={
              <PublicLayout>
                <TeamPage />
              </PublicLayout>
            }
          />
          <Route
            path="/careers"
            element={
              <PublicLayout>
                <CareersPage />
              </PublicLayout>
            }
          />
          <Route
            path="/blog"
            element={
              <PublicLayout>
                <BlogPage />
              </PublicLayout>
            }
          />
          <Route
            path="/blog/:slug"
            element={
              <PublicLayout>
                <BlogPage />
              </PublicLayout>
            }
          />
          <Route
            path="/reviews"
            element={
              <PublicLayout>
                <ReviewsPage />
              </PublicLayout>
            }
          />
          <Route
            path="/contact"
            element={
              <PublicLayout>
                <ContactPage />
              </PublicLayout>
            }
          />
          <Route
            path="*"
            element={
              <PublicLayout>
                <HomePage />
              </PublicLayout>
            }
          />
        </Routes>
      </BrowserRouter>
    </SiteProvider>
  );
}

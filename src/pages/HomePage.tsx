import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, MapPin, Calendar, Star, Globe, Trophy, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { usePageSeo, useSite } from '../context/SiteContext';
import {
  BlogPost,
  EventItem,
  PageSection,
  Partner,
  PortfolioItem,
  ServiceItem,
  StaffMember,
  Testimonial,
} from '../types/cms';
import { MediaImage } from '../components/MediaImage';
import { CustomSectionBlock } from '../components/DynamicExtraSections';
import { GlobalNetworkMap } from '../components/GlobalNetworkMap';
import { Globe3D } from '../components/Globe3D';
import { StackedServiceDeck } from '../components/StackedServiceDeck';
import { StickyServicesStack } from '../components/StickyServicesStack';
import { BrandLogoCarousel } from '../components/ShowcaseMarquees';
import { FillButtonContent } from '../components/FillButtonContent';
import { StickerCard } from '../components/StickerCard';
import {
  FALLBACK_BLOG_POSTS,
  FALLBACK_EVENTS,
  FALLBACK_PAGE_SECTIONS,
  FALLBACK_PARTNERS,
  FALLBACK_PORTFOLIO,
  FALLBACK_SERVICES,
  FALLBACK_STAFF,
  FALLBACK_TESTIMONIALS,
  safeFetchJson,
} from '../data/fallbackData';

const appleEase: [number, number, number, number] = [0.22, 1, 0.36, 1];
const HOME_CACHE_KEY = 'yrt_home_cache_v4';

interface HomeCachePayload {
  sections: PageSection[];
  services: ServiceItem[];
  events: EventItem[];
  portfolio: PortfolioItem[];
  partners: Partner[];
  staff: StaffMember[];
  testimonials: Testimonial[];
  posts: BlogPost[];
}

const DEFAULT_HOME_PAYLOAD: HomeCachePayload = {
  sections: FALLBACK_PAGE_SECTIONS.home,
  services: FALLBACK_SERVICES,
  events: FALLBACK_EVENTS,
  portfolio: FALLBACK_PORTFOLIO,
  partners: FALLBACK_PARTNERS,
  staff: FALLBACK_STAFF,
  testimonials: FALLBACK_TESTIMONIALS,
  posts: FALLBACK_BLOG_POSTS,
};

function readHomeCache(): HomeCachePayload | null {
  try {
    const raw = localStorage.getItem(HOME_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as HomeCachePayload;
    if (parsed && Array.isArray(parsed.sections) && parsed.sections.length > 0) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export const HomePage: React.FC = () => {
  const { settings, apiFetch, stickyNotes } = useSite();
  const [focusedStickerId, setFocusedStickerId] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === 'true';

  usePageSeo('home');

  const initialCache = !isPreview ? readHomeCache() || DEFAULT_HOME_PAYLOAD : DEFAULT_HOME_PAYLOAD;
  const [sections, setSections] = useState<PageSection[]>(() => initialCache.sections);
  const [services, setServices] = useState<ServiceItem[]>(() => initialCache.services);
  const [events, setEvents] = useState<EventItem[]>(() => initialCache.events);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(() => initialCache.portfolio);
  const [partners, setPartners] = useState<Partner[]>(() => initialCache.partners);
  const [staff, setStaff] = useState<StaffMember[]>(() => initialCache.staff);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(() => initialCache.testimonials);
  const [posts, setPosts] = useState<BlogPost[]>(() => initialCache.posts);

  useEffect(() => {
    const pageUrl = isPreview ? '/api/public/pages/home?preview=true' : '/api/public/pages/home';
    const fetchPage = async () => {
      try {
        const r = await apiFetch(pageUrl);
        if (!r.ok) return { sections: FALLBACK_PAGE_SECTIONS.home };
        const ct = r.headers.get('content-type') || '';
        if (!ct.toLowerCase().includes('application/json')) return { sections: FALLBACK_PAGE_SECTIONS.home };
        const data = await r.json();
        return data && Array.isArray(data.sections) && data.sections.length > 0
          ? data
          : { sections: FALLBACK_PAGE_SECTIONS.home };
      } catch {
        return { sections: FALLBACK_PAGE_SECTIONS.home };
      }
    };

    Promise.all([
      fetchPage(),
      safeFetchJson<ServiceItem[]>('/api/public/services', FALLBACK_SERVICES),
      safeFetchJson<EventItem[]>('/api/public/events', FALLBACK_EVENTS),
      safeFetchJson<PortfolioItem[]>('/api/public/portfolio', FALLBACK_PORTFOLIO),
      safeFetchJson<Partner[]>('/api/public/partners', FALLBACK_PARTNERS),
      safeFetchJson<StaffMember[]>('/api/public/staff', FALLBACK_STAFF),
      safeFetchJson<Testimonial[]>('/api/public/testimonials', FALLBACK_TESTIMONIALS),
      safeFetchJson<BlogPost[]>('/api/public/blog', FALLBACK_BLOG_POSTS),
    ])
      .then(([pageData, svc, evt, port, part, stf, test, blg]) => {
        const nextPayload: HomeCachePayload = {
          sections: Array.isArray(pageData.sections) && pageData.sections.length > 0
            ? pageData.sections
            : FALLBACK_PAGE_SECTIONS.home,
          services: Array.isArray(svc) && svc.length > 0 ? svc : FALLBACK_SERVICES,
          events: Array.isArray(evt) && evt.length > 0 ? evt : FALLBACK_EVENTS,
          portfolio: Array.isArray(port) && port.length > 0 ? port : FALLBACK_PORTFOLIO,
          partners: Array.isArray(part) && part.length > 0 ? part : FALLBACK_PARTNERS,
          staff: Array.isArray(stf) && stf.length > 0 ? stf : FALLBACK_STAFF,
          testimonials: Array.isArray(test) && test.length > 0 ? test : FALLBACK_TESTIMONIALS,
          posts: Array.isArray(blg) && blg.length > 0 ? blg : FALLBACK_BLOG_POSTS,
        };
        setSections(nextPayload.sections);
        setServices(nextPayload.services);
        setEvents(nextPayload.events);
        setPortfolio(nextPayload.portfolio);
        setPartners(nextPayload.partners);
        setStaff(nextPayload.staff);
        setTestimonials(nextPayload.testimonials);
        setPosts(nextPayload.posts);
        if (!isPreview) {
          try {
            localStorage.setItem(HOME_CACHE_KEY, JSON.stringify(nextPayload));
          } catch {
            // ignore storage quota errors
          }
        }
      })
      .catch(() => {});
  }, [isPreview, apiFetch]);

  const renderSection = (sec: PageSection) => {
    switch (sec.sectionKey) {
      case 'hero':
        return (
          <section
            key={sec._id}
            className="relative min-h-[100dvh] flex items-center pt-28 md:pt-32 pb-16 overflow-x-clip bg-transparent"
          >
            {/* Vertical "YRT ESPORTS" Top-to-Down Side Rail */}
            <div
              aria-hidden="true"
              className="hidden md:flex flex-col items-center justify-between py-24 px-1.5 absolute left-3 xl:left-6 inset-y-0 z-10 pointer-events-none select-none"
            >
              <span className="w-px h-16 bg-gradient-to-b from-transparent via-red-500/70 to-transparent" />
              <span
                className="font-display text-sm xl:text-base font-black tracking-[0.42em] uppercase text-white/55"
                style={{ writingMode: 'vertical-rl' }}
              >
                {settings?.organizationName || 'YRT ESPORTS'}
              </span>
              <span className="w-px h-16 bg-gradient-to-b from-transparent via-white/30 to-transparent" />
            </div>

            <div className="relative z-10 max-w-[1280px] w-full mx-auto px-6 md:pl-16 md:pr-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
                {/* Left Column: Agency Headlines, CTAs (1.5s bottom-to-top fill), KPIs */}
                <motion.div
                  initial={{ opacity: 0, y: 22, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.65, ease: appleEase }}
                  className="lg:col-span-6 flex flex-col justify-center gap-6"
                >
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[2px] border border-red-500/50 bg-[#141520] text-xs font-semibold text-white w-fit">
                    <MapPin className="w-3.5 h-3.5" style={{ color: 'var(--brand-accent)' }} />
                    <span>{sec.subtitle || 'Kathmandu, Nepal (KTM HQ) · Global Esports Studio'}</span>
                  </div>

                  <h1
                    className="font-display font-bold tracking-tight text-white text-balance leading-[1.02]"
                    style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)' }}
                  >
                    {sec.title}
                  </h1>

                  <p className="text-base md:text-lg leading-relaxed max-w-2xl text-neutral-300">
                    {sec.description}
                  </p>

                  <div className="pt-1 flex flex-wrap items-center gap-4">
                    <Link
                      to={sec.ctaLink || '/contact'}
                      className="inline-flex items-center justify-center px-7 py-4 text-sm font-semibold btn-brand whitespace-nowrap"
                    >
                      <FillButtonContent className="gap-2">
                        <span>{sec.ctaText || 'Start a Project'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </FillButtonContent>
                    </Link>

                    <Link
                      to="/services"
                      className="inline-flex items-center justify-center px-7 py-4 text-sm font-semibold btn-brand-outline whitespace-nowrap"
                    >
                      <FillButtonContent className="gap-2">
                        <Zap className="w-4 h-4 text-red-500" />
                        <span>Our Services</span>
                      </FillButtonContent>
                    </Link>
                  </div>

                  {/* Hero KPI Strip with Distinct Surface Contrast */}
                  <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-6 border-t border-white/15">
                    <div className="p-4 rounded-[2px] bg-[#141520] border border-white/15 hover:border-red-500/50 transition-colors">
                      <Globe className="w-4 h-4 text-red-500 mb-1.5 hidden sm:block" />
                      <p className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight tabular-nums">
                        140+
                      </p>
                      <p className="font-display text-[10px] sm:text-xs text-neutral-300 uppercase tracking-widest font-semibold">
                        Global Events
                      </p>
                    </div>
                    <div className="p-4 rounded-[2px] bg-[#141520] border border-white/15 hover:border-red-500/50 transition-colors">
                      <Trophy className="w-4 h-4 text-red-500 mb-1.5 hidden sm:block" />
                      <p className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight tabular-nums">
                        68M+
                      </p>
                      <p className="font-display text-[10px] sm:text-xs text-neutral-300 uppercase tracking-widest font-semibold">
                        Broadcast Hours
                      </p>
                    </div>
                    <div className="p-4 rounded-[2px] bg-[#141520] border border-white/15 hover:border-red-500/50 transition-colors">
                      <MapPin className="w-4 h-4 text-red-500 mb-1.5 hidden sm:block" />
                      <p className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight tabular-nums">
                        KTM HQ
                      </p>
                      <p className="font-display text-[10px] sm:text-xs text-neutral-300 uppercase tracking-widest font-semibold">
                        32 Countries Reached
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Right Column: Interactive 3D Globe on Top Landing Hero */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.7, delay: 0.12, ease: appleEase }}
                  className="lg:col-span-6 relative w-full flex items-center justify-center"
                >
                  <Globe3D heroMode />
                </motion.div>
              </div>
            </div>
          </section>
        );

      case 'organization_intro':
        return (
          <section
            key={sec._id}
            className="py-24 border-t relative overflow-hidden bg-transparent"
            style={{
              borderColor: 'var(--brand-border)',
            }}
          >
            <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
              <motion.div
                initial={{ opacity: 0, x: -24, filter: 'blur(6px)' }}
                whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, ease: appleEase }}
                className="lg:col-span-6 flex flex-col justify-center space-y-5"
              >
                {sec.subtitle && (
                  <p className="text-xs font-semibold tracking-wider" style={{ color: 'var(--brand-accent)' }}>
                    {sec.subtitle}
                  </p>
                )}
                <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-white text-balance">
                  {sec.title}
                </h2>
                <p className="text-base leading-relaxed" style={{ color: 'var(--brand-muted)' }}>
                  {sec.description}
                </p>
                <div className="pt-2 flex items-center gap-6">
                  <Link
                    to={sec.ctaLink || '/about'}
                    className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold btn-brand-outline"
                  >
                    <FillButtonContent className="gap-2">
                      <span>{sec.ctaText || 'Learn About Our Agency'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </FillButtonContent>
                  </Link>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 24, scale: 0.97, filter: 'blur(6px)' }}
                whileInView={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, ease: appleEase }}
                className="lg:col-span-6 min-h-[320px] lg:min-h-[420px] rounded-[2px] apple-glass overflow-hidden"
              >
                <MediaImage
                  src={sec.imageUrl}
                  alt={sec.title}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-[1.04]"
                />
              </motion.div>
            </div>
          </section>
        );

      case 'company_stats':
        return <CustomSectionBlock key={sec._id} section={sec} />;

      case 'services_showcase':
        return (
          <React.Fragment key={sec._id}>
            {/* Sticky-Stacking Overlapping Core Services Cards (Production -> Esports Marketing -> Event Execution -> Jersey Printing) */}
            <StickyServicesStack
              services={services}
              mode="home"
              eyebrow={sec.subtitle || 'What we do'}
              description={sec.description}
              ctaText={sec.ctaText || 'See all esports services'}
              ctaLink={sec.ctaLink || '/services'}
            />

            {/* Interactive 3D Flippable Capability Flashcards & Extended Directory */}
            <section
              className="py-20 relative border-t bg-transparent"
              style={{
                borderColor: 'var(--brand-border)',
              }}
            >
              <div className="max-w-[1280px] mx-auto px-6 relative z-10">
                <StackedServiceDeck services={services} />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {services.slice(0, 6).map((svc, idx) => (
                    <motion.div
                      key={svc._id}
                      initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
                      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      viewport={{ once: true, amount: 0.15 }}
                      transition={{ duration: 0.48, delay: idx * 0.05, ease: appleEase }}
                    >
                      <Link
                        to={`/services/${svc.slug}`}
                        className="group h-full p-7 rounded-[2px] apple-glass-card wise-card-motion flex flex-col justify-between"
                      >
                        <div className="space-y-4">
                          <span className="font-mono-num text-xs" style={{ color: 'var(--brand-accent)' }}>
                            {String(idx + 1).padStart(2, '0')}.
                          </span>
                          <h3 className="font-display text-2xl font-bold text-white group-hover:underline underline-offset-4">
                            {svc.title}
                          </h3>
                          <p className="text-sm leading-relaxed" style={{ color: 'var(--brand-muted)' }}>
                            {svc.shortDescription}
                          </p>
                        </div>
                        <div
                          className="mt-8 pt-4 border-t flex items-center justify-between text-xs font-semibold text-white"
                          style={{ borderColor: 'var(--brand-border)' }}
                        >
                          <span>Explore Capability</span>
                          <ArrowUpRight
                            className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                            style={{ color: 'var(--brand-accent)' }}
                          />
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
            <GlobalNetworkMap />
          </React.Fragment>
        );

      case 'featured_events':
        return (
          <section key={sec._id} className="py-24 border-t" style={{ borderColor: 'var(--brand-border)' }}>
            <div className="max-w-[1280px] mx-auto px-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div className="max-w-2xl space-y-3">
                  {sec.subtitle && (
                    <p className="text-xs font-semibold tracking-wider" style={{ color: 'var(--brand-accent)' }}>
                      {sec.subtitle}
                    </p>
                  )}
                  <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-white text-balance">
                    {sec.title}{' '}
                    <span className="text-red-500 text-2xl md:text-3xl font-medium ml-1">— and still counting.</span>
                  </h2>
                  <p className="text-sm md:text-base" style={{ color: 'var(--brand-muted)' }}>
                    {sec.description}
                  </p>
                </div>
                <Link
                  to={sec.ctaLink || '/events'}
                  className="inline-flex items-center justify-center px-5 py-2.5 text-xs font-semibold btn-brand-outline whitespace-nowrap shrink-0"
                >
                  <FillButtonContent className="gap-2">
                    <span>{sec.ctaText || 'Full Event Calendar'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </FillButtonContent>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {events.slice(0, 3).map((evt, idx) => (
                  <motion.div
                    key={evt._id}
                    initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
                    whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    viewport={{ once: true, amount: 0.15 }}
                    transition={{ duration: 0.48, delay: idx * 0.08, ease: appleEase }}
                  >
                    <Link
                      to={`/events?event=${evt.slug}`}
                      className="group h-full rounded-[2px] apple-glass-card wise-card-motion flex flex-col"
                    >
                      <div className="aspect-[16/10] relative overflow-hidden">
                        <MediaImage
                          src={evt.bannerUrl}
                          alt={evt.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-neutral-200 tabular-nums">
                          <span className="capitalize font-semibold px-2.5 py-0.5 rounded-[2px] bg-black/75 border border-white/20">
                            {evt.status}
                          </span>
                          <span className="font-mono-num">{evt.prizePool}</span>
                        </div>
                      </div>
                      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                        <div>
                          <div className="flex items-center gap-2 text-xs mb-2" style={{ color: 'var(--brand-muted)' }}>
                            <span>{evt.gameCategory}</span>
                            <span aria-hidden="true">·</span>
                            <span>{evt.location}</span>
                          </div>
                          <h3 className="font-display text-2xl font-bold text-white group-hover:underline underline-offset-4">
                            {evt.title}
                          </h3>
                          <p className="mt-2 text-sm line-clamp-2" style={{ color: 'var(--brand-muted)' }}>
                            {evt.description}
                          </p>
                        </div>
                        <div
                          className="pt-4 border-t flex items-center justify-between text-xs tabular-nums"
                          style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-muted)' }}
                        >
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {evt.startDate}
                          </span>
                          <span>{evt.teamsCount} Teams</span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        );

      case 'portfolio_showcase':
        return (
          <section
            key={sec._id}
            className="py-24 border-t bg-transparent"
            style={{
              borderColor: 'var(--brand-border)',
            }}
          >
            <div className="max-w-[1280px] mx-auto px-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div className="max-w-2xl space-y-3">
                  {sec.subtitle && (
                    <p className="text-xs font-semibold tracking-wider" style={{ color: 'var(--brand-accent)' }}>
                      {sec.subtitle}
                    </p>
                  )}
                  <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-white text-balance">
                    {sec.title}
                  </h2>
                  <p className="text-sm md:text-base" style={{ color: 'var(--brand-muted)' }}>
                    {sec.description}
                  </p>
                </div>
                <Link
                  to={sec.ctaLink || '/portfolio'}
                  className="inline-flex items-center justify-center px-5 py-2.5 text-xs font-semibold btn-brand-outline whitespace-nowrap shrink-0"
                >
                  <FillButtonContent className="gap-2">
                    <span>{sec.ctaText || 'Browse Full Portfolio'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </FillButtonContent>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {portfolio.slice(0, 4).map((proj, idx) => (
                  <motion.div
                    key={proj._id}
                    initial={{ opacity: 0, y: 22, filter: 'blur(6px)' }}
                    whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    viewport={{ once: true, amount: 0.15 }}
                    transition={{ duration: 0.5, delay: idx * 0.07, ease: appleEase }}
                    className={idx === 0 ? 'md:col-span-2' : ''}
                  >
                    <Link
                      to={`/portfolio?project=${proj.slug}`}
                      className={`group h-full rounded-[2px] apple-glass-card wise-card-motion flex flex-col ${
                        idx === 0 ? 'lg:grid lg:grid-cols-12' : ''
                      }`}
                    >
                      <div
                        className={`${
                          idx === 0 ? 'lg:col-span-7 min-h-[300px]' : 'aspect-[16/10]'
                        } relative overflow-hidden`}
                      >
                        <MediaImage
                          src={proj.thumbnailUrl}
                          alt={proj.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                      <div
                        className={`${
                          idx === 0 ? 'lg:col-span-5' : ''
                        } p-7 flex flex-col justify-between space-y-4`}
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2 text-xs mb-2" style={{ color: 'var(--brand-muted)' }}>
                            <span>{proj.category}</span>
                            <span aria-hidden="true">·</span>
                            <span>{proj.gameTitle}</span>
                            <span aria-hidden="true">·</span>
                            <span className="tabular-nums">{proj.year}</span>
                          </div>
                          <h3 className="font-display text-2xl md:text-3xl font-bold text-white group-hover:underline underline-offset-4">
                            {proj.title}
                          </h3>
                          <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--brand-muted)' }}>
                            {proj.description}
                          </p>
                        </div>
                        <div className="pt-4 border-t space-y-2" style={{ borderColor: 'var(--brand-border)' }}>
                          {proj.metrics && (
                            <p className="text-xs font-semibold text-white tabular-nums">{proj.metrics}</p>
                          )}
                          <div className="flex items-center justify-between text-xs" style={{ color: 'var(--brand-muted)' }}>
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5" />
                              {proj.location || proj.client}
                            </span>
                            <span className="font-semibold text-white inline-flex items-center gap-1">
                              <span>View Case Study</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        );

      case 'partners_strip':
        return (
          <section key={sec._id} className="py-16 border-t" style={{ borderColor: 'var(--brand-border)' }}>
            <div className="max-w-[1280px] mx-auto px-6 space-y-8">
              <div className="text-center max-w-2xl mx-auto">
                <p className="text-xs font-semibold tracking-wider mb-2" style={{ color: 'var(--brand-accent)' }}>
                  {sec.subtitle || 'Brands & Ecosystem Partners'}
                </p>
                <h2 className="font-display text-2xl md:text-4xl font-bold text-white">
                  {sec.title || 'Trusted by Global Brands & Publishers'}
                </h2>
              </div>
              <BrandLogoCarousel partners={partners} />
            </div>
          </section>
        );

      case 'leadership_team':
        return (
          <section
            key={sec._id}
            className="py-24 border-t bg-transparent"
            style={{
              borderColor: 'var(--brand-border)',
            }}
          >
            <div className="max-w-[1280px] mx-auto px-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div className="max-w-2xl space-y-3">
                  {sec.subtitle && (
                    <p className="text-xs font-semibold tracking-wider" style={{ color: 'var(--brand-accent)' }}>
                      {sec.subtitle}
                    </p>
                  )}
                  <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-white text-balance">
                    {sec.title}
                  </h2>
                </div>
                <Link
                  to={sec.ctaLink || '/team'}
                  className="inline-flex items-center justify-center px-5 py-2.5 text-xs font-semibold btn-brand-outline whitespace-nowrap shrink-0"
                >
                  <FillButtonContent className="gap-2">
                    <span>{sec.ctaText || 'Meet Full Directory'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </FillButtonContent>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {staff
                  .filter((m) => m.employmentStatus === 'current')
                  .slice(0, 3)
                  .map((member, idx) => (
                    <motion.div
                      key={member._id}
                      initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
                      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      viewport={{ once: true, amount: 0.15 }}
                      transition={{ duration: 0.48, delay: idx * 0.08, ease: appleEase }}
                      className="rounded-[2px] apple-glass-card wise-card-motion overflow-hidden"
                    >
                      <div className="aspect-square overflow-hidden">
                        <MediaImage
                          src={member.photoUrl}
                          alt={member.fullName}
                          className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                        />
                      </div>
                      <div className="p-6 space-y-2">
                        <p className="text-xs font-medium" style={{ color: 'var(--brand-accent)' }}>
                          {member.department}
                        </p>
                        <h3 className="font-display text-2xl font-bold text-white">{member.fullName}</h3>
                        <p className="text-sm font-medium text-neutral-300">{member.jobTitle}</p>
                        <p className="text-xs leading-relaxed pt-1 line-clamp-3" style={{ color: 'var(--brand-muted)' }}>
                          {member.bio}
                        </p>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </div>
          </section>
        );

      case 'testimonials_section': {
        const pinboardNotes = stickyNotes
          .filter(
            (n) =>
              n.visible &&
              (n.pageSlug === 'home' || n.pageSlug === 'all') &&
              (n.displayMode === 'pinboard' || n.displayMode === 'both' || !n.displayMode)
          )
          .sort((a, b) => (a.zIndex || 20) - (b.zIndex || 20));

        return (
          <React.Fragment key={sec._id}>
            {pinboardNotes.length > 0 && (
              <section
                className="py-24 border-t relative overflow-hidden bg-transparent"
                style={{ borderColor: 'var(--brand-border)' }}
              >
                <div className="max-w-[1100px] mx-auto px-6">
                  <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
                    <p
                      className="text-xs font-semibold uppercase tracking-[0.2em]"
                      style={{ color: 'var(--brand-accent)' }}
                    >
                      Studio Culture &amp; Notes
                    </p>
                    <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-white text-balance">
                      Pinned From Our Production Floor
                    </h2>
                    <p className="text-sm text-neutral-400">
                      Notes, guiding principles, and snapshots pinned directly by the YRT Esports team.
                    </p>
                  </div>

                  {/* Desktop Overlapping Collage Board (Matches Reference Pinboard) */}
                  <div className="hidden md:block relative w-full max-w-[920px] h-[580px] mx-auto">
                    {pinboardNotes.map((note) => {
                      const isFocused = focusedStickerId === note._id;
                      return (
                        <motion.div
                          key={note._id}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, amount: 0.15 }}
                          transition={{ duration: 0.7, ease: appleEase }}
                          whileHover={{ scale: 1.04, y: -6 }}
                          onClick={() =>
                            setFocusedStickerId((prev) => (prev === note._id ? null : note._id))
                          }
                          style={{
                            left: `${Math.min(72, Math.max(1, note.x))}%`,
                            top: `${Math.min(62, Math.max(2, note.y))}%`,
                            width: `${note.width || 245}px`,
                            rotate: `${note.rotation || 0}deg`,
                            zIndex: isFocused ? 50 : note.zIndex || 20,
                          }}
                          className="absolute cursor-pointer transition-shadow"
                        >
                          <StickerCard note={note} />
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Mobile Responsive Grid */}
                  <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
                    {pinboardNotes.map((note) => (
                      <div
                        key={note._id}
                        className="mx-auto w-full max-w-[290px]"
                        style={{ transform: `rotate(${Math.max(-4, Math.min(4, note.rotation || 0))}deg)` }}
                      >
                        <StickerCard note={note} />
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            <section className="py-24 border-t" style={{ borderColor: 'var(--brand-border)' }}>
            <div className="max-w-[1280px] mx-auto px-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div className="max-w-2xl space-y-3">
                  {sec.subtitle && (
                    <p className="text-xs font-semibold tracking-wider" style={{ color: 'var(--brand-accent)' }}>
                      {sec.subtitle}
                    </p>
                  )}
                  <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-white text-balance">
                    {sec.title}
                  </h2>
                </div>
                <Link
                  to="/reviews"
                  className="inline-flex items-center justify-center px-5 py-2.5 text-xs font-semibold btn-brand-outline whitespace-nowrap shrink-0"
                >
                  <FillButtonContent className="gap-2">
                    <Star className="w-3.5 h-3.5" />
                    <span>Read &amp; Post Reviews</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </FillButtonContent>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {testimonials.slice(0, 3).map((item, idx) => (
                  <motion.blockquote
                    key={item._id}
                    initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
                    whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    viewport={{ once: true, amount: 0.15 }}
                    transition={{ duration: 0.48, delay: idx * 0.08, ease: appleEase }}
                    className="p-7 rounded-[2px] apple-glass-card wise-card-motion flex flex-col justify-between space-y-6"
                  >
                    <p className="text-sm leading-relaxed text-neutral-200">“{item.quote}”</p>
                    <div className="pt-4 border-t space-y-2" style={{ borderColor: 'var(--brand-border)' }}>
                      {item.outcomeMetric && (
                        <p className="text-xs font-semibold tabular-nums" style={{ color: 'var(--brand-accent)' }}>
                          {item.outcomeMetric}
                        </p>
                      )}
                      <div>
                        <div className="text-sm font-semibold text-white">{item.authorName}</div>
                        <div className="text-xs" style={{ color: 'var(--brand-muted)' }}>
                          {item.role} · {item.organization}
                        </div>
                      </div>
                    </div>
                  </motion.blockquote>
                ))}
              </div>
            </div>
          </section>
          </React.Fragment>
        );
      }

      case 'latest_blog':
        return (
          <section
            key={sec._id}
            className="py-24 border-t bg-transparent"
            style={{
              borderColor: 'var(--brand-border)',
            }}
          >
            <div className="max-w-[1280px] mx-auto px-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div className="max-w-2xl space-y-3">
                  {sec.subtitle && (
                    <p className="text-xs font-semibold tracking-wider" style={{ color: 'var(--brand-accent)' }}>
                      {sec.subtitle}
                    </p>
                  )}
                  <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-white text-balance">
                    {sec.title}
                  </h2>
                </div>
                <Link
                  to={sec.ctaLink || '/blog'}
                  className="inline-flex items-center justify-center px-5 py-2.5 text-xs font-semibold btn-brand-outline whitespace-nowrap shrink-0"
                >
                  <FillButtonContent className="gap-2">
                    <span>{sec.ctaText || 'Read All Articles'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </FillButtonContent>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {posts.slice(0, 3).map((post, idx) => (
                  <motion.div
                    key={post._id}
                    initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
                    whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    viewport={{ once: true, amount: 0.15 }}
                    transition={{ duration: 0.48, delay: idx * 0.08, ease: appleEase }}
                  >
                    <Link
                      to={`/blog/${post.slug}`}
                      className="group h-full rounded-[2px] apple-glass-card wise-card-motion flex flex-col"
                    >
                      <div className="aspect-[16/10] overflow-hidden">
                        <MediaImage
                          src={post.coverImageUrl}
                          alt={post.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                        <div>
                          <div className="flex items-center gap-2 text-xs mb-2 tabular-nums" style={{ color: 'var(--brand-muted)' }}>
                            <span>{post.category}</span>
                            <span aria-hidden="true">·</span>
                            <span>{post.publishedAt}</span>
                            <span aria-hidden="true">·</span>
                            <span>{post.readTime}</span>
                          </div>
                          <h3 className="font-display text-xl font-bold text-white group-hover:underline underline-offset-4">
                            {post.title}
                          </h3>
                          <p className="mt-2 text-sm line-clamp-2" style={{ color: 'var(--brand-muted)' }}>
                            {post.excerpt}
                          </p>
                        </div>
                        <div className="text-xs font-medium text-neutral-300">By {post.authorName}</div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        );

      case 'careers_callout':
        return (
          <section key={sec._id} className="py-20 border-t" style={{ borderColor: 'var(--brand-border)' }}>
            <div className="max-w-[1280px] mx-auto px-6">
              <motion.div
                initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
                whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.55, ease: appleEase }}
                className="p-8 md:p-12 rounded-[2px] apple-glass flex flex-col lg:flex-row lg:items-center justify-between gap-8"
              >
                <div className="max-w-2xl space-y-3">
                  {sec.subtitle && (
                    <p className="text-xs font-semibold tracking-wider" style={{ color: 'var(--brand-accent)' }}>
                      {sec.subtitle}
                    </p>
                  )}
                  <h2 className="font-display text-3xl md:text-4xl font-bold text-white text-balance">
                    {sec.title}
                  </h2>
                  <p className="text-sm md:text-base leading-relaxed" style={{ color: 'var(--brand-muted)' }}>
                    {sec.description}
                  </p>
                </div>
                <Link
                  to={sec.ctaLink || '/careers'}
                  className="inline-flex items-center justify-center px-6 py-3.5 text-sm font-semibold btn-brand whitespace-nowrap shrink-0 self-start lg:self-center"
                >
                  <FillButtonContent className="gap-2">
                    <span>{sec.ctaText || 'Explore Open Positions'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </FillButtonContent>
                </Link>
              </motion.div>
            </div>
          </section>
        );

      case 'contact_cta':
        return (
          <section key={sec._id} className="py-24 border-t bg-transparent" style={{ borderColor: 'var(--brand-border)' }}>
            <div className="max-w-[900px] mx-auto px-6 text-center space-y-6">
              {sec.subtitle && (
                <p className="text-xs font-semibold tracking-wider" style={{ color: 'var(--brand-accent)' }}>
                  {sec.subtitle}
                </p>
              )}
              <h2 className="font-display text-4xl md:text-6xl font-bold tracking-tight text-white text-balance">
                {sec.title}
              </h2>
              <p className="text-base leading-relaxed max-w-2xl mx-auto" style={{ color: 'var(--brand-muted)' }}>
                {sec.description}
              </p>
              <div className="pt-2 flex flex-wrap justify-center gap-4">
                <Link
                  to={sec.ctaLink || '/contact'}
                  className="inline-flex items-center justify-center px-7 py-4 text-sm font-semibold btn-brand"
                >
                  <FillButtonContent className="gap-2">
                    <span>{sec.ctaText || 'Request Production Proposal'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </FillButtonContent>
                </Link>
              </div>
            </div>
          </section>
        );

      default:
        return <CustomSectionBlock key={sec._id} section={sec} />;
    }
  };

  return (
    <div>
      {isPreview && (
        <div className="fixed bottom-4 left-4 z-50 px-4 py-2 bg-amber-500 text-black text-xs font-semibold shadow-lg rounded-[2px]">
          Draft Preview Mode Active — Viewing unpublished sections for {settings?.organizationName}
        </div>
      )}

      {sections.map(renderSection)}
      {!sections.some((s) => s.sectionKey === 'services_showcase') && <GlobalNetworkMap />}
      {!sections.some((s) => s.sectionKey === 'partners_strip') && (
        <section className="py-16 border-t" style={{ borderColor: 'var(--brand-border)' }}>
          <div className="max-w-[1280px] mx-auto px-6 space-y-8">
            <div className="text-center max-w-2xl mx-auto">
              <p className="text-xs font-semibold tracking-wider mb-2" style={{ color: 'var(--brand-accent)' }}>
                Brands &amp; Ecosystem Partners
              </p>
              <h2 className="font-display text-2xl md:text-4xl font-bold text-white">
                Trusted by Global Brands &amp; Publishers
              </h2>
            </div>
            <BrandLogoCarousel partners={partners} />
          </div>
        </section>
      )}
    </div>
  );
};

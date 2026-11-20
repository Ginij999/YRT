import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Play, MapPin, Calendar, Sparkles, Star } from 'lucide-react';
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
import { StackedServiceDeck } from '../components/StackedServiceDeck';
import { BrandLogoCarousel, SupportedGamesMarquee } from '../components/ShowcaseMarquees';

const appleEase: [number, number, number, number] = [0.22, 1, 0.36, 1];
const HOME_CACHE_KEY = 'yrt_home_cache_v2';

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

function readHomeCache(): HomeCachePayload | null {
  try {
    const raw = localStorage.getItem(HOME_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as HomeCachePayload;
  } catch {
    return null;
  }
}

export const HomePage: React.FC = () => {
  const { settings, apiFetch } = useSite();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === 'true';

  usePageSeo('home');

  const initialCache = !isPreview ? readHomeCache() : null;
  const [sections, setSections] = useState<PageSection[]>(() => initialCache?.sections || []);
  const [services, setServices] = useState<ServiceItem[]>(() => initialCache?.services || []);
  const [events, setEvents] = useState<EventItem[]>(() => initialCache?.events || []);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(() => initialCache?.portfolio || []);
  const [partners, setPartners] = useState<Partner[]>(() => initialCache?.partners || []);
  const [staff, setStaff] = useState<StaffMember[]>(() => initialCache?.staff || []);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(() => initialCache?.testimonials || []);
  const [posts, setPosts] = useState<BlogPost[]>(() => initialCache?.posts || []);
  const [loading, setLoading] = useState(!initialCache);

  useEffect(() => {
    const pageUrl = isPreview ? '/api/public/pages/home?preview=true' : '/api/public/pages/home';
    Promise.all([
      apiFetch(pageUrl).then((r) => r.json()),
      fetch('/api/public/services').then((r) => r.json()),
      fetch('/api/public/events').then((r) => r.json()),
      fetch('/api/public/portfolio').then((r) => r.json()),
      fetch('/api/public/partners').then((r) => r.json()),
      fetch('/api/public/staff').then((r) => r.json()),
      fetch('/api/public/testimonials').then((r) => r.json()),
      fetch('/api/public/blog').then((r) => r.json()),
    ])
      .then(([pageData, svc, evt, port, part, stf, test, blg]) => {
        const nextPayload: HomeCachePayload = {
          sections: pageData.sections || [],
          services: Array.isArray(svc) ? svc : [],
          events: Array.isArray(evt) ? evt : [],
          portfolio: Array.isArray(port) ? port : [],
          partners: Array.isArray(part) ? part : [],
          staff: Array.isArray(stf) ? stf : [],
          testimonials: Array.isArray(test) ? test : [],
          posts: Array.isArray(blg) ? blg : [],
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
      .catch((err) => console.error('Home data load failed:', err))
      .finally(() => setLoading(false));
  }, [isPreview, apiFetch]);

  const renderSection = (sec: PageSection) => {
    switch (sec.sectionKey) {
      case 'hero':
        return (
          <React.Fragment key={sec._id}>
            <section className="relative min-h-[90vh] flex items-end pt-32 pb-20 overflow-hidden">
              {/* Background Image or Video + Wise Ambient Light */}
              <div className="absolute inset-0 z-0">
                {sec.videoUrl ? (
                  <video
                    src={sec.videoUrl}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover opacity-65"
                  />
                ) : (
                  <MediaImage
                    src={sec.imageUrl}
                    alt={sec.title}
                    loading="eager"
                    className="w-full h-full object-cover scale-[1.03] opacity-65"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#08080A] via-[#08080A]/65 to-[#08080A]/35" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#08080A]/90 via-[#08080A]/50 to-transparent" />
                <div
                  className="pointer-events-none absolute -bottom-24 -left-24 w-[460px] h-[460px] rounded-full blur-[140px] opacity-25 animate-float-slow"
                  style={{ backgroundColor: 'var(--brand-accent)' }}
                />
              </div>

              <div className="relative z-10 max-w-[1280px] w-full mx-auto px-6">
                <motion.div
                  initial={{ opacity: 0, y: 26, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.72, ease: appleEase }}
                  className="max-w-3xl space-y-6"
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.94, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    transition={{ duration: 0.45, delay: 0.1, ease: appleEase }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full apple-glass-pill text-xs font-semibold text-white"
                  >
                    <MapPin className="w-3.5 h-3.5" style={{ color: 'var(--brand-accent)' }} />
                    <span>{sec.subtitle || 'Kathmandu, Nepal (KTM HQ) · Global Esports Studio'}</span>
                  </motion.div>

                  <motion.h1
                    initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ duration: 0.65, delay: 0.15, ease: appleEase }}
                    className="font-display font-bold tracking-tight text-white text-balance leading-[1.01]"
                    style={{ fontSize: 'clamp(2.65rem, 5.5vw, 4.75rem)' }}
                  >
                    {sec.title}
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ duration: 0.6, delay: 0.22, ease: appleEase }}
                    className="text-base md:text-lg leading-relaxed max-w-2xl text-neutral-200"
                  >
                    {sec.description}
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, delay: 0.3, ease: appleEase }}
                    className="pt-2 flex flex-wrap items-center gap-4"
                  >
                    {sec.ctaText && (
                      <Link
                        to={sec.ctaLink || '/contact'}
                        className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold btn-brand whitespace-nowrap"
                      >
                        <span>{sec.ctaText}</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                    {sec.secondaryCtaText && (
                      <Link
                        to={sec.secondaryCtaLink || '/portfolio'}
                        className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold btn-brand-outline whitespace-nowrap"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>{sec.secondaryCtaText}</span>
                      </Link>
                    )}
                  </motion.div>
                </motion.div>
              </div>
            </section>
            <SupportedGamesMarquee />
          </React.Fragment>
        );

      case 'organization_intro':
        return (
          <section
            key={sec._id}
            className="py-24 border-t relative overflow-hidden"
            style={{
              backgroundColor: 'rgba(10, 10, 14, 0.45)',
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
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold btn-brand-outline rounded-xl"
                  >
                    <span>{sec.ctaText || 'Learn About Our Agency'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 24, scale: 0.97, filter: 'blur(6px)' }}
                whileInView={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, ease: appleEase }}
                className="lg:col-span-6 min-h-[320px] lg:min-h-[420px] rounded-3xl apple-glass overflow-hidden"
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
            <section
              className="py-24 relative overflow-hidden border-t"
              style={{
                backgroundColor: 'rgba(14, 14, 20, 0.58)',
                borderColor: 'var(--brand-border)',
              }}
            >
              <div className="max-w-[1280px] mx-auto px-6 relative z-10">
                <motion.div
                  initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
                  whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, ease: appleEase }}
                  className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"
                >
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
                    to={sec.ctaLink || '/services'}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold btn-brand-outline whitespace-nowrap shrink-0"
                  >
                    <span>{sec.ctaText || 'View All Services'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </motion.div>

                {/* Stacked / Overlapping Flash-Card Capability Deck */}
                <StackedServiceDeck services={services} />

                {/* Full Service Grid (Esports, Jersey Printing & Design, Gaming, Creative Production) */}
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
                        className="group h-full p-7 rounded-2xl apple-glass-card wise-card-motion flex flex-col justify-between"
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
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold btn-brand-outline whitespace-nowrap shrink-0"
                >
                  <span>{sec.ctaText || 'Full Event Calendar'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
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
                      className="group h-full rounded-2xl apple-glass-card wise-card-motion flex flex-col"
                    >
                      <div className="aspect-[16/10] relative overflow-hidden">
                        <MediaImage
                          src={evt.bannerUrl}
                          alt={evt.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-neutral-200 tabular-nums">
                          <span className="capitalize font-semibold px-2.5 py-0.5 rounded-full apple-glass-pill">
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
            className="py-24 border-t"
            style={{
              backgroundColor: 'rgba(14, 14, 20, 0.56)',
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
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold btn-brand-outline whitespace-nowrap shrink-0"
                >
                  <span>{sec.ctaText || 'Browse Full Portfolio'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
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
                      className={`group h-full rounded-3xl apple-glass-card wise-card-motion flex flex-col ${
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
            className="py-24 border-t"
            style={{
              backgroundColor: 'rgba(14, 14, 20, 0.56)',
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
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold btn-brand-outline whitespace-nowrap shrink-0"
                >
                  <span>{sec.ctaText || 'Meet Full Directory'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
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
                      className="rounded-2xl apple-glass-card wise-card-motion overflow-hidden"
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

      case 'testimonials_section':
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
                    {sec.title}
                  </h2>
                </div>
                <Link
                  to="/reviews"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold btn-brand-outline whitespace-nowrap shrink-0"
                >
                  <Star className="w-3.5 h-3.5" />
                  <span>Read &amp; Post Reviews</span>
                  <ArrowRight className="w-3.5 h-3.5" />
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
                    className="p-7 rounded-2xl apple-glass-card wise-card-motion flex flex-col justify-between space-y-6"
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
        );

      case 'latest_blog':
        return (
          <section
            key={sec._id}
            className="py-24 border-t"
            style={{
              backgroundColor: 'rgba(14, 14, 20, 0.56)',
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
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold btn-brand-outline whitespace-nowrap shrink-0"
                >
                  <span>{sec.ctaText || 'Read All Articles'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
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
                      className="group h-full rounded-2xl apple-glass-card wise-card-motion flex flex-col"
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
                className="p-8 md:p-12 rounded-3xl apple-glass flex flex-col lg:flex-row lg:items-center justify-between gap-8"
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
                  className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold btn-brand whitespace-nowrap shrink-0 self-start lg:self-center"
                >
                  <span>{sec.ctaText || 'Explore Open Positions'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            </div>
          </section>
        );

      case 'contact_cta':
        return (
          <section key={sec._id} className="py-24 border-t" style={{ borderColor: 'var(--brand-border)' }}>
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
                  className="inline-flex items-center gap-2 px-7 py-4 text-sm font-semibold btn-brand"
                >
                  <span>{sec.ctaText || 'Request Production Proposal'}</span>
                  <ArrowRight className="w-4 h-4" />
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
        <div className="fixed bottom-4 left-4 z-50 px-4 py-2 bg-amber-500 text-black text-xs font-semibold shadow-lg rounded-lg">
          Draft Preview Mode Active — Viewing unpublished sections for {settings?.organizationName}
        </div>
      )}

      {loading && sections.length === 0 ? (
        <div className="min-h-screen pt-32 px-6 max-w-[1280px] mx-auto space-y-6">
          <div className="h-16 w-2/3 bg-white/5 rounded-xl" />
          <div className="h-6 w-1/2 bg-white/5 rounded-xl" />
          <div className="h-96 w-full bg-white/5 rounded-2xl" />
        </div>
      ) : sections.length === 0 ? (
        <>
          <section className="min-h-[65vh] flex items-center justify-center px-6 pt-32 pb-16">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.55, ease: appleEase }}
              className="max-w-xl w-full text-center space-y-6 p-10 rounded-3xl apple-glass"
            >
              <img
                src={settings?.logoDarkUrl || settings?.logoLightUrl || '/logo.png'}
                alt={settings?.organizationName || 'YRT Esports'}
                className="h-24 w-24 object-contain mx-auto"
              />
              <h1 className="font-display text-4xl font-bold text-white">
                {settings?.organizationName || 'YRT Esports'}
              </h1>
              <p className="text-sm text-neutral-300 leading-relaxed">
                {settings?.tagline ||
                  'Kathmandu, Nepal (KTM HQ) · Esports Production, Creative Agency & Brand Partnerships.'}
              </p>
              <div className="pt-2 flex flex-wrap justify-center gap-3">
                <Link to="/contact" className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold btn-brand">
                  <Sparkles className="w-4 h-4" />
                  <span>Contact Kathmandu HQ</span>
                </Link>
              </div>
            </motion.div>
          </section>
          <SupportedGamesMarquee />
          <GlobalNetworkMap />
        </>
      ) : (
        <>
          {sections.map(renderSection)}
          {!sections.some((s) => s.sectionKey === 'hero') && <SupportedGamesMarquee />}
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
        </>
      )}
    </div>
  );
};

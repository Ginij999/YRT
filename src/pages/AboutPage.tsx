import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { usePageSeo, useSite } from '../context/SiteContext';
import { PageSection, StaffMember } from '../types/cms';
import { MediaImage } from '../components/MediaImage';
import { CustomSectionBlock } from '../components/DynamicExtraSections';
import { GlobalNetworkMap } from '../components/GlobalNetworkMap';

export const AboutPage: React.FC = () => {
  const { apiFetch } = useSite();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === 'true';

  usePageSeo('about');

  const [sections, setSections] = useState<PageSection[]>([]);
  const [homeStats, setHomeStats] = useState<PageSection | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);

  useEffect(() => {
    const url = isPreview ? '/api/public/pages/about?preview=true' : '/api/public/pages/about';
    Promise.all([
      apiFetch(url).then((r) => r.json()),
      fetch('/api/public/pages/home').then((r) => r.json()),
      fetch('/api/public/staff').then((r) => r.json()),
    ])
      .then(([aboutData, homeData, staffData]) => {
        setSections(aboutData.sections || []);
        const statsSec = (homeData.sections || []).find((s: PageSection) => s.sectionKey === 'company_stats');
        setHomeStats(statsSec || null);
        setStaff(Array.isArray(staffData) ? staffData : []);
      })
      .catch(() => {});
  }, [isPreview, apiFetch]);

  const heroSection = sections.find((s) => s.sectionKey === 'about_hero');
  const missionSection = sections.find((s) => s.sectionKey === 'mission_vision');
  const timelineSection = sections.find((s) => s.sectionKey === 'company_timeline');
  const gallerySection = sections.find((s) => s.sectionKey === 'org_gallery');
  const extraSections = sections.filter(
    (s) => !['about_hero', 'mission_vision', 'company_timeline', 'org_gallery'].includes(s.sectionKey)
  );

  const leaders = staff.filter((s) => s.employmentStatus === 'current').slice(0, 3);

  return (
    <div className="pt-24 pb-20">
      {/* Intro & History */}
      {heroSection && (
        <section className="py-16">
          <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-6 flex flex-col justify-center space-y-5"
            >
              {heroSection.subtitle && (
                <p className="text-xs font-semibold tracking-wider" style={{ color: 'var(--brand-accent)' }}>
                  {heroSection.subtitle}
                </p>
              )}
              <h1
                className="font-display font-bold tracking-tight text-white text-balance leading-[1.05]"
                style={{ fontSize: 'clamp(2.25rem, 4.2vw, 3.75rem)' }}
              >
                {heroSection.title}
              </h1>
              <p className="text-base leading-relaxed" style={{ color: 'var(--brand-muted)' }}>
                {heroSection.description}
              </p>
              <div className="pt-2 flex flex-wrap gap-4">
                <Link to="/services" className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold btn-brand">
                  <span>Our Capabilities</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/team" className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold btn-brand-outline">
                  <span>Full Staff Directory</span>
                </Link>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-6 min-h-[340px] rounded-3xl apple-glass overflow-hidden"
            >
              <MediaImage src={heroSection.imageUrl} alt={heroSection.title} loading="eager" />
            </motion.div>
          </div>
        </section>
      )}

      {/* Company Stats */}
      {homeStats && <CustomSectionBlock section={homeStats} />}

      {/* Mission, Vision & Core Values */}
      {missionSection && (
        <section className="py-24" style={{ backgroundColor: 'var(--brand-surface)' }}>
          <div className="max-w-[1280px] mx-auto px-6">
            <div className="max-w-2xl mb-12 space-y-3">
              {missionSection.subtitle && (
                <p className="text-xs font-semibold tracking-wider" style={{ color: 'var(--brand-accent)' }}>
                  {missionSection.subtitle}
                </p>
              )}
              <h2 className="font-display text-3xl md:text-5xl font-bold text-white text-balance">
                {missionSection.title}
              </h2>
              <p className="text-sm md:text-base" style={{ color: 'var(--brand-muted)' }}>
                {missionSection.description}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(missionSection.items || []).map((item, idx) => (
                <motion.div
                  key={item.id || idx}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45, delay: idx * 0.06 }}
                  className="p-8 rounded-2xl apple-glass-card space-y-3"
                >
                  <span className="font-mono-num text-xs" style={{ color: 'var(--brand-accent)' }}>
                    {String(idx + 1).padStart(2, '0')}.
                  </span>
                  <h3 className="font-display text-2xl font-bold text-white">{item.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--brand-muted)' }}>
                    {item.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Kathmandu, Nepal Interactive Global Map */}
      <GlobalNetworkMap />

      {/* Leadership Team */}
      {leaders.length > 0 && (
        <section className="py-24 border-t" style={{ borderColor: 'var(--brand-border)' }}>
          <div className="max-w-[1280px] mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div className="space-y-2">
                <p className="text-xs font-semibold tracking-wider" style={{ color: 'var(--brand-accent)' }}>
                  Executive Leadership
                </p>
                <h2 className="font-display text-3xl md:text-4xl font-bold text-white">
                  Directed by Industry Veterans
                </h2>
              </div>
              <Link to="/team" className="text-sm font-semibold text-white inline-flex items-center gap-1.5 hover:underline">
                <span>View Full Team</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {leaders.map((leader) => (
                <div
                  key={leader._id}
                  className="border overflow-hidden"
                  style={{ backgroundColor: 'var(--brand-surface)', borderColor: 'var(--brand-border)' }}
                >
                  <div className="aspect-square overflow-hidden">
                    <MediaImage src={leader.photoUrl} alt={leader.fullName} />
                  </div>
                  <div className="p-6 space-y-2">
                    <p className="text-xs font-medium" style={{ color: 'var(--brand-accent)' }}>
                      {leader.department}
                    </p>
                    <h3 className="font-display text-2xl font-bold text-white">{leader.fullName}</h3>
                    <p className="text-sm text-neutral-300">{leader.jobTitle}</p>
                    <p className="text-xs leading-relaxed pt-1" style={{ color: 'var(--brand-muted)' }}>
                      {leader.bio}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Company Timeline */}
      {timelineSection && (
        <section
          className="py-24 border-t"
          style={{ backgroundColor: 'var(--brand-surface)', borderColor: 'var(--brand-border)' }}
        >
          <div className="max-w-[1280px] mx-auto px-6">
            <div className="max-w-2xl mb-12 space-y-3">
              {timelineSection.subtitle && (
                <p className="text-xs font-semibold tracking-wider" style={{ color: 'var(--brand-accent)' }}>
                  {timelineSection.subtitle}
                </p>
              )}
              <h2 className="font-display text-3xl md:text-5xl font-bold text-white text-balance">
                {timelineSection.title}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {(timelineSection.items || []).map((step, idx) => (
                <div
                  key={step.id || idx}
                  className="p-6 border space-y-3"
                  style={{ backgroundColor: 'var(--brand-bg)', borderColor: 'var(--brand-border)' }}
                >
                  <div className="font-mono-num text-2xl font-bold tabular-nums" style={{ color: 'var(--brand-accent)' }}>
                    {step.year}
                  </div>
                  <h3 className="font-display text-xl font-bold text-white">{step.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--brand-muted)' }}>
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Organization Gallery */}
      {gallerySection && (
        <section className="py-24 border-t" style={{ borderColor: 'var(--brand-border)' }}>
          <div className="max-w-[1280px] mx-auto px-6">
            <div className="max-w-2xl mb-12 space-y-2">
              {gallerySection.subtitle && (
                <p className="text-xs font-semibold tracking-wider" style={{ color: 'var(--brand-accent)' }}>
                  {gallerySection.subtitle}
                </p>
              )}
              <h2 className="font-display text-3xl md:text-4xl font-bold text-white">
                {gallerySection.title}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(gallerySection.items || []).map((g, idx) => (
                <div
                  key={g.id || idx}
                  className="border overflow-hidden"
                  style={{ backgroundColor: 'var(--brand-surface)', borderColor: 'var(--brand-border)' }}
                >
                  <div className="aspect-[16/10] overflow-hidden">
                    <MediaImage src={g.imageUrl} alt={g.title || 'Gallery photo'} />
                  </div>
                  <div className="p-5 flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-white">{g.title}</span>
                    {g.meta && <span style={{ color: 'var(--brand-muted)' }}>{g.meta}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {extraSections.map((sec) => (
        <CustomSectionBlock key={sec._id} section={sec} />
      ))}
    </div>
  );
};

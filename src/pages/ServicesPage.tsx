import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { usePageSeo } from '../context/SiteContext';
import { PageSection, ServiceItem } from '../types/cms';
import { MediaImage } from '../components/MediaImage';
import { CustomSectionBlock } from '../components/DynamicExtraSections';
import { FillButtonContent } from '../components/FillButtonContent';
import { StickyServicesStack } from '../components/StickyServicesStack';
import { ErrorPage } from './ErrorPage';
import { FALLBACK_PAGE_SECTIONS, FALLBACK_SERVICES, safeFetchJson } from '../data/fallbackData';

const SLUG_ALIASES: Record<string, string> = {
  'esports-production': 'live-broadcast-production',
  'esports-marketing': 'designer-creative-production',
  'event-execution': 'tournament-production',
};

export const ServicesPage: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  const [services, setServices] = useState<ServiceItem[]>(FALLBACK_SERVICES);
  const [headerSec, setHeaderSec] = useState<PageSection | null>(FALLBACK_PAGE_SECTIONS.services[0]);
  const [extraSections, setExtraSections] = useState<PageSection[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      safeFetchJson<ServiceItem[]>('/api/public/services', FALLBACK_SERVICES),
      safeFetchJson<{ sections?: PageSection[] }>('/api/public/pages/services', {
        sections: FALLBACK_PAGE_SECTIONS.services,
      }),
    ])
      .then(([svcData, pageData]) => {
        setServices(Array.isArray(svcData) && svcData.length > 0 ? svcData : FALLBACK_SERVICES);
        const secs: PageSection[] = pageData.sections || FALLBACK_PAGE_SECTIONS.services;
        setHeaderSec(secs.find((s) => s.sectionKey === 'services_header') || FALLBACK_PAGE_SECTIONS.services[0]);
        setExtraSections(secs.filter((s) => s.sectionKey !== 'services_header'));
      })
      .finally(() => setLoading(false));
  }, []);

  const normalizedSlug = slug ? SLUG_ALIASES[slug] || slug : undefined;
  const activeService = normalizedSlug ? services.find((s) => s.slug === normalizedSlug) : null;
  usePageSeo(
    'services',
    activeService ? `${activeService.title} – Services` : undefined,
    activeService ? activeService.shortDescription : undefined
  );

  if (slug && !loading && !activeService) {
    return <ErrorPage code="404" />;
  }

  if (slug && activeService) {
    return (
      <div className="pt-28 pb-24 bg-transparent">
        <div className="max-w-[1280px] mx-auto px-6">
          <Link
            to="/services"
            className="inline-flex items-center gap-2 text-xs font-semibold mb-8 text-neutral-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Services</span>
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch mb-16">
            <div className="lg:col-span-6 flex flex-col justify-center space-y-5">
              <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: 'var(--brand-accent)' }}>
                Specialized Capability
              </p>
              <h1
                className="font-display font-bold tracking-tight text-white text-balance leading-[1.05]"
                style={{ fontSize: 'clamp(2.25rem, 4.2vw, 3.75rem)' }}
              >
                {activeService.title}
              </h1>
              <p className="text-base leading-relaxed text-neutral-300">
                {activeService.fullDescription}
              </p>
              <div className="pt-3">
                <Link
                  to={`/contact?category=${encodeURIComponent(activeService.title)}`}
                  className="inline-flex items-center justify-center px-6 py-3.5 text-sm font-semibold btn-brand"
                >
                  <FillButtonContent className="gap-2">
                    <span>Request Proposal for {activeService.title}</span>
                    <ArrowRight className="w-4 h-4" />
                  </FillButtonContent>
                </Link>
              </div>
            </div>
            <div className="lg:col-span-6 min-h-[320px] rounded-[2px] border border-white/15 bg-[#13141c] overflow-hidden">
              <MediaImage src={activeService.imageUrl} alt={activeService.title} loading="eager" />
            </div>
          </div>

          {/* Deliverables & Process */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 py-14 border-t border-white/15">
            <div className="lg:col-span-5 space-y-5">
              <h2 className="font-display text-2xl font-bold text-white">Core Deliverables</h2>
              <ul className="space-y-3">
                {activeService.deliverables.map((item, i) => (
                  <li
                    key={i}
                    className="p-4 rounded-[2px] border border-white/15 bg-[#13141c] flex items-start gap-3 text-sm text-neutral-100"
                  >
                    <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--brand-accent)' }} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-7 space-y-5">
              <h2 className="font-display text-2xl font-bold text-white">Execution Methodology</h2>
              <div className="space-y-4">
                {activeService.processSteps.map((step, i) => (
                  <div
                    key={i}
                    className="p-6 rounded-[2px] border border-white/15 bg-[#13141c] space-y-2"
                  >
                    <span className="font-mono-num text-xs" style={{ color: 'var(--brand-accent)' }}>
                      Phase {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className="font-display text-xl font-bold text-white">{step.title}</h3>
                    <p className="text-sm leading-relaxed text-neutral-300">
                      {step.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-12 pb-16 bg-transparent">
      <StickyServicesStack
        services={services}
        mode="full"
        eyebrow={headerSec?.subtitle || 'What we do'}
        description={
          headerSec?.description ||
          'YRT Esports operates from Kathmandu HQ to plan competitive tournaments, produce and broadcast live streams, print pro-team jerseys, and grow publisher campaigns.'
        }
        ctaText="Start a Project"
        ctaLink="/contact"
      />

      {extraSections.map((sec) => (
        <CustomSectionBlock key={sec._id} section={sec} />
      ))}
    </div>
  );
};


import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { usePageSeo } from '../context/SiteContext';
import { PageSection, ServiceItem } from '../types/cms';
import { MediaImage } from '../components/MediaImage';
import { CustomSectionBlock } from '../components/DynamicExtraSections';
import { ErrorPage } from './ErrorPage';
import { FALLBACK_PAGE_SECTIONS, FALLBACK_SERVICES, safeFetchJson } from '../data/fallbackData';

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

  const activeService = slug ? services.find((s) => s.slug === slug) : null;
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
      <div className="pt-28 pb-24">
        <div className="max-w-[1280px] mx-auto px-6">
          <Link
            to="/services"
            className="inline-flex items-center gap-2 text-xs font-semibold mb-8 hover:text-white transition-colors"
            style={{ color: 'var(--brand-muted)' }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Services</span>
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch mb-16">
            <div className="lg:col-span-6 flex flex-col justify-center space-y-5">
              <p className="text-xs font-semibold tracking-wider" style={{ color: 'var(--brand-accent)' }}>
                Specialized Capability
              </p>
              <h1
                className="font-display font-bold tracking-tight text-white text-balance leading-[1.05]"
                style={{ fontSize: 'clamp(2.25rem, 4.2vw, 3.75rem)' }}
              >
                {activeService.title}
              </h1>
              <p className="text-base leading-relaxed" style={{ color: 'var(--brand-muted)' }}>
                {activeService.fullDescription}
              </p>
              <div className="pt-3">
                <Link
                  to={`/contact?category=${encodeURIComponent(activeService.title)}`}
                  className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold btn-brand"
                >
                  <span>Request Proposal for {activeService.title}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
            <div className="lg:col-span-6 min-h-[320px] border overflow-hidden" style={{ borderColor: 'var(--brand-border)' }}>
              <MediaImage src={activeService.imageUrl} alt={activeService.title} loading="eager" />
            </div>
          </div>

          {/* Deliverables & Process */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 py-14 border-t" style={{ borderColor: 'var(--brand-border)' }}>
            <div className="lg:col-span-5 space-y-5">
              <h2 className="font-display text-2xl font-bold text-white">Core Deliverables</h2>
              <ul className="space-y-3">
                {activeService.deliverables.map((item, i) => (
                  <li
                    key={i}
                    className="p-4 border flex items-start gap-3 text-sm text-neutral-200"
                    style={{ backgroundColor: 'var(--brand-surface)', borderColor: 'var(--brand-border)' }}
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
                    className="p-6 border space-y-2"
                    style={{ backgroundColor: 'var(--brand-surface)', borderColor: 'var(--brand-border)' }}
                  >
                    <span className="font-mono-num text-xs" style={{ color: 'var(--brand-accent)' }}>
                      Phase {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className="font-display text-xl font-bold text-white">{step.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--brand-muted)' }}>
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
    <div className="pt-28 pb-24">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="max-w-3xl mb-14 space-y-4">
          <p className="text-xs font-semibold tracking-wider" style={{ color: 'var(--brand-accent)' }}>
            {headerSec?.subtitle || 'Services'}
          </p>
          <h1
            className="font-display font-bold tracking-tight text-white text-balance leading-[1.05]"
            style={{ fontSize: 'clamp(2.25rem, 4.2vw, 3.75rem)' }}
          >
            {headerSec?.title || 'End-to-End Esports Production & Advisory'}
          </h1>
          <p className="text-base leading-relaxed" style={{ color: 'var(--brand-muted)' }}>
            {headerSec?.description}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-64 bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((svc, idx) => (
              <Link
                key={svc._id}
                to={`/services/${svc.slug}`}
                className="group border overflow-hidden flex flex-col justify-between transition-colors"
                style={{ backgroundColor: 'var(--brand-surface)', borderColor: 'var(--brand-border)' }}
              >
                <div className="aspect-[16/9] overflow-hidden border-b" style={{ borderColor: 'var(--brand-border)' }}>
                  <MediaImage
                    src={svc.imageUrl}
                    alt={svc.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-7 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <span className="font-mono-num text-xs" style={{ color: 'var(--brand-accent)' }}>
                      {String(idx + 1).padStart(2, '0')}.
                    </span>
                    <h2 className="font-display text-2xl md:text-3xl font-bold text-white group-hover:underline underline-offset-4">
                      {svc.title}
                    </h2>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--brand-muted)' }}>
                      {svc.shortDescription}
                    </p>
                  </div>
                  <div className="pt-4 border-t flex items-center justify-between text-xs font-semibold text-white" style={{ borderColor: 'var(--brand-border)' }}>
                    <span>View Deliverables &amp; Process</span>
                    <ArrowRight className="w-4 h-4" style={{ color: 'var(--brand-accent)' }} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {extraSections.map((sec) => (
        <CustomSectionBlock key={sec._id} section={sec} />
      ))}
    </div>
  );
};

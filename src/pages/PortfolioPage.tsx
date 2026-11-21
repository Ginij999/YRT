import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ExternalLink, MapPin, Calendar, X, Play } from 'lucide-react';
import { usePageSeo } from '../context/SiteContext';
import { PageSection, PortfolioItem } from '../types/cms';
import { MediaImage } from '../components/MediaImage';
import { CustomSectionBlock } from '../components/DynamicExtraSections';
import { FillButtonContent } from '../components/FillButtonContent';
import { FALLBACK_PAGE_SECTIONS, FALLBACK_PORTFOLIO, safeFetchJson } from '../data/fallbackData';

export const PortfolioPage: React.FC = () => {
  usePageSeo('portfolio');
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState<PortfolioItem[]>(FALLBACK_PORTFOLIO);
  const [headerSec, setHeaderSec] = useState<PageSection | null>(
    FALLBACK_PAGE_SECTIONS.portfolio[0] || null
  );
  const [extraSections, setExtraSections] = useState<PageSection[]>([]);
  const [loading, setLoading] = useState(false);

  const [categoryFilter, setCategoryFilter] = useState('All');
  const [gameFilter, setGameFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  useEffect(() => {
    Promise.all([
      safeFetchJson<PortfolioItem[]>('/api/public/portfolio', FALLBACK_PORTFOLIO),
      safeFetchJson<{ sections?: PageSection[] }>('/api/public/pages/portfolio', {
        sections: FALLBACK_PAGE_SECTIONS.portfolio,
      }),
    ])
      .then(([portData, pageData]) => {
        if (Array.isArray(portData) && portData.length > 0) {
          setProjects(portData);
        }
        const secs: PageSection[] = pageData?.sections || FALLBACK_PAGE_SECTIONS.portfolio;
        setHeaderSec(secs.find((s) => s.sectionKey === 'portfolio_header') || null);
        setExtraSections(secs.filter((s) => s.sectionKey !== 'portfolio_header'));
      })
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => ['All', ...Array.from(new Set(projects.map((p) => p.category)))], [projects]);
  const games = useMemo(() => ['All', ...Array.from(new Set(projects.map((p) => p.gameTitle)))], [projects]);
  const years = useMemo(() => ['All', ...Array.from(new Set(projects.map((p) => String(p.year))))], [projects]);
  const projectTypes = useMemo(() => ['All', ...Array.from(new Set(projects.map((p) => p.projectType)))], [projects]);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (categoryFilter !== 'All' && p.category !== categoryFilter) return false;
      if (gameFilter !== 'All' && p.gameTitle !== gameFilter) return false;
      if (yearFilter !== 'All' && String(p.year) !== yearFilter) return false;
      if (typeFilter !== 'All' && p.projectType !== typeFilter) return false;
      return true;
    });
  }, [projects, categoryFilter, gameFilter, yearFilter, typeFilter]);

  const selectedSlug = searchParams.get('project');
  const selectedProject = projects.find((p) => p.slug === selectedSlug) || null;
  const [activeMedia, setActiveMedia] = useState<string | null>(null);

  useEffect(() => {
    if (selectedProject) {
      setActiveMedia(selectedProject.coverUrl || selectedProject.thumbnailUrl);
    }
  }, [selectedProject]);

  return (
    <div className="pt-28 pb-24">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="max-w-3xl mb-12 space-y-4">
          <p className="text-xs font-semibold tracking-wider" style={{ color: 'var(--brand-accent)' }}>
            {headerSec?.subtitle || 'Our Work'}
          </p>
          <h1
            className="font-display font-bold tracking-tight text-white text-balance leading-[1.05]"
            style={{ fontSize: 'clamp(2.25rem, 4.2vw, 3.75rem)' }}
          >
            {headerSec?.title || 'Championships, Broadcasts & Activations'}
          </h1>
          <p className="text-base leading-relaxed" style={{ color: 'var(--brand-muted)' }}>
            {headerSec?.description}
          </p>
        </div>

        {/* Multi-Dimensional Filter Controls */}
        <div
          className="p-5 border mb-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          style={{ backgroundColor: 'var(--brand-surface)', borderColor: 'var(--brand-border)' }}
        >
          <div>
            <label className="block text-xs mb-1.5" style={{ color: 'var(--brand-muted)' }}>
              Event Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-black/40 border text-white"
              style={{ borderColor: 'var(--brand-border)' }}
            >
              {categories.map((c) => (
                <option key={c} value={c} className="bg-neutral-900">
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs mb-1.5" style={{ color: 'var(--brand-muted)' }}>
              Game Title
            </label>
            <select
              value={gameFilter}
              onChange={(e) => setGameFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-black/40 border text-white"
              style={{ borderColor: 'var(--brand-border)' }}
            >
              {games.map((g) => (
                <option key={g} value={g} className="bg-neutral-900">
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs mb-1.5" style={{ color: 'var(--brand-muted)' }}>
              Year
            </label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-black/40 border text-white"
              style={{ borderColor: 'var(--brand-border)' }}
            >
              {years.map((y) => (
                <option key={y} value={y} className="bg-neutral-900">
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs mb-1.5" style={{ color: 'var(--brand-muted)' }}>
              Project Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-black/40 border text-white"
              style={{ borderColor: 'var(--brand-border)' }}
            >
              {projectTypes.map((t) => (
                <option key={t} value={t} className="bg-neutral-900">
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Portfolio Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-80 bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 border text-center space-y-3" style={{ borderColor: 'var(--brand-border)' }}>
            <p className="text-base text-white font-semibold">No portfolio case studies match your filters.</p>
            <button
              type="button"
              onClick={() => {
                setCategoryFilter('All');
                setGameFilter('All');
                setYearFilter('All');
                setTypeFilter('All');
              }}
              className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold btn-brand"
            >
              <FillButtonContent className="gap-1.5">
                <span>Reset Filters</span>
              </FillButtonContent>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filtered.map((proj) => (
              <button
                key={proj._id}
                type="button"
                onClick={() => setSearchParams({ project: proj.slug })}
                className="text-left group border overflow-hidden flex flex-col transition-colors"
                style={{ backgroundColor: 'var(--brand-surface)', borderColor: 'var(--brand-border)' }}
              >
                <div className="aspect-[16/10] w-full overflow-hidden">
                  <MediaImage
                    src={proj.thumbnailUrl}
                    alt={proj.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-7 flex-1 flex flex-col justify-between space-y-4 w-full">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs mb-2" style={{ color: 'var(--brand-muted)' }}>
                      <span>{proj.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{proj.gameTitle}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{proj.year}</span>
                    </div>
                    <h2 className="font-display text-2xl font-bold text-white group-hover:underline underline-offset-4">
                      {proj.title}
                    </h2>
                    <p className="mt-2 text-sm line-clamp-2" style={{ color: 'var(--brand-muted)' }}>
                      {proj.description}
                    </p>
                  </div>
                  <div className="pt-4 border-t flex items-center justify-between text-xs" style={{ borderColor: 'var(--brand-border)' }}>
                    <span className="text-neutral-300">{proj.client}</span>
                    <span className="font-semibold" style={{ color: 'var(--brand-accent)' }}>
                      Open Case Study
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Case Study Lightbox Modal */}
      {selectedProject && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm overflow-y-auto p-4 md:p-8 flex items-start justify-center"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="max-w-4xl w-full border my-8 overflow-hidden"
            style={{ backgroundColor: 'var(--brand-bg)', borderColor: 'var(--brand-border)' }}
          >
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--brand-border)' }}>
              <div className="text-xs" style={{ color: 'var(--brand-muted)' }}>
                {selectedProject.category} · {selectedProject.gameTitle} · {selectedProject.projectDate}
              </div>
              <button
                type="button"
                onClick={() => setSearchParams({})}
                className="p-2 text-neutral-300 hover:text-white"
                aria-label="Close case study"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-[16/9] bg-black overflow-hidden">
              <MediaImage
                src={activeMedia || selectedProject.coverUrl || selectedProject.thumbnailUrl}
                alt={selectedProject.title}
                className="w-full h-full object-cover"
              />
            </div>

            {selectedProject.gallery && selectedProject.gallery.length > 1 && (
              <div className="p-4 border-b flex items-center gap-3 overflow-x-auto" style={{ borderColor: 'var(--brand-border)' }}>
                {selectedProject.gallery.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveMedia(imgUrl)}
                    className={`w-24 h-14 border overflow-hidden shrink-0 ${
                      activeMedia === imgUrl ? 'ring-2 ring-white' : 'opacity-65 hover:opacity-100'
                    }`}
                    style={{ borderColor: 'var(--brand-border)' }}
                  >
                    <MediaImage src={imgUrl} alt={`Gallery ${idx + 1}`} />
                  </button>
                ))}
              </div>
            )}

            <div className="p-6 md:p-8 space-y-6">
              <div>
                <h2 className="font-display text-3xl md:text-4xl font-bold text-white">
                  {selectedProject.title}
                </h2>
                {selectedProject.metrics && (
                  <p className="mt-2 text-sm font-semibold tabular-nums" style={{ color: 'var(--brand-accent)' }}>
                    {selectedProject.metrics}
                  </p>
                )}
              </div>

              <p className="text-sm md:text-base leading-relaxed" style={{ color: 'var(--brand-muted)' }}>
                {selectedProject.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t text-sm" style={{ borderColor: 'var(--brand-border)' }}>
                <div>
                  <div className="text-xs mb-1" style={{ color: 'var(--brand-muted)' }}>Client / Partner</div>
                  <div className="font-semibold text-white">{selectedProject.client}</div>
                </div>
                <div>
                  <div className="text-xs mb-1" style={{ color: 'var(--brand-muted)' }}>Location</div>
                  <div className="font-semibold text-white inline-flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {selectedProject.location}
                  </div>
                </div>
                <div>
                  <div className="text-xs mb-1" style={{ color: 'var(--brand-muted)' }}>Date</div>
                  <div className="font-semibold text-white inline-flex items-center gap-1.5 tabular-nums">
                    <Calendar className="w-3.5 h-3.5" />
                    {selectedProject.projectDate}
                  </div>
                </div>
              </div>

              {selectedProject.servicesProvided.length > 0 && (
                <div className="pt-4 border-t" style={{ borderColor: 'var(--brand-border)' }}>
                  <div className="text-xs mb-2" style={{ color: 'var(--brand-muted)' }}>Services Delivered</div>
                  <div className="text-sm font-medium text-white">
                    {selectedProject.servicesProvided.join(' · ')}
                  </div>
                </div>
              )}

              {selectedProject.videoUrl && (
                <div className="pt-4 border-t space-y-3" style={{ borderColor: 'var(--brand-border)' }}>
                  <div className="text-xs font-semibold text-white inline-flex items-center gap-1.5">
                    <Play className="w-3.5 h-3.5" style={{ color: 'var(--brand-accent)' }} />
                    <span>Showreel / Broadcast Cut</span>
                  </div>
                  <div className="aspect-video border overflow-hidden" style={{ borderColor: 'var(--brand-border)' }}>
                    <iframe
                      src={selectedProject.videoUrl}
                      title={selectedProject.title}
                      className="w-full h-full"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              {selectedProject.externalUrl && (
                <div className="pt-2">
                  <a
                    href={selectedProject.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-5 py-2.5 text-xs font-semibold btn-brand"
                  >
                    <FillButtonContent className="gap-2">
                      <span>Visit External Project Link</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </FillButtonContent>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {extraSections.map((sec) => (
        <CustomSectionBlock key={sec._id} section={sec} />
      ))}
    </div>
  );
};

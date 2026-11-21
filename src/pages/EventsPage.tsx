import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar, MapPin, Trophy, Users, X } from 'lucide-react';
import { usePageSeo } from '../context/SiteContext';
import { EventItem, PageSection } from '../types/cms';
import { MediaImage } from '../components/MediaImage';
import { CustomSectionBlock } from '../components/DynamicExtraSections';
import { FillButtonContent } from '../components/FillButtonContent';
import { FALLBACK_EVENTS, FALLBACK_PAGE_SECTIONS, safeFetchJson } from '../data/fallbackData';

export const EventsPage: React.FC = () => {
  usePageSeo('events');
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState<EventItem[]>(FALLBACK_EVENTS);
  const [headerSec, setHeaderSec] = useState<PageSection | null>(
    FALLBACK_PAGE_SECTIONS.events[0] || null
  );
  const [extraSections, setExtraSections] = useState<PageSection[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'ongoing' | 'completed'>('all');
  const [gameFilter, setGameFilter] = useState('All');

  useEffect(() => {
    Promise.all([
      safeFetchJson<EventItem[]>('/api/public/events', FALLBACK_EVENTS),
      safeFetchJson<{ sections?: PageSection[] }>('/api/public/pages/events', {
        sections: FALLBACK_PAGE_SECTIONS.events,
      }),
    ]).then(([evtData, pageData]) => {
      if (Array.isArray(evtData) && evtData.length > 0) {
        setEvents(evtData);
      }
      const secs: PageSection[] = pageData?.sections || FALLBACK_PAGE_SECTIONS.events;
      setHeaderSec(secs.find((s) => s.sectionKey === 'events_header') || null);
      setExtraSections(secs.filter((s) => s.sectionKey !== 'events_header'));
    });
  }, []);

  const games = useMemo(() => ['All', ...Array.from(new Set(events.map((e) => e.gameCategory)))], [events]);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;
      if (gameFilter !== 'All' && e.gameCategory !== gameFilter) return false;
      return true;
    });
  }, [events, statusFilter, gameFilter]);

  const featuredEvent = events.find((e) => e.featured) || events[0] || null;
  const activeSlug = searchParams.get('event');
  const selectedEvent = events.find((e) => e.slug === activeSlug) || null;

  return (
    <div className="pt-28 pb-24">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="max-w-3xl mb-12 space-y-4">
          <p className="text-xs font-semibold tracking-wider" style={{ color: 'var(--brand-accent)' }}>
            {headerSec?.subtitle || 'Events & Tournaments'}
          </p>
          <h1
            className="font-display font-bold tracking-tight text-white text-balance leading-[1.05]"
            style={{ fontSize: 'clamp(2.25rem, 4.2vw, 3.75rem)' }}
          >
            {headerSec?.title || 'Global Tournament Calendar & Results'}
          </h1>
          <p className="text-base leading-relaxed" style={{ color: 'var(--brand-muted)' }}>
            {headerSec?.description}
          </p>
        </div>

        {/* Featured Event Spotlight */}
        {featuredEvent && (
          <div
            className="mb-14 border overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch"
            style={{ backgroundColor: 'var(--brand-surface)', borderColor: 'var(--brand-border)' }}
          >
            <div className="lg:col-span-7 min-h-[280px] overflow-hidden">
              <MediaImage src={featuredEvent.bannerUrl} alt={featuredEvent.title} loading="eager" />
            </div>
            <div className="lg:col-span-5 p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="text-xs font-semibold capitalize" style={{ color: 'var(--brand-accent)' }}>
                  Featured · {featuredEvent.status} Tournament
                </div>
                <h2 className="font-display text-3xl font-bold text-white">{featuredEvent.title}</h2>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--brand-muted)' }}>
                  {featuredEvent.description}
                </p>
              </div>

              <div className="space-y-2 text-xs tabular-nums" style={{ color: 'var(--brand-muted)' }}>
                <div className="flex items-center justify-between py-1.5 border-b" style={{ borderColor: 'var(--brand-border)' }}>
                  <span>Game Title</span>
                  <span className="text-white font-semibold">{featuredEvent.gameCategory}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b" style={{ borderColor: 'var(--brand-border)' }}>
                  <span>Prize Pool</span>
                  <span className="text-white font-semibold">{featuredEvent.prizePool}</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span>Dates</span>
                  <span className="text-white font-semibold">
                    {featuredEvent.startDate} to {featuredEvent.endDate}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSearchParams({ event: featuredEvent.slug })}
                className="w-full inline-flex items-center justify-center py-3 text-xs font-semibold btn-brand"
              >
                <FillButtonContent className="gap-2">
                  <span>Inspect Event Details &amp; Standings</span>
                </FillButtonContent>
              </button>
            </div>
          </div>
        )}

        {/* Interactive Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div
            className="flex flex-wrap items-center gap-1 p-1 border"
            style={{ backgroundColor: 'var(--brand-surface)', borderColor: 'var(--brand-border)' }}
          >
            {(['all', 'upcoming', 'ongoing', 'completed'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 text-xs font-semibold capitalize transition-colors whitespace-nowrap ${
                  statusFilter === status ? 'text-white' : 'text-neutral-400 hover:text-white'
                }`}
                style={statusFilter === status ? { backgroundColor: 'var(--brand-accent)' } : undefined}
              >
                {status === 'all' ? 'All Events' : status}
              </button>
            ))}
          </div>

          <select
            value={gameFilter}
            onChange={(e) => setGameFilter(e.target.value)}
            className="px-4 py-2 text-xs font-medium bg-black/40 border text-white"
            style={{ borderColor: 'var(--brand-border)' }}
          >
            {games.map((g) => (
              <option key={g} value={g} className="bg-neutral-900">
                Game: {g}
              </option>
            ))}
          </select>
        </div>

        {/* Event Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filtered.map((evt) => (
            <div
              key={evt._id}
              className="border overflow-hidden flex flex-col"
              style={{ backgroundColor: 'var(--brand-surface)', borderColor: 'var(--brand-border)' }}
            >
              <div className="aspect-[16/9] relative overflow-hidden">
                <MediaImage src={evt.bannerUrl} alt={evt.title} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between text-xs text-white tabular-nums">
                  <span className="capitalize font-semibold">{evt.status}</span>
                  <span>{evt.prizePool}</span>
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                <div>
                  <div className="flex items-center gap-2 text-xs mb-2" style={{ color: 'var(--brand-muted)' }}>
                    <span>{evt.gameCategory}</span>
                    <span aria-hidden="true">·</span>
                    <span>{evt.location}</span>
                  </div>
                  <h3 className="font-display text-2xl font-bold text-white">{evt.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--brand-muted)' }}>
                    {evt.description}
                  </p>
                </div>

                <div className="pt-4 border-t flex items-center justify-between text-xs tabular-nums" style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-muted)' }}>
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {evt.startDate}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSearchParams({ event: evt.slug })}
                    className="font-semibold text-white hover:underline"
                  >
                    {evt.results.length > 0 ? 'View Results & Gallery' : 'Event Details'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm overflow-y-auto p-4 md:p-8 flex items-start justify-center"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="max-w-3xl w-full border my-8 overflow-hidden"
            style={{ backgroundColor: 'var(--brand-bg)', borderColor: 'var(--brand-border)' }}
          >
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--brand-border)' }}>
              <span className="text-xs capitalize font-semibold" style={{ color: 'var(--brand-accent)' }}>
                {selectedEvent.status} · {selectedEvent.gameCategory}
              </span>
              <button
                type="button"
                onClick={() => setSearchParams({})}
                className="p-2 text-neutral-300 hover:text-white"
                aria-label="Close event modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-[16/9] overflow-hidden">
              <MediaImage src={selectedEvent.bannerUrl} alt={selectedEvent.title} />
            </div>
            <div className="p-6 md:p-8 space-y-6">
              <h2 className="font-display text-3xl font-bold text-white">{selectedEvent.title}</h2>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--brand-muted)' }}>
                {selectedEvent.description}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 border text-xs tabular-nums" style={{ backgroundColor: 'var(--brand-surface)', borderColor: 'var(--brand-border)' }}>
                <div>
                  <div style={{ color: 'var(--brand-muted)' }}>Location</div>
                  <div className="font-semibold text-white mt-1 inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {selectedEvent.location}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--brand-muted)' }}>Prize Pool</div>
                  <div className="font-semibold text-white mt-1 inline-flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5" /> {selectedEvent.prizePool}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--brand-muted)' }}>Competitors</div>
                  <div className="font-semibold text-white mt-1 inline-flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> {selectedEvent.teamsCount} Teams
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--brand-muted)' }}>Dates</div>
                  <div className="font-semibold text-white mt-1">{selectedEvent.startDate}</div>
                </div>
              </div>

              {selectedEvent.results && selectedEvent.results.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-display text-xl font-bold text-white">Final Standings</h3>
                  <div className="border overflow-hidden" style={{ borderColor: 'var(--brand-border)' }}>
                    <table className="w-full text-left text-sm">
                      <thead className="border-b text-xs" style={{ backgroundColor: 'var(--brand-surface)', borderColor: 'var(--brand-border)', color: 'var(--brand-muted)' }}>
                        <tr>
                          <th className="py-3 px-4 font-semibold">Placement</th>
                          <th className="py-3 px-4 font-semibold">Team</th>
                          <th className="py-3 px-4 font-semibold text-right">Prize</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y tabular-nums" style={{ borderColor: 'var(--brand-border)' }}>
                        {selectedEvent.results.map((r, i) => (
                          <tr key={i}>
                            <td className="py-3 px-4 font-semibold text-white">{r.placement}</td>
                            <td className="py-3 px-4 text-neutral-200">{r.team}</td>
                            <td className="py-3 px-4 text-right font-mono-num" style={{ color: 'var(--brand-accent)' }}>
                              {r.prize}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {selectedEvent.gallery && selectedEvent.gallery.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-display text-xl font-bold text-white">Event Gallery</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedEvent.gallery.map((img, i) => (
                      <div key={i} className="aspect-[16/10] border overflow-hidden" style={{ borderColor: 'var(--brand-border)' }}>
                        <MediaImage src={img} alt={`${selectedEvent.title} photo ${i + 1}`} />
                      </div>
                    ))}
                  </div>
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

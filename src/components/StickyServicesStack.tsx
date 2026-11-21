import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowUpRight,
  CalendarCheck,
  Gamepad2,
  Layers,
  MonitorPlay,
  PenTool,
  Shirt,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import { ServiceItem } from '../types/cms';
import { FillButtonContent } from './FillButtonContent';

interface StackServiceCard {
  id: string;
  slug: string;
  title: string;
  description: string;
  tags: string[];
  iconName: string;
  accentHex: string;
  accentBg: string;
  accentBorder: string;
}

const ACCENT_PALETTE = [
  { hex: '#dc2626', bg: 'rgba(220, 38, 38, 0.14)', border: 'rgba(220, 38, 38, 0.38)' },
  { hex: '#38bdf8', bg: 'rgba(56, 189, 248, 0.14)', border: 'rgba(56, 189, 248, 0.38)' },
  { hex: '#10b981', bg: 'rgba(16, 185, 129, 0.14)', border: 'rgba(16, 185, 129, 0.38)' },
  { hex: '#f59e0b', bg: 'rgba(245, 158, 11, 0.14)', border: 'rgba(245, 158, 11, 0.38)' },
  { hex: '#a855f7', bg: 'rgba(168, 85, 247, 0.14)', border: 'rgba(168, 85, 247, 0.38)' },
  { hex: '#fb7185', bg: 'rgba(251, 113, 133, 0.14)', border: 'rgba(251, 113, 133, 0.38)' },
];

const CORE_HOME_CARDS: StackServiceCard[] = [
  {
    id: 'core-production',
    slug: 'live-broadcast-production',
    title: 'Esports Production',
    description:
      'Content production, live production and broadcast for events of any size. Multi-camera 4K60 coverage, real-time graphics, observer and replay direction, delivered remotely, on-site or hybrid.',
    tags: ['Content', 'Live', 'Broadcast'],
    iconName: 'MonitorPlay',
    accentHex: ACCENT_PALETTE[0].hex,
    accentBg: ACCENT_PALETTE[0].bg,
    accentBorder: ACCENT_PALETTE[0].border,
  },
  {
    id: 'core-marketing',
    slug: 'designer-creative-production',
    title: 'Esports Marketing',
    description:
      'We design esports marketing campaigns, community building, influencer activations, sponsorship integrations, and branded content that keeps your audience coming back.',
    tags: ['Brand Strategy', 'Influencer', 'Community'],
    iconName: 'TrendingUp',
    accentHex: ACCENT_PALETTE[1].hex,
    accentBg: ACCENT_PALETTE[1].bg,
    accentBorder: ACCENT_PALETTE[1].border,
  },
  {
    id: 'core-execution',
    slug: 'tournament-production',
    title: 'Event Execution',
    description:
      'From concept to closing ceremony, we run every layer of your esports tournament: venue management, stage design, sound and lighting, player logistics, broadcast integration, and post-event analytics.',
    tags: ['Venue', 'Stage & Lighting', 'Logistics'],
    iconName: 'CalendarCheck',
    accentHex: ACCENT_PALETTE[2].hex,
    accentBg: ACCENT_PALETTE[2].bg,
    accentBorder: ACCENT_PALETTE[2].border,
  },
  {
    id: 'core-jersey',
    slug: 'jersey-printing-design',
    title: 'Jersey Printing & Design',
    description:
      'Custom dye-sublimation pro-team jerseys, esports apparel engineering, crest styling, and tournament merchandise tailored for competitive rosters and live staff teams.',
    tags: ['Pro Jerseys', 'Sublimation', 'Merch Kits'],
    iconName: 'Shirt',
    accentHex: ACCENT_PALETTE[3].hex,
    accentBg: ACCENT_PALETTE[3].bg,
    accentBorder: ACCENT_PALETTE[3].border,
  },
];

const ROTATING_PHRASES = [
  'esports production,',
  'live 4K60 broadcast,',
  'tournament marketing,',
  'pro jersey design.',
];

const SLOW_DOWN_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function StackServiceIcon({ name, color }: { name: string; color: string }) {
  const cls = 'w-7 h-7';
  const style = { color };
  switch (name) {
    case 'Trophy':
      return <Trophy className={cls} style={style} strokeWidth={1.6} />;
    case 'Layers':
      return <Layers className={cls} style={style} strokeWidth={1.6} />;
    case 'TrendingUp':
      return <TrendingUp className={cls} style={style} strokeWidth={1.6} />;
    case 'CalendarCheck':
      return <CalendarCheck className={cls} style={style} strokeWidth={1.6} />;
    case 'Shirt':
      return <Shirt className={cls} style={style} strokeWidth={1.6} />;
    case 'Gamepad2':
      return <Gamepad2 className={cls} style={style} strokeWidth={1.6} />;
    case 'PenTool':
      return <PenTool className={cls} style={style} strokeWidth={1.6} />;
    default:
      return <MonitorPlay className={cls} style={style} strokeWidth={1.6} />;
  }
}

export const StickyServicesStack: React.FC<{
  services: ServiceItem[];
  mode?: 'home' | 'full';
  eyebrow?: string;
  description?: string;
  ctaText?: string;
  ctaLink?: string;
}> = ({
  services,
  mode = 'home',
  eyebrow = 'What we do',
  description = 'YRT Esports works from Kathmandu HQ with publishers, tournament organizers and brands. We plan the show, produce and broadcast it live, run events, print pro jerseys, and market it to the audience it was built for.',
  ctaText = 'See all esports services',
  ctaLink = '/services',
}) => {
  const [phraseIdx, setPhraseIdx] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPhraseIdx((prev) => (prev + 1) % ROTATING_PHRASES.length);
    }, 2800);
    return () => window.clearInterval(timer);
  }, []);

  const cards: StackServiceCard[] =
    mode === 'home'
      ? CORE_HOME_CARDS
      : services.map((svc, idx) => {
          const accent = ACCENT_PALETTE[idx % ACCENT_PALETTE.length];
          return {
            id: svc._id,
            slug: svc.slug,
            title: svc.title,
            description: svc.shortDescription,
            tags: (svc.deliverables || []).slice(0, 3).map((d) => d.split(' ').slice(0, 3).join(' ')),
            iconName: svc.iconName || 'MonitorPlay',
            accentHex: accent.hex,
            accentBg: accent.bg,
            accentBorder: accent.border,
          };
        });

  return (
    <section
      id="services"
      className="py-24 relative bg-transparent border-t overflow-clip"
      style={{ borderColor: 'var(--brand-border)' }}
    >
      {/* Sticky Side Typography Rails */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="sticky top-[20vh] w-full flex justify-between px-4 lg:px-10 z-0 h-[60vh]">
          <div className="hidden xl:block opacity-[0.035] select-none transform -translate-x-2">
            <div
              className="font-display text-[8.5rem] font-black text-white leading-none tracking-tighter rotate-180"
              style={{ writingMode: 'vertical-rl' }}
            >
              SERVICES
            </div>
          </div>
          <div className="hidden xl:block opacity-[0.035] select-none">
            <div
              className="font-display text-[8.5rem] font-black text-white leading-none tracking-tighter"
              style={{ writingMode: 'vertical-rl' }}
            >
              EXPERTISE
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1040px] mx-auto px-6 md:px-12 relative z-10">
        {/* Two-Column Header with 1s Downward Entrance & Rotating Text */}
        <motion.div
          initial={{ opacity: 0, y: -32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 1.0, ease: SLOW_DOWN_EASE }}
          className="mb-16 md:mb-20 grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-8 lg:gap-16 items-start"
        >
          <div>
            <p
              className="font-display text-xs font-bold tracking-[0.18em] uppercase mb-3"
              style={{ color: 'var(--brand-accent)' }}
            >
              {eyebrow}
            </p>
            <h2
              className="font-display font-bold leading-[1.06] tracking-tight text-white m-0"
              style={{ fontSize: 'clamp(2.1rem, 3.6vw, 3rem)' }}
            >
              Core services
              <br />
              <span className="inline-block relative text-neutral-300 min-h-[1.15em] overflow-hidden align-bottom">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={phraseIdx}
                    initial={{ opacity: 0, y: -22, rotateX: -45 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    exit={{ opacity: 0, y: 22, rotateX: 45 }}
                    transition={{ duration: 0.65, ease: SLOW_DOWN_EASE }}
                    className="inline-block"
                  >
                    for {ROTATING_PHRASES[phraseIdx]}
                  </motion.span>
                </AnimatePresence>
              </span>
              <br />
              <span className="text-neutral-400">built for global audiences.</span>
            </h2>
          </div>

          <div className="flex flex-col gap-5">
            <p className="text-sm md:text-base leading-relaxed text-neutral-300 m-0">
              {description}
            </p>
            <Link
              to={ctaLink}
              className="inline-flex items-center justify-center w-fit px-6 py-3 rounded-xl text-xs font-semibold btn-brand-outline"
            >
              <FillButtonContent className="gap-2">
                <span>{ctaText}</span>
                <ArrowUpRight className="w-4 h-4" />
              </FillButtonContent>
            </Link>
          </div>
        </motion.div>

        {/* Sticky-Stacking Overlapping Rounded Service Cards (1.0s Downward Reveal) */}
        <div className="flex flex-col gap-8 pb-24 relative">
          {cards.map((card, idx) => {
            const cardTop = `calc(12vh + ${Math.min(idx, 5) * 34}px)`;
            const ringPathId = `yrt-ring-${card.id}`;
            const ringText = `${card.title.toUpperCase()} • YRT ESPORTS • LIVE STUDIO • `;

            return (
              <div
                key={card.id}
                className="md:sticky w-full"
                style={{
                  top: cardTop,
                  zIndex: idx + 1,
                }}
              >
                <motion.div
                  initial={{ opacity: 0, y: -44 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.14 }}
                  transition={{ duration: 1.0, ease: SLOW_DOWN_EASE }}
                  className="flex flex-col md:flex-row items-stretch md:items-center gap-8 md:gap-12 p-7 md:p-11 rounded-[2rem] border shadow-2xl w-full group overflow-hidden relative"
                  style={{
                    background: 'linear-gradient(160deg, #161722 0%, #0d0e15 100%)',
                    borderColor: 'rgba(255, 255, 255, 0.16)',
                    borderTopColor: 'rgba(255, 255, 255, 0.34)',
                    boxShadow: '0 -24px 48px rgba(0, 0, 0, 0.78)',
                  }}
                >
                  {/* Hover ambient highlight */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at 80% 50%, ${card.accentBg} 0%, transparent 62%)`,
                    }}
                  />

                  {/* Left Card Body */}
                  <div className="flex-1 relative z-10">
                    <div className="flex items-center gap-5 mb-7">
                      {/* Animated Moving Service Icon */}
                      <motion.div
                        animate={{
                          y: [0, -5, 0],
                          rotate: [0, 5, -5, 0],
                        }}
                        transition={{
                          duration: 4.4,
                          repeat: Infinity,
                          ease: 'easeInOut',
                          delay: idx * 0.35,
                        }}
                        className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-6"
                        style={{
                          background: card.accentBg,
                          border: `1px solid ${card.accentBorder}`,
                        }}
                      >
                        <StackServiceIcon name={card.iconName} color={card.accentHex} />
                      </motion.div>

                      <span className="font-display text-white/15 font-bold text-6xl tracking-tighter tabular-nums">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                    </div>

                    <h3 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
                      <Link
                        to={`/services/${card.slug}`}
                        className="no-underline text-inherit hover:text-red-400 transition-colors"
                      >
                        {card.title}
                      </Link>
                    </h3>

                    <p className="text-neutral-300 text-base md:text-lg leading-relaxed mb-8 max-w-lg">
                      {card.description}
                    </p>

                    <div className="flex flex-wrap gap-2.5">
                      {card.tags.map((tag, tagIdx) => (
                        <span
                          key={tagIdx}
                          className="font-display px-4 py-2 rounded-full border border-white/15 bg-[#1b1d28] text-neutral-200 text-xs uppercase tracking-widest font-semibold"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right Dot-Matrix Rounded Box with Rotating Circular Text & Moving Arrow Button */}
                  <div className="w-full md:w-[300px] h-[230px] md:h-[260px] rounded-3xl bg-[#08090e] border border-white/15 flex items-center justify-center overflow-hidden relative z-10 shrink-0">
                    <div
                      className="absolute inset-0 opacity-35 group-hover:opacity-65 transition-opacity duration-700"
                      style={{
                        backgroundImage: `radial-gradient(circle at center, ${card.accentHex} 1.25px, transparent 1.25px)`,
                        backgroundSize: '22px 22px',
                        maskImage: 'radial-gradient(circle at center, black 35%, transparent 75%)',
                        WebkitMaskImage: 'radial-gradient(circle at center, black 35%, transparent 75%)',
                      }}
                    />

                    {/* Rotating Kinetic Circular Text Ring */}
                    <svg
                      viewBox="0 0 180 180"
                      aria-hidden="true"
                      className="w-44 h-44 pointer-events-none animate-spin-slow opacity-70 group-hover:opacity-100 transition-opacity duration-700"
                    >
                      <defs>
                        <path
                          id={ringPathId}
                          d="M 90, 90 m -66, 0 a 66,66 0 1,1 132,0 a 66,66 0 1,1 -132,0"
                        />
                      </defs>
                      <text
                        fill={card.accentHex}
                        fontSize="10.2"
                        fontWeight="700"
                        letterSpacing="2.4"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        <textPath href={`#${ringPathId}`} startOffset="0%">
                          {ringText}
                        </textPath>
                      </text>
                    </svg>

                    <Link
                      to={`/services/${card.slug}`}
                      aria-label={`View ${card.title}`}
                      className="absolute z-10 w-20 h-20 rounded-2xl btn-brand flex items-center justify-center group-hover:scale-105 transition-transform duration-700"
                      style={{ borderRadius: '1rem' }}
                    >
                      <FillButtonContent className="w-full h-full">
                        <ArrowUpRight className="w-8 h-8 transition-transform duration-700 group-hover:rotate-45 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </FillButtonContent>
                    </Link>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

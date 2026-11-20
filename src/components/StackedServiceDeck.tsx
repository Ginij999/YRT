import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import { ServiceItem } from '../types/cms';
import { MediaImage } from './MediaImage';

const FLASH_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const StackedServiceDeck: React.FC<{ services: ServiceItem[] }> = ({ services }) => {
  const deckItems = services.slice(0, 6);
  const [activeIndex, setActiveIndex] = useState(0);

  if (deckItems.length === 0) return null;

  const active = deckItems[activeIndex % deckItems.length];
  const next = () => setActiveIndex((prev) => (prev + 1) % deckItems.length);
  const prev = () => setActiveIndex((prev) => (prev - 1 + deckItems.length) % deckItems.length);

  return (
    <div className="mb-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
      {/* Left: Flash-Card Selector List */}
      <div className="lg:col-span-5 space-y-2.5">
        <div className="flex items-center justify-between text-xs text-neutral-400 mb-3">
          <span className="inline-flex items-center gap-1.5 font-semibold text-white">
            <Layers className="w-3.5 h-3.5" style={{ color: 'var(--brand-accent)' }} />
            Interactive Capability Deck
          </span>
          <span className="font-mono-num tabular-nums">
            {String(activeIndex + 1).padStart(2, '0')} / {String(deckItems.length).padStart(2, '0')}
          </span>
        </div>

        {deckItems.map((svc, idx) => {
          const isCurrent = idx === activeIndex;
          return (
            <button
              key={svc._id}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-300 flex items-center justify-between gap-3 ${
                isCurrent
                  ? 'apple-glass border-red-500/60 text-white translate-x-1'
                  : 'bg-white/[0.025] border-white/10 text-neutral-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="font-mono-num text-xs shrink-0"
                  style={{ color: isCurrent ? 'var(--brand-accent)' : 'inherit' }}
                >
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span className="font-semibold text-sm truncate">{svc.title}</span>
              </div>
              <ArrowRight
                className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                  isCurrent ? 'translate-x-0.5 text-red-500' : 'opacity-40'
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Right: Overlapping Stacked 3D Flash-Card Deck */}
      <div className="lg:col-span-7 relative min-h-[380px] sm:min-h-[410px] flex items-center justify-center pt-4 pb-8">
        <div className="relative w-full max-w-[580px] h-[350px] sm:h-[370px]">
          {deckItems.map((card, idx) => {
            const offset = (idx - activeIndex + deckItems.length) % deckItems.length;
            if (offset > 3 && offset < deckItems.length - 1) return null;

            const isTop = offset === 0;
            const depth = Math.min(offset, 3);

            return (
              <motion.div
                key={card._id}
                onClick={() => {
                  if (!isTop) setActiveIndex(idx);
                }}
                animate={{
                  y: depth * 14,
                  x: depth * 10,
                  scale: 1 - depth * 0.045,
                  opacity: isTop ? 1 : Math.max(0.28, 0.78 - depth * 0.22),
                  filter: isTop ? 'blur(0px)' : `blur(${depth * 1.1}px)`,
                  zIndex: deckItems.length - depth,
                }}
                transition={{ duration: 0.48, ease: FLASH_EASE }}
                className={`absolute inset-0 rounded-3xl overflow-hidden border shadow-2xl ${
                  isTop ? 'cursor-default border-white/20' : 'cursor-pointer border-white/10'
                }`}
                style={{ backgroundColor: '#101015' }}
              >
                <div className="relative h-full w-full grid grid-cols-1 sm:grid-cols-12">
                  <div className="sm:col-span-5 relative h-36 sm:h-full overflow-hidden border-b sm:border-b-0 sm:border-r border-white/10">
                    <MediaImage
                      src={card.imageUrl}
                      alt={card.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                    <span className="absolute bottom-3 left-3 font-mono-num text-[11px] font-semibold px-2.5 py-1 rounded bg-black/70 text-white border border-white/15">
                      Unit {String(idx + 1).padStart(2, '0')}
                    </span>
                  </div>

                  <div className="sm:col-span-7 p-6 flex flex-col justify-between bg-gradient-to-br from-[#16161d] to-[#0c0c10]">
                    <div className="space-y-3">
                      <h3 className="font-display text-2xl sm:text-3xl font-bold text-white leading-tight">
                        {card.title}
                      </h3>
                      <p className="text-xs sm:text-sm leading-relaxed text-neutral-300 line-clamp-3">
                        {card.shortDescription}
                      </p>
                      {card.deliverables && card.deliverables.length > 0 && (
                        <ul className="space-y-1.5 pt-1">
                          {card.deliverables.slice(0, 3).map((d, i) => (
                            <li key={i} className="text-xs text-neutral-400 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-red-500" />
                              <span className="truncate">{d}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-2">
                      <Link
                        to={`/services/${card.slug}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold btn-brand"
                      >
                        <span>Explore Service</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            prev();
                          }}
                          aria-label="Previous service card"
                          className="w-8 h-8 rounded-lg border border-white/15 bg-white/5 hover:bg-white/15 text-white inline-flex items-center justify-center transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            next();
                          }}
                          aria-label="Next service card"
                          className="w-8 h-8 rounded-lg border border-white/15 bg-white/5 hover:bg-white/15 text-white inline-flex items-center justify-center transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={active._id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.45 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none -z-10 absolute inset-8 rounded-full blur-[90px]"
            style={{ backgroundColor: 'var(--brand-accent)' }}
          />
        </AnimatePresence>
      </div>
    </div>
  );
};

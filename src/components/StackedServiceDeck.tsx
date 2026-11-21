import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, ChevronLeft, ChevronRight, Layers, RotateCw, Shuffle } from 'lucide-react';
import { ServiceItem } from '../types/cms';
import { MediaImage } from './MediaImage';

const FLASH_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const StackedServiceDeck: React.FC<{ services: ServiceItem[] }> = ({ services }) => {
  const deckItems = services.slice(0, 6);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (deckItems.length === 0) return null;

  const selectIndex = (idx: number) => {
    if (idx === activeIndex) {
      setIsFlipped((f) => !f);
    } else {
      setIsFlipped(false);
      setActiveIndex(idx);
    }
  };

  const next = () => {
    setIsFlipped(false);
    setActiveIndex((prev) => (prev + 1) % deckItems.length);
  };

  const prev = () => {
    setIsFlipped(false);
    setActiveIndex((prev) => (prev - 1 + deckItems.length) % deckItems.length);
  };

  const shuffle = () => {
    if (deckItems.length <= 1) return;
    setIsFlipped(false);
    let nextIdx = activeIndex;
    while (nextIdx === activeIndex) {
      nextIdx = Math.floor(Math.random() * deckItems.length);
    }
    setActiveIndex(nextIdx);
  };

  return (
    <div className="mb-14 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
      {/* Left: Sharp Index Selector & Deck Controls */}
      <div className="lg:col-span-5 space-y-2">
        <div className="flex items-center justify-between text-xs text-neutral-400 mb-3 pb-2 border-b border-white/10">
          <span className="inline-flex items-center gap-2 font-semibold text-white uppercase tracking-wider text-[11px]">
            <Layers className="w-3.5 h-3.5" style={{ color: 'var(--brand-accent)' }} />
            Capability Flashcards
          </span>
          <span className="font-mono-num tabular-nums text-white">
            CARD {String(activeIndex + 1).padStart(2, '0')} / {String(deckItems.length).padStart(2, '0')}
          </span>
        </div>

        {deckItems.map((svc, idx) => {
          const isCurrent = idx === activeIndex;
          return (
            <button
              key={svc._id}
              type="button"
              onClick={() => selectIndex(idx)}
              className={`w-full text-left px-4 py-3 rounded-[2px] border transition-all duration-200 flex items-center justify-between gap-3 ${
                isCurrent
                  ? 'bg-[#17171f] border-red-500 text-white translate-x-1 shadow-[0_8px_24px_rgba(220,38,38,0.16)]'
                  : 'bg-[#0e0e14] border-white/10 text-neutral-400 hover:text-white hover:border-white/25'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="font-mono-num text-xs font-bold shrink-0"
                  style={{ color: isCurrent ? 'var(--brand-accent)' : 'inherit' }}
                >
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span className="font-semibold text-sm truncate">{svc.title}</span>
              </div>
              <span className="font-mono-num text-[10px] uppercase tracking-wider shrink-0 opacity-75">
                {isCurrent ? (isFlipped ? 'BACK' : 'FRONT') : 'VIEW'}
              </span>
            </button>
          );
        })}

        {/* Deck Controls */}
        <div className="pt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={prev}
            className="px-3 py-2 rounded-[2px] border border-white/15 bg-[#111118] hover:border-white/40 text-xs font-semibold text-white inline-flex items-center gap-1"
            aria-label="Previous flashcard"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Prev</span>
          </button>
          <button
            type="button"
            onClick={() => setIsFlipped((f) => !f)}
            className="px-4 py-2 rounded-[2px] border border-red-500/60 bg-red-600/20 hover:bg-red-600 text-xs font-semibold text-white inline-flex items-center gap-1.5 transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>{isFlipped ? 'Flip to Front' : 'Flip Card'}</span>
          </button>
          <button
            type="button"
            onClick={next}
            className="px-3 py-2 rounded-[2px] border border-white/15 bg-[#111118] hover:border-white/40 text-xs font-semibold text-white inline-flex items-center gap-1"
            aria-label="Next flashcard"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={shuffle}
            className="px-3 py-2 rounded-[2px] border border-white/15 bg-[#111118] hover:border-white/40 text-xs font-semibold text-neutral-300 hover:text-white inline-flex items-center gap-1 ml-auto"
            aria-label="Shuffle flashcard"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Shuffle</span>
          </button>
        </div>
      </div>

      {/* Right: Authentic 3D Flippable & Fanned Flashcard Deck */}
      <div className="lg:col-span-7 relative min-h-[410px] sm:min-h-[430px] flex items-center justify-center py-6">
        <div
          className="relative w-full max-w-[540px] h-[360px] sm:h-[380px]"
          style={{ perspective: '1400px' }}
        >
          {deckItems.map((card, idx) => {
            const offset = (idx - activeIndex + deckItems.length) % deckItems.length;
            if (offset > 3) return null;

            const isTop = offset === 0;
            const depth = offset;
            const fanRotate = isTop ? 0 : depth % 2 === 1 ? 2.4 * depth : -1.8 * depth;

            return (
              <motion.div
                key={card._id}
                onClick={() => {
                  if (isTop) {
                    setIsFlipped((f) => !f);
                  } else {
                    setIsFlipped(false);
                    setActiveIndex(idx);
                  }
                }}
                animate={{
                  y: depth * 12,
                  x: depth * 12,
                  rotateZ: fanRotate,
                  scale: 1 - depth * 0.045,
                  opacity: isTop ? 1 : Math.max(0.35, 0.82 - depth * 0.2),
                  zIndex: deckItems.length - depth,
                }}
                transition={{ duration: 0.44, ease: FLASH_EASE }}
                className="absolute inset-0 select-none cursor-pointer"
              >
                {/* 3D Flip Container */}
                <motion.div
                  animate={{ rotateY: isTop && isFlipped ? 180 : 0 }}
                  transition={{ duration: 0.52, ease: FLASH_EASE }}
                  style={{
                    transformStyle: 'preserve-3d',
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                  }}
                >
                  {/* FRONT FACE — Prompt / Flashcard Face */}
                  <div
                    className={`absolute inset-0 rounded-[2px] border flex flex-col justify-between overflow-hidden shadow-2xl ${
                      isTop ? 'border-red-500/60' : 'border-white/15'
                    }`}
                    style={{
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      backgroundColor: '#101016',
                    }}
                  >
                    {/* Top Crimson Ruled Index Header */}
                    <div className="px-5 py-3 border-b border-white/10 bg-[#15151e] flex items-center justify-between text-[11px] font-mono-num">
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-2 h-2 bg-red-600" />
                        <span className="font-bold text-white tracking-wider uppercase">
                          FLASHCARD · UNIT {String(idx + 1).padStart(2, '0')}
                        </span>
                      </div>
                      <span className="text-neutral-400 inline-flex items-center gap-1">
                        <RotateCw className="w-3 h-3 text-red-500" />
                        CLICK TO FLIP
                      </span>
                    </div>

                    {/* Flashcard Visual Strip + Question Prompt */}
                    <div className="relative h-32 overflow-hidden border-b border-white/10 shrink-0">
                      <MediaImage
                        src={card.imageUrl}
                        alt={card.title}
                        className="w-full h-full object-cover opacity-80"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#101016] via-[#101016]/35 to-transparent" />
                      <div className="absolute bottom-2.5 left-5 right-5 flex items-center justify-between text-[11px] font-mono-num text-neutral-300">
                        <span className="px-2 py-0.5 bg-black/75 border border-white/15 text-white">
                          {card.iconName || 'YRT UNIT'}
                        </span>
                        <span className="text-red-400 font-semibold">FRONT SIDE</span>
                      </div>
                    </div>

                    <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between bg-[#101016]">
                      <div className="space-y-2">
                        <h3 className="font-display text-2xl sm:text-3xl font-bold text-white leading-tight">
                          {card.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed line-clamp-3">
                          {card.shortDescription}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono-num text-neutral-400">
                        <span>{card.deliverables?.length || 4} Deliverables · {card.processSteps?.length || 3} Phases</span>
                        <span className="text-red-400 font-semibold">Flip for Specs →</span>
                      </div>
                    </div>
                  </div>

                  {/* BACK FACE — Deliverables, Process & Direct Action */}
                  <div
                    className="absolute inset-0 rounded-[2px] border border-red-500/70 flex flex-col justify-between overflow-hidden shadow-2xl"
                    style={{
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                      backgroundColor: '#13131b',
                    }}
                  >
                    <div className="px-5 py-3 border-b border-white/10 bg-[#1a1218] flex items-center justify-between text-[11px] font-mono-num">
                      <span className="font-bold text-red-400 tracking-wider uppercase">
                        SPEC SHEET · UNIT {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="text-neutral-300 inline-flex items-center gap-1">
                        <RotateCw className="w-3 h-3 text-red-500" />
                        BACK SIDE
                      </span>
                    </div>

                    <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between gap-4 overflow-hidden">
                      <div className="space-y-3">
                        <h4 className="font-display text-xl font-bold text-white truncate">
                          {card.title}
                        </h4>

                        {card.deliverables && card.deliverables.length > 0 && (
                          <div className="space-y-1.5">
                            <div className="text-[10px] font-mono-num uppercase tracking-wider text-red-400">
                              Core Deliverables
                            </div>
                            <ul className="space-y-1">
                              {card.deliverables.slice(0, 3).map((d, i) => (
                                <li key={i} className="text-xs text-neutral-200 flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 bg-red-500 shrink-0" />
                                  <span className="truncate">{d}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {card.processSteps && card.processSteps.length > 0 && (
                          <div className="space-y-1 pt-1">
                            <div className="text-[10px] font-mono-num uppercase tracking-wider text-neutral-400">
                              Execution Workflow
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              {card.processSteps.slice(0, 3).map((step, i) => (
                                <div key={i} className="p-2 border border-white/10 bg-black/35">
                                  <div className="text-[10px] font-mono-num text-red-400">0{i + 1}</div>
                                  <div className="text-[11px] font-semibold text-white truncate">{step.title}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                        <Link
                          to={`/services/${card.slug}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold btn-brand"
                        >
                          <span>Full Service Brief</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsFlipped(false);
                          }}
                          className="px-3 py-2 text-[11px] font-mono-num border border-white/15 bg-black/40 text-neutral-300 hover:text-white"
                        >
                          Flip Back
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

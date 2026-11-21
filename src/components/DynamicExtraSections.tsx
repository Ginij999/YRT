import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { PageSection } from '../types/cms';
import { MediaImage } from './MediaImage';

export const CustomSectionBlock: React.FC<{ section: PageSection }> = ({ section }) => {
  const bgStyle = section.backgroundColor ? { backgroundColor: section.backgroundColor } : {};

  if (section.layout === 'stats' && section.items && section.items.length > 0) {
    return (
      <section
        className="py-20 border-y"
        style={{ borderColor: 'var(--brand-border)', ...bgStyle }}
      >
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="max-w-2xl mb-12">
            {section.subtitle && (
              <p className="text-xs font-semibold tracking-wider mb-2" style={{ color: 'var(--brand-accent)' }}>
                {section.subtitle}
              </p>
            )}
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-white text-balance">
              {section.title}
            </h2>
            {section.description && (
              <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--brand-muted)' }}>
                {section.description}
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {section.items.map((item, idx) => (
              <motion.div
                key={item.id || idx}
                initial={{ opacity: 0, y: 18, scale: 0.97 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: idx * 0.06, ease: [0.22, 1, 0.36, 1] }}
                className="p-6 rounded-[2px] apple-glass-card"
              >
                <div className="font-display text-4xl md:text-5xl font-bold text-white tabular-nums">
                  {item.value}
                </div>
                <div className="mt-2 text-sm font-medium text-neutral-100">{item.label}</div>
                {item.meta && (
                  <div className="mt-1 text-xs" style={{ color: 'var(--brand-muted)' }}>
                    {item.meta}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (section.layout === 'split') {
    return (
      <section className="py-24" style={bgStyle}>
        <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-6 flex flex-col justify-center space-y-5"
          >
            {section.subtitle && (
              <p className="text-xs font-semibold tracking-wider" style={{ color: 'var(--brand-accent)' }}>
                {section.subtitle}
              </p>
            )}
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-white text-balance">
              {section.title}
            </h2>
            <p className="text-base leading-relaxed" style={{ color: 'var(--brand-muted)' }}>
              {section.description}
            </p>
            {section.ctaText && section.ctaLink && (
              <div className="pt-2">
                <Link
                  to={section.ctaLink}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold btn-brand"
                >
                  <span>{section.ctaText}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.98 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-6 min-h-[320px] lg:min-h-[420px] rounded-[2px] apple-glass overflow-hidden"
          >
            {section.videoUrl ? (
              <video
                src={section.videoUrl}
                controls
                className="w-full h-full object-cover"
              />
            ) : (
              <MediaImage
                src={section.imageUrl}
                alt={section.title}
                fallbackTitle={section.title}
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-[1.03]"
              />
            )}
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="py-20 border-t"
      style={{ borderColor: 'var(--brand-border)', ...bgStyle }}
    >
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="max-w-3xl space-y-4">
          {section.subtitle && (
            <p className="text-xs font-semibold tracking-wider" style={{ color: 'var(--brand-accent)' }}>
              {section.subtitle}
            </p>
          )}
          <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-white text-balance">
            {section.title}
          </h2>
          {section.description && (
            <p className="text-base leading-relaxed" style={{ color: 'var(--brand-muted)' }}>
              {section.description}
            </p>
          )}
          {section.ctaText && section.ctaLink && (
            <div className="pt-2">
              <Link
                to={section.ctaLink}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold btn-brand"
              >
                <span>{section.ctaText}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
        {section.imageUrl && (
          <div className="mt-10 aspect-[16/9] max-h-[460px] w-full border overflow-hidden" style={{ borderColor: 'var(--brand-border)' }}>
            <MediaImage src={section.imageUrl} alt={section.title} className="w-full h-full object-cover" />
          </div>
        )}
      </div>
    </section>
  );
};

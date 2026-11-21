import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { Partner } from '../types/cms';

interface BrandItem {
  name: string;
  subtitle: string;
  logoUrl?: string;
}

const CORE_BRANDS: BrandItem[] = [
  { name: 'PLG', subtitle: 'Power League Gaming' },
  { name: 'INSA', subtitle: 'Insa Global Partner' },
  { name: 'TikTok', subtitle: 'TikTok Live & Creator Hub' },
  { name: 'Saudi Esports', subtitle: 'KSA Championship Partner' },
  { name: 'Samsung', subtitle: 'Display & Mobile Hardware' },
  { name: 'Huawei', subtitle: 'Device & Ecosystem Partner' },
];

export const BrandLogoCarousel: React.FC<{ partners: Partner[] }> = ({ partners }) => {
  const cmsBrands: BrandItem[] = partners.map((p) => ({
    name: p.name,
    subtitle: p.tier,
    logoUrl: p.logoUrl,
  }));

  const merged = [
    ...CORE_BRANDS,
    ...cmsBrands.filter(
      (c) => !CORE_BRANDS.some((b) => b.name.toLowerCase() === c.name.toLowerCase())
    ),
  ];
  const repeated = [...merged, ...merged];

  return (
    <div className="space-y-6 marquee-pause-on-hover overflow-hidden">
      <div className="overflow-hidden py-2">
        <div className="animate-marquee-reverse gap-5 pr-5">
          {repeated.map((brand, idx) => (
            <div
              key={`${brand.name}-${idx}`}
              className="shrink-0 min-w-[200px] h-20 px-6 rounded-[2px] apple-glass-card flex items-center justify-center gap-3"
              title={`${brand.name} · ${brand.subtitle}`}
            >
              {brand.logoUrl ? (
                <img
                  src={brand.logoUrl}
                  alt={brand.name}
                  className="max-h-9 w-auto object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="text-center">
                  <div className="font-display text-xl font-bold tracking-wider text-white uppercase flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{brand.name}</span>
                  </div>
                  <div className="text-[10px] text-neutral-400 tracking-wide uppercase mt-0.5">
                    {brand.subtitle}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

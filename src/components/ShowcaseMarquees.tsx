import React from 'react';
import { Gamepad2, ShieldCheck } from 'lucide-react';
import { Partner } from '../types/cms';

const SUPPORTED_GAMES = [
  { name: 'PUBG Mobile', genre: 'Battle Royale', code: 'PUBGM' },
  { name: 'Mobile Legends', genre: 'MOBA 5v5', code: 'MLBB' },
  { name: 'League of Legends', genre: 'MOBA Championship', code: 'LOL' },
  { name: 'Valorant', genre: 'Tactical Shooter', code: 'VAL' },
  { name: 'Counter-Strike', genre: 'CS2 Pro Circuit', code: 'CS2' },
  { name: 'FIFA', genre: 'Football Esports', code: 'FIFA' },
  { name: 'eFootball', genre: 'Competitive Sim', code: 'EFB' },
];

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

export const SupportedGamesMarquee: React.FC = () => {
  const repeated = [...SUPPORTED_GAMES, ...SUPPORTED_GAMES];
  return (
    <section
      className="py-10 border-y marquee-pause-on-hover overflow-hidden relative z-10"
      style={{
        backgroundColor: 'rgba(13, 13, 18, 0.85)',
        borderColor: 'var(--brand-border)',
      }}
    >
      <div className="max-w-[1280px] mx-auto px-6 mb-5 flex items-center justify-between text-xs">
        <span className="inline-flex items-center gap-2 font-semibold text-white">
          <Gamepad2 className="w-4 h-4" style={{ color: 'var(--brand-accent)' }} />
          <span>Supported Competitive Titles</span>
        </span>
        <span className="text-neutral-400">Tournament Ops · Broadcast · Scrim Circuits</span>
      </div>

      <div className="overflow-hidden">
        <div className="animate-marquee gap-4 pr-4">
          {repeated.map((game, idx) => (
            <div
              key={`${game.code}-${idx}`}
              className="shrink-0 px-5 py-3 rounded-xl border border-white/10 bg-[#13131A]/90 flex items-center gap-3.5 hover:border-red-500/50 transition-colors"
            >
              <span className="px-2 py-1 rounded text-[11px] font-mono-num font-bold bg-red-600/15 text-red-400 border border-red-500/25">
                {game.code}
              </span>
              <div>
                <div className="text-sm font-bold text-white whitespace-nowrap">{game.name}</div>
                <div className="text-[11px] text-neutral-400 whitespace-nowrap">{game.genre}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export const BrandLogoCarousel: React.FC<{ partners: Partner[] }> = ({ partners }) => {
  const cmsBrands: BrandItem[] = partners.map((p) => ({
    name: p.name,
    subtitle: p.tier,
    logoUrl: p.logoUrl,
  }));

  const merged = [...CORE_BRANDS, ...cmsBrands.filter((c) => !CORE_BRANDS.some((b) => b.name.toLowerCase() === c.name.toLowerCase()))];
  const repeated = [...merged, ...merged];

  return (
    <div className="space-y-6 marquee-pause-on-hover overflow-hidden">
      <div className="overflow-hidden py-2">
        <div className="animate-marquee-reverse gap-5 pr-5">
          {repeated.map((brand, idx) => (
            <div
              key={`${brand.name}-${idx}`}
              className="shrink-0 min-w-[200px] h-20 px-6 rounded-2xl apple-glass-card flex items-center justify-center gap-3"
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

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Globe, Map as MapIcon, MapPin, Clock, Navigation2 } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { CAPITAL_CITIES, Globe3D, WorldCountriesDataset } from './Globe3D';

let cachedDataset: WorldCountriesDataset | null = null;
let datasetPromise: Promise<WorldCountriesDataset | null> | null = null;

function loadWorldDataset(): Promise<WorldCountriesDataset | null> {
  if (cachedDataset) return Promise.resolve(cachedDataset);
  if (!datasetPromise) {
    datasetPromise = fetch('/world-countries.json', { cache: 'force-cache' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: WorldCountriesDataset | null) => {
        if (data && Array.isArray(data.countries)) {
          cachedDataset = data;
        }
        return cachedDataset;
      })
      .catch(() => null);
  }
  return datasetPromise;
}

function mercY(latDeg: number): number {
  const clamped = Math.max(-85, Math.min(85, latDeg));
  return Math.log(Math.tan(Math.PI / 4 + (clamped * Math.PI) / 360));
}

function projectToSvgXY(
  lon: number,
  lat: number,
  dataset: WorldCountriesDataset
): { x: number; y: number } {
  const [leftLon, topLat, rightLon, bottomLat] = dataset.geoViewBox;
  const wrappedLon = lon < leftLon ? lon + 360 : lon;
  const x = ((wrappedLon - leftLon) / (rightLon - leftLon)) * dataset.width;
  const yTop = mercY(topLat);
  const yBot = mercY(bottomLat);
  const y = ((yTop - mercY(lat)) / (yTop - yBot)) * dataset.height;
  return { x, y };
}

function formatKtmTime(): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kathmandu',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date());
  } catch {
    return '12:00';
  }
}

export const GlobalNetworkMap: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { settings } = useSite();
  const [dataset, setDataset] = useState<WorldCountriesDataset | null>(() => cachedDataset);
  const [viewMode, setViewMode] = useState<'svg' | 'globe'>('svg');
  const [hoveredCountry, setHoveredCountry] = useState<{ id: string; title: string } | null>(null);
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [ktmTime, setKtmTime] = useState<string>(() => formatKtmTime());

  useEffect(() => {
    if (!cachedDataset) {
      loadWorldDataset().then((data) => {
        if (data) setDataset(data);
      });
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setKtmTime(formatKtmTime()), 15000);
    return () => clearInterval(timer);
  }, []);

  const svgW = dataset?.width || 1009.6727;
  const svgH = dataset?.height || 665.96301;

  const ktmCoords = useMemo(() => {
    if (!dataset) return { x: 714.4, y: 381.3 };
    return projectToSvgXY(85.324, 27.7172, dataset);
  }, [dataset]);

  const capitalDots = useMemo(() => {
    if (!dataset) return [];
    return CAPITAL_CITIES.map((city) => ({
      ...city,
      ...projectToSvgXY(city.lon, city.lat, dataset),
    }));
  }, [dataset]);

  return (
    <section
      className={`relative overflow-hidden ${compact ? 'py-14' : 'py-24 border-t'}`}
      style={{ borderColor: 'var(--brand-border)' }}
    >
      <div className="max-w-[1280px] mx-auto px-6 relative z-10 space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <motion.div
            initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl space-y-3"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full apple-glass-pill text-xs font-semibold text-white">
              <MapPin className="w-3.5 h-3.5 text-red-500" />
              <span>Kathmandu, Nepal (KTM) · Sole Headquarters</span>
            </div>
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-white text-balance">
              Headquartered in Kathmandu, Operating Worldwide
            </h2>
            <p className="text-sm md:text-base leading-relaxed" style={{ color: 'var(--brand-muted)' }}>
              {settings?.organizationName || 'YRT Esports'} directs tournament operations, live broadcast studios, jersey production, and brand campaigns exclusively from our HQ in <strong className="text-white">Kathmandu, Nepal</strong>.
            </p>
          </motion.div>

          {/* Controls: SVG World Map vs 3D Globe + KTM HQ Time */}
          <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto">
            <div className="inline-flex rounded-xl p-1 bg-[#121218] border border-white/15">
              <button
                type="button"
                onClick={() => setViewMode('svg')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                  viewMode === 'svg'
                    ? 'bg-red-600 text-white'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>World Map</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('globe')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                  viewMode === 'globe'
                    ? 'bg-red-600 text-white'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>3D Globe</span>
              </button>
            </div>

            <div className="apple-glass rounded-xl px-4 py-2 flex items-center gap-3.5">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-neutral-400">Sole HQ</div>
                  <div className="text-xs font-bold text-white">Kathmandu (KTM)</div>
                </div>
              </div>
              <div className="h-6 w-px bg-white/10" />
              <div className="flex items-center gap-1.5 font-mono-num text-xs text-white tabular-nums">
                <Clock className="w-3.5 h-3.5 text-neutral-400" />
                <span>{ktmTime} NPT</span>
              </div>
            </div>
          </div>
        </div>

        {/* Map / 3D Globe Frame */}
        <motion.div
          initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, amount: 0.12 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="apple-glass rounded-3xl p-4 sm:p-6 md:p-7 relative overflow-hidden"
        >
          {viewMode === 'globe' ? (
            <Globe3D dataset={dataset} />
          ) : (
            <div
              className="relative w-full aspect-[1010/666] min-h-[260px] rounded-2xl overflow-hidden bg-[#09090d] border border-white/10"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setPointerPos({
                  x: e.clientX - rect.left,
                  y: e.clientY - rect.top,
                });
              }}
              onMouseLeave={() => setHoveredCountry(null)}
            >
              {!dataset ? (
                <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">
                  Loading world map geometry...
                </div>
              ) : (
                <svg
                  viewBox={`0 0 ${svgW} ${svgH}`}
                  className="w-full h-full select-none"
                  role="img"
                  aria-label="Interactive vector world map with country boundaries highlighted in red and Kathmandu HQ pin"
                >
                  {/* Every individually separated country polygon */}
                  <g>
                    {dataset.countries.map((country) => {
                      const isHovered = hoveredCountry?.id === country.id;
                      const isNepal = country.id === 'NP';
                      return (
                        <path
                          key={country.id}
                          d={country.d}
                          fill={
                            isHovered
                              ? '#991b1b'
                              : isNepal
                              ? '#5c1419'
                              : '#2b2d36'
                          }
                          stroke={isHovered || isNepal ? '#f87171' : '#dc2626'}
                          strokeWidth={isHovered || isNepal ? '1.35' : '0.55'}
                          strokeLinejoin="round"
                          className="cursor-pointer transition-colors duration-150"
                          onMouseEnter={() =>
                            setHoveredCountry({ id: country.id, title: country.title })
                          }
                        />
                      );
                    })}
                  </g>

                  {/* Capital city subtle markers (non-HQ reference cities) */}
                  {capitalDots
                    .filter((c) => !c.isHq)
                    .map((city) => (
                      <g key={city.id} transform={`translate(${city.x}, ${city.y})`} pointerEvents="none">
                        <circle r="2.2" fill="#e2e8f0" stroke="#09090d" strokeWidth="0.8" opacity="0.72" />
                      </g>
                    ))}

                  {/* Sole Headquarters Marker: Kathmandu, Nepal (KTM) */}
                  <g transform={`translate(${ktmCoords.x}, ${ktmCoords.y})`}>
                    <circle r="9" fill="rgba(220, 38, 38, 0.28)" stroke="#ef4444" strokeWidth="1.2" />
                    <circle r="4.2" fill="#ef4444" stroke="#ffffff" strokeWidth="1.4" />
                    <g transform="translate(0, -16)">
                      <rect
                        x="-58"
                        y="-10"
                        width="116"
                        height="18"
                        rx="4"
                        fill="#0b0b10"
                        stroke="#dc2626"
                        strokeWidth="1"
                      />
                      <text
                        textAnchor="middle"
                        y="2"
                        fill="#ffffff"
                        fontSize="8.5"
                        fontWeight="700"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        KATHMANDU · HQ
                      </text>
                    </g>
                  </g>
                </svg>
              )}

              {/* Cursor Tooltip showing currently hovered country */}
              {hoveredCountry && (
                <div
                  className="pointer-events-none absolute z-20 px-3 py-1.5 rounded-lg bg-[#0d0e14]/95 border border-red-500/60 shadow-xl text-xs text-white flex items-center gap-2 whitespace-nowrap"
                  style={{
                    left: Math.min(pointerPos.x + 14, 760),
                    top: Math.max(8, pointerPos.y - 36),
                  }}
                >
                  <span className="font-mono-num text-[10px] px-1.5 py-0.5 rounded bg-red-600/20 text-red-400 border border-red-500/30">
                    {hoveredCountry.id}
                  </span>
                  <span className="font-semibold">{hoveredCountry.title}</span>
                  {hoveredCountry.id === 'NP' && (
                    <span className="text-[10px] font-semibold text-red-400">· KTM HQ</span>
                  )}
                </div>
              )}

              {/* Bottom Map Legend */}
              <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
                <div className="px-3 py-1.5 rounded-lg bg-[#0b0c12]/90 border border-white/10 text-[11px] text-neutral-300 flex items-center gap-2">
                  <Navigation2 className="w-3 h-3 text-red-500" />
                  <span>Hover any country to inspect · {dataset?.countries.length || 256} countries mapped</span>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-[#0b0c12]/90 border border-red-500/30 text-[11px] font-mono-num text-white">
                  HQ: Kathmandu, Nepal (KTM)
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

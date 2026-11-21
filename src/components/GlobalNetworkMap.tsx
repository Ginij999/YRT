import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  Clock,
  Crosshair,
  Globe,
  Map as MapIcon,
  MapPin,
  Minus,
  Navigation2,
  Plus,
  RotateCcw,
} from 'lucide-react';
import { useSite } from '../context/SiteContext';
import {
  CAPITAL_CITIES,
  getCachedWorldDataset,
  Globe3D,
  loadWorldDataset,
  WorldCountriesDataset,
} from './Globe3D';
import { CountryLogo } from './CountryLogo';

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
  const [dataset, setDataset] = useState<WorldCountriesDataset | null>(() => getCachedWorldDataset());
  const [viewMode, setViewMode] = useState<'svg' | 'globe'>('svg');
  const [hoveredCountry, setHoveredCountry] = useState<{ id: string; title: string } | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<{ id: string; title: string }>({
    id: 'NP',
    title: 'Nepal',
  });
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [ktmTime, setKtmTime] = useState<string>(() => formatKtmTime());

  // 2D Interactive Map Zoom & Pan Controls
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ clientX: number; clientY: number; panX: number; panY: number; moved: boolean }>({
    clientX: 0,
    clientY: 0,
    panX: 0,
    panY: 0,
    moved: false,
  });

  useEffect(() => {
    if (!dataset) {
      loadWorldDataset().then((data) => {
        if (data) setDataset(data);
      });
    }
  }, [dataset]);

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

  const clampPan = (nx: number, ny: number, z: number) => {
    const maxPanX = ((z - 1) * 48);
    const maxPanY = ((z - 1) * 48);
    return {
      x: Math.max(-maxPanX, Math.min(maxPanX, nx)),
      y: Math.max(-maxPanY, Math.min(maxPanY, ny)),
    };
  };

  const adjustZoom = (delta: number) => {
    setZoom((prev) => {
      const next = Math.max(1, Math.min(4.5, Number((prev + delta).toFixed(2))));
      setPan((p) => (next === 1 ? { x: 0, y: 0 } : clampPan(p.x, p.y, next)));
      return next;
    });
  };

  const resetMap = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedCountry({ id: 'NP', title: 'Nepal' });
  };

  const focusKathmandu2D = () => {
    setZoom(2.6);
    setPan({ x: -18, y: -6 });
    setSelectedCountry({ id: 'NP', title: 'Nepal' });
  };

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
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[2px] border border-red-500/40 bg-red-950/25 text-xs font-semibold text-white">
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
            <div className="inline-flex rounded-[2px] p-1 bg-[#121218] border border-white/15">
              <button
                type="button"
                onClick={() => setViewMode('svg')}
                className={`px-3.5 py-2 rounded-[2px] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
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
                className={`px-3.5 py-2 rounded-[2px] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                  viewMode === 'globe'
                    ? 'bg-red-600 text-white'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>3D Globe</span>
              </button>
            </div>

            <div className="apple-glass rounded-[2px] px-4 py-2 flex items-center gap-3.5">
              <div className="flex items-center gap-2.5">
                <CountryLogo code="NP" name="Nepal" size="md" />
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-neutral-400">Sole HQ</div>
                  <div className="text-xs font-bold text-white">Kathmandu, Nepal</div>
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
          className="apple-glass rounded-[2px] p-4 sm:p-6 relative overflow-hidden"
        >
          {viewMode === 'globe' ? (
            <Globe3D dataset={dataset} />
          ) : (
            <div className="space-y-3">
              {/* Interactive 2D Map Container */}
              <div
                className={`relative w-full aspect-[1010/666] min-h-[280px] rounded-[2px] overflow-hidden bg-[#09090d] border border-white/10 ${
                  zoom > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-crosshair'
                }`}
                onMouseDown={(e) => {
                  dragStartRef.current = {
                    clientX: e.clientX,
                    clientY: e.clientY,
                    panX: pan.x,
                    panY: pan.y,
                    moved: false,
                  };
                  if (zoom > 1) setIsDragging(true);
                }}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setPointerPos({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                  });
                  if (isDragging && zoom > 1) {
                    const dxPct = ((e.clientX - dragStartRef.current.clientX) / rect.width) * 100;
                    const dyPct = ((e.clientY - dragStartRef.current.clientY) / rect.height) * 100;
                    if (Math.abs(dxPct) > 0.5 || Math.abs(dyPct) > 0.5) {
                      dragStartRef.current.moved = true;
                    }
                    setPan(clampPan(dragStartRef.current.panX + dxPct, dragStartRef.current.panY + dyPct, zoom));
                  }
                }}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => {
                  setIsDragging(false);
                  setHoveredCountry(null);
                }}
              >
                {/* Top-Left Selected Country HUD with Real Country Flag Logo */}
                <div className="absolute top-3 left-3 z-20 px-3 py-1.5 rounded-[2px] bg-[#0e0f16]/95 border border-white/15 text-xs text-white flex items-center gap-2 pointer-events-none">
                  <CountryLogo
                    code={(hoveredCountry || selectedCountry).id}
                    name={(hoveredCountry || selectedCountry).title}
                    size="md"
                  />
                  <span className="font-semibold">{(hoveredCountry || selectedCountry).title}</span>
                  {(hoveredCountry || selectedCountry).id === 'NP' && (
                    <span className="text-[10px] font-mono-num text-red-400">· KTM HQ</span>
                  )}
                </div>

                {/* Top-Right 2D Map Zoom & Focus Controls */}
                <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => adjustZoom(0.5)}
                    className="w-8 h-8 rounded-[2px] bg-[#0e0f16]/95 border border-white/15 hover:border-red-500/60 text-white inline-flex items-center justify-center transition-colors"
                    aria-label="Zoom in map"
                    title="Zoom In"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustZoom(-0.5)}
                    className="w-8 h-8 rounded-[2px] bg-[#0e0f16]/95 border border-white/15 hover:border-red-500/60 text-white inline-flex items-center justify-center transition-colors"
                    aria-label="Zoom out map"
                    title="Zoom Out"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={focusKathmandu2D}
                    className="h-8 px-2.5 rounded-[2px] bg-[#0e0f16]/95 border border-red-500/45 hover:bg-red-600 text-white text-[11px] font-medium inline-flex items-center gap-1 transition-colors"
                  >
                    <Crosshair className="w-3 h-3" />
                    <span className="hidden sm:inline">Focus KTM HQ</span>
                  </button>
                  <button
                    type="button"
                    onClick={resetMap}
                    className="h-8 px-2.5 rounded-[2px] bg-[#0e0f16]/95 border border-white/15 hover:border-white/40 text-neutral-300 hover:text-white text-[11px] font-medium inline-flex items-center gap-1 transition-colors"
                    title="Reset map zoom and pan"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span className="hidden sm:inline">Reset</span>
                  </button>
                </div>

                {!dataset ? (
                  <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">
                    Loading world map geometry...
                  </div>
                ) : (
                  <div
                    className="w-full h-full transition-transform duration-200 ease-out"
                    style={{
                      transform: `translate(${pan.x}%, ${pan.y}%) scale(${zoom})`,
                      transformOrigin: 'center center',
                    }}
                  >
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
                          const isSelected = selectedCountry?.id === country.id;
                          const isNepal = country.id === 'NP';
                          return (
                            <path
                              key={country.id}
                              d={country.d}
                              fill={
                                isHovered
                                  ? '#b91c1c'
                                  : isSelected
                                  ? '#7f1d1d'
                                  : isNepal
                                  ? '#5c1419'
                                  : '#2b2d36'
                              }
                              stroke={isHovered || isSelected || isNepal ? '#fca5a5' : '#dc2626'}
                              strokeWidth={isHovered || isSelected || isNepal ? '1.35' : '0.55'}
                              strokeLinejoin="round"
                              className="cursor-pointer transition-colors duration-150"
                              onMouseEnter={() =>
                                setHoveredCountry({ id: country.id, title: country.title })
                              }
                              onClick={() => {
                                if (!dragStartRef.current.moved) {
                                  setSelectedCountry({ id: country.id, title: country.title });
                                }
                              }}
                            />
                          );
                        })}
                      </g>

                      {/* Capital city markers with crisp Country Flag logos */}
                      {capitalDots
                        .filter((c) => !c.isHq)
                        .map((city) => (
                          <g key={city.id} transform={`translate(${city.x}, ${city.y})`} pointerEvents="none">
                            <circle r="7.5" fill="#09090d" stroke="rgba(255,255,255,0.45)" strokeWidth="0.9" />
                            <clipPath id={`flag-clip-${city.id}`}>
                              <circle r="6" />
                            </clipPath>
                            <image
                              href={`https://flagcdn.com/w40/${city.code.toLowerCase()}.png`}
                              x="-6.5"
                              y="-5"
                              width="13"
                              height="10"
                              preserveAspectRatio="xMidYMid slice"
                              clipPath={`url(#flag-clip-${city.id})`}
                            />
                          </g>
                        ))}

                      {/* Sole Headquarters Marker: Kathmandu, Nepal Flag Badge */}
                      <g transform={`translate(${ktmCoords.x}, ${ktmCoords.y})`} pointerEvents="none">
                        <circle r="11.5" fill="rgba(220, 38, 38, 0.3)" stroke="#ef4444" strokeWidth="1.4" />
                        <clipPath id="flag-clip-ktm-hq">
                          <circle r="7.5" />
                        </clipPath>
                        <image
                          href="https://flagcdn.com/w40/np.png"
                          x="-7.5"
                          y="-7.5"
                          width="15"
                          height="15"
                          preserveAspectRatio="xMidYMid slice"
                          clipPath="url(#flag-clip-ktm-hq)"
                        />
                        <circle r="7.5" fill="none" stroke="#ffffff" strokeWidth="1.2" />
                        <g transform="translate(0, -19)">
                          <rect
                            x="-64"
                            y="-11"
                            width="128"
                            height="19"
                            rx="2"
                            fill="#0b0b10"
                            stroke="#dc2626"
                            strokeWidth="1"
                          />
                          <image
                            href="https://flagcdn.com/w40/np.png"
                            x="-58"
                            y="-7"
                            width="14"
                            height="10"
                            preserveAspectRatio="xMidYMid slice"
                          />
                          <text
                            textAnchor="start"
                            x="-40"
                            y="1.5"
                            fill="#ffffff"
                            fontSize="8.2"
                            fontWeight="700"
                            fontFamily="JetBrains Mono, monospace"
                          >
                            KATHMANDU · HQ
                          </text>
                        </g>
                      </g>
                    </svg>
                  </div>
                )}

                {/* Cursor Tooltip showing currently hovered country with Real Country Flag Logo */}
                {hoveredCountry && !isDragging && (
                  <div
                    className="pointer-events-none absolute z-20 px-3 py-1.5 rounded-[2px] bg-[#0d0e14]/95 border border-red-500/60 shadow-xl text-xs text-white flex items-center gap-2 whitespace-nowrap"
                    style={{
                      left: Math.min(pointerPos.x + 14, 760),
                      top: Math.max(44, pointerPos.y - 36),
                    }}
                  >
                    <CountryLogo code={hoveredCountry.id} name={hoveredCountry.title} size="sm" />
                    <span className="font-semibold">{hoveredCountry.title}</span>
                    {hoveredCountry.id === 'NP' && (
                      <span className="text-[10px] font-semibold text-red-400">· KTM HQ</span>
                    )}
                  </div>
                )}

                {/* Bottom Map Legend */}
                <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
                  <div className="px-3 py-1.5 rounded-[2px] bg-[#0b0c12]/90 border border-white/10 text-[11px] text-neutral-300 flex items-center gap-2">
                    <Navigation2 className="w-3 h-3 text-red-500" />
                    <span>
                      Click or hover any country · Zoom {zoom.toFixed(1)}x ({zoom > 1 ? 'drag to pan' : `${dataset?.countries.length || 256} countries`})
                    </span>
                  </div>
                  <div className="px-3 py-1.5 rounded-[2px] bg-[#0b0c12]/90 border border-red-500/30 text-[11px] font-mono-num text-white inline-flex items-center gap-2">
                    <CountryLogo code="NP" name="Nepal" size="sm" />
                    <span>HQ: Kathmandu, Nepal</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

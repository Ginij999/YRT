import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { MapPin, RotateCcw, Globe as GlobeIcon } from 'lucide-react';

export interface WorldCountryFeature {
  id: string;
  title: string;
  d: string;
}

export interface WorldCountriesDataset {
  width: number;
  height: number;
  geoViewBox: [number, number, number, number];
  countries: WorldCountryFeature[];
}

export interface CapitalCityMarker {
  id: string;
  city: string;
  country: string;
  code: string;
  lat: number;
  lon: number;
  isHq?: boolean;
  region: string;
}

export const CAPITAL_CITIES: CapitalCityMarker[] = [
  { id: 'ktm', city: 'Kathmandu', country: 'Nepal', code: 'KTM HQ', lat: 27.7172, lon: 85.324, isHq: true, region: 'Global Headquarters' },
  { id: 'del', city: 'New Delhi', country: 'India', code: 'IN', lat: 28.6139, lon: 77.209, region: 'South Asia' },
  { id: 'dac', city: 'Dhaka', country: 'Bangladesh', code: 'BD', lat: 23.8103, lon: 90.4125, region: 'South Asia' },
  { id: 'ruh', city: 'Riyadh', country: 'Saudi Arabia', code: 'SA', lat: 24.7136, lon: 46.6753, region: 'Middle East' },
  { id: 'auh', city: 'Abu Dhabi', country: 'United Arab Emirates', code: 'AE', lat: 24.4539, lon: 54.3773, region: 'Middle East' },
  { id: 'tyo', city: 'Tokyo', country: 'Japan', code: 'JP', lat: 35.6762, lon: 139.6503, region: 'East Asia' },
  { id: 'sel', city: 'Seoul', country: 'South Korea', code: 'KR', lat: 37.5665, lon: 126.978, region: 'East Asia' },
  { id: 'bkk', city: 'Bangkok', country: 'Thailand', code: 'TH', lat: 13.7563, lon: 100.5018, region: 'Southeast Asia' },
  { id: 'sin', city: 'Singapore', country: 'Singapore', code: 'SG', lat: 1.3521, lon: 103.8198, region: 'Southeast Asia' },
  { id: 'jkt', city: 'Jakarta', country: 'Indonesia', code: 'ID', lat: -6.2088, lon: 106.8456, region: 'Southeast Asia' },
  { id: 'lon', city: 'London', country: 'United Kingdom', code: 'GB', lat: 51.5072, lon: -0.1276, region: 'Europe' },
  { id: 'par', city: 'Paris', country: 'France', code: 'FR', lat: 48.8566, lon: 2.3522, region: 'Europe' },
  { id: 'ber', city: 'Berlin', country: 'Germany', code: 'DE', lat: 52.52, lon: 13.405, region: 'Europe' },
  { id: 'mow', city: 'Moscow', country: 'Russia', code: 'RU', lat: 55.7558, lon: 37.6173, region: 'Eurasia' },
  { id: 'cai', city: 'Cairo', country: 'Egypt', code: 'EG', lat: 30.0444, lon: 31.2357, region: 'Africa' },
  { id: 'nbo', city: 'Nairobi', country: 'Kenya', code: 'KE', lat: -1.2921, lon: 36.8219, region: 'Africa' },
  { id: 'was', city: 'Washington, D.C.', country: 'United States', code: 'US', lat: 38.9072, lon: -77.0369, region: 'North America' },
  { id: 'ott', city: 'Ottawa', country: 'Canada', code: 'CA', lat: 45.4215, lon: -75.6972, region: 'North America' },
  { id: 'bsb', city: 'Brasilia', country: 'Brazil', code: 'BR', lat: -15.7975, lon: -47.8919, region: 'South America' },
  { id: 'cbr', city: 'Canberra', country: 'Australia', code: 'AU', lat: -35.2809, lon: 149.13, region: 'Oceania' },
];

const _vec3 = new THREE.Vector3();

function latLonToVector3(lat: number, lon: number, radius: number, out = new THREE.Vector3()): THREE.Vector3 {
  const u = (lon + 180) / 360;
  const phi = u * Math.PI * 2;
  const theta = (90 - lat) * (Math.PI / 180);
  out.set(
    -radius * Math.cos(phi) * Math.sin(theta),
    radius * Math.cos(theta),
    radius * Math.sin(phi) * Math.sin(theta)
  );
  return out;
}

function mercY(latDeg: number): number {
  const clamped = Math.max(-85, Math.min(85, latDeg));
  return Math.log(Math.tan(Math.PI / 4 + (clamped * Math.PI) / 360));
}

function buildEquirectangularGlobeCanvas(dataset: WorldCountriesDataset): HTMLCanvasElement {
  const srcW = Math.round(dataset.width);
  const srcH = Math.round(dataset.height);
  const mercCanvas = document.createElement('canvas');
  mercCanvas.width = srcW;
  mercCanvas.height = srcH;
  const mctx = mercCanvas.getContext('2d')!;

  mctx.clearRect(0, 0, srcW, srcH);
  mctx.fillStyle = '#31333d';
  mctx.strokeStyle = '#dc2626';
  mctx.lineWidth = 0.8;
  mctx.lineJoin = 'round';

  for (const country of dataset.countries) {
    const path = new Path2D(country.d);
    if (country.id === 'NP') {
      mctx.fillStyle = '#7f1d1d';
      mctx.fill(path);
      mctx.strokeStyle = '#f87171';
      mctx.lineWidth = 1.4;
      mctx.stroke(path);
      mctx.fillStyle = '#31333d';
      mctx.strokeStyle = '#dc2626';
      mctx.lineWidth = 0.8;
    } else {
      mctx.fill(path);
      mctx.stroke(path);
    }
  }

  // Reproject Mercator canvas -> Equirectangular 2048x1024 canvas for Three.js SphereGeometry
  const dstW = 2048;
  const dstH = 1024;
  const dstCanvas = document.createElement('canvas');
  dstCanvas.width = dstW;
  dstCanvas.height = dstH;
  const dctx = dstCanvas.getContext('2d')!;

  // Deep obsidian ocean background
  dctx.fillStyle = '#090a0f';
  dctx.fillRect(0, 0, dstW, dstH);

  // Subtle lat/lon grid lines
  dctx.strokeStyle = 'rgba(255, 255, 255, 0.045)';
  dctx.lineWidth = 1;
  for (let lon = -150; lon <= 150; lon += 30) {
    const gx = ((lon + 180) / 360) * dstW;
    dctx.beginPath();
    dctx.moveTo(gx, 0);
    dctx.lineTo(gx, dstH);
    dctx.stroke();
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const gy = ((90 - lat) / 180) * dstH;
    dctx.beginPath();
    dctx.moveTo(0, gy);
    dctx.lineTo(dstW, gy);
    dctx.stroke();
  }

  const [leftLon, topLat, rightLon, bottomLat] = dataset.geoViewBox;
  const lonSpan = rightLon - leftLon;
  const yTop = mercY(topLat);
  const yBottom = mercY(bottomLat);
  const mercSpan = yTop - yBottom;

  // Map each equirectangular scanline to its Mercator source scanline
  for (let py = 0; py < dstH; py++) {
    const lat = 90 - ((py + 0.5) / dstH) * 180;
    if (lat > topLat || lat < bottomLat) continue;
    const myNorm = (yTop - mercY(lat)) / mercSpan;
    const sy = Math.max(0, Math.min(srcH - 1, Math.floor(myNorm * srcH)));

    // Map horizontal wrap cleanly because geoViewBox spans from -169.11 to +190.48 (359.6 deg)
    // Slice 1: [leftLon .. 180] maps to right portion of dstW
    // Slice 2: [-180 .. leftLon] corresponds to SVG's [180 .. rightLon]
    const splitPx = ((180 - leftLon) / lonSpan) * srcW;
    const dstStartPx = ((leftLon + 180) / 360) * dstW;
    const dstFirstWidth = dstW - dstStartPx;

    if (splitPx > 0 && dstFirstWidth > 0) {
      dctx.drawImage(mercCanvas, 0, sy, splitPx, 1, dstStartPx, py, dstFirstWidth, 1);
    }
    const remSrcW = srcW - splitPx;
    if (remSrcW > 1 && dstStartPx > 0) {
      dctx.drawImage(mercCanvas, splitPx, sy, remSrcW, 1, 0, py, dstStartPx, 1);
    }
  }

  return dstCanvas;
}

export const Globe3D: React.FC<{
  dataset: WorldCountriesDataset | null;
}> = ({ dataset }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [selectedCity, setSelectedCity] = useState<CapitalCityMarker>(CAPITAL_CITIES[0]);
  const [hoveredCity, setHoveredCity] = useState<CapitalCityMarker | null>(null);
  const [autoSpin, setAutoSpin] = useState<boolean>(false);
  const autoSpinRef = useRef<boolean>(false);
  const resetViewFnRef = useRef<(() => void) | null>(null);
  const focusCityFnRef = useRef<((city: CapitalCityMarker) => void) | null>(null);
  const requestRenderRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    autoSpinRef.current = autoSpin;
    if (autoSpin) {
      requestRenderRef.current?.();
    }
  }, [autoSpin]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || 720;
    const height = container.clientHeight || 460;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    const ktmCamPos = latLonToVector3(27.7172, 85.324, 3.25);
    camera.position.copy(ktmCamPos);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    // Three-point warm/cool studio illumination
    const hemiLight = new THREE.HemisphereLight(0xcbd5e1, 0x18181f, 0.95);
    scene.add(hemiLight);
    const keyLight = new THREE.DirectionalLight(0xfff1e6, 1.55);
    keyLight.position.set(5, 4, 5);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0xdc2626, 0.65);
    rimLight.position.set(-5, -2, -4);
    scene.add(rimLight);

    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    const GLOBE_RADIUS = 1.08;
    const sphereGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 48);

    let globeTexture: THREE.CanvasTexture | null = null;
    if (dataset) {
      const texCanvas = buildEquirectangularGlobeCanvas(dataset);
      globeTexture = new THREE.CanvasTexture(texCanvas);
      globeTexture.colorSpace = THREE.SRGBColorSpace;
      globeTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    }

    const sphereMat = new THREE.MeshStandardMaterial({
      map: globeTexture,
      color: globeTexture ? 0xffffff : 0x1e2028,
      roughness: 0.62,
      metalness: 0.14,
    });
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    globeGroup.add(sphereMesh);

    // Atmosphere subtle shell
    const atmoGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.035, 48, 32);
    const atmoMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      transparent: true,
      opacity: 0.07,
      roughness: 0.9,
      side: THREE.BackSide,
      depthWrite: false,
    });
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    globeGroup.add(atmoMesh);

    // Capital city 3D markers (composite pin: ring + stem + head + raycast hitbox)
    const hitGeo = new THREE.SphereGeometry(0.048, 10, 10);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });
    const stemGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.06, 8);
    const headGeo = new THREE.SphereGeometry(0.019, 12, 12);
    const hqHeadGeo = new THREE.SphereGeometry(0.032, 16, 16);
    const ringGeo = new THREE.RingGeometry(0.028, 0.038, 24);

    const hqMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 0.85,
      roughness: 0.2,
      metalness: 0.4,
    });
    const cityMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      emissive: 0x991b1b,
      emissiveIntensity: 0.25,
      roughness: 0.3,
      metalness: 0.5,
    });
    const hqRingMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });

    const hitTargets: THREE.Mesh[] = [];
    const disposableGeos: THREE.BufferGeometry[] = [sphereGeo, atmoGeo, hitGeo, stemGeo, headGeo, hqHeadGeo, ringGeo];
    const disposableMats: THREE.Material[] = [sphereMat, atmoMat, hitMat, hqMat, cityMat, hqRingMat];

    for (const city of CAPITAL_CITIES) {
      const normal = latLonToVector3(city.lat, city.lon, 1).normalize();
      const surfacePos = normal.clone().multiplyScalar(GLOBE_RADIUS);

      const pinGroup = new THREE.Group();
      pinGroup.position.copy(surfacePos);
      pinGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);

      const stem = new THREE.Mesh(stemGeo, city.isHq ? hqMat : cityMat);
      stem.position.y = city.isHq ? 0.045 : 0.025;
      stem.scale.y = city.isHq ? 1.5 : 0.9;
      pinGroup.add(stem);

      const head = new THREE.Mesh(city.isHq ? hqHeadGeo : headGeo, city.isHq ? hqMat : cityMat);
      head.position.y = city.isHq ? 0.095 : 0.055;
      pinGroup.add(head);

      if (city.isHq) {
        const ring = new THREE.Mesh(ringGeo, hqRingMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.008;
        pinGroup.add(ring);
      }

      const hitbox = new THREE.Mesh(hitGeo, hitMat);
      hitbox.position.y = city.isHq ? 0.07 : 0.045;
      hitbox.layers.set(1);
      hitbox.userData.city = city;
      pinGroup.add(hitbox);
      hitTargets.push(hitbox);

      globeGroup.add(pinGroup);
    }

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.minDistance = 2.05;
    controls.maxDistance = 4.8;
    controls.rotateSpeed = 0.72;
    controls.zoomSpeed = 0.85;
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;

    // Camera transition state
    let transitionTarget: THREE.Vector3 | null = null;
    const cancelTransition = () => {
      transitionTarget = null;
    };
    controls.addEventListener('start', cancelTransition);

    let frameId = 0;
    let renderBusy = false;
    let renderDirty = false;
    let disposed = false;

    function afterDraw(cb: () => void) {
      if (disposed) return;
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function requestRender() {
      if (disposed) return;
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = requestAnimationFrame(() => {
        if (disposed) return;
        renderDirty = false;

        if (transitionTarget) {
          camera.position.lerp(transitionTarget, isSoftwareGl ? 0.45 : 0.14);
          if (camera.position.distanceTo(transitionTarget) < 0.015) {
            camera.position.copy(transitionTarget);
            transitionTarget = null;
          } else {
            renderDirty = true;
          }
        } else if (autoSpinRef.current && !isSoftwareGl) {
          globeGroup.rotation.y += 0.0032;
          renderDirty = true;
        }

        controls.update();
        renderer.render(scene, camera);

        const done = () => {
          renderBusy = false;
          if (renderDirty && !disposed) requestRender();
        };
        if (isSoftwareGl) afterDraw(done);
        else done();
      });
    }

    controls.addEventListener('change', () => {
      if (!isSoftwareGl && (controls.enableDamping || autoSpinRef.current)) {
        requestRender();
      } else {
        requestRender();
      }
    });

    resetViewFnRef.current = () => {
      globeGroup.rotation.set(0, 0, 0);
      transitionTarget = latLonToVector3(27.7172, 85.324, 3.25);
      setSelectedCity(CAPITAL_CITIES[0]);
      requestRender();
    };

    focusCityFnRef.current = (city: CapitalCityMarker) => {
      globeGroup.rotation.set(0, 0, 0);
      const dist = Math.max(2.35, Math.min(3.4, camera.position.length()));
      transitionTarget = latLonToVector3(city.lat, city.lon, dist);
      setSelectedCity(city);
      requestRender();
    };

    // Throttled Raycasting on Layer 1
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    const pointer = new THREE.Vector2();
    let lastHover = 0;

    const pickCity = (clientX: number, clientY: number): CapitalCityMarker | null => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(hitTargets, false);
      if (hits.length === 0) return null;
      // Check if point is on visible front hemisphere relative to camera
      hits[0].object.getWorldPosition(_vec3);
      if (_vec3.dot(camera.position) < 0) return null;
      return (hits[0].object.userData.city as CapitalCityMarker) || null;
    };

    const onPointerMove = (e: PointerEvent) => {
      const now = Date.now();
      if (now - lastHover < 45) return;
      lastHover = now;
      const city = pickCity(e.clientX, e.clientY);
      renderer.domElement.style.cursor = city ? 'pointer' : 'grab';
      setHoveredCity(city);
    };

    const onClick = (e: MouseEvent) => {
      const city = pickCity(e.clientX, e.clientY);
      if (city) {
        setSelectedCity(city);
        setAutoSpin(false);
      }
    };

    renderer.domElement.style.cursor = 'grab';
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('click', onClick);

    const onResize = () => {
      if (!container || disposed) return;
      const w = container.clientWidth || 720;
      const h = container.clientHeight || 460;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      requestRender();
    };
    window.addEventListener('resize', onResize);

    requestRenderRef.current = requestRender;

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }
    requestRender();

    return () => {
      disposed = true;
      requestRenderRef.current = null;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('click', onClick);
      controls.removeEventListener('start', cancelTransition);
      controls.dispose();
      disposableGeos.forEach((g) => g.dispose());
      disposableMats.forEach((m) => m.dispose());
      if (globeTexture) globeTexture.dispose();
      envTarget.dispose();
      renderer.dispose();
    };
  }, [dataset]);

  return (
    <div className="space-y-4">
      <div className="relative w-full h-[380px] sm:h-[460px] rounded-[2px] overflow-hidden bg-[#06070c] border border-white/10">
        {/* Isolated empty mount ref for Three.js WebGL canvas */}
        <div ref={mountRef} className="w-full h-full" aria-label="Interactive 3D Earth Globe" />

        {/* Solid-opaque HUD bar (zero backdrop-filter over WebGL canvas) */}
        <div className="absolute top-3 left-3 px-3.5 py-2 rounded-[2px] bg-[#0e0f16] border border-white/15 text-xs text-white flex items-center gap-2.5">
          <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
          <div>
            <span className="font-bold">
              {(hoveredCity || selectedCity).city}, {(hoveredCity || selectedCity).country}
            </span>
            <span className="ml-2 font-mono-num text-[11px] text-red-400">
              {(hoveredCity || selectedCity).isHq ? 'KTM HQ · Sole Office' : (hoveredCity || selectedCity).region}
            </span>
          </div>
        </div>

        <div className="absolute top-3 right-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAutoSpin((s) => !s)}
            className="px-3 py-1.5 rounded-[2px] bg-[#0e0f16] border border-white/15 text-[11px] font-medium text-neutral-200 hover:text-white hover:border-red-500/50 transition-colors inline-flex items-center gap-1.5"
          >
            <GlobeIcon className="w-3.5 h-3.5 text-red-500" />
            <span>{autoSpin ? 'Pause Spin' : 'Spin Globe'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAutoSpin(false);
              resetViewFnRef.current?.();
            }}
            className="px-3 py-1.5 rounded-[2px] bg-[#0e0f16] border border-white/15 text-[11px] font-medium text-neutral-200 hover:text-white hover:border-red-500/50 transition-colors inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-red-500" />
            <span>Focus KTM HQ</span>
          </button>
        </div>

        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          <div className="px-3 py-1.5 rounded-[2px] bg-[#0e0f16] border border-white/10 text-[11px] text-neutral-300">
            Drag to rotate globe · Scroll to zoom · Click any capital marker
          </div>
          <div className="px-3 py-1.5 rounded-[2px] bg-[#0e0f16] border border-red-500/35 text-[11px] font-mono-num text-white">
            Sole HQ: Kathmandu, Nepal (27.72° N, 85.32° E)
          </div>
        </div>
      </div>

      {/* Capital City Quick Jump Strip */}
      <div className="flex flex-wrap gap-2">
        {CAPITAL_CITIES.map((city) => {
          const isCurrent = selectedCity.id === city.id;
          return (
            <button
              key={city.id}
              type="button"
              onClick={() => {
                setAutoSpin(false);
                focusCityFnRef.current?.(city);
              }}
              className={`px-3 py-1.5 rounded-[2px] text-xs font-medium border transition-colors ${
                isCurrent
                  ? 'bg-red-600 border-red-500 text-white'
                  : city.isHq
                  ? 'bg-red-950/50 border-red-500/40 text-red-200 hover:bg-red-900/50'
                  : 'bg-[#111218] border-white/10 text-neutral-300 hover:text-white hover:border-white/25'
              }`}
            >
              {city.isHq ? 'Kathmandu (HQ)' : `${city.city} · ${city.code}`}
            </button>
          );
        })}
      </div>
    </div>
  );
};

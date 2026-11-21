import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { MapPin } from 'lucide-react';

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

let cachedWorldDataset: WorldCountriesDataset | null = null;
let worldDatasetPromise: Promise<WorldCountriesDataset | null> | null = null;

export function getCachedWorldDataset(): WorldCountriesDataset | null {
  return cachedWorldDataset;
}

export function loadWorldDataset(): Promise<WorldCountriesDataset | null> {
  if (cachedWorldDataset) return Promise.resolve(cachedWorldDataset);
  if (!worldDatasetPromise) {
    worldDatasetPromise = fetch('/world-countries.json', { cache: 'force-cache' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: WorldCountriesDataset | null) => {
        if (data && Array.isArray(data.countries)) {
          cachedWorldDataset = data;
        }
        return cachedWorldDataset;
      })
      .catch(() => null);
  }
  return worldDatasetPromise;
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

function inverseMercLat(my: number): number {
  return (2 * Math.atan(Math.exp(my)) - Math.PI / 2) * (180 / Math.PI);
}

interface GlobeDotBuffers {
  interiorPositions: Float32Array;
  interiorColors: Float32Array;
  borderPositions: Float32Array;
  borderColors: Float32Array;
}

function createDotSpriteTexture(): THREE.CanvasTexture {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0.0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.55, 'rgba(255,255,255,0.95)');
  grad.addColorStop(0.85, 'rgba(255,255,255,0.35)');
  grad.addColorStop(1.0, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildUnifiedLandDotBuffers(
  dataset: WorldCountriesDataset,
  radius: number
): GlobeDotBuffers {
  const srcW = Math.round(dataset.width);
  const srcH = Math.round(dataset.height);

  // Merge all countries seamlessly into continuous landmasses (zero internal country dividers)
  const mercCanvas = document.createElement('canvas');
  mercCanvas.width = srcW;
  mercCanvas.height = srcH;
  const mctx = mercCanvas.getContext('2d')!;
  mctx.fillStyle = '#000000';
  mctx.fillRect(0, 0, srcW, srcH);

  mctx.fillStyle = '#ffffff';
  mctx.strokeStyle = '#ffffff';
  mctx.lineWidth = 1.8;
  mctx.lineJoin = 'round';
  for (const country of dataset.countries) {
    const path = new Path2D(country.d);
    mctx.fill(path);
    mctx.stroke(path);
  }

  const img = mctx.getImageData(0, 0, srcW, srcH).data;
  const [leftLon, topLat, rightLon, bottomLat] = dataset.geoViewBox;
  const lonSpan = rightLon - leftLon;
  const yTop = mercY(topLat);
  const yBot = mercY(bottomLat);
  const mercSpan = yTop - yBot;

  const isLandPixel = (px: number, py: number): boolean => {
    if (px < 0 || px >= srcW || py < 0 || py >= srcH) return false;
    return img[(py * srcW + px) * 4] > 120;
  };

  const latLonToMercPixel = (lat: number, lon: number): [number, number] | null => {
    if (lat > topLat || lat < bottomLat) return null;
    let wrappedLon = lon;
    if (wrappedLon < leftLon) wrappedLon += 360;
    else if (wrappedLon > rightLon) wrappedLon -= 360;
    const sx = Math.max(0, Math.min(srcW - 1, Math.floor(((wrappedLon - leftLon) / lonSpan) * srcW)));
    const sy = Math.max(0, Math.min(srcH - 1, Math.floor(((yTop - mercY(lat)) / mercSpan) * srcH)));
    return [sx, sy];
  };

  const interiorPos: number[] = [];
  const interiorCol: number[] = [];
  const borderPos: number[] = [];
  const borderCol: number[] = [];
  const tmp = new THREE.Vector3();

  // 1. Uniform Fibonacci Sphere Lattice across unified continents & islands
  const totalSamples = 26000;
  const goldenRatio = (1 + Math.sqrt(5)) / 2;
  for (let i = 0; i < totalSamples; i++) {
    const t = (i + 0.5) / totalSamples;
    const lat = 90 - Math.acos(1 - 2 * t) * (180 / Math.PI);
    const lon = (((i / goldenRatio) % 1) * 360 + 540) % 360 - 180;

    const px = latLonToMercPixel(lat, lon);
    if (!px) continue;
    const [sx, sy] = px;
    if (!isLandPixel(sx, sy)) continue;

    latLonToVector3(lat, lon, radius + 0.006, tmp);
    interiorPos.push(tmp.x, tmp.y, tmp.z);
    interiorCol.push(0.86, 0.14, 0.16);
  }

  // 2. Dense crisp red dots specifically tracing continental & island coastlines (outer borders)
  const borderStep = 2;
  for (let sy = 1; sy < srcH - 1; sy += borderStep) {
    const my = yTop - ((sy + 0.5) / srcH) * mercSpan;
    const lat = inverseMercLat(my);
    for (let sx = 1; sx < srcW - 1; sx += borderStep) {
      if (!isLandPixel(sx, sy)) continue;
      const isOuterEdge =
        !isLandPixel(sx - 1, sy) ||
        !isLandPixel(sx + 1, sy) ||
        !isLandPixel(sx, sy - 1) ||
        !isLandPixel(sx, sy + 1);
      if (!isOuterEdge) continue;

      let lon = leftLon + ((sx + 0.5) / srcW) * lonSpan;
      if (lon > 180) lon -= 360;

      latLonToVector3(lat, lon, radius + 0.011, tmp);
      borderPos.push(tmp.x, tmp.y, tmp.z);
      borderCol.push(1.0, 0.25, 0.25);
    }
  }

  return {
    interiorPositions: new Float32Array(interiorPos),
    interiorColors: new Float32Array(interiorCol),
    borderPositions: new Float32Array(borderPos),
    borderColors: new Float32Array(borderCol),
  };
}

export const Globe3D: React.FC<{
  dataset?: WorldCountriesDataset | null;
  heroMode?: boolean;
}> = ({ dataset: propDataset, heroMode = false }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [internalDataset, setInternalDataset] = useState<WorldCountriesDataset | null>(
    () => propDataset ?? cachedWorldDataset
  );
  const dataset = propDataset !== undefined ? propDataset : internalDataset;

  const [selectedCity, setSelectedCity] = useState<CapitalCityMarker>(CAPITAL_CITIES[0]);
  const [hoveredCity, setHoveredCity] = useState<CapitalCityMarker | null>(null);
  const resetViewFnRef = useRef<(() => void) | null>(null);
  const focusCityFnRef = useRef<((city: CapitalCityMarker) => void) | null>(null);
  const requestRenderRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (propDataset === undefined && !internalDataset) {
      loadWorldDataset().then((data) => {
        if (data) setInternalDataset(data);
      });
    }
  }, [propDataset, internalDataset]);

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

    const width = Math.max(280, container.clientWidth || 520);
    const height = Math.max(280, container.clientHeight || (heroMode ? 520 : 440));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    const GLOBE_RADIUS = 1.0;
    const BOUNDING_RADIUS = GLOBE_RADIUS + 0.18; // accommodates KTM beacon + capital pins cleanly

    const computeFitDistance = (w: number, h: number): number => {
      const aspect = Math.max(0.55, w / Math.max(1, h));
      const vHalf = THREE.MathUtils.degToRad(camera.fov * 0.5);
      const hHalf = Math.atan(Math.tan(vHalf) * aspect);
      const dV = BOUNDING_RADIUS / Math.sin(vHalf);
      const dH = BOUNDING_RADIUS / Math.sin(hHalf);
      return Math.max(dV, dH) * 1.16; // comfortable margin on top, bottom, left & right
    };

    // Fixed comfortable viewing polar elevation (~18 deg N) facing Kathmandu initially
    const EQUATORIAL_POLAR_ANGLE = Math.PI / 2 - THREE.MathUtils.degToRad(18);
    let fitDist = computeFitDistance(width, height);
    const initialDir = latLonToVector3(18, 85.324, 1).normalize();
    camera.position.copy(initialDir).multiplyScalar(fitDist);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
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

    const hemiLight = new THREE.HemisphereLight(0xcbd5e1, 0x101016, 0.9);
    scene.add(hemiLight);
    const keyLight = new THREE.DirectionalLight(0xfff1e6, 1.35);
    keyLight.position.set(5, 3, 5);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0xdc2626, 0.75);
    rimLight.position.set(-5, -1, -4);
    scene.add(rimLight);

    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    const disposableGeos: THREE.BufferGeometry[] = [];
    const disposableMats: THREE.Material[] = [];

    // 1. Dark solid obsidian globe core (gives clear 3D occlusion so rear dots stay hidden)
    const sphereGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 48);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0x0a0b11,
      roughness: 0.72,
      metalness: 0.18,
    });
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    globeGroup.add(sphereMesh);
    disposableGeos.push(sphereGeo);
    disposableMats.push(sphereMat);

    // Subtle thin crimson rim shell
    const atmoGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.03, 48, 32);
    const atmoMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      transparent: true,
      opacity: 0.09,
      roughness: 0.9,
      side: THREE.BackSide,
      depthWrite: false,
    });
    globeGroup.add(new THREE.Mesh(atmoGeo, atmoMat));
    disposableGeos.push(atmoGeo);
    disposableMats.push(atmoMat);

    // 2. Unified Dotted Continents + Dense Border Red Dots
    const dotSpriteTex = createDotSpriteTexture();
    if (dataset) {
      const {
        interiorPositions,
        interiorColors,
        borderPositions,
        borderColors,
      } = buildUnifiedLandDotBuffers(dataset, GLOBE_RADIUS);

      const interiorGeo = new THREE.BufferGeometry();
      interiorGeo.setAttribute('position', new THREE.BufferAttribute(interiorPositions, 3));
      interiorGeo.setAttribute('color', new THREE.BufferAttribute(interiorColors, 3));
      interiorGeo.computeBoundingSphere();

      const interiorMat = new THREE.PointsMaterial({
        size: 0.024,
        map: dotSpriteTex,
        vertexColors: true,
        transparent: true,
        alphaTest: 0.22,
        depthWrite: false,
        sizeAttenuation: true,
      });

      globeGroup.add(new THREE.Points(interiorGeo, interiorMat));
      disposableGeos.push(interiorGeo);
      disposableMats.push(interiorMat);

      const borderGeo = new THREE.BufferGeometry();
      borderGeo.setAttribute('position', new THREE.BufferAttribute(borderPositions, 3));
      borderGeo.setAttribute('color', new THREE.BufferAttribute(borderColors, 3));
      borderGeo.computeBoundingSphere();

      const borderMat = new THREE.PointsMaterial({
        size: 0.032,
        map: dotSpriteTex,
        vertexColors: true,
        transparent: true,
        alphaTest: 0.2,
        depthWrite: false,
        sizeAttenuation: true,
      });

      globeGroup.add(new THREE.Points(borderGeo, borderMat));
      disposableGeos.push(borderGeo);
      disposableMats.push(borderMat);
    }

    // 3. Pins for Major Places + EXCLUSIVE Highlighted Beacon for Kathmandu Only
    const hitGeo = new THREE.SphereGeometry(0.052, 10, 10);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });
    const stemGeo = new THREE.CylinderGeometry(0.0045, 0.0045, 0.06, 8);
    const pinHeadGeo = new THREE.SphereGeometry(0.017, 12, 12);
    const ktmHeadGeo = new THREE.SphereGeometry(0.028, 16, 16);
    const ktmInnerRingGeo = new THREE.RingGeometry(0.036, 0.052, 32);
    const ktmOuterRingGeo = new THREE.RingGeometry(0.068, 0.082, 32);
    const ktmGlowDiscGeo = new THREE.CircleGeometry(0.095, 32);

    const ktmPinMat = new THREE.MeshStandardMaterial({
      color: 0xff3b3b,
      emissive: 0xdc2626,
      emissiveIntensity: 1.25,
      roughness: 0.2,
      metalness: 0.3,
    });
    const majorPinMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      emissive: 0x334155,
      emissiveIntensity: 0.2,
      roughness: 0.25,
      metalness: 0.65,
    });
    const ktmRingMat = new THREE.MeshBasicMaterial({
      color: 0xff4444,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
    });
    const ktmOuterRingMat = new THREE.MeshBasicMaterial({
      color: 0xdc2626,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    const ktmGlowDiscMat = new THREE.MeshBasicMaterial({
      color: 0xdc2626,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    });

    const hitTargets: THREE.Mesh[] = [];
    disposableGeos.push(hitGeo, stemGeo, pinHeadGeo, ktmHeadGeo, ktmInnerRingGeo, ktmOuterRingGeo, ktmGlowDiscGeo);
    disposableMats.push(hitMat, ktmPinMat, majorPinMat, ktmRingMat, ktmOuterRingMat, ktmGlowDiscMat);

    for (const city of CAPITAL_CITIES) {
      const normal = latLonToVector3(city.lat, city.lon, 1).normalize();
      const surfacePos = normal.clone().multiplyScalar(GLOBE_RADIUS);

      const pinGroup = new THREE.Group();
      pinGroup.position.copy(surfacePos);
      pinGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);

      // Clean Pin for all major cities + highlighted taller pin for Kathmandu
      const stem = new THREE.Mesh(stemGeo, city.isHq ? ktmPinMat : majorPinMat);
      stem.position.y = city.isHq ? 0.048 : 0.025;
      stem.scale.y = city.isHq ? 1.6 : 0.85;
      pinGroup.add(stem);

      const head = new THREE.Mesh(city.isHq ? ktmHeadGeo : pinHeadGeo, city.isHq ? ktmPinMat : majorPinMat);
      head.position.y = city.isHq ? 0.1 : 0.054;
      pinGroup.add(head);

      // ONLY Kathmandu gets area/ring highlight
      if (city.isHq) {
        const glowDisc = new THREE.Mesh(ktmGlowDiscGeo, ktmGlowDiscMat);
        glowDisc.rotation.x = -Math.PI / 2;
        glowDisc.position.y = 0.009;
        pinGroup.add(glowDisc);

        const innerRing = new THREE.Mesh(ktmInnerRingGeo, ktmRingMat);
        innerRing.rotation.x = -Math.PI / 2;
        innerRing.position.y = 0.011;
        pinGroup.add(innerRing);

        const outerRing = new THREE.Mesh(ktmOuterRingGeo, ktmOuterRingMat);
        outerRing.rotation.x = -Math.PI / 2;
        outerRing.position.y = 0.012;
        pinGroup.add(outerRing);
      }

      const hitbox = new THREE.Mesh(hitGeo, hitMat);
      hitbox.position.y = city.isHq ? 0.08 : 0.045;
      hitbox.layers.set(1);
      hitbox.userData.city = city;
      pinGroup.add(hitbox);
      hitTargets.push(hitbox);

      globeGroup.add(pinGroup);
    }

    // 4. OrbitControls Locked to Horizontal Rotation Only (No Rotating From Top/Bottom Poles)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = !heroMode;
    controls.minPolarAngle = EQUATORIAL_POLAR_ANGLE;
    controls.maxPolarAngle = EQUATORIAL_POLAR_ANGLE;
    controls.minDistance = fitDist * 0.78;
    controls.maxDistance = fitDist * 1.35;
    controls.rotateSpeed = 0.65;
    controls.zoomSpeed = 0.8;
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;

    let transitionTarget: THREE.Vector3 | null = null;
    const cancelTransition = () => {
      transitionTarget = null;
    };
    controls.addEventListener('start', cancelTransition);

    let frameId = 0;
    let renderBusy = false;
    let renderDirty = false;
    let disposed = false;
    const clock = new THREE.Clock();

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
        const delta = Math.min(clock.getDelta(), 0.1);

        if (transitionTarget) {
          camera.position.lerp(transitionTarget, isSoftwareGl ? 0.45 : 0.14);
          if (camera.position.distanceTo(transitionTarget) < 0.015) {
            camera.position.copy(transitionTarget);
            transitionTarget = null;
          } else {
            renderDirty = true;
          }
        }

        // Always stay rotating slowly horizontally around globe's spin axis
        if (!isSoftwareGl) {
          globeGroup.rotation.y += delta * 0.16;
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
      requestRender();
    });

    resetViewFnRef.current = () => {
      globeGroup.rotation.set(0, 0, 0);
      transitionTarget = latLonToVector3(18, 85.324, 1).normalize().multiplyScalar(fitDist);
      setSelectedCity(CAPITAL_CITIES[0]);
      requestRender();
    };

    focusCityFnRef.current = (city: CapitalCityMarker) => {
      globeGroup.rotation.set(0, 0, 0);
      const dist = camera.position.length() || fitDist;
      transitionTarget = latLonToVector3(18, city.lon, 1).normalize().multiplyScalar(dist);
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
      }
    };

    renderer.domElement.style.cursor = 'grab';
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('click', onClick);

    const handleResize = () => {
      if (!container || disposed) return;
      const w = Math.max(280, container.clientWidth || 520);
      const h = Math.max(280, container.clientHeight || (heroMode ? 520 : 440));
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      const nextFit = computeFitDistance(w, h);
      fitDist = nextFit;
      camera.position.normalize().multiplyScalar(nextFit);
      controls.minDistance = nextFit * 0.78;
      controls.maxDistance = nextFit * 1.35;
      requestRender();
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    window.addEventListener('resize', handleResize);

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
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('click', onClick);
      controls.removeEventListener('start', cancelTransition);
      controls.dispose();
      disposableGeos.forEach((g) => g.dispose());
      disposableMats.forEach((m) => m.dispose());
      dotSpriteTex.dispose();
      envTarget.dispose();
      renderer.dispose();
    };
  }, [dataset, heroMode]);

  return (
    <div className={heroMode ? 'relative w-full flex items-center justify-center' : 'w-full'}>
      <div
        className={
          heroMode
            ? 'relative w-full max-w-[540px] aspect-square mx-auto bg-transparent'
            : 'relative w-full rounded-2xl overflow-hidden bg-[#07080d] border border-white/15 h-[400px] sm:h-[480px]'
        }
      >
        {/* Isolated empty mount ref for Three.js WebGL canvas */}
        <div ref={mountRef} className="w-full h-full" aria-label="Interactive 3D Earth Globe" />

        {/* Minimal floating tooltip shown only when directly hovering a 3D pin */}
        {hoveredCity && (
          <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-[2px] bg-[#141520] border border-white/20 text-xs text-white flex items-center gap-2 whitespace-nowrap">
            <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <span className="font-bold">
              {hoveredCity.city}, {hoveredCity.country}
            </span>
            {hoveredCity.isHq && (
              <span className="font-mono-num text-[11px] text-red-400">· KTM HQ</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};


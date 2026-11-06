import { useEffect, useRef } from 'react';
import { buildFieldParticles, createImageField, drawField, type FieldGroup, type ImageField } from './imageField';

type Point = { x: number; y: number; depth: number; radius: number; phase: number };
type PointGroup = { color: string; points: Point[]; path: string };

function makeBurst(): PointGroup[] {
  let seed = 7331;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const groups = new Map<string, Point[]>();
  const rays = [
    { angle: -1.9, length: 0.92, bend: -0.2, width: 0.09 },
    { angle: -1.43, length: 0.85, bend: -0.12, width: 0.12 },
    { angle: -0.48, length: 1, bend: 0.22, width: 0.14 },
    { angle: 0.24, length: 0.91, bend: 0.12, width: 0.1 },
    { angle: 0.99, length: 0.72, bend: -0.2, width: 0.14 },
    { angle: 2.05, length: 0.98, bend: -0.18, width: 0.19 },
    { angle: 3.18, length: 0.84, bend: 0.14, width: 0.1 },
  ];
  for (let i = 0; i < 22000; i++) {
    const ray = rays[i % rays.length];
    const along = Math.pow(random(), 0.68);
    const across = (random() + random() + random() - 1.5) / 1.5;
    const halo = random() < 0.45;
    const spread = ray.width * (halo ? 3.2 : 1);
    const angle = ray.angle + ray.bend * Math.sin(along * 3.4) + across * spread;
    const radius = 0.06 + along * ray.length * 0.88;
    const width = Math.sin(along * Math.PI) * spread * across;
    const x = Math.cos(angle) * radius - Math.sin(angle) * width;
    const y = Math.sin(angle) * radius + Math.cos(angle) * width;
    const edge = Math.abs(across);
    const warmth = Math.max(0, 1 - edge * 2.4);
    const tip = Math.max(0, (along - 0.65) / 0.35);
    const rgb = halo
      ? [95 + edge * 60, 125 + warmth * 60, 225 + warmth * 30]
      : [255, 75 + warmth * 40 + tip * 95, 32 + edge * 55 + tip * 60];
    const alpha = (halo ? 0.48 : 0.95) * Math.pow(Math.sin(along * Math.PI), 0.55) * (1 - edge * 0.55);
    const opacity = Math.max(0.04, Math.round(alpha * 16) / 16);
    const color = `rgba(${rgb.map(value => Math.min(255, Math.round(value / 32) * 32)).join(',')},${opacity})`;
    const point = {
      x: x * 0.45 + 0.5,
      y: y * 0.45 + 0.5,
      depth: across * Math.sin(along * Math.PI),
      radius: (halo ? 0.0019 : 0.0014) + random() * 0.0008,
      phase: along * 6 + i % rays.length,
    };
    const group = groups.get(color);
    if (group) group.push(point);
    else groups.set(color, [point]);
  }
  return Array.from(groups, ([color, points]) => ({
    color,
    points,
    // A static version remains visible if Canvas 2D is unavailable.
    path: points.filter((_, index) => index % 4 === 0).map(point =>
      `M${(point.x * 1000).toFixed(1)} ${(point.y * 1000).toFixed(1)}h.1`,
    ).join(''),
  }));
}

// Seeded once: the grain stays coherent instead of flickering between frames.
const groups = makeBurst();

let cachedField: ImageField | undefined;
function sampleBurst() {
  if (cachedField) return cachedField;
  const resolution = 176;
  const sampler = document.createElement('canvas');
  sampler.width = sampler.height = resolution;
  const context = sampler.getContext('2d', { willReadFrequently: true });
  if (!context) return null;
  // Rasterize the existing points only for color and silhouette sampling.
  // The visible burst retains its original geometry and animation.
  for (const group of groups) {
    context.fillStyle = group.color;
    context.beginPath();
    for (const point of group.points) {
      const breathe = 1 + Math.sin(point.phase) * 0.018;
      const x = ((point.x - 0.5) * breathe + 0.5) * resolution;
      const y = ((point.y - 0.5) * breathe + 0.5) * resolution;
      const radius = Math.max(0.65, point.radius * resolution);
      context.moveTo(x + radius, y);
      context.arc(x, y, radius, 0, Math.PI * 2);
    }
    context.fill();
  }
  cachedField = createImageField(context.getImageData(0, 0, resolution, resolution).data, resolution);
  return cachedField;
}

export function Burst({ paused = false, atmosphere = false }: { paused?: boolean; atmosphere?: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fieldCanvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);
  const wakeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    pausedRef.current = paused;
    wakeRef.current?.();
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context || !root) return;
    const fieldCanvas = fieldCanvasRef.current;
    const fieldContext = fieldCanvas?.getContext('2d');
    let field: ImageField | null = null;
    try { if (fieldContext) field = sampleBurst(); } catch { /* Keep the original burst if sampling is unavailable. */ }
    let fieldGroups: FieldGroup[] = [];
    let fieldWidth = 1;
    let fieldHeight = 1;
    let lastFieldFrame = 0;
    let alive = true;
    let frame = 0;
    let time = 0;
    let previous = 0;
    let width = 1;
    let height = 1;
    let visible = true;
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };

    const draw = (now: number) => {
      frame = 0;
      if (!alive || !visible || document.hidden) return;
      const delta = Math.min((now - (previous || now)) / 1000, 0.04);
      previous = now;
      const still = pausedRef.current;
      if (!still) time += delta;
      const smoothing = 1 - Math.exp(-delta * 4);
      pointer.x += ((still ? 0 : pointer.targetX) - pointer.x) * smoothing;
      pointer.y += ((still ? 0 : pointer.targetY) - pointer.y) * smoothing;
      const size = Math.min(width, height);
      const originX = (width - size) / 2;
      const originY = (height - size) / 2;
      if (fieldContext && field && (still || !lastFieldFrame || now - lastFieldFrame >= 32)) {
        drawField(fieldContext, fieldGroups, fieldWidth, fieldHeight, time);
        lastFieldFrame = now;
      }
      context.clearRect(0, 0, width, height);
      for (const group of groups) {
        context.fillStyle = group.color;
        context.beginPath();
        for (const point of group.points) {
          const breathe = 1 + Math.sin(time * 0.35 + point.phase) * 0.018;
          const x = originX + ((point.x - 0.5) * breathe + 0.5) * size + pointer.x * point.depth * 14;
          const y = originY + ((point.y - 0.5) * breathe + 0.5) * size + pointer.y * point.depth * 14;
          const radius = point.radius * size;
          context.moveTo(x + radius, y);
          context.arc(x, y, radius, 0, Math.PI * 2);
        }
        context.fill();
      }
      if (root.dataset.ready !== 'true') root.dataset.ready = 'true';
      if (!still) frame = requestAnimationFrame(draw);
    };
    const wake = () => {
      if (alive && !frame && visible && !document.hidden) {
        previous = 0;
        frame = requestAnimationFrame(draw);
      }
    };
    const resize = () => {
      if (!alive) return;
      width = Math.max(1, canvas.clientWidth);
      height = Math.max(1, canvas.clientHeight);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (fieldCanvas && fieldContext && field) {
        const fieldRect = fieldCanvas.getBoundingClientRect();
        const artwork = canvas.getBoundingClientRect();
        const size = Math.min(artwork.width, artwork.height);
        fieldWidth = Math.max(1, fieldRect.width);
        fieldHeight = Math.max(1, fieldRect.height);
        fieldCanvas.width = Math.round(fieldWidth * dpr);
        fieldCanvas.height = Math.round(fieldHeight * dpr);
        fieldContext.setTransform(dpr, 0, 0, dpr, 0, 0);
        const quietZones = Array.from(root.closest('.home')?.querySelectorAll('.welcome-copy, .home-label') ?? []).map(element => {
          const box = element.getBoundingClientRect();
          return { x: box.left - fieldRect.left, y: box.top - fieldRect.top, width: box.width, height: box.height };
        });
        fieldGroups = buildFieldParticles(field, { x: 0, y: 0, width: fieldWidth, height: fieldHeight }, {
          x: artwork.left - fieldRect.left + (artwork.width - size) / 2,
          y: artwork.top - fieldRect.top + (artwork.height - size) / 2,
          width: size, height: size,
        }, quietZones, fieldWidth < 900 ? 8500 : 18000);
        fieldCanvas.dataset.particles = String(fieldGroups.reduce((count, group) => count + group.points.length, 0));
        lastFieldFrame = 0;
      }
      wake();
    };
    const onPointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.targetX = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
      pointer.targetY = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1));
    };
    const onLeave = () => { pointer.targetX = pointer.targetY = 0; };
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
        onLeave();
      } else wake();
    };
    const resizeObserver = new ResizeObserver(resize);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) wake();
      else { cancelAnimationFrame(frame); frame = 0; }
    });
    resizeObserver.observe(canvas);
    if (fieldCanvas) resizeObserver.observe(fieldCanvas);
    const copy = root.closest('.home')?.querySelector('.welcome-copy');
    if (fieldCanvas && copy) resizeObserver.observe(copy);
    intersectionObserver.observe(fieldCanvas ?? canvas);
    wakeRef.current = wake;
    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('blur', onLeave);
    document.addEventListener('visibilitychange', onVisibility);
    resize();
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('blur', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      wakeRef.current = null;
    };
  }, [atmosphere]);

  const artwork = (
    <div className="burst-scene" ref={rootRef}>
      <svg className="burst-fallback" viewBox="0 0 1000 1000" fill="none" strokeWidth="2" strokeLinecap="round">
        {groups.map(group => <path key={group.color} d={group.path} stroke={group.color} />)}
      </svg>
      <canvas ref={canvasRef} />
    </div>
  );
  return atmosphere ? (
    <div className="burst-with-atmosphere">
      <canvas className="burst-atmosphere" ref={fieldCanvasRef} />
      {artwork}
    </div>
  ) : artwork;
}

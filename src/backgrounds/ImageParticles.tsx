import { useEffect, useRef, useState } from 'react';
import { Burst } from './Burst';
import { buildFieldParticles, createImageField, drawField, noise, type FieldGroup, type ImageField } from './imageField';

type Particle = {
  x: number;
  y: number;
  depth: number;
  radius: number;
  phase: number;
  driftX: number;
  driftY: number;
  offsetX: number;
  offsetY: number;
};
type ParticleGroup = { color: string; particles: Particle[] };

function sampleImage(image: HTMLImageElement, exposure: number) {
  const resolution = 176;
  const sampler = document.createElement('canvas');
  sampler.width = sampler.height = resolution;
  const context = sampler.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Image sampling is unavailable');
  const scale = resolution / Math.max(image.naturalWidth, image.naturalHeight);
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  context.drawImage(image, (resolution - width) / 2, (resolution - height) / 2, width, height);
  const { data } = context.getImageData(0, 0, resolution, resolution);
  const groups = new Map<string, Particle[]>();

  for (let y = 0; y < resolution; y++) {
    for (let x = 0; x < resolution; x++) {
      const index = (y * resolution + x) * 4;
      const alpha = data[index + 3] / 255;
      const red = Math.min(1, data[index] / 255 * exposure);
      const green = Math.min(1, data[index + 1] / 255 * exposure);
      const blue = Math.min(1, data[index + 2] / 255 * exposure);
      const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;
      const energy = luminance * 0.45 + Math.max(red, green, blue) * 0.55;
      const seed = noise(x, y);
      if (alpha < 0.2 || energy < 0.055 || seed > 0.55 + energy * 0.5) continue;

      // Quantize colors to batch thousands of dots into a few hundred draw calls.
      const channels = [red, green, blue].map(channel =>
        Math.min(255, Math.round(Math.pow(channel, 0.78) * 255 / 32) * 32),
      );
      const opacity = Math.round(alpha * (0.65 + energy * 0.35) * 4) / 4;
      const color = `rgba(${channels.join(',')},${opacity})`;
      let group = groups.get(color);
      if (!group) {
        group = [];
        groups.set(color, group);
      }
      const phase = seed * Math.PI * 2;
      group.push({
        x: (x + noise(y, x) * 0.55) / resolution,
        y: (y + seed * 0.55) / resolution,
        depth: energy - 0.35,
        radius: (0.18 + Math.sqrt(energy) * 0.26) / resolution,
        phase,
        driftX: Math.cos(phase) * (0.03 + seed * 0.14),
        driftY: Math.sin(phase) * (0.03 + seed * 0.14),
        offsetX: 0,
        offsetY: 0,
      });
    }
  }
  return {
    groups: Array.from(groups, ([color, particles]) => ({ color, particles })),
    field: createImageField(data, resolution, exposure),
  };
}

export function ImageParticles({ src, paused, exposure = 1, dotScale = 1 }: {
  src: string;
  paused: boolean;
  exposure?: number;
  dotScale?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fieldCanvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);
  const wakeRef = useRef<(() => void) | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'fallback'>('loading');

  useEffect(() => {
    pausedRef.current = paused;
    wakeRef.current?.();
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const fieldCanvas = fieldCanvasRef.current;
    if (!canvas || !fieldCanvas) return;
    const context = canvas.getContext('2d');
    const fieldContext = fieldCanvas.getContext('2d');
    if (!context) {
      setState('fallback');
      return;
    }
    let alive = true;
    let visible = true;
    let groups: ParticleGroup[] = [];
    let field: ImageField | null = null;
    let fieldGroups: FieldGroup[] = [];
    let fieldWidth = 1;
    let fieldHeight = 1;
    let lastFieldFrame = 0;
    let frameId = 0;
    let width = 1;
    let height = 1;
    let time = 0;
    let lastFrame = 0;
    let burst = 0;
    const pointer = { x: 0, y: 0, inside: false, tiltX: 0, tiltY: 0 };
    const image = new Image();
    image.decoding = 'async';

    function draw(now: number) {
      frameId = 0;
      if (!alive || !visible || document.hidden || !groups.length) return;
      const still = pausedRef.current;
      const delta = Math.min((now - (lastFrame || now)) / 1000, 0.04);
      lastFrame = now;
      if (!still) time += delta;
      const size = Math.min(width, height) * 0.9;
      const originX = (width - size) / 2;
      const originY = (height - size) / 2;
      const settle = still ? 0 : Math.pow(1 - Math.min(time / 1.6, 1), 3);
      const smoothing = 1 - Math.exp(-delta * 8);
      const targetTiltX = pointer.inside && !still ? (pointer.x / width - 0.5) * 20 : 0;
      const targetTiltY = pointer.inside && !still ? (pointer.y / height - 0.5) * 14 : 0;
      pointer.tiltX += (targetTiltX - pointer.tiltX) * smoothing;
      pointer.tiltY += (targetTiltY - pointer.tiltY) * smoothing;
      burst *= Math.exp(-delta * 4);
      context!.clearRect(0, 0, width, height);
      // The slow field updates at 30 fps; pointer response on the object keeps its own frame rate.
      if (fieldContext && (still || now - lastFieldFrame >= 32 || !lastFieldFrame)) {
        drawField(fieldContext, fieldGroups, fieldWidth, fieldHeight, time);
        lastFieldFrame = now;
      }

      const interactionRadius = size * 0.2;
      for (const group of groups) {
        context!.fillStyle = group.color;
        context!.beginPath();
        for (const point of group.particles) {
          const targetX = originX + point.x * size;
          const targetY = originY + point.y * size;
          let pushX = 0;
          let pushY = 0;
          if (pointer.inside && !still) {
            const dx = targetX - pointer.x;
            const dy = targetY - pointer.y;
            const distance = Math.hypot(dx, dy);
            if (distance < interactionRadius) {
              const force = Math.pow(1 - distance / interactionRadius, 2) * (23 + burst * 75);
              pushX = dx / Math.max(distance, 1) * force;
              pushY = dy / Math.max(distance, 1) * force;
            }
          }
          if (!still) {
            point.offsetX += (pushX - point.offsetX) * smoothing;
            point.offsetY += (pushY - point.offsetY) * smoothing;
          }
          const shimmer = Math.sin(time * 0.65 + point.phase);
          const x = targetX + point.driftX * size * settle + point.offsetX + pointer.tiltX * point.depth + shimmer * 0.65;
          const y = targetY + point.driftY * size * settle + point.offsetY + pointer.tiltY * point.depth + Math.cos(time * 0.5 + point.phase) * 0.8;
          const radius = point.radius * size * dotScale * (1 + shimmer * 0.1);
          context!.moveTo(x + radius, y);
          context!.arc(x, y, radius, 0, Math.PI * 2);
        }
        context!.fill();
      }
      if (!still) frameId = requestAnimationFrame(draw);
    }

    function wake() {
      if (!frameId && alive && visible && !document.hidden && groups.length) {
        lastFrame = 0;
        frameId = requestAnimationFrame(draw);
      }
    }
    const resize = () => {
      if (!alive) return;
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (fieldContext && field) {
        const fieldRect = fieldCanvas.getBoundingClientRect();
        fieldWidth = Math.max(1, fieldRect.width);
        fieldHeight = Math.max(1, fieldRect.height);
        fieldCanvas.width = Math.round(fieldWidth * dpr);
        fieldCanvas.height = Math.round(fieldHeight * dpr);
        fieldContext.setTransform(dpr, 0, 0, dpr, 0, 0);
        const size = Math.min(width, height) * 0.9;
        const quietZones = Array.from(canvas.closest('.home')?.querySelectorAll('.welcome-copy, .home-label') ?? []).map(element => {
          const box = element.getBoundingClientRect();
          return { x: box.left - fieldRect.left, y: box.top - fieldRect.top, width: box.width, height: box.height };
        });
        fieldGroups = buildFieldParticles(field, { x: 0, y: 0, width: fieldWidth, height: fieldHeight }, {
          x: rect.left - fieldRect.left + (width - size) / 2,
          y: rect.top - fieldRect.top + (height - size) / 2,
          width: size, height: size,
        }, quietZones, fieldWidth < 900 ? 8500 : 18000);
        fieldCanvas.dataset.particles = String(fieldGroups.reduce((count, group) => count + group.points.length, 0));
        lastFieldFrame = 0;
      }
      wake();
    };
    const locate = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.inside = pointer.x >= 0 && pointer.y >= 0 && pointer.x <= width && pointer.y <= height;
      wake();
    };
    const onDown = (event: PointerEvent) => {
      locate(event);
      if (pointer.inside && !pausedRef.current) burst = 1;
    };
    const onLeave = () => { pointer.inside = false; };
    const onUp = (event: PointerEvent) => { if (event.pointerType === 'touch') onLeave(); };
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(frameId);
        frameId = 0;
        onLeave();
      } else wake();
    };
    const onOut = (event: PointerEvent) => { if (!event.relatedTarget) onLeave(); };

    image.onload = () => {
      if (!alive) return;
      try {
        const sampled = sampleImage(image, exposure);
        groups = sampled.groups;
        field = sampled.field;
        if (!groups.length) throw new Error('No visible image samples');
        canvas.dataset.particles = String(groups.reduce((total, group) => total + group.particles.length, 0));
        resize();
        setState('ready');
      } catch {
        groups = [];
        fieldGroups = [];
        setState('fallback');
      }
    };
    image.onerror = () => { if (alive) setState('fallback'); };
    image.src = src;
    setState('loading');
    wakeRef.current = wake;
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resizeObserver.observe(fieldCanvas);
    const copy = canvas.closest('.home')?.querySelector('.welcome-copy');
    if (copy) resizeObserver.observe(copy);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) wake();
      else {
        cancelAnimationFrame(frameId);
        frameId = 0;
      }
    });
    intersectionObserver.observe(fieldCanvas);
    window.addEventListener('pointermove', locate, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    window.addEventListener('pointerout', onOut, { passive: true });
    window.addEventListener('blur', onLeave);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      alive = false;
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener('pointermove', locate);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointerout', onOut);
      window.removeEventListener('blur', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      image.onload = image.onerror = null;
      wakeRef.current = null;
    };
  }, [src, exposure, dotScale]);

  return (
    <div className="image-particles" data-state={state}>
      <canvas className="image-atmosphere" ref={fieldCanvasRef} />
      <div className="image-particles-art">
        {state === 'fallback' ? <Burst paused={paused} /> : null}
        <canvas className="image-object" ref={canvasRef} />
      </div>
    </div>
  );
}

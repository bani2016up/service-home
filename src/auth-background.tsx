import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Background, scenes, type Scene } from './backgrounds/Background';
import type { Color } from './backgrounds/imageField';

function applySceneAccent(palette: Color[] | null) {
  // Prefer a characteristic chromatic sample over the image's neutral highlights.
  const source = palette?.find(color => Math.max(...color) - Math.min(...color) > 0.16 && Math.max(...color) > 0.25)
    ?? palette?.[0] ?? [0.98, 0.55, 0.28];
  const maximum = Math.max(...source, 0.01);
  let color = source.map(channel => channel / maximum * 0.68 + 0.22);
  const luminance = (rgb: number[]) => rgb.reduce((sum, channel, index) =>
    sum + (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4) * [0.2126, 0.7152, 0.0722][index], 0);
  // Lift dark reds and blues enough for readable text on the subdued canvas.
  while (luminance(color) < 0.28) color = color.map(channel => channel + (1 - channel) * 0.04);
  document.querySelector<HTMLElement>('.auth-page')?.style.setProperty('--scene-accent', `rgb(${color.map(channel => Math.round(channel * 255)).join(' ')})`);
}

function AuthBackground() {
  const [scene] = useState<Scene>(() => scenes[Math.floor(Math.random() * scenes.length)]);
  const [paused, setPaused] = useState(() =>
    document.hidden || window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    if (scene === 'burst' || scene === 'waves') applySceneAccent(null);
    return () => { document.querySelector<HTMLElement>('.auth-page')?.style.removeProperty('--scene-accent'); };
  }, [scene]);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setPaused(document.hidden || preference.matches);
    preference.addEventListener('change', update);
    document.addEventListener('visibilitychange', update);
    update();
    return () => {
      preference.removeEventListener('change', update);
      document.removeEventListener('visibilitychange', update);
    };
  }, []);

  return <Background scene={scene} paused={paused} onPaletteReady={applySceneAccent} />;
}

createRoot(document.getElementById('auth-background')!).render(<AuthBackground />);

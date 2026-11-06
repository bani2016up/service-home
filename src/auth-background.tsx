import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Background, scenes, type Scene } from './backgrounds/Background';

function AuthBackground() {
  const [scene] = useState<Scene>(() => scenes[Math.floor(Math.random() * scenes.length)]);
  const [paused, setPaused] = useState(() =>
    document.hidden || window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

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

  return <Background scene={scene} paused={paused} />;
}

createRoot(document.getElementById('auth-background')!).render(<AuthBackground />);

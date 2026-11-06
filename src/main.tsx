import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Background, scenes, type Scene } from './backgrounds/Background';
import './styles.css';

function greetingForHour(hour: number) {
  if (hour < 5) return 'Hello.';
  if (hour < 12) return 'Good morning.';
  if (hour < 18) return 'Good afternoon.';
  return 'Good evening.';
}

function Home() {
  const [scene] = useState<Scene>(() => scenes[Math.floor(Math.random() * scenes.length)]);
  const [hour, setHour] = useState(() => new Date().getHours());
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [hidden, setHidden] = useState(() => document.hidden);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMotionChange = () => setReducedMotion(preference.matches);
    const onVisibility = () => {
      setHidden(document.hidden);
      setHour(new Date().getHours());
    };
    const clock = window.setInterval(() => setHour(new Date().getHours()), 60_000);
    preference.addEventListener('change', onMotionChange);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearInterval(clock);
      preference.removeEventListener('change', onMotionChange);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <div className="home" data-scene={scene}>
      <header className="home-label">
        <span className="home-mark" aria-hidden="true"><i /><i /><i /><i /></span>
        Home
        <a className="status-link" href="https://status.prfnv.com/">Status</a>
      </header>
      <main className="welcome">
        <div className="welcome-copy">
          <h1>{greetingForHour(hour)}</h1>
          <p>A place for things I'm building.</p>
        </div>
        <Background scene={scene} paused={reducedMotion || hidden} />
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<Home />);

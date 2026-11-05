import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Background, scenes, sceneLabels, type Scene } from './backgrounds/Background';
import './styles.css';

function greetingForHour(hour: number) {
  if (hour < 5) return 'Hello.';
  if (hour < 12) return 'Good morning.';
  if (hour < 18) return 'Good afternoon.';
  return 'Good evening.';
}

function Home() {
  const [scene, setScene] = useState<Scene>(() => scenes[Math.floor(Math.random() * scenes.length)]);
  const [hour, setHour] = useState(() => new Date().getHours());
  const [paused, setPaused] = useState(false);
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

  const motionPaused = paused || reducedMotion;
  const moveScene = (direction: number) => setScene(current =>
    scenes[(scenes.indexOf(current) + direction + scenes.length) % scenes.length],
  );
  return (
    <div className="home" data-scene={scene}>
      <header className="home-label">
        <span className="home-mark" aria-hidden="true"><i /><i /><i /><i /></span>
        Home
      </header>
      <main className="welcome">
        <div className="welcome-copy">
          <h1>{greetingForHour(hour)}</h1>
          <p>Services will appear here.</p>
        </div>
        <Background key={scene} scene={scene} paused={motionPaused || hidden} />
      </main>
      <footer className="scene-footer">
        <span className="interaction-hint">
          {scene === 'terrain' || motionPaused ? 'A little space for what’s next.' : 'Move your cursor. See what happens.'}
        </span>
        <div className="scene-controls">
          <div className="scene-switcher" role="group" aria-label="Scene navigation">
            <button type="button" className="scene-step" aria-label="Previous scene" onClick={() => moveScene(-1)}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden="true"><path d="m9.5 4-4 4 4 4" /></svg>
            </button>
            <div className="scene-picker">
              <span className="scene-dot" aria-hidden="true" />
              <select aria-label="Choose a scene" value={scene} onChange={event => setScene(event.target.value as Scene)}>
                {scenes.map(name => <option key={name} value={name}>{sceneLabels[name]}</option>)}
              </select>
              <svg className="picker-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden="true"><path d="m5 6.5 3 3 3-3" /></svg>
            </div>
            <button type="button" className="scene-step" aria-label="Next scene" onClick={() => moveScene(1)}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden="true"><path d="m6.5 4 4 4-4 4" /></svg>
            </button>
          </div>
          <button
            type="button"
            className="motion-toggle"
            aria-label={reducedMotion ? 'Animation disabled by system preference' : paused ? 'Play animation' : 'Pause animation'}
            title={reducedMotion ? 'Animation disabled by system preference' : paused ? 'Play animation' : 'Pause animation'}
            disabled={reducedMotion || scene === 'terrain'}
            onClick={() => setPaused(value => !value)}
          >
            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              {motionPaused ? <path d="M5 3.5 12 8l-7 4.5z" /> : <path d="M4.5 3.5h2v9h-2zm5 0h2v9h-2z" />}
            </svg>
          </button>
        </div>
      </footer>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<Home />);

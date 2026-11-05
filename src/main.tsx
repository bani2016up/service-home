import { createRoot } from 'react-dom/client';
import { Background } from './backgrounds/Background';
import './styles.css';

function greetingForHour(hour: number) {
  if (hour < 5) return 'Hello.';
  if (hour < 12) return 'Good morning.';
  if (hour < 18) return 'Good afternoon.';
  return 'Good evening.';
}

function Home() {
  return (
    <div className="home">
      <Background />
      <header className="home-label">
        <span className="home-mark" aria-hidden="true">
          <i /><i /><i /><i />
        </span>
        Home
      </header>
      <main className="welcome">
        <h1>{greetingForHour(new Date().getHours())}</h1>
        <p>Services will appear here.</p>
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<Home />);

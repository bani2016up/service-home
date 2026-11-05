import { lazy, Suspense, useState } from 'react';
import { DotPattern, GridPattern } from './velora/GridPattern';

const RippleGrid = lazy(() => import('./react-bits/RippleGrid'));
const backgrounds = ['dots', 'grid', 'ripple'] as const;

export function Background() {
  const [background] = useState(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return 'dots';
    }
    return backgrounds[Math.floor(Math.random() * backgrounds.length)];
  });

  return (
    <div className="background" aria-hidden="true">
      {background === 'grid' ? (
        <GridPattern className="background-pattern" width={48} height={48} />
      ) : (
        <DotPattern className="background-pattern" width={23} height={23} cr={0.85} />
      )}
      {background === 'ripple' ? (
        <Suspense fallback={null}>
          <RippleGrid
            color="#a4a4a4"
            cellSize={36}
            lineWidth={0.8}
            opacity={0.38}
            glow={0.12}
            rippleStrength={0.35}
            rippleSpeed={0.55}
            rippleInterval={6}
            intro={false}
            mouseInteraction={false}
            clickRipple={false}
            dpr={1}
          />
        </Suspense>
      ) : null}
    </div>
  );
}

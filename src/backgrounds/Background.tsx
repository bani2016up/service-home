import { Component, lazy, Suspense, type ReactNode } from 'react';
import negroniSource from '../assets/negroni-source.png';
import mountainSource from '../assets/mountain-cutout.png';
import alpineSource from '../assets/alpine-cutout.png';
import portalSource from '../assets/portal-cutout.png';
import { ImageParticles } from './ImageParticles';
import { Burst } from './Burst';

const PatternWaves = lazy(() => import('./react-bits/PatternWaves'));
export const scenes = ['negroni', 'mountain', 'alpine', 'portal', 'burst', 'waves'] as const;
export type Scene = (typeof scenes)[number];

const imageSources: Partial<Record<Scene, string>> = {
  negroni: negroniSource,
  mountain: mountainSource,
  alpine: alpineSource,
  portal: portalSource,
};

class SceneFallback extends Component<{ children: ReactNode; paused: boolean }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <div className="waves-fallback"><Burst paused={this.props.paused} /></div> : this.props.children; }
}

export function Background({ scene, paused }: { scene: Scene; paused: boolean }) {
  const source = imageSources[scene];
  return (
    <div className="background" data-scene={scene} data-image={source ? 'true' : undefined} aria-hidden="true">
      {source ? (
        <ImageParticles
          src={source}
          paused={paused}
          exposure={scene === 'mountain' ? 1.65 : 1}
          dotScale={scene === 'mountain' ? 1.25 : 1}
        />
      ) : null}
      {scene === 'burst' ? <Burst paused={paused} /> : null}
      {scene === 'waves' ? (
        <div className="ambient-scene">
          <SceneFallback paused={paused}>
            <Suspense fallback={null}>
              <PatternWaves
                preset="silk"
                color="#fb8d48"
                backgroundColor="#090909"
                spacing={7}
                markSize={0.9}
                speed={0.2}
                scale={1.5}
                depth={0.65}
                light={-30}
                shine={1.6}
                contrast={0.9}
                opacity={1}
                fade="edges"
                fadeSize={0.65}
                interactive={!paused}
                cursorSize={90}
                cursorStrength={0.6}
                paused={paused}
                intro={!paused}
              />
            </Suspense>
          </SceneFallback>
        </div>
      ) : null}
    </div>
  );
}

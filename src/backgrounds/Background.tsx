import { Component, lazy, Suspense, type ReactNode } from 'react';
import negroniSource from '../assets/negroni-source.png';
import { ImageParticles } from './ImageParticles';
import { Relief } from './Relief';

const PatternWaves = lazy(() => import('./react-bits/PatternWaves'));
export const scenes = ['negroni', 'terrain', 'waves'] as const;
export type Scene = (typeof scenes)[number];

class SceneFallback extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <div className="waves-fallback"><Relief /></div> : this.props.children; }
}

export function Background({ scene, paused }: { scene: Scene; paused: boolean }) {
  return (
    <div className="background" data-scene={scene} aria-hidden="true">
      {scene === 'negroni' ? <ImageParticles src={negroniSource} paused={paused} /> : null}
      {scene === 'terrain' ? <Relief /> : null}
      {scene === 'waves' ? (
        <SceneFallback>
          <Suspense fallback={<div className="waves-fallback"><Relief /></div>}>
            <PatternWaves
              preset="silk"
              color="#c4bbdf"
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
      ) : null}
    </div>
  );
}

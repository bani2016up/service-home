import { useState } from 'react';
import { ObjectFigure } from './ObjectFigure';
import { Relief } from './Relief';
import { DotPattern } from './velora/DotPattern';

const figures = ['relief', 'negroni', 'guitar', 'surfboard'] as const;

export function Background() {
  const [figure] = useState(() => figures[Math.floor(Math.random() * figures.length)]);

  return (
    <div className="background" data-figure={figure} aria-hidden="true">
      <DotPattern className="background-pattern" width={23} height={23} cr={0.85} />
      {figure === 'relief' ? <Relief /> : <ObjectFigure figure={figure} />}
    </div>
  );
}

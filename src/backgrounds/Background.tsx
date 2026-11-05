import { useState } from 'react';
import negroniUrl from './generated/negroni.svg';
import { ObjectFigure } from './ObjectFigure';
import { Relief } from './Relief';
import { DotPattern } from './velora/DotPattern';

const figures = ['relief', 'negroni', 'guitar', 'surfboard'] as const;

function Figure({ name }: { name: (typeof figures)[number] }) {
  if (name === 'relief') return <Relief />;
  if (name === 'negroni') return <img className="background-object" src={negroniUrl} alt="" />;
  return <ObjectFigure figure={name} />;
}

export function Background() {
  const [figure] = useState(() => figures[Math.floor(Math.random() * figures.length)]);

  return (
    <div className="background" data-figure={figure} aria-hidden="true">
      <DotPattern className="background-pattern" width={23} height={23} cr={0.85} />
      <Figure name={figure} />
    </div>
  );
}

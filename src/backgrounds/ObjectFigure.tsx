import { useId } from 'react';

type DrawingProps = { texture: string };

function Guitar({ texture }: DrawingProps) {
  return (
    <g transform="rotate(37 150 144)">
      <path
        fill={texture}
        d="M139 131C123 119 106 125 103 143C100 159 114 163 110 177C106 190 94 195 95 215C96 239 118 251 150 251S204 239 205 215C206 195 194 190 190 177C186 163 200 159 197 143C194 125 177 119 161 131Z"
      />
      <path fill={texture} d="M141 166L143 78L137 72L139 41L161 41L163 72L157 78L159 166Z" />
      <path className="object-detail" d="M143 88H157M143 98H157M143 108H157M142 119H158M142 130H158M142 141H158M141 153H159" />
      <path className="object-highlight" d="M132 52H139M132 62H138M133 72H137M161 52H168M162 62H168M163 72H167" />
      <circle cx="150" cy="171" r="15" fill="#090909" />
      <circle className="object-detail" cx="150" cy="171" r="19" />
      <path d="M134 204H166V211H134Z" />
      <path className="object-detail" d="M146 48V205M150 48V205M154 48V205" />
      <path className="object-detail" d="M109 202C100 227 119 241 139 244M194 200C201 220 194 230 181 237" />
    </g>
  );
}

function Surfboard({ texture }: DrawingProps) {
  return (
    <>
      <g transform="rotate(43 155 143)">
        <path className="object-highlight" fill={texture} d="M155 36C187 65 185 159 164 221Q155 232 146 221C125 159 123 65 155 36Z" />
        <path className="object-detail" d="M155 44V218M140 107Q155 112 171 105M138 118Q155 122 173 115" />
      </g>
      <path className="object-detail" d="M28 227C58 230 74 220 94 218C111 215 125 221 140 222C164 224 174 208 192 202C215 194 234 209 249 200C261 193 262 180 253 175C246 171 239 176 240 182C224 169 252 153 267 168C292 194 260 227 228 224C205 222 192 229 169 237C139 248 119 233 98 235C71 239 53 241 28 235" />
      <path className="object-detail" d="M143 251C177 258 202 239 227 239C245 239 254 246 272 240M52 250C69 253 84 246 104 248" />
    </>
  );
}

const drawings = {
  guitar: Guitar,
  surfboard: Surfboard,
};

export function ObjectFigure({ figure }: { figure: keyof typeof drawings }) {
  const id = useId();
  const Drawing = drawings[figure];

  return (
    <svg className="background-object" viewBox="0 0 300 270" fill="none" aria-hidden="true">
      <defs>
        <pattern id={id} width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.65" fill="currentColor" opacity="0.42" />
          <circle cx="4.5" cy="4.5" r="0.52" fill="currentColor" opacity="0.26" />
        </pattern>
      </defs>
      <g className="object-lines">
        <Drawing texture={`url(#${id})`} />
      </g>
    </svg>
  );
}

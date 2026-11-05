import { mkdirSync, writeFileSync } from 'node:fs';
import {
  CircleGeometry,
  ExtrudeGeometry,
  LatheGeometry,
  Mesh,
  PerspectiveCamera,
  Shape,
  TorusGeometry,
  Vector2,
  Vector3,
} from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';

const width = 300;
const height = 270;
const camera = new PerspectiveCamera(25, width / height, 0.1, 20);
camera.position.set(2.3, 3.6, 5.5);
camera.lookAt(0.08, 0.99, 0);
camera.updateMatrixWorld();

const light = new Vector3(-0.68, 0.75, 0.42).normalize();
const point = new Vector3();
const normal = new Vector3();
const view = new Vector3();
const tones = [0.1, 0.18, 0.28, 0.41, 0.56, 0.72, 0.88];
const paths = tones.map(() => '');
let seed = 35189;

function random() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
}

function sample(geometry, count, { ambient, diffuse, back = 0, sheen = 0, fill = 0 }) {
  const sampler = new MeshSurfaceSampler(new Mesh(geometry)).setRandomGenerator(random).build();

  for (let index = 0; index < count; index++) {
    sampler.sample(point, normal);
    const facing = normal.dot(view.subVectors(camera.position, point).normalize());
    if (facing <= 0 && random() >= back) continue;

    const lambert = Math.max(0, normal.dot(light));
    const edge = (1 - Math.abs(facing)) ** 3;
    const brightness = (ambient + diffuse * lambert + sheen * edge + fill * Math.max(0, facing)) *
      (0.85 + random() * 0.29);
    const tone = Math.min(tones.length - 1, Math.floor(brightness * tones.length));
    point.project(camera);
    const x = ((point.x + 1) * width / 2).toFixed(1);
    const y = ((1 - point.y) * height / 2).toFixed(1);
    paths[tone] += `M${x} ${y}h.01`;
  }
}

const glassProfile = [
  [0.02, 0.08], [0.79, 0.08], [0.88, 0.11], [0.92, 0.18],
  [0.95, 0.32], [1.07, 1.41], [1.08, 1.49], [1.06, 1.53],
  [1.02, 1.53], [1.00, 1.49], [0.98, 1.37], [0.87, 0.34],
  [0.83, 0.27], [0.02, 0.27],
].map(([radius, y]) => new Vector2(radius, y));
sample(new LatheGeometry(glassProfile, 84), 3100, {
  ambient: 0.15, diffuse: 0.35, sheen: 0.32, back: 0.09,
});

const rim = new TorusGeometry(1.049, 0.025, 10, 96).rotateX(Math.PI / 2).translate(0, 1.515, 0);
sample(rim, 1150, { ambient: 0.3, diffuse: 0.45, back: 0.33 });
const base = new TorusGeometry(0.875, 0.025, 8, 80).rotateX(Math.PI / 2).translate(0, 0.14, 0);
sample(base, 760, { ambient: 0.18, diffuse: 0.38, sheen: 0.1, back: 0.18 });

const liquid = new CircleGeometry(0.985, 80).rotateX(-Math.PI / 2).translate(0, 1.26, 0);
sample(liquid, 560, { ambient: 0.08, diffuse: 0.08 });

const ice = new RoundedBoxGeometry(0.85, 0.8, 0.86, 4, 0.06)
  .rotateY(-0.37).rotateZ(0.32).rotateX(0.14).translate(-0.34, 1.53, 0);
sample(ice, 1050, { ambient: 0.28, diffuse: 0.59, sheen: 0.16, fill: 0.24 });

function placeGarnish(geometry) {
  return geometry.rotateY(0.36).rotateZ(-0.24).rotateX(-0.32).translate(0.74, 1.83, 0.2);
}

for (let segment = 0; segment < 7; segment++) {
  const start = segment * Math.PI / 7 + 0.038;
  const end = (segment + 1) * Math.PI / 7 - 0.038;
  const shape = new Shape();
  shape.moveTo(0, 0);
  shape.lineTo(0.49 * Math.cos(start), 0.49 * Math.sin(start));
  shape.absarc(0, 0, 0.49, start, end, false);
  shape.closePath();
  const flesh = new ExtrudeGeometry(shape, { depth: 0.052, bevelEnabled: false, curveSegments: 12 });
  sample(placeGarnish(flesh), 62, { ambient: 0.35, diffuse: 0.28, fill: 0.28 });
}

const peel = new TorusGeometry(0.514, 0.026, 8, 45, Math.PI);
sample(placeGarnish(peel), 270, { ambient: 0.5, diffuse: 0.4, fill: 0.14, back: 0.15 });

const pathsMarkup = paths.map((path, tone) =>
  `  <path d="${path}" stroke-width="${(0.82 + tone * 0.15).toFixed(2)}" opacity="${tones[tone]}"/>`,
).join('\n');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" fill="none" stroke="#d2d4d6" stroke-linecap="round">
${pathsMarkup}
</svg>
`;

const outputDirectory = new URL('../src/backgrounds/generated/', import.meta.url);
mkdirSync(outputDirectory, { recursive: true });
writeFileSync(new URL('negroni.svg', outputDirectory), svg);

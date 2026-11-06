import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../src/backgrounds/imageField.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const { createImageField, buildFieldParticles } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputText).toString('base64')}`);

function fixture(size, pixel) {
  const data = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) data.set(pixel(x / size, y / size), (y * size + x) * 4);
  return data;
}

const resolution = 64;
const triangle = createImageField(fixture(resolution, (x, y) =>
  x > 0.2 && y > 0.2 && x + y < 1 ? [240, 50, 20, 255] : [0, 255, 0, 0],
), resolution);
assert.equal(triangle.sample(0.375, 0.375).coverage, 1);
assert.ok(triangle.sample(0.75, 0.75).distance > 0.3, 'Distance must follow the triangle, not its rectangular bounds');
const border = triangle.sample(0.15, 0.375);
assert.ok(border.distance > 0 && border.distance < 0.1);
assert.ok(border.color[0] > 0.9 && border.color[1] < 0.21, 'Transparent green pixels must not contaminate the red edge');
assert.ok(triangle.sample(-0.5, 0.375).distance > 0.65, 'Distance must continue outside the image bounds');

const ring = createImageField(fixture(resolution, (x, y) => {
  const radius = Math.hypot(x - 0.5, y - 0.5);
  return radius > 0.15 && radius < 0.35 ? [180, 100, 60, 255] : [0, 0, 0, 0];
}), resolution);
assert.equal(ring.sample(0.5, 0.5).coverage, 0);
assert.ok(ring.sample(0.5, 0.5).distance > 0.14 && ring.sample(0.5, 0.5).distance < 0.18, 'Internal holes must retain their contour');

const colors = createImageField(fixture(resolution, (x, y) =>
  x > 0.2 && x < 0.8 && y > 0.2 && y < 0.8 ? (x < 0.5 ? [255, 40, 10, 255] : [20, 80, 255, 255]) : [0, 0, 0, 0],
), resolution);
assert.ok(colors.sample(0.18, 0.4).color[0] > 0.9, 'The left transition must preserve local red');
assert.ok(colors.sample(0.82, 0.4).color[2] > 0.9, 'The right transition must preserve local blue');
assert.throws(() => createImageField(new Uint8ClampedArray(64 * 64 * 4), 64), /silhouette/);

const viewport = { x: 0, y: 0, width: 1512, height: 982 };
const artwork = { x: 650, y: 150, width: 650, height: 650 };
const groups = buildFieldParticles(colors, viewport, artwork, [], 3000);
assert.deepEqual(groups, buildFieldParticles(colors, viewport, artwork, [], 3000), 'Seeded grain must remain deterministic');
const points = groups.flatMap(group => group.points);
assert.ok(points.length > 500 && points.length <= 3000, 'The particle budget must be enforced');
let nearEdge = 0;
for (const point of points) {
  const sample = colors.sample((point.x - artwork.x) / artwork.width, (point.y - artwork.y) / artwork.height);
  assert.ok(sample.coverage < 0.2, 'Background particles must not draw over the object');
  if (sample.distance < 0.02) {
    nearEdge++;
    assert.ok(point.travel < 0.5 && point.length < 0.02, 'Motion and lines must settle at the silhouette');
  }
}
assert.ok(nearEdge > 0);

const quiet = buildFieldParticles(colors, viewport, artwork, [{ x: 80, y: 350, width: 480, height: 180 }], 3000);
const alpha = color => Number(color.slice(color.lastIndexOf(',') + 1, -1));
const originalAlpha = new Map(groups.flatMap(group => group.points.map(point => [`${point.x},${point.y}`, alpha(group.color)])));
let dimmed = 0;
for (const group of quiet) for (const point of group.points) {
  const previous = originalAlpha.get(`${point.x},${point.y}`);
  if (previous !== undefined && point.x > 80 && point.x < 560 && point.y > 350 && point.y < 530) {
    assert.ok(alpha(group.color) <= previous);
    if (alpha(group.color) < previous) dimmed++;
  }
}
assert.ok(dimmed > 0, 'Text must have a quieter region');

console.log(`Image field checks passed: silhouette, holes, local color, transparent edges, deterministic grain, ${points.length}-particle budget, motion falloff, text contrast.`);

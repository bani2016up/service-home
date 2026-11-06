export type Color = [number, number, number];
export type Rect = { x: number; y: number; width: number; height: number };
export type FieldSample = { distance: number; coverage: number; color: Color };
export type ImageField = { palette: Color[]; sample: (u: number, v: number) => FieldSample };
export type FieldPoint = {
  x: number; y: number; radius: number; phase: number;
  travel: number; tangentX: number; tangentY: number; length: number;
};
export type FieldGroup = { color: string; points: FieldPoint[] };

export function noise(x: number, y: number) {
  const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

export function smoothstep(low: number, high: number, value: number) {
  const t = Math.max(0, Math.min(1, (value - low) / (high - low)));
  return t * t * (3 - 2 * t);
}

function mix(a: Color, b: Color, weight: number): Color {
  return [a[0] + (b[0] - a[0]) * weight, a[1] + (b[1] - a[1]) * weight, a[2] + (b[2] - a[2]) * weight];
}

// Blur premultiplied RGB and alpha together; transparent pixels cannot add black fringes.
function blur(source: Float32Array, side: number, radius: number) {
  const horizontal = new Float32Array(source.length);
  const result = new Float32Array(source.length);
  const diameter = radius * 2 + 1;
  for (let row = 0; row < side; row++) {
    for (let channel = 0; channel < 4; channel++) {
      let sum = 0;
      for (let offset = -radius; offset <= radius; offset++) sum += source[(row * side + Math.max(0, offset)) * 4 + channel];
      for (let x = 0; x < side; x++) {
        horizontal[(row * side + x) * 4 + channel] = sum / diameter;
        sum += source[(row * side + Math.min(side - 1, x + radius + 1)) * 4 + channel];
        sum -= source[(row * side + Math.max(0, x - radius)) * 4 + channel];
      }
    }
  }
  for (let column = 0; column < side; column++) {
    for (let channel = 0; channel < 4; channel++) {
      let sum = 0;
      for (let offset = -radius; offset <= radius; offset++) sum += horizontal[(Math.max(0, offset) * side + column) * 4 + channel];
      for (let y = 0; y < side; y++) {
        result[(y * side + column) * 4 + channel] = sum / diameter;
        sum += horizontal[(Math.min(side - 1, y + radius + 1) * side + column) * 4 + channel];
        sum -= horizontal[(Math.max(0, y - radius) * side + column) * 4 + channel];
      }
    }
  }
  return result;
}

export function createImageField(data: Uint8ClampedArray, resolution: number, exposure = 1): ImageField {
  const padding = Math.ceil(resolution * 0.25);
  const side = resolution + padding * 2;
  const pixels = new Float32Array(side * side * 4);
  const nearest = new Int32Array(side * side).fill(-1);
  const histogram = new Map<string, { color: Color; weight: number }>();
  let opaquePixels = 0;
  for (let y = 0; y < resolution; y++) {
    for (let x = 0; x < resolution; x++) {
      const input = (y * resolution + x) * 4;
      const index = (y + padding) * side + x + padding;
      const alpha = data[input + 3] / 255;
      const color = [0, 1, 2].map(channel => Math.min(1, data[input + channel] / 255 * exposure)) as Color;
      for (let channel = 0; channel < 3; channel++) pixels[index * 4 + channel] = color[channel] * alpha;
      pixels[index * 4 + 3] = alpha;
      if (alpha < 0.2) continue;
      nearest[index] = index;
      opaquePixels++;
      const maximum = Math.max(...color);
      if (maximum < 0.12) continue;
      const quantized = color.map(value => Math.round(value * 5) / 5) as Color;
      const key = quantized.join(',');
      const weight = alpha * (maximum * 0.15 + (maximum - Math.min(...color)) * 0.85);
      const bucket = histogram.get(key);
      if (bucket) bucket.weight += weight;
      else histogram.set(key, { color: quantized, weight });
    }
  }
  if (!opaquePixels) throw new Error('The image has no visible silhouette');

  // Propagate nearest opaque samples across the transparent padding. Coordinates,
  // rather than accumulated grid steps, preserve curved and concave boundaries.
  const improve = (x: number, y: number, neighbourX: number, neighbourY: number) => {
    if (neighbourX < 0 || neighbourY < 0 || neighbourX >= side || neighbourY >= side) return;
    const candidate = nearest[neighbourY * side + neighbourX];
    if (candidate < 0) return;
    const index = y * side + x;
    const current = nearest[index];
    const distance = (candidate % side - x) ** 2 + (Math.floor(candidate / side) - y) ** 2;
    if (current < 0 || distance < (current % side - x) ** 2 + (Math.floor(current / side) - y) ** 2) nearest[index] = candidate;
  };
  for (let pass = 0; pass < 2; pass++) {
    for (let y = 0; y < side; y++) for (let x = 0; x < side; x++) {
      improve(x, y, x - 1, y);
      improve(x, y, x - 1, y - 1);
      improve(x, y, x, y - 1);
      improve(x, y, x + 1, y - 1);
    }
    for (let y = side - 1; y >= 0; y--) for (let x = side - 1; x >= 0; x--) {
      improve(x, y, x + 1, y);
      improve(x, y, x + 1, y + 1);
      improve(x, y, x, y + 1);
      improve(x, y, x - 1, y + 1);
    }
  }
  const fineRadius = Math.max(1, Math.round(resolution * 0.023));
  const broadRadius = Math.max(1, Math.round(resolution * 0.08));
  const fine = blur(blur(pixels, side, fineRadius), side, fineRadius);
  const broad = blur(blur(pixels, side, broadRadius), side, broadRadius);
  const palette = Array.from(histogram.values()).sort((a, b) => b.weight - a.weight).slice(0, 6).map(bucket => bucket.color);
  if (!palette.length) palette.push([0.2, 0.2, 0.2]);
  const colorAt = (layer: Float32Array, index: number, fallback: number): Color => {
    const pixel = layer[index * 4 + 3] > 0.0001 ? index : fallback;
    const alpha = Math.max(0.0001, layer[pixel * 4 + 3]);
    return [layer[pixel * 4] / alpha, layer[pixel * 4 + 1] / alpha, layer[pixel * 4 + 2] / alpha];
  };
  return {
    palette,
    sample(u, v) {
      const x = u * resolution + padding;
      const y = v * resolution + padding;
      const column = Math.max(0, Math.min(side - 1, Math.round(x)));
      const row = Math.max(0, Math.min(side - 1, Math.round(y)));
      const index = row * side + column;
      const seed = nearest[index];
      const distance = Math.hypot(seed % side - x, Math.floor(seed / side) - y) / resolution;
      const within = x >= 0 && y >= 0 && x < side && y < side;
      return {
        distance,
        coverage: within ? pixels[index * 4 + 3] : 0,
        color: mix(colorAt(fine, index, seed), colorAt(broad, index, seed), smoothstep(0, 0.16, distance)),
      };
    },
  };
}

export function buildFieldParticles(field: ImageField, viewport: Rect, artwork: Rect, quietZones: Rect[] = [], budget = 18000): FieldGroup[] {
  const step = Math.max(3, Math.sqrt(viewport.width * viewport.height / (budget * 2.6)));
  const selected: { color: string; point: FieldPoint }[] = [];
  let candidates = 0;
  for (let y = step / 2; y < viewport.height; y += step) {
    for (let x = step / 2; x < viewport.width; x += step) {
      const seed = noise(x, y);
      const px = x + (seed - 0.5) * step * 0.65;
      const py = y + (noise(y, x) - 0.5) * step * 0.65;
      const u = (px - artwork.x) / artwork.width;
      const v = (py - artwork.y) / artwork.height;
      const sample = field.sample(u, v);
      if (sample.coverage >= 0.2) continue;
      const proximity = 1 - smoothstep(0, 0.2, sample.distance);
      if (noise(x + 29, y - 31) > 0.42 + proximity * 0.5) continue;
      const phase = u * 3.8 + v * 4.6 + Math.sin(v * 3.5 - u * 1.4) * 2.3 + Math.cos(u * 2.1 + v) * 1.7;
      const flow = (Math.sin(u * 0.9 + v * 1.7 + Math.cos(v * 2.2)) + 1) / 2 * (field.palette.length - 1);
      const paletteIndex = Math.floor(flow);
      const paletteColor = mix(field.palette[paletteIndex], field.palette[Math.min(paletteIndex + 1, field.palette.length - 1)], flow - paletteIndex);
      const color = mix(paletteColor, sample.color, proximity);
      let contrast = 1;
      for (const zone of quietZones) {
        const dx = Math.max(zone.x - px, 0, px - zone.x - zone.width);
        const dy = Math.max(zone.y - py, 0, py - zone.y - zone.height);
        contrast = Math.min(contrast, 0.28 + smoothstep(0, 120, Math.hypot(dx, dy)) * 0.72);
      }
      const ridge = Math.pow((Math.sin(phase) + 1) / 2, 2);
      const opacity = (0.1 + ridge * 0.4 + proximity * 0.36) * contrast * (0.7 + seed * 0.3);
      const channels = color.map(channel => Math.min(255, Math.round(Math.pow(Math.max(0, channel), 0.78) * 255 / 24) * 24));
      const alpha = Math.round(opacity * 24) / 24;
      if (!alpha) continue;
      const angle = Math.sin(v * 3.5 - u * 1.4) * 0.8 + Math.cos(u * 2.1 + v) * 0.7 - 0.5;
      const particle = {
        color: `rgba(${channels.join(',')},${alpha})`,
        point: {
          x: px, y: py, phase,
          radius: (0.7 + seed * 0.6 + ridge * 0.65) * (0.85 + proximity * 0.15),
          travel: (1 - proximity) * (3 + ridge * 4),
          tangentX: Math.cos(angle), tangentY: Math.sin(angle),
          length: seed > 0.94 ? (1 - proximity) ** 2 * (4 + ridge * 10) : 0,
        },
      };
      candidates++;
      if (selected.length < budget) selected.push(particle);
      else {
        // Deterministic reservoir sampling caps work without cropping the bottom of the field.
        const index = Math.floor(noise(x + 91, y + 43) * candidates);
        if (index < budget) selected[index] = particle;
      }
    }
  }
  const groups = new Map<string, FieldPoint[]>();
  for (const { color, point } of selected) {
    const group = groups.get(color);
    if (group) group.push(point);
    else groups.set(color, [point]);
  }
  return Array.from(groups, ([color, points]) => ({ color, points }));
}

export function drawField(context: CanvasRenderingContext2D, groups: FieldGroup[], width: number, height: number, time: number) {
  context.clearRect(0, 0, width, height);
  for (const group of groups) {
    context.fillStyle = group.color;
    context.beginPath();
    for (const point of group.points) {
      const movement = Math.sin(time * 0.24 + point.phase) * point.travel;
      const x = point.x + point.tangentX * movement;
      const y = point.y + point.tangentY * movement;
      const radius = point.radius * (0.86 + Math.sin(time * 0.3 + point.phase) * 0.14);
      if (point.length > 1) {
        const dx = point.tangentX * point.length;
        const dy = point.tangentY * point.length;
        const nx = -point.tangentY * 0.35;
        const ny = point.tangentX * 0.35;
        context.moveTo(x + nx, y + ny);
        context.lineTo(x + dx + nx, y + dy + ny);
        context.lineTo(x + dx - nx, y + dy - ny);
        context.lineTo(x - nx, y - ny);
      } else {
        context.moveTo(x + radius, y);
        context.arc(x, y, radius, 0, Math.PI * 2);
      }
    }
    context.fill();
  }
}

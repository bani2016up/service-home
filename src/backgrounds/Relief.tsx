const dotOpacities = [0.1, 0.19, 0.29, 0.42, 0.58];

function peak(x: number, depth: number, centerX: number, centerDepth: number, width: number) {
  const offset = (x - centerX) / width;
  const distance = (depth - centerDepth) / 0.26;
  return Math.exp(-(offset ** 2 + distance ** 2));
}

function drawRelief() {
  const layers = dotOpacities.map(() => '');

  for (let row = 0; row < 35; row++) {
    const depth = row / 34;

    for (let column = 0; column < 108; column++) {
      const x = column / 107;
      const peaks =
        132 * peak(x, depth, 0.59, 0.36, 0.11) +
        88 * peak(x, depth, 0.72, 0.47, 0.09) +
        53 * peak(x, depth, 0.83, 0.53, 0.09) +
        42 * peak(x, depth, 0.39, 0.52, 0.15);
      const surface = 1 + 0.13 * Math.sin(x * 43 + depth * 17) + 0.07 * Math.cos(x * 83 - depth * 19);
      const height = peaks * surface;
      const screenX = 410 + (x - 0.5) * (640 + depth * 170);
      const screenY = 125 + depth * 207 - height;
      const edge = Math.sin(Math.PI * x) * Math.sin(Math.PI * depth);
      const brightness = edge * (0.12 + height / 132);

      if (brightness < 0.09) continue;

      const layer = Math.min(layers.length - 1, Math.floor(brightness * layers.length));
      layers[layer] += `M${screenX.toFixed(1)} ${screenY.toFixed(1)}h.01`;
    }
  }

  return layers;
}

const relief = (
  <svg className="background-relief" viewBox="0 0 820 340" fill="none" aria-hidden="true">
    {drawRelief().map((path, layer) => (
      <path
        key={dotOpacities[layer]}
        d={path}
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth={1.1 + layer * 0.23}
        opacity={dotOpacities[layer]}
      />
    ))}
  </svg>
);

export function Relief() {
  return relief;
}

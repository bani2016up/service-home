# Service Home

A minimal personal homepage with a greeting based on the visitor's local time. A random scene appears on each visit. The footer offers six scenes through a compact selector, previous/next buttons, and an animation pause button. Orange is the shared interface accent.

## Development

Use Node.js 20.19 or later in the 20.x release line, or Node.js 22.12 or later.

    npm ci
    npm run dev

Run `npm run build` to type-check the project and generate the static site in `dist/`. Serve that directory at the root of the domain with any static web server.

## Scenes

- **Negroni:** an original image-to-particle renderer. `ImageParticles` samples the source image's alpha, brightness, and color on a 176 × 176 grid. The current image produces about 15,000 points. They assemble on entry, drift gently, respond to the pointer, and spring back into place. Clicking the object adds a stronger impulse. Brightness supplies a small depth offset; this is a 2D image with simulated depth, not a rotatable 3D model.
- **Mountain:** a red-lit mountain cut out from the supplied reference. Increased particle exposure and dot size keep its dark slopes visible.
- **Alpine collage:** snowy orange-lit mountains, the vertical collage fragment, and its white diamond outline.
- **Cloud portal:** the red portal and monochrome foreground clouds isolated from the surrounding sky.
- **Terrain:** the original procedural mountain relief, preserved as a quiet static option and a fallback for loading or unavailable rendering.
- **Waves:** [React Bits Pattern Waves](https://reactbits.dev/backgrounds/pattern-waves), customized with warm orange tones, pale highlights, and cursor ripples. OGL and the component are loaded only when selected. It requires WebGL 2.

The greeting updates while the page stays open. Motion respects the system's reduced-motion preference, can be paused manually, and stops while the page is hidden. The Negroni canvas is capped at 2× device pixel ratio. Its point colors are grouped to reduce drawing overhead.

All six scenes retain the same grid footprint. Waves extend across the page inside that footprint, so switching scenes does not move the greeting on desktop or mobile. The artwork is enlarged beyond its layout slot and sits beside the text in a compact, centered composition. On mobile, the text and artwork form one closely spaced stack.

To try another object, pass a local transparent image URL to `ImageParticles`. A well-lit silhouette and distinct highlights work best. Image loading or sampling failures show Terrain instead of an empty scene. There is no public upload interface.

The additional transparent PNGs live in `src/assets/`. Their editing prompts and reference filenames are preserved in [design/image-prompts.md](design/image-prompts.md). The server cutout is retained as an unused source asset; it is excluded from the scene selector and production bundle. Only the selected image is fetched; each new source is approximately 1.7–2.1 MB in this prototype.

## Library comparison

| Source | Fit for this homepage | Decision |
| --- | --- | --- |
| [React Bits](https://reactbits.dev/c/backgrounds) | A dedicated collection of configurable React effects. Pattern Waves provides a coherent procedural surface. | Included one component, loaded on demand. |
| [21st.dev backgrounds](https://21st.dev/community/components/explore/react-animated-backgrounds) | A community catalog with components by different authors, rather than one consistent background API. [Flow Field](https://21st.dev/@jahed/components/flow-field-background) explores interactive flowing particles. Its page offers the implementation through a free account; the public code is only a usage example. | Used as a reference. No 21st.dev implementation is bundled. |
| Original image sampling | Preserves recognizable objects, their lighting, and their colors. | Used for the Negroni experiment. |

## Sources and licenses

Pattern Waves was retrieved from the [official TypeScript/CSS registry](https://reactbits.dev/r/PatternWaves-TS-CSS.json). Its [MIT + Commons Clause license](public/licenses/react-bits.md) permits use in this site and restricts selling the library itself. Local adaptations remove the Next.js directive, pause work while hidden, listen for motion-preference changes, and surface unsupported WebGL to the scene fallback.

The Negroni source was generated with the built-in ImageGen tool. The original transparent PNG is stored at [src/assets/negroni-source.png](src/assets/negroni-source.png). The renderer samples this image at runtime; the prototype currently downloads the full 2.3 MB source when this scene is selected. The final prompt is preserved below.

### Image generation prompt

> Use case: product-mockup. Asset type: source image to convert into an interactive colored point cloud on a black minimalist personal website. Create one extraordinary photorealistic Negroni cocktail, centered and isolated on a genuinely transparent background. A broad low crystal rocks tumbler, ruby vermilion and amber liquid, one large translucent square ice cube, a single elegant curled orange peel draped over the rim. Three-quarter camera view slightly from above, strong readable silhouette. Bright cool ivory reflections in the thick glass, warm orange-red luminous liquid, crisp facets of ice, rich dark shadows. Refined high-end bar still life with dramatic studio rim lighting, realistic proportions. Object fills approximately 80% of square frame, full base and garnish in frame. No floor, no shadow outside object, no extra objects, no text or logos, no dots or particles, no graphic overlays. Preserve enough tonal contrast and material detail for a pixel-to-particle conversion.

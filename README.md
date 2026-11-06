# Service Home

A minimal personal homepage with a greeting based on the visitor's local time and the line “A place for things I'm building.” A random scene appears on each visit. The page has no scene controls or interaction instructions. Orange is the shared visual accent.

The header links to the private monitoring page at `https://status.prfnv.com/`. Access is restricted by server-side Google authentication.

The authentication pages live in `auth-required.html`, `auth-denied.html`, and `auth-error.html`. They share the homepage's styles and `Background` component, including random scenes, animation, and reduced-motion handling. Their text and sign-in links remain usable without JavaScript.

Vite builds all four pages together. Public scripts, styles, and images are emitted under `/landing-assets/`, separate from protected applications' assets. Nginx must serve that directory before authentication on each host and permit same-origin scripts, styles, images, and connections in the authentication pages' CSP. It serves the HTML pages internally, preserving HTTP 401, 403, or the original server error status. OAuth upstream errors use `proxy_intercept_errors` and `error_page` without exposing protected routes. The public `/sign-in` endpoint starts a new Google login with a fixed return target. The HTML pages never grant access.

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
- **Burst:** an original procedural field of 22,000 seeded particles. Seven curved rays combine orange cores, warm tips, and cool blue-violet edges. The field breathes slowly and responds to the pointer with slight depth movement. It also replaces the old terrain in error fallbacks; a static SVG version remains available without Canvas 2D.
- **Waves:** [React Bits Pattern Waves](https://reactbits.dev/backgrounds/pattern-waves), customized with warm orange tones, pale highlights, and cursor ripples. OGL and the component are loaded only when selected. It requires WebGL 2.

The greeting updates while the page stays open. Motion respects the system's reduced-motion preference and stops while the page is hidden. Particle canvases are capped at 2× device pixel ratio. Point colors are grouped to reduce drawing overhead.

### Image-derived atmosphere

The four image scenes share a full-page field of points and short flowing lines. `imageField.ts` extracts a palette from the same image pixels used by `ImageParticles`. Its alpha mask provides the silhouette, including holes and concave edges. Nearest-sample propagation approximates distance to that silhouette, rather than the rectangular image bounds.

Outside the object, coherent waves carry its palette. Within 20% of the displayed image size from the silhouette, color blends toward a locally blurred continuation of the image. Blur operates on premultiplied RGB and alpha, then normalizes color, so transparent pixels cannot introduce a black fringe. Particle motion and line length diminish toward the contour. Opaque image regions suppress the atmospheric layer and retain the original detailed image particles.

The atmosphere and object become visible together after the chosen source loads. Header and copy regions soften the field to retain legibility, including on the shared authentication pages. Geometry is prepared on load and resize; the field updates at up to 30 fps while the object's pointer response retains its existing frame rate. The atmospheric budget is capped at 18,000 points on desktop and 8,500 on narrow layouts. No additional dependency, image asset, or WebGL requirement is introduced.

Run `npm run check:field` for silhouette, concavity, color-continuation, transparent-pixel, deterministic-grain, particle-budget, motion-falloff, and text-region checks.

Home and the greeting share one left alignment inside a fixed-width content frame. The text and artwork columns no longer depend on the greeting's length. All six scenes retain the same layout footprint, with individual optical scale and position adjustments. Waves extend across the page behind the same fixed text anchor. On mobile, the text and artwork form one closely spaced stack; the greeting stays on one line.

To try another object, pass a local transparent image URL to `ImageParticles`. A well-lit silhouette and distinct highlights work best. While the chosen image or Waves module loads, its space stays clear so another scene never flashes first. Image loading or sampling failures show Burst instead of an empty scene. There is no public upload interface.

The additional transparent PNGs live in `src/assets/`. Their editing prompts and reference filenames are preserved in [design/image-prompts.md](design/image-prompts.md). The server cutout is retained as an unused source asset; it is excluded from the available scenes and production bundle. Only the selected image is fetched; each new source is approximately 1.7–2.1 MB in this prototype.

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

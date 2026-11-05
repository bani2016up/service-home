# Scene image edits

These four cutouts were edited from the user-provided Pinterest references using the built-in ImageGen tool. They preserve alpha transparency and are sampled by ImageParticles at runtime.

The edits isolate and reframe the subjects. Image generation may reconstruct small texture and lettering details; these are visual source assets, not exact archival cutouts.

## mountain

- Asset: [src/assets/mountain-cutout.png](../src/assets/mountain-cutout.png)
- Reference: user attachment codex-clipboard-5a7ed461-08d7-4958-bc3d-39944d49e644.png

### Final prompt

Use case: background-extraction. Edit the attached mountain image into a transparent cutout for a point-cloud website. Remove only the dark navy sky and empty background surrounding the mountain. Preserve the exact distinctive pointed peak, rock and snow textures, composition of the slopes, vivid vermilion-red illuminated ridges and cool charcoal blue shadows from the reference. Do not invent another mountain, do not add objects, do not change its red lighting into another palette. Reframe the extracted mountain centrally on a square transparent canvas, with the complete peak and the broad mountain base visible, filling about 90% of the width and 85% of the height. Let the lowest dark foothills gently fade to transparent so the cutout blends into a black website without a rectangular border. Genuine alpha transparency everywhere outside the mountain. No backdrop, no border, no new text, no dots or particles; the application will render the particles.

## server

- Asset: [src/assets/server-cutout.png](../src/assets/server-cutout.png)
- Reference: user attachment codex-clipboard-bc97fc28-927d-43ea-aa2c-acbfb8ca678b.png

### Final prompt

Use case: background-extraction. Edit this exact attached photograph: isolate only the white and black NASA-themed miniature server rack, including its two top handles, front screen, ports, LEDs, and all patch cables attached to its front. Preserve its three-quarter perspective, hardware details, original labels and NASA lettering, white panels and realistic textures. Remove the wall, outlets, shelf, furniture, power bricks, loose cables outside the rack, tabletop and floor. Do not redesign the rack or replace it with a different device. Center the full server rack, uncropped, on a square genuinely transparent canvas with about 8% margin around the object. The rack should retain all its rich midtones and readable silhouette for subsequent image-to-particle sampling. No background, no ground shadow, no added objects, no dots or particle effect.

## alpine

- Asset: [src/assets/alpine-cutout.png](../src/assets/alpine-cutout.png)
- Reference: user attachment codex-clipboard-356a2e67-b0e8-4851-9031-2a6ff0ef2bf1.png

### Final prompt

Use case: background-extraction. Edit the attached cyan alpine collage into a transparent cutout for a point-cloud rendering. Preserve its recognizable design: the tall narrow central rectangular fragment of snowy rocky mountains with fiery orange-red highlights, the white diamond outline intersecting its upper part, and the craggy snowy mountain valley around its lower half. Remove the plain cyan sky and flat cyan negative space outside those elements, making it genuinely transparent. Keep the cyan-tinted snow ON the mountain surfaces, their detailed rock texture, the original orange lighting and crisp white diamond. Keep the relative placement of the rectangle, diamond and mountain valley. Reframe this as one balanced isolated composition centered on a square transparent canvas, filling approximately 85% of its height, with a finite irregular lower mountain silhouette that gently dissolves to alpha, instead of hard rectangular photo edges. Do not add objects, people, symbols, text or a particle effect. Do not replace this with a new mountain scene. Preserve the original collage identity.

## portal

- Asset: [src/assets/portal-cutout.png](../src/assets/portal-cutout.png)
- Reference: user attachment codex-clipboard-bc36e62d-867c-4cfc-83f1-2456eda5dd5b.png

### Final prompt

Use case: background-extraction. Edit the attached surreal cloud collage as a transparent isolated composition. Keep its characteristic tall vertical vivid red textured portal rectangle, the black horizontal bar crossing the lower part, and the brightest foreground sculptural white cloud banks that overlap and frame the rectangle. Preserve the original fine cloud texture, monochrome cloud palette, glowing vermilion red portal and their relative proportions. Remove the distant gray cloud sky and the full rectangular photo backdrop; the outer edge must become a finite organic cloud silhouette with feathered semi-transparent wisps. Reframe the extracted portal-and-cloud composition centrally on a square genuinely transparent canvas, with a small clear margin around its edges. Retain the red portal as the primary focal point, with a few cloud banks hugging its sides and bottom instead of a full square of clouds. No added text, no new objects, no opaque background, no dots or particle effect. The website will render this source as colored points.

# Service Home

A small homepage for personal services. It shows a greeting based on the visitor’s local time and chooses one background on each page load. Visitors who prefer reduced motion see the static dot pattern.

## Development

Use Node.js 20.19 or later in the 20.x release line, or Node.js 22.12 or later.

    npm ci
    npm run dev

Run `npm run build` to type-check the project and generate the static site in `dist/`. Serve that directory at the root of the domain with any static web server.

## Backgrounds

- [Velora UI Grid & Dot Pattern](https://velora.colorlib.com/components/grid-pattern), licensed under [MIT](public/licenses/velora-ui.txt). The two SVG patterns use the app’s CSS.
- [React Bits Ripple Grid](https://reactbits.dev/backgrounds/ripple-grid), licensed under [MIT + Commons Clause](public/licenses/react-bits.md). The animated grid loads only when selected. The static dot pattern stays visible until WebGL is ready and serves as the fallback if WebGL cannot initialize.

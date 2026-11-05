# Service Home

A small homepage for personal services. It shows a greeting based on the visitor’s local time. Each page load picks one static dotted figure: a mountain relief, a Negroni, a guitar, or a surfboard.

## Development

Use Node.js 20.19 or later in the 20.x release line, or Node.js 22.12 or later.

    npm ci
    npm run dev

Run `npm run build` to type-check the project and generate the static site in `dist/`. Serve that directory at the root of the domain with any static web server.

## Background

[Velora UI Dot Pattern](https://velora.colorlib.com/components/grid-pattern), licensed under [MIT](public/licenses/velora-ui.txt), provides the backdrop behind the four SVG figures.

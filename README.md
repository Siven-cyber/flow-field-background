# Flow Field Background

A lightweight, dependency-free animated background for web apps: hundreds of
particles drifting along a value-noise vector field, leaving soft trails, with
mouse swirl and click ripples.

Originally adapted from the **Zetra Flow Field** wallpaper (MIT). The upstream
repo has since been removed from GitHub, so this project is preserved and
maintained here as a standalone, self-contained reference.

## Features

- **Zero runtime dependencies** — pure Canvas 2D + a small value-noise hash, no
  Perlin library, no CSS framework required (styles are inline).
- **Performance-aware** — particle count scales with viewport area; DPR capped;
  animation pauses when the tab is hidden (`visibilitychange`).
- **Accessible** — honors `prefers-reduced-motion: reduce` (falls back to a CSS
  gradient only); the canvas is `pointer-events: none` so it never blocks input.
- **Themeable** — light/dark palettes with a `MutationObserver` that follows the
  `dark` class on `<html>` live, no reload needed. Colors are fully configurable.
- **Interactive** — cursor swirl and click ripple.
- **Framework-friendly** — a single React component with no Tailwind / CSS-module
  assumptions.

## Usage

The component is written for **React + TypeScript** (Next.js App Router works out
of the box via the `"use client"` directive).

```tsx
import FlowFieldBackground from "flow-field-background";

export default function Layout({ children }) {
  return (
    <>
      <FlowFieldBackground />
      <main style={{ position: "relative", zIndex: 10 }}>{children}</main>
    </>
  );
}
```

The background renders a fixed, full-viewport `<div>` at `z-index: 0` with
`pointer-events: none`. Put your page content in a sibling with a higher
`z-index`.

### Customizing colors

Every color is a prop. Palettes are arrays of `[r, g, b]` tuples.

```tsx
<FlowFieldBackground
  darkPalette={[
    [88, 132, 200],
    [74, 158, 212],
    [104, 196, 178],
    [163, 230, 210],
  ]}
  lightPalette={[
    [52, 84, 140],
    [36, 110, 160],
    [32, 140, 124],
    [24, 92, 116],
  ]}
  darkBackground="#0b1020"
  lightBackground="#fbf8f0"
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `darkPalette` | `[number, number, number][]` | neutral blue/teal ramp | Colors in dark mode |
| `lightPalette` | `[number, number, number][]` | neutral blue/teal ramp | Colors in light mode |
| `darkBackground` | `string` | `#0b1020` | Solid backdrop (dark) |
| `lightBackground` | `string` | `#fbf8f0` | Solid backdrop (light) |
| `forceDark` | `boolean` | `undefined` | Override theme detection |
| `fallbackGradient` | `string` | soft radial glow | CSS gradient behind the canvas |
| `style` | `CSSProperties` | — | Extra inline styles |
| `className` | `string` | — | Extra class |

### Theme detection

By default the component follows the `dark` class on `<html>` (a common
convention used by Tailwind's dark mode, next-themes, and others). If you use a
different mechanism, pass `forceDark` explicitly.

## How it works

1. A value-noise field (`hash21` + smoothstep interpolation) drives a
   `fieldAngle(x, y, t)` used to steer each particle.
2. Every frame the canvas is filled with a low-alpha fade, then particles are
   drawn as short line segments — the fade produces the long trailing effect.
3. Mouse position adds a tangential swirl; a click pushes particles outward and
   draws an expanding ring.

## License

[MIT](./LICENSE)

## Credits

Adapted from the "Zetra Flow Field" wallpaper concept (MIT). This repo exists
to preserve and share the adapted implementation after the original upstream
repository was taken offline.

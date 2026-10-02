# Flow Field Background

A lightweight, dependency-free animated background for web apps: hundreds of
particles drifting along a value-noise vector field, leaving soft trails, with
mouse swirl and click ripples.

Originally adapted from the **Zetra Flow Field** wallpaper (MIT). The upstream
repo has since been removed from GitHub, so this project is preserved and
maintained here as a standalone, self-contained reference.

## Features

- **Zero dependencies** — pure Canvas 2D + a small value-noise hash, no Perlin lib.
- **Performance-aware** — particle count scales with viewport area; DPR capped;
  animation pauses when the tab is hidden (`visibilitychange`).
- **Accessible** — honors `prefers-reduced-motion: reduce` (falls back to the CSS
  gradient only); the canvas is `pointer-events: none` so it never blocks input.
- **Themeable** — light/dark palettes with a `MutationObserver` that follows the
  `dark` class on `<html>` live, no reload needed.
- **Interactive** — cursor swirl and click ripple.

## Usage

The component is written for **React + TypeScript** (Next.js App Router works out
of the box via the `"use client"` directive).

```tsx
import FlowFieldBackground from "./src/FlowFieldBackground";

export default function Layout({ children }) {
  return (
    <>
      <FlowFieldBackground />
      <main className="relative z-10">{children}</main>
    </>
  );
}
```

The background renders a fixed, full-viewport `<div>` at `z-index: 0` with
`pointer-events: none` and a soft radial-gold gradient fallback. Put your page
content in a sibling with a higher `z-index`.

### Recoloring

Edit the two palette constants inside `FlowFieldBackground.tsx`:

- `PAL_DARK` — colors used in dark mode.
- `PAL_LIGHT` — colors used in light mode.

Each entry is an `[r, g, b]` tuple. The background color is set via `BG`
(`#0b1020` dark / `#fbf8f0` light by default).

## How it works

1. A value-noise field (`hash21` + smoothstep interpolation) drives a
   `fieldAngle(x, y, t)` used to steer each particle.
2. Every frame the canvas is filled with a low-alpha `rgba(bg, 0.06)` fade,
   then particles are drawn as short line segments — the fade produces the
   long trailing effect.
3. Mouse position adds a tangential swirl; a click pushes particles outward
   and draws an expanding ring.

## License

[MIT](./LICENSE)

## Credits

Adapted from the "Zetra Flow Field" wallpaper concept (MIT). This repo exists
to preserve and share the adapted implementation after the original upstream
repository was taken offline.

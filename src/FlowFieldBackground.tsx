"use client";

import { useEffect, useRef } from "react";

/**
 * Latar "Flow Field" untuk halaman admin.
 * Diadaptasi dari wallpaper Zetra Flow Field (MIT) agar aman & hemat di halaman
 * sungguhan: canvas tidak menangkap pointer, animasi berhenti saat tab tersembunyi,
 * jumlah partikel mengikuti luas layar, dan menghormati prefers-reduced-motion.
 *
 * Warna mengikuti tema (light/dark) dengan aksen brand emas LapakVIP.
 */

function mountFlowField(host: HTMLElement): () => void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};

  const isDark = () =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark");

  const canvas = document.createElement("canvas");
  canvas.className = "pointer-events-none absolute inset-0 block h-full w-full";
  host.prepend(canvas);
  const ctx = canvas.getContext("2d", { alpha: false })!;

  let W = 0, H = 0, DPR = 1;
  let lastW = 0, lastH = 0;
  let BG = isDark() ? "#0b1020" : "#fbf8f0";

  // Palet per tema: emas gelap di light, emas terang di dark.
  const PAL_DARK = [
    [227, 168, 31],  // brand-400
    [235, 192, 74],  // brand-300
    [242, 216, 134], // brand-200
    [255, 214, 120], // cahaya emas
  ];
  const PAL_LIGHT = [
    [168, 109, 12],  // brand-600
    [201, 137, 15],  // brand-500
    [227, 168, 31],  // brand-400
    [110, 67, 17],   // brand-800
  ];
  let PAL = isDark() ? PAL_DARK : PAL_LIGHT;

  function applyTheme() {
    const dark = isDark();
    BG = dark ? "#0b1020" : "#fbf8f0";
    PAL = dark ? PAL_DARK : PAL_LIGHT;
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
  }

  /* ------------------------------ noise field ----------------------------- */

  const hash21 = (x: number, y: number) => {
    const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return s - Math.floor(s);
  };

  function vnoise(x: number, y: number) {
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = x - ix, fy = y - iy;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const a = hash21(ix, iy), b = hash21(ix + 1, iy);
    const c = hash21(ix, iy + 1), d = hash21(ix + 1, iy + 1);
    return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
  }

  const fieldAngle = (x: number, y: number, t: number) =>
    (vnoise(x * 0.0016, y * 0.0016 + t * 0.04) + 0.5 * vnoise(x * 0.0036 + t * 0.02, y * 0.0036)) * Math.PI * 2;

  /* ------------------------------- particles ------------------------------ */

  let parts: { x: number; y: number; vx: number; vy: number; life: number; hueT: number; size: number }[] = [];
  let COUNT = 0;

  const targetCount = () => Math.max(120, Math.min(520, Math.round((window.innerWidth * window.innerHeight) / 3000)));

  const spawn = () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    vx: 0, vy: 0,
    life: Math.random() * 240 + 120,
    hueT: Math.pow(Math.random(), 2.2),
    size: 0.7 + Math.random() * 1.6,
  });

  const spawnAll = () => {
    COUNT = targetCount();
    parts = Array.from({ length: COUNT }, spawn);
  };

  function colorAt(tt: number, alpha: number) {
    const f = Math.max(0, Math.min(0.999, tt)) * (PAL.length - 1);
    const i = Math.floor(f), k = f - i;
    const a = PAL[i], b = PAL[i + 1] || a;
    return `rgba(${(a[0] + (b[0] - a[0]) * k) | 0},${(a[1] + (b[1] - a[1]) * k) | 0},${(a[2] + (b[2] - a[2]) * k) | 0},${alpha})`;
  }

  /* --------------------------------- input -------------------------------- */

  const mouse = { x: -9999, y: -9999, vx: 0, vy: 0, lastX: 0, lastY: 0, active: 0 };
  const click = { x: 0, y: 0, t: 0 };

  const onMove = (ev: PointerEvent) => {
    const nx = ev.clientX * DPR, ny = ev.clientY * DPR;
    mouse.vx = nx - mouse.lastX;
    mouse.vy = ny - mouse.lastY;
    mouse.lastX = nx; mouse.lastY = ny;
    mouse.x = nx; mouse.y = ny;
    mouse.active = 1;
  };
  const onLeave = () => { mouse.active = 0; mouse.x = mouse.y = -9999; };
  const onDown = (ev: PointerEvent) => {
    click.x = ev.clientX * DPR;
    click.y = ev.clientY * DPR;
    click.t = 1;
  };

  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerleave", onLeave);
  window.addEventListener("pointerdown", onDown, { passive: true });

  /* -------------------------------- resize -------------------------------- */

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.5 : 2);
    W = Math.round(window.innerWidth * DPR);
    H = Math.round(window.innerHeight * DPR);
    canvas.width = W; canvas.height = H;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
    spawnAll();
    lastW = window.innerWidth; lastH = window.innerHeight;
  }

  let resizeTimer: number | undefined;
  const onResize = () => {
    if (window.innerWidth === lastW && Math.abs(window.innerHeight - lastH) < 140) return;
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(resize, 180);
  };
  window.addEventListener("resize", onResize);

  resize();

  /* --------------------------------- loop --------------------------------- */

  let running = true;
  let rafId = 0;
  let t0 = performance.now();
  let prev = t0;

  const onVisibility = () => {
    running = !document.hidden;
    if (running) { prev = performance.now(); rafId = requestAnimationFrame(frame); }
    else cancelAnimationFrame(rafId);
  };
  document.addEventListener("visibilitychange", onVisibility);

  // Ikuti pergantian tema (class dark di html) tanpa perlu reload.
  const themeObs = new MutationObserver(() => applyTheme());
  themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

  function frame(now: number) {
    if (!running) return;
    const dt = Math.min(0.05, (now - prev) / 1000);
    prev = now;
    const t = (now - t0) / 1000;

    // Fade lembut — pembentuk jejak panjang.
    const fade = BG === "#0b1020" ? "rgba(11, 16, 32, 0.06)" : "rgba(251, 248, 240, 0.06)";
    ctx.fillStyle = fade;
    ctx.fillRect(0, 0, W, H);

    click.t = Math.max(0, click.t - dt * 1.2);
    mouse.vx *= 0.85; mouse.vy *= 0.85;

    for (const p of parts) {
      const ang = fieldAngle(p.x, p.y, t);
      let fx = Math.cos(ang) * 0.55;
      let fy = Math.sin(ang) * 0.55;

      if (click.t > 0) {
        const dx = p.x - click.x, dy = p.y - click.y;
        const d = Math.sqrt(dx * dx + dy * dy) + 0.001;
        const radius = (140 + 280 * (1 - click.t)) * DPR;
        if (d < radius) {
          const falloff = (1 - d / radius) * click.t;
          fx += (dx / d) * falloff * 6;
          fy += (dy / d) * falloff * 6;
        }
      }

      p.vx = p.vx * 0.92 + fx;
      p.vy = p.vy * 0.92 + fy;

      const px = p.x, py = p.y;
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 1;

      if (p.life <= 0 || p.x < -10 || p.x > W + 10 || p.y < -10 || p.y > H + 10) {
        Object.assign(p, spawn());
        continue;
      }

      const speed = Math.min(1, Math.hypot(p.vx, p.vy) / 4);
      ctx.strokeStyle = colorAt(p.hueT, 0.06 + 0.2 * speed);
      ctx.lineWidth = p.size * (DPR * 0.7);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }

    if (click.t > 0) {
      const r = (60 + 280 * (1 - click.t)) * DPR;
      ctx.strokeStyle = `rgba(227, 168, 31, ${click.t * 0.3})`;
      ctx.lineWidth = 1.5 * DPR;
      ctx.beginPath();
      ctx.arc(click.x, click.y, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    rafId = requestAnimationFrame(frame);
  }

  rafId = requestAnimationFrame(frame);

  return () => {
    running = false;
    cancelAnimationFrame(rafId);
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerleave", onLeave);
    window.removeEventListener("pointerdown", onDown);
    window.removeEventListener("resize", onResize);
    document.removeEventListener("visibilitychange", onVisibility);
    themeObs.disconnect();
    canvas.remove();
  };
}

export default function FlowFieldBackground() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const cleanup = mountFlowField(host);
    return cleanup;
  }, []);

  return (
    <div
      ref={hostRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{
        background:
          "radial-gradient(120% 90% at 50% -15%, rgba(227,168,31,0.10), transparent 62%), radial-gradient(70% 55% at 88% 104%, rgba(227,168,31,0.06), transparent 64%)",
      }}
    />
  );
}
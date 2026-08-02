"use client";

import { useEffect, useRef } from "react";
import {
  PETAL_BURST_EVENT,
  type PetalBurstDetail,
  type PetalBurstLevel,
} from "@/lib/petalBurst";

/**
 * Petal shower styled after soft marigold / rose confetti:
 * elongated teardrop petals in gold, orange, and pink, with
 * depth-of-field blur on farther layers.
 */

type PetalColor = {
  tip: string;
  mid: string;
  base: string;
  edge: string;
};

type Sprite = {
  canvas: HTMLCanvasElement;
  w: number;
  h: number;
};

type Petal = {
  x: number;
  y: number;
  vy: number;
  vx: number;
  sprite: number;
  scale: number;
  alpha: number;
  rot: number;
  rotSpeed: number;
  phase: number;
  sway: number;
  tumbleSpeed: number;
  tumbleAmp: number;
  /** 0 sharp → 1 soft-blur (depth of field) */
  blur: number;
};

/** Palette pulled from the reference: golds, oranges, pinks, burnt tones */
const COLORS: PetalColor[] = [
  { tip: "#FFE9A8", mid: "#F0C14A", base: "#D4921E", edge: "rgba(140, 80, 20, 0.28)" },
  { tip: "#FFD98A", mid: "#E8A82E", base: "#C87818", edge: "rgba(130, 70, 15, 0.3)" },
  { tip: "#FFC878", mid: "#E8923A", base: "#C86020", edge: "rgba(120, 55, 20, 0.28)" },
  { tip: "#FFB070", mid: "#E07830", base: "#B84818", edge: "rgba(110, 40, 15, 0.3)" },
  { tip: "#FFB8D0", mid: "#F07098", base: "#D04068", edge: "rgba(130, 30, 55, 0.28)" },
  { tip: "#FFA0C0", mid: "#E85080", base: "#C02858", edge: "rgba(120, 25, 50, 0.3)" },
  { tip: "#FFD0A0", mid: "#E89850", base: "#C86828", edge: "rgba(120, 55, 25, 0.26)" },
  { tip: "#E89860", mid: "#C86830", base: "#8E3A18", edge: "rgba(90, 35, 15, 0.32)" },
];

function petalCount(w: number): number {
  if (w < 420) return 28;
  if (w < 900) return 38;
  return 46;
}

function burstExtra(level: PetalBurstLevel, w: number): number {
  const base = level === "full" ? 52 : 26;
  if (w < 420) return Math.round(base * 0.75);
  if (w < 900) return base;
  return Math.round(base * 1.15);
}

function burstDuration(level: PetalBurstLevel): number {
  return level === "full" ? 4200 : 2600;
}

/**
 * Soft elongated teardrop / pointed-oval petal — the look in the
 * reference shot (simple silhouette, painterly gradient, no heavy veins).
 */
function bakeSprite(color: PetalColor, seed: number, blurPx: number): Sprite {
  const pad = blurPx > 0 ? Math.ceil(blurPx * 3) + 4 : 4;
  const bodyW = 28;
  const bodyH = 44;
  const w = bodyW + pad * 2;
  const h = bodyH + pad * 2;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  const s = (n: number) => Math.sin(seed * 12.9898 + n * 78.233);
  const lean = s(1) * 0.18;
  const widthMul = 0.85 + s(2) * 0.18;
  const tipSkew = s(3) * 4;

  ctx.save();
  ctx.translate(w / 2, h / 2);

  if (blurPx > 0) {
    ctx.filter = `blur(${blurPx}px)`;
  }

  // Soft drop shadow
  ctx.save();
  ctx.translate(1, 3);
  ctx.scale(1, 0.4);
  ctx.beginPath();
  ctx.ellipse(0, bodyH * 0.28, 9 * widthMul, 7, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(90, 40, 20, 0.2)";
  ctx.fill();
  ctx.restore();

  // Teardrop: wide rounded base → pointed tip
  const hw = 11 * widthMul;
  ctx.beginPath();
  ctx.moveTo(tipSkew * 0.3, -bodyH * 0.42);
  // Right shoulder
  ctx.bezierCurveTo(
    hw + lean * 8,
    -bodyH * 0.18,
    hw * 1.05 + lean * 6,
    bodyH * 0.12,
    hw * 0.55,
    bodyH * 0.38
  );
  // Rounded base
  ctx.bezierCurveTo(
    hw * 0.2,
    bodyH * 0.48,
    -hw * 0.2,
    bodyH * 0.48,
    -hw * 0.55,
    bodyH * 0.38
  );
  // Left shoulder back to tip
  ctx.bezierCurveTo(
    -hw * 1.05 - lean * 6,
    bodyH * 0.12,
    -hw + lean * 8,
    -bodyH * 0.18,
    tipSkew * 0.3,
    -bodyH * 0.42
  );
  ctx.closePath();

  const grad = ctx.createLinearGradient(
    -hw * 0.4,
    -bodyH * 0.3,
    hw * 0.5,
    bodyH * 0.35
  );
  grad.addColorStop(0, color.tip);
  grad.addColorStop(0.45, color.mid);
  grad.addColorStop(1, color.base);
  ctx.fillStyle = grad;
  ctx.fill();

  // Soft highlight along one edge
  ctx.beginPath();
  ctx.moveTo(tipSkew * 0.2 - 2, -bodyH * 0.3);
  ctx.quadraticCurveTo(
    -hw * 0.55,
    0,
    -hw * 0.25,
    bodyH * 0.28
  );
  ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
  ctx.lineWidth = 1.6;
  ctx.lineCap = "round";
  ctx.stroke();

  // Thin darker rim
  ctx.beginPath();
  ctx.moveTo(tipSkew * 0.3, -bodyH * 0.42);
  ctx.bezierCurveTo(
    hw + lean * 8,
    -bodyH * 0.18,
    hw * 1.05 + lean * 6,
    bodyH * 0.12,
    hw * 0.55,
    bodyH * 0.38
  );
  ctx.strokeStyle = color.edge;
  ctx.lineWidth = 0.9;
  ctx.stroke();

  ctx.filter = "none";
  ctx.restore();
  return { canvas, w, h };
}

function spawnPetal(
  W: number,
  H: number,
  sprites: number,
  fromTop: boolean,
  burst = false
): Petal {
  const depth = Math.pow(Math.random(), 0.8);
  // Near = larger + sharper; far = smaller + softer
  const scale = (burst ? 0.34 : 0.3) + depth * (burst ? 0.78 : 0.68);
  const alpha = 0.5 + depth * 0.48;
  const blur = 1 - depth;

  return {
    x: Math.random() * (W + 60) - 30,
    y: fromTop
      ? -40 - Math.random() * (burst ? H * 0.55 : H * 0.35)
      : Math.random() * H,
    vy: (burst ? 55 : 22) + depth * (burst ? 70 : 48) + Math.random() * 18,
    vx: (Math.random() - 0.5) * (burst ? 36 : 16),
    sprite: Math.floor(Math.random() * sprites),
    scale,
    alpha,
    rot: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * (burst ? 2.4 : 1.6),
    phase: Math.random() * Math.PI * 2,
    sway: 14 + depth * 32 + Math.random() * 12,
    tumbleSpeed: 0.7 + Math.random() * 1.6,
    tumbleAmp: 0.5 + Math.random() * 0.45,
    blur,
  };
}

export default function PetalShower() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    // Sharp + soft (blurred) variants of each colour for depth of field
    const sharp: Sprite[] = COLORS.map((c, i) => bakeSprite(c, i + 1, 0));
    const soft: Sprite[] = COLORS.map((c, i) => bakeSprite(c, i + 7, 2.2));
    // Extra shape seeds
    sharp.push(bakeSprite(COLORS[0], 21, 0));
    sharp.push(bakeSprite(COLORS[4], 27, 0));
    soft.push(bakeSprite(COLORS[1], 33, 2.6));
    soft.push(bakeSprite(COLORS[5], 39, 2.6));

    const pickSprite = (p: Petal): Sprite => {
      const pool = p.blur > 0.45 ? soft : sharp;
      return pool[p.sprite % pool.length];
    };

    let W = 0;
    let H = 0;
    let dpr = 1;
    let petals: Petal[] = [];
    let ambientCount = 0;
    let wind = 0;
    let windTarget = 0;
    let raf = 0;
    let last = performance.now();
    let running = true;
    /** Until this timestamp, the shower runs at celebration intensity */
    let burstUntil = 0;
    let burstLevel: PetalBurstLevel = "full";
    /** Keep raining extras briefly at the start of a burst */
    let burstRainUntil = 0;
    let burstRainAcc = 0;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ambientCount = petalCount(W);
      if (petals.length === 0) {
        petals = Array.from({ length: ambientCount }, () =>
          spawnPetal(W, H, sharp.length, false)
        );
        petals.sort((a, b) => a.scale - b.scale);
      } else if (petals.length < ambientCount) {
        while (petals.length < ambientCount) {
          petals.push(spawnPetal(W, H, sharp.length, true));
        }
        petals.sort((a, b) => a.scale - b.scale);
      } else if (petals.length > ambientCount && performance.now() >= burstUntil) {
        petals.length = ambientCount;
      }
    };

    const triggerBurst = (level: PetalBurstLevel) => {
      const extra = burstExtra(level, W);
      const duration = burstDuration(level);
      // Stacking a new celebration extends the current one
      const now = performance.now();
      burstUntil = Math.max(burstUntil, now + duration);
      burstRainUntil = now + duration * 0.45;
      burstLevel = level;
      burstRainAcc = 0;
      windTarget = (Math.random() - 0.5) * (level === "full" ? 90 : 55);

      const maxPetals = ambientCount + burstExtra("full", W) * 2;
      for (let i = 0; i < extra && petals.length < maxPetals; i++) {
        petals.push(spawnPetal(W, H, sharp.length, true, true));
      }
      petals.sort((a, b) => a.scale - b.scale);
    };

    const onBurst = (e: Event) => {
      const detail = (e as CustomEvent<PetalBurstDetail>).detail;
      triggerBurst(detail?.level ?? "full");
    };

    const recycle = (p: Petal, index: number): boolean => {
      // After a burst, let surplus petals leave instead of looping forever
      if (petals.length > ambientCount && performance.now() >= burstUntil) {
        petals.splice(index, 1);
        return false;
      }
      p.x = Math.random() * (W + 60) - 30;
      p.y = -30 - Math.random() * 70;
      p.vx = (Math.random() - 0.5) * 16;
      p.sprite = Math.floor(Math.random() * sharp.length);
      p.rot = Math.random() * Math.PI * 2;
      p.rotSpeed = (Math.random() - 0.5) * 1.6;
      p.phase = Math.random() * Math.PI * 2;
      p.sway = 14 + p.scale * 32 + Math.random() * 12;
      p.tumbleSpeed = 0.7 + Math.random() * 1.6;
      p.tumbleAmp = 0.5 + Math.random() * 0.45;
      return true;
    };

    const tick = (now: number) => {
      if (!running) return;
      raf = requestAnimationFrame(tick);

      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;

      const bursting = now < burstUntil;
      const rainRate =
        bursting && now < burstRainUntil
          ? burstLevel === "full"
            ? 28
            : 14
          : 0;

      if (rainRate > 0) {
        burstRainAcc += rainRate * dt;
        const maxPetals = ambientCount + burstExtra("full", W) * 2;
        while (burstRainAcc >= 1 && petals.length < maxPetals) {
          burstRainAcc -= 1;
          petals.push(spawnPetal(W, H, sharp.length, true, true));
        }
        if (petals.length >= maxPetals) burstRainAcc = 0;
      }

      if (Math.random() < (bursting ? 0.02 : 0.008)) {
        windTarget = (Math.random() - 0.5) * (bursting ? 70 : 42);
      }
      wind += (windTarget - wind) * 0.4 * dt;

      // Celebration boost: petals fall a touch faster during the burst
      const speedMul = bursting ? (burstLevel === "full" ? 1.45 : 1.25) : 1;

      ctx.clearRect(0, 0, W, H);

      for (let i = 0; i < petals.length; i++) {
        const p = petals[i];
        p.phase += dt;
        p.rot += p.rotSpeed * dt;

        const swayX = Math.sin(p.phase * 0.9) * p.sway;
        const windPush = wind * (0.35 + p.scale * 0.65);
        p.x += (p.vx + windPush + swayX * 0.35) * dt * speedMul;
        p.y += (p.vy * dt + Math.sin(p.phase * 1.7) * 5 * dt) * speedMul;

        if (p.y > H + 40 || p.x < -70 || p.x > W + 70) {
          if (!recycle(p, i)) {
            i--;
          }
          continue;
        }

        const spr = pickSprite(p);
        const tumble = Math.cos(p.phase * p.tumbleSpeed) * p.tumbleAmp;
        const scaleX = Math.max(0.15, Math.abs(tumble));
        const edgeFade = 0.6 + scaleX * 0.4;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot + Math.sin(p.phase * 0.55) * 0.3);
        ctx.scale(p.scale * scaleX * (tumble < 0 ? -1 : 1), p.scale);
        ctx.globalAlpha = p.alpha * edgeFade;
        ctx.drawImage(spr.canvas, -spr.w / 2, -spr.h / 2);
        ctx.restore();
      }

      ctx.globalAlpha = 1;
    };

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };

    resize();
    raf = requestAnimationFrame(tick);
    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener(PETAL_BURST_EVENT, onBurst);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener(PETAL_BURST_EVENT, onBurst);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="petal-shower"
      aria-hidden="true"
    />
  );
}

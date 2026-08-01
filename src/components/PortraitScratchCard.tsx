"use client";

import { useEffect, useRef, useState } from "react";

const COVER_SRC = "/images/Aiswarya and Sushil Without BG Caricature.svg";
const REVEAL_SRC = "/images/Aiswarya and Sushil Without BG.png";

/** Portion of the cover that must be scratched before it auto-reveals. */
const REVEAL_THRESHOLD = 0.5;
/**
 * Horizontal crop bias: the couple sits right of centre in the square
 * artwork, so shift the drawing left by this fraction of the frame width.
 * Keep in sync with `object-position` on `.portrait-img--photo`.
 */
const COVER_X_SHIFT = 0.06;
/** Check progress every N stroke segments (getImageData is expensive). */
const PROGRESS_CHECK_EVERY = 12;

export default function PortraitScratchCard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const coverReady = useRef(false);
  const started = useRef(false);
  const scratching = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const strokeCount = useRef(0);
  const revealedRef = useRef(false);

  const [isRevealed, setIsRevealed] = useState(false);

  // Paint the scratch cover: paper gradient + gold specks + the caricature
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);

    // willReadFrequently: scratch progress is sampled via getImageData
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    ctxRef.current = ctx;

    const { width, height } = canvas;

    const paper = ctx.createLinearGradient(0, 0, 0, height);
    paper.addColorStop(0, "#FDF6E8");
    paper.addColorStop(1, "#F3E3C3");
    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, width, height);

    // Sparse gold specks so the cover reads as textured paper
    for (let i = 0; i < 46; i++) {
      ctx.fillStyle = `rgba(212, 168, 67, ${0.05 + Math.random() * 0.09})`;
      ctx.beginPath();
      ctx.arc(
        Math.random() * width,
        Math.random() * height,
        (0.6 + Math.random() * 1.4) * dpr,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    const img = new Image();
    img.onload = () => {
      // If the guest somehow started before the artwork arrived, drawing now
      // would paint over their scratches — leave the paper-only cover instead.
      if (started.current) {
        coverReady.current = true;
        return;
      }
      // object-fit: cover, nudged left so the couple sits centred
      const scale = Math.max(width / img.width, height / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      const dx = (width - dw) / 2 - width * COVER_X_SHIFT;
      ctx.drawImage(img, dx, (height - dh) / 2, dw, dh);
      coverReady.current = true;
    };
    img.onerror = () => {
      // Paper-only cover still works as a scratch surface
      coverReady.current = true;
    };
    img.src = COVER_SRC;
  }, []);

  const revealAll = () => {
    if (revealedRef.current) return;
    revealedRef.current = true;
    setIsRevealed(true);
  };

  const checkProgress = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx || revealedRef.current) return;

    const { width, height } = canvas;
    const data = ctx.getImageData(0, 0, width, height).data;
    const stride = 8;
    let clear = 0;
    let total = 0;
    for (let y = 0; y < height; y += stride) {
      for (let x = 0; x < width; x += stride) {
        total++;
        if (data[(y * width + x) * 4 + 3] < 40) clear++;
      }
    }
    if (clear / total >= REVEAL_THRESHOLD) revealAll();
  };

  const getPos = (e: React.PointerEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const scratchTo = (pos: { x: number; y: number }) => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    const from = lastPoint.current ?? pos;
    const brush = canvas.width * 0.15;

    ctx.globalCompositeOperation = "destination-out";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Two passes: a wide translucent stroke feathers the edge,
    // a narrower opaque stroke clears the centre.
    ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
    ctx.lineWidth = brush * 1.9;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    ctx.strokeStyle = "rgba(0, 0, 0, 1)";
    ctx.lineWidth = brush;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    lastPoint.current = pos;

    strokeCount.current++;
    if (strokeCount.current % PROGRESS_CHECK_EVERY === 0) checkProgress();
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (revealedRef.current || !coverReady.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    scratching.current = true;
    lastPoint.current = null;
    started.current = true;
    scratchTo(getPos(e));
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!scratching.current || revealedRef.current) return;
    scratchTo(getPos(e));
  };

  const endStroke = () => {
    if (!scratching.current) return;
    scratching.current = false;
    lastPoint.current = null;
    checkProgress();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      revealAll();
    }
  };

  return (
    <div className="portrait-scratch-stage">
      <div
        className={`portrait-frame portrait-scratch${
          isRevealed ? " portrait-scratch--revealed" : ""
        }`}
        role="button"
        tabIndex={0}
        aria-label="A hidden portrait of Sushil and Aiswarya. Scratch with your finger or mouse to reveal it, or press Enter to reveal instantly."
        onKeyDown={handleKeyDown}
      >
        <img
          src={REVEAL_SRC}
          alt="Sushil and Aiswarya"
          className="portrait-img portrait-img--photo"
          draggable={false}
        />

        <canvas
          ref={canvasRef}
          className="portrait-scratch__canvas"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endStroke}
          onPointerCancel={endStroke}
          onContextMenu={(e) => e.preventDefault()}
          aria-hidden="true"
        />
      </div>

      {/* Handwritten note with a curved arrow pointing into the frame from
          outside its top-right corner. Stays put while scratching; once the
          portrait is fully revealed the text becomes "The Couple". */}
      <div className="portrait-scratch__callout" aria-hidden="true">
        {/* key swap remounts the span so the settle animation replays */}
        <span
          className="portrait-scratch__callout-text"
          key={isRevealed ? "revealed" : "scratch"}
        >
          {isRevealed ? "The Couple" : "Scratch this!"}
        </span>
        <svg
          className="portrait-scratch__callout-arrow"
          viewBox="0 0 64 64"
          fill="none"
        >
          <path
            d="M52 6 C 56 26, 44 44, 14 54"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M25 56 L14 54 L22 46"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

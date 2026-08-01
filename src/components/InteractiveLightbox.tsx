"use client";

import { useEffect, useRef, useState } from "react";

interface LightboxProps {
  isOpen: boolean;
  onClose: () => void;
  overlayColor?: string;
  children: React.ReactNode;
}

export default function InteractiveLightbox({
  isOpen,
  onClose,
  overlayColor = "#b28e53",
  children
}: LightboxProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Setup canvas with robust sizing
  useEffect(() => {
    if (isOpen) {
      if (canvasRef.current && cardRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        // Wait for next tick to ensure CSS layout is applied
        setTimeout(() => {
          if (!canvas || !ctx || !cardRef.current) return;

          const rect = cardRef.current.getBoundingClientRect();
          canvas.width = rect.width;
          canvas.height = rect.height;

          // Draw a rich gradient for the scratch-off overlay
          const gradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 0,
            canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height)
          );
          gradient.addColorStop(0, overlayColor);

          // Determine a darker shade for the edge
          const isHenna = overlayColor === "#7A3B2E";
          gradient.addColorStop(1, isHenna ? "#4A1A10" : "#8b6e3f");

          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Draw "Scratch to Reveal" text
          // Canvas can't resolve CSS variables, so read the next/font family off the root element
          const scriptFont =
            getComputedStyle(document.documentElement)
              .getPropertyValue("--font-script")
              .trim() || "cursive";
          ctx.fillStyle = "#fff";
          ctx.font = `2rem ${scriptFont}`;
          ctx.textAlign = "center";
          ctx.fillText("Rub to Reveal", canvas.width / 2, canvas.height / 2);

          // Add some decorative dust/particles
          for(let i = 0; i < 50; i++) {
            ctx.fillStyle = "rgba(255,255,255,0.2)";
            ctx.beginPath();
            ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }, 50);
      }
    }
  }, [isOpen, overlayColor]);

  // Handle rub interaction
  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (isRevealed || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = (e as React.MouseEvent).clientX - rect.left;
      y = (e as React.MouseEvent).clientY - rect.top;
    }

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 45, 0, Math.PI * 2); // Thicker brush for easier scratching
    ctx.fill();

    // Check completion randomly to simulate scratching enough of it
    if (Math.random() < 0.015) {
      setIsRevealed(true);
    }
  };

  const handleClose = () => {
    setIsRevealed(false);
    onClose();
  };

  if (!isOpen && !isRevealed) return null;

  return (
    <div id="lightbox" className={isOpen ? "active" : ""}>
      <div id="lbClose" onClick={handleClose}>×</div>

      {!isRevealed && (
        <div id="lbSkip" onClick={() => setIsRevealed(true)}>Skip & Reveal ▸</div>
      )}

      <div className="lb-card" ref={cardRef}>
        {/* The underlying card content */}
        <div className="lb-content">
          {children}
        </div>

        {/* The scratch-off overlay */}
        {!isRevealed && (
          <canvas
            ref={canvasRef}
            className="lb-overlay-canvas"
            onMouseMove={handleMouseMove}
            onTouchMove={handleMouseMove}
            style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 5, touchAction: 'none' }}
          />
        )}
      </div>
    </div>
  );
}

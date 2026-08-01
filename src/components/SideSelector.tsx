"use client";

import { useState } from "react";

type Side = "bride" | "groom" | null;

export default function SideSelector() {
  const [side, setSide] = useState<Side>(null);

  return (
    <section className="side-section">
      <div className="side-header scroll-anim delay-1">
        <p className="side-eyebrow">A Little Fun Before You Reply</p>
        <h2 className="side-heading">Whose side are you on?</h2>
      </div>

      <div className="side-picker scroll-anim delay-2">
        <button
          type="button"
          className={`side-card side-card--bride${
            side === "bride" ? " side-card--active" : ""
          }${side === "groom" ? " side-card--dimmed" : ""}`}
          onClick={() => setSide("bride")}
          aria-pressed={side === "bride"}
        >
          <span className="side-card__glow" aria-hidden="true"></span>
          <span className="side-card__label">Bride&apos;s Side</span>
          <span className="side-card__name">Aiswarya</span>
          <span className="side-card__tag">Team Bride</span>
        </button>

        <div className="side-picker__divider" aria-hidden="true">
          <span className="side-picker__rule"></span>
          <span className="side-picker__or">or</span>
          <span className="side-picker__rule"></span>
        </div>

        <button
          type="button"
          className={`side-card side-card--groom${
            side === "groom" ? " side-card--active" : ""
          }${side === "bride" ? " side-card--dimmed" : ""}`}
          onClick={() => setSide("groom")}
          aria-pressed={side === "groom"}
        >
          <span className="side-card__glow" aria-hidden="true"></span>
          <span className="side-card__label">Groom&apos;s Side</span>
          <span className="side-card__name">Sushil</span>
          <span className="side-card__tag">Team Groom</span>
        </button>
      </div>

      {/* Fixed-height slot so picking a side never shifts the layout */}
      <div className="side-result-slot" aria-live="polite">
        {side && (
          <p
            className={`side-result side-result--${side}`}
            key={side}
          >
            {side === "bride"
              ? "Lovely choice \u2014 you\u2019re cheering for Aiswarya!"
              : "Wonderful \u2014 you\u2019re cheering for Sushil!"}
          </p>
        )}
      </div>
    </section>
  );
}

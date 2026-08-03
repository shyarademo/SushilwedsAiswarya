"use client";

import { useEffect, useRef, useState } from "react";
import { signalGateOpened } from "@/lib/gateOpen";

type GateProps = {
  /** Called when the open animation finishes and the gate should unmount */
  onExited: () => void;
  /** Called at the start of open (unlock scroll / start petals) */
  onOpenStart: () => void;
};

const OPEN_FALLBACK_MS = 1600;

/**
 * Full-viewport Kerala temple door intro.
 * Seal (A & S) is parented to the left door and swings with it as a latch.
 * Appears on every load/refresh — no persistence skip.
 */
export default function Gate({ onExited, onOpenStart }: GateProps) {
  const [opening, setOpening] = useState(false);
  const [reduced, setReduced] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });
  const startedRef = useRef(false);
  const sealRef = useRef<HTMLButtonElement>(null);
  const doorLeftRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    // Focus the seal so keyboard guests can open immediately
    sealRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!opening) return;

    if (reduced) {
      const t = window.setTimeout(() => onExited(), 280);
      return () => window.clearTimeout(t);
    }

    const door = doorLeftRef.current;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      onExited();
    };

    const onEnd = (e: TransitionEvent) => {
      if (e.target !== door) return;
      if (e.propertyName !== "transform") return;
      finish();
    };

    door?.addEventListener("transitionend", onEnd);
    const fallback = window.setTimeout(finish, OPEN_FALLBACK_MS);
    return () => {
      door?.removeEventListener("transitionend", onEnd);
      window.clearTimeout(fallback);
    };
  }, [opening, reduced, onExited]);

  const open = () => {
    if (startedRef.current) return;
    startedRef.current = true;
    // Must run synchronously in the tap handler for autoplay unlock
    signalGateOpened();
    onOpenStart();
    setOpening(true);
  };

  return (
    <div
      className={`gate${opening ? " gate--opening" : ""}${
        reduced ? " gate--reduced" : ""
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Wedding invitation gate"
    >
      <div className="gate__atmosphere" aria-hidden="true" />

      <div className="gate__frame">
        <div
          ref={doorLeftRef}
          className="gate__door gate__door--left"
        >
          <div className="gate__panel" aria-hidden="true">
            <span className="gate__edge gate__edge--top" />
            <span className="gate__edge gate__edge--bottom" />
            <span className="gate__inset">
              <span className="gate__inset-inner" />
            </span>
            <span className="gate__rosette" />
            <span className="gate__inset gate__inset--lower">
              <span className="gate__inset-inner" />
            </span>
          </div>

          <div className="gate__latch">
            <button
              ref={sealRef}
              type="button"
              className="gate__seal"
              onClick={open}
              aria-label="Open invitation"
              disabled={opening}
            >
              <span className="gate__seal-ring" aria-hidden="true" />
              <span className="gate__seal-wax" aria-hidden="true" />
              <span className="gate__monogram">
                <span className="gate__mono-letter">A</span>
                <span className="gate__mono-amp">&amp;</span>
                <span className="gate__mono-letter">S</span>
              </span>
            </button>
            {!opening && (
              <p className="gate__cue">Tap to open</p>
            )}
          </div>
        </div>

        <div className="gate__door gate__door--right" aria-hidden="true">
          <div className="gate__panel">
            <span className="gate__edge gate__edge--top" />
            <span className="gate__edge gate__edge--bottom" />
            <span className="gate__inset">
              <span className="gate__inset-inner" />
            </span>
            <span className="gate__rosette" />
            <span className="gate__inset gate__inset--lower">
              <span className="gate__inset-inner" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

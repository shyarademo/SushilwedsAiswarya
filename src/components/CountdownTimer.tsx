"use client";

import { useEffect, useState } from "react";

/* Muhurtham — 13 September 2026, 7:15 AM IST.
   Anchored to +05:30 so guests in any timezone see the true time left. */
const TARGET_MS = new Date("2026-09-13T07:15:00+05:30").getTime();

interface Parts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function remaining(): Parts | null {
  const diff = TARGET_MS - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor(diff / 3_600_000) % 24,
    minutes: Math.floor(diff / 60_000) % 60,
    seconds: Math.floor(diff / 1_000) % 60,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

export default function CountdownTimer() {
  // undefined = not yet mounted (matches the prerendered placeholder),
  // null = the moment has arrived
  const [parts, setParts] = useState<Parts | null | undefined>(undefined);

  useEffect(() => {
    const tick = () => setParts(remaining());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const units: { label: string; value: string }[] = [
    { label: "Days", value: parts ? String(parts.days) : "\u2013\u2013" },
    { label: "Hours", value: parts ? pad(parts.hours) : "\u2013\u2013" },
    { label: "Minutes", value: parts ? pad(parts.minutes) : "\u2013\u2013" },
    { label: "Seconds", value: parts ? pad(parts.seconds) : "\u2013\u2013" },
  ];

  return (
    <div className="countdown scroll-anim delay-6">
      <p className="countdown__lead">Two hearts become one in</p>

      {parts === null ? (
        <p className="countdown__arrived">The auspicious moment has arrived</p>
      ) : (
        <div
          className="countdown__grid"
          role="timer"
          aria-label="Countdown to the Muhurtham"
        >
          {units.map((u, i) => (
            <div key={u.label} className="countdown__cell-wrap">
              {i > 0 && (
                <span className="countdown__sep" aria-hidden="true"></span>
              )}
              <div className="countdown__cell">
                <span className="countdown__notch" aria-hidden="true"></span>
                {/* key change remounts the span so the tick animation replays */}
                <span className="countdown__value" key={u.value}>
                  {u.value}
                </span>
                <span className="countdown__label">{u.label}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

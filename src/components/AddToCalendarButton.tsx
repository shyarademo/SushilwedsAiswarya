"use client";

import { useEffect, useRef, useState } from "react";

export interface CalendarEventInfo {
  /** Calendar entry title, e.g. "Sushil weds Aiswarya — Wedding" */
  title: string;
  description: string;
  location: string;
  /** ISO datetime with explicit +05:30 offset so times stay IST-anchored */
  start: string;
  end: string;
  /** Stable id used for the .ics UID and download filename */
  uid: string;
}

/** "2026-09-13T11:30:00+05:30" → "20260913T060000Z" (UTC basic format) */
function toUtcBasic(iso: string): string {
  return new Date(iso)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

function googleCalendarUrl(ev: CalendarEventInfo): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: ev.title,
    dates: `${toUtcBasic(ev.start)}/${toUtcBasic(ev.end)}`,
    details: ev.description,
    location: ev.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Escape per RFC 5545: backslash, semicolon, comma, newline */
function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function buildIcs(ev: CalendarEventInfo): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Sushil weds Aiswarya//Wedding Website//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${ev.uid}@sushilwedsaiswarya`,
    `DTSTAMP:${toUtcBasic(new Date().toISOString())}`,
    `DTSTART:${toUtcBasic(ev.start)}`,
    `DTEND:${toUtcBasic(ev.end)}`,
    `SUMMARY:${escapeIcsText(ev.title)}`,
    `DESCRIPTION:${escapeIcsText(ev.description)}`,
    `LOCATION:${escapeIcsText(ev.location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export default function AddToCalendarButton({
  event,
}: {
  event: CalendarEventInfo;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on outside tap / Escape — attached only while open
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const downloadIcs = () => {
    const blob = new Blob([buildIcs(event)], {
      type: "text/calendar;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event.uid}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Give the browser time to start the download before revoking
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    setOpen(false);
  };

  return (
    <div className="atc" ref={rootRef}>
      <button
        type="button"
        className="ev-card__maplink atc__toggle"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        Add to Calendar
      </button>

      {open && (
        <div className="atc__menu" role="menu" aria-label="Choose your calendar">
          <a
            role="menuitem"
            className="atc__option"
            href={googleCalendarUrl(event)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
          >
            Google Calendar
          </a>
          <span className="atc__rule" aria-hidden="true"></span>
          <button
            role="menuitem"
            type="button"
            className="atc__option"
            onClick={downloadIcs}
          >
            Apple / Outlook
          </button>
        </div>
      )}
    </div>
  );
}

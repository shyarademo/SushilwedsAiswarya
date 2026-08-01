"use client";

import { useEffect, useRef, useState } from "react";

const AUDIO_SRC = "/audio/wedding-music.mp3";
const VOLUME = 0.5;

/**
 * Ambient background music with a single-tap play/pause control.
 *
 * Autoplay strategy:
 * 1. Try to play immediately on mount (works where autoplay is allowed).
 * 2. If the browser blocks it, start on the guest's very first interaction
 *    of any kind (tap, scroll, key, wheel) — this feels automatic.
 * 3. An explicit pause from the guest is remembered and detaches the
 *    gesture fallback, so later interactions never sneakily restart it.
 */
export default function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  /** Guest explicitly paused — never auto-resume after this */
  const userPausedRef = useRef(false);
  /** Detaches the first-gesture autoplay fallback, if attached */
  const detachGestureRef = useRef<(() => void) | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isBroken, setIsBroken] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = VOLUME;

    // Keep the icon truthful: mirror the element's real state, so even
    // OS-level media controls can't desync the button.
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onError = () => setIsBroken(true);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onError);

    const attachGestureFallback = () => {
      const events: (keyof WindowEventMap)[] = [
        "pointerdown",
        "touchstart",
        "keydown",
        "wheel",
        "scroll",
      ];
      // Retry on EVERY gesture until playback actually starts: some events
      // (scroll in particular) never grant user activation, so detaching on
      // the first one would burn the only chance to autoplay.
      const onGesture = () => {
        if (userPausedRef.current || !audio.paused) {
          detach();
          return;
        }
        audio
          .play()
          .then(detach)
          .catch(() => {
            /* no activation yet — stay armed for the next gesture */
          });
      };
      const detach = () => {
        events.forEach((e) => window.removeEventListener(e, onGesture));
        detachGestureRef.current = null;
      };
      events.forEach((e) =>
        window.addEventListener(e, onGesture, { passive: true })
      );
      detachGestureRef.current = detach;
    };

    audio.play().catch(() => {
      // Autoplay blocked — arm the first-interaction fallback
      attachGestureFallback();
    });

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onError);
      detachGestureRef.current?.();
      audio.pause();
    };
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      userPausedRef.current = false;
      audio.play().catch(() => {});
    } else {
      userPausedRef.current = true;
      // Guest chose silence — cancel any pending gesture autoplay
      detachGestureRef.current?.();
      audio.pause();
    }
  };

  if (isBroken) return null;

  return (
    <>
      <audio ref={audioRef} src={AUDIO_SRC} loop preload="auto" />

      <button
        type="button"
        className={`music-toggle${isPlaying ? " music-toggle--playing" : ""}`}
        onClick={toggle}
        aria-label={isPlaying ? "Pause the music" : "Play the music"}
        aria-pressed={isPlaying}
      >
        <span className="music-toggle__ring" aria-hidden="true"></span>
        {isPlaying ? (
          /* Pause icon */
          <svg viewBox="0 0 24 24" className="music-toggle__icon" aria-hidden="true">
            <rect x="7" y="6" width="3.4" height="12" rx="1.2" fill="currentColor" />
            <rect x="13.6" y="6" width="3.4" height="12" rx="1.2" fill="currentColor" />
          </svg>
        ) : (
          /* Play icon */
          <svg viewBox="0 0 24 24" className="music-toggle__icon" aria-hidden="true">
            <path
              d="M8.6 5.9v12.2c0 .94 1.03 1.5 1.82.99l9.2-6.1a1.18 1.18 0 0 0 0-1.98l-9.2-6.1a1.18 1.18 0 0 0-1.82.99z"
              fill="currentColor"
            />
          </svg>
        )}
      </button>
    </>
  );
}

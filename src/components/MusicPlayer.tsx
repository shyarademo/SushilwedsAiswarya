"use client";

import { useEffect, useRef, useState } from "react";
import { GATE_OPENED_EVENT } from "@/lib/gateOpen";

const AUDIO_SRC = "/audio/wedding-music.mp3";
const VOLUME = 0.5;

/**
 * Ambient background music with a single-tap play/pause control.
 *
 * Playback starts only after the temple gate seal is tapped
 * (`GATE_OPENED_EVENT`), so the play() call shares that user gesture.
 * The floating toggle remains available afterward for pause/resume.
 */
export default function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  /** Guest explicitly paused — never auto-resume after this */
  const userPausedRef = useRef(false);
  /** Detaches the first-gesture autoplay fallback, if attached */
  const detachGestureRef = useRef<(() => void) | null>(null);
  const armedRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isBroken, setIsBroken] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = VOLUME;

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
      const onGesture = () => {
        if (userPausedRef.current || !audio.paused) {
          detach();
          return;
        }
        audio
          .play()
          .then(detach)
          .catch(() => {
            /* stay armed */
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

    const startFromGate = () => {
      if (armedRef.current || userPausedRef.current) return;
      armedRef.current = true;
      setUnlocked(true);
      audio.play().catch(() => {
        // Rare: activation lost between seal tap and this handler
        attachGestureFallback();
      });
    };

    window.addEventListener(GATE_OPENED_EVENT, startFromGate);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onError);
      window.removeEventListener(GATE_OPENED_EVENT, startFromGate);
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
      detachGestureRef.current?.();
      audio.pause();
    }
  };

  if (isBroken) return null;

  return (
    <>
      <audio ref={audioRef} src={AUDIO_SRC} loop preload="auto" />

      {unlocked && (
        <button
          type="button"
          className={`music-toggle${isPlaying ? " music-toggle--playing" : ""}`}
          onClick={toggle}
          aria-label={isPlaying ? "Pause the music" : "Play the music"}
          aria-pressed={isPlaying}
        >
          <span className="music-toggle__ring" aria-hidden="true"></span>
          {isPlaying ? (
            <svg viewBox="0 0 24 24" className="music-toggle__icon" aria-hidden="true">
              <rect x="7" y="6" width="3.4" height="12" rx="1.2" fill="currentColor" />
              <rect x="13.6" y="6" width="3.4" height="12" rx="1.2" fill="currentColor" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="music-toggle__icon" aria-hidden="true">
              <path
                d="M8.6 5.9v12.2c0 .94 1.03 1.5 1.82.99l9.2-6.1a1.18 1.18 0 0 0 0-1.98l-9.2-6.1a1.18 1.18 0 0 0-1.82.99z"
                fill="currentColor"
              />
            </svg>
          )}
        </button>
      )}
    </>
  );
}

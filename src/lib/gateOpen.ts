/**
 * Fired synchronously from the seal tap so MusicPlayer can call play()
 * inside the same user-activation turn (required by browser autoplay rules).
 */
export const GATE_OPENED_EVENT = "gate-opened";

export function signalGateOpened(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(GATE_OPENED_EVENT));
}

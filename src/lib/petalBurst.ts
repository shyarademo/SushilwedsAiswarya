/**
 * Tiny bridge between guest interactions and the petal canvas.
 * Components call `burstPetals()`; PetalShower listens for the event.
 */

export type PetalBurstLevel = "soft" | "full";

export const PETAL_BURST_EVENT = "petal-burst";

export type PetalBurstDetail = {
  level: PetalBurstLevel;
};

export function burstPetals(level: PetalBurstLevel = "full"): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<PetalBurstDetail>(PETAL_BURST_EVENT, {
      detail: { level },
    })
  );
}

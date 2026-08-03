# Temple Gate Intro — Design Spec

**Date:** 2026-08-03  
**Project:** Sushil weds Aiswarya (Kerala wedding invitation)  
**Status:** Approved in brainstorming; awaiting implementation plan

## Goal

On every page load and refresh, guests first see a decorative **Kerala temple door** intro. Until they tap the central wax seal, the invitation behind it is not scrollable and not the focus of interaction. After the seal is tapped, the doors open onto the existing hero, and the guest uses the site normally.

## Decisions (locked)

| Topic | Choice |
|---|---|
| Gate style | Kerala temple doors (carved wood + gold trim, stylized CSS) |
| Seal monogram | `A & S` |
| Closed state | Fully sealed — invite hidden; warm dark/maroon atmosphere only |
| Seal behavior | Intact latch; **rides with the left door** (does not crack or break) |
| Open cue | Soft pulse on seal **and** “Tap to open” text |
| Extra ornament | None — doors + seal + cue only |
| Music / petals | Seal tap opens the gate **and** starts music + ambient petals |
| Persistence | Gate **always** shows on load/refresh (no session/local skip) |
| Implementation approach | CSS/HTML doors + seal; CSS 3D `rotateY` open (no new animation libraries) |
| Implementation polish | Use local frontend / UI design skills during build |

## Experience flow

1. Guest opens or refreshes the site.
2. Full-viewport gate overlay mounts closed. Document scroll is locked.
3. Invitation content may load underneath but stays visually covered and non-interactive.
4. Guest sees left/right temple doors, irregular wax seal with `A & S`, pulse, and “Tap to open”.
5. Guest taps/clicks the seal (or activates it with keyboard).
6. Left door swings open (seal moves with it); right door swings the opposite way.
7. Hero is revealed; scroll unlocks; music starts; ambient petals start.
8. Gate finishes opening, then **unmounts** from the DOM (preferred over leaving an inert overlay).
9. A later refresh repeats from step 1.

## Visual design

### Stage
- Fixed full-viewport overlay.
- Warm near-black / deep maroon atmosphere.
- No hero peek while closed.

### Doors
- Two panels; hinges at outer edges.
- Dark wood look via CSS gradients; thin gold borders; simple carved inset rectangles; optional thin vertical gold fillet.
- Center meeting line; seal sits on the seam, visually overlapping both panels, but **DOM-parented to the left door**.

### Seal
- Irregular / slightly crooked circular wax shape (organic, not a perfect circle).
- Deep seal-red body, rim highlight, soft emboss so it reads as wax.
- Idle pulse: subtle scale + gold glow.
- Primary tap target (`<button>`).

### Monogram
- Copy: `A & S`.
- Font: site script (`--font-script` / Allura).
- Cream/gold color.
- Contained in a safe inset (~18–22% of seal diameter).
- Size via `clamp()` / container-relative sizing so glyphs never clip the seal at any viewport.
- Ampersand slightly smaller/softer than the letters.

### Cue
- Below seal: “Tap to open” — gold, letter-spaced, subdued.
- Hidden once opening begins.

## Architecture

### New / changed pieces
- `src/components/Gate.tsx` — overlay UI + open animation + a11y.
- Gate styles in `src/app/globals.css` (or colocated CSS module if preferred; default to globals to match the site).
- `src/app/page.tsx` — owns gate-open state, scroll lock, when to reveal invite interactivity.
- Bridge for post-open side effects (custom event or props), e.g. `gate-opened`:
  - `MusicPlayer` starts only after gate open (gesture-backed).
  - `PetalShower` starts / mounts only after gate open.
- Local UI/frontend skills applied during implementation for visual quality (doors, seal realism, motion timing).

### DOM sketch
```
.gate (fixed, high z-index)
  .gate__frame (perspective)
    .gate__door.gate__door--left
      .gate__seal (button) → A & S
    .gate__door.gate__door--right
  .gate__cue → Tap to open
```

### Open animation
- Perspective on `.gate__frame`.
- Left door: `rotateY` negative (~−78° to −85°); right door: positive.
- Duration ~1.1–1.4s, eased.
- Seal has no separate open motion — it travels with the left door.
- On `transitionend` or ~1.6s timeout fallback: **unmount** the gate from the DOM.

### Scroll lock
- While closed: `overflow: hidden` on `html` and `body` (restore previous values on open).
- Overlay captures interaction so the invite cannot be scrolled or clicked through.
- After open: normal page scroll; view begins at the hero.

### Music + petals
- Do not autoplay music or run ambient petals before gate open.
- Seal tap is the user activation that starts music and ambient petals.
- Existing play/pause control remains after open.

### Accessibility
- Seal is a `<button>` labeled for opening the invitation (e.g. “Open invitation”).
- While gate is up, focus stays on the seal (or within the gate).
- After open, move focus into the page (hero / main).
- `prefers-reduced-motion: reduce`: skip 3D swing; fade/remove gate quickly on activate; still unlock scroll and start music + petals.

### Responsive / overflow rules
- Entire gate composition scales to viewport width and height.
- Monogram, seal, doors, and cue must not overflow or clip incorrectly.
- No horizontal page overflow introduced by the gate or its transforms (use `transform-style` / overflow handling carefully during the swing).

### Z-index
- Gate above invitation content while active.
- After open, music toggle remains usable at its current stacking level.

## Edge cases

- **Double activate:** open sequence runs once; ignore further activations while opening.
- **Missing transitionend:** timeout fallback removes the gate.
- **Keyboard:** Enter / Space on focused seal opens.
- **Reduced motion:** fade path, same unlock side effects.
- **Rapid refresh:** always closed gate again; no “already opened” persistence.

## Out of scope

- Photo-realistic wood textures or 3D engine / Lottie / new animation libraries.
- Toran, bells, diyas, or other ornament on the closed gate screen.
- Seal crack / break / fly-away animations.
- Remembering “gate already opened” across refreshes or sessions.
- Changing hero artwork or non-gate sections except wiring scroll lock and music/petal start timing.

## Success criteria

- Gate appears on every load and refresh.
- Invite is not scrollable or usable until seal activation.
- Seal monogram `A & S` stays inside the seal at phone and desktop sizes.
- Seal rides with the left door; does not break apart.
- After open, guest lands on the hero and can use the site normally.
- Music and ambient petals begin from the seal tap.
- Looks cohesive with the existing maroon / gold / parchment Kerala invitation aesthetic.
- No meaningful scroll jank regression; animation is CSS-transform based.

## Testing checklist

- [ ] Fresh load shows closed gate
- [ ] Refresh shows closed gate again
- [ ] Cannot scroll invite while closed
- [ ] Tap seal opens doors; seal stays on left door
- [ ] Keyboard activation works
- [ ] Double-tap does not glitch
- [ ] Music starts after open; play/pause still works
- [ ] Petals start after open
- [ ] Monogram fits seal at ~320px, ~390px, and desktop widths
- [ ] Reduced-motion path unlocks without 3D swing
- [ ] Timeout still clears gate if transition fails

# Hero v2: "Night Studio" (plan)

## Brief (from Ken)
Before macOS appears: an amazing, interactive hero. 3D world. Background sound with an off switch.
Dogstudio scroll feel, Mat Voyce bold intro, keep the "Ken / neth Nathanael" outline hover.
Minimal, classy, not busy. Great, non-AI fonts. Run a UI/UX audit.

## Design read
Solo designer portfolio for hiring managers and clients; cinematic, Apple-adjacent, one bold moment
per screen. Dials: variance 8, motion 8, density 2.

## Safety
- Built as a separate version: `src/components/Intro2/`, routed by `?intro=2`
  and by a dedicated dev server on :5174 (`npm run dev:v2`). v1 (`?intro=1`) and the OS untouched.
- Only shared-code change: MacScene's camera rig exported with an optional beats prop (no behaviour change for v1).

## Sequence (one scroll-driven page, sticky WebGL stage)
0. Loader (Mat Voyce energy): giant condensed counter 000 → 100 driven by real loading
   (fonts + MacBook model + textures). Then two choices: "Enter with sound" / "Enter in silence".
   The click is also the user gesture browsers need before audio can play.
1. Hero: a dark 3D room with no walls. Fog, a warm key light, a coloured rim light, drifting dust.
   The closed MacBook floats on a slab. Real work floats around it as cards in depth.
   The camera leans toward the cursor (spring). Overlay: the loved name effect, the rolling one-liner,
   two CTAs ("Open my Mac", "Go to desktop"). Corner UI: K. mark, Resume, Contact, sound toggle.
2. Scroll = Dogstudio: the hero copy scrolls away, the camera orbits, and the room recolours
   through three chapters with one giant word behind the laptop each
   (BRAND → blue, MOTION → magenta, INTERFACES → amber). Cards swirl past.
3. Lid opens, screen wakes, camera dives into the glass → existing welcome screen → macOS.

## Sound
Generative ambient score in Web Audio (no audio files, no licensing): detuned pad chord, soft tape
noise, slow filter breathing. Each chapter changes the chord and colour of the filter. Soft UI ticks on
buttons. Toggle in the corner with animated level bars; choice remembered; fades in/out 600ms.

## Type and colour
- Tanker (Fontshare): loader counter + chapter words. Loud, condensed.
- Cabinet Grotesk: the name (kept). Satoshi: UI and copy.
- Ink #07070a. Chapter accents, one at a time: #3d7bff blue, #ff3d8b magenta, #ffb224 amber.

## Principles
Motion motivated (story, feedback, depth). Transform/opacity only. Reduced motion: no camera sway,
no parallax, static loader, sound still optional. Keyboard: all controls reachable, visible focus.
Phones keep the iPhone home screen (unchanged).

## Verify
Build, browser screenshots at every chapter, handoff to welcome, audio on/off, reduced motion,
then a UI/UX audit (web-design-guidelines + ui-ux-pro-max checklist) and code review, fixing findings.

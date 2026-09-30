# What’s in my bag?

A single-page interactive still life: click the bag, ten objects tumble out,
hover (or tap) each one to read its story, find them all, then pack it all back in.

```bash
npm install
npm run dev
```

## Adding your photos

The source photos are transparent PNGs kept outside the repo (in `~/Pictures`,
named as listed in `scripts/prepare-images.mjs`). To regenerate the web assets:

```bash
npm run images -- "C:\path\to\photos"
```

This trims the transparent padding, resizes, converts to WebP and writes to
`public/images/`. It also lines the two bag photos up on one canvas so the
closed → open crossfade doesn't jump.

To add or swap a photo by hand:

1. Cut each object out on a transparent background (PNG or WebP, ~2× the
   display width). Keep lighting consistent.
2. Put them in `public/images/objects/` and the bag in `public/images/`.
3. In `src/data/bag.ts`:
   - set `image: '/images/objects/lipbalm.png'` on each item,
   - set `BAG.closed` (and optionally `BAG.open`) and update `BAG.aspect`
     (photo height ÷ width) and `BAG.mouth` (where the opening sits, 0–1 from the top).
4. Edit names, descriptions and “why it’s in my bag” copy in the same file.

Anything without a photo, or whose photo fails to load, uses the built-in
illustrated placeholder, so the page never breaks.

## Tuning the composition

Each item has separate `desktop` and `mobile` placements: `x`/`y` are offsets
from the bag’s centre as a fraction of the screen, `rotate` is in degrees and
`width` is in design pixels (scaled with the viewport).

## Structure

| File | What it does |
| --- | --- |
| `src/App.tsx` | State machine: loading → closed → opening → open → packing |
| `src/components/Bag.tsx` | The bag, with its flap, idle bob and open squash |
| `src/components/BagObject.tsx` | Emerge / rest / pack-back animations and hover lift |
| `src/components/StoryCard.tsx` | The torn-paper note, placed to stay inside the viewport |
| `src/components/Completion.tsx` | “You found everything” note and confetti |
| `src/lib/sound.ts` | Synthesized sounds (no audio files), with a saved mute toggle |

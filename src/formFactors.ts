/** Canonical phone cluster. Source: `docs/prd.md` Platform. One cover, not 20 rooms. */

export const COVER_ASPECT = 9 / 16;
export const PHONE_ASPECT = 9 / 19.5;
export const DPR_CAP = 3;
export const SAFE_TOP_FRAC = 0.12;
export const SAFE_BOT_FRAC = 0.18;

/** Authoring CSS size — viewport C (iPhone 12–14 / 16e / 17e). */
export const AUTHOR = { id: "C", w: 390, h: 844 } as const;

export type FormFactor = {
  id: string;
  w: number;
  h: number;
  dpr: number;
};

/** Must-pass A–F. Logical CSS px, portrait. */
export const MUST_PASS: readonly FormFactor[] = [
  { id: "A", w: 360, h: 780, dpr: 3 },
  { id: "B", w: 360, h: 800, dpr: 2 },
  { id: "C", w: 390, h: 844, dpr: 3 },
  { id: "D", w: 393, h: 852, dpr: 3 },
  { id: "E", w: 412, h: 915, dpr: 2.625 },
  { id: "F", w: 430, h: 932, dpr: 3 },
];

/** Same cover; cluster edges. */
export const SOAK: readonly FormFactor[] = [
  { id: "G", w: 384, h: 832, dpr: 3 },
  { id: "H", w: 402, h: 874, dpr: 3 },
  { id: "I", w: 414, h: 896, dpr: 2 },
  { id: "J", w: 440, h: 956, dpr: 3 },
];

export function pixelRatio(device = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1) {
  return Math.min(DPR_CAP, device);
}

/** Keep in sync with src/formFactors.ts and docs/prd.md Platform. */
export const PHONE_ASPECT = 9 / 19.5;
export const COVER_ASPECT = 9 / 16;
export const DPR_CAP = 3;

export const MUST_PASS = [
  { id: "A", w: 360, h: 780, dpr: 3 },
  { id: "B", w: 360, h: 800, dpr: 2 },
  { id: "C", w: 390, h: 844, dpr: 3 },
  { id: "D", w: 393, h: 852, dpr: 3 },
  { id: "E", w: 412, h: 915, dpr: 2.625 },
  { id: "F", w: 430, h: 932, dpr: 3 },
];

export const SOAK = [
  { id: "G", w: 384, h: 832, dpr: 3 },
  { id: "H", w: 402, h: 874, dpr: 3 },
  { id: "I", w: 414, h: 896, dpr: 2 },
  { id: "J", w: 440, h: 956, dpr: 3 },
];

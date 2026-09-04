import { AUTHOR, SAFE_BOT_FRAC, SAFE_TOP_FRAC } from "./formFactors";

export const W = AUTHOR.w;
export const H = AUTHOR.h;

export const SAFE_TOP = Math.round(H * SAFE_TOP_FRAC);
export const SAFE_BOT = Math.round(H * SAFE_BOT_FRAC);

export const palette = {
  wall: "#e6e7dc",
  wallShadow: "#dadbd0",
  wallDado: "#d0d1c6",
  baseboard: "#9f9c90",
  floor: "#b2aea4",
  floorHi: "#c0bbb0",
  ceiling: "#f3f4ed",
  desk: "#c4a574",
  deskDark: "#8a6a3b",
  deskEdge: "#5c4524",
  fluorescent: "#eef1dc",
  printer: "#e6e1d6",
  printerDark: "#c9c2b4",
  led: "#2ecc71",
  ledHot: "#ff3b30",
  cup: "#3b2a28",
  coffee: "#2a1812",
  plant: "#2f5c3c",
  pot: "#c57a48",
  copier: "#3a3d44",
  copierHi: "#4e525c",
  chair: "#2c2c2e",
  bag: "#5c4a38",
  phone: "#1a1a1c",
  paper: "#f3efe4",
  lamp: "#d7c48a",
  fan: "#8d9399",
  glass: "#c5d4e2",
  sky: "#d7e2ea",
  door: "#6a6560",
  doorFrame: "#dcdad0",
};

export const copy = {
  mark: "OOPS-PLOSION",
  tag: "MAKE IT WORSE.",
  title: "SUNDAY AT THE OFFICE",
  sub: "The printer has opinions.",
  constraint: "Poke it. Then pile on.",
  miss: "That helped.",
};

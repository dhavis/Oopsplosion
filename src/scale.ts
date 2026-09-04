/** Real-world meters. Origin: back-left floor corner. +X right, +Y up, +Z toward camera. */

export const ROOM = { w: 2.8, d: 2.2, h: 2.15 };

export const SIZE = {
  desk: { w: 1.18, d: 0.78, h: 0.73 },
  printer: { w: 0.46, d: 0.38, h: 0.3 },
  cup: { r: 0.045, h: 0.105 },
  phone: { w: 0.152, d: 0.078, h: 0.009 },
  jam: { w: 0.21, d: 0.006, h: 0.24 },
  paper: { w: 0.21, d: 0.003, h: 0.297 },
  fan: { w: 0.18, d: 0.24, h: 0.28 },
  lamp: { r: 0.125, h: 0.18 },
  chair: { w: 0.52, d: 0.52, h: 0.96 },
  bag: { w: 0.36, d: 0.22, h: 0.16 },
  plant: { w: 0.24, d: 0.24, h: 0.42 },
  copier: { w: 0.62, d: 0.58, h: 1.05 },
};

export const MASS = {
  printer: 8.5,
  cup: 0.54,
  cupEmpty: 0.34,
  phone: 0.195,
  jam: 0.005,
  paper: 0.005,
  paperDry: 0.005,
  paperWet: 0.045,
  fan: 1.25,
  lamp: 1.85,
  chair: 14.8,
  bag: 4.8,
  plant: 5.2,
  copier: 65.0,
};

/** Portrait set: narrower desk, deeper stack, copier as a right sliver. */
export const POS = {
  desk: { x: 1.12, y: 0.365, z: 0.62 },
  printer: { x: 1.22, y: 0.88, z: 0.46 },
  cup: { x: 1.16, y: 0.7825, z: 0.88 },
  phone: { x: 0.7, y: 0.741, z: 0.72 },
  jam: { x: 1.24, y: 0.86, z: 0.72 },
  fan: { x: 1.56, y: 0.872, z: 0.82 },
  lamp: { x: 1.18, y: 1.22, z: 0.87 },
  lampAnchor: { x: 1.18, y: 2.15, z: 0.87 },
  chair: { x: 0.98, y: 0.48, z: 1.345 },
  bag: { x: 1.32, y: 0.1, z: 1.4 },
  copier: { x: 2.12, y: 0.5, z: 0.72 },
  plant: { x: 0.3, y: 0.11, z: 0.92 },
};

export const MOUTH = {
  printer: { x: 1.24, y: 0.92, z: 0.68 },
  copier: { x: 1.96, y: 0.52, z: 1.08 },
};

/** Steeper 3/4, modest dolly. Narrow set so sides survive the portrait frustum. */
export const CAM = {
  pos: { x: 1.14, y: 1.88, z: 3.2 },
  look: { x: 1.2, y: 0.88, z: 0.78 },
  fov: 52,
};

export const FAN_SPEC = {
  axis: { x: -0.74, y: 0.28, z: 0.16 },
  range: 1.45,
  coneAngleRad: 0.72, // ~41 degrees
  baseForce: 0.55,
  boostForce: 1.65,
};

export const FAN_AXIS = FAN_SPEC.axis;
export const FAN_RANGE = FAN_SPEC.range;
export const LAMP_CORD = 0.93;

export const COL = {
  STATIC_ENV: 1 << 0, // 1
  SOLID_PROP: 1 << 1, // 2
  PAPER_SHEET: 1 << 2, // 4
  MACHINE_BODY: 1 << 3, // 8
  TRIGGER_ZONE: 1 << 4, // 16

  // Aliases for compatibility
  solid: (1 << 0) | (1 << 1),
  paper: 1 << 2,
  machine: 1 << 3,
};

export const MAT_PHYSICS = {
  deskWood: { restitution: 0.06, friction: 0.50 },
  carpetFloor: { restitution: 0.04, friction: 0.65 },
  hardPlastic: { restitution: 0.06, friction: 0.55 },
  ceramicGlazed: { restitution: 0.06, friction: 0.52, wetFriction: 0.08 },
  paperDry: { restitution: 0.02, friction: 0.42 },
  paperWet: { restitution: 0.01, friction: 0.75 },
  rubberFeet: { restitution: 0.04, friction: 0.7 },
  paintedMetal: { restitution: 0.25, friction: 0.35 },
  chairCasters: { restitution: 0.08, friction: 0.45, rollFriction: 0.08 },
  glassAluminum: { restitution: 0.12, friction: 0.32, wetFriction: 0.02 },
  terraCotta: { restitution: 0.06, friction: 0.65 },
  canvasFabric: { restitution: 0.03, friction: 0.58 },
  heavyMachine: { restitution: 0.05, friction: 0.6 },
};

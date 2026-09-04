/** SI units (meters, kg, seconds). Origin at (0, 0, 0) on top of the floor. */

export const SANDBOX_ROOM = {
  counter: { w: 1.2, d: 0.65, h: 0.08 },
  counterPos: { x: 0, y: 0.76, z: 0 }, // top surface is at y = 0.80
  floor: { w: 4.0, d: 4.0, h: 0.1 },
  floorPos: { x: 0, y: -0.05, z: 0 }, // top surface is at y = 0
};

export const CUP_SPEC = {
  height: 0.105,
  outerRadius: 0.045,
  innerRadius: 0.038,
  baseThickness: 0.008,
  ceramicMass: 0.32,
  coffeeMaxMl: 220,
  coffeeMaxKg: 0.22,
  initialPos: { x: 0, y: 0.8525, z: 0 }, // on counter
  initialLiquidMl: 220,

  // Center of mass offsets relative to geometric center
  comYEmpty: -0.008,
  comYFull: 0.004,

  // Critical tilt angle threshold (degrees)
  // theta_c(f) = 42 + 30 * (1 - f)
  criticalTiltFullDeg: 42,
  criticalTiltEmptyDeg: 72,

  // High physical energy dissipation damping
  linearDamping: 0.20,
  angularDamping: 0.50,
  sleepSpeedLimit: 0.12,
  sleepTimeLimit: 0.45,

  // Shatter / fracture thresholds
  shatterFloorVelocity: 2.8, // m/s normal impact speed to shatter on floor
  shatterCounterVelocity: 4.0, // m/s normal impact speed on counter
  shatterImpulse: 1.2, // N*s
  shatterEnergyThreshold: 2.1, // Joules

  // Physically tuned spring drag parameters
  springK: 95.0, // N/m
  dampingC: 14.5, // N*s/m
  maxSpringForce: 9.5, // N
  maxTargetVelocity: 2.2, // m/s
  maxTargetLead: 0.08, // m

  // Gesture clamps to prevent unphysical launching
  maxGestureDeltaV: 2.2, // m/s
  maxGestureUpwardV: 1.0, // m/s
  maxAngularVelocity: 10.0, // rad/s
};

export const SANDBOX_COL = {
  ENV: 1 << 0,      // 1: Floor, Counter
  CUP: 1 << 1,      // 2: Coffee Mug
  LIQUID: 1 << 2,   // 4: Liquid droplets
  SHARD: 1 << 3,    // 8: Ceramic shards
};

export const SANDBOX_MAT = {
  ceramic: { restitution: 0.06, friction: 0.52 },
  counterWood: { restitution: 0.06, friction: 0.50 },
  floorConcrete: { restitution: 0.04, friction: 0.62 },
  shard: { restitution: 0.04, friction: 0.58 },
};

export const SANDBOX_CAM = {
  pos: { x: 0, y: 1.35, z: 2.5 },
  look: { x: 0, y: 0.82, z: 0 },
  fov: 46,
  near: 0.02,
  far: 20,
};

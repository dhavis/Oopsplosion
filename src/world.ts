import * as CANNON from "cannon-es";
import * as THREE from "three";
import {
  CAM,
  COL,
  FAN_SPEC,
  MASS,
  MAT_PHYSICS,
  MOUTH,
  POS,
  ROOM,
  SIZE,
} from "./scale";
import { COVER_ASPECT, pixelRatio } from "./formFactors";
import { palette } from "./theme";
import { PottedPlantAssembly } from "./sandbox/PottedPlantAssembly";
import { LampAssembly } from "./sandbox/LampAssembly";
import { BagAssembly } from "./sandbox/BagAssembly";
import { CupBody } from "./sandbox/CupBody";
import { LiquidSimulation, LiquidSurface } from "./sandbox/LiquidSimulation";
import { FractureSystem } from "./sandbox/FractureSystem";

export type ObjLabel =
  | "printer"
  | "cup"
  | "jam"
  | "fan"
  | "lamp"
  | "chair"
  | "phone"
  | "plant"
  | "copier"
  | "bag"
  | "paper"
  | "desk"
  | "floor"
  | "wall"
  | "cabinet";

export type Vec3 = { x: number; y: number; z: number };

export class SimBody {
  constructor(
    readonly label: ObjLabel,
    readonly body: CANNON.Body,
    readonly mesh: THREE.Object3D,
  ) {}

  get position(): Vec3 {
    return this.body.position;
  }

  get velocity(): Vec3 {
    return this.body.velocity;
  }

  get isStatic() {
    return this.body.type === CANNON.BODY_TYPES.STATIC;
  }

  get mass() {
    return this.body.mass;
  }
}

const PICKABLE = new Set<ObjLabel>([
  "cup",
  "jam",
  "lamp",
  "phone",
  "printer",
  "fan",
  "chair",
  "plant",
  "bag",
  "copier",
  "paper",
]);

export class OfficeWorld {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly renderer: THREE.WebGLRenderer;
  readonly physics = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });
  readonly byLabel = new Map<ObjLabel, SimBody>();
  papers: SimBody[] = [];
  timeScale = 1;
  printerFeral = false;
  copierAwake = false;
  copierPage = 1;
  plantBroken = false;
  bagSpilled = false;
  plantAssembly!: PottedPlantAssembly;
  lampAssembly!: LampAssembly;
  bagAssembly!: BagAssembly;
  cupBody!: CupBody;
  liquid!: LiquidSimulation;
  fracture!: FractureSystem;
  fanSpin = 14;
  breakerPopped = false;
  blackout = 0;
  lampSurging = false;
  lampBurst = false;
  lampSurgeStart = 0;

  onCoffeePour?: (rate: number) => void;
  onShortCircuit?: () => void;
  onShatter?: (pos: THREE.Vector3, speed: number) => void;
  onClatter?: (pos: THREE.Vector3, speed: number) => void;

  get cupEmpty(): boolean {
    return this.cupBody ? this.cupBody.liquidMl < 10 : false;
  }
  set cupEmpty(v: boolean) {
    if (v && this.cupBody) this.cupBody.updateLiquid(0);
  }

  readonly materials: Record<string, CANNON.Material> = {};

  private hemiLight!: THREE.HemisphereLight;
  private ambientLight!: THREE.AmbientLight;
  private dirLight!: THREE.DirectionalLight;
  private fixtureMat!: THREE.MeshStandardMaterial;
  private pcScreenMat!: THREE.MeshStandardMaterial;
  private printerLedMat!: THREE.MeshStandardMaterial;
  private deskPuddleMesh: THREE.Mesh | null = null;
  private fxDrip!: THREE.Points;
  private dripGeo!: THREE.BufferGeometry;

  private jamPin: CANNON.Constraint | null = null;
  private paperJobs: { at: number; source: "printer" | "copier"; wet?: boolean }[] = [];
  private meshes = new Map<CANNON.Body, THREE.Object3D>();
  private printerLcd!: THREE.CanvasTexture;
  private copierLcd!: THREE.CanvasTexture;
  private printerCtx!: CanvasRenderingContext2D;
  private copierCtx!: CanvasRenderingContext2D;
  private raycaster = new THREE.Raycaster();
  private ndc = new THREE.Vector2();
  private contacts: Array<(a: SimBody, b: SimBody) => void> = [];
  private lastStep = performance.now();
  private pourUntil = 0;
  private sparkUntil = 0;
  private fxPour!: THREE.Points;
  private fxSpark!: THREE.Points;
  private fxSmoke!: THREE.Points;
  private pourGeo!: THREE.BufferGeometry;
  private sparkGeo!: THREE.BufferGeometry;
  private smokeGeo!: THREE.BufferGeometry;
  private pourBeam!: THREE.Mesh;
  private scanBar?: THREE.Mesh;

  constructor(canvas: HTMLCanvasElement) {
    this.scene.background = new THREE.Color("#d4d6cc");
    this.camera = new THREE.PerspectiveCamera(CAM.fov, COVER_ASPECT, 0.05, 40);
    this.camera.position.set(CAM.pos.x, CAM.pos.y, CAM.pos.z);
    this.camera.lookAt(CAM.look.x, CAM.look.y, CAM.look.z);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(pixelRatio());
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.physics.broadphase = new CANNON.NaiveBroadphase();
    this.physics.defaultContactMaterial.friction = 0.45;
    this.physics.defaultContactMaterial.restitution = 0.08;
    this.physics.allowSleep = true;

    this.initPhysicsMaterials();
    this.lights();
    this.buildRoom();
    this.catchVoid();
    this.buildProps();
    this.initFx();

    this.physics.addEventListener("beginContact", (ev: { bodyA: CANNON.Body; bodyB: CANNON.Body }) => {
      const { bodyA, bodyB } = ev;

      // Cup contact and fracture check
      if (this.cupBody && !this.cupBody.isBroken) {
        const isCupA = bodyA === this.cupBody.body;
        const isCupB = bodyB === this.cupBody.body;
        if (isCupA || isCupB) {
          const other = isCupA ? bodyB : bodyA;
          const targetSim = this.fromCannon(other);
          const targetLabel = targetSim ? targetSim.label : "floor";
          const normalVel = Math.abs(this.cupBody.body.velocity.y);
          const totalSpeed = this.cupBody.body.velocity.length();
          const impactSpeed = Math.max(normalVel, totalSpeed * 0.8);
          const normal = new THREE.Vector3(0, 1, 0);
          this.fracture.checkCollision(this.cupBody, targetLabel, impactSpeed, normal, this.liquid);
        }
      }

      // Plant Pot contact check
      if (this.plantAssembly && this.plantAssembly.potState !== "shattered") {
        const isPlantA = bodyA === this.plantAssembly.potBody;
        const isPlantB = bodyB === this.plantAssembly.potBody;
        if (isPlantA || isPlantB) {
          const other = isPlantA ? bodyB : bodyA;
          if (!this.plantAssembly.isInternalBody(other)) {
            const normalVel = Math.abs(this.plantAssembly.potBody.velocity.y);
            const totalSpeed = this.plantAssembly.potBody.velocity.length();
            const impactSpeed = Math.max(normalVel, totalSpeed * 0.8);
            const normal = new THREE.Vector3(0, 1, 0);
            this.plantAssembly.checkCollision(impactSpeed, normal);
          }
        }
      }

      // Lamp Bulb & Shade contact check
      if (this.lampAssembly) {
        const isBulbA = bodyA === this.lampAssembly.bulbBody;
        const isBulbB = bodyB === this.lampAssembly.bulbBody;
        const isShadeA = bodyA === this.lampAssembly.shadeBody;
        const isShadeB = bodyB === this.lampAssembly.shadeBody;
        if (isBulbA || isBulbB || isShadeA || isShadeB) {
          const hitBody = (isBulbA || isBulbB) ? this.lampAssembly.bulbBody : this.lampAssembly.shadeBody;
          const normalVel = Math.abs(hitBody.velocity.y);
          const totalSpeed = hitBody.velocity.length();
          const impactSpeed = Math.max(normalVel, totalSpeed * 0.8);
          const normal = new THREE.Vector3(0, 1, 0);
          this.lampAssembly.checkCollision(impactSpeed, normal);
        }
      }

      // Bag contact check
      if (this.bagAssembly) {
        const isBagA = bodyA === this.bagAssembly.baseBody || bodyA === this.bagAssembly.upperBody;
        const isBagB = bodyB === this.bagAssembly.baseBody || bodyB === this.bagAssembly.upperBody;
        if (isBagA || isBagB) {
          const hitBody = isBagA ? bodyA : bodyB;
          const normalVel = Math.abs(hitBody.velocity.y);
          const totalSpeed = hitBody.velocity.length();
          const impactSpeed = Math.max(normalVel, totalSpeed * 0.8);
          const normal = new THREE.Vector3(0, 1, 0);
          this.bagAssembly.checkCollision(impactSpeed, normal);
        }
      }

      const a = this.fromCannon(ev.bodyA);
      const b = this.fromCannon(ev.bodyB);
      if (!a || !b) return;
      for (const fn of this.contacts) fn(a, b);
    });
  }

  private initPhysicsMaterials() {
    const keys = Object.keys(MAT_PHYSICS) as Array<keyof typeof MAT_PHYSICS>;
    for (const k of keys) {
      this.materials[k] = new CANNON.Material(k);
    }
    const def = this.physics.defaultMaterial;
    for (const k of keys) {
      const spec = MAT_PHYSICS[k];
      const mat = this.materials[k];
      this.physics.addContactMaterial(
        new CANNON.ContactMaterial(mat, def, {
          friction: spec.friction,
          restitution: spec.restitution,
        }),
      );
    }
    // Specific material pairings
    this.physics.addContactMaterial(
      new CANNON.ContactMaterial(this.materials.ceramicGlazed, this.materials.deskWood, {
        friction: MAT_PHYSICS.ceramicGlazed.friction,
        restitution: MAT_PHYSICS.ceramicGlazed.restitution,
      }),
    );
    this.physics.addContactMaterial(
      new CANNON.ContactMaterial(this.materials.chairCasters, this.materials.carpetFloor, {
        friction: MAT_PHYSICS.chairCasters.rollFriction ?? 0.08,
        restitution: MAT_PHYSICS.chairCasters.restitution,
      }),
    );
    this.physics.addContactMaterial(
      new CANNON.ContactMaterial(this.materials.paintedMetal, this.materials.chairCasters, {
        friction: 0.3,
        restitution: 0.42,
      }),
    );
    this.physics.addContactMaterial(
      new CANNON.ContactMaterial(this.materials.paperDry, this.materials.rubberFeet, {
        friction: 0.42,
        restitution: 0.04,
      }),
    );
    this.physics.addContactMaterial(
      new CANNON.ContactMaterial(this.materials.heavyMachine, this.materials.chairCasters, {
        friction: 0.55,
        restitution: 0.06,
      }),
    );
  }

  onContact(fn: (a: SimBody, b: SimBody) => void) {
    this.contacts.push(fn);
  }

  get(label: ObjLabel): SimBody {
    const b = this.byLabel.get(label);
    if (!b) throw new Error(`missing ${label}`);
    return b;
  }

  layout(width: number, height: number) {
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / Math.max(1, height);
    this.camera.updateProjectionMatrix();
  }

  step() {
    const now = performance.now();
    const dt = Math.min(0.05, (now - this.lastStep) / 1000);
    this.lastStep = now;
    this.physics.step(1 / 60, dt * this.timeScale, 4);
    for (const [, mesh] of this.meshes) {
      const body = mesh.userData.body as CANNON.Body | undefined;
      if (!body) continue;
      mesh.position.copy(body.position as unknown as THREE.Vector3);
      mesh.quaternion.copy(body.quaternion as unknown as THREE.Quaternion);
    }

    if (this.breakerPopped) {
      this.blackout = Math.min(1.0, this.blackout + dt * 6.0);
      this.hemiLight.intensity = THREE.MathUtils.lerp(1.42, 0.16, this.blackout);
      this.ambientLight.intensity = THREE.MathUtils.lerp(0.92, 0.10, this.blackout);
      this.dirLight.intensity = THREE.MathUtils.lerp(0.18, 0.01, this.blackout);
      this.fixtureMat.emissiveIntensity = THREE.MathUtils.lerp(0.95, 0.0, this.blackout);
      if (this.pcScreenMat) this.pcScreenMat.emissiveIntensity = THREE.MathUtils.lerp(0.55, 0.0, this.blackout);
      if (this.printerLedMat) this.printerLedMat.emissiveIntensity = THREE.MathUtils.lerp(1.8, 0.0, this.blackout);
      this.fanSpin = Math.max(0, this.fanSpin - dt * 10);
    }

    // Lamp electrical surge & bulb over-voltage flicker
    if (this.lampAssembly) {
      this.lampAssembly.update(dt);
      if (this.breakerPopped || this.lampAssembly.isBroken) {
        this.lampAssembly.setPower("blackout");
      } else if (this.lampSurging) {
        const surgeDuration = (now - this.lampSurgeStart) / 1000;
        const flicker = 0.5 + 0.5 * Math.sin(now * 0.08) * Math.cos(now * 0.13) + (Math.random() - 0.5) * 0.4;
        this.lampAssembly.setPower("surging", Math.min(1.0, surgeDuration * 1.2) + Math.max(0, flicker * 0.5));
      } else {
        this.lampAssembly.setPower("on");
      }
    }

    this.spinFan(dt);
    this.fanBlow(dt);
    if (this.cupBody) {
      this.cupBody.update(dt);
      this.liquid?.update(dt, this.cupBody);
    }
    this.tickFx();
    this.updateLcds();
    if (this.plantAssembly) {
      this.plantAssembly.update(dt);
      if (this.plantAssembly.potState === "shattered" || this.plantAssembly.foliageState === "uprooted") {
        this.plantBroken = true;
      }
    }
    if (this.bagAssembly) {
      this.bagAssembly.update(dt);
      if (this.bagAssembly.spillState === "spilled") {
        this.bagSpilled = true;
      }
    }
  }

  render() {
    this.camera.position.set(CAM.pos.x, CAM.pos.y, CAM.pos.z);
    this.camera.lookAt(CAM.look.x, CAM.look.y, CAM.look.z);
    this.renderer.render(this.scene, this.camera);
  }

  resetCamera() {
    this.camera.position.set(CAM.pos.x, CAM.pos.y, CAM.pos.z);
    this.camera.lookAt(CAM.look.x, CAM.look.y, CAM.look.z);
  }

  /** Playfield UV, y down. For cover occupancy QA. */
  screen(id: ObjLabel): { x: number; y: number } {
    const sim = this.get(id);
    const v = new THREE.Vector3(sim.position.x, sim.position.y, sim.position.z).project(this.camera);
    return { x: (v.x + 1) / 2, y: (1 - v.y) / 2 };
  }

  pick(clientX: number, clientY: number, rect: DOMRect): SimBody | null {
    this.ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    const cup = this.byLabel.get("cup");
    if (cup) {
      const v = new THREE.Vector3(cup.position.x, cup.position.y, cup.position.z).project(this.camera);
      if (Math.hypot(v.x - this.ndc.x, v.y - this.ndc.y) < 0.2) return cup;
    }
    this.raycaster.setFromCamera(this.ndc, this.camera);
    const meshes: THREE.Object3D[] = [];
    for (const sim of this.byLabel.values()) {
      if (PICKABLE.has(sim.label)) meshes.push(sim.mesh);
    }
    for (const p of this.papers) meshes.push(p.mesh);
    const hits = this.raycaster.intersectObjects(meshes, true);
    if (hits[0]) {
      let obj: THREE.Object3D | null = hits[0].object;
      while (obj && !obj.userData.sim) obj = obj.parent;
      if (obj?.userData.sim) return obj.userData.sim as SimBody;
    }
    let best: SimBody | null = null;
    let bestD = 0.22;
    for (const sim of [...this.byLabel.values(), ...this.papers]) {
      if (!PICKABLE.has(sim.label) && sim.label !== "paper") continue;
      if (sim.label === "copier" || sim.label === "chair") continue;
      const v = new THREE.Vector3(sim.position.x, sim.position.y, sim.position.z).project(this.camera);
      const d = Math.hypot(v.x - this.ndc.x, v.y - this.ndc.y);
      if (d < bestD) {
        bestD = d;
        best = sim;
      }
    }
    if (best) return best;
    this.raycaster.setFromCamera(this.ndc, this.camera);
    const rest = this.raycaster.intersectObjects(
      [this.get("copier").mesh, this.get("chair").mesh],
      true,
    );
    if (rest[0]) {
      let obj: THREE.Object3D | null = rest[0].object;
      while (obj && !obj.userData.sim) obj = obj.parent;
      if (obj?.userData.sim) return obj.userData.sim as SimBody;
    }
    return null;
  }

  pickDetail(
    clientX: number,
    clientY: number,
    rect: DOMRect,
  ): { sim: SimBody; point: THREE.Vector3; object: THREE.Object3D } | null {
    this.ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.ndc, this.camera);
    const meshes: THREE.Object3D[] = [];
    for (const sim of this.byLabel.values()) {
      if (PICKABLE.has(sim.label)) meshes.push(sim.mesh);
    }
    for (const p of this.papers) meshes.push(p.mesh);
    const hits = this.raycaster.intersectObjects(meshes, true);
    if (hits[0]) {
      let obj: THREE.Object3D | null = hits[0].object;
      while (obj && !obj.userData.sim) obj = obj.parent;
      if (obj?.userData.sim) {
        return {
          sim: obj.userData.sim as SimBody,
          point: hits[0].point,
          object: hits[0].object,
        };
      }
    }
    const simple = this.pick(clientX, clientY, rect);
    if (simple) {
      return {
        sim: simple,
        point: new THREE.Vector3(simple.position.x, simple.position.y, simple.position.z),
        object: simple.mesh,
      };
    }
    return null;
  }

  impulse(body: SimBody, v: Vec3) {
    if (body.isStatic) return;
    body.body.wakeUp();
    body.body.applyImpulse(
      new CANNON.Vec3(v.x * body.mass, v.y * body.mass, v.z * body.mass),
      body.body.position,
    );
  }

  dumpCupIntoPrinter() {
    const cup = this.get("cup");
    cup.body.wakeUp();
    cup.body.angularVelocity.set(-3.2, 0.2, 0.4);
    cup.body.velocity.set(0.04, 0.01, -0.08);
  }

  jostle(label: ObjLabel, vx: number, vy: number, vz = 0) {
    const sim = this.byLabel.get(label);
    if (!sim || sim.isStatic) return;
    sim.body.wakeUp();
    sim.body.velocity.x += vx;
    sim.body.velocity.y += vy;
    sim.body.velocity.z += vz;
  }

  blowToward(body: SimBody, target: Vec3, speed: number) {
    if (body.isStatic) return;
    const dx = target.x - body.position.x;
    const dy = target.y - body.position.y;
    const dz = target.z - body.position.z;
    const m = Math.hypot(dx, dy, dz) || 1;
    body.body.wakeUp();
    body.body.applyForce(
      new CANNON.Vec3((dx / m) * speed * 0.4, (dy / m) * speed * 0.4, (dz / m) * speed * 0.4),
      body.body.position,
    );
  }

  nudgeToward(body: SimBody, target: Vec3, speed: number) {
    if (body.isStatic) return;
    const dx = target.x - body.position.x;
    const dy = target.y - body.position.y;
    const dz = target.z - body.position.z;
    const m = Math.hypot(dx, dy, dz) || 1;
    body.body.wakeUp();
    body.body.applyImpulse(
      new CANNON.Vec3(
        (dx / m) * speed * body.mass * 0.35,
        0.02 * body.mass,
        (dz / m) * speed * body.mass * 0.35,
      ),
      body.body.position,
    );
  }

  swingLamp(strength = 1.4) {
    this.lampAssembly?.pokeShade(
      new THREE.Vector3(-0.45 * strength, 0.05 * strength, 0.85 * strength),
    );
  }

  yankJam() {
    this.releaseJam();
    const jam = this.get("jam");
    jam.body.linearDamping = 0.05;
    jam.body.wakeUp();
    jam.body.velocity.set(0.4, 0.14, 0.12);
    jam.body.angularVelocity.set(0.5, 2.0, 0.3);
  }

  walkPhone() {
    const phone = this.get("phone");
    phone.body.wakeUp();
    phone.body.velocity.set(0.32, 0.02, 0.18);
    phone.body.angularVelocity.set(0.4, 1.2, 0.2);
  }

  releaseJam() {
    if (this.jamPin) {
      this.physics.removeConstraint(this.jamPin);
      this.jamPin = null;
    }
  }

  wetShort() {
    this.printerFeral = true;
    this.sparkUntil = performance.now() + 1800;
  }

  startLampSurge() {
    this.lampSurging = true;
    this.lampSurgeStart = performance.now();
    this.lampAssembly?.setPower("surging");
  }

  burstLampBulb() {
    if (this.lampBurst) return;
    this.lampBurst = true;
    this.lampSurging = false;
    this.lampAssembly?.burstBulb();
  }

  popBreaker() {
    this.breakerPopped = true;
    this.sparkUntil = 0;
    this.lampSurging = false;
    this.lampAssembly?.setPower("blackout");
  }

  kickPapersAt(_target?: Vec3, _speed?: number) {
    // Continuous fan aerodynamic drag is the primary force
    for (const p of this.papers) {
      p.body.wakeUp();
      p.body.applyImpulse(
        new CANNON.Vec3((Math.random() - 0.5) * 0.002, 0.003, (Math.random() - 0.5) * 0.002),
        p.body.position,
      );
    }
  }

  lampHitsChair() {
    const lamp = this.get("lamp");
    const chair = this.get("chair");
    chair.body.wakeUp();

    // Physical momentum transfer from swinging pendant lamp to 14.8kg caster chair
    const dirX = POS.copier.x - chair.position.x;
    const dirZ = POS.copier.z - chair.position.z;
    const len = Math.hypot(dirX, dirZ) || 1;
    chair.body.velocity.set((dirX / len) * 0.72, 0.02, (dirZ / len) * 0.72);
    chair.body.angularVelocity.set(0, 0.3, 0);

    // Lamp recoil
    lamp.body.velocity.x *= -0.3;
    lamp.body.velocity.z *= -0.3;
  }

  dropLamp() {
    // The lamp remains suspended on its cord as a physical pendulum swinging in its arc!
    this.swingLamp(1.5);
  }

  fanBlow(_dt = 0.016) {
    if (this.fanSpin <= 0.1) return;
    const fanPos = this.get("fan").position;
    const axis = new CANNON.Vec3(FAN_SPEC.axis.x, FAN_SPEC.axis.y, FAN_SPEC.axis.z);
    axis.normalize();

    const cosCone = Math.cos(FAN_SPEC.coneAngleRad);
    const maxRange = FAN_SPEC.range;
    const forceMag = this.fanSpin > 20 ? FAN_SPEC.boostForce : FAN_SPEC.baseForce;

    const targets = [...this.papers, this.get("jam"), this.get("lamp")];
    for (const item of targets) {
      const p = item.body;
      const rel = new CANNON.Vec3(
        p.position.x - fanPos.x,
        p.position.y - fanPos.y,
        p.position.z - fanPos.z,
      );
      const dist = rel.length();
      if (dist < 0.02 || dist > maxRange) continue;

      const along = rel.dot(axis) / dist;
      if (along < cosCone) continue;

      const distFactor = 1.0 - dist / maxRange;
      const angularFactor = (along - cosCone) / (1.0 - cosCone);
      const isLamp = item.label === "lamp";
      const appliedThrust = (isLamp ? forceMag * 1.5 : forceMag) * distFactor * angularFactor;

      if (isLamp && this.lampAssembly) {
        this.lampAssembly.applyAerodynamicDrag(
          new THREE.Vector3(axis.x, axis.y, axis.z),
          appliedThrust,
        );
        continue;
      }

      p.wakeUp();
      p.applyForce(axis.scale(appliedThrust), p.position);
      p.applyTorque(
        new CANNON.Vec3(
          (Math.random() - 0.5) * 0.015 * appliedThrust,
          (Math.random() - 0.5) * 0.015 * appliedThrust,
          (Math.random() - 0.5) * 0.015 * appliedThrust,
        ),
      );
    }
  }

  printerMouth(): Vec3 {
    return { ...MOUTH.printer };
  }

  copierMouth(): Vec3 {
    return { ...MOUTH.copier };
  }

  coughPrinter(n: number, now: number, gap = 140, wet = false) {
    for (let i = 0; i < n; i++) this.paperJobs.push({ at: now + i * gap, source: "printer", wet });
  }

  coughCopier(n: number, now: number, gap = 80) {
    for (let i = 0; i < n; i++) this.paperJobs.push({ at: now + i * gap, source: "copier" });
  }

  copierVomit() {
    this.copierAwake = true;
    this.coughCopier(14, performance.now(), 80);
    const lid = this.get("copier").mesh.getObjectByName("copier-lid");
    if (lid) lid.rotation.x = -0.22;
  }

  tickPaper(now: number) {
    const due = this.paperJobs.filter((j) => now >= j.at);
    this.paperJobs = this.paperJobs.filter((j) => now < j.at);
    for (const job of due) this.emitOne(job.source, job.wet);
  }

  dist(a: SimBody, b: SimBody) {
    return Math.hypot(
      a.position.x - b.position.x,
      a.position.y - b.position.y,
      a.position.z - b.position.z,
    );
  }

  /** World-space mesh AABB, including visual children (fan blades / spokes). */
  meshAabb(label: ObjLabel): { min: Vec3; max: Vec3 } {
    const box = new THREE.Box3().setFromObject(this.get(label).mesh);
    return {
      min: { x: box.min.x, y: box.min.y, z: box.min.z },
      max: { x: box.max.x, y: box.max.y, z: box.max.z },
    };
  }

  destroy() {
    this.plantAssembly?.destroy();
    this.lampAssembly?.destroy();
    this.bagAssembly?.destroy();
    this.cupBody?.destroy();
    this.liquid?.reset();
    this.fracture?.reset();
    this.renderer.dispose();
    this.scene.clear();
  }

  private emitOne(source: "printer" | "copier", wet = false) {
    const from = source === "printer" ? this.printerMouth() : this.copierMouth();
    const toward =
      source === "printer"
        ? this.get("fan").position
        : { x: from.x, y: from.y - 0.05, z: from.z + 0.4 };
    const dx = toward.x - from.x;
    const dy = toward.y - from.y;
    const dz = toward.z - from.z;
    const m = Math.hypot(dx, dy, dz) || 1;
    const speed = source === "printer" ? (wet ? 1.05 : 0.85) : 0.55;
    const vel = {
      x: (dx / m) * speed,
      y: (dy / m) * speed + (wet ? 0.14 : 0.08),
      z: (dz / m) * speed,
    };
    this.spawnPaper(
      { x: from.x + vel.x * 0.06, y: from.y + vel.y * 0.06, z: from.z + vel.z * 0.06 },
      vel,
      wet,
    );
  }

  private spawnPaper(from: Vec3, vel: Vec3, wet = false) {
    const s = SIZE.paper;
    const mesh = this.paperMesh(wet);
    const body = new CANNON.Body({
      mass: wet ? MASS.paperWet : MASS.paperDry,
      shape: wet
        ? new CANNON.Sphere(0.035)
        : new CANNON.Box(new CANNON.Vec3(s.w / 2, s.d / 2, s.h / 2)),
      position: new CANNON.Vec3(from.x, from.y, from.z),
      angularDamping: wet ? 0.12 : 0.4,
      linearDamping: wet ? 0.06 : 0.12,
      material: wet ? this.materials.paperWet : this.materials.paperDry,
    });
    this.filter(
      body,
      COL.PAPER_SHEET,
      COL.STATIC_ENV | COL.SOLID_PROP | COL.MACHINE_BODY | COL.TRIGGER_ZONE,
    );
    body.velocity.set(vel.x, vel.y, vel.z);
    body.quaternion.setFromEuler(0.12, Math.random() * 0.4 - 0.2, 0.08);
    const sim = this.track("paper", body, mesh);
    this.papers.push(sim);
    return sim;
  }

  private lights() {
    this.hemiLight = new THREE.HemisphereLight("#f2f4e6", "#a8a498", 1.42);
    this.scene.add(this.hemiLight);
    this.dirLight = new THREE.DirectionalLight("#f4f5ec", 0.18);
    this.dirLight.position.set(1.1, 3.1, 1.1);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.set(1024, 1024);
    this.dirLight.shadow.radius = 12;
    this.dirLight.shadow.camera.near = 0.3;
    this.dirLight.shadow.camera.far = 8;
    this.dirLight.shadow.camera.left = -2;
    this.dirLight.shadow.camera.right = 2;
    this.dirLight.shadow.camera.top = 2;
    this.dirLight.shadow.camera.bottom = -2;
    this.scene.add(this.dirLight);
    this.ambientLight = new THREE.AmbientLight("#eceee4", 0.92);
    this.scene.add(this.ambientLight);
    const windowFill = new THREE.DirectionalLight(palette.sky, 0.4);
    windowFill.position.set(0.2, 1.55, -1.4);
    this.scene.add(windowFill);
    this.fixtureMat = new THREE.MeshStandardMaterial({
      color: "#d8dcc8",
      emissive: palette.fluorescent,
      emissiveIntensity: 0.95,
      roughness: 0.45,
    });
    const fixture = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.05, 0.55),
      this.fixtureMat,
    );
    fixture.position.set(ROOM.w / 2, ROOM.h - 0.04, 1.05);
    this.scene.add(fixture);
    const coffin = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.02, 0.62), this.mat("#c5c7bc"));
    coffin.position.set(ROOM.w / 2, ROOM.h - 0.015, 1.05);
    this.scene.add(coffin);
  }

  private buildRoom() {
    this.shellBox(ROOM.w, 0.04, ROOM.d, ROOM.w / 2, -0.02, ROOM.d / 2, palette.floor, "floor", "carpet", 2.2, 1.8);
    this.shellBox(ROOM.w, ROOM.h, 0.04, ROOM.w / 2, ROOM.h / 2, -0.02, palette.wall, "wall", "flat", 1, 1);
    this.shellBox(0.04, ROOM.h, ROOM.d, -0.02, ROOM.h / 2, ROOM.d / 2, palette.wallShadow, "wall", "flat", 1, 1);
    this.shellBox(0.04, ROOM.h, ROOM.d, ROOM.w + 0.02, ROOM.h / 2, ROOM.d / 2, palette.wallShadow, "wall", "flat", 1, 1);
    this.shellBox(ROOM.w, 0.02, ROOM.d, ROOM.w / 2, ROOM.h + 0.01, ROOM.d / 2, palette.ceiling, "wall", "flat", 1, 1);
    this.dadoAndBase();
    this.ceilingGrid();
    this.windowOnLeft();
    this.closedDoor();
    this.frozenPc();
  }

  private catchVoid() {
    const sky = new THREE.Mesh(
      new THREE.BoxGeometry(14, 10, 14),
      new THREE.MeshBasicMaterial({ color: "#cfd2c6", side: THREE.BackSide }),
    );
    sky.position.set(ROOM.w / 2, 1.1, ROOM.d / 2);
    this.scene.add(sky);
  }

  private dadoAndBase() {
    const strip = (w: number, h: number, d: number, x: number, y: number, z: number, color: string) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), this.mat(color, { roughness: 0.82 }));
      m.position.set(x, y, z);
      this.scene.add(m);
    };
    strip(ROOM.w, 0.48, 0.014, ROOM.w / 2, 0.24, 0.012, palette.wallDado);
    strip(0.014, 0.48, ROOM.d, 0.012, 0.24, ROOM.d / 2, palette.wallDado);
    strip(ROOM.w, 0.1, 0.032, ROOM.w / 2, 0.05, 0.022, palette.baseboard);
    strip(0.032, 0.1, ROOM.d, 0.022, 0.05, ROOM.d / 2, palette.baseboard);
    strip(0.032, 0.1, ROOM.d, ROOM.w - 0.022, 0.05, ROOM.d / 2, palette.baseboard);
  }

  private ceilingGrid() {
    const line = this.mat("#cfd1c6", { roughness: 0.7 });
    for (let i = 1; i < 5; i++) {
      const x = new THREE.Mesh(new THREE.BoxGeometry(ROOM.w, 0.008, 0.012), line);
      x.position.set(ROOM.w / 2, ROOM.h - 0.005, (i * ROOM.d) / 5);
      this.scene.add(x);
    }
    for (let i = 1; i < 5; i++) {
      const z = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.008, ROOM.d), line);
      z.position.set((i * ROOM.w) / 5, ROOM.h - 0.005, ROOM.d / 2);
      this.scene.add(z);
    }
  }

  private windowOnLeft() {
    const frame = this.mat(palette.doorFrame, { roughness: 0.55 });
    const glassMat = new THREE.MeshStandardMaterial({
      color: palette.glass,
      emissive: palette.sky,
      emissiveIntensity: 0.16,
      roughness: 0.14,
      metalness: 0.04,
      transparent: true,
      opacity: 0.78,
    });
    const sky = new THREE.MeshBasicMaterial({ color: palette.sky });
    const y = 1.55;
    const backX = 0.4;
    const backZ = 0.05;
    const paneW = 0.64;
    const paneH = 0.58;
    const sill = new THREE.Mesh(new THREE.BoxGeometry(paneW + 0.1, 0.045, 0.08), frame);
    sill.position.set(backX, y - paneH / 2 - 0.02, backZ + 0.02);
    this.scene.add(sill);
    const head = new THREE.Mesh(new THREE.BoxGeometry(paneW + 0.1, 0.04, 0.07), frame);
    head.position.set(backX, y + paneH / 2 + 0.02, backZ + 0.02);
    this.scene.add(head);
    const jamL = new THREE.Mesh(new THREE.BoxGeometry(0.045, paneH + 0.08, 0.07), frame);
    jamL.position.set(backX - paneW / 2 - 0.02, y, backZ + 0.02);
    this.scene.add(jamL);
    const jamR = new THREE.Mesh(new THREE.BoxGeometry(0.045, paneH + 0.08, 0.07), frame);
    jamR.position.set(backX + paneW / 2 + 0.02, y, backZ + 0.02);
    this.scene.add(jamR);
    const backSky = new THREE.Mesh(new THREE.BoxGeometry(paneW - 0.04, paneH - 0.04, 0.01), sky);
    backSky.position.set(backX, y, 0.01);
    this.scene.add(backSky);
    const backGlass = new THREE.Mesh(new THREE.BoxGeometry(paneW - 0.02, paneH - 0.02, 0.018), glassMat);
    backGlass.position.set(backX, y, 0.055);
    this.scene.add(backGlass);
    const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.03, paneH - 0.04, 0.03), frame);
    mullion.position.set(backX, y, 0.06);
    this.scene.add(mullion);
    const sideZ = 0.34;
    const sideD = 0.48;
    const sideSill = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.045, sideD + 0.08), frame);
    sideSill.position.set(0.055, y - paneH / 2 - 0.02, sideZ);
    this.scene.add(sideSill);
    const sideHead = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, sideD + 0.08), frame);
    sideHead.position.set(0.05, y + paneH / 2 + 0.02, sideZ);
    this.scene.add(sideHead);
    const sideSky = new THREE.Mesh(new THREE.BoxGeometry(0.01, paneH - 0.04, sideD - 0.04), sky);
    sideSky.position.set(0.015, y, sideZ);
    this.scene.add(sideSky);
    const sideGlass = new THREE.Mesh(new THREE.BoxGeometry(0.018, paneH - 0.02, sideD - 0.02), glassMat);
    sideGlass.position.set(0.05, y, sideZ);
    this.scene.add(sideGlass);
    const scuff = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.14, 0.2), this.mat("#c8c9be", { roughness: 0.9 }));
    scuff.position.set(0.03, 0.36, 0.92);
    this.scene.add(scuff);
  }

  private closedDoor() {
    const frame = this.mat(palette.doorFrame, { roughness: 0.55 });
    const slab = new THREE.Mesh(new THREE.BoxGeometry(0.86, 1.92, 0.05), this.mat(palette.door, { roughness: 0.78 }));
    slab.position.set(2.15, 0.98, 0.04);
    this.scene.add(slab);
    const casing = new THREE.Mesh(new THREE.BoxGeometry(0.96, 2.02, 0.04), frame);
    casing.position.set(2.15, 1.03, 0.015);
    this.scene.add(casing);
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.08, 10), this.mat("#c5c2b8", { metalness: 0.55, roughness: 0.3 }));
    handle.rotation.z = Math.PI / 2;
    handle.position.set(1.82, 0.92, 0.08);
    this.scene.add(handle);
    const rose = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.012, 12), this.mat("#b8b5ac", { metalness: 0.4, roughness: 0.35 }));
    rose.rotation.x = Math.PI / 2;
    rose.position.set(1.82, 0.92, 0.07);
    this.scene.add(rose);
    const vision = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.28, 0.01),
      new THREE.MeshStandardMaterial({ color: "#2c302c", roughness: 0.18, metalness: 0.22 }),
    );
    vision.position.set(2.15, 1.42, 0.07);
    this.scene.add(vision);
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.1, 0.012), this.mat("#3a3d38", { roughness: 0.5 }));
    plate.position.set(2.15, 2.02, 0.04);
    this.scene.add(plate);
    const exit = this.exitMark();
    exit.position.set(2.15, 2.02, 0.048);
    this.scene.add(exit);
  }

  private exitMark() {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 96;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#3a3d38";
    ctx.fillRect(0, 0, 256, 96);
    ctx.fillStyle = "#5a6356";
    ctx.font = "bold 52px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("EXIT", 128, 50);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.26, 0.09),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.72, metalness: 0.08 }),
    );
    return mesh;
  }

  private frozenPc() {
    const monitorX = POS.desk.x - SIZE.desk.w * 0.32;
    const monitorZ = POS.desk.z - SIZE.desk.d * 0.32;
    const stand = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 0.06), this.mat("#2a2c28"));
    stand.position.set(monitorX, SIZE.desk.h + 0.09, monitorZ);
    this.scene.add(stand);
    const pc = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.26, 0.03),
      new THREE.MeshStandardMaterial({ color: "#1c1e1a", roughness: 0.45 }),
    );
    pc.position.set(monitorX, SIZE.desk.h + 0.32, monitorZ);
    this.scene.add(pc);

    this.pcScreenMat = new THREE.MeshStandardMaterial({
      color: "#30485a",
      emissive: "#203a4c",
      emissiveIntensity: 0.55,
      roughness: 0.3,
    });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.22), this.pcScreenMat);
    screen.position.set(monitorX, SIZE.desk.h + 0.32, monitorZ + 0.016);
    this.scene.add(screen);
  }

  private buildProps() {
    const desk = SIZE.desk;
    const deskMesh = this.deskMesh();
    this.staticMesh(
      deskMesh,
      POS.desk.x,
      POS.desk.y,
      POS.desk.z,
      desk.w,
      desk.h,
      desk.d,
      "desk",
      this.materials.deskWood,
    );
    this.filter(
      this.get("desk").body,
      COL.STATIC_ENV,
      COL.SOLID_PROP | COL.PAPER_SHEET | COL.MACHINE_BODY,
    );

    const pr = SIZE.printer;
    const printerMesh = this.printerMesh();
    this.staticMesh(
      printerMesh,
      POS.printer.x,
      POS.printer.y,
      POS.printer.z,
      pr.w,
      pr.h,
      pr.d,
      "printer",
      this.materials.hardPlastic,
    );
    this.filter(
      this.get("printer").body,
      COL.MACHINE_BODY,
      COL.STATIC_ENV | COL.SOLID_PROP | COL.PAPER_SHEET,
    );

    const ring = new THREE.Mesh(
      new THREE.CylinderGeometry(SIZE.cup.r * 1.35, SIZE.cup.r * 1.15, 0.004, 24),
      new THREE.MeshStandardMaterial({ color: "#1a0c0a", transparent: true, opacity: 0.82 }),
    );
    ring.position.set(POS.cup.x + 0.03, SIZE.desk.h + 0.003, POS.cup.z);
    this.scene.add(ring);

    const cop = SIZE.copier;
    const copierMesh = this.copierMesh();
    this.staticMesh(
      copierMesh,
      POS.copier.x,
      POS.copier.y,
      POS.copier.z,
      cop.w,
      cop.h,
      cop.d,
      "copier",
      this.materials.heavyMachine,
    );
    this.filter(
      this.get("copier").body,
      COL.MACHINE_BODY,
      COL.STATIC_ENV | COL.SOLID_PROP | COL.PAPER_SHEET,
    );
    const copSim = this.get("copier");
    copSim.body.quaternion.setFromEuler(0, -0.32, 0);
    copSim.mesh.quaternion.copy(copSim.body.quaternion as unknown as THREE.Quaternion);

    this.cupBody = new CupBody(
      this.materials.ceramicGlazed,
      new THREE.Vector3(POS.cup.x, 0.7875, POS.cup.z),
    );
    this.filter(
      this.cupBody.body,
      COL.SOLID_PROP,
      COL.STATIC_ENV | COL.SOLID_PROP | COL.MACHINE_BODY | COL.PAPER_SHEET | COL.SHARD,
    );
    const cupSim = new SimBody("cup", this.cupBody.body, this.cupBody.mesh);
    this.cupBody.mesh.userData = { sim: cupSim, body: this.cupBody.body, label: "cup" };
    this.cupBody.mesh.traverse((c) => {
      c.userData.sim = cupSim;
      c.userData.label = "cup";
      if ((c as THREE.Mesh).isMesh) {
        (c as THREE.Mesh).castShadow = true;
        (c as THREE.Mesh).receiveShadow = true;
      }
    });
    this.physics.addBody(this.cupBody.body);
    this.scene.add(this.cupBody.mesh);
    this.meshes.set(this.cupBody.body, this.cupBody.mesh);
    this.byLabel.set("cup", cupSim);

    this.dynamic(
      "phone",
      MASS.phone,
      new CANNON.Box(new CANNON.Vec3(SIZE.phone.w / 2, SIZE.phone.h / 2, SIZE.phone.d / 2)),
      this.phoneMesh(),
      POS.phone,
      { rotY: 0.7 },
      this.materials.glassAluminum,
    );

    this.pinJam();

    const fanMesh = this.fanMesh();
    this.staticMesh(
      fanMesh,
      POS.fan.x,
      POS.fan.y,
      POS.fan.z,
      SIZE.fan.w,
      SIZE.fan.h,
      SIZE.fan.d,
      "fan",
      this.materials.rubberFeet,
    );
    const fanSim = this.get("fan");
    fanSim.body.quaternion.setFromEuler(0, 0.85, 0);
    fanSim.mesh.quaternion.copy(fanSim.body.quaternion as unknown as THREE.Quaternion);

    this.lampAssembly = new LampAssembly(
      this.physics,
      this.scene,
      this.materials.paintedMetal,
      new THREE.Vector3(POS.lampAnchor.x, POS.lampAnchor.y, POS.lampAnchor.z),
      new THREE.Vector3(POS.lamp.x, POS.lamp.y, POS.lamp.z),
      true,
    );
    this.filter(
      this.lampAssembly.shadeBody,
      COL.SOLID_PROP,
      COL.STATIC_ENV | COL.SOLID_PROP | COL.PAPER_SHEET | COL.MACHINE_BODY,
    );
    this.filter(
      this.lampAssembly.bulbBody,
      COL.SOLID_PROP,
      COL.STATIC_ENV | COL.SOLID_PROP | COL.PAPER_SHEET | COL.MACHINE_BODY,
    );
    const lampSim = new SimBody("lamp", this.lampAssembly.shadeBody, this.lampAssembly.group);
    this.lampAssembly.group.userData = { sim: lampSim, body: this.lampAssembly.shadeBody, label: "lamp" };
    this.lampAssembly.group.traverse((c) => {
      c.userData.sim = lampSim;
      c.userData.label = "lamp";
      if ((c as THREE.Mesh).isMesh) {
        (c as THREE.Mesh).castShadow = true;
        (c as THREE.Mesh).receiveShadow = true;
      }
    });
    this.meshes.set(this.lampAssembly.shadeBody, this.lampAssembly.group);
    this.byLabel.set("lamp", lampSim);

    this.compoundChair();

    this.bagAssembly = new BagAssembly(
      this.physics,
      this.scene,
      this.materials.canvasFabric,
      new THREE.Vector3(POS.bag.x, POS.bag.y, POS.bag.z),
      false,
    );
    this.filter(
      this.bagAssembly.baseBody,
      COL.SOLID_PROP,
      COL.STATIC_ENV | COL.SOLID_PROP | COL.PAPER_SHEET | COL.MACHINE_BODY,
    );
    this.filter(
      this.bagAssembly.upperBody,
      COL.SOLID_PROP,
      COL.STATIC_ENV | COL.SOLID_PROP | COL.PAPER_SHEET | COL.MACHINE_BODY,
    );
    for (const p of this.bagAssembly.payloads) {
      this.filter(
        p.body,
        COL.SOLID_PROP,
        COL.STATIC_ENV | COL.SOLID_PROP | COL.PAPER_SHEET | COL.MACHINE_BODY,
      );
    }

    const bagSim = new SimBody("bag", this.bagAssembly.baseBody, this.bagAssembly.group);
    this.bagAssembly.group.userData = { sim: bagSim, body: this.bagAssembly.baseBody, label: "bag" };
    this.bagAssembly.group.traverse((c) => {
      c.userData.sim = bagSim;
      c.userData.label = "bag";
      if ((c as THREE.Mesh).isMesh) {
        (c as THREE.Mesh).castShadow = true;
        (c as THREE.Mesh).receiveShadow = true;
      }
    });
    this.meshes.set(this.bagAssembly.baseBody, this.bagAssembly.group);
    this.byLabel.set("bag", bagSim);

    this.plantAssembly = new PottedPlantAssembly(this.physics, this.scene, this.materials.terraCotta);
    this.plantAssembly.reset(new THREE.Vector3(POS.plant.x, POS.plant.y, POS.plant.z));
    const plantSim = new SimBody("plant", this.plantAssembly.potBody, this.plantAssembly.group);
    this.plantAssembly.group.userData = { sim: plantSim, body: this.plantAssembly.potBody, label: "plant" };
    this.plantAssembly.group.traverse((c) => {
      c.userData.sim = plantSim;
      c.userData.label = "plant";
      if ((c as THREE.Mesh).isMesh) {
        (c as THREE.Mesh).castShadow = true;
        (c as THREE.Mesh).receiveShadow = true;
      }
    });
    this.meshes.set(this.plantAssembly.potBody, this.plantAssembly.group);
    this.byLabel.set("plant", plantSim);

    const officeSurfaces: LiquidSurface[] = [
      {
        name: "printer",
        minX: POS.printer.x - SIZE.printer.w / 2,
        maxX: POS.printer.x + SIZE.printer.w / 2,
        minZ: POS.printer.z - SIZE.printer.d / 2,
        maxZ: POS.printer.z + SIZE.printer.d / 2,
        y: POS.printer.y + SIZE.printer.h / 2,
        isElectrical: true,
      },
      {
        name: "desk",
        minX: POS.desk.x - SIZE.desk.w / 2,
        maxX: POS.desk.x + SIZE.desk.w / 2,
        minZ: POS.desk.z - SIZE.desk.d / 2,
        maxZ: POS.desk.z + SIZE.desk.d / 2,
        y: SIZE.desk.h,
      },
      {
        name: "copier",
        minX: POS.copier.x - SIZE.copier.w / 2,
        maxX: POS.copier.x + SIZE.copier.w / 2,
        minZ: POS.copier.z - SIZE.copier.d / 2,
        maxZ: POS.copier.z + SIZE.copier.d / 2,
        y: POS.copier.y + SIZE.copier.h / 2,
      },
      {
        name: "floor",
        minX: -5.0,
        maxX: 5.0,
        minZ: -5.0,
        maxZ: 5.0,
        y: 0.0,
      },
    ];

    this.liquid = new LiquidSimulation(this.scene, officeSurfaces);
    this.liquid.onPour = (rate) => this.onCoffeePour?.(rate);
    this.liquid.onElectricalWet = (_vol, target) => {
      if (target === "printer") {
        this.onShortCircuit?.();
      }
    };

    this.fracture = new FractureSystem(this.physics, this.scene, this.materials.ceramicGlazed);
    this.fracture.onShatter = (pos, speed) => this.onShatter?.(pos, speed);
    this.fracture.onClatter = (pos, speed) => this.onClatter?.(pos, speed);
  }

  private pinJam() {
    const jamMesh = this.jamMesh();
    const jamBody = new CANNON.Body({
      mass: MASS.jam,
      shape: new CANNON.Box(new CANNON.Vec3(SIZE.jam.w / 2, SIZE.jam.h / 2, SIZE.jam.d / 2)),
      position: new CANNON.Vec3(POS.jam.x, POS.jam.y, POS.jam.z),
      angularDamping: 0.5,
      linearDamping: 0.2,
      material: this.materials.paperDry,
    });
    jamBody.quaternion.setFromEuler(0.4, 0, 0.08);
    this.filter(
      jamBody,
      COL.PAPER_SHEET,
      COL.STATIC_ENV | COL.SOLID_PROP | COL.MACHINE_BODY | COL.TRIGGER_ZONE,
    );
    this.track("jam", jamBody, jamMesh);
    const pin = new CANNON.Body({ mass: 0, type: CANNON.BODY_TYPES.STATIC });
    pin.position.set(POS.jam.x, POS.jam.y + SIZE.jam.h / 2 - 0.01, POS.jam.z - 0.02);
    this.physics.addBody(pin);
    this.jamPin = new CANNON.PointToPointConstraint(
      jamBody,
      new CANNON.Vec3(0, SIZE.jam.h / 2 - 0.01, 0),
      pin,
      new CANNON.Vec3(0, 0, 0),
    );
    this.physics.addConstraint(this.jamPin);
  }

  private compoundChair() {
    const body = new CANNON.Body({
      mass: MASS.chair,
      angularDamping: 0.45,
      linearDamping: 0.08,
      material: this.materials.chairCasters,
    });
    body.position.set(POS.chair.x, POS.chair.y, POS.chair.z);
    body.quaternion.setFromEuler(0, 0.55, 0);
    body.addShape(new CANNON.Box(new CANNON.Vec3(0.23, 0.035, 0.23)));
    body.addShape(new CANNON.Box(new CANNON.Vec3(0.22, 0.24, 0.025)), new CANNON.Vec3(0, 0.27, -0.2));
    body.addShape(new CANNON.Box(new CANNON.Vec3(0.035, 0.18, 0.035)), new CANNON.Vec3(0, -0.21, 0));
    body.addShape(new CANNON.Box(new CANNON.Vec3(0.22, 0.025, 0.22)), new CANNON.Vec3(0, -0.4, 0));
    this.filter(
      body,
      COL.SOLID_PROP,
      COL.STATIC_ENV | COL.SOLID_PROP | COL.PAPER_SHEET | COL.MACHINE_BODY,
    );
    this.track("chair", body, this.chairMesh());
  }

  private shellBox(
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    color: string,
    label: ObjLabel,
    kind: "paint" | "carpet" | "flat",
    repeatU: number,
    repeatV: number,
  ) {
    const mat =
      kind === "flat"
        ? new THREE.MeshStandardMaterial({ color, roughness: 0.84, metalness: 0.02 })
        : new THREE.MeshStandardMaterial({
            color: "#ffffff",
            map: this.shellMap(color, kind, repeatU, repeatV),
            roughness: kind === "carpet" ? 0.92 : 0.8,
            metalness: 0.02,
          });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.receiveShadow = true;
    this.staticMesh(
      mesh,
      x,
      y,
      z,
      w,
      h,
      d,
      label,
      kind === "carpet" ? this.materials.carpetFloor : this.materials.deskWood,
    );
  }

  private shellMap(hex: string, kind: "paint" | "carpet", repeatU: number, repeatV: number) {
    const size = 256;
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = hex;
    ctx.fillRect(0, 0, size, size);
    const rgb = new THREE.Color(hex);
    const specks = kind === "carpet" ? 2200 : 280;
    for (let i = 0; i < specks; i++) {
      const n = kind === "carpet" ? (Math.random() - 0.5) * 0.06 : (Math.random() - 0.5) * 0.035;
      ctx.fillStyle = `rgba(${Math.round((rgb.r + n) * 255)}, ${Math.round((rgb.g + n) * 255)}, ${Math.round((rgb.b + n) * 255)}, ${kind === "carpet" ? 0.35 : 0.12})`;
      const s = kind === "carpet" ? 1 + Math.random() * 1.4 : 10 + Math.random() * 28;
      ctx.fillRect(Math.random() * size, Math.random() * size, s, kind === "carpet" ? s : s * 0.22);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatU, repeatV);
    tex.anisotropy = 4;
    return tex;
  }

  private staticMesh(
    mesh: THREE.Object3D,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    label: ObjLabel,
    material?: CANNON.Material,
  ) {
    mesh.position.set(x, y, z);
    const body = new CANNON.Body({
      mass: 0,
      type: CANNON.BODY_TYPES.STATIC,
      shape: new CANNON.Box(new CANNON.Vec3(w / 2, h / 2, d / 2)),
      position: new CANNON.Vec3(x, y, z),
      material: material ?? this.materials.hardPlastic,
    });
    this.filter(
      body,
      COL.STATIC_ENV,
      COL.SOLID_PROP | COL.PAPER_SHEET | COL.MACHINE_BODY,
    );
    this.track(label, body, mesh);
  }

  private dynamic(
    label: ObjLabel,
    mass: number,
    shape: CANNON.Shape,
    mesh: THREE.Object3D,
    pos: Vec3,
    rot?: { rotY?: number; rotZ?: number },
    material?: CANNON.Material,
  ) {
    const body = new CANNON.Body({
      mass,
      shape,
      position: new CANNON.Vec3(pos.x, pos.y, pos.z),
      angularDamping: label === "cup" ? 0.45 : 0.35,
      linearDamping: label === "cup" ? 0.20 : 0.1,
      material: material ?? this.materials.hardPlastic,
      allowSleep: true,
    });
    body.sleepSpeedLimit = 0.12;
    body.sleepTimeLimit = 0.45;
    if (rot?.rotY) body.quaternion.setFromEuler(0, rot.rotY, 0);
    if (rot?.rotZ) body.quaternion.setFromEuler(0, 0, rot.rotZ);
    this.filter(
      body,
      COL.SOLID_PROP,
      COL.STATIC_ENV | COL.SOLID_PROP | COL.PAPER_SHEET | COL.MACHINE_BODY,
    );
    this.track(label, body, mesh);
  }

  private track(label: ObjLabel, body: CANNON.Body, mesh: THREE.Object3D) {
    const sim = new SimBody(label, body, mesh);
    mesh.userData = { sim, body, label };
    mesh.traverse((c) => {
      c.userData.sim = sim;
      c.userData.label = label;
      if ((c as THREE.Mesh).isMesh) {
        (c as THREE.Mesh).castShadow = true;
        (c as THREE.Mesh).receiveShadow = true;
      }
    });
    this.physics.addBody(body);
    this.scene.add(mesh);
    this.meshes.set(body, mesh);
    if (label !== "paper" && label !== "wall") this.byLabel.set(label, sim);
    mesh.position.copy(body.position as unknown as THREE.Vector3);
    mesh.quaternion.copy(body.quaternion as unknown as THREE.Quaternion);
    return sim;
  }

  private filter(body: CANNON.Body, group: number, mask: number) {
    body.collisionFilterGroup = group;
    body.collisionFilterMask = mask;
  }

  private fromCannon(body: CANNON.Body): SimBody | null {
    const mesh = this.meshes.get(body);
    return (mesh?.userData.sim as SimBody) ?? null;
  }

  private mat(color: string, extra: THREE.MeshStandardMaterialParameters = {}) {
    return new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.06, ...extra });
  }

  private deskMesh() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(SIZE.desk.w * 0.9, SIZE.desk.h - 0.08, SIZE.desk.d * 0.88),
      this.mat(palette.desk, { roughness: 0.55 }),
    );
    body.position.y = -0.02;
    g.add(body);
    const top = new THREE.Mesh(
      new THREE.BoxGeometry(SIZE.desk.w, 0.045, SIZE.desk.d),
      this.mat(palette.desk, { roughness: 0.5 }),
    );
    top.position.y = SIZE.desk.h / 2 - 0.022;
    g.add(top);
    const edge = new THREE.Mesh(
      new THREE.BoxGeometry(SIZE.desk.w + 0.02, 0.02, SIZE.desk.d + 0.02),
      this.mat(palette.deskEdge, { roughness: 0.45 }),
    );
    edge.position.y = SIZE.desk.h / 2 - 0.002;
    g.add(edge);
    const grommet = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.01, 12), this.mat("#3a332c"));
    grommet.position.set(0.42, SIZE.desk.h / 2 + 0.004, -0.12);
    g.add(grommet);
    return g;
  }

  private printerMesh() {
    const pr = SIZE.printer;
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.BoxGeometry(pr.w, pr.h, pr.d), this.mat(palette.printer, { roughness: 0.5 })));
    const lid = new THREE.Mesh(
      new THREE.BoxGeometry(pr.w - 0.04, 0.03, pr.d - 0.06),
      this.mat(palette.printerDark, { roughness: 0.4 }),
    );
    lid.position.y = pr.h / 2 - 0.01;
    g.add(lid);
    const cassette = new THREE.Mesh(
      new THREE.BoxGeometry(pr.w - 0.06, 0.04, 0.06),
      this.mat(palette.printerDark),
    );
    cassette.position.set(0, -pr.h / 2 + 0.08, pr.d / 2 - 0.01);
    g.add(cassette);
    const slot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.012, 0.04), this.mat("#1a1a18"));
    slot.position.set(0.02, 0.02, pr.d / 2 + 0.01);
    g.add(slot);
    const tray = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.016, 0.16), this.mat("#d9d3c6", { roughness: 0.6 }));
    tray.position.set(0.04, -pr.h / 2 + 0.09, pr.d / 2 + 0.08);
    g.add(tray);
    const lip = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.012, 0.012), this.mat(palette.printerDark));
    lip.position.set(0.04, -pr.h / 2 + 0.1, pr.d / 2 + 0.16);
    g.add(lip);
    const bezel = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.05, 0.008), this.mat("#2a2c28"));
    bezel.position.set(0.06, 0.04, pr.d / 2 + 0.001);
    g.add(bezel);
    const lcdCanvas = document.createElement("canvas");
    lcdCanvas.width = 256;
    lcdCanvas.height = 64;
    this.printerCtx = lcdCanvas.getContext("2d")!;
    this.printerLcd = new THREE.CanvasTexture(lcdCanvas);
    const lcd = new THREE.Mesh(
      new THREE.PlaneGeometry(0.16, 0.04),
      new THREE.MeshBasicMaterial({ map: this.printerLcd }),
    );
    lcd.position.set(0.06, 0.04, pr.d / 2 + 0.006);
    g.add(lcd);
    const window = new THREE.Mesh(
      new THREE.BoxGeometry(0.028, 0.018, 0.006),
      this.mat("#3a3018", { roughness: 0.3, metalness: 0.2 }),
    );
    window.position.set(-pr.w / 2 + 0.06, pr.h / 2 - 0.04, pr.d / 2 + 0.002);
    g.add(window);
    this.printerLedMat = new THREE.MeshStandardMaterial({
      color: palette.led,
      emissive: palette.led,
      emissiveIntensity: 1.8,
    });
    const led = new THREE.Mesh(
      new THREE.SphereGeometry(0.01, 12, 12),
      this.printerLedMat,
    );
    led.position.set(-pr.w / 2 + 0.06, pr.h / 2 - 0.04, pr.d / 2 + 0.008);
    led.name = "led";
    g.add(led);
    return g;
  }

  private copierMesh() {
    const cop = SIZE.copier;
    const g = new THREE.Group();
    const cabinet = new THREE.Mesh(
      new THREE.BoxGeometry(cop.w, cop.h * 0.72, cop.d),
      this.mat(palette.copier, { roughness: 0.48 }),
    );
    cabinet.position.y = -cop.h * 0.14;
    g.add(cabinet);
    const lid = new THREE.Mesh(
      new THREE.BoxGeometry(cop.w - 0.04, cop.h * 0.18, cop.d - 0.08),
      this.mat(palette.copierHi, { roughness: 0.4 }),
    );
    lid.name = "copier-lid";
    lid.position.set(0, cop.h * 0.36, -0.02);
    g.add(lid);
    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(cop.w - 0.12, 0.01, cop.d - 0.18),
      this.mat("#1c1e22", { roughness: 0.15, metalness: 0.35 }),
    );
    glass.position.set(0, cop.h * 0.28, 0);
    g.add(glass);
    this.scanBar = new THREE.Mesh(
      new THREE.BoxGeometry(cop.w - 0.16, 0.006, 0.018),
      new THREE.MeshStandardMaterial({
        color: "#6ec8c0",
        emissive: "#4aa8a0",
        emissiveIntensity: 0,
        roughness: 0.3,
      }),
    );
    this.scanBar.name = "scan-bar";
    this.scanBar.position.set(0, cop.h * 0.286, 0);
    this.scanBar.visible = false;
    g.add(this.scanBar);
    const copCanvas = document.createElement("canvas");
    copCanvas.width = 256;
    copCanvas.height = 64;
    this.copierCtx = copCanvas.getContext("2d")!;
    this.copierLcd = new THREE.CanvasTexture(copCanvas);
    const bezel = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.08, 0.01), this.mat("#1a1c20"));
    bezel.position.set(0.08, 0.42, cop.d / 2 + 0.002);
    g.add(bezel);
    const copLcd = new THREE.Mesh(
      new THREE.PlaneGeometry(0.28, 0.07),
      new THREE.MeshBasicMaterial({ map: this.copierLcd }),
    );
    copLcd.position.set(0.08, 0.42, cop.d / 2 + 0.008);
    g.add(copLcd);
    const copTray = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.02, 0.24), this.mat("#2c2f34"));
    copTray.position.set(-0.04, -0.08, cop.d / 2 + 0.1);
    g.add(copTray);
    return g;
  }

  private phoneMesh() {
    const g = new THREE.Group();
    const w = SIZE.phone.w;
    const h = SIZE.phone.h;
    const d = SIZE.phone.d;
    g.add(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), this.mat(palette.phone, { roughness: 0.28, metalness: 0.4 })));
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(w * 0.82, d * 0.72),
      new THREE.MeshStandardMaterial({
        color: "#2a3340",
        emissive: "#3a4a58",
        emissiveIntensity: 0.55,
        roughness: 0.2,
      }),
    );
    screen.rotation.x = -Math.PI / 2;
    screen.position.y = h / 2 + 0.001;
    g.add(screen);
    const bump = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.008, 0.028), this.mat("#111"));
    bump.position.set(-w / 2 + 0.028, h / 2 + 0.004, -d / 2 + 0.022);
    g.add(bump);
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.004, 10), this.mat("#2a3340", { metalness: 0.6 }));
    lens.position.copy(bump.position);
    lens.position.y += 0.005;
    g.add(lens);
    return g;
  }

  private jamMesh() {
    const g = new THREE.Group();
    const sheet = new THREE.Mesh(
      new THREE.BoxGeometry(SIZE.jam.w, SIZE.jam.h, SIZE.jam.d),
      this.mat(palette.paper, { roughness: 0.88 }),
    );
    g.add(sheet);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(SIZE.jam.w * 0.7, 0.008, 0.001), this.mat("#c8c4ba"));
    bar.position.y = SIZE.jam.h * 0.18;
    g.add(bar);
    return g;
  }

  private paperMesh(wet = false) {
    const s = SIZE.paper;
    const g = new THREE.Group();
    g.add(
      new THREE.Mesh(
        new THREE.BoxGeometry(s.w, s.d, s.h),
        this.mat(wet ? "#cbb89a" : palette.paper, { roughness: 0.88 }),
      ),
    );
    const line = new THREE.Mesh(new THREE.BoxGeometry(s.w * 0.7, 0.0008, 0.004), this.mat(wet ? "#8a6a48" : "#c8c4ba"));
    line.position.set(0, s.d / 2 + 0.0006, 0.04);
    g.add(line);
    return g;
  }

  private fanMesh() {
    const g = new THREE.Group();
    const plastic = this.mat(palette.fan, { metalness: 0.28, roughness: 0.42 });
    const discY = 0.02;
    const discR = 0.11;
    const disc = new THREE.Group();
    disc.position.y = discY;
    const cage = new THREE.Mesh(new THREE.TorusGeometry(discR, 0.008, 8, 22), plastic);
    cage.rotation.y = Math.PI / 2;
    disc.add(cage);
    const spokeLen = 0.076;
    const spokeMid = 0.022 + spokeLen / 2;
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 + Math.PI / 6;
      const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, spokeLen, 6), plastic);
      spoke.rotation.x = a;
      spoke.position.y = Math.cos(a) * spokeMid;
      spoke.position.z = Math.sin(a) * spokeMid;
      disc.add(spoke);
    }
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.04, 12), this.mat("#4a5054"));
    hub.rotation.z = Math.PI / 2;
    disc.add(hub);
    const blades = new THREE.Group();
    blades.name = "blades";
    const bladeMat = this.mat("#c5c9cc", { metalness: 0.32, roughness: 0.35 });
    const bladeSpan = 0.055;
    const bladeMid = 0.028 + bladeSpan / 2;
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI * 2) / 3 + Math.PI / 6;
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.008, bladeSpan, 0.032), bladeMat);
      b.rotation.x = a;
      b.position.y = Math.cos(a) * bladeMid;
      b.position.z = Math.sin(a) * bladeMid;
      blades.add(b);
    }
    disc.add(blades);
    g.add(disc);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.12, 10), plastic);
    neck.position.y = -0.055;
    g.add(neck);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.062, 0.03, 14), plastic);
    base.position.y = -0.125;
    g.add(base);
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.06, 6), this.mat("#1a1a18"));
    cord.rotation.z = 0.9;
    cord.position.set(0.04, -0.1, 0);
    g.add(cord);
    return g;
  }

  private chairMesh() {
    const g = new THREE.Group();
    const vinyl = this.mat(palette.chair, { roughness: 0.55 });
    const metal = this.mat("#3a3a3c", { metalness: 0.45, roughness: 0.4 });
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.06, 0.46), vinyl);
    g.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.48, 0.05), vinyl);
    back.position.set(0, 0.28, -0.2);
    g.add(back);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.36, 10), metal);
    stem.position.y = -0.21;
    g.add(stem);
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5 + 0.2;
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.025, 0.04), metal);
      arm.position.set(Math.cos(a) * 0.11, -0.4, Math.sin(a) * 0.11);
      arm.rotation.y = -a;
      g.add(arm);
      const wheel = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 8), metal);
      const off = i === 0 ? 0.04 : 0;
      wheel.position.set(Math.cos(a) * (0.2 + off), -0.45, Math.sin(a) * (0.2 + off));
      g.add(wheel);
    }
    return g;
  }

  private initFx() {
    const pts = (color: string, size: number, count = 80) => {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
      const mesh = new THREE.Points(
        geo,
        new THREE.PointsMaterial({
          color,
          size,
          transparent: true,
          opacity: 0.9,
          depthWrite: false,
          sizeAttenuation: true,
        }),
      );
      this.scene.add(mesh);
      return { geo, mesh };
    };
    const pour = pts(palette.coffee, 0.038, 60);
    this.pourGeo = pour.geo;
    this.fxPour = pour.mesh;
    const drip = pts(palette.coffee, 0.032, 40);
    this.dripGeo = drip.geo;
    this.fxDrip = drip.mesh;
    const spark = pts("#ffe08a", 0.04, 90);
    this.sparkGeo = spark.geo;
    this.fxSpark = spark.mesh;
    const smoke = pts("#55524c", 0.085, 90);
    this.smokeGeo = smoke.geo;
    this.fxSmoke = smoke.mesh;

    this.pourBeam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.018, 1, 8),
      this.mat(palette.coffee, { roughness: 0.25, transparent: true, opacity: 0.82 }),
    );
    this.pourBeam.visible = false;
    this.scene.add(this.pourBeam);
  }

  private tickFx() {
    const now = performance.now();
    const pouring = now < this.pourUntil;
    const sparking = now < this.sparkUntil;
    const cup = this.get("cup").position;
    const mouth = MOUTH.printer;
    const deskY = SIZE.desk.h + 0.003;
    this.pourBeam.visible = false;

    // Stream from cup mouth to printer intake
    this.writePts(this.pourGeo, pouring, (i) => {
      const t = (i % 10) / 10;
      return [
        cup.x + (mouth.x - cup.x) * t + (Math.random() - 0.5) * 0.02,
        cup.y + (mouth.y - cup.y) * t - t * 0.015,
        cup.z + (mouth.z - cup.z) * t + (Math.random() - 0.5) * 0.02,
      ];
    });

    // Dripping down front casing onto desk
    this.writePts(this.dripGeo, pouring || this.printerFeral, (i) => {
      const t = (i % 8) / 8;
      return [
        mouth.x - 0.02 + (Math.random() - 0.5) * 0.04,
        mouth.y - t * (mouth.y - deskY),
        mouth.z + 0.02 + t * 0.04 + (Math.random() - 0.5) * 0.01,
      ];
    });

    // Grow desk coffee puddle as it drips
    if (this.deskPuddleMesh && pouring) {
      const scale = Math.min(3.5, this.deskPuddleMesh.scale.x + 0.015);
      this.deskPuddleMesh.scale.set(scale, 1, scale);
    }

    // Electrical sparks at printer
    this.writePts(this.sparkGeo, sparking, () => [
      mouth.x + (Math.random() - 0.5) * 0.16,
      mouth.y + 0.02 + Math.random() * 0.14,
      mouth.z + (Math.random() - 0.5) * 0.08,
    ]);

    // Dense smoke rising from printer
    this.writePts(this.smokeGeo, this.printerFeral, () => [
      mouth.x + (Math.random() - 0.5) * 0.1,
      mouth.y + 0.06 + Math.random() * 0.22,
      mouth.z + (Math.random() - 0.5) * 0.06,
    ]);

    (this.fxPour.material as THREE.PointsMaterial).opacity = pouring ? 0.95 : 0;
    (this.fxDrip.material as THREE.PointsMaterial).opacity = (pouring || this.printerFeral) ? 0.9 : 0;
    (this.fxSpark.material as THREE.PointsMaterial).opacity = sparking ? 1 : 0;
    (this.fxSmoke.material as THREE.PointsMaterial).opacity = this.printerFeral ? 0.45 : 0;

    if (this.scanBar) {
      this.scanBar.visible = this.copierAwake && !this.breakerPopped;
      const mat = this.scanBar.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = this.copierAwake && !this.breakerPopped ? 1.6 : 0;
      if (this.copierAwake && !this.breakerPopped) this.scanBar.position.z = Math.sin(now / 260) * 0.14;
    }
  }

  private writePts(geo: THREE.BufferGeometry, on: boolean, at: (i: number) => [number, number, number]) {
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const n = pos.count;
    for (let i = 0; i < n; i++) {
      if (!on) {
        pos.setXYZ(i, 0, -12, 0);
        continue;
      }
      const p = at(i);
      pos.setXYZ(i, p[0], p[1], p[2]);
    }
    pos.needsUpdate = true;
  }

  private spinFan(dt: number) {
    const fan = this.get("fan").mesh.getObjectByName("blades");
    if (fan) fan.rotation.x += dt * this.fanSpin;
  }

  private updateLcds() {
    const p = this.printerCtx;
    if (this.breakerPopped && this.blackout > 0.75) {
      p.fillStyle = "#0a0a08";
      p.fillRect(0, 0, 256, 64);
    } else if (this.printerFeral) {
      p.fillStyle = "#3a2018";
      p.fillRect(0, 0, 256, 64);
      p.fillStyle = "#f3c9a0";
      p.font = "bold 20px monospace";
      p.fillText("SHORT / NO PWR", 16, 40);
    } else if (this.paperJobs.some((j) => j.source === "printer")) {
      p.fillStyle = "#111612";
      p.fillRect(0, 0, 256, 64);
      p.fillStyle = "#5cd668";
      p.font = "bold 20px monospace";
      p.fillText("PRINTING...", 16, 40);
    } else {
      p.fillStyle = "#111612";
      p.fillRect(0, 0, 256, 64);
      p.fillStyle = "#5cd668";
      p.font = "bold 20px monospace";
      p.fillText("ONLINE - READY", 16, 40);
    }
    this.printerLcd.needsUpdate = true;

    const c = this.copierCtx;
    if (this.breakerPopped && this.blackout > 0.75) {
      c.fillStyle = "#0a0a08";
      c.fillRect(0, 0, 256, 64);
    } else if (this.copierAwake) {
      c.fillStyle = "#1a120c";
      c.fillRect(0, 0, 256, 64);
      c.fillStyle = "#f3c28a";
      c.font = "bold 18px monospace";
      c.fillText(`PRINTING ${this.copierPage} OF 847`, 12, 40);
    } else {
      c.fillStyle = "#111612";
      c.fillRect(0, 0, 256, 64);
      c.fillStyle = "#5cd668";
      c.font = "bold 18px monospace";
      c.fillText("READY / STANDBY", 12, 40);
    }
    this.copierLcd.needsUpdate = true;

    const coffee = this.get("cup").mesh.getObjectByName("coffee");
    if (coffee) coffee.visible = !this.cupEmpty;
    const led = this.get("printer").mesh.getObjectByName("led") as THREE.Mesh | undefined;
    if (led) {
      const mat = led.material as THREE.MeshStandardMaterial;
      if (this.breakerPopped && this.blackout > 0.8) {
        mat.emissive = new THREE.Color("#050505");
        mat.color = mat.emissive;
        mat.emissiveIntensity = 0;
      } else if (this.printerFeral) {
        const blink = Math.sin(performance.now() / 120) > 0;
        mat.emissive = new THREE.Color(palette.ledHot);
        mat.color = mat.emissive;
        mat.emissiveIntensity = blink ? 2.6 : 0.2;
      } else {
        // Normal calm ready steady green glow
        mat.emissive = new THREE.Color(palette.led);
        mat.color = mat.emissive;
        mat.emissiveIntensity = 1.6;
      }
    }
  }
}

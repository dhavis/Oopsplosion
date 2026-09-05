import * as CANNON from "cannon-es";
import * as THREE from "three";
import { palette } from "../theme";
import { SANDBOX_COL } from "./sandboxScale";

export interface PlantAssemblySpec {
  potMass: number;
  rootBallMass: number;
  looseSoilMass: number;
  stemMass: number;
  totalMass: number;
  shatterSpeed: number;
  spillTiltDeg: number;
  uprootTiltDeg: number;
}

export const PLANT_SPEC: PlantAssemblySpec = {
  potMass: 1.35,
  rootBallMass: 2.65,
  looseSoilMass: 0.90,
  stemMass: 0.30,
  totalMass: 5.20,
  shatterSpeed: 2.8, // m/s impact to shatter
  spillTiltDeg: 55,  // degrees tilt to begin spilling soil
  uprootTiltDeg: 78, // degrees tilt to dislodge root ball
};

export type PotState = "intact" | "cracked" | "shattered";
export type SoilState = "contained" | "spilling" | "rootBallReleased" | "settled";
export type FoliageState = "rooted" | "loosened" | "uprooted";

export interface SoilCrumb {
  body: CANNON.Body;
  active: boolean;
}

export interface ShardPiece {
  body: CANNON.Body;
  mesh: THREE.Mesh;
  localPos: THREE.Vector3;
  active: boolean;
}

export class PottedPlantAssembly {
  readonly world: CANNON.World;
  readonly scene: THREE.Scene;
  readonly material: CANNON.Material;

  // Primary Bodies
  potBody: CANNON.Body;
  rootBallBody: CANNON.Body;
  stemBody: CANNON.Body;

  // Constraints
  private rootConstraint: CANNON.PointToPointConstraint | null = null;
  private stemConstraint: CANNON.PointToPointConstraint | null = null;

  // Visual Groups & Meshes
  readonly group = new THREE.Group();
  private potMesh: THREE.Group;
  private potIntactMesh: THREE.Mesh;
  private potRimMesh: THREE.Mesh;
  private soilSurfaceMesh: THREE.Mesh;
  private rootBallMesh: THREE.Group;
  private stemGroup: THREE.Group;
  private leaves: THREE.Mesh[] = [];

  // Debris & Shards
  private shards: ShardPiece[] = [];
  private crumbs: SoilCrumb[] = [];
  private crumbMesh: THREE.InstancedMesh;
  private crumbDummy = new THREE.Object3D();

  // State
  potState: PotState = "intact";
  soilState: SoilState = "contained";
  foliageState: FoliageState = "rooted";

  soilRemainingMl: number = 900; // 900g / loose soil
  private lastSpillTime = 0;
  private stemSwayAngle = new THREE.Vector2(0, 0);
  private stemSwayVel = new THREE.Vector2(0, 0);

  // Callbacks
  onShatter?: (pos: THREE.Vector3, speed: number) => void;
  onSpill?: (crumbCount: number) => void;
  onUproot?: () => void;

  constructor(world: CANNON.World, scene: THREE.Scene, material: CANNON.Material) {
    this.world = world;
    this.scene = scene;
    this.material = material;

    // 1. Pot Body (Hollow Compound Cylinder)
    this.potBody = new CANNON.Body({
      mass: PLANT_SPEC.potMass,
      material,
      linearDamping: 0.20,
      angularDamping: 0.35,
      allowSleep: true,
    });
    this.potBody.sleepSpeedLimit = 0.12;
    this.potBody.sleepTimeLimit = 0.45;
    // Base and tapered walls
    this.potBody.addShape(new CANNON.Cylinder(0.12, 0.095, 0.22, 16));
    this.potBody.collisionFilterGroup = SANDBOX_COL.CUP;
    this.potBody.collisionFilterMask = SANDBOX_COL.ENV | SANDBOX_COL.CUP | SANDBOX_COL.SHARD;
    this.potBody.position.set(0, 0.91, 0);
    this.world.addBody(this.potBody);

    // 2. Root Ball Body (Internal subpart - does not collide with potBody while intact)
    this.rootBallBody = new CANNON.Body({
      mass: PLANT_SPEC.rootBallMass + PLANT_SPEC.looseSoilMass,
      material,
      linearDamping: 0.30,
      angularDamping: 0.45,
      allowSleep: true,
    });
    this.rootBallBody.sleepSpeedLimit = 0.12;
    this.rootBallBody.sleepTimeLimit = 0.45;
    this.rootBallBody.addShape(new CANNON.Sphere(0.08));
    this.rootBallBody.collisionFilterGroup = 1 << 8;
    this.rootBallBody.collisionFilterMask = SANDBOX_COL.ENV;
    this.rootBallBody.position.set(0, 0.91 + 0.02, 0);
    this.world.addBody(this.rootBallBody);

    // 3. Articulated Stem Body (Foliage subpart - does not collide with potBody or rootBallBody)
    this.stemBody = new CANNON.Body({
      mass: PLANT_SPEC.stemMass,
      material,
      linearDamping: 0.30,
      angularDamping: 0.55,
      allowSleep: true,
    });
    this.stemBody.sleepSpeedLimit = 0.12;
    this.stemBody.sleepTimeLimit = 0.45;
    this.stemBody.addShape(new CANNON.Sphere(0.10));
    this.stemBody.collisionFilterGroup = 1 << 9;
    this.stemBody.collisionFilterMask = SANDBOX_COL.ENV;
    this.stemBody.position.set(0, 0.91 + 0.28, 0);
    this.world.addBody(this.stemBody);

    // Constraints linking Root Ball inside Pot and Stem to Root Ball
    this.attachConstraints();

    // Visuals Setup
    this.potMesh = new THREE.Group();
    const potMat = new THREE.MeshStandardMaterial({
      color: palette.pot,
      roughness: 0.65,
      metalness: 0.05,
    });

    this.potIntactMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.095, 0.22, 24, 1, true),
      potMat,
    );
    this.potIntactMesh.castShadow = true;
    this.potIntactMesh.receiveShadow = true;
    this.potMesh.add(this.potIntactMesh);

    this.potRimMesh = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.012, 8, 24), potMat);
    this.potRimMesh.rotation.x = Math.PI / 2;
    this.potRimMesh.position.y = 0.11;
    this.potMesh.add(this.potRimMesh);

    const baseMesh = new THREE.Mesh(new THREE.CircleGeometry(0.095, 20), potMat);
    baseMesh.rotation.x = Math.PI / 2;
    baseMesh.position.y = -0.11;
    this.potMesh.add(baseMesh);

    this.group.add(this.potMesh);

    // Contained Topsoil Surface Mesh
    this.soilSurfaceMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.105, 0.02, 20),
      new THREE.MeshStandardMaterial({ color: "#2c1e14", roughness: 0.95 }),
    );
    this.soilSurfaceMesh.position.y = 0.09;
    this.potMesh.add(this.soilSurfaceMesh);

    // Root Ball Visual Mesh
    this.rootBallMesh = new THREE.Group();
    const rootMat = new THREE.MeshStandardMaterial({ color: "#24180f", roughness: 0.98 });
    const rootCore = new THREE.Mesh(new THREE.SphereGeometry(0.082, 14, 10), rootMat);
    rootCore.scale.set(1.1, 0.9, 1.1);
    this.rootBallMesh.add(rootCore);
    this.group.add(this.rootBallMesh);

    // Foliage Visuals
    this.stemGroup = new THREE.Group();
    const stemMat = new THREE.MeshStandardMaterial({ color: "#3a5328", roughness: 0.6 });
    const mainStem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.018, 0.32, 10), stemMat);
    mainStem.position.y = 0;
    this.stemGroup.add(mainStem);

    const leafMat = new THREE.MeshStandardMaterial({
      color: palette.plant,
      roughness: 0.72,
      metalness: 0.02,
      side: THREE.DoubleSide,
    });

    const leafPositions: [number, number, number, number, number, number][] = [
      [-0.07, -0.02, 0.04, 0.09, 0.24, 0.5],
      [0.08, 0.02, -0.03, 0.10, 0.28, -0.6],
      [-0.04, 0.09, -0.06, 0.09, 0.26, 0.8],
      [0.06, 0.13, 0.05, 0.11, 0.30, -0.7],
      [-0.02, 0.19, 0.06, 0.10, 0.28, 0.4],
      [0.02, 0.22, -0.04, 0.09, 0.27, -0.5],
      [0, 0.26, 0, 0.08, 0.25, 0.2],
    ];

    for (const [x, y, z, sx, sy, rz] of leafPositions) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), leafMat);
      leaf.scale.set(sx, sy, sx * 0.4);
      leaf.position.set(x, y, z);
      leaf.rotation.z = rz;
      leaf.rotation.x = (Math.random() - 0.5) * 0.4;
      leaf.castShadow = true;
      this.leaves.push(leaf);
      this.stemGroup.add(leaf);
    }
    this.group.add(this.stemGroup);

    // Ceramic Shards (8 pieces)
    this.initShards();

    // Soil Crumbs Pool (18 crumbs)
    const crumbGeo = new THREE.DodecahedronGeometry(0.014);
    const crumbMat = new THREE.MeshStandardMaterial({ color: "#281b12", roughness: 0.98 });
    this.crumbMesh = new THREE.InstancedMesh(crumbGeo, crumbMat, 24);
    this.crumbMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.scene.add(this.crumbMesh);
    this.initCrumbs();

    this.scene.add(this.group);
    this.syncMesh();
  }

  isInternalBody(body: CANNON.Body): boolean {
    if (body === this.rootBallBody || body === this.stemBody || body === this.potBody) return true;
    for (const s of this.shards) {
      if (s.body === body) return true;
    }
    for (const c of this.crumbs) {
      if (c.body === body) return true;
    }
    return false;
  }

  private attachConstraints() {
    this.detachConstraints();

    // Pin Root Ball inside Pot cavity
    this.rootConstraint = new CANNON.PointToPointConstraint(
      this.potBody,
      new CANNON.Vec3(0, 0.02, 0),
      this.rootBallBody,
      new CANNON.Vec3(0, 0, 0),
    );
    this.rootConstraint.collideConnected = false;
    this.world.addConstraint(this.rootConstraint);

    // Pin Stem to Root Ball
    this.stemConstraint = new CANNON.PointToPointConstraint(
      this.rootBallBody,
      new CANNON.Vec3(0, 0.10, 0),
      this.stemBody,
      new CANNON.Vec3(0, -0.16, 0),
    );
    this.stemConstraint.collideConnected = false;
    this.world.addConstraint(this.stemConstraint);
  }

  private detachConstraints() {
    if (this.rootConstraint) {
      this.world.removeConstraint(this.rootConstraint);
      this.rootConstraint = null;
    }
    if (this.stemConstraint) {
      this.world.removeConstraint(this.stemConstraint);
      this.stemConstraint = null;
    }
  }

  private initShards() {
    const shardMat = new THREE.MeshStandardMaterial({
      color: palette.pot,
      roughness: 0.7,
      side: THREE.DoubleSide,
    });
    const count = 8;
    for (let i = 0; i < count; i++) {
      const angle = (i * Math.PI * 2) / count;
      const b = new CANNON.Body({
        mass: PLANT_SPEC.potMass / count,
        material: this.material,
        linearDamping: 0.14,
        angularDamping: 0.35,
        allowSleep: true,
      });
      b.addShape(new CANNON.Box(new CANNON.Vec3(0.04, 0.05, 0.015)));
      b.collisionFilterGroup = SANDBOX_COL.SHARD;
      b.collisionFilterMask = SANDBOX_COL.ENV | SANDBOX_COL.CUP | SANDBOX_COL.SHARD;
      b.position.set(0, -50, 0);
      this.world.addBody(b);

      const m = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.10, 0.02), shardMat);
      m.castShadow = true;
      m.visible = false;
      this.scene.add(m);

      const localPos = new THREE.Vector3(
        Math.cos(angle) * 0.10,
        (i % 2 === 0 ? 0.04 : -0.04),
        Math.sin(angle) * 0.10,
      );

      this.shards.push({ body: b, mesh: m, localPos, active: false });
    }
  }

  private initCrumbs() {
    for (let i = 0; i < 24; i++) {
      const b = new CANNON.Body({
        mass: 0.04,
        material: this.material,
        linearDamping: 0.25,
        angularDamping: 0.5,
        allowSleep: true,
      });
      b.addShape(new CANNON.Sphere(0.014));
      b.collisionFilterGroup = SANDBOX_COL.SHARD;
      b.collisionFilterMask = SANDBOX_COL.ENV | SANDBOX_COL.CUP;
      b.position.set(0, -50, 0);
      this.world.addBody(b);

      this.crumbs.push({ body: b, active: false });
    }
  }

  getTiltAngleDeg(): number {
    const up = new CANNON.Vec3(0, 1, 0);
    const potUp = this.potBody.vectorToWorldFrame(up);
    const cosTheta = Math.max(-1, Math.min(1, potUp.dot(up)));
    return THREE.MathUtils.radToDeg(Math.acos(cosTheta));
  }

  pokeFoliage(impulse: THREE.Vector3, contactWorld?: THREE.Vector3) {
    this.stemBody.wakeUp();
    this.rootBallBody.wakeUp();
    this.potBody.wakeUp();

    const pt = contactWorld
      ? new CANNON.Vec3(contactWorld.x, contactWorld.y, contactWorld.z)
      : this.stemBody.position;

    // Apply impulse to crown
    this.stemBody.applyImpulse(
      new CANNON.Vec3(impulse.x, impulse.y, impulse.z),
      pt,
    );

    // Spring bend impulse
    this.stemSwayVel.x += impulse.x * 4.5;
    this.stemSwayVel.y += impulse.z * 4.5;
  }

  pokePot(impulse: THREE.Vector3, contactWorld?: THREE.Vector3) {
    this.potBody.wakeUp();
    this.rootBallBody.wakeUp();
    this.stemBody.wakeUp();

    const pt = contactWorld
      ? new CANNON.Vec3(contactWorld.x, contactWorld.y, contactWorld.z)
      : this.potBody.position;

    this.potBody.applyImpulse(
      new CANNON.Vec3(impulse.x, impulse.y, impulse.z),
      pt,
    );
  }

  checkCollision(impactSpeed: number, normal: THREE.Vector3) {
    if (this.potState === "shattered") return;

    if (impactSpeed >= PLANT_SPEC.shatterSpeed) {
      this.shatter(impactSpeed, normal);
    } else if (impactSpeed >= 1.8 && this.potState === "intact") {
      this.potState = "cracked";
    }
  }

  shatter(speed = 2.5, normal = new THREE.Vector3(0, 1, 0)) {
    if (this.potState === "shattered") return;

    this.potState = "shattered";
    this.soilState = "rootBallReleased";
    this.foliageState = "uprooted";

    // Hide intact pot
    this.potMesh.visible = false;
    this.soilSurfaceMesh.visible = false;
    const potPos = this.potBody.position;
    const potVel = this.potBody.velocity;
    const potAngVel = this.potBody.angularVelocity;

    // Move intact pot body away
    this.potBody.position.set(0, -50, 0);
    this.detachConstraints();

    // Scatter Shards
    const potPosV3 = new THREE.Vector3(potPos.x, potPos.y, potPos.z);
    for (const shard of this.shards) {
      shard.active = true;
      shard.mesh.visible = true;

      const worldOffset = shard.localPos.clone();
      shard.body.position.set(
        potPos.x + worldOffset.x,
        potPos.y + worldOffset.y,
        potPos.z + worldOffset.z,
      );
      shard.body.velocity.set(
        potVel.x + (Math.random() - 0.5) * 0.8 + normal.x * 0.4,
        Math.max(0.2, potVel.y * 0.3 + Math.random() * 0.6),
        potVel.z + (Math.random() - 0.5) * 0.8 + normal.z * 0.4,
      );
      shard.body.angularVelocity.set(
        potAngVel.x + (Math.random() - 0.5) * 8,
        potAngVel.y + (Math.random() - 0.5) * 8,
        potAngVel.z + (Math.random() - 0.5) * 8,
      );
      shard.body.wakeUp();
    }

    // Spill remaining loose soil
    this.spillSoil(potPosV3, 12);

    // Free root ball and stem to tumble with realistic momentum
    this.rootBallBody.wakeUp();
    this.rootBallBody.velocity.set(potVel.x * 0.8, potVel.y * 0.5, potVel.z * 0.8);
    this.stemBody.wakeUp();
    this.stemBody.velocity.set(potVel.x * 0.8, potVel.y * 0.5, potVel.z * 0.8);

    this.onShatter?.(potPosV3, speed);
  }

  private spillSoil(origin: THREE.Vector3, count = 3) {
    let spawned = 0;
    for (const crumb of this.crumbs) {
      if (!crumb.active && spawned < count) {
        crumb.active = true;
        crumb.body.position.set(
          origin.x + (Math.random() - 0.5) * 0.12,
          origin.y + 0.04,
          origin.z + (Math.random() - 0.5) * 0.12,
        );
        crumb.body.velocity.set(
          (Math.random() - 0.5) * 0.4,
          Math.random() * 0.15,
          (Math.random() - 0.5) * 0.4,
        );
        crumb.body.wakeUp();
        spawned++;
      }
    }
    if (spawned > 0) {
      this.soilRemainingMl = Math.max(0, this.soilRemainingMl - spawned * 40);
      const frac = this.soilRemainingMl / 900;
      this.soilSurfaceMesh.scale.set(frac, 1, frac);
      this.onSpill?.(spawned);
    }
  }

  update(dt: number) {
    // 1. Spring-Damper restoring torque for foliage sway
    const kStem = 8.5; // Restoring stiffness
    const cStem = 2.2; // Damping
    this.stemSwayVel.x += (-kStem * this.stemSwayAngle.x - cStem * this.stemSwayVel.x) * dt;
    this.stemSwayVel.y += (-kStem * this.stemSwayAngle.y - cStem * this.stemSwayVel.y) * dt;
    this.stemSwayAngle.x += this.stemSwayVel.x * dt;
    this.stemSwayAngle.y += this.stemSwayVel.y * dt;

    // 2. Check Tilt & Spill Dynamics when intact
    if (this.potState !== "shattered") {
      const tilt = this.getTiltAngleDeg();
      const now = performance.now();

      // Natural resting stabilization: suppress micro-jitter on contact surfaces
      const linSpeed = this.potBody.velocity.length();
      const angSpeed = this.potBody.angularVelocity.length();
      if (tilt < 5 && linSpeed < 0.08 && angSpeed < 0.20) {
        this.potBody.velocity.set(0, 0, 0);
        this.potBody.angularVelocity.set(0, 0, 0);
        this.rootBallBody.velocity.set(0, 0, 0);
        this.rootBallBody.angularVelocity.set(0, 0, 0);
        this.stemBody.velocity.set(0, 0, 0);
        this.stemBody.angularVelocity.set(0, 0, 0);
      }

      if (tilt > PLANT_SPEC.spillTiltDeg && now - this.lastSpillTime > 180 && this.soilRemainingMl > 0) {
        this.lastSpillTime = now;
        this.soilState = "spilling";
        const rimWorld = this.potMesh.localToWorld(new THREE.Vector3(0, 0.1, 0));
        this.spillSoil(rimWorld, 2);
      }

      if (tilt > PLANT_SPEC.uprootTiltDeg && this.foliageState === "rooted") {
        this.foliageState = "uprooted";
        this.detachConstraints();
        this.onUproot?.();
      }
    }

    // 3. Sync Visuals
    this.syncMesh();
  }

  syncMesh() {
    if (this.potState !== "shattered") {
      this.potMesh.position.copy(this.potBody.position as unknown as THREE.Vector3);
      this.potMesh.quaternion.copy(this.potBody.quaternion as unknown as THREE.Quaternion);
    }

    this.rootBallMesh.position.copy(this.rootBallBody.position as unknown as THREE.Vector3);
    this.rootBallMesh.quaternion.copy(this.rootBallBody.quaternion as unknown as THREE.Quaternion);

    this.stemGroup.position.copy(this.stemBody.position as unknown as THREE.Vector3);
    this.stemGroup.quaternion.copy(this.stemBody.quaternion as unknown as THREE.Quaternion);

    // Apply secondary leaf & crown flex
    this.stemGroup.rotation.z += this.stemSwayAngle.x;
    this.stemGroup.rotation.x += this.stemSwayAngle.y;

    // Sync active shards
    for (const shard of this.shards) {
      if (shard.active) {
        shard.mesh.position.copy(shard.body.position as unknown as THREE.Vector3);
        shard.mesh.quaternion.copy(shard.body.quaternion as unknown as THREE.Quaternion);
      }
    }

    // Sync active crumbs
    let activeCount = 0;
    for (let i = 0; i < this.crumbs.length; i++) {
      const c = this.crumbs[i];
      if (c.active) {
        this.crumbDummy.position.copy(c.body.position as unknown as THREE.Vector3);
        this.crumbDummy.quaternion.copy(c.body.quaternion as unknown as THREE.Quaternion);
        this.crumbDummy.scale.set(1, 1, 1);
        this.crumbDummy.updateMatrix();
        this.crumbMesh.setMatrixAt(activeCount++, this.crumbDummy.matrix);
      }
    }
    this.crumbMesh.count = activeCount;
    if (this.crumbMesh.instanceMatrix) {
      this.crumbMesh.instanceMatrix.needsUpdate = true;
    }
  }

  reset(pos = new THREE.Vector3(0, 0.91, 0)) {
    this.group.visible = true;
    this.crumbMesh.visible = true;
    this.potState = "intact";
    this.soilState = "contained";
    this.foliageState = "rooted";
    this.soilRemainingMl = 900;
    this.stemSwayAngle.set(0, 0);
    this.stemSwayVel.set(0, 0);

    // Pot
    this.potMesh.visible = true;
    this.soilSurfaceMesh.visible = true;
    this.soilSurfaceMesh.scale.set(1, 1, 1);
    this.potBody.position.set(pos.x, pos.y, pos.z);
    this.potBody.velocity.set(0, 0, 0);
    this.potBody.angularVelocity.set(0, 0, 0);
    this.potBody.quaternion.set(0, 0, 0, 1);
    this.potBody.wakeUp();

    // Root Ball
    this.rootBallBody.position.set(pos.x, pos.y + 0.02, pos.z);
    this.rootBallBody.velocity.set(0, 0, 0);
    this.rootBallBody.angularVelocity.set(0, 0, 0);
    this.rootBallBody.quaternion.set(0, 0, 0, 1);
    this.rootBallBody.wakeUp();

    // Stem
    this.stemBody.position.set(pos.x, pos.y + 0.28, pos.z);
    this.stemBody.velocity.set(0, 0, 0);
    this.stemBody.angularVelocity.set(0, 0, 0);
    this.stemBody.quaternion.set(0, 0, 0, 1);
    this.stemBody.wakeUp();

    // Constraints
    this.attachConstraints();

    // Hide Shards
    for (const shard of this.shards) {
      shard.active = false;
      shard.mesh.visible = false;
      shard.body.position.set(0, -50, 0);
      shard.body.velocity.set(0, 0, 0);
      shard.body.angularVelocity.set(0, 0, 0);
    }

    // Hide Crumbs
    for (const crumb of this.crumbs) {
      crumb.active = false;
      crumb.body.position.set(0, -50, 0);
      crumb.body.velocity.set(0, 0, 0);
      crumb.body.angularVelocity.set(0, 0, 0);
    }
    this.crumbMesh.count = 0;
    if (this.crumbMesh.instanceMatrix) {
      this.crumbMesh.instanceMatrix.needsUpdate = true;
    }

    this.syncMesh();
  }

  stow() {
    this.group.visible = false;
    this.crumbMesh.visible = false;
    for (const shard of this.shards) {
      shard.active = false;
      shard.mesh.visible = false;
      shard.body.position.set(0, -50, 0);
      shard.body.velocity.set(0, 0, 0);
      shard.body.angularVelocity.set(0, 0, 0);
      shard.body.sleep();
    }
    for (const crumb of this.crumbs) {
      crumb.active = false;
      crumb.body.position.set(0, -50, 0);
      crumb.body.velocity.set(0, 0, 0);
      crumb.body.angularVelocity.set(0, 0, 0);
      crumb.body.sleep();
    }
    this.crumbMesh.count = 0;
    if (this.crumbMesh.instanceMatrix) {
      this.crumbMesh.instanceMatrix.needsUpdate = true;
    }
    this.potBody.position.set(0, -50, 0);
    this.potBody.velocity.set(0, 0, 0);
    this.potBody.angularVelocity.set(0, 0, 0);
    this.potBody.sleep();
    this.rootBallBody.position.set(0, -50, 0);
    this.rootBallBody.velocity.set(0, 0, 0);
    this.rootBallBody.angularVelocity.set(0, 0, 0);
    this.rootBallBody.sleep();
    this.stemBody.position.set(0, -50, 0);
    this.stemBody.velocity.set(0, 0, 0);
    this.stemBody.angularVelocity.set(0, 0, 0);
    this.stemBody.sleep();
    this.syncMesh();
  }

  destroy() {
    this.detachConstraints();
    this.world.removeBody(this.potBody);
    this.world.removeBody(this.rootBallBody);
    this.world.removeBody(this.stemBody);

    for (const s of this.shards) {
      this.world.removeBody(s.body);
      this.scene.remove(s.mesh);
    }
    for (const c of this.crumbs) {
      this.world.removeBody(c.body);
    }
    this.scene.remove(this.crumbMesh);
    this.scene.remove(this.group);
  }
}

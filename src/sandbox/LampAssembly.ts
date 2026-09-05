import * as CANNON from "cannon-es";
import * as THREE from "three";
import { palette } from "../theme";
import { SANDBOX_COL } from "./sandboxScale";

export interface LampSpec {
  totalMass: number;
  shadeMass: number;
  cordMass: number;
  bulbMass: number;
  cordSegments: number;
  shatterSpeed: number;
}

export const LAMP_SPEC: LampSpec = {
  totalMass: 1.850,
  shadeMass: 1.745,
  cordMass: 0.060,
  bulbMass: 0.040,
  cordSegments: 5,
  shatterSpeed: 1.6,
};

export type LampMountState = "suspended" | "free";
export type LampBulbState = "intact" | "surging" | "burst";
export type LampPowerState = "on" | "surging" | "blackout";

export interface GlassShard {
  body: CANNON.Body;
  mesh: THREE.Mesh;
  localPos: THREE.Vector3;
  active: boolean;
}

export class LampAssembly {
  readonly world: CANNON.World;
  readonly scene: THREE.Scene;
  readonly material: CANNON.Material;

  // Primary Bodies
  anchorBody: CANNON.Body;
  cordBodies: CANNON.Body[] = [];
  shadeBody: CANNON.Body;
  bulbBody: CANNON.Body;

  // Constraints
  private cordConstraints: CANNON.Constraint[] = [];
  private bulbConstraint: CANNON.Constraint | null = null;

  // Visuals
  readonly group = new THREE.Group();
  private cordLine: THREE.Line;
  private cordPositions: Float32Array;
  private shadeMesh: THREE.Group;
  private socketMesh: THREE.Mesh;
  private bulbMesh: THREE.Mesh;
  private bulbMat: THREE.MeshStandardMaterial;

  // Lighting
  readonly bulbLight: THREE.PointLight;
  readonly flashLight: THREE.PointLight;

  // Glass Shards & Sparks
  private shards: GlassShard[] = [];
  private sparkPoints: THREE.Points;
  private sparkGeo: THREE.BufferGeometry;
  private sparkPositions: Float32Array;
  private sparkVelocities: THREE.Vector3[] = [];
  private sparkLifetimes: number[] = [];
  private sparkCount = 36;

  // State
  mountState: LampMountState = "suspended";
  bulbState: LampBulbState = "intact";
  powerState: LampPowerState = "on";
  isBroken = false;

  // Callbacks
  onBurst?: (pos: THREE.Vector3) => void;
  onClatter?: (speed: number) => void;

  constructor(
    world: CANNON.World,
    scene: THREE.Scene,
    material: CANNON.Material,
    anchorPos = new THREE.Vector3(0, 2.15, 0),
    shadePos = new THREE.Vector3(0, 1.25, 0),
    isSuspended = true,
  ) {
    this.world = world;
    this.scene = scene;
    this.material = material;
    this.mountState = isSuspended ? "suspended" : "free";

    // 1. Static Anchor Body
    this.anchorBody = new CANNON.Body({
      mass: 0,
      type: CANNON.BODY_TYPES.STATIC,
      position: new CANNON.Vec3(anchorPos.x, anchorPos.y, anchorPos.z),
    });
    this.world.addBody(this.anchorBody);

    // 2. Flexible Cord Segments (5 segments)
    const segCount = LAMP_SPEC.cordSegments;
    const segMass = LAMP_SPEC.cordMass / segCount;
    for (let i = 0; i < segCount; i++) {
      const t = (i + 1) / (segCount + 1);
      const px = THREE.MathUtils.lerp(anchorPos.x, shadePos.x, t);
      const py = THREE.MathUtils.lerp(anchorPos.y, shadePos.y + 0.12, t);
      const pz = THREE.MathUtils.lerp(anchorPos.z, shadePos.z, t);

      const b = new CANNON.Body({
        mass: isSuspended ? segMass : 0.005,
        material,
        linearDamping: 0.15,
        angularDamping: 0.25,
        allowSleep: true,
      });
      b.addShape(new CANNON.Sphere(0.012));
      b.collisionFilterGroup = SANDBOX_COL.CUP;
      b.collisionFilterMask = SANDBOX_COL.ENV | SANDBOX_COL.CUP;
      b.position.set(px, py, pz);
      this.world.addBody(b);
      this.cordBodies.push(b);
    }

    // 3. Lampshade & Socket Body (Rigid compound)
    this.shadeBody = new CANNON.Body({
      mass: LAMP_SPEC.shadeMass,
      material,
      linearDamping: 0.04,
      angularDamping: 0.08,
      allowSleep: true,
    });
    // Open cone approximation using cylinder shape
    this.shadeBody.addShape(new CANNON.Cylinder(0.04, 0.125, 0.18, 16));
    this.shadeBody.collisionFilterGroup = SANDBOX_COL.CUP;
    this.shadeBody.collisionFilterMask = SANDBOX_COL.ENV | SANDBOX_COL.CUP | SANDBOX_COL.SHARD;
    this.shadeBody.position.set(shadePos.x, shadePos.y, shadePos.z);
    this.world.addBody(this.shadeBody);

    // 4. Fragile Glass Light Bulb Body
    this.bulbBody = new CANNON.Body({
      mass: LAMP_SPEC.bulbMass,
      material,
      linearDamping: 0.10,
      angularDamping: 0.20,
      allowSleep: true,
    });
    this.bulbBody.addShape(new CANNON.Sphere(0.034));
    this.bulbBody.collisionFilterGroup = SANDBOX_COL.CUP;
    this.bulbBody.collisionFilterMask = SANDBOX_COL.ENV | SANDBOX_COL.CUP | SANDBOX_COL.SHARD;
    this.bulbBody.position.set(shadePos.x, shadePos.y - 0.02, shadePos.z);
    this.world.addBody(this.bulbBody);

    // 5. Constraints
    this.attachConstraints();

    // 6. Visual Presentation
    // Cord Line
    const cordGeo = new THREE.BufferGeometry();
    this.cordPositions = new Float32Array((segCount + 2) * 3);
    cordGeo.setAttribute("position", new THREE.BufferAttribute(this.cordPositions, 3));
    this.cordLine = new THREE.Line(
      cordGeo,
      new THREE.LineBasicMaterial({ color: "#22201e", linewidth: 2 }),
    );
    this.group.add(this.cordLine);

    // Metal Shade & Socket
    this.shadeMesh = new THREE.Group();
    const metalMat = new THREE.MeshStandardMaterial({
      color: palette.lamp,
      metalness: 0.85,
      roughness: 0.25,
      side: THREE.DoubleSide,
    });
    const shadeCone = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.125, 0.18, 24, 1, true),
      metalMat,
    );
    shadeCone.castShadow = true;
    shadeCone.receiveShadow = true;
    this.shadeMesh.add(shadeCone);

    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.04, 0.03, 16),
      new THREE.MeshStandardMaterial({ color: "#282622", metalness: 0.75, roughness: 0.35 }),
    );
    cap.position.y = 0.09;
    this.shadeMesh.add(cap);

    // Threaded Socket
    this.socketMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.018, 0.028, 14),
      new THREE.MeshStandardMaterial({ color: "#1a1816", metalness: 0.8, roughness: 0.3 }),
    );
    this.socketMesh.position.y = 0.01;
    this.shadeMesh.add(this.socketMesh);
    this.group.add(this.shadeMesh);

    // Light Bulb Mesh
    this.bulbMat = new THREE.MeshStandardMaterial({
      color: "#fff8e7",
      emissive: "#ffeac2",
      emissiveIntensity: 0.85,
      roughness: 0.20,
      metalness: 0.05,
      transparent: true,
      opacity: 0.92,
    });
    this.bulbMesh = new THREE.Mesh(new THREE.SphereGeometry(0.032, 18, 18), this.bulbMat);
    this.bulbMesh.castShadow = true;
    this.group.add(this.bulbMesh);

    // Lights
    this.bulbLight = new THREE.PointLight("#ffe8c4", 0.85, 3.5, 1.5);
    this.bulbLight.position.set(0, -0.02, 0);
    this.bulbMesh.add(this.bulbLight);

    this.flashLight = new THREE.PointLight("#ffffff", 0, 5.5, 1.2);
    this.flashLight.position.set(0, -0.02, 0);
    this.bulbMesh.add(this.flashLight);

    // Shards & Sparks
    this.initShards();
    this.sparkGeo = new THREE.BufferGeometry();
    this.sparkPositions = new Float32Array(this.sparkCount * 3);
    this.sparkGeo.setAttribute("position", new THREE.BufferAttribute(this.sparkPositions, 3));
    this.sparkPoints = new THREE.Points(
      this.sparkGeo,
      new THREE.PointsMaterial({
        color: "#fffaee",
        size: 0.035,
        transparent: true,
        opacity: 0.95,
      }),
    );
    this.sparkPoints.visible = false;
    this.scene.add(this.sparkPoints);

    this.scene.add(this.group);
    this.syncMesh();
  }

  private attachConstraints() {
    this.detachConstraints();

    if (this.mountState === "suspended") {
      // Anchor -> Seg 0
      const c0 = new CANNON.PointToPointConstraint(
        this.anchorBody,
        new CANNON.Vec3(0, 0, 0),
        this.cordBodies[0],
        new CANNON.Vec3(0, 0, 0),
      );
      this.world.addConstraint(c0);
      this.cordConstraints.push(c0);

      // Seg i -> Seg i+1
      for (let i = 0; i < this.cordBodies.length - 1; i++) {
        const c = new CANNON.PointToPointConstraint(
          this.cordBodies[i],
          new CANNON.Vec3(0, 0, 0),
          this.cordBodies[i + 1],
          new CANNON.Vec3(0, 0, 0),
        );
        this.world.addConstraint(c);
        this.cordConstraints.push(c);
      }

      // Last Seg -> Shade Cap (at local y = 0.09)
      const lastSeg = this.cordBodies[this.cordBodies.length - 1];
      const cEnd = new CANNON.PointToPointConstraint(
        lastSeg,
        new CANNON.Vec3(0, 0, 0),
        this.shadeBody,
        new CANNON.Vec3(0, 0.09, 0),
      );
      this.world.addConstraint(cEnd);
      this.cordConstraints.push(cEnd);
    }

    // Shade Socket -> Bulb
    if (this.bulbState !== "burst") {
      this.bulbConstraint = new CANNON.PointToPointConstraint(
        this.shadeBody,
        new CANNON.Vec3(0, -0.02, 0),
        this.bulbBody,
        new CANNON.Vec3(0, 0, 0),
      );
      this.world.addConstraint(this.bulbConstraint);
    }
  }

  private detachConstraints() {
    for (const c of this.cordConstraints) {
      this.world.removeConstraint(c);
    }
    this.cordConstraints = [];

    if (this.bulbConstraint) {
      this.world.removeConstraint(this.bulbConstraint);
      this.bulbConstraint = null;
    }
  }

  private initShards() {
    const shardMat = new THREE.MeshStandardMaterial({
      color: "#ffffff",
      roughness: 0.15,
      metalness: 0.1,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
    });

    const count = 8;
    for (let i = 0; i < count; i++) {
      const angle = (i * Math.PI * 2) / count;
      const b = new CANNON.Body({
        mass: LAMP_SPEC.bulbMass / count,
        material: this.material,
        linearDamping: 0.15,
        angularDamping: 0.35,
        allowSleep: true,
      });
      b.addShape(new CANNON.Box(new CANNON.Vec3(0.015, 0.015, 0.008)));
      b.collisionFilterGroup = SANDBOX_COL.SHARD;
      b.collisionFilterMask = SANDBOX_COL.ENV | SANDBOX_COL.CUP | SANDBOX_COL.SHARD;
      b.position.set(0, -50, 0);
      this.world.addBody(b);

      const m = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.01), shardMat);
      m.castShadow = true;
      m.visible = false;
      this.scene.add(m);

      const localPos = new THREE.Vector3(
        Math.cos(angle) * 0.025,
        (i % 2 === 0 ? 0.015 : -0.015),
        Math.sin(angle) * 0.025,
      );

      this.shards.push({ body: b, mesh: m, localPos, active: false });
    }
  }

  pokeShade(impulse: THREE.Vector3, contactWorld?: THREE.Vector3) {
    this.shadeBody.wakeUp();
    this.bulbBody.wakeUp();
    for (const seg of this.cordBodies) seg.wakeUp();

    const pt = contactWorld
      ? new CANNON.Vec3(contactWorld.x, contactWorld.y, contactWorld.z)
      : this.shadeBody.position;

    this.shadeBody.applyImpulse(
      new CANNON.Vec3(impulse.x, impulse.y, impulse.z),
      pt,
    );
  }

  pokeBulb(impulse: THREE.Vector3) {
    this.bulbBody.wakeUp();
    this.shadeBody.wakeUp();

    this.bulbBody.applyImpulse(
      new CANNON.Vec3(impulse.x, impulse.y, impulse.z),
      this.bulbBody.position,
    );

    if (impulse.length() > 0.18) {
      this.burstBulb();
    }
  }

  applyAerodynamicDrag(windAxis: THREE.Vector3, forceMag: number) {
    this.shadeBody.wakeUp();
    for (const seg of this.cordBodies) seg.wakeUp();

    // Apply wind drag at center of pressure (lower shade cone)
    const cp = new CANNON.Vec3(
      this.shadeBody.position.x,
      this.shadeBody.position.y - 0.04,
      this.shadeBody.position.z,
    );
    this.shadeBody.applyForce(
      new CANNON.Vec3(windAxis.x * forceMag, windAxis.y * forceMag, windAxis.z * forceMag),
      cp,
    );
  }

  checkCollision(impactSpeed: number, _normal: THREE.Vector3) {
    if (this.bulbState === "burst") return;
    if (impactSpeed >= LAMP_SPEC.shatterSpeed) {
      this.burstBulb();
    }
  }

  burstBulb() {
    if (this.bulbState === "burst") return;

    this.bulbState = "burst";
    this.isBroken = true;

    // Detach bulb constraint
    if (this.bulbConstraint) {
      this.world.removeConstraint(this.bulbConstraint);
      this.bulbConstraint = null;
    }

    // Hide bulb mesh and turn off main light
    this.bulbMesh.visible = false;
    this.bulbLight.intensity = 0;
    this.flashLight.intensity = 4.8; // Brief bright spark flash

    const bPos = this.bulbBody.position;
    const bVel = this.bulbBody.velocity;
    const bPosV3 = new THREE.Vector3(bPos.x, bPos.y, bPos.z);

    // Hide bulb body
    this.bulbBody.position.set(0, -50, 0);

    // Scatter glass shards
    for (const shard of this.shards) {
      shard.active = true;
      shard.mesh.visible = true;

      const offset = shard.localPos;
      shard.body.position.set(bPos.x + offset.x, bPos.y + offset.y, bPos.z + offset.z);
      shard.body.velocity.set(
        bVel.x + (Math.random() - 0.5) * 1.2 + offset.x * 6,
        Math.max(0.1, bVel.y * 0.4 + Math.random() * 0.8),
        bVel.z + (Math.random() - 0.5) * 1.2 + offset.z * 6,
      );
      shard.body.angularVelocity.set(
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 16,
      );
      shard.body.wakeUp();
    }

    // Emit Filament Sparks
    this.sparkPoints.visible = true;
    this.sparkVelocities = [];
    this.sparkLifetimes = [];
    for (let i = 0; i < this.sparkCount; i++) {
      this.sparkPositions[i * 3] = bPos.x;
      this.sparkPositions[i * 3 + 1] = bPos.y;
      this.sparkPositions[i * 3 + 2] = bPos.z;
      this.sparkVelocities.push(
        new THREE.Vector3(
          bVel.x * 0.5 + (Math.random() - 0.5) * 2.2,
          bVel.y * 0.5 + Math.random() * 1.8 + 0.2,
          bVel.z * 0.5 + (Math.random() - 0.5) * 2.2,
        ),
      );
      this.sparkLifetimes.push(0.35 + Math.random() * 0.35);
    }
    this.sparkGeo.attributes.position.needsUpdate = true;

    this.onBurst?.(bPosV3);
  }

  setPower(state: LampPowerState, surgeFlicker = 1.0) {
    this.powerState = state;
    if (this.bulbState === "burst" || state === "blackout") {
      this.bulbLight.intensity = 0;
      this.bulbMat.emissiveIntensity = 0;
    } else if (state === "surging") {
      this.bulbLight.color.set("#ffffff");
      this.bulbLight.intensity = THREE.MathUtils.lerp(1.2, 4.2, surgeFlicker);
      this.bulbMat.emissive.set("#ffffff");
      this.bulbMat.emissiveIntensity = THREE.MathUtils.lerp(1.2, 5.5, surgeFlicker);
    } else {
      this.bulbLight.color.set("#ffe8c4");
      this.bulbLight.intensity = 0.85;
      this.bulbMat.emissive.set("#ffeac2");
      this.bulbMat.emissiveIntensity = 0.85;
    }
  }

  update(dt: number) {
    // Flash light decay
    if (this.flashLight.intensity > 0) {
      this.flashLight.intensity = Math.max(0, this.flashLight.intensity - dt * 28);
    }

    // Update sparks
    if (this.sparkPoints.visible) {
      let aliveSparks = 0;
      for (let i = 0; i < this.sparkCount; i++) {
        if (this.sparkLifetimes[i] > 0) {
          this.sparkLifetimes[i] -= dt;
          const v = this.sparkVelocities[i];
          v.y -= 9.82 * dt; // gravity
          this.sparkPositions[i * 3] += v.x * dt;
          this.sparkPositions[i * 3 + 1] += v.y * dt;
          this.sparkPositions[i * 3 + 2] += v.z * dt;
          aliveSparks++;
        }
      }
      this.sparkGeo.attributes.position.needsUpdate = true;
      if (aliveSparks === 0) {
        this.sparkPoints.visible = false;
      }
    }

    this.syncMesh();
  }

  syncMesh() {
    // Update Cord Line vertices
    const ap = this.anchorBody.position;
    this.cordPositions[0] = ap.x;
    this.cordPositions[1] = ap.y;
    this.cordPositions[2] = ap.z;

    for (let i = 0; i < this.cordBodies.length; i++) {
      const bp = this.cordBodies[i].position;
      this.cordPositions[(i + 1) * 3] = bp.x;
      this.cordPositions[(i + 1) * 3 + 1] = bp.y;
      this.cordPositions[(i + 1) * 3 + 2] = bp.z;
    }

    // Connect last segment to shade cap
    const capWorld = this.shadeMesh.localToWorld(new THREE.Vector3(0, 0.09, 0));
    const lastIdx = this.cordBodies.length + 1;
    this.cordPositions[lastIdx * 3] = capWorld.x;
    this.cordPositions[lastIdx * 3 + 1] = capWorld.y;
    this.cordPositions[lastIdx * 3 + 2] = capWorld.z;
    this.cordLine.geometry.attributes.position.needsUpdate = true;

    // Shade Mesh
    this.shadeMesh.position.copy(this.shadeBody.position as unknown as THREE.Vector3);
    this.shadeMesh.quaternion.copy(this.shadeBody.quaternion as unknown as THREE.Quaternion);

    // Bulb Mesh
    if (this.bulbState !== "burst") {
      this.bulbMesh.position.copy(this.bulbBody.position as unknown as THREE.Vector3);
      this.bulbMesh.quaternion.copy(this.bulbBody.quaternion as unknown as THREE.Quaternion);
    }

    // Shard Meshes
    for (const shard of this.shards) {
      if (shard.active) {
        shard.mesh.position.copy(shard.body.position as unknown as THREE.Vector3);
        shard.mesh.quaternion.copy(shard.body.quaternion as unknown as THREE.Quaternion);
      }
    }
  }

  reset(anchorPos = new THREE.Vector3(0, 2.15, 0), shadePos = new THREE.Vector3(0, 1.25, 0)) {
    this.group.visible = true;
    this.bulbState = "intact";
    this.powerState = "on";
    this.isBroken = false;

    this.bulbMesh.visible = true;
    this.setPower("on");

    // Anchor
    this.anchorBody.position.set(anchorPos.x, anchorPos.y, anchorPos.z);

    // Cord Segments
    const segCount = this.cordBodies.length;
    for (let i = 0; i < segCount; i++) {
      const t = (i + 1) / (segCount + 1);
      const px = THREE.MathUtils.lerp(anchorPos.x, shadePos.x, t);
      const py = THREE.MathUtils.lerp(anchorPos.y, shadePos.y + 0.12, t);
      const pz = THREE.MathUtils.lerp(anchorPos.z, shadePos.z, t);

      const b = this.cordBodies[i];
      b.position.set(px, py, pz);
      b.velocity.set(0, 0, 0);
      b.angularVelocity.set(0, 0, 0);
      b.quaternion.set(0, 0, 0, 1);
      b.wakeUp();
    }

    // Shade Body
    this.shadeBody.position.set(shadePos.x, shadePos.y, shadePos.z);
    this.shadeBody.velocity.set(0, 0, 0);
    this.shadeBody.angularVelocity.set(0, 0, 0);
    this.shadeBody.quaternion.set(0, 0, 0, 1);
    this.shadeBody.wakeUp();

    // Bulb Body
    this.bulbBody.position.set(shadePos.x, shadePos.y - 0.02, shadePos.z);
    this.bulbBody.velocity.set(0, 0, 0);
    this.bulbBody.angularVelocity.set(0, 0, 0);
    this.bulbBody.quaternion.set(0, 0, 0, 1);
    this.bulbBody.wakeUp();

    // Reattach constraints
    this.attachConstraints();

    // Hide shards
    for (const shard of this.shards) {
      shard.active = false;
      shard.mesh.visible = false;
      shard.body.position.set(0, -50, 0);
      shard.body.velocity.set(0, 0, 0);
      shard.body.angularVelocity.set(0, 0, 0);
    }
    this.sparkPoints.visible = false;

    this.syncMesh();
  }

  stow() {
    this.group.visible = false;
    this.sparkPoints.visible = false;
    this.bulbLight.intensity = 0;
    this.flashLight.intensity = 0;
    for (const shard of this.shards) {
      shard.active = false;
      shard.mesh.visible = false;
      shard.body.position.set(0, -50, 0);
      shard.body.velocity.set(0, 0, 0);
      shard.body.angularVelocity.set(0, 0, 0);
      shard.body.sleep();
    }
    this.anchorBody.position.set(0, -50, 0);
    for (const b of this.cordBodies) {
      b.position.set(0, -50, 0);
      b.velocity.set(0, 0, 0);
      b.angularVelocity.set(0, 0, 0);
      b.sleep();
    }
    this.shadeBody.position.set(0, -50, 0);
    this.shadeBody.velocity.set(0, 0, 0);
    this.shadeBody.angularVelocity.set(0, 0, 0);
    this.shadeBody.sleep();
    this.bulbBody.position.set(0, -50, 0);
    this.bulbBody.velocity.set(0, 0, 0);
    this.bulbBody.angularVelocity.set(0, 0, 0);
    this.bulbBody.sleep();
    this.syncMesh();
  }

  destroy() {
    this.detachConstraints();
    this.world.removeBody(this.anchorBody);
    for (const b of this.cordBodies) this.world.removeBody(b);
    this.world.removeBody(this.shadeBody);
    this.world.removeBody(this.bulbBody);

    for (const s of this.shards) {
      this.world.removeBody(s.body);
      this.scene.remove(s.mesh);
    }
    this.scene.remove(this.sparkPoints);
    this.scene.remove(this.group);
  }
}

import * as CANNON from "cannon-es";
import * as THREE from "three";
import { palette } from "../theme";
import { SANDBOX_COL } from "./sandboxScale";

export interface BagSpec {
  totalMass: number;
  baseMass: number;
  upperMass: number;
  handleMass: number;
  thermosMass: number;
  laptopMass: number;
  notepadMass: number;
  chargerMass: number;
  shirtMass: number;
  keysMass: number;
  popImpactSpeed: number;
}

export const BAG_SPEC: BagSpec = {
  totalMass: 4.80,
  baseMass: 0.50,
  upperMass: 0.32,
  handleMass: 0.08,
  thermosMass: 0.95,
  laptopMass: 1.35,
  notepadMass: 0.65,
  chargerMass: 0.42,
  shirtMass: 0.36,
  keysMass: 0.17,
  popImpactSpeed: 1.2,
};

export type BagMouthState = "zipped" | "ajar" | "open" | "popped";
export type BagPoseState = "supported" | "slouched" | "tipped";
export type BagSpillState = "contained" | "spilling" | "spilled";

export interface PayloadItem {
  id: string;
  name: string;
  body: CANNON.Body;
  mesh: THREE.Object3D;
  localPos: THREE.Vector3;
  isContained: boolean;
}

export class BagAssembly {
  readonly world: CANNON.World;
  readonly scene: THREE.Scene;
  readonly material: CANNON.Material;

  // Primary Shell Bodies
  baseBody: CANNON.Body;
  upperBody: CANNON.Body;
  handleBodies: CANNON.Body[] = [];

  // Payload Items
  payloads: PayloadItem[] = [];

  // Constraints
  private slouchConstraint: CANNON.Constraint | null = null;
  private handleConstraints: CANNON.Constraint[] = [];
  private payloadConstraints: CANNON.Constraint[] = [];

  // Visuals
  readonly group = new THREE.Group();
  private baseMesh: THREE.Mesh;
  private upperMesh: THREE.Mesh;
  private frontPocketMesh: THREE.Mesh;
  private zipperMesh: THREE.Mesh;
  private handleLines: THREE.Line[] = [];
  private handlePositions: Float32Array[] = [];

  // State
  mouthState: BagMouthState = "ajar";
  poseState: BagPoseState = "supported";
  spillState: BagSpillState = "contained";
  isBroken = false;

  // Callbacks
  onSpill?: (itemCount: number) => void;
  onPop?: (impactSpeed: number) => void;

  constructor(
    world: CANNON.World,
    scene: THREE.Scene,
    material: CANNON.Material,
    initPos = new THREE.Vector3(0, 0.88, 0),
    startsZipped = false,
  ) {
    this.world = world;
    this.scene = scene;
    this.material = material;
    this.mouthState = startsZipped ? "zipped" : "ajar";

    // 1. Base Tray Body (Primary support & low center of mass)
    this.baseBody = new CANNON.Body({
      mass: BAG_SPEC.baseMass,
      material,
      linearDamping: 0.15,
      angularDamping: 0.35,
      allowSleep: true,
    });
    this.baseBody.addShape(new CANNON.Box(new CANNON.Vec3(0.18, 0.04, 0.10)));
    this.baseBody.collisionFilterGroup = SANDBOX_COL.CUP;
    this.baseBody.collisionFilterMask = SANDBOX_COL.ENV | SANDBOX_COL.CUP | SANDBOX_COL.SHARD;
    this.baseBody.position.set(initPos.x, initPos.y - 0.10, initPos.z);
    this.world.addBody(this.baseBody);

    // 2. Articulated Upper Slouch Body
    this.upperBody = new CANNON.Body({
      mass: BAG_SPEC.upperMass,
      material,
      linearDamping: 0.20,
      angularDamping: 0.50,
      allowSleep: true,
    });
    this.upperBody.addShape(new CANNON.Box(new CANNON.Vec3(0.17, 0.11, 0.09)));
    this.upperBody.collisionFilterGroup = SANDBOX_COL.CUP;
    this.upperBody.collisionFilterMask = SANDBOX_COL.ENV | SANDBOX_COL.CUP | SANDBOX_COL.SHARD;
    this.upperBody.position.set(initPos.x, initPos.y + 0.06, initPos.z);
    this.world.addBody(this.upperBody);

    // 3. Flexible Handles (4 segment bodies: 2 for front loop, 2 for back loop)
    const handleSegMass = BAG_SPEC.handleMass / 4;
    for (let i = 0; i < 4; i++) {
      const b = new CANNON.Body({
        mass: handleSegMass,
        material,
        linearDamping: 0.25,
        angularDamping: 0.55,
        allowSleep: true,
      });
      b.addShape(new CANNON.Sphere(0.012));
      b.collisionFilterGroup = SANDBOX_COL.CUP;
      b.collisionFilterMask = SANDBOX_COL.ENV | SANDBOX_COL.CUP;
      const side = i < 2 ? -0.06 : 0.06;
      const xOff = (i % 2 === 0 ? -0.08 : 0.08);
      b.position.set(initPos.x + xOff, initPos.y + 0.22, initPos.z + side);
      this.world.addBody(b);
      this.handleBodies.push(b);
    }

    // 4. Physical Payload Bodies
    this.initPayload(initPos);

    // 5. Constraints
    this.attachConstraints();

    // 6. Visual Presentations
    const canvasMat = new THREE.MeshStandardMaterial({
      color: palette.bag,
      roughness: 0.88,
      metalness: 0.02,
    });
    const leatherAccentMat = new THREE.MeshStandardMaterial({
      color: "#5c4033",
      roughness: 0.65,
      metalness: 0.1,
    });

    // Base mesh
    this.baseMesh = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.20), leatherAccentMat);
    this.baseMesh.castShadow = true;
    this.baseMesh.receiveShadow = true;
    this.group.add(this.baseMesh);

    // Upper canvas body mesh
    this.upperMesh = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.22, 0.18), canvasMat);
    this.upperMesh.castShadow = true;
    this.upperMesh.receiveShadow = true;
    this.group.add(this.upperMesh);

    // Front pocket mesh
    this.frontPocketMesh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.13, 0.04), canvasMat);
    this.frontPocketMesh.position.set(0, -0.03, 0.10);
    this.frontPocketMesh.castShadow = true;
    this.upperMesh.add(this.frontPocketMesh);

    // Zipper trim
    this.zipperMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.30, 0.015, 0.02),
      new THREE.MeshStandardMaterial({ color: "#8a7a60", metalness: 0.7, roughness: 0.35 }),
    );
    this.zipperMesh.position.set(0, 0.115, 0);
    this.upperMesh.add(this.zipperMesh);

    // Handle lines (Left and Right loops)
    for (let h = 0; h < 2; h++) {
      const geo = new THREE.BufferGeometry();
      const posArray = new Float32Array(4 * 3);
      geo.setAttribute("position", new THREE.BufferAttribute(posArray, 3));
      const line = new THREE.Line(
        geo,
        new THREE.LineBasicMaterial({ color: "#483226", linewidth: 3 }),
      );
      this.group.add(line);
      this.handleLines.push(line);
      this.handlePositions.push(posArray);
    }

    this.scene.add(this.group);
    this.syncMesh();
  }

  private initPayload(initPos: THREE.Vector3) {
    // 1. Stainless Steel Thermos
    const thermosMat = new THREE.MeshStandardMaterial({
      color: "#d0d4d8",
      metalness: 0.85,
      roughness: 0.25,
    });
    const thermosBody = new CANNON.Body({
      mass: BAG_SPEC.thermosMass,
      material: this.material,
      linearDamping: 0.12,
      angularDamping: 0.30,
      allowSleep: true,
    });
    thermosBody.addShape(new CANNON.Cylinder(0.035, 0.035, 0.20, 14));
    thermosBody.position.set(initPos.x - 0.08, initPos.y + 0.04, initPos.z);
    thermosBody.collisionFilterGroup = SANDBOX_COL.CUP;
    thermosBody.collisionFilterMask = SANDBOX_COL.ENV | SANDBOX_COL.CUP | SANDBOX_COL.SHARD;
    this.world.addBody(thermosBody);

    const thermosMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.20, 16), thermosMat);
    const thermosCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.035, 0.03, 16),
      new THREE.MeshStandardMaterial({ color: "#2c3035", metalness: 0.5, roughness: 0.4 }),
    );
    thermosCap.position.y = 0.105;
    thermosMesh.add(thermosCap);
    thermosMesh.castShadow = true;
    this.scene.add(thermosMesh);
    this.payloads.push({
      id: "thermos",
      name: "Stainless Thermos",
      body: thermosBody,
      mesh: thermosMesh,
      localPos: new THREE.Vector3(-0.08, 0.04, 0),
      isContained: true,
    });

    // 2. Laptop / Document Folio
    const laptopMat = new THREE.MeshStandardMaterial({
      color: "#3a3c42",
      metalness: 0.75,
      roughness: 0.35,
    });
    const laptopBody = new CANNON.Body({
      mass: BAG_SPEC.laptopMass,
      material: this.material,
      linearDamping: 0.18,
      angularDamping: 0.40,
      allowSleep: true,
    });
    laptopBody.addShape(new CANNON.Box(new CANNON.Vec3(0.13, 0.01, 0.09)));
    laptopBody.position.set(initPos.x + 0.02, initPos.y + 0.05, initPos.z - 0.03);
    laptopBody.collisionFilterGroup = SANDBOX_COL.CUP;
    laptopBody.collisionFilterMask = SANDBOX_COL.ENV | SANDBOX_COL.CUP | SANDBOX_COL.SHARD;
    this.world.addBody(laptopBody);

    const laptopMesh = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.02, 0.18), laptopMat);
    laptopMesh.castShadow = true;
    this.scene.add(laptopMesh);
    this.payloads.push({
      id: "laptop",
      name: "Work Laptop",
      body: laptopBody,
      mesh: laptopMesh,
      localPos: new THREE.Vector3(0.02, 0.05, -0.03),
      isContained: true,
    });

    // 3. Bound Notepad
    const notepadMat = new THREE.MeshStandardMaterial({ color: "#eedcb4", roughness: 0.85 });
    const notepadBody = new CANNON.Body({
      mass: BAG_SPEC.notepadMass,
      material: this.material,
      linearDamping: 0.20,
      angularDamping: 0.45,
      allowSleep: true,
    });
    notepadBody.addShape(new CANNON.Box(new CANNON.Vec3(0.09, 0.01, 0.06)));
    notepadBody.position.set(initPos.x + 0.03, initPos.y + 0.02, initPos.z + 0.03);
    notepadBody.collisionFilterGroup = SANDBOX_COL.CUP;
    notepadBody.collisionFilterMask = SANDBOX_COL.ENV | SANDBOX_COL.CUP | SANDBOX_COL.SHARD;
    this.world.addBody(notepadBody);

    const notepadMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.02, 0.12), notepadMat);
    notepadMesh.castShadow = true;
    this.scene.add(notepadMesh);
    this.payloads.push({
      id: "notepad",
      name: "Notepad",
      body: notepadBody,
      mesh: notepadMesh,
      localPos: new THREE.Vector3(0.03, 0.02, 0.03),
      isContained: true,
    });

    // 4. Charger Pouch
    const chargerMat = new THREE.MeshStandardMaterial({ color: "#282a2e", roughness: 0.7 });
    const chargerBody = new CANNON.Body({
      mass: BAG_SPEC.chargerMass,
      material: this.material,
      linearDamping: 0.22,
      angularDamping: 0.45,
      allowSleep: true,
    });
    chargerBody.addShape(new CANNON.Box(new CANNON.Vec3(0.04, 0.025, 0.04)));
    chargerBody.position.set(initPos.x + 0.09, initPos.y - 0.02, initPos.z);
    chargerBody.collisionFilterGroup = SANDBOX_COL.CUP;
    chargerBody.collisionFilterMask = SANDBOX_COL.ENV | SANDBOX_COL.CUP | SANDBOX_COL.SHARD;
    this.world.addBody(chargerBody);

    const chargerMesh = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.08), chargerMat);
    chargerMesh.castShadow = true;
    this.scene.add(chargerMesh);
    this.payloads.push({
      id: "charger",
      name: "Power Adapter",
      body: chargerBody,
      mesh: chargerMesh,
      localPos: new THREE.Vector3(0.09, -0.02, 0),
      isContained: true,
    });

    // 5. Rolled Shirt / Fabric
    const shirtMat = new THREE.MeshStandardMaterial({ color: "#54708c", roughness: 0.95 });
    const shirtBody = new CANNON.Body({
      mass: BAG_SPEC.shirtMass,
      material: this.material,
      linearDamping: 0.28,
      angularDamping: 0.60,
      allowSleep: true,
    });
    shirtBody.addShape(new CANNON.Cylinder(0.04, 0.04, 0.14, 10));
    shirtBody.position.set(initPos.x - 0.02, initPos.y - 0.02, initPos.z + 0.02);
    shirtBody.collisionFilterGroup = SANDBOX_COL.CUP;
    shirtBody.collisionFilterMask = SANDBOX_COL.ENV | SANDBOX_COL.CUP | SANDBOX_COL.SHARD;
    this.world.addBody(shirtBody);

    const shirtMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.14, 12), shirtMat);
    shirtMesh.rotation.z = Math.PI / 2;
    shirtMesh.castShadow = true;
    this.scene.add(shirtMesh);
    this.payloads.push({
      id: "shirt",
      name: "Spare Shirt",
      body: shirtBody,
      mesh: shirtMesh,
      localPos: new THREE.Vector3(-0.02, -0.02, 0.02),
      isContained: true,
    });

    // 6. Keys & Badge
    const keysMat = new THREE.MeshStandardMaterial({ color: "#bfa054", metalness: 0.85, roughness: 0.3 });
    const keysBody = new CANNON.Body({
      mass: BAG_SPEC.keysMass,
      material: this.material,
      linearDamping: 0.25,
      angularDamping: 0.50,
      allowSleep: true,
    });
    keysBody.addShape(new CANNON.Sphere(0.022));
    keysBody.position.set(initPos.x + 0.06, initPos.y + 0.06, initPos.z + 0.04);
    keysBody.collisionFilterGroup = SANDBOX_COL.CUP;
    keysBody.collisionFilterMask = SANDBOX_COL.ENV | SANDBOX_COL.CUP | SANDBOX_COL.SHARD;
    this.world.addBody(keysBody);

    const keysMesh = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 12), keysMat);
    keysMesh.castShadow = true;
    this.scene.add(keysMesh);
    this.payloads.push({
      id: "keys",
      name: "Keys & Badge",
      body: keysBody,
      mesh: keysMesh,
      localPos: new THREE.Vector3(0.06, 0.06, 0.04),
      isContained: true,
    });
  }

  private attachConstraints() {
    this.detachConstraints();

    // 1. Base <-> Upper Slouch Constraint (Compliant joint that allows slouching)
    this.slouchConstraint = new CANNON.PointToPointConstraint(
      this.baseBody,
      new CANNON.Vec3(0, 0.06, 0),
      this.upperBody,
      new CANNON.Vec3(0, -0.10, 0),
    );
    this.world.addConstraint(this.slouchConstraint);

    // 2. Upper Body <-> Handle Constraints
    // Front handle: upperBody -> seg0 -> seg1 -> upperBody
    const h0 = new CANNON.PointToPointConstraint(
      this.upperBody,
      new CANNON.Vec3(-0.08, 0.11, 0.06),
      this.handleBodies[0],
      new CANNON.Vec3(0, 0, 0),
    );
    const h1 = new CANNON.PointToPointConstraint(
      this.handleBodies[0],
      new CANNON.Vec3(0, 0, 0),
      this.handleBodies[1],
      new CANNON.Vec3(0, 0, 0),
    );
    const h2 = new CANNON.PointToPointConstraint(
      this.handleBodies[1],
      new CANNON.Vec3(0, 0, 0),
      this.upperBody,
      new CANNON.Vec3(0.08, 0.11, 0.06),
    );

    // Back handle: upperBody -> seg2 -> seg3 -> upperBody
    const h3 = new CANNON.PointToPointConstraint(
      this.upperBody,
      new CANNON.Vec3(-0.08, 0.11, -0.06),
      this.handleBodies[2],
      new CANNON.Vec3(0, 0, 0),
    );
    const h4 = new CANNON.PointToPointConstraint(
      this.handleBodies[2],
      new CANNON.Vec3(0, 0, 0),
      this.handleBodies[3],
      new CANNON.Vec3(0, 0, 0),
    );
    const h5 = new CANNON.PointToPointConstraint(
      this.handleBodies[3],
      new CANNON.Vec3(0, 0, 0),
      this.upperBody,
      new CANNON.Vec3(0.08, 0.11, -0.06),
    );

    const hConstraints = [h0, h1, h2, h3, h4, h5];
    for (const hc of hConstraints) {
      this.world.addConstraint(hc);
      this.handleConstraints.push(hc);
    }

    // 3. Contained Payload Constraints (Soft spring connection to bag interior while packed)
    if (this.mouthState === "zipped") {
      for (const item of this.payloads) {
        if (item.isContained) {
          const pc = new CANNON.PointToPointConstraint(
            this.baseBody,
            new CANNON.Vec3(item.localPos.x, item.localPos.y + 0.08, item.localPos.z),
            item.body,
            new CANNON.Vec3(0, 0, 0),
          );
          this.world.addConstraint(pc);
          this.payloadConstraints.push(pc);
        }
      }
    }
  }

  private detachConstraints() {
    if (this.slouchConstraint) {
      this.world.removeConstraint(this.slouchConstraint);
      this.slouchConstraint = null;
    }
    for (const c of this.handleConstraints) {
      this.world.removeConstraint(c);
    }
    this.handleConstraints = [];

    for (const c of this.payloadConstraints) {
      this.world.removeConstraint(c);
    }
    this.payloadConstraints = [];
  }

  pokePanel(impulse: THREE.Vector3, contactWorld?: THREE.Vector3) {
    this.upperBody.wakeUp();
    this.baseBody.wakeUp();
    for (const h of this.handleBodies) h.wakeUp();
    for (const p of this.payloads) p.body.wakeUp();

    const pt = contactWorld
      ? new CANNON.Vec3(contactWorld.x, contactWorld.y, contactWorld.z)
      : this.upperBody.position;

    this.upperBody.applyImpulse(
      new CANNON.Vec3(impulse.x, impulse.y, impulse.z),
      pt,
    );
  }

  pokeHandle(handleIdx: number, impulse: THREE.Vector3) {
    const idx = Math.min(this.handleBodies.length - 1, Math.max(0, handleIdx));
    const hb = this.handleBodies[idx];
    hb.wakeUp();
    this.upperBody.wakeUp();
    this.baseBody.wakeUp();
    hb.applyImpulse(
      new CANNON.Vec3(impulse.x, impulse.y, impulse.z),
      hb.position,
    );
  }

  pushBase(impulse: THREE.Vector3, contactWorld?: THREE.Vector3) {
    this.baseBody.wakeUp();
    this.upperBody.wakeUp();
    for (const p of this.payloads) p.body.wakeUp();

    const pt = contactWorld
      ? new CANNON.Vec3(contactWorld.x, contactWorld.y, contactWorld.z)
      : this.baseBody.position;

    this.baseBody.applyImpulse(
      new CANNON.Vec3(impulse.x, impulse.y, impulse.z),
      pt,
    );
  }

  checkCollision(impactSpeed: number, _normal: THREE.Vector3) {
    if (impactSpeed >= BAG_SPEC.popImpactSpeed) {
      if (this.mouthState === "zipped") {
        this.popZipper();
      }
      this.spillContents();
    }
  }

  openZipper() {
    this.mouthState = "open";
    for (const c of this.payloadConstraints) {
      this.world.removeConstraint(c);
    }
    this.payloadConstraints = [];
  }

  popZipper() {
    this.mouthState = "popped";
    this.isBroken = true;
    for (const c of this.payloadConstraints) {
      this.world.removeConstraint(c);
    }
    this.payloadConstraints = [];
    this.onPop?.(BAG_SPEC.popImpactSpeed);
  }

  spillContents() {
    if (this.spillState === "spilled") return;
    this.spillState = "spilling";
    this.openZipper();

    const bVel = this.upperBody.velocity;
    let count = 0;

    for (const item of this.payloads) {
      if (item.isContained) {
        item.isContained = false;
        item.body.wakeUp();
        // Give slight scattering velocity out through mouth aperture
        item.body.velocity.set(
          bVel.x + (Math.random() - 0.5) * 1.4 + item.localPos.x * 3,
          Math.max(0.1, bVel.y + Math.random() * 0.8 + 0.15),
          bVel.z + (Math.random() - 0.5) * 1.4 + item.localPos.z * 3,
        );
        item.body.angularVelocity.set(
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 8,
        );
        count++;
      }
    }

    this.spillState = "spilled";
    this.isBroken = true;
    this.onSpill?.(count);
  }

  getTiltAngleDeg(): number {
    const q = this.baseBody.quaternion;
    const up = new CANNON.Vec3(0, 1, 0);
    const localUp = q.vmult(up);
    const cosAngle = THREE.MathUtils.clamp(localUp.dot(up), -1, 1);
    return THREE.MathUtils.radToDeg(Math.acos(cosAngle));
  }

  update(_dt: number) {
    const tilt = this.getTiltAngleDeg();
    if (tilt > 50 && this.mouthState !== "zipped" && this.spillState === "contained") {
      this.spillContents();
    }
    this.syncMesh();
  }

  syncMesh() {
    // 1. Sync Base Mesh
    this.baseMesh.position.copy(this.baseBody.position as unknown as THREE.Vector3);
    this.baseMesh.quaternion.copy(this.baseBody.quaternion as unknown as THREE.Quaternion);

    // 2. Sync Upper Body Mesh
    this.upperMesh.position.copy(this.upperBody.position as unknown as THREE.Vector3);
    this.upperMesh.quaternion.copy(this.upperBody.quaternion as unknown as THREE.Quaternion);

    // 3. Sync Handle Lines
    // Front handle
    const pFront = this.handlePositions[0];
    const upW = this.upperMesh.localToWorld(new THREE.Vector3(-0.08, 0.11, 0.06));
    pFront[0] = upW.x; pFront[1] = upW.y; pFront[2] = upW.z;
    const h0 = this.handleBodies[0].position;
    pFront[3] = h0.x; pFront[4] = h0.y; pFront[5] = h0.z;
    const h1 = this.handleBodies[1].position;
    pFront[6] = h1.x; pFront[7] = h1.y; pFront[8] = h1.z;
    const upW2 = this.upperMesh.localToWorld(new THREE.Vector3(0.08, 0.11, 0.06));
    pFront[9] = upW2.x; pFront[10] = upW2.y; pFront[11] = upW2.z;
    this.handleLines[0].geometry.attributes.position.needsUpdate = true;

    // Back handle
    const pBack = this.handlePositions[1];
    const upWb = this.upperMesh.localToWorld(new THREE.Vector3(-0.08, 0.11, -0.06));
    pBack[0] = upWb.x; pBack[1] = upWb.y; pBack[2] = upWb.z;
    const h2 = this.handleBodies[2].position;
    pBack[3] = h2.x; pBack[4] = h2.y; pBack[5] = h2.z;
    const h3 = this.handleBodies[3].position;
    pBack[6] = h3.x; pBack[7] = h3.y; pBack[8] = h3.z;
    const upWb2 = this.upperMesh.localToWorld(new THREE.Vector3(0.08, 0.11, -0.06));
    pBack[9] = upWb2.x; pBack[10] = upWb2.y; pBack[11] = upWb2.z;
    this.handleLines[1].geometry.attributes.position.needsUpdate = true;

    // 4. Sync Payload Meshes
    for (const item of this.payloads) {
      item.mesh.position.copy(item.body.position as unknown as THREE.Vector3);
      item.mesh.quaternion.copy(item.body.quaternion as unknown as THREE.Quaternion);
    }
  }

  reset(initPos = new THREE.Vector3(0, 0.88, 0)) {
    this.mouthState = "ajar";
    this.poseState = "supported";
    this.spillState = "contained";
    this.isBroken = false;

    // Base Body
    this.baseBody.position.set(initPos.x, initPos.y - 0.10, initPos.z);
    this.baseBody.velocity.set(0, 0, 0);
    this.baseBody.angularVelocity.set(0, 0, 0);
    this.baseBody.quaternion.set(0, 0, 0, 1);
    this.baseBody.wakeUp();

    // Upper Body
    this.upperBody.position.set(initPos.x, initPos.y + 0.06, initPos.z);
    this.upperBody.velocity.set(0, 0, 0);
    this.upperBody.angularVelocity.set(0, 0, 0);
    this.upperBody.quaternion.set(0, 0, 0, 1);
    this.upperBody.wakeUp();

    // Handle Bodies
    for (let i = 0; i < 4; i++) {
      const side = i < 2 ? -0.06 : 0.06;
      const xOff = (i % 2 === 0 ? -0.08 : 0.08);
      const b = this.handleBodies[i];
      b.position.set(initPos.x + xOff, initPos.y + 0.22, initPos.z + side);
      b.velocity.set(0, 0, 0);
      b.angularVelocity.set(0, 0, 0);
      b.quaternion.set(0, 0, 0, 1);
      b.wakeUp();
    }

    // Payloads
    for (const item of this.payloads) {
      item.isContained = true;
      item.body.position.set(
        initPos.x + item.localPos.x,
        initPos.y + item.localPos.y,
        initPos.z + item.localPos.z,
      );
      item.body.velocity.set(0, 0, 0);
      item.body.angularVelocity.set(0, 0, 0);
      item.body.quaternion.set(0, 0, 0, 1);
      item.body.wakeUp();
    }

    this.attachConstraints();
    this.syncMesh();
  }

  destroy() {
    this.detachConstraints();
    this.world.removeBody(this.baseBody);
    this.world.removeBody(this.upperBody);
    for (const b of this.handleBodies) this.world.removeBody(b);
    for (const p of this.payloads) {
      this.world.removeBody(p.body);
      this.scene.remove(p.mesh);
    }
    for (const l of this.handleLines) this.group.remove(l);
    this.scene.remove(this.group);
  }
}

import * as CANNON from "cannon-es";
import * as THREE from "three";
import { SANDBOX_COL } from "./sandboxScale";
import { palette } from "../theme";

export interface SandboxItem {
  id: string;
  name: string;
  body: CANNON.Body;
  mesh: THREE.Object3D;
  update(dt: number): void;
  reset(): void;
  destroy(): void;
}

export class PhoneProp implements SandboxItem {
  id = "phone";
  name = "Smartphone";
  body: CANNON.Body;
  mesh: THREE.Group;

  constructor(material: CANNON.Material) {
    const w = 0.152;
    const h = 0.078;
    const d = 0.009;

    this.body = new CANNON.Body({
      mass: 0.195,
      material,
      linearDamping: 0.08,
      angularDamping: 0.15,
      allowSleep: true,
    });
    this.body.addShape(new CANNON.Box(new CANNON.Vec3(w / 2, d / 2, h / 2)));
    this.body.position.set(0, 0.81, 0);
    this.body.collisionFilterGroup = SANDBOX_COL.CUP;
    this.body.collisionFilterMask = SANDBOX_COL.ENV | SANDBOX_COL.CUP | SANDBOX_COL.SHARD;

    this.mesh = new THREE.Group();
    const phoneMat = new THREE.MeshStandardMaterial({
      color: palette.phone,
      roughness: 0.25,
      metalness: 0.5,
    });
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(w, d, h), phoneMat);
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    this.mesh.add(chassis);

    const screenMat = new THREE.MeshStandardMaterial({
      color: "#223344",
      emissive: "#204466",
      emissiveIntensity: 0.65,
      roughness: 0.15,
    });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.88, h * 0.82), screenMat);
    screen.rotation.x = -Math.PI / 2;
    screen.position.y = d / 2 + 0.001;
    this.mesh.add(screen);

    this.syncMesh();
  }

  update(_dt: number) {
    this.syncMesh();
  }

  syncMesh() {
    this.mesh.position.copy(this.body.position as unknown as THREE.Vector3);
    this.mesh.quaternion.copy(this.body.quaternion as unknown as THREE.Quaternion);
  }

  reset() {
    this.body.position.set(0, 0.81, 0);
    this.body.velocity.set(0, 0, 0);
    this.body.angularVelocity.set(0, 0, 0);
    this.body.quaternion.set(0, 0, 0, 1);
    this.body.wakeUp();
    this.syncMesh();
  }

  destroy() {}
}

export class FanProp implements SandboxItem {
  id = "fan";
  name = "Desk Fan";
  body: CANNON.Body;
  mesh: THREE.Group;
  private blades: THREE.Group;
  spin = 18;

  constructor(material: CANNON.Material) {
    this.body = new CANNON.Body({
      mass: 1.25,
      material,
      linearDamping: 0.1,
      angularDamping: 0.2,
      allowSleep: true,
    });
    this.body.addShape(new CANNON.Box(new CANNON.Vec3(0.09, 0.14, 0.12)));
    this.body.position.set(0, 0.94, 0);
    this.body.collisionFilterGroup = SANDBOX_COL.CUP;
    this.body.collisionFilterMask = SANDBOX_COL.ENV | SANDBOX_COL.CUP | SANDBOX_COL.SHARD;

    this.mesh = new THREE.Group();
    const fanMat = new THREE.MeshStandardMaterial({
      color: palette.fan,
      metalness: 0.3,
      roughness: 0.4,
    });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.03, 16), fanMat);
    base.position.y = -0.12;
    base.castShadow = true;
    this.mesh.add(base);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.12, 10), fanMat);
    neck.position.y = -0.05;
    this.mesh.add(neck);

    const cage = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.008, 8, 24), fanMat);
    cage.rotation.y = Math.PI / 2;
    cage.position.y = 0.02;
    this.mesh.add(cage);

    this.blades = new THREE.Group();
    this.blades.position.y = 0.02;
    const bladeMat = new THREE.MeshStandardMaterial({ color: "#c8ccd0", metalness: 0.4, roughness: 0.3 });
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI * 2) / 3;
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.055, 0.032), bladeMat);
      b.rotation.x = a;
      b.position.y = Math.cos(a) * 0.045;
      b.position.z = Math.sin(a) * 0.045;
      this.blades.add(b);
    }
    this.mesh.add(this.blades);

    this.syncMesh();
  }

  update(dt: number) {
    this.blades.rotation.x += dt * this.spin;
    this.syncMesh();
  }

  syncMesh() {
    this.mesh.position.copy(this.body.position as unknown as THREE.Vector3);
    this.mesh.quaternion.copy(this.body.quaternion as unknown as THREE.Quaternion);
  }

  reset() {
    this.body.position.set(0, 0.94, 0);
    this.body.velocity.set(0, 0, 0);
    this.body.angularVelocity.set(0, 0, 0);
    this.body.quaternion.set(0, 0, 0, 1);
    this.body.wakeUp();
    this.syncMesh();
  }

  destroy() {}
}

export class PlantProp implements SandboxItem {
  id = "plant";
  name = "Potted Plant";
  body: CANNON.Body;
  mesh: THREE.Group;
  isBroken = false;

  constructor(material: CANNON.Material) {
    this.body = new CANNON.Body({
      mass: 5.2,
      material,
      linearDamping: 0.15,
      angularDamping: 0.35,
      allowSleep: true,
    });
    this.body.addShape(new CANNON.Box(new CANNON.Vec3(0.12, 0.18, 0.12)));
    this.body.position.set(0, 0.98, 0);
    this.body.collisionFilterGroup = SANDBOX_COL.CUP;
    this.body.collisionFilterMask = SANDBOX_COL.ENV | SANDBOX_COL.CUP | SANDBOX_COL.SHARD;

    this.mesh = new THREE.Group();
    const potMat = new THREE.MeshStandardMaterial({ color: palette.pot, roughness: 0.7 });
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.09, 0.22, 16), potMat);
    pot.castShadow = true;
    pot.receiveShadow = true;
    this.mesh.add(pot);

    const soil = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 0.02, 14),
      new THREE.MeshStandardMaterial({ color: "#3a2818", roughness: 0.9 }),
    );
    soil.position.y = 0.09;
    this.mesh.add(soil);

    const leafMat = new THREE.MeshStandardMaterial({ color: palette.plant, roughness: 0.75 });
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI * 2) / 6;
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), leafMat);
      leaf.scale.set(0.08, 0.26, 0.03);
      leaf.position.set(Math.cos(a) * 0.06, 0.2 + (i % 2) * 0.06, Math.sin(a) * 0.06);
      leaf.rotation.z = Math.cos(a) * 0.35;
      leaf.rotation.x = Math.sin(a) * 0.35;
      this.mesh.add(leaf);
    }

    this.syncMesh();
  }

  update(_dt: number) {
    this.syncMesh();
  }

  syncMesh() {
    this.mesh.position.copy(this.body.position as unknown as THREE.Vector3);
    this.mesh.quaternion.copy(this.body.quaternion as unknown as THREE.Quaternion);
  }

  reset() {
    this.isBroken = false;
    this.body.position.set(0, 0.98, 0);
    this.body.velocity.set(0, 0, 0);
    this.body.angularVelocity.set(0, 0, 0);
    this.body.quaternion.set(0, 0, 0, 1);
    this.body.wakeUp();
    this.syncMesh();
  }

  destroy() {}
}

export class PrinterProp implements SandboxItem {
  id = "printer";
  name = "Desktop Printer";
  body: CANNON.Body;
  mesh: THREE.Group;
  feral = false;

  constructor(material: CANNON.Material) {
    const w = 0.46;
    const h = 0.3;
    const d = 0.38;

    this.body = new CANNON.Body({
      mass: 8.5,
      material,
      linearDamping: 0.18,
      angularDamping: 0.4,
      allowSleep: true,
    });
    this.body.addShape(new CANNON.Box(new CANNON.Vec3(w / 2, h / 2, d / 2)));
    this.body.position.set(0, 0.95, 0);
    this.body.collisionFilterGroup = SANDBOX_COL.CUP;
    this.body.collisionFilterMask = SANDBOX_COL.ENV | SANDBOX_COL.CUP | SANDBOX_COL.SHARD;

    this.mesh = new THREE.Group();
    const prMat = new THREE.MeshStandardMaterial({ color: palette.printer, roughness: 0.5 });
    const prDark = new THREE.MeshStandardMaterial({ color: palette.printerDark, roughness: 0.45 });
    const mainBox = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), prMat);
    mainBox.castShadow = true;
    mainBox.receiveShadow = true;
    this.mesh.add(mainBox);

    const tray = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.02, 0.18), prDark);
    tray.position.set(0, -h / 2 + 0.08, d / 2 + 0.08);
    this.mesh.add(tray);

    const led = new THREE.Mesh(
      new THREE.SphereGeometry(0.012, 12, 12),
      new THREE.MeshStandardMaterial({ color: palette.led, emissive: palette.led, emissiveIntensity: 1.5 }),
    );
    led.position.set(-w / 2 + 0.06, h / 2 - 0.04, d / 2 + 0.005);
    this.mesh.add(led);

    this.syncMesh();
  }

  update(_dt: number) {
    this.syncMesh();
  }

  syncMesh() {
    this.mesh.position.copy(this.body.position as unknown as THREE.Vector3);
    this.mesh.quaternion.copy(this.body.quaternion as unknown as THREE.Quaternion);
  }

  reset() {
    this.feral = false;
    this.body.position.set(0, 0.95, 0);
    this.body.velocity.set(0, 0, 0);
    this.body.angularVelocity.set(0, 0, 0);
    this.body.quaternion.set(0, 0, 0, 1);
    this.body.wakeUp();
    this.syncMesh();
  }

  destroy() {}
}

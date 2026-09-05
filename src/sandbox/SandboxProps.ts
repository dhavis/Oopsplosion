import * as CANNON from "cannon-es";
import * as THREE from "three";
import { SANDBOX_COL } from "./sandboxScale";
import { palette } from "../theme";
import { PottedPlantAssembly } from "./PottedPlantAssembly";
import { LampAssembly } from "./LampAssembly";
import { BagAssembly } from "./BagAssembly";

export interface SandboxItem {
  id: string;
  name: string;
  body: CANNON.Body;
  mesh: THREE.Object3D;
  assembly?: PottedPlantAssembly | LampAssembly | BagAssembly;
  isBroken?: boolean;
  update(dt: number): void;
  reset(): void;
  stow(): void;
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
    this.mesh.visible = true;
    this.body.position.set(0, 0.81, 0);
    this.body.velocity.set(0, 0, 0);
    this.body.angularVelocity.set(0, 0, 0);
    this.body.quaternion.set(0, 0, 0, 1);
    this.body.wakeUp();
    this.syncMesh();
  }

  stow() {
    this.mesh.visible = false;
    this.body.position.set(0, -50, 0);
    this.body.velocity.set(0, 0, 0);
    this.body.angularVelocity.set(0, 0, 0);
    this.body.sleep();
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
    this.mesh.visible = true;
    this.body.position.set(0, 0.94, 0);
    this.body.velocity.set(0, 0, 0);
    this.body.angularVelocity.set(0, 0, 0);
    this.body.quaternion.set(0, 0, 0, 1);
    this.body.wakeUp();
    this.syncMesh();
  }

  stow() {
    this.mesh.visible = false;
    this.body.position.set(0, -50, 0);
    this.body.velocity.set(0, 0, 0);
    this.body.angularVelocity.set(0, 0, 0);
    this.body.sleep();
    this.syncMesh();
  }

  destroy() {}
}

export class PlantProp implements SandboxItem {
  id = "plant";
  name = "Potted Plant";
  body: CANNON.Body;
  mesh: THREE.Group;
  readonly assembly: PottedPlantAssembly;

  get isBroken() {
    return this.assembly.potState === "shattered";
  }

  constructor(material: CANNON.Material, world: CANNON.World, scene: THREE.Scene) {
    this.assembly = new PottedPlantAssembly(world, scene, material);
    this.body = this.assembly.potBody;
    this.mesh = this.assembly.group;
  }

  update(dt: number) {
    this.assembly.update(dt);
  }

  reset() {
    this.assembly.reset(new THREE.Vector3(0, 0.91, 0));
  }

  stow() {
    this.assembly.stow();
  }

  destroy() {
    this.assembly.destroy();
  }
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

    const bezel = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.05, 0.008),
      new THREE.MeshStandardMaterial({ color: "#2a2c28", roughness: 0.6 }),
    );
    bezel.position.set(0.06, 0.04, d / 2 + 0.001);
    this.mesh.add(bezel);
    const lcdCanvas = document.createElement("canvas");
    lcdCanvas.width = 256;
    lcdCanvas.height = 64;
    const ctx = lcdCanvas.getContext("2d")!;
    ctx.fillStyle = "#111612";
    ctx.fillRect(0, 0, 256, 64);
    ctx.fillStyle = "#5cd668";
    ctx.font = "bold 20px monospace";
    ctx.fillText("ONLINE - READY", 16, 40);
    const lcdTex = new THREE.CanvasTexture(lcdCanvas);
    const lcd = new THREE.Mesh(
      new THREE.PlaneGeometry(0.16, 0.04),
      new THREE.MeshBasicMaterial({ map: lcdTex }),
    );
    lcd.position.set(0.06, 0.04, d / 2 + 0.006);
    this.mesh.add(lcd);

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
    this.mesh.visible = true;
    this.body.position.set(0, 0.95, 0);
    this.body.velocity.set(0, 0, 0);
    this.body.angularVelocity.set(0, 0, 0);
    this.body.quaternion.set(0, 0, 0, 1);
    this.body.wakeUp();
    this.syncMesh();
  }

  stow() {
    this.mesh.visible = false;
    this.body.position.set(0, -50, 0);
    this.body.velocity.set(0, 0, 0);
    this.body.angularVelocity.set(0, 0, 0);
    this.body.sleep();
    this.syncMesh();
  }

  destroy() {}
}

export class LampProp implements SandboxItem {
  id = "lamp";
  name = "Desk Lamp";
  body: CANNON.Body;
  mesh: THREE.Group;
  readonly assembly: LampAssembly;

  get isBroken() {
    return this.assembly.isBroken;
  }

  constructor(material: CANNON.Material, world: CANNON.World, scene: THREE.Scene) {
    this.assembly = new LampAssembly(
      world,
      scene,
      material,
      new THREE.Vector3(0, 1.85, 0),
      new THREE.Vector3(0, 1.05, 0),
      true,
    );
    this.body = this.assembly.shadeBody;
    this.mesh = this.assembly.group;
  }

  update(dt: number) {
    this.assembly.update(dt);
  }

  reset() {
    this.assembly.reset(new THREE.Vector3(0, 1.85, 0), new THREE.Vector3(0, 1.05, 0));
  }

  stow() {
    this.assembly.stow();
  }

  destroy() {
    this.assembly.destroy();
  }
}

export class ChairProp implements SandboxItem {
  id = "chair";
  name = "Office Chair";
  body: CANNON.Body;
  mesh: THREE.Group;

  constructor(material: CANNON.Material) {
    this.body = new CANNON.Body({
      mass: 14.8,
      material,
      linearDamping: 0.08,
      angularDamping: 0.45,
      allowSleep: true,
    });
    this.body.addShape(new CANNON.Box(new CANNON.Vec3(0.23, 0.035, 0.23)));
    this.body.addShape(new CANNON.Box(new CANNON.Vec3(0.22, 0.24, 0.025)), new CANNON.Vec3(0, 0.27, -0.2));
    this.body.addShape(new CANNON.Box(new CANNON.Vec3(0.035, 0.18, 0.035)), new CANNON.Vec3(0, -0.21, 0));
    this.body.addShape(new CANNON.Box(new CANNON.Vec3(0.22, 0.025, 0.22)), new CANNON.Vec3(0, -0.4, 0));
    this.body.position.set(0, 1.28, 0);
    this.body.collisionFilterGroup = SANDBOX_COL.CUP;
    this.body.collisionFilterMask = SANDBOX_COL.ENV | SANDBOX_COL.CUP | SANDBOX_COL.SHARD;

    this.mesh = new THREE.Group();
    const vinyl = new THREE.MeshStandardMaterial({ color: palette.chair, roughness: 0.55 });
    const metal = new THREE.MeshStandardMaterial({ color: "#3a3a3c", metalness: 0.45, roughness: 0.4 });
    
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.06, 0.46), vinyl);
    seat.castShadow = true;
    seat.receiveShadow = true;
    this.mesh.add(seat);

    const back = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.48, 0.05), vinyl);
    back.position.set(0, 0.28, -0.2);
    back.castShadow = true;
    back.receiveShadow = true;
    this.mesh.add(back);

    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.36, 10), metal);
    stem.position.y = -0.21;
    this.mesh.add(stem);

    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5 + 0.2;
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.025, 0.04), metal);
      arm.position.set(Math.cos(a) * 0.11, -0.4, Math.sin(a) * 0.11);
      arm.rotation.y = -a;
      this.mesh.add(arm);

      const wheel = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 8), metal);
      wheel.position.set(Math.cos(a) * 0.2, -0.45, Math.sin(a) * 0.2);
      this.mesh.add(wheel);
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
    this.mesh.visible = true;
    this.body.position.set(0, 1.28, 0);
    this.body.velocity.set(0, 0, 0);
    this.body.angularVelocity.set(0, 0, 0);
    this.body.quaternion.set(0, 0, 0, 1);
    this.body.wakeUp();
    this.syncMesh();
  }

  stow() {
    this.mesh.visible = false;
    this.body.position.set(0, -50, 0);
    this.body.velocity.set(0, 0, 0);
    this.body.angularVelocity.set(0, 0, 0);
    this.body.sleep();
    this.syncMesh();
  }

  destroy() {}
}

export class BagProp implements SandboxItem {
  id = "bag";
  name = "Messenger Bag";
  body: CANNON.Body;
  mesh: THREE.Group;
  readonly assembly: BagAssembly;

  get isBroken() {
    return this.assembly.isBroken;
  }

  constructor(material: CANNON.Material, world: CANNON.World, scene: THREE.Scene) {
    this.assembly = new BagAssembly(world, scene, material, new THREE.Vector3(0, 0.84, 0), false);
    this.body = this.assembly.baseBody;
    this.mesh = this.assembly.group;
  }

  update(dt: number) {
    this.assembly.update(dt);
  }

  reset() {
    this.assembly.reset(new THREE.Vector3(0, 0.84, 0));
  }

  stow() {
    this.assembly.stow();
  }

  destroy() {
    this.assembly.destroy();
  }
}

import * as CANNON from "cannon-es";
import * as THREE from "three";
import { CupAudio } from "./CupAudio";
import { CupBody } from "./CupBody";
import { CupInteraction } from "./CupInteraction";
import { FractureSystem } from "./FractureSystem";
import { LiquidSimulation } from "./LiquidSimulation";
import { FanProp, PhoneProp, PlantProp, PrinterProp, type SandboxItem } from "./SandboxProps";
import {
  SANDBOX_CAM,
  SANDBOX_COL,
  SANDBOX_MAT,
  SANDBOX_ROOM,
} from "./sandboxScale";
import { palette } from "../theme";
import { pixelRatio } from "../formFactors";

export type SandboxPropId = "cup" | "phone" | "fan" | "plant" | "printer";

export class CupSandboxWorld {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly renderer: THREE.WebGLRenderer;
  readonly physics = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });

  readonly cup: CupBody;
  readonly liquid: LiquidSimulation;
  readonly fracture: FractureSystem;
  readonly interaction: CupInteraction;
  readonly audio = new CupAudio();

  readonly props: Map<SandboxPropId, SandboxItem> = new Map();
  activePropId: SandboxPropId = "cup";

  private counterBody: CANNON.Body;
  private floorBody: CANNON.Body;
  private counterMesh: THREE.Mesh;
  private floorMesh: THREE.Mesh;

  private canvas: HTMLCanvasElement;
  private animId = 0;
  private isRunning = true;
  private lastTime = performance.now();
  private fixedTimeStep = 1 / 120;
  private maxSubSteps = 5;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.scene.background = new THREE.Color("#dcdfd4");

    // Camera
    const aspect = canvas.clientWidth / (canvas.clientHeight || 1);
    this.camera = new THREE.PerspectiveCamera(
      SANDBOX_CAM.fov,
      aspect,
      SANDBOX_CAM.near,
      SANDBOX_CAM.far,
    );
    this.camera.position.set(SANDBOX_CAM.pos.x, SANDBOX_CAM.pos.y, SANDBOX_CAM.pos.z);
    this.camera.lookAt(SANDBOX_CAM.look.x, SANDBOX_CAM.look.y, SANDBOX_CAM.look.z);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(pixelRatio());
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Solver stabilization
    this.physics.defaultContactMaterial.friction = 0.50;
    this.physics.defaultContactMaterial.restitution = 0.05;
    this.physics.defaultContactMaterial.contactEquationStiffness = 1e7;
    this.physics.defaultContactMaterial.contactEquationRelaxation = 4;
    this.physics.allowSleep = true;

    // Materials
    const matCeramic = new CANNON.Material("ceramic");
    const matCounter = new CANNON.Material("counterWood");
    const matFloor = new CANNON.Material("floorConcrete");
    const matShard = new CANNON.Material("shard");

    this.physics.addContactMaterial(
      new CANNON.ContactMaterial(matCeramic, matCounter, {
        friction: SANDBOX_MAT.counterWood.friction,
        restitution: SANDBOX_MAT.counterWood.restitution,
      }),
    );
    this.physics.addContactMaterial(
      new CANNON.ContactMaterial(matCeramic, matFloor, {
        friction: SANDBOX_MAT.floorConcrete.friction,
        restitution: SANDBOX_MAT.floorConcrete.restitution,
      }),
    );
    this.physics.addContactMaterial(
      new CANNON.ContactMaterial(matShard, matCounter, {
        friction: SANDBOX_MAT.shard.friction,
        restitution: SANDBOX_MAT.shard.restitution,
      }),
    );
    this.physics.addContactMaterial(
      new CANNON.ContactMaterial(matShard, matFloor, {
        friction: SANDBOX_MAT.shard.friction,
        restitution: SANDBOX_MAT.shard.restitution,
      }),
    );

    // Lighting
    this.setupLighting();

    // Floating Counter
    const cnt = SANDBOX_ROOM.counter;
    const cntPos = SANDBOX_ROOM.counterPos;
    this.counterBody = new CANNON.Body({
      mass: 0,
      type: CANNON.BODY_TYPES.STATIC,
      material: matCounter,
      shape: new CANNON.Box(new CANNON.Vec3(cnt.w / 2, cnt.h / 2, cnt.d / 2)),
      position: new CANNON.Vec3(cntPos.x, cntPos.y, cntPos.z),
    });
    this.counterBody.collisionFilterGroup = SANDBOX_COL.ENV;
    this.counterBody.collisionFilterMask = SANDBOX_COL.CUP | SANDBOX_COL.SHARD;
    this.physics.addBody(this.counterBody);

    this.counterMesh = new THREE.Mesh(
      new THREE.BoxGeometry(cnt.w, cnt.h, cnt.d),
      new THREE.MeshStandardMaterial({
        color: palette.desk,
        roughness: 0.48,
        metalness: 0.04,
      }),
    );
    this.counterMesh.position.set(cntPos.x, cntPos.y, cntPos.z);
    this.counterMesh.receiveShadow = true;
    this.counterMesh.castShadow = true;
    this.scene.add(this.counterMesh);

    // Beveled top rim for floating counter
    const counterRim = new THREE.Mesh(
      new THREE.BoxGeometry(cnt.w + 0.02, 0.015, cnt.d + 0.02),
      new THREE.MeshStandardMaterial({ color: palette.deskEdge, roughness: 0.4 }),
    );
    counterRim.position.set(cntPos.x, cntPos.y + cnt.h / 2 - 0.005, cntPos.z);
    this.scene.add(counterRim);

    // Floor
    const flr = SANDBOX_ROOM.floor;
    const flrPos = SANDBOX_ROOM.floorPos;
    this.floorBody = new CANNON.Body({
      mass: 0,
      type: CANNON.BODY_TYPES.STATIC,
      material: matFloor,
      shape: new CANNON.Box(new CANNON.Vec3(flr.w / 2, flr.h / 2, flr.d / 2)),
      position: new CANNON.Vec3(flrPos.x, flrPos.y, flrPos.z),
    });
    this.floorBody.collisionFilterGroup = SANDBOX_COL.ENV;
    this.floorBody.collisionFilterMask = SANDBOX_COL.CUP | SANDBOX_COL.SHARD;
    this.physics.addBody(this.floorBody);

    this.floorMesh = new THREE.Mesh(
      new THREE.BoxGeometry(flr.w, flr.h, flr.d),
      new THREE.MeshStandardMaterial({
        color: "#c0c4ba",
        roughness: 0.78,
        metalness: 0.02,
      }),
    );
    this.floorMesh.position.set(flrPos.x, flrPos.y, flrPos.z);
    this.floorMesh.receiveShadow = true;
    this.scene.add(this.floorMesh);

    // Subtle grid on floor
    const grid = new THREE.GridHelper(4, 16, "#9aa092", "#b0b6a8");
    grid.position.y = 0.001;
    this.scene.add(grid);

    // Subsystems
    this.cup = new CupBody(matCeramic);
    this.physics.addBody(this.cup.body);
    this.scene.add(this.cup.mesh);

    // Additional Props
    const phone = new PhoneProp(matCounter);
    const fan = new FanProp(matCounter);
    const plant = new PlantProp(matCeramic);
    const printer = new PrinterProp(matCounter);

    this.props.set("phone", phone);
    this.props.set("fan", fan);
    this.props.set("plant", plant);
    this.props.set("printer", printer);

    for (const prop of this.props.values()) {
      this.physics.addBody(prop.body);
      this.scene.add(prop.mesh);
      prop.mesh.visible = false;
      prop.body.position.set(0, -50, 0);
    }

    this.liquid = new LiquidSimulation(this.scene);
    this.fracture = new FractureSystem(this.physics, this.scene, matShard);
    this.interaction = new CupInteraction(this.camera, canvas, this.scene);

    // Audio wiring
    this.liquid.onPour = (rate) => this.audio.playPour(rate);
    this.fracture.onShatter = (_pos, speed) => this.audio.playShatter(speed);
    this.fracture.onClatter = (_pos, speed) => this.audio.playClatter(speed);
    this.interaction.onHitAction = (action, _force) => {
      if (action === "poke") this.audio.playClatter(0.8);
      else if (action === "flick") this.audio.playClatter(1.4);
    };

    // Contacts
    this.setupContacts();

    // Event binding
    this.bindEvents();

    // Expose sandbox inspection API for tests and debugging
    (window as unknown as { __sandbox: object }).__sandbox = {
      reset: () => this.reset(),
      selectItem: (id: SandboxPropId) => this.selectItem(id),
      activeItem: () => this.activePropId,
      cup: () => ({
        pos: { ...this.cup.mesh.position },
        vel: { ...this.cup.body.velocity },
        liquidMl: this.cup.liquidMl,
        isBroken: this.cup.isBroken,
        tiltDeg: this.cup.getTiltAngleDeg(),
      }),
      itemState: (id: SandboxPropId) => {
        if (id === "cup") {
          return {
            pos: { ...this.cup.mesh.position },
            vel: { ...this.cup.body.velocity },
            isBroken: this.cup.isBroken,
          };
        }
        const p = this.props.get(id);
        return p
          ? { pos: { ...p.mesh.position }, vel: { ...p.body.velocity } }
          : null;
      },
      liftAndDrop: (y = 1.35, throwVy = -1.2) => {
        const body = this.getActiveBody();
        body.position.set(0, y, 0);
        body.velocity.set(0, throwVy, 0);
        body.wakeUp();
      },
      pushVector: (vx: number, vy: number, vz: number, offY = 0.04) => {
        const body = this.getActiveBody();
        body.wakeUp();
        const clampedVx = THREE.MathUtils.clamp(vx, -2.0, 2.0);
        const clampedVy = THREE.MathUtils.clamp(vy, -1.0, 1.0);
        const clampedVz = THREE.MathUtils.clamp(vz, -2.0, 2.0);
        body.applyImpulse(
          new CANNON.Vec3(clampedVx * body.mass, clampedVy * body.mass, clampedVz * body.mass),
          new CANNON.Vec3(body.position.x, body.position.y + offY, body.position.z),
        );
      },
      shatterFloor: () => {
        this.cup.body.position.set(0.65, 0.9, 0);
        this.cup.body.velocity.set(0.4, -3.4, 0);
        this.cup.body.wakeUp();
      },
    };

    this.layout();
    this.loop = this.loop.bind(this);
    this.animId = requestAnimationFrame(this.loop);
  }

  selectItem(id: SandboxPropId) {
    this.activePropId = id;
    this.fracture.reset();
    this.liquid.reset();
    this.interaction.cancel();

    // Hide all items
    this.cup.mesh.visible = false;
    this.cup.body.position.set(0, -50, 0);
    this.cup.body.wakeUp();

    for (const prop of this.props.values()) {
      prop.mesh.visible = false;
      prop.body.position.set(0, -50, 0);
      prop.body.wakeUp();
    }

    if (id === "cup") {
      this.cup.reset();
    } else {
      const p = this.props.get(id);
      if (p) {
        p.mesh.visible = true;
        p.reset();
      }
    }
  }

  private getActiveBody(): CANNON.Body {
    if (this.activePropId === "cup") return this.cup.body;
    return this.props.get(this.activePropId)?.body ?? this.cup.body;
  }

  private setupLighting() {
    const key = new THREE.DirectionalLight("#ffffff", 1.4);
    key.position.set(2.0, 3.5, 2.8);
    key.castShadow = true;
    key.shadow.mapSize.width = 1024;
    key.shadow.mapSize.height = 1024;
    key.shadow.bias = -0.001;
    this.scene.add(key);

    const fill = new THREE.DirectionalLight("#cde0ea", 0.65);
    fill.position.set(-2.2, 2.0, -1.0);
    this.scene.add(fill);

    const ambient = new THREE.AmbientLight("#e0e4d6", 0.85);
    this.scene.add(ambient);
  }

  private setupContacts() {
    this.physics.addEventListener("beginContact", (ev: { bodyA: CANNON.Body; bodyB: CANNON.Body }) => {
      const { bodyA, bodyB } = ev;
      const isCupA = bodyA === this.cup.body;
      const isCupB = bodyB === this.cup.body;
      if (!isCupA && !isCupB) return;

      const other = isCupA ? bodyB : bodyA;
      const targetLabel = other === this.floorBody ? "floor" : other === this.counterBody ? "counter" : null;
      if (!targetLabel) return;

      // Calculate effective impact normal velocity
      const normalVel = Math.abs(this.cup.body.velocity.y);
      const totalSpeed = this.cup.body.velocity.length();
      const impactSpeed = Math.max(normalVel, totalSpeed * 0.8);
      const normal = new THREE.Vector3(0, 1, 0);

      this.fracture.checkCollision(this.cup, targetLabel, impactSpeed, normal, this.liquid);
    });
  }

  private bindEvents() {
    const c = this.canvas;
    c.addEventListener("pointerdown", (e) => {
      this.audio.resume();
      if (this.activePropId === "cup") {
        this.interaction.onPointerDown(e.clientX, e.clientY, e.pointerId, this.cup);
      }
      c.setPointerCapture(e.pointerId);
    });

    c.addEventListener("pointermove", (e) => {
      if (this.activePropId === "cup") {
        this.interaction.onPointerMove(e.clientX, e.clientY, e.pointerId);
      }
    });

    const onRelease = (e: PointerEvent) => {
      if (this.activePropId === "cup") {
        this.interaction.onPointerUp(e.clientX, e.clientY, e.pointerId, this.cup);
      }
    };

    c.addEventListener("pointerup", onRelease);
    c.addEventListener("pointercancel", onRelease);

    window.addEventListener("resize", () => this.layout());
    window.addEventListener("orientationchange", () => this.layout());
  }

  layout() {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  reset() {
    if (this.activePropId === "cup") {
      this.fracture.reset();
      this.liquid.reset();
      this.cup.reset();
      this.interaction.cancel();
    } else {
      this.props.get(this.activePropId)?.reset();
    }
  }

  private loop(now: number) {
    if (!this.isRunning) return;

    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;

    // Apply interaction spring forces before physics step
    if (this.activePropId === "cup") {
      this.interaction.updatePhysics(dt, this.cup);
    }

    // Fixed timestep physics stepping
    this.physics.step(this.fixedTimeStep, dt, this.maxSubSteps);

    // Update cup body state, steam, and sync Three.js mesh
    if (this.activePropId === "cup") {
      this.cup.updatePhysics(dt);
      this.cup.syncMesh();
      this.liquid.update(dt, this.cup);
      this.fracture.syncVisuals();
    } else {
      this.props.get(this.activePropId)?.update(dt);
    }

    // Render Three.js scene
    this.renderer.render(this.scene, this.camera);

    this.animId = requestAnimationFrame(this.loop);
  }

  destroy() {
    this.isRunning = false;
    cancelAnimationFrame(this.animId);
    this.renderer.dispose();
    this.scene.clear();
  }
}

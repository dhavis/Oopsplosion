import * as CANNON from "cannon-es";
import * as THREE from "three";
import { CupAudio } from "./CupAudio";
import { CupBody } from "./CupBody";
import { CupInteraction } from "./CupInteraction";
import { FractureSystem } from "./FractureSystem";
import { LiquidSimulation } from "./LiquidSimulation";
import {
  BagProp,
  ChairProp,
  FanProp,
  LampProp,
  PhoneProp,
  PlantProp,
  PrinterProp,
  type SandboxItem,
} from "./SandboxProps";
import {
  SANDBOX_CAM,
  SANDBOX_COL,
  SANDBOX_MAT,
  SANDBOX_ROOM,
} from "./sandboxScale";
import { palette } from "../theme";
import { pixelRatio } from "../formFactors";

export type SandboxPropId = "cup" | "phone" | "fan" | "plant" | "printer" | "lamp" | "chair" | "bag";

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
    const plant = new PlantProp(matCeramic, this.physics, this.scene);
    const printer = new PrinterProp(matCounter);
    const lamp = new LampProp(matCounter, this.physics, this.scene);
    const chair = new ChairProp(matCounter);
    const bag = new BagProp(matCounter, this.physics, this.scene);

    this.props.set("phone", phone);
    this.props.set("fan", fan);
    this.props.set("plant", plant);
    this.props.set("printer", printer);
    this.props.set("lamp", lamp);
    this.props.set("chair", chair);
    this.props.set("bag", bag);

    for (const prop of this.props.values()) {
      if (prop.id !== "plant" && prop.id !== "lamp" && prop.id !== "bag") {
        this.physics.addBody(prop.body);
        this.scene.add(prop.mesh);
      }
      prop.stow();
    }
    this.cup.reset();

    this.liquid = new LiquidSimulation(this.scene);
    this.fracture = new FractureSystem(this.physics, this.scene, matShard);
    this.interaction = new CupInteraction(this.camera, canvas, this.scene);

    // Audio wiring
    this.liquid.onPour = (rate) => this.audio.playPour(rate);
    this.fracture.onShatter = (_pos, speed) => this.audio.playShatter(speed);
    this.fracture.onClatter = (_pos, speed) => this.audio.playClatter(speed);
    plant.assembly.onShatter = (_pos, speed) => this.audio.playShatter(speed);
    plant.assembly.onSpill = () => this.audio.playClatter(0.6);
    lamp.assembly.onBurst = () => this.audio.playShatter(2.2);
    bag.assembly.onSpill = () => this.audio.playClatter(1.5);
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
        if (id === "plant") {
          const plantItem = this.props.get("plant") as PlantProp | undefined;
          return {
            pos: plantItem?.assembly.potState === "shattered"
              ? { x: 0, y: 0.05, z: 0 }
              : { ...plantItem?.assembly.potBody.position },
            vel: { ...plantItem?.assembly.potBody.velocity },
            potState: plantItem?.assembly.potState,
            soilState: plantItem?.assembly.soilState,
            foliageState: plantItem?.assembly.foliageState,
            soilRemainingMl: plantItem?.assembly.soilRemainingMl,
            isBroken: plantItem?.assembly.potState === "shattered",
          };
        }
        if (id === "lamp") {
          const lampItem = this.props.get("lamp") as LampProp | undefined;
          return {
            pos: { ...lampItem?.assembly.shadeBody.position },
            vel: { ...lampItem?.assembly.shadeBody.velocity },
            bulbState: lampItem?.assembly.bulbState,
            powerState: lampItem?.assembly.powerState,
            isBroken: lampItem?.assembly.bulbState === "burst",
          };
        }
        if (id === "bag") {
          const bagItem = this.props.get("bag") as BagProp | undefined;
          return {
            pos: { ...bagItem?.assembly.baseBody.position },
            vel: { ...bagItem?.assembly.baseBody.velocity },
            mouthState: bagItem?.assembly.mouthState,
            spillState: bagItem?.assembly.spillState,
            containedCount: bagItem?.assembly.payloads.filter((p) => p.isContained).length ?? 0,
            isBroken: bagItem?.assembly.isBroken ?? false,
          };
        }
        const p = this.props.get(id);
        return p
          ? { pos: { ...p.mesh.position }, vel: { ...p.body.velocity } }
          : null;
      },
      liftAndDrop: (y = 1.35, throwVy = -1.2) => {
        if (this.activePropId === "plant") {
          const plantItem = this.props.get("plant") as PlantProp | undefined;
          if (plantItem?.assembly) {
            plantItem.assembly.potBody.position.set(0, y, 0);
            plantItem.assembly.potBody.velocity.set(0, throwVy, 0);
            plantItem.assembly.potBody.wakeUp();
            plantItem.assembly.rootBallBody.position.set(0, y + 0.02, 0);
            plantItem.assembly.rootBallBody.velocity.set(0, throwVy, 0);
            plantItem.assembly.rootBallBody.wakeUp();
            plantItem.assembly.stemBody.position.set(0, y + 0.28, 0);
            plantItem.assembly.stemBody.velocity.set(0, throwVy, 0);
            plantItem.assembly.stemBody.wakeUp();
            return;
          }
        }
        if (this.activePropId === "lamp") {
          const lampItem = this.props.get("lamp") as LampProp | undefined;
          if (lampItem?.assembly) {
            lampItem.assembly.shadeBody.position.set(0, y, 0);
            lampItem.assembly.shadeBody.velocity.set(0, throwVy, 0);
            lampItem.assembly.shadeBody.wakeUp();
            lampItem.assembly.bulbBody.position.set(0, y - 0.02, 0);
            lampItem.assembly.bulbBody.velocity.set(0, throwVy, 0);
            lampItem.assembly.bulbBody.wakeUp();
            return;
          }
        }
        if (this.activePropId === "bag") {
          const bagItem = this.props.get("bag") as BagProp | undefined;
          if (bagItem?.assembly) {
            bagItem.assembly.baseBody.position.set(0, y - 0.10, 0);
            bagItem.assembly.baseBody.velocity.set(0, throwVy, 0);
            bagItem.assembly.baseBody.wakeUp();
            bagItem.assembly.upperBody.position.set(0, y + 0.06, 0);
            bagItem.assembly.upperBody.velocity.set(0, throwVy, 0);
            bagItem.assembly.upperBody.wakeUp();
            for (const item of bagItem.assembly.payloads) {
              if (item.isContained) {
                item.body.position.set(item.localPos.x, y + item.localPos.y, item.localPos.z);
                item.body.velocity.set(0, throwVy, 0);
                item.body.wakeUp();
              }
            }
            return;
          }
        }
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
        if (this.activePropId === "plant") {
          const plantItem = this.props.get("plant") as PlantProp | undefined;
          if (plantItem?.assembly) {
            plantItem.assembly.potBody.position.set(0.65, 0.9, 0);
            plantItem.assembly.potBody.velocity.set(0.4, -3.4, 0);
            plantItem.assembly.potBody.wakeUp();
            plantItem.assembly.rootBallBody.position.set(0.65, 0.92, 0);
            plantItem.assembly.rootBallBody.velocity.set(0.4, -3.4, 0);
            plantItem.assembly.rootBallBody.wakeUp();
            plantItem.assembly.stemBody.position.set(0.65, 1.18, 0);
            plantItem.assembly.stemBody.velocity.set(0.4, -3.4, 0);
            plantItem.assembly.stemBody.wakeUp();
          }
        } else if (this.activePropId === "lamp") {
          const lampItem = this.props.get("lamp") as LampProp | undefined;
          if (lampItem?.assembly) {
            lampItem.assembly.shadeBody.position.set(0.65, 0.98, 0);
            lampItem.assembly.shadeBody.velocity.set(0.4, -3.4, 0);
            lampItem.assembly.shadeBody.wakeUp();
            lampItem.assembly.bulbBody.position.set(0.65, 0.90, 0);
            lampItem.assembly.bulbBody.velocity.set(0.4, -3.4, 0);
            lampItem.assembly.bulbBody.wakeUp();
            for (let i = 0; i < lampItem.assembly.cordBodies.length; i++) {
              const cb = lampItem.assembly.cordBodies[i];
              cb.position.set(0.65, 1.05 + i * 0.1, 0);
              cb.velocity.set(0.4, -3.4, 0);
              cb.wakeUp();
            }
          }
        } else if (this.activePropId === "bag") {
          const bagItem = this.props.get("bag") as BagProp | undefined;
          if (bagItem?.assembly) {
            bagItem.assembly.baseBody.position.set(0.65, 0.9, 0);
            bagItem.assembly.baseBody.velocity.set(0.4, -3.4, 0);
            bagItem.assembly.baseBody.wakeUp();
            bagItem.assembly.upperBody.position.set(0.65, 1.06, 0);
            bagItem.assembly.upperBody.velocity.set(0.4, -3.4, 0);
            bagItem.assembly.upperBody.wakeUp();
            for (const item of bagItem.assembly.payloads) {
              item.body.position.set(0.65 + item.localPos.x, 0.95 + item.localPos.y, item.localPos.z);
              item.body.velocity.set(0.4, -3.4, 0);
              item.body.wakeUp();
            }
          }
        } else {
          this.cup.body.position.set(0.65, 0.9, 0);
          this.cup.body.velocity.set(0.4, -3.4, 0);
          this.cup.body.wakeUp();
        }
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

    // Stow cup if not active
    if (id !== "cup") {
      this.cup.mesh.visible = false;
      this.cup.body.position.set(0, -50, 0);
      this.cup.body.velocity.set(0, 0, 0);
      this.cup.body.angularVelocity.set(0, 0, 0);
      this.cup.body.sleep();
    }

    // Stow inactive props
    for (const [propId, prop] of this.props.entries()) {
      if (propId !== id) {
        prop.stow();
      }
    }

    // Activate selected prop
    if (id === "cup") {
      this.cup.reset();
    } else {
      const p = this.props.get(id);
      if (p) {
        p.reset();
      }
    }
  }

  private getActiveTarget() {
    if (this.activePropId === "cup") return this.cup;
    return this.props.get(this.activePropId) ?? this.cup;
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
      if (isCupA || isCupB) {
        const other = isCupA ? bodyB : bodyA;
        const targetLabel = other === this.floorBody ? "floor" : other === this.counterBody ? "counter" : null;
        if (targetLabel) {
          // Calculate effective impact normal velocity
          const normalVel = Math.abs(this.cup.body.velocity.y);
          const totalSpeed = this.cup.body.velocity.length();
          const impactSpeed = Math.max(normalVel, totalSpeed * 0.8);
          const normal = new THREE.Vector3(0, 1, 0);

          this.fracture.checkCollision(this.cup, targetLabel, impactSpeed, normal, this.liquid);
        }
      }

      // Plant Pot contact check
      const plantItem = this.props.get("plant") as PlantProp | undefined;
      if (plantItem?.assembly && plantItem.assembly.potState !== "shattered") {
        const isPlantA = bodyA === plantItem.assembly.potBody;
        const isPlantB = bodyB === plantItem.assembly.potBody;
        if (isPlantA || isPlantB) {
          const other = isPlantA ? bodyB : bodyA;
          const targetLabel = other === this.floorBody ? "floor" : other === this.counterBody ? "counter" : null;
          if (targetLabel && !plantItem.assembly.isInternalBody(other)) {
            const normalVel = Math.abs(plantItem.assembly.potBody.velocity.y);
            const totalSpeed = plantItem.assembly.potBody.velocity.length();
            const impactSpeed = Math.max(normalVel, totalSpeed * 0.8);
            const normal = new THREE.Vector3(0, 1, 0);
            plantItem.assembly.checkCollision(impactSpeed, normal);
          }
        }
      }

      // Lamp Bulb & Shade contact check
      const lampItem = this.props.get("lamp") as LampProp | undefined;
      if (lampItem?.assembly) {
        const isBulbA = bodyA === lampItem.assembly.bulbBody;
        const isBulbB = bodyB === lampItem.assembly.bulbBody;
        const isShadeA = bodyA === lampItem.assembly.shadeBody;
        const isShadeB = bodyB === lampItem.assembly.shadeBody;
        if (isBulbA || isBulbB || isShadeA || isShadeB) {
          const other = (isBulbA || isShadeA) ? bodyB : bodyA;
          const targetLabel = other === this.floorBody ? "floor" : other === this.counterBody ? "counter" : null;
          if (targetLabel) {
            const hitBody = (isBulbA || isBulbB) ? lampItem.assembly.bulbBody : lampItem.assembly.shadeBody;
            const normalVel = Math.abs(hitBody.velocity.y);
            const totalSpeed = hitBody.velocity.length();
            const impactSpeed = Math.max(normalVel, totalSpeed * 0.8);
            const normal = new THREE.Vector3(0, 1, 0);
            lampItem.assembly.checkCollision(impactSpeed, normal);
          }
        }
      }

      // Bag contact check
      const bagItem = this.props.get("bag") as BagProp | undefined;
      if (bagItem?.assembly) {
        const isBagA = bodyA === bagItem.assembly.baseBody || bodyA === bagItem.assembly.upperBody;
        const isBagB = bodyB === bagItem.assembly.baseBody || bodyB === bagItem.assembly.upperBody;
        if (isBagA || isBagB) {
          const other = isBagA ? bodyB : bodyA;
          const targetLabel = other === this.floorBody ? "floor" : other === this.counterBody ? "counter" : null;
          if (targetLabel) {
            const hitBody = isBagA ? bodyA : bodyB;
            const normalVel = Math.abs(hitBody.velocity.y);
            const totalSpeed = hitBody.velocity.length();
            const impactSpeed = Math.max(normalVel, totalSpeed * 0.8);
            const normal = new THREE.Vector3(0, 1, 0);
            bagItem.assembly.checkCollision(impactSpeed, normal);
          }
        }
      }
    });
  }

  private bindEvents() {
    const c = this.canvas;
    c.addEventListener("pointerdown", (e) => {
      this.audio.resume();
      this.interaction.onPointerDown(e.clientX, e.clientY, e.pointerId, this.getActiveTarget());
      c.setPointerCapture(e.pointerId);
    });

    c.addEventListener("pointermove", (e) => {
      this.interaction.onPointerMove(e.clientX, e.clientY, e.pointerId);
    });

    const onRelease = (e: PointerEvent) => {
      this.interaction.onPointerUp(e.clientX, e.clientY, e.pointerId, this.getActiveTarget());
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
    this.interaction.cancel();
    if (this.activePropId === "cup") {
      this.fracture.reset();
      this.liquid.reset();
      this.cup.reset();
    } else {
      this.props.get(this.activePropId)?.reset();
    }
  }

  private loop(now: number) {
    if (!this.isRunning) return;

    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;

    // Apply interaction spring forces before physics step
    const target = this.getActiveTarget();
    this.interaction.updatePhysics(dt, target);

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

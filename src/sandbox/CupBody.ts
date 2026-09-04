import * as CANNON from "cannon-es";
import * as THREE from "three";
import { CUP_SPEC, SANDBOX_COL } from "./sandboxScale";
import { palette } from "../theme";

export class CupBody {
  readonly body: CANNON.Body;
  readonly mesh: THREE.Group;
  
  private coffeeMesh: THREE.Mesh;
  private steamPoints: THREE.Points;
  private steamGeo: THREE.BufferGeometry;
  private steamLife: number[] = [];

  liquidMl: number = CUP_SPEC.initialLiquidMl;
  isBroken: boolean = false;
  lastMassUpdate = 0;
  
  // Track linear acceleration for slosh
  prevVelocity = new CANNON.Vec3();
  acceleration = new THREE.Vector3();

  constructor(
    material: CANNON.Material,
    initPos = new THREE.Vector3(CUP_SPEC.initialPos.x, CUP_SPEC.initialPos.y, CUP_SPEC.initialPos.z),
  ) {
    const rTop = CUP_SPEC.outerRadius;
    const rBot = CUP_SPEC.outerRadius * 0.90;
    const h = CUP_SPEC.height;

    // Compound Cannon Body with physical ceramic damping & sleep limits
    this.body = new CANNON.Body({
      mass: CUP_SPEC.ceramicMass + CUP_SPEC.coffeeMaxKg,
      material,
      linearDamping: CUP_SPEC.linearDamping,
      angularDamping: CUP_SPEC.angularDamping,
      allowSleep: true,
    });
    this.body.sleepSpeedLimit = CUP_SPEC.sleepSpeedLimit;
    this.body.sleepTimeLimit = CUP_SPEC.sleepTimeLimit;

    // Main 16-segment tapered cylinder for smoother roll contact
    const mainCyl = new CANNON.Cylinder(rTop, rBot, h, 16);
    this.body.addShape(mainCyl, new CANNON.Vec3(0, 0, 0));

    // Handle approximation
    const handleUpper = new CANNON.Box(new CANNON.Vec3(0.010, 0.006, 0.006));
    const handleLower = new CANNON.Box(new CANNON.Vec3(0.010, 0.006, 0.006));
    const handleSide = new CANNON.Box(new CANNON.Vec3(0.006, 0.022, 0.006));
    this.body.addShape(handleUpper, new CANNON.Vec3(rTop + 0.009, h * 0.22, 0));
    this.body.addShape(handleLower, new CANNON.Vec3(rTop + 0.009, -h * 0.22, 0));
    this.body.addShape(handleSide, new CANNON.Vec3(rTop + 0.018, 0, 0));

    this.body.collisionFilterGroup = SANDBOX_COL.CUP;
    this.body.collisionFilterMask = SANDBOX_COL.ENV | SANDBOX_COL.CUP | SANDBOX_COL.SHARD;
    this.body.position.set(initPos.x, initPos.y, initPos.z);

    // Three.js visual group
    this.mesh = new THREE.Group();
    const ceramicMat = new THREE.MeshStandardMaterial({
      color: palette.cup,
      roughness: 0.38,
      metalness: 0.04,
    });

    // Outer mug body
    const cylinderMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(rTop, rBot, h, 28, 1, true),
      ceramicMat,
    );
    cylinderMesh.castShadow = true;
    cylinderMesh.receiveShadow = true;
    this.mesh.add(cylinderMesh);

    // Inner mug body (darker inside cavity)
    const innerMat = new THREE.MeshStandardMaterial({
      color: "#e8dfd2",
      roughness: 0.45,
      side: THREE.BackSide,
    });
    const innerCyl = new THREE.Mesh(
      new THREE.CylinderGeometry(CUP_SPEC.innerRadius, CUP_SPEC.innerRadius * 0.88, h - CUP_SPEC.baseThickness, 24),
      innerMat,
    );
    innerCyl.position.y = CUP_SPEC.baseThickness / 2;
    this.mesh.add(innerCyl);

    // Bottom outer base
    const bottomMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(rBot, rBot, CUP_SPEC.baseThickness, 24),
      ceramicMat,
    );
    bottomMesh.position.y = -h / 2 + CUP_SPEC.baseThickness / 2;
    bottomMesh.castShadow = true;
    this.mesh.add(bottomMesh);

    // Rounded rim torus
    const rimMesh = new THREE.Mesh(
      new THREE.TorusGeometry(rTop * 0.94, 0.004, 10, 28),
      ceramicMat,
    );
    rimMesh.rotation.x = Math.PI / 2;
    rimMesh.position.y = h / 2;
    rimMesh.castShadow = true;
    this.mesh.add(rimMesh);

    // Chipped detail on rim
    const chip = new THREE.Mesh(
      new THREE.BoxGeometry(rTop * 0.28, 0.005, 0.008),
      new THREE.MeshStandardMaterial({ color: "#c4b8a8", roughness: 0.7 }),
    );
    chip.position.set(-rTop * 0.55, h / 2 - 0.001, 0.02);
    this.mesh.add(chip);

    // Handle
    const handleMesh = new THREE.Mesh(
      new THREE.TorusGeometry(rTop * 0.55, rTop * 0.16, 10, 20, Math.PI),
      ceramicMat,
    );
    handleMesh.rotation.y = Math.PI / 2;
    handleMesh.position.x = rTop * 0.96;
    handleMesh.castShadow = true;
    this.mesh.add(handleMesh);

    // Coffee liquid disk
    const coffeeMat = new THREE.MeshStandardMaterial({
      color: palette.coffee,
      roughness: 0.2,
      metalness: 0.1,
    });
    this.coffeeMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(CUP_SPEC.innerRadius * 0.98, CUP_SPEC.innerRadius * 0.98, 0.006, 24),
      coffeeMat,
    );
    this.coffeeMesh.position.y = h / 2 - 0.012;
    this.mesh.add(this.coffeeMesh);

    // Steam particles rising from hot coffee
    this.steamGeo = new THREE.BufferGeometry();
    const count = 45;
    const steamPos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      this.steamLife.push(Math.random());
      steamPos[i * 3] = (Math.random() - 0.5) * 0.04;
      steamPos[i * 3 + 1] = h / 2 + Math.random() * 0.15;
      steamPos[i * 3 + 2] = (Math.random() - 0.5) * 0.04;
    }
    this.steamGeo.setAttribute("position", new THREE.BufferAttribute(steamPos, 3));
    this.steamPoints = new THREE.Points(
      this.steamGeo,
      new THREE.PointsMaterial({
        color: "#f8f6f0",
        size: 0.028,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
      }),
    );
    this.mesh.add(this.steamPoints);

    // Link user data for picking
    this.mesh.userData = { cupBody: this, isCup: true };
    this.mesh.traverse((c) => {
      c.userData.cupBody = this;
      c.userData.isCup = true;
    });

    this.updateLiquid(this.liquidMl);
    this.syncMesh();
  }

  updateLiquid(volumeMl: number) {
    this.liquidMl = Math.max(0, Math.min(CUP_SPEC.coffeeMaxMl, volumeMl));
    const f = this.liquidMl / CUP_SPEC.coffeeMaxMl;

    // Update coffee surface level in mesh
    if (this.liquidMl <= 1) {
      this.coffeeMesh.visible = false;
      this.steamPoints.visible = false;
    } else {
      this.coffeeMesh.visible = true;
      this.steamPoints.visible = true;
      const h = CUP_SPEC.height;
      const base = -h / 2 + CUP_SPEC.baseThickness + 0.005;
      const top = h / 2 - 0.012;
      this.coffeeMesh.position.y = THREE.MathUtils.lerp(base, top, f);
      const rad = THREE.MathUtils.lerp(CUP_SPEC.innerRadius * 0.88, CUP_SPEC.innerRadius, f);
      this.coffeeMesh.scale.set(rad / CUP_SPEC.innerRadius, 1, rad / CUP_SPEC.innerRadius);
    }

    // Recalculate dynamic mass & COM
    const coffeeKg = CUP_SPEC.coffeeMaxKg * f;
    const newMass = CUP_SPEC.ceramicMass + coffeeKg;
    if (Math.abs(this.body.mass - newMass) > 0.005) {
      this.body.mass = newMass;
      this.body.updateMassProperties();
    }
  }

  tickSteam(dt: number) {
    if (this.liquidMl <= 2 || this.isBroken) {
      this.steamPoints.visible = false;
      return;
    }
    this.steamPoints.visible = true;
    const pos = this.steamGeo.attributes.position as THREE.BufferAttribute;
    const count = this.steamLife.length;
    for (let i = 0; i < count; i++) {
      this.steamLife[i] += dt * 0.8;
      if (this.steamLife[i] > 1.0) {
        this.steamLife[i] = 0;
        pos.setXYZ(
          i,
          (Math.random() - 0.5) * 0.04,
          this.coffeeMesh.position.y + 0.005,
          (Math.random() - 0.5) * 0.04,
        );
      } else {
        const py = pos.getY(i) + dt * 0.12;
        const px = pos.getX(i) + (Math.random() - 0.5) * dt * 0.02;
        const pz = pos.getZ(i) + (Math.random() - 0.5) * dt * 0.02;
        pos.setXYZ(i, px, py, pz);
      }
    }
    pos.needsUpdate = true;
  }

  updatePhysics(dt: number) {
    if (this.isBroken) return;

    // Measure body acceleration
    if (dt > 0.0001) {
      const ax = (this.body.velocity.x - this.prevVelocity.x) / dt;
      const ay = (this.body.velocity.y - this.prevVelocity.y) / dt;
      const az = (this.body.velocity.z - this.prevVelocity.z) / dt;
      this.acceleration.set(ax, ay, az);
    }
    this.prevVelocity.copy(this.body.velocity);
    this.tickSteam(dt);

    // Clamp excessive angular and linear velocities
    const angSpeed = this.body.angularVelocity.length();
    if (angSpeed > CUP_SPEC.maxAngularVelocity) {
      this.body.angularVelocity.scale(CUP_SPEC.maxAngularVelocity / angSpeed, this.body.angularVelocity);
    }
    const linSpeed = this.body.velocity.length();
    if (linSpeed > 4.5) {
      this.body.velocity.scale(4.5 / linSpeed, this.body.velocity);
    }

    // Natural resting stabilization: suppress micro-jitter on contact surfaces
    const onSurface = this.body.position.y < 0.88;
    if (onSurface && linSpeed < 0.08 && angSpeed < 0.25) {
      this.body.velocity.set(0, 0, 0);
      this.body.angularVelocity.set(0, 0, 0);
      this.body.sleep();
    }
  }

  syncMesh() {
    this.mesh.position.copy(this.body.position as unknown as THREE.Vector3);
    this.mesh.quaternion.copy(this.body.quaternion as unknown as THREE.Quaternion);
  }

  /**
   * Returns lowest point on the rim in world coordinates, where coffee will pour from
   */
  getLowestLipPoint(): { position: THREE.Vector3; normal: THREE.Vector3 } {
    const q = this.mesh.quaternion;
    const cupPos = this.mesh.position;
    const cupUp = new THREE.Vector3(0, 1, 0).applyQuaternion(q);

    // Gravity projected into cup's local frame
    const qInv = q.clone().invert();
    const gravityLocal = new THREE.Vector3(0, -1, 0).applyQuaternion(qInv);
    
    // Lowest rim direction in local coordinates
    let rimDirLocal = new THREE.Vector3(gravityLocal.x, 0, gravityLocal.z);
    if (rimDirLocal.lengthSq() < 0.0001) {
      rimDirLocal.set(1, 0, 0);
    } else {
      rimDirLocal.normalize();
    }

    const rimDirWorld = rimDirLocal.clone().applyQuaternion(q);
    const lipPos = cupPos
      .clone()
      .addScaledVector(cupUp, CUP_SPEC.height / 2)
      .addScaledVector(rimDirWorld, CUP_SPEC.outerRadius);

    return { position: lipPos, normal: rimDirWorld };
  }

  /** Returns tilt angle in degrees relative to upright world (+Y) */
  getTiltAngleDeg(): number {
    const q = this.mesh.quaternion;
    const cupUp = new THREE.Vector3(0, 1, 0).applyQuaternion(q);
    const dot = THREE.MathUtils.clamp(cupUp.y, -1, 1);
    return THREE.MathUtils.radToDeg(Math.acos(dot));
  }

  /** Returns critical tilt angle at current volume */
  getCriticalTiltAngleDeg(): number {
    const f = this.liquidMl / CUP_SPEC.coffeeMaxMl;
    return THREE.MathUtils.lerp(CUP_SPEC.criticalTiltEmptyDeg, CUP_SPEC.criticalTiltFullDeg, f);
  }

  update(dt: number) {
    this.updatePhysics(dt);
  }

  destroy() {
    this.mesh.clear();
  }

  reset(pos = CUP_SPEC.initialPos) {
    this.isBroken = false;
    this.body.mass = CUP_SPEC.ceramicMass + CUP_SPEC.coffeeMaxKg;
    this.body.type = CANNON.BODY_TYPES.DYNAMIC;
    this.body.position.set(pos.x, pos.y, pos.z);
    this.body.velocity.set(0, 0, 0);
    this.body.angularVelocity.set(0, 0, 0);
    this.body.quaternion.set(0, 0, 0, 1);
    this.body.wakeUp();
    this.mesh.visible = true;
    this.updateLiquid(CUP_SPEC.initialLiquidMl);
    this.syncMesh();
  }
}

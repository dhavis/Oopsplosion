import * as CANNON from "cannon-es";
import * as THREE from "three";
import { CUP_SPEC, SANDBOX_ROOM } from "./sandboxScale";
import { PottedPlantAssembly } from "./PottedPlantAssembly";
import { LampAssembly } from "./LampAssembly";
import { BagAssembly } from "./BagAssembly";

export interface InteractiveTarget {
  body: CANNON.Body;
  mesh: THREE.Object3D;
  assembly?: PottedPlantAssembly | LampAssembly | BagAssembly;
  isBroken?: boolean;
}

export class CupInteraction {
  private camera: THREE.PerspectiveCamera;
  private canvas: HTMLCanvasElement;
  private scene: THREE.Scene;

  private raycaster = new THREE.Raycaster();
  private ndc = new THREE.Vector2();
  private dragPlane = new THREE.Plane();
  private isDragging = false;
  private pointerId: number | null = null;
  private activeBody: CANNON.Body | null = null;
  private isFoliageHit = false;
  private isBulbHit = false;
  private isBagHandleHit = false;
  private bagHandleIdx = 0;
  private lastHitWorld = new THREE.Vector3();

  // Spring attachment parameters
  private localGrabPoint = new CANNON.Vec3();
  private targetWorldPoint = new THREE.Vector3();
  private prevTargetWorldPoint = new THREE.Vector3();
  private targetVelocity = new THREE.Vector3();
  private dragStartTime = 0;
  private initialHitDistance = 0;

  // Velocity tracking buffer for gestures
  private samples: Array<{ x: number; y: number; t: number }> = [];

  // Visual drag indicator
  private grabIndicator: THREE.Mesh;

  onHitAction?: (action: "poke" | "flick" | "release", force: number) => void;

  constructor(camera: THREE.PerspectiveCamera, canvas: HTMLCanvasElement, scene: THREE.Scene) {
    this.camera = camera;
    this.canvas = canvas;
    this.scene = scene;

    // Subtle grab reticle
    const ringGeo = new THREE.RingGeometry(0.012, 0.016, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: "#f4f0e8",
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
      depthTest: false,
    });
    this.grabIndicator = new THREE.Mesh(ringGeo, ringMat);
    this.grabIndicator.visible = false;
    this.grabIndicator.renderOrder = 999;
    this.scene.add(this.grabIndicator);
  }

  onPointerDown(clientX: number, clientY: number, pointerId: number, target: InteractiveTarget) {
    if (target.isBroken) return;

    const rect = this.canvas.getBoundingClientRect();
    this.ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.ndc, this.camera);
    const intersects = this.raycaster.intersectObject(target.mesh, true);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const hitPoint = hit.point;
      this.lastHitWorld.copy(hitPoint);
      this.initialHitDistance = hit.distance;

      this.isDragging = true;
      this.pointerId = pointerId;
      this.dragStartTime = performance.now();
      this.samples = [{ x: clientX, y: clientY, t: this.dragStartTime }];

      // Determine active body based on part hit
      let hitBody = target.body;
      this.isFoliageHit = false;
      this.isBulbHit = false;
      this.isBagHandleHit = false;

      if (target.assembly instanceof PottedPlantAssembly) {
        if (hitPoint.y >= 0.98) {
          hitBody = target.assembly.stemBody;
          this.isFoliageHit = true;
        } else {
          hitBody = target.assembly.potBody;
        }
      } else if (target.assembly instanceof LampAssembly) {
        if (hitPoint.y < 1.05 && target.assembly.bulbState !== "burst") {
          hitBody = target.assembly.bulbBody;
          this.isBulbHit = true;
        } else if (hitPoint.y > 1.25 && target.assembly.cordBodies.length > 0) {
          hitBody = target.assembly.cordBodies[Math.floor(target.assembly.cordBodies.length / 2)];
        } else {
          hitBody = target.assembly.shadeBody;
        }
      } else if (target.assembly instanceof BagAssembly) {
        if (hitPoint.y > 1.00 && target.assembly.handleBodies.length > 0) {
          this.bagHandleIdx = hitPoint.x < 0 ? 0 : 1;
          hitBody = target.assembly.handleBodies[this.bagHandleIdx];
          this.isBagHandleHit = true;
        } else if (hitPoint.y > 0.86) {
          hitBody = target.assembly.upperBody;
        } else {
          hitBody = target.assembly.baseBody;
        }
      }
      this.activeBody = hitBody;

      // Store local grab anchor on target body
      const hitCannon = new CANNON.Vec3(hitPoint.x, hitPoint.y, hitPoint.z);
      this.localGrabPoint = hitBody.pointToLocalFrame(hitCannon, new CANNON.Vec3());

      // Drag plane perpendicular to camera view ray
      const camDir = new THREE.Vector3();
      this.camera.getWorldDirection(camDir);
      this.dragPlane.setFromNormalAndCoplanarPoint(camDir.negate(), hitPoint);

      this.targetWorldPoint.copy(hitPoint);
      this.prevTargetWorldPoint.copy(hitPoint);
      this.targetVelocity.set(0, 0, 0);

      this.grabIndicator.position.copy(hitPoint);
      this.grabIndicator.quaternion.copy(this.camera.quaternion);
      this.grabIndicator.visible = true;

      hitBody.wakeUp();
    }
  }

  onPointerMove(clientX: number, clientY: number, pointerId: number) {
    if (!this.isDragging || this.pointerId !== pointerId) return;

    const now = performance.now();
    this.samples.push({ x: clientX, y: clientY, t: now });
    while (this.samples.length > 2 && now - this.samples[0].t > 120) {
      this.samples.shift();
    }

    const rect = this.canvas.getBoundingClientRect();
    this.ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.ndc, this.camera);
    const target = new THREE.Vector3();
    if (this.raycaster.ray.intersectPlane(this.dragPlane, target)) {
      // Counter boundaries
      const counterY = SANDBOX_ROOM.counterPos.y + SANDBOX_ROOM.counter.h / 2; // 0.80
      const counterHalfW = SANDBOX_ROOM.counter.w / 2 + 0.05;
      const counterHalfD = SANDBOX_ROOM.counter.d / 2 + 0.05;

      const overCounter =
        Math.abs(target.x - SANDBOX_ROOM.counterPos.x) <= counterHalfW &&
        Math.abs(target.z - SANDBOX_ROOM.counterPos.z) <= counterHalfD;

      if (overCounter) {
        target.y = Math.max(counterY + 0.04, target.y);
      }
      target.y = Math.max(0.04, target.y);

      // Bound within viewable space
      target.x = THREE.MathUtils.clamp(target.x, -1.5, 1.5);
      target.y = THREE.MathUtils.clamp(target.y, 0.05, 2.2);
      target.z = THREE.MathUtils.clamp(target.z, -1.2, 1.2);

      this.targetWorldPoint.copy(target);
      this.grabIndicator.position.copy(target);
      this.grabIndicator.quaternion.copy(this.camera.quaternion);
    }
  }

  onPointerUp(_clientX: number, _clientY: number, pointerId: number, target: InteractiveTarget) {
    if (!this.isDragging || this.pointerId !== pointerId) return;

    this.isDragging = false;
    this.grabIndicator.visible = false;
    this.pointerId = null;

    if (target.isBroken) return;

    const body = this.activeBody ?? target.body;
    const dragDuration = performance.now() - this.dragStartTime;

    // Calculate pointer velocity from sample window (80-120 ms)
    let pointerVx = 0;
    let pointerVy = 0;
    if (this.samples.length >= 2) {
      const first = this.samples[0];
      const last = this.samples[this.samples.length - 1];
      const dt = (last.t - first.t) / 1000;
      if (dt > 0.01) {
        pointerVx = (last.x - first.x) / dt;
        pointerVy = (last.y - first.y) / dt;
      }
    }

    const rect = this.canvas.getBoundingClientRect();
    const pixelSpeed = Math.hypot(pointerVx, pointerVy);

    // Short tap / gentle poke
    if (dragDuration < 160 && pixelSpeed < 180) {
      const rayDir = new THREE.Vector3();
      this.camera.getWorldDirection(rayDir);
      
      const pushDir = new THREE.Vector3(rayDir.x, 0.08, rayDir.z).normalize();
      const impulseMag = (this.isFoliageHit ? 0.35 : 0.22) * body.mass;
      
      if (this.isFoliageHit && target.assembly instanceof PottedPlantAssembly) {
        target.assembly.pokeFoliage(
          new THREE.Vector3(pushDir.x * impulseMag, pushDir.y * impulseMag, pushDir.z * impulseMag),
          this.lastHitWorld,
        );
      } else if (this.isBulbHit && target.assembly instanceof LampAssembly) {
        target.assembly.pokeBulb(
          new THREE.Vector3(pushDir.x * impulseMag, pushDir.y * impulseMag, pushDir.z * impulseMag),
        );
      } else if (target.assembly instanceof LampAssembly) {
        target.assembly.pokeShade(
          new THREE.Vector3(pushDir.x * impulseMag, pushDir.y * impulseMag, pushDir.z * impulseMag),
          this.lastHitWorld,
        );
      } else if (this.isBagHandleHit && target.assembly instanceof BagAssembly) {
        target.assembly.pokeHandle(
          this.bagHandleIdx,
          new THREE.Vector3(pushDir.x * impulseMag, pushDir.y * impulseMag, pushDir.z * impulseMag),
        );
      } else if (target.assembly instanceof BagAssembly) {
        target.assembly.pokePanel(
          new THREE.Vector3(pushDir.x * impulseMag, pushDir.y * impulseMag, pushDir.z * impulseMag),
          this.lastHitWorld,
        );
      } else {
        const contactWorld = body.pointToWorldFrame(this.localGrabPoint, new CANNON.Vec3());
        body.wakeUp();
        body.applyImpulse(
          new CANNON.Vec3(pushDir.x * impulseMag, pushDir.y * impulseMag, pushDir.z * impulseMag),
          contactWorld,
        );
      }
      this.onHitAction?.("poke", impulseMag);
      return;
    }

    // Directional Swipe / Flick
    if (dragDuration < 240 && pixelSpeed >= 180) {
      const fovRad = THREE.MathUtils.degToRad(this.camera.fov);
      const depth = this.initialHitDistance || 2.2;
      const metersPerPixel = (2 * depth * Math.tan(fovRad / 2)) / rect.height;

      const camRight = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
      const camUp = new THREE.Vector3(0, 1, 0).applyQuaternion(this.camera.quaternion);

      const worldSwipe = new THREE.Vector3()
        .addScaledVector(camRight, pointerVx * metersPerPixel)
        .addScaledVector(camUp, -pointerVy * metersPerPixel);

      // Clamp speed realistically to prevent flying off-screen
      worldSwipe.clampLength(0.3, CUP_SPEC.maxGestureDeltaV);
      worldSwipe.y = Math.min(CUP_SPEC.maxGestureUpwardV, Math.max(-2.0, worldSwipe.y));
      
      // Calculate 3D impulse J = m * deltaV
      const impulse = worldSwipe.clone().multiplyScalar(body.mass);
      if (this.isFoliageHit && target.assembly instanceof PottedPlantAssembly) {
        target.assembly.pokeFoliage(impulse, this.lastHitWorld);
      } else if (this.isBulbHit && target.assembly instanceof LampAssembly) {
        target.assembly.pokeBulb(impulse);
      } else if (target.assembly instanceof LampAssembly) {
        target.assembly.pokeShade(impulse, this.lastHitWorld);
      } else if (this.isBagHandleHit && target.assembly instanceof BagAssembly) {
        target.assembly.pokeHandle(this.bagHandleIdx, impulse);
      } else if (target.assembly instanceof BagAssembly) {
        target.assembly.pokePanel(impulse, this.lastHitWorld);
      } else {
        const contactWorld = body.pointToWorldFrame(this.localGrabPoint, new CANNON.Vec3());
        body.wakeUp();
        body.applyImpulse(
          new CANNON.Vec3(impulse.x, impulse.y, impulse.z),
          contactWorld,
        );
      }
      this.onHitAction?.("flick", impulse.length());
      return;
    }

    // Release from lift/drag: Hand simply lets go; do not double-boost velocity
    body.wakeUp();
    const curSpeed = body.velocity.length();
    if (curSpeed > CUP_SPEC.maxGestureDeltaV) {
      body.velocity.scale(CUP_SPEC.maxGestureDeltaV / curSpeed, body.velocity);
    }
    if (body.velocity.y > CUP_SPEC.maxGestureUpwardV) {
      body.velocity.y = CUP_SPEC.maxGestureUpwardV;
    }
    this.onHitAction?.("release", body.velocity.length());
  }

  updatePhysics(dt: number, target: InteractiveTarget) {
    if (!this.isDragging || target.isBroken || dt <= 0) return;

    const body = this.activeBody ?? target.body;

    // Measure target velocity
    this.targetVelocity.copy(this.targetWorldPoint).sub(this.prevTargetWorldPoint).divideScalar(dt);
    this.targetVelocity.clampLength(0, CUP_SPEC.maxTargetVelocity);
    this.prevTargetWorldPoint.copy(this.targetWorldPoint);

    // World position of the grabbed point on the target body
    const grabWorldCannon = body.pointToWorldFrame(this.localGrabPoint, new CANNON.Vec3());
    const grabWorld = new THREE.Vector3(grabWorldCannon.x, grabWorldCannon.y, grabWorldCannon.z);

    // Point velocity at grab point
    const velCannon = body.getVelocityAtWorldPoint(grabWorldCannon, new CANNON.Vec3());
    const pointVelocity = new THREE.Vector3(velCannon.x, velCannon.y, velCannon.z);

    // Dynamic mass scaling for spring-damper to hold lighter or heavier objects naturally
    const massScale = Math.max(0.2, body.mass / 0.54);
    const k = CUP_SPEC.springK * massScale;
    const c = CUP_SPEC.dampingC * massScale;
    const maxForce = CUP_SPEC.maxSpringForce * massScale;

    // Spring Force: F = k * (x_target - x_grab) - c * (v_point - v_target)
    const displacement = this.targetWorldPoint.clone().sub(grabWorld);
    displacement.clampLength(0, CUP_SPEC.maxTargetLead);

    const relVel = pointVelocity.clone().sub(this.targetVelocity);

    const force = displacement
      .multiplyScalar(k)
      .sub(relVel.multiplyScalar(c));

    force.clampLength(0, maxForce);

    // Apply force at the grabbed point
    body.wakeUp();
    body.applyForce(
      new CANNON.Vec3(force.x, force.y, force.z),
      grabWorldCannon,
    );
  }

  cancel() {
    this.isDragging = false;
    this.grabIndicator.visible = false;
    this.pointerId = null;
    this.activeBody = null;
  }
}

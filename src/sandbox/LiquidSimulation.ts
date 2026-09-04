import * as THREE from "three";
import { CupBody } from "./CupBody";
import { SANDBOX_ROOM } from "./sandboxScale";
import { palette } from "../theme";

interface LiquidDroplet {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  volumeMl: number;
  life: number;
  maxLife: number;
}

interface PuddleDecal {
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  radius: number;
  maxRadius: number;
  volumeMl: number;
  surface: "counter" | "floor";
}

export class LiquidSimulation {
  private scene: THREE.Scene;
  private droplets: LiquidDroplet[] = [];
  private puddles: PuddleDecal[] = [];
  
  // Instanced / buffer particle stream
  private particlePoints: THREE.Points;
  private particleGeo: THREE.BufferGeometry;
  private maxParticles = 120;
  
  // Slosh oscillator variables
  private slosh = new THREE.Vector2();
  private sloshVelocity = new THREE.Vector2();
  private omega0 = 8.0; // natural frequency (rad/s)
  private zeta = 0.18;  // damping ratio
  
  // Spill accumulation
  private spillRateAccumulator = 0;
  
  // Callback when pouring occurs
  onPour?: (rateMlPerSec: number) => void;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    this.particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.maxParticles * 3);
    this.particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    this.particlePoints = new THREE.Points(
      this.particleGeo,
      new THREE.PointsMaterial({
        color: palette.coffee,
        size: 0.022,
        transparent: true,
        opacity: 0.9,
      }),
    );
    this.particlePoints.frustumCulled = false;
    this.scene.add(this.particlePoints);
  }

  update(dt: number, cup: CupBody) {
    if (dt <= 0) return;

    this.updateSlosh(dt, cup);
    this.checkSpill(dt, cup);
    this.updateDroplets(dt);
    this.updateParticlesGeometry();
  }

  private updateSlosh(dt: number, cup: CupBody) {
    if (cup.isBroken) return;

    // Lateral acceleration in world space
    const ax = cup.acceleration.x;
    const az = cup.acceleration.z;
    const hEff = 0.06;

    // 2-axis damped oscillator
    // d2s/dt2 + 2 * zeta * omega0 * ds/dt + omega0^2 * s = -a_lat / h_eff
    const targetAccX = -ax / hEff;
    const targetAccZ = -az / hEff;

    const d2sx = targetAccX - 2 * this.zeta * this.omega0 * this.sloshVelocity.x - this.omega0 * this.omega0 * this.slosh.x;
    const d2sz = targetAccZ - 2 * this.zeta * this.omega0 * this.sloshVelocity.y - this.omega0 * this.omega0 * this.slosh.y;

    this.sloshVelocity.x += d2sx * dt;
    this.sloshVelocity.y += d2sz * dt;

    this.slosh.x += this.sloshVelocity.x * dt;
    this.slosh.y += this.sloshVelocity.y * dt;

    // Clamp maximum slosh displacement
    const maxSlosh = 0.38; // ~22 degrees
    this.slosh.clampLength(0, maxSlosh);
  }

  private checkSpill(dt: number, cup: CupBody) {
    if (cup.isBroken || cup.liquidMl <= 0.5) return;

    const tiltDeg = cup.getTiltAngleDeg();
    const critDeg = cup.getCriticalTiltAngleDeg();
    const sloshDeg = THREE.MathUtils.radToDeg(this.slosh.length());
    
    // Angular speed contribution
    const angSpeed = cup.body.angularVelocity.length();
    const angDeg = angSpeed * 3.4;

    const effectiveTilt = tiltDeg + sloshDeg + angDeg;

    if (effectiveTilt > critDeg) {
      const deltaDeg = effectiveTilt - critDeg;
      // Flow rate formula: Q = 30 + 180 * sin(delta) + 12 * |omega| (mL/s)
      const rad = THREE.MathUtils.degToRad(Math.min(90, deltaDeg));
      const flowRate = Math.min(240, 30 + 180 * Math.sin(rad) + 12 * angSpeed);
      
      const mlToPour = Math.min(cup.liquidMl, flowRate * dt);
      cup.updateLiquid(cup.liquidMl - mlToPour);

      this.spillRateAccumulator += mlToPour;
      this.onPour?.(flowRate);

      // Emit droplets proportional to spilled volume
      const dropletVol = 2.5; // ~2.5 mL per droplet
      while (this.spillRateAccumulator >= dropletVol) {
        this.spillRateAccumulator -= dropletVol;
        this.emitDropletFromCup(cup, dropletVol);
      }
    }
  }

  private emitDropletFromCup(cup: CupBody, volumeMl: number) {
    const lip = cup.getLowestLipPoint();
    
    // Velocity of the lip from cup's rigid body motion
    const vel = new THREE.Vector3(
      cup.body.velocity.x,
      cup.body.velocity.y,
      cup.body.velocity.z,
    );
    
    // Add tangential rotational velocity
    const r = lip.position.clone().sub(cup.mesh.position);
    const angVel = new THREE.Vector3(
      cup.body.angularVelocity.x,
      cup.body.angularVelocity.y,
      cup.body.angularVelocity.z,
    );
    const rotVel = new THREE.Vector3().crossVectors(angVel, r);
    vel.add(rotVel);

    // Add slight outward pour ejection impulse along rim normal
    vel.addScaledVector(lip.normal, 0.22 + Math.random() * 0.15);
    vel.y -= 0.05;

    // Small scatter
    vel.x += (Math.random() - 0.5) * 0.08;
    vel.z += (Math.random() - 0.5) * 0.08;

    this.droplets.push({
      position: lip.position.clone(),
      velocity: vel,
      volumeMl,
      life: 0,
      maxLife: 1.5,
    });
  }

  /** Direct splatter emission (e.g. from mug shattering) */
  emitSplatter(origin: THREE.Vector3, totalVolumeMl: number, count = 20) {
    const perDrop = Math.max(0.5, totalVolumeMl / count);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3;
      const speed = 0.6 + Math.random() * 1.8;
      const v = new THREE.Vector3(
        Math.cos(angle) * speed,
        0.3 + Math.random() * 1.2,
        Math.sin(angle) * speed,
      );
      this.droplets.push({
        position: origin.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.04, 0.02, (Math.random() - 0.5) * 0.04)),
        velocity: v,
        volumeMl: perDrop,
        life: 0,
        maxLife: 1.8,
      });
    }
  }

  private updateDroplets(dt: number) {
    const gravity = -9.82;
    const counterY = SANDBOX_ROOM.counterPos.y + SANDBOX_ROOM.counter.h / 2; // y = 0.80
    const counterHalfW = SANDBOX_ROOM.counter.w / 2;
    const counterHalfD = SANDBOX_ROOM.counter.d / 2;
    const floorY = 0;

    for (let i = this.droplets.length - 1; i >= 0; i--) {
      const d = this.droplets[i];
      d.life += dt;

      // Ballistic motion
      d.velocity.y += gravity * dt;
      d.position.addScaledVector(d.velocity, dt);

      // Check collision with floating counter
      const inCounterBounds =
        Math.abs(d.position.x - SANDBOX_ROOM.counterPos.x) <= counterHalfW &&
        Math.abs(d.position.z - SANDBOX_ROOM.counterPos.z) <= counterHalfD;

      if (inCounterBounds && d.position.y <= counterY && d.position.y >= counterY - 0.08) {
        // Hit counter!
        this.addOrGrowPuddle(
          new THREE.Vector3(d.position.x, counterY + 0.0015, d.position.z),
          d.volumeMl,
          "counter",
        );
        this.droplets.splice(i, 1);
        continue;
      }

      // Check collision with floor
      if (d.position.y <= floorY) {
        this.addOrGrowPuddle(
          new THREE.Vector3(d.position.x, floorY + 0.001, d.position.z),
          d.volumeMl,
          "floor",
        );
        this.droplets.splice(i, 1);
        continue;
      }

      if (d.life >= d.maxLife) {
        this.droplets.splice(i, 1);
      }
    }
  }

  private addOrGrowPuddle(hitPos: THREE.Vector3, volumeMl: number, surface: "counter" | "floor") {
    // Check if there is an existing puddle nearby to merge with
    for (const p of this.puddles) {
      if (p.surface === surface && p.position.distanceTo(hitPos) < p.radius * 0.9 + 0.03) {
        p.volumeMl += volumeMl;
        p.maxRadius = Math.min(0.24, 0.03 + Math.sqrt(p.volumeMl) * 0.015);
        p.mesh.scale.set(p.maxRadius, 1, p.maxRadius);
        return;
      }
    }

    // Create new puddle decal
    const initialRadius = Math.max(0.02, Math.sqrt(volumeMl) * 0.012);
    const puddleMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 0.002, 20),
      new THREE.MeshStandardMaterial({
        color: palette.coffee,
        roughness: 0.15,
        metalness: 0.1,
        transparent: true,
        opacity: 0.88,
      }),
    );
    puddleMesh.position.copy(hitPos);
    puddleMesh.scale.set(initialRadius, 1, initialRadius);
    puddleMesh.receiveShadow = true;
    this.scene.add(puddleMesh);

    this.puddles.push({
      mesh: puddleMesh,
      position: hitPos.clone(),
      radius: initialRadius,
      maxRadius: initialRadius,
      volumeMl,
      surface,
    });
  }

  private updateParticlesGeometry() {
    const pos = this.particleGeo.attributes.position as THREE.BufferAttribute;
    const total = Math.min(this.maxParticles, this.droplets.length);

    for (let i = 0; i < total; i++) {
      const d = this.droplets[i];
      pos.setXYZ(i, d.position.x, d.position.y, d.position.z);
    }
    // Hide unused
    for (let i = total; i < this.maxParticles; i++) {
      pos.setXYZ(i, 0, -100, 0);
    }
    pos.needsUpdate = true;
  }

  reset() {
    this.droplets = [];
    for (const p of this.puddles) {
      this.scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      (p.mesh.material as THREE.Material).dispose();
    }
    this.puddles = [];
    this.slosh.set(0, 0);
    this.sloshVelocity.set(0, 0);
    this.spillRateAccumulator = 0;
    this.updateParticlesGeometry();
  }
}

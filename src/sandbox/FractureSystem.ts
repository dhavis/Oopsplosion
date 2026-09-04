import * as CANNON from "cannon-es";
import * as THREE from "three";
import { CupBody } from "./CupBody";
import { LiquidSimulation } from "./LiquidSimulation";
import { CUP_SPEC, SANDBOX_COL } from "./sandboxScale";
import { palette } from "../theme";

interface ShardInstance {
  body: CANNON.Body;
  mesh: THREE.Mesh;
}

interface ShardBlueprint {
  localPos: THREE.Vector3;
  size: THREE.Vector3;
  mass: number;
  rot: THREE.Euler;
}

export class FractureSystem {
  private world: CANNON.World;
  private scene: THREE.Scene;
  private shards: ShardInstance[] = [];
  private shardMaterial: CANNON.Material;

  onShatter?: (position: THREE.Vector3, velocity: number) => void;
  onClatter?: (position: THREE.Vector3, velocity: number) => void;

  constructor(world: CANNON.World, scene: THREE.Scene, shardMaterial: CANNON.Material) {
    this.world = world;
    this.scene = scene;
    this.shardMaterial = shardMaterial;
  }

  checkCollision(
    cup: CupBody,
    targetLabel: string,
    normalImpactSpeed: number,
    contactNormal: THREE.Vector3,
    liquidSim: LiquidSimulation,
  ): boolean {
    if (cup.isBroken) return false;

    const threshold =
      targetLabel === "floor" || targetLabel === "carpetFloor"
        ? CUP_SPEC.shatterFloorVelocity
        : CUP_SPEC.shatterCounterVelocity;

    const impactEnergy = 0.5 * cup.body.mass * normalImpactSpeed * normalImpactSpeed;

    if (normalImpactSpeed >= threshold || impactEnergy >= CUP_SPEC.shatterEnergyThreshold) {
      this.shatter(cup, normalImpactSpeed, contactNormal, liquidSim);
      return true;
    } else if (normalImpactSpeed > 0.4) {
      this.onClatter?.(cup.mesh.position.clone(), normalImpactSpeed);
    }
    return false;
  }

  shatter(
    cup: CupBody,
    impactSpeed: number,
    contactNormal: THREE.Vector3,
    liquidSim: LiquidSimulation,
  ) {
    if (cup.isBroken) return;
    cup.isBroken = true;

    const cupPos = cup.mesh.position.clone();
    const cupQuat = cup.mesh.quaternion.clone();
    const cupVel = new THREE.Vector3(cup.body.velocity.x, cup.body.velocity.y, cup.body.velocity.z);
    const cupAngVel = new THREE.Vector3(
      cup.body.angularVelocity.x,
      cup.body.angularVelocity.y,
      cup.body.angularVelocity.z,
    );
    const remainingCoffee = cup.liquidMl;

    // Hide and disable the intact mug
    cup.mesh.visible = false;
    cup.body.type = CANNON.BODY_TYPES.STATIC;
    cup.body.position.set(0, -50, 0); // move away

    // Atomize and splash remaining liquid
    if (remainingCoffee > 0) {
      liquidSim.emitSplatter(cupPos, remainingCoffee, 24);
      cup.updateLiquid(0);
    }

    // Generate 14 physical shards
    const blueprints = this.generateBlueprints();
    const totalMass = CUP_SPEC.ceramicMass;

    // Scatter energy from impact: E_f = 0.5 * m * (vn^2 - v_crit^2)
    const excessSpeed = Math.max(0.2, impactSpeed - 1.8);
    const baseScatterSpeed = Math.min(1.6, Math.sqrt(1.5 * excessSpeed));

    const scatterVectors: THREE.Vector3[] = [];
    let weightedScatterSum = new THREE.Vector3();

    for (let i = 0; i < blueprints.length; i++) {
      const bp = blueprints[i];
      // Scatter bias: 50% normal reflection, 35% radial outwards, 15% random
      const normDir = contactNormal.clone().multiplyScalar(0.50);
      const radDir = bp.localPos.clone().normalize().multiplyScalar(0.35);
      const randDir = new THREE.Vector3(
        (Math.random() - 0.5),
        Math.random() * 0.6,
        (Math.random() - 0.5),
      ).normalize().multiplyScalar(0.15);

      const scatter = normDir.add(radDir).add(randDir).normalize().multiplyScalar(baseScatterSpeed * (0.6 + Math.random() * 0.5));
      scatterVectors.push(scatter);
      weightedScatterSum.addScaledVector(scatter, bp.mass);
    }

    // Conserve linear momentum: sum(mi * scatter[i]) = 0
    const meanScatter = weightedScatterSum.clone().divideScalar(totalMass);
    for (let i = 0; i < blueprints.length; i++) {
      scatterVectors[i].sub(meanScatter);
    }

    // Ceramic material for shards
    const shardMat = new THREE.MeshStandardMaterial({
      color: palette.cup,
      roughness: 0.42,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });

    for (let i = 0; i < blueprints.length; i++) {
      const bp = blueprints[i];
      
      // World position of the shard with slight normal lift
      const shardWorldPos = bp.localPos.clone().applyQuaternion(cupQuat).add(cupPos).addScaledVector(contactNormal, 0.004);

      // Inherited rigid-body velocity: v_i = v_cup + w x r_i + scatter_i
      const r_i = shardWorldPos.clone().sub(cupPos);
      const rotVel = new THREE.Vector3().crossVectors(cupAngVel, r_i);
      const initialVel = cupVel.clone().add(rotVel).add(scatterVectors[i]);
      initialVel.clampLength(0, 3.0);

      // Cannon body for shard with strong physical damping
      const halfSize = bp.size.clone().multiplyScalar(0.5);
      const body = new CANNON.Body({
        mass: bp.mass,
        material: this.shardMaterial,
        linearDamping: 0.22,
        angularDamping: 0.45,
        allowSleep: true,
      });
      body.sleepSpeedLimit = 0.10;
      body.sleepTimeLimit = 0.35;
      body.addShape(new CANNON.Box(new CANNON.Vec3(halfSize.x, halfSize.y, halfSize.z)));
      body.position.set(shardWorldPos.x, shardWorldPos.y, shardWorldPos.z);
      
      // Random tumbling angular velocity
      body.angularVelocity.set(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
      );
      body.velocity.set(initialVel.x, initialVel.y, initialVel.z);

      body.collisionFilterGroup = SANDBOX_COL.SHARD;
      body.collisionFilterMask = SANDBOX_COL.ENV | SANDBOX_COL.CUP;

      // Three.js visual mesh for shard
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(bp.size.x, bp.size.y, bp.size.z),
        shardMat,
      );
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.position.copy(shardWorldPos);

      this.world.addBody(body);
      this.scene.add(mesh);

      this.shards.push({ body, mesh });
    }

    this.onShatter?.(cupPos, impactSpeed);
  }

  private generateBlueprints(): ShardBlueprint[] {
    const r = CUP_SPEC.outerRadius;
    const h = CUP_SPEC.height;
    const bps: ShardBlueprint[] = [];

    // 6 Wall Shards (sum = 0.156 kg)
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const y = (i % 2 === 0 ? 1 : -1) * (h * 0.22);
      bps.push({
        localPos: new THREE.Vector3(Math.cos(angle) * (r * 0.92), y, Math.sin(angle) * (r * 0.92)),
        size: new THREE.Vector3(0.038, 0.045, 0.008),
        mass: 0.026,
        rot: new THREE.Euler(0, angle, 0),
      });
    }

    // 4 Base Shards (sum = 0.100 kg)
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + 0.3;
      bps.push({
        localPos: new THREE.Vector3(Math.cos(angle) * (r * 0.5), -h / 2 + 0.006, Math.sin(angle) * (r * 0.5)),
        size: new THREE.Vector3(0.032, 0.008, 0.032),
        mass: 0.025,
        rot: new THREE.Euler(0, angle, 0),
      });
    }

    // 2 Rim Fragments (sum = 0.036 kg)
    bps.push({
      localPos: new THREE.Vector3(r * 0.85, h / 2 - 0.005, 0.02),
      size: new THREE.Vector3(0.025, 0.012, 0.008),
      mass: 0.018,
      rot: new THREE.Euler(0.2, 0, 0),
    });
    bps.push({
      localPos: new THREE.Vector3(-r * 0.85, h / 2 - 0.005, -0.02),
      size: new THREE.Vector3(0.025, 0.012, 0.008),
      mass: 0.018,
      rot: new THREE.Euler(-0.2, 0, 0),
    });

    // 2 Handle Fragments (sum = 0.028 kg)
    bps.push({
      localPos: new THREE.Vector3(r + 0.02, h * 0.15, 0),
      size: new THREE.Vector3(0.016, 0.032, 0.014),
      mass: 0.014,
      rot: new THREE.Euler(0, 0, 0.3),
    });
    bps.push({
      localPos: new THREE.Vector3(r + 0.02, -h * 0.15, 0),
      size: new THREE.Vector3(0.016, 0.032, 0.014),
      mass: 0.014,
      rot: new THREE.Euler(0, 0, -0.3),
    });

    // Total mass = 0.156 + 0.100 + 0.036 + 0.028 = 0.320 kg exact
    return bps;
  }

  syncVisuals() {
    for (let i = 0; i < this.shards.length; i++) {
      const { body, mesh } = this.shards[i];
      mesh.position.copy(body.position as unknown as THREE.Vector3);
      mesh.quaternion.copy(body.quaternion as unknown as THREE.Quaternion);
    }
  }

  reset() {
    for (const { body, mesh } of this.shards) {
      this.world.removeBody(body);
      this.scene.remove(mesh);
    }
    this.shards = [];
  }
}

import * as THREE from 'three';
import { scene } from './game.js';
import { checkCollisionForSouls } from './lostSoul.js';

const cacodemons = [];
const projectiles = [];

const projectileSpeed = 0.6;
const fireInterval = 2000;

function createCacodemonMesh() {
  const geo = new THREE.SphereGeometry(3, 16, 16);
  const mat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0x660000 });
  return new THREE.Mesh(geo, mat);
}

function createProjectile(position, direction) {
  const geo = new THREE.SphereGeometry(0.5, 8, 8);
  const mat = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xcccc00 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(position);
  scene.add(mesh);

  return {
    mesh,
    dir: direction.clone().normalize(),
    spawnTime: Date.now()
  };
}

export function spawnCacodemons(blockBoxes) {
  for (let i = 0; i < 3; i++) {
    const block = blockBoxes[i % blockBoxes.length]; // Reutiliza blocos se houver menos de 3
    const center = block.getCenter(new THREE.Vector3());
    
    const cacodemon = {
      mesh: createCacodemonMesh(),
      hp: 50,
      timers: {
        lastFire: 0
      },
      state: 'idle'
    };

    cacodemon.mesh.position.set(center.x, center.y + 20, center.z); // flutuando sobre o bloco
    scene.add(cacodemon.mesh);
    cacodemons.push(cacodemon);
  }
}

function checkProjectileCollision(projectile, player, wallBoxes, areaBoxes, collumnsBoxes, blockBoxes) {
  const projectileBB = new THREE.Box3().setFromCenterAndSize(
    projectile.mesh.position,
    new THREE.Vector3(1, 1, 1) // Tamanho da colisão do projétil
  );

  // Colisão com o jogador
  const playerBB = new THREE.Box3().setFromObject(player);
  if (projectileBB.intersectsBox(playerBB)) {
    return 'player';
  }

  // Colisão com ambiente
  for (const boxList of [wallBoxes, areaBoxes, collumnsBoxes, blockBoxes]) {
    for (const box of boxList) {
      if (projectileBB.intersectsBox(box)) {
        return 'world';
      }
    }
  }
  if (projectile.mesh.position.y < 0.1) {
    return 'ground';
  }

  return null;
}

export function updateCacodemons(player, wallBoxes, areaBoxes, collumnsBoxes, blockBoxes) {
  const now = Date.now();
  const moveVec = new THREE.Vector3();
  const tmpVec = new THREE.Vector3();
  const sideVec = new THREE.Vector3();
  const newPos = new THREE.Vector3();

  for (const cacodemon of cacodemons) {
    if (cacodemon.hp <= 0) continue;

    // Direção até o jogador
    tmpVec.subVectors(player.position, cacodemon.mesh.position);
    const dist = tmpVec.length();
    const forwardDir = tmpVec.clone().normalize();

    // Zig-zag lateral
    sideVec.set(forwardDir.z, 0, -forwardDir.x).normalize();
    const zigzagOffset = Math.sin(now * 0.003 + cacodemon.mesh.id) * 0.5;

    // Movimento combinado
    moveVec.copy(forwardDir).multiplyScalar(0.03);
    moveVec.add(sideVec.multiplyScalar(zigzagOffset * 0.01));

    // Novo destino
    newPos.copy(cacodemon.mesh.position).add(moveVec);

    // Checa colisão antes de mover
    if (!checkCollisionForSouls(newPos, wallBoxes, areaBoxes, collumnsBoxes, blockBoxes)) {
      cacodemon.mesh.position.copy(newPos);
    }

    cacodemon.mesh.lookAt(player.position);

    // Dispara se estiver próximo
    if (dist < 80 && now - cacodemon.timers.lastFire > fireInterval) {
      const projectile = createProjectile(cacodemon.mesh.position, forwardDir);
      projectiles.push(projectile);
      cacodemon.timers.lastFire = now;
    }
  }

  // Atualiza projéteis
  for (let i = projectiles.length - 1; i >= 0; i--) {
  const p = projectiles[i];
  p.mesh.position.add(p.dir.clone().multiplyScalar(projectileSpeed));

  const collision = checkProjectileCollision(p, player, wallBoxes, areaBoxes, collumnsBoxes, blockBoxes);

  if (collision === 'player') {
    console.log('Jogador atingido!');
    // Aqui você pode aplicar dano ao jogador
    scene.remove(p.mesh);
    projectiles.splice(i, 1);
    continue;
  }

  if (collision === 'world' || collision === 'ground' || Date.now() - p.spawnTime > 5000) {
    scene.remove(p.mesh);
    projectiles.splice(i, 1);
  }
}
}

export { cacodemons, projectiles };

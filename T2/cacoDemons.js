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

function createHealthBar() {
  const maxWidth = 4;
  const height = 0.3;

  const backgroundGeo = new THREE.PlaneGeometry(maxWidth, height);
  const backgroundMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const background = new THREE.Mesh(backgroundGeo, backgroundMat);

  const foregroundGeo = new THREE.PlaneGeometry(maxWidth, height);
  const foregroundMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const foreground = new THREE.Mesh(foregroundGeo, foregroundMat);
  foreground.position.z = 0.01; // evita z-fighting

  const barGroup = new THREE.Group();
  barGroup.add(background);
  barGroup.add(foreground);
  barGroup.position.set(0, 5, 0); // altura acima do cacodemon

  barGroup.userData = {
    foreground,
    maxWidth
  };

  return barGroup;
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

export function spawnCacodemons(blockBoxes) {

  const numToSpawn = 3;
  if (blockBoxes.length < numToSpawn) {
    return;
  }

  // Copia e embaralha blocos para garantir unicidade e aleatoriedade
  const shuffledBlocks = [...blockBoxes];
  shuffleArray(shuffledBlocks);

  for (let i = 0; i < numToSpawn; i++) {
    const block = shuffledBlocks[i]; // sem reutilização
    const center = block.getCenter(new THREE.Vector3());
    
    const cacodemon = {
      mesh: createCacodemonMesh(),
      hp: 50,
      timers: {
        lastFire: 0
      },
      state: 'passive'
    };
    const healthBar = createHealthBar();
    cacodemon.mesh.add(healthBar);
    cacodemon.healthBar = healthBar;
    cacodemon.maxHp = cacodemon.hp;
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
  const tmpVec = new THREE.Vector3();
  const moveVec = new THREE.Vector3();
  const sideVec = new THREE.Vector3();
  const newPos = new THREE.Vector3();

  for (const cacodemon of cacodemons) {
    if (cacodemon.hp <= 0) continue;

    // Atualiza barra de vida
    const percent = Math.max(cacodemon.hp / cacodemon.maxHp, 0);
    const bar = cacodemon.healthBar.userData.foreground;
    bar.scale.x = percent;
    bar.position.x = -(1 - percent) * cacodemon.healthBar.userData.maxWidth / 2;


    // Direção até o jogador
    tmpVec.subVectors(player.position, cacodemon.mesh.position);
    const distToPlayer = tmpVec.length();
    const forwardDir = tmpVec.clone().normalize();

    // === Transições de estado ===
    if (cacodemon.state === 'passive' && distToPlayer < 60) {
      cacodemon.state = 'active';
    } else if (cacodemon.state === 'active' && distToPlayer > 100) {
      cacodemon.state = 'passive';
    }

    // === PASSIVE ===
    if (cacodemon.state === 'passive') {
      // Movimento de patrulha leve
      const time = now * 0.001 + cacodemon.mesh.id;
      const dx = Math.sin(time) * 0.02;
      const dz = Math.cos(time * 0.5) * 0.02;

      moveVec.set(dx, 0, dz);
      newPos.copy(cacodemon.mesh.position).add(moveVec);

      if (!checkCollisionForSouls(newPos, wallBoxes, areaBoxes, collumnsBoxes, blockBoxes)) {
        cacodemon.mesh.position.copy(newPos);
      }

      const targetLookPos = new THREE.Vector3(
          cacodemon.mesh.position.x + dx,
          cacodemon.mesh.position.y,
          cacodemon.mesh.position.z + dz
        );
        cacodemon.mesh.lookAt(targetLookPos);

    // === ACTIVE ===
    } else if (cacodemon.state === 'active') {
      // Persegue o jogador
      moveVec.copy(forwardDir).multiplyScalar(0.04);
      newPos.copy(cacodemon.mesh.position).add(moveVec);

      if (!checkCollisionForSouls(newPos, wallBoxes, areaBoxes, collumnsBoxes, blockBoxes)) {
        cacodemon.mesh.position.copy(newPos);
      }

      // Ataca se estiver no intervalo de tiro
      if (distToPlayer < 80 && now - cacodemon.timers.lastFire > fireInterval) {
        const projectile = createProjectile(cacodemon.mesh.position, forwardDir);
        projectiles.push(projectile);
        cacodemon.timers.lastFire = now;
      }

    cacodemon.mesh.lookAt(player.position);
    }
    cacodemon.healthBar.lookAt(player.position);
  }

  // === Atualiza projéteis ===
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    tmpVec.copy(p.dir).multiplyScalar(projectileSpeed);
    p.mesh.position.add(tmpVec);

    const collision = checkProjectileCollision(p, player, wallBoxes, areaBoxes, collumnsBoxes, blockBoxes);

    if (collision === 'player') {
      console.log('Jogador atingido!');
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

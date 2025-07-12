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

function getRandomOffsetTarget(position, radius = 10) {
  const angle = Math.random() * Math.PI * 2;
  const dx = Math.cos(angle) * radius;
  const dz = Math.sin(angle) * radius;
  return new THREE.Vector3(position.x + dx, position.y, position.z + dz);
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
        lastFire: 0,
        idleUntil: 0
      },
      patrolTarget: null,
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
if (now < cacodemon.timers.idleUntil) {
    // Está parado esperando
    cacodemon.mesh.lookAt(player.position); // olha ocasionalmente
    continue;
  }

  // Define novo destino se não tem ou já chegou
  if (!cacodemon.patrolTarget || cacodemon.mesh.position.distanceTo(cacodemon.patrolTarget) < 1) {
    cacodemon.patrolTarget = getRandomOffsetTarget(cacodemon.mesh.position, 6 + Math.random() * 6); // 6–12 unidades
    return;
  }

  moveVec.subVectors(cacodemon.patrolTarget, cacodemon.mesh.position).setY(0).normalize().multiplyScalar(0.02);
  newPos.copy(cacodemon.mesh.position).add(moveVec);

  if (!checkCollisionForSouls(newPos, wallBoxes, areaBoxes, collumnsBoxes, blockBoxes)) {
    cacodemon.mesh.position.copy(newPos);
    cacodemon.mesh.lookAt(cacodemon.patrolTarget);
  } else {
    // Caso colida, redefine destino
    cacodemon.patrolTarget = getRandomOffsetTarget(cacodemon.mesh.position, 6);
    cacodemon.timers.idleUntil = now + 500; // pequena pausa antes de tentar de novo
  }

    // === ACTIVE ===
    } else if (cacodemon.state === 'active') {
  // Se está parado após atirar, apenas olha o jogador
  if (cacodemon.timers.stoppedUntil && now < cacodemon.timers.stoppedUntil) {
    cacodemon.mesh.lookAt(player.position); // Só olha quando está parado atirando
    continue;
  }

  // Zig-zag + movimento de perseguição
  const forwardSpeed = 0.04;
  moveVec.copy(forwardDir).multiplyScalar(forwardSpeed);

  const timeFactor = now * 0.001 + cacodemon.mesh.id;
  sideVec.crossVectors(forwardDir, new THREE.Vector3(0, 1, 0)).normalize();
  sideVec.multiplyScalar(Math.sin(timeFactor) * 0.3);

  moveVec.add(sideVec);
  newPos.copy(cacodemon.mesh.position).add(moveVec);

  if (!checkCollisionForSouls(newPos, wallBoxes, areaBoxes, collumnsBoxes, blockBoxes)) {
    cacodemon.mesh.position.copy(newPos);

    // Olha na direção do movimento, não para o player
    const targetPos = cacodemon.mesh.position.clone().add(moveVec);
    cacodemon.mesh.lookAt(targetPos);
  }

  // Ataca se estiver no intervalo de tiro
  if (distToPlayer < 80 && now - cacodemon.timers.lastFire > fireInterval) {
    const projectile = createProjectile(cacodemon.mesh.position, forwardDir);
    projectiles.push(projectile);
    cacodemon.timers.lastFire = now;

    // Para e olha para o jogador durante o disparo
    cacodemon.timers.stoppedUntil = now + 700;
    cacodemon.mesh.lookAt(player.position);
  }
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

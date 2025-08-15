import * as THREE from 'three';
import { scene } from './game.js';

const soldiers = [];
const projectiles = [];

const projectileSpeed = 0.6; // Velocidade do disparo
const fireInterval = 10000; // Intervalo entre tiros (ms)

function createSoldierMesh() {
  // Modelo simples: caixa vermelha para teste (substitua por GLTF se quiser)
  const geometry = new THREE.BoxGeometry(1, 2, 1);
  const material = new THREE.MeshStandardMaterial({ color: 0x990000, emissive: 0x440000 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.y = 1; // Altura do soldado
  return mesh;
}

function createProjectile(position, direction) {
  const geo = new THREE.SphereGeometry(0.2, 8, 8);
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
  const backgroundMat = new THREE.MeshBasicMaterial({ color: 0x000000, depthTest: false });
  const background = new THREE.Mesh(backgroundGeo, backgroundMat);

  const foregroundGeo = new THREE.PlaneGeometry(maxWidth, height);
  const foregroundMat = new THREE.MeshBasicMaterial({ color: 0xff0000, depthTest: false });
  const foreground = new THREE.Mesh(foregroundGeo, foregroundMat);
  foreground.position.z = 0.01; //evita z-fighting

  const barGroup = new THREE.Group();
  barGroup.add(background);
  barGroup.add(foreground);
  barGroup.position.set(0, 3.5, 0); //posição acima da cabeça

  barGroup.userData = {
    foreground,
    maxWidth
  };

  return barGroup;
}

export function spawnSoldiers() {
  const numSoldiers = 8;

  for (let i = 0; i < numSoldiers; i++) {
    const mesh = createSoldierMesh();

    const x = 100 + Math.random() * (210 - 100);
    const z = -150 + Math.random() * (-80 + 150);

    mesh.position.set(x, 1, z); // ajustar Y para 1

    const healthBar = createHealthBar();
    mesh.add(healthBar);

    const soldier = {
      mesh,
      hp: 30,
      maxHp: 30,
      timers: {
        lastFire: 0,
        stoppedUntil: 0,
      }
    };

    soldier.healthBar = healthBar;

    scene.add(mesh);
    soldiers.push(soldier);
  }
}

export function checkCollisionForSoldiers(newPos, wallBoxes, areaBoxes, area3Boxes, collumnsBoxes, blockBoxes) //Checa a colisão dos cacodemons
{
  const futureBB = new THREE.Box3().setFromCenterAndSize(newPos, new THREE.Vector3(2, 2, 2)); //Tamanho diferente do lostsoul, pois o cacodemon é maior

  //Testa colunas
  for (const collumn of collumnsBoxes) {
    if (futureBB.intersectsBox(collumn)) {
      return true;
    }
  }
  //Testa blocos
  for (const block of blockBoxes) {
    if (futureBB.intersectsBox(block)) {
      return true;
    }
  }
  //Testa paredes
  for (const wall of wallBoxes) {
    if (futureBB.intersectsBox(wall)) {
      return true;
    }
  }
  //Testa areas
  for (const area of areaBoxes) {
    if (futureBB.intersectsBox(area)) {
      return true;
    }
  }

  for (const area of area3Boxes) {
    if (futureBB.intersectsBox(area)) {
      return true;
    }
  }

  //Evita colisão com o chão
  if (newPos.y < 0)
    {
    return true;
    }

    return false;
}


function checkProjectileCollision(projectile, player, wallBoxes, areaBoxes, area3Boxes, collumnsBoxes, blockBoxes) {
  const projectileBB = new THREE.Box3().setFromCenterAndSize(
    projectile.mesh.position,
    new THREE.Vector3(0.5, 0.5, 0.5)
  );

  // Colisão com o jogador
  const playerBB = new THREE.Box3().setFromObject(player);
  if (projectileBB.intersectsBox(playerBB)) {
    return 'player';
  }

  // Colisão com o mundo
  for (const boxList of [wallBoxes, areaBoxes, area3Boxes, collumnsBoxes, blockBoxes]) {
    for (const box of boxList) {
      if (projectileBB.intersectsBox(box)) {
        return 'world';
      }
    }
  }

  // Colisão com o chão
  if (projectile.mesh.position.y < 0.1) {
    return 'ground';
  }

  return null;
}

export function updateSoldiers(player, wallBoxes, areaBoxes, area3Boxes, collumnsBoxes, blockBoxes) {
  const now = Date.now();
  const tmpVec = new THREE.Vector3();
  const moveVec = new THREE.Vector3();
  const sideVec = new THREE.Vector3();
  const newPos = new THREE.Vector3();

  for (const soldier of soldiers) {
    if (soldier.hp <= 0) continue;

    // Atualiza barra de vida
    const percent = Math.max(soldier.hp / soldier.maxHp, 0);
    const bar = soldier.healthBar.userData.foreground;
    bar.scale.x = percent;
    bar.position.x = -(1 - percent) * soldier.healthBar.userData.maxWidth / 2;

    // Direção ao jogador
    tmpVec.subVectors(player.position, soldier.mesh.position);
    const distToPlayer = tmpVec.length();
    const forwardDir = tmpVec.clone().normalize();

    // Se está parado para atirar, só olha para o jogador
    if (soldier.timers.stoppedUntil && now < soldier.timers.stoppedUntil) {
      soldier.mesh.lookAt(player.position);
      continue;
    }

    // Movimento com zig-zag lateral
    const forwardSpeed = 0.002;
    moveVec.copy(forwardDir).multiplyScalar(forwardSpeed);

    const timeFactor = now * 0.001 + soldier.mesh.id;
    sideVec.crossVectors(forwardDir, new THREE.Vector3(0, 1, 0)).normalize();
    sideVec.multiplyScalar(Math.sin(timeFactor * 0.03) * 0.3); // zig-zag mais rápido e amplitude 0.3

    moveVec.add(sideVec);

    newPos.copy(soldier.mesh.position).add(moveVec);

    // Checar colisão (reaproveite a função do cacodemon ou adapte)
    // Se não colidir, move o soldado
    if (!checkCollisionForSoldiers(newPos, wallBoxes, areaBoxes, area3Boxes, collumnsBoxes, blockBoxes)) {
      soldier.mesh.position.copy(newPos);

      // Olha na direção do movimento
      const lookTarget = soldier.mesh.position.clone().add(moveVec);
      soldier.mesh.lookAt(lookTarget);
    }

    // Atira se perto o suficiente e cooldown liberado
    if (distToPlayer < 80 && now - soldier.timers.lastFire > fireInterval) {
      const projectile = createProjectile(soldier.mesh.position, forwardDir);
      projectiles.push(projectile);
      soldier.timers.lastFire = now;

      // Para e olha para o jogador
      soldier.timers.stoppedUntil = now + 700;
      soldier.mesh.lookAt(player.position);
    }

    soldier.healthBar.lookAt(player.position);
  }

  // Atualiza projéteis
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    tmpVec.copy(p.dir).multiplyScalar(projectileSpeed);
    p.mesh.position.add(tmpVec);

    const collision = checkProjectileCollision(p, player, wallBoxes, areaBoxes, area3Boxes, collumnsBoxes, blockBoxes);

    if (collision === 'player') {
      console.log('Jogador atingido por projétil do Soldado!');

      if (window.takeDamage && !window.godModeEnabled) {
        window.takeDamage(15);
        if (window.soundManager) window.soundManager.playPlayerDamage();
      }

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

export { soldiers, projectiles };
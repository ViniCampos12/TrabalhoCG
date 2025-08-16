import * as THREE from 'three';
import { scene } from './game.js';

const soldiers = [];

const projectileSpeed = 0.6; // Velocidade do disparo
const fireInterval = 5000; // Intervalo entre tiros (ms)

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

const forwardSpeed = 0.02;
moveVec.copy(forwardDir).multiplyScalar(forwardSpeed);

// Zig-zag controlado
const zigzagFrequency = 0.0005; // aumenta a frequência do "zig"
const zigzagAmplitude = 0.1;   // ajusta a largura do "zag"

const timeFactor = now * zigzagFrequency + soldier.mesh.id;
sideVec.crossVectors(forwardDir, new THREE.Vector3(0, 1, 0)).normalize();
sideVec.multiplyScalar(Math.sin(timeFactor) * zigzagAmplitude);

moveVec.add(sideVec);


    newPos.copy(soldier.mesh.position).add(moveVec);

    if (!checkCollisionForSoldiers(newPos, wallBoxes, areaBoxes, area3Boxes, collumnsBoxes, blockBoxes)) {
      soldier.mesh.position.copy(newPos);
      const lookTarget = soldier.mesh.position.clone().add(moveVec);
      soldier.mesh.lookAt(lookTarget);
    }

    // Tiro tipo "scan" com Raycasting
    if (distToPlayer < 80 && now - soldier.timers.lastFire > fireInterval) {
  const origin = soldier.mesh.position.clone();
  origin.y += 1.5;

  const direction = forwardDir.clone().normalize();
  const raycaster = new THREE.Raycaster(origin, direction);

  const intersects = raycaster.intersectObject(player, false);

  if (intersects.length > 0 && !window.godModeEnabled) {
    if (window.takeDamage) {
      window.takeDamage(15);
    }

    if (window.soundManager) {
      window.soundManager.play('playerDamage');
    }

    console.log('Soldado acertou o jogador com tiro scan!');
  }

  soldier.timers.lastFire = now;
  soldier.timers.stoppedUntil = now + 700;
  soldier.mesh.lookAt(player.position);
}


    soldier.healthBar.lookAt(player.position);
  }
}


export { soldiers };
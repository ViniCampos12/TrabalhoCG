// lostSoul.js
import * as THREE from 'three';
import { scene } from './game.js'; // assegure que main.js exporte scene
import { OBJLoader } from '../build/jsm/loaders/OBJLoader.js';

const lostSouls = [];
const numSouls = 5;
const safeDist = 30;
const chargeDur = 1000;
const cooldownDur = 2000;

const loader = new OBJLoader();
let scrullPrefab = null;

loader.load('../assets/skull.obj', (obj) => {
  scrullPrefab = obj;
}, undefined, (err) => {
  console.error('Erro ao carregar scrull.obj:', err);
});

// Cria mesh simples — substitua por asset real se preferir
function createMesh() {
 if (!scrullPrefab) {
    console.warn("scrullPrefab ainda não carregado");
    return null; // ou um cubo temporário, se quiser
  }

  const soul = scrullPrefab.clone(true); // clona o modelo completo
  soul.traverse(child => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      child.material = child.material.clone();
      
    }
  });

  soul.scale.set(2, 2, 2); // ajuste de tamanho
  return soul;
}

export function spawnLostSouls() {
  if (!scrullPrefab) {
    console.warn("Modelo scrull ainda não carregado. Tente novamente depois.");
    return;
  }

  for (let i = 0; i < numSouls; i++) {
    const mesh = createMesh();
    if (!mesh) continue;

    const soul = {
      mesh,
      hp: 20,
      state: 'patrol',
      chargeDir: new THREE.Vector3(),
      timers: { chargeStart: 0, lastCharge: 0 }
    };

    mesh.position.set(
      Math.random() * -80 + -120,
      10,
      Math.random() * -60 - 100
    );

    scene.add(mesh);
    lostSouls.push(soul);
  }
}


// Função para checar colisão dos Lost Souls
export function checkCollisionForSouls(newPos, wallBoxes, areaBoxes, collumnsBoxes, blockBoxes) {
  const futureBB = new THREE.Box3().setFromCenterAndSize(newPos, new THREE.Vector3(5, 4, 5));

  // Testa colunas
  for (const collumn of collumnsBoxes) {
    if (futureBB.intersectsBox(collumn)) {
      return true;
    }
  }
  // Testa blocos
  for (const block of blockBoxes) {
    if (futureBB.intersectsBox(block)) {
      return true;
    }
  }
  // Testa paredes
  for (const wall of wallBoxes) {
    if (futureBB.intersectsBox(wall)) {
      return true;
    }
  }
  // Testa áreas proibidas (exemplo)
  for (const area of areaBoxes) {
    if (futureBB.intersectsBox(area)) {
      return true;
    }
  }

if (newPos.y < 2) {
  return true;
}

  return false;
}

// Atualização dos Lost Souls adaptada
export function updateLostSouls(player, wallBoxes, areaBoxes, collumnsBoxes, blockBoxes) {
    const now = Date.now();
  const tmpVec = new THREE.Vector3();
const newPos = new THREE.Vector3();
const moveVec = new THREE.Vector3();

for (const soul of lostSouls) {
  if (soul.hp <= 0) continue;

  tmpVec.subVectors(player.position, soul.mesh.position);
  const dist = tmpVec.length();

  if (dist < safeDist && soul.state !== 'charge' && now - soul.timers.lastCharge > cooldownDur) {
    soul.state = 'charge';
    soul.chargeDir.copy(tmpVec.normalize());
    soul.timers.chargeStart = now;
  }

  // ...existing code...
  if (soul.state === 'patrol') {
    const patrolSpeed = 0.05;
    const dx = Math.sin(now * 0.001 + soul.mesh.id) * patrolSpeed;
    const dz = Math.cos(now * 0.001 + soul.mesh.id) * patrolSpeed;

    newPos.copy(soul.mesh.position).add(new THREE.Vector3(dx, 0, dz));
    newPos.y = Math.max(newPos.y, 10); // Garante que nunca vá abaixo de Y=15

    if (!checkCollisionForSouls(newPos, wallBoxes, areaBoxes, collumnsBoxes, blockBoxes)) {
      soul.mesh.position.copy(newPos);
    }
  } else if (soul.state === 'charge') {
    moveVec.copy(soul.chargeDir).multiplyScalar(1.2);
    newPos.copy(soul.mesh.position).add(moveVec);
    newPos.y = Math.max(newPos.y, 10); // Garante que nunca vá abaixo de Y=15

    if (!checkCollisionForSouls(newPos, wallBoxes, areaBoxes, collumnsBoxes, blockBoxes)) {
      soul.mesh.position.copy(newPos);
    } else {
      soul.state = 'cooldown';
      soul.timers.lastCharge = now;
    }

    if (now - soul.timers.chargeStart > chargeDur) {
      soul.state = 'cooldown';
      soul.timers.lastCharge = now;
    }
  } else if (soul.state === 'cooldown') {
    moveVec.set(0, 0, 0.05);
    newPos.copy(soul.mesh.position).add(moveVec);
    newPos.y = Math.max(newPos.y, 10); // Garante que nunca vá abaixo de Y=15
    
    if (!checkCollisionForSouls(newPos, wallBoxes, areaBoxes, collumnsBoxes, blockBoxes)) {
      soul.mesh.position.copy(newPos);
    }

    if (now - soul.timers.lastCharge > cooldownDur / 2) {
      soul.state = 'patrol';
    }
  }
// ...existing code...

  soul.mesh.lookAt(player.position);
}

}

export {lostSouls};
// lostSoul.js
import * as THREE from 'three';
import { scene } from './game.js'; // assegure que main.js exporte scene

const lostSouls = [];
const numSouls = 5;
const safeDist = 30;
const chargeDur = 1000;
const cooldownDur = 2000;

// Cria mesh simples — substitua por asset real se preferir
function createMesh() {
  const geo = new THREE.SphereGeometry(2, 16, 16);
  const mat = new THREE.MeshStandardMaterial({ color: 0xff3300, emissive: 0xaa0000 });
  return new THREE.Mesh(geo, mat);
}

export function spawnLostSouls() {
  for (let i = 0; i < numSouls; i++) {
    const soul = {
      mesh: createMesh(),
      hp: 20,
      state: 'patrol',
      chargeDir: new THREE.Vector3(),
      timers: { chargeStart: 0, lastCharge: 0 }
    };
    soul.mesh.position.set(
      Math.random() * 80 - 40,
      5,
      Math.random() * 80 - 40
    );
    scene.add(soul.mesh);
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

  if (soul.state === 'patrol') {
    const patrolSpeed = 0.05;
    const dx = Math.sin(now * 0.001 + soul.mesh.id) * patrolSpeed;
    const dz = Math.cos(now * 0.001 + soul.mesh.id) * patrolSpeed;

    newPos.copy(soul.mesh.position).add(new THREE.Vector3(dx, 0, dz));

    if (!checkCollisionForSouls(newPos, wallBoxes, areaBoxes, collumnsBoxes, blockBoxes)) {
      soul.mesh.position.copy(newPos);
    }
  } else if (soul.state === 'charge') {
    moveVec.copy(soul.chargeDir).multiplyScalar(1.2);
    newPos.copy(soul.mesh.position).add(moveVec);

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

    if (!checkCollisionForSouls(newPos, wallBoxes, areaBoxes, collumnsBoxes, blockBoxes)) {
      soul.mesh.position.copy(newPos);
    }

    if (now - soul.timers.lastCharge > cooldownDur / 2) {
      soul.state = 'patrol';
    }
  }

  soul.mesh.lookAt(player.position);
}

}


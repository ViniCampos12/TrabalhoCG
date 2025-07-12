import * as THREE from 'three';
import { scene } from './game.js'; // assegure que main.js exporte scene
import { OBJLoader } from '../build/jsm/loaders/OBJLoader.js';
import { MTLLoader } from '../build/jsm/loaders/MTLLoader.js';

const lostSouls = [];
const numSouls = 5;
const safeDist = 50;
const chargeDur = 1000;
const cooldownDur = 5000;

let scrullPrefab = null;

const mtlLoader = new MTLLoader();
mtlLoader.setPath('../assets/skull/');
mtlLoader.load('skull.mtl', (materials) => {
  materials.preload();

  const objLoader = new OBJLoader();
  objLoader.setMaterials(materials);
  objLoader.setPath('../assets/');
  objLoader.load('skull.obj', (obj) => {
    scrullPrefab = obj;
  });
}, undefined, (err) => {
  console.error('Erro ao carregar .mtl:', err);
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

  soul.scale.set(1.5, 1.5, 1.5); // ajuste de tamanho
  return soul;
}

function getRandomPatrolTarget(origin, radius = 10) {
  const angle = Math.random() * Math.PI * 2;
  const dx = Math.cos(angle) * radius;
  const dz = Math.sin(angle) * radius;
  return new THREE.Vector3(origin.x + dx, origin.y, origin.z + dz);
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
  foreground.position.z = 0.01; // evita z-fighting

  const barGroup = new THREE.Group();
  barGroup.add(background);
  barGroup.add(foreground);
  barGroup.position.set(0, 3.5, 0); // posição acima da cabeça

  barGroup.userData = {
    foreground,
    maxWidth
  };

  return barGroup;
}

export function spawnLostSouls() {
  if (!scrullPrefab) {
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
        timers: {
    chargeStart: 0,
    lastCharge: 0,
    patrolDelay: 0
    },
    patrolTarget: null,
    idleUntil: 0,
    };

    const healthBar = createHealthBar();
    soul.mesh.add(healthBar);
    soul.healthBar = healthBar;
    soul.maxHp = soul.hp;

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

  if (soul.hp <= 0 && soul.state !== 'dying') {
    soul.state = 'dying';
    soul.fade = {
      startTime: now,
      duration: 5000
    };
  }

if (soul.state === 'dying') {
  const elapsed = now - soul.fade.startTime;
  const alpha = Math.max(1 - (elapsed / soul.fade.duration), 0);

  soul.mesh.traverse((child) => {
    if (child.isMesh && child.material) {
      if (Array.isArray(child.material)) {
        for (const mat of child.material) {
          mat.transparent = true;
          mat.opacity = alpha;
        }
      } else {
        child.material.transparent = true;
        child.material.opacity = alpha;
      }
    }
  });

  if (soul.healthBar) {
    soul.healthBar.traverse((child) => {
      if (child.material) {
        child.material.transparent = true;
        child.material.opacity = alpha;
      }
    });
  }

  if (elapsed >= soul.fade.duration) {
    scene.remove(soul.mesh);
    const index = lostSouls.indexOf(soul);
    if (index !== -1) lostSouls.splice(index, 1);
  }

  continue;
}

  const percent = Math.max(soul.hp / soul.maxHp, 0);
  const bar = soul.healthBar.userData.foreground;
  bar.scale.x = percent;
  bar.position.x = -(1 - percent) * soul.healthBar.userData.maxWidth / 2;

  tmpVec.subVectors(player.position, soul.mesh.position);
  const dist = tmpVec.length();

 const isCoolingDown = soul.state === 'cooldown' || now - soul.timers.lastCharge < cooldownDur;

    // Troca para estado "active" quando estiver longe, mas perto o suficiente
    if (dist > safeDist && dist < 100 && soul.state !== 'active' && !isCoolingDown) {
      soul.state = 'active';
    }

    // Inicia o charge
    if (dist < safeDist && soul.state !== 'charge' && !isCoolingDown) {
      soul.state = 'charge';
      soul.chargeDir.copy(tmpVec.normalize());
      soul.timers.chargeStart = now;
    }

    // --- STATE: ACTIVE (persegue devagar) ---
    if (soul.state === 'active') {
      moveVec.subVectors(player.position, soul.mesh.position).setY(0).normalize().multiplyScalar(0.1);
      newPos.copy(soul.mesh.position).add(moveVec);

      if (!checkCollisionForSouls(newPos, wallBoxes, areaBoxes, collumnsBoxes, blockBoxes)) {
        soul.mesh.position.copy(newPos);
        soul.mesh.lookAt(player.position);
      }

const chargeTimeOver = now - soul.timers.chargeStart > chargeDur;

        if (!chargeTimeOver) {
        soul.mesh.position.copy(newPos);
      } else {
        soul.state = 'cooldown';
        soul.timers.lastCharge = now;
      }
    }

    // --- STATE: PATROL (anda em padrão) ---
else if (soul.state === 'patrol') {
  if (now < soul.idleUntil) {
    return; // ainda esperando
  }

  // Se ainda não tem destino ou chegou muito perto
  if (!soul.patrolTarget || soul.mesh.position.distanceTo(soul.patrolTarget) < 1) {
    soul.patrolTarget = getRandomPatrolTarget(soul.mesh.position, 10);
    return;
  }

  moveVec.subVectors(soul.patrolTarget, soul.mesh.position).setY(0).normalize().multiplyScalar(0.05);
  newPos.copy(soul.mesh.position).add(moveVec);

  if (!checkCollisionForSouls(newPos, wallBoxes, areaBoxes, collumnsBoxes, blockBoxes)) {
    soul.mesh.position.copy(newPos);
    soul.mesh.lookAt(soul.patrolTarget);
  } else {
    // Se bateu em algo, escolhe novo ponto
    soul.patrolTarget = getRandomPatrolTarget(soul.mesh.position, 10);
  }
}

    // --- STATE: CHARGE (avança rápido) ---
    else if (soul.state === 'charge') {
      moveVec.copy(soul.chargeDir).multiplyScalar(1.2);
      newPos.copy(soul.mesh.position).add(moveVec);

      const chargeTimeOver = now - soul.timers.chargeStart > chargeDur;
      const blocked = checkCollisionForSouls(newPos, wallBoxes, areaBoxes, collumnsBoxes, blockBoxes);

      if (!blocked && !chargeTimeOver) {
        soul.mesh.position.copy(newPos);
      } else {
        soul.state = 'cooldown';
        soul.timers.lastCharge = now;
      }
    }

    // --- STATE: COOLDOWN (persegue devagar) ---
    else if (soul.state === 'cooldown') {
      moveVec.subVectors(player.position, soul.mesh.position).setY(0).normalize().multiplyScalar(0.1);
      newPos.copy(soul.mesh.position).add(moveVec);

      if (!checkCollisionForSouls(newPos, wallBoxes, areaBoxes, collumnsBoxes, blockBoxes)) {
        soul.mesh.position.copy(newPos);
        soul.mesh.lookAt(player.position);
      }

      if (now - soul.timers.lastCharge > cooldownDur) {
        soul.state = 'patrol';
      }
    }

    // Olhar para o player no charge
    if (soul.state === 'charge') {
      soul.mesh.lookAt(player.position);
    }

    // Sempre olha para o player a barra de vida
    soul.healthBar.lookAt(player.position);
  }
}

export {lostSouls};
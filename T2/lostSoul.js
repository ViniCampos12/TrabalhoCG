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
mtlLoader.setPath('assets/skull/');
mtlLoader.load('skull.mtl', (materials) => {
  materials.preload();

  const objLoader = new OBJLoader();
  objLoader.setMaterials(materials);
  objLoader.setPath('assets/');
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
    return null; //ou um cubo temporário, se quiser
  }

  const soul = scrullPrefab.clone(true); //clona o modelo completo
  soul.traverse(child => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      child.material = child.material.clone();
      
    }
  });

  soul.scale.set(1.5, 1.5, 1.5); //ajuste de tamanho
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

export function spawnLostSouls()
{
  if (!scrullPrefab) {
    return;
  }

  for (let i = 0; i < numSouls; i++) {
    const mesh = createMesh();
    if (!mesh) continue;

    //Objeto lostSoul
    const soul = {
      mesh,
      hp: 20, //Vida da lostSoul
      state: 'patrol', //Começa no estado de patrulha
      chargeDir: new THREE.Vector3(),
        timers: {
    chargeStart: 0, //Indica começo do "charge"
    lastCharge: 0, //Indica quando foi o último "charge"
    patrolDelay: 0 //Delay da patrulha
    },
    patrolTarget: null, //Alvo da patrulha começa apontando para null
    idleUntil: 0, //Tempo de espera
    };

    const healthBar = createHealthBar(); //Cria barra de vida
    soul.mesh.add(healthBar);
    soul.healthBar = healthBar;
    soul.maxHp = soul.hp;

    //Posiciona as lostSouls aleatoriamente em cima da area 1
    mesh.position.set(
      Math.random() * -80 + -120,
      10,
      Math.random() * -60 - 100
    );

    scene.add(mesh);
    lostSouls.push(soul);
  }
}


//Checa a colisão dos Lost Souls
export function checkCollisionForSouls(newPos, wallBoxes, areaBoxes, collumnsBoxes, blockBoxes)
{
  const futureBB = new THREE.Box3().setFromCenterAndSize(newPos, new THREE.Vector3(7, 7, 7)); //Define tamanho da hitbox das lostSouls

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

//Evita colisão com o chão
if (newPos.y < 2) {
  return true;
}

  return false;
}

//Atualização das lostSouls
export function updateLostSouls(player, wallBoxes, areaBoxes, collumnsBoxes, blockBoxes)
{
const now = Date.now();
const tmpVec = new THREE.Vector3();
const newPos = new THREE.Vector3();
const moveVec = new THREE.Vector3();

//OPACIDADE
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
//FIM DA OPACIDADE

  //Atualiza barra de vida
  const percent = Math.max(soul.hp / soul.maxHp, 0);
  const bar = soul.healthBar.userData.foreground;
  bar.scale.x = percent;
  bar.position.x = -(1 - percent) * soul.healthBar.userData.maxWidth / 2;

  //Direção até o jogador
  tmpVec.subVectors(player.position, soul.mesh.position);
  const dist = tmpVec.length();

 const isCoolingDown = soul.state === 'cooldown' || now - soul.timers.lastCharge < cooldownDur;

    //Transição para o estado ativo quando estiver perto o suficiente, mas longe para o "charge"
    if (dist > safeDist && dist < 100 && soul.state !== 'active' && !isCoolingDown) {
      soul.state = 'active';
    }

    //Inicia o "charge"
    if (dist < safeDist && soul.state !== 'charge' && !isCoolingDown) {
      soul.state = 'charge';
      soul.chargeDir.copy(tmpVec.normalize());
      soul.timers.chargeStart = now;
    }

    //Estado ativo (ataque)
    if (soul.state === 'active')
      {
      //Movimentação de perseguição
      moveVec.subVectors(player.position, soul.mesh.position).setY(0).normalize().multiplyScalar(0.1);
      newPos.copy(soul.mesh.position).add(moveVec);

      //Checagem de colisão
      if (!checkCollisionForSouls(newPos, wallBoxes, areaBoxes, collumnsBoxes, blockBoxes)) {
        soul.mesh.position.copy(newPos);
        soul.mesh.lookAt(player.position);
      }

      //Determina fim do estado de "charge"
      const chargeTimeOver = now - soul.timers.chargeStart > chargeDur;

      //Inicia estado de "cooldown"
        if (!chargeTimeOver) {
        soul.mesh.position.copy(newPos);
      } else {
        soul.state = 'cooldown';
        soul.timers.lastCharge = now;
      }
    }

    //Estado de patrulha (passivo)
    else if (soul.state === 'patrol') {

     //Se ainda não tem destino ou chegou muito perto
    if (!soul.patrolTarget || soul.mesh.position.distanceTo(soul.patrolTarget) < 1)
      {
      soul.patrolTarget = getRandomPatrolTarget(soul.mesh.position, 10);
      return;
      }

      //Movimentação no eixo Y
      moveVec.subVectors(soul.patrolTarget, soul.mesh.position).setY(0).normalize().multiplyScalar(0.05);
      newPos.copy(soul.mesh.position).add(moveVec);

      //Checa colisão
      if (!checkCollisionForSouls(newPos, wallBoxes, areaBoxes, collumnsBoxes, blockBoxes)) {
        soul.mesh.position.copy(newPos);
        soul.mesh.lookAt(soul.patrolTarget);
      } else {
        //Escolhe novo alvo
        soul.patrolTarget = getRandomPatrolTarget(soul.mesh.position, 10);
  }
}

    //Estado "charge" (carga/dash)
    else if (soul.state === 'charge') {
      //Avança em alta velocidade em direção ao jogador
      moveVec.copy(soul.chargeDir).multiplyScalar(1.2);
      newPos.copy(soul.mesh.position).add(moveVec);

      //Determina fim do estado de "charge"
      const chargeTimeOver = now - soul.timers.chargeStart > chargeDur;
      const blocked = checkCollisionForSouls(newPos, wallBoxes, areaBoxes, collumnsBoxes, blockBoxes);

      //Inicia estado de "cooldown"
      if (!blocked && !chargeTimeOver) {
        soul.mesh.position.copy(newPos);
      } else {
        soul.state = 'cooldown';
        soul.timers.lastCharge = now;
      }
    }

    //Estado "cooldown" (recarga)
    else if (soul.state === 'cooldown') //Não volta a entrar em "charge" enquanto não passar o tempo de cooldown
      {
      //Movimento de perseguição, mas sem "charge"
      moveVec.subVectors(player.position, soul.mesh.position).setY(0).normalize().multiplyScalar(0.1);
      newPos.copy(soul.mesh.position).add(moveVec);

      //Checa colisão
      if (!checkCollisionForSouls(newPos, wallBoxes, areaBoxes, collumnsBoxes, blockBoxes)) {
        soul.mesh.position.copy(newPos);
        soul.mesh.lookAt(player.position);
      }

      //Ao fim do tempo de recarga, retorna ao estado de patrulha
      if (now - soul.timers.lastCharge > cooldownDur) {
        soul.state = 'patrol';
      }
    }

    //Olha para o jogador no "charge"
    if (soul.state === 'charge') {
      soul.mesh.lookAt(player.position);
    }

    //Barra de vida sempre olha para o jogador
    soul.healthBar.lookAt(player.position);
  }
}

export {lostSouls};
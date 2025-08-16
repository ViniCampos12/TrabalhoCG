import * as THREE from 'three';
import { scene } from './game.js';
import { GLTFLoader } from '../build/jsm/loaders/GLTFLoader.js';
import { spawnLostSoulsFromPainElemental } from './lostSoul.js';
import { checkCollisionForCacodemons } from './cacoDemons.js';

const painElementals = [];

const fireInterval = 5000; // tempo entre disparos
const maxLostSouls = 5;    // máximo de Lost Souls invocadas

let painElementalPrefab = null;

// Carrega modelo do Pain Elemental
const gltfLoader = new GLTFLoader();
gltfLoader.load('assets/pain/painelemental.glb', (gltf) => {
  painElementalPrefab = gltf.scene;

  painElementalPrefab.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;

      if (child.material) {
        child.material.transparent = false;
        child.material.opacity = 1.0;
        if (!child.material.color || child.material.color.getHex() === 0x000000) {
          child.material.color.setHex(0x663399);
        }
        if (child.material.emissive) {
          child.material.emissive.setHex(0x220022);
        }
      }
    }
  });

}, undefined, (error) => {
  console.error('Erro ao carregar painelemental.glb:', error);
});

function createPainElementalMesh() {
  if (!painElementalPrefab) {
    console.warn("painElementalPrefab ainda não carregado, usando esfera temporária");
    return new THREE.Mesh(
      new THREE.SphereGeometry(5, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x663399, emissive: 0x220022 })
    );
  }

  const clone = painElementalPrefab.clone(true);
  clone.traverse(child => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      child.material = child.material.clone();
    }
  });
  clone.scale.set(0.02, 0.02, 0.02);
  return clone;
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
  barGroup.position.set(0, 8, 0); //posição acima da cabeça

  barGroup.userData = {
    foreground,
    maxWidth
  };

  return barGroup;
}

export function spawnPainElemental() {
    const mesh = createPainElementalMesh();

    const x = 0
    const z = 120

    mesh.position.set(x, 30, z);

    const pain = {
      mesh,
      hp: 100,
      maxHp: 100,
      state: 'passive',
      timers: {
        lastFire: 0
      },
      lostSoulsShot: 0,
      patrolTarget: null
    };

    const healthBar = createHealthBar();
    pain.mesh.add(healthBar);
    pain.healthBar = healthBar;

    scene.add(pain.mesh);
    painElementals.push(pain);
}

function getRandomOffsetTarget(position, radius = 12) {
  const angle = Math.random() * Math.PI * 2;
  const dx = Math.cos(angle) * radius;
  const dz = Math.sin(angle) * radius;
  return new THREE.Vector3(position.x + dx, position.y, position.z + dz);
}

export function updatePainElementals(player, wallBoxes, areaBoxes, area3Boxes, collumnsBoxes, blockBoxes) {
  const now = Date.now();
  const tmpVec = new THREE.Vector3();
  const moveVec = new THREE.Vector3();
  const sideVec = new THREE.Vector3();
  const newPos = new THREE.Vector3();

  for (const pain of painElementals) {
    if (pain.hp <= 0) continue;

    //Atualiza barra de vida
        const percent = Math.max(pain.hp / pain.maxHp, 0);
        const bar = pain.healthBar.userData.foreground;
        bar.scale.x = percent;
        bar.position.x = -(1 - percent) * pain.healthBar.userData.maxWidth / 2;
    
    
        //Direção até o jogador
        tmpVec.subVectors(player.position, pain.mesh.position);
        const distToPlayer = tmpVec.length();
        const forwardDir = tmpVec.clone().normalize();
    
        //Transições de estado (passivo e ativo)
        if (pain.state === 'passive' && distToPlayer < 80) {
          pain.state = 'active';
        } else if (pain.state === 'active' && distToPlayer > 100) {
          pain.state = 'passive';
        }
    
        //Estado passivo (patrulha)
        if (pain.state === 'passive') {
    
      //Determina movimento, e destino, ou pausa
      if (!pain.patrolTarget || pain.mesh.position.distanceTo(pain.patrolTarget) < 1) {
        pain.patrolTarget = getRandomOffsetTarget(pain.mesh.position, 6 + Math.random() * 6);
        return;
      }
    
      //Movimento no eixo y
      moveVec.subVectors(pain.patrolTarget, pain.mesh.position).setY(0).normalize().multiplyScalar(0.02);
      newPos.copy(pain.mesh.position).add(moveVec);
    
      if (!checkCollisionForCacodemons(newPos, wallBoxes, areaBoxes, area3Boxes, collumnsBoxes, blockBoxes))
        {
        pain.mesh.position.copy(newPos);
        pain.mesh.lookAt(pain.patrolTarget);
      } else {
        //Em caso de colisão recalcula a rota
        pain.patrolTarget = getRandomOffsetTarget(pain.mesh.position, 6);
        pain.patrolTarget.y += 20; //sobe para se soltar do chão
        pain.patrolTarget = getRandomOffsetTarget(pain.mesh.position, 6);
        pain.timers.idleUntil = now + 500; //pequena pausa antes de tentar de novo
      }
    
        //Estado ativo (ataque)
        } else if (pain.state === 'active') {
      if (pain.timers.stoppedUntil && now < pain.timers.stoppedUntil) {
        pain.mesh.lookAt(player.position); //Olha para o jogador quando vai atirar
        continue;
      }
    
      //Movimento de perseguição e zigzag
      const forwardSpeed = 0.01;
      moveVec.copy(forwardDir).multiplyScalar(forwardSpeed);
    
      const timeFactor = now * 0.001 + pain.mesh.id; //Determina velocidade
      sideVec.crossVectors(forwardDir, new THREE.Vector3(0, 1, 0)).normalize();
      sideVec.multiplyScalar(Math.sin(timeFactor) * 0.3); //Determina amplitude
    
      moveVec.add(sideVec);
      newPos.copy(pain.mesh.position).add(moveVec);
    
      if (!checkCollisionForCacodemons(newPos, wallBoxes, areaBoxes, area3Boxes, collumnsBoxes, blockBoxes)) {
        pain.mesh.position.copy(newPos);
    
        //Olha na direção do movimento, não para o jogador
        const targetPos = pain.mesh.position.clone().add(moveVec);
        pain.mesh.lookAt(targetPos);
      }

      if (distToPlayer < 120 && now - pain.timers.lastFire > fireInterval && pain.lostSoulsShot < maxLostSouls) {
        spawnLostSoulsFromPainElemental(pain.mesh.position, forwardDir);
        pain.lostSoulsShot++;
        pain.timers.lastFire = now;
      }

    }
        pain.healthBar.lookAt(player.position);
  }
}

export { painElementals };
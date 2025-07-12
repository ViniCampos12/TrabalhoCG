import * as THREE from 'three';
import { scene } from './game.js';
import { GLTFLoader } from '../build/jsm/loaders/GLTFLoader.js';


const cacodemons = [];
const projectiles = [];

const projectileSpeed = 0.6;
const fireInterval = 2000;

let cacodemonPrefab = null;

// Carrega o modelo GLB
const gltfLoader = new GLTFLoader();
gltfLoader.load('../assets/cacodemon.glb', (gltf) => {
  cacodemonPrefab = gltf.scene;
  
  // Configura propriedades do modelo carregado
  cacodemonPrefab.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      
      // Configura material se existir
      if (child.material) {
        // Garante que não seja transparente
        child.material.transparent = false;
        child.material.opacity = 1.0;
        
        // Adiciona cor vermelha se não tiver cor definida
        if (!child.material.color || child.material.color.getHex() === 0x000000) {
          child.material.color.setHex(0x990000);
        }
        
        // Adiciona brilho emissivo
        if (child.material.emissive) {
          child.material.emissive.setHex(0x440000);
        }
      }
    }
  });
  
  console.log('Modelo cacodemon.glb carregado com sucesso!');
}, undefined, (error) => {
  console.error('Erro ao carregar cacodemon.glb:', error);
});

function createCacodemonMesh() {
  if (!cacodemonPrefab) {
    console.warn("cacodemonPrefab ainda não carregado, usando esfera temporária");
    // Fallback para esfera vermelha se o modelo não carregou
    const geo = new THREE.SphereGeometry(6, 32, 32);
    const mat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0x660000 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  // Clona o modelo GLB carregado
  const clone = cacodemonPrefab.clone(true);
  
  // Configura cada mesh do clone
  clone.traverse(child => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      
      // Clona o material para cada instância
      if (child.material) {
        child.material = child.material.clone();
        
        // Garante opacidade total
        child.material.transparent = false;
        child.material.opacity = 1.0;
        
        // Define cor se necessário
        if (!child.material.color || child.material.color.getHex() === 0x000000) {
          child.material.color.setHex(0x990000);
        }
        
        // Adiciona brilho
        if (child.material.emissive) {
          child.material.emissive.setHex(0x440000);
        }
      } else {
        // Cria material se não existir
        child.material = new THREE.MeshStandardMaterial({
          color: 0x990000,
          emissive: 0x440000
        });
      }
    }
  });

  // Ajusta escala se necessário
  clone.scale.set(0.015, 0.015, 0.015);
  return clone;
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
  const maxWidth = 200; // Aumenta drasticamente para compensar a escala pequena
  const height = 20; // Aumenta a altura também

  const backgroundGeo = new THREE.PlaneGeometry(maxWidth, height);
  const backgroundMat = new THREE.MeshBasicMaterial({ 
    color: 0x000000,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const background = new THREE.Mesh(backgroundGeo, backgroundMat);

  const foregroundGeo = new THREE.PlaneGeometry(maxWidth, height);
  const foregroundMat = new THREE.MeshBasicMaterial({ 
    color: 0xff0000,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const foreground = new THREE.Mesh(foregroundGeo, foregroundMat);
  foreground.position.z = 0.1; // Z-offset maior para a escala pequena

  // Ordem de renderização alta
  background.renderOrder = 9999;
  foreground.renderOrder = 10000;

  const barGroup = new THREE.Group();
  barGroup.add(background);
  barGroup.add(foreground);
  barGroup.position.set(0, 450, 0); // Posição muito mais alta para compensar a escala

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

export function checkCollisionForCacodemons(newPos, wallBoxes, areaBoxes, collumnsBoxes, blockBoxes) {
  const futureBB = new THREE.Box3().setFromCenterAndSize(newPos, new THREE.Vector3(10, 12, 10));

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

if (newPos.y < 10) {
  return true;
}

  return false;
}

export function spawnCacodemons(blockBoxes) {
  const numToSpawn = 3;
  if (blockBoxes.length < numToSpawn) {
    return;
  }

  // Se o modelo ainda não carregou, tenta novamente em 1 segundo
  if (!cacodemonPrefab) {
    console.warn("Modelo cacodemon ainda não carregado. Tentando novamente em 1 segundo...");
    setTimeout(() => spawnCacodemons(blockBoxes), 1000);
    return;
  }

  // Copia e embaralha blocos para garantir unicidade e aleatoriedade
  const shuffledBlocks = [...blockBoxes];
  shuffleArray(shuffledBlocks);

  for (let i = 0; i < numToSpawn; i++) {
    const block = shuffledBlocks[i];
    const center = block.getCenter(new THREE.Vector3());
    
    const mesh = createCacodemonMesh();
    if (!mesh) {
      console.warn(`Não foi possível criar mesh para cacodemon ${i}`);
      continue;
    }
    
    const cacodemon = {
      mesh,
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
    cacodemon.mesh.position.set(center.x, center.y + 20, center.z);
    
    scene.add(cacodemon.mesh);
    cacodemons.push(cacodemon);
  }
  
  console.log(`${cacodemons.length} cacodemons criados com sucesso!`);
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
    if (cacodemon.state === 'passive' && distToPlayer < 80) {
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

  if (!checkCollisionForCacodemons(newPos, wallBoxes, areaBoxes, collumnsBoxes, blockBoxes)) {
    cacodemon.mesh.position.copy(newPos);
    cacodemon.mesh.lookAt(cacodemon.patrolTarget);
  } else {
    // Caso colida, redefine destino
    cacodemon.patrolTarget = getRandomOffsetTarget(cacodemon.mesh.position, 6);
cacodemon.patrolTarget.y += 10; // sobe para se soltar do chão
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

  if (!checkCollisionForCacodemons(newPos, wallBoxes, areaBoxes, collumnsBoxes, blockBoxes)) {
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

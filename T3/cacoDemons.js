import * as THREE from 'three';
import { scene } from './game.js';
import { GLTFLoader } from '../build/jsm/loaders/GLTFLoader.js';
import { soundManager } from './game.js';

const cacodemons = [];
const projectiles = [];

const projectileSpeed = 0.6; //Velocidade de disparo
const fireInterval = 2000; //Cadência

let cacodemonPrefab = null;

// Carrega o modelo GLB
const gltfLoader = new GLTFLoader();
gltfLoader.load('assets/cacodemon.glb', (gltf) => {
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
  
}, undefined, (error) => {
  console.error('Erro ao carregar cacodemon.glb:', error);
});

function createCacodemonMesh() {
  if (!cacodemonPrefab) {
    console.warn("cacodemonPrefab ainda não carregado, usando esfera temporária");
  }

  // Clona o modelo GLB carregado
  const clone = cacodemonPrefab.clone(true);
  
  // Configura cada mesh do clone
  clone.traverse(child => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      child.material = child.material.clone();
    }
  });
  // Ajusta escala se necessário
  clone.scale.set(0.01, 0.01, 0.01);
  return clone;
}


function createProjectile(position, direction) {
  const geo = new THREE.SphereGeometry(0.5, 8, 8);
  const mat = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xcccc00 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(position);
  scene.add(mesh);

  //Retorna retorna projéteis
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

function shuffleArray(array) //Função de embaralhamento de vetores
{
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function getRandomOffsetTarget(position, radius = 10) //Randomiza patrulha do cacodemon
{
  const angle = Math.random() * Math.PI * 2;
  const dx = Math.cos(angle) * radius;
  const dz = Math.sin(angle) * radius;
  return new THREE.Vector3(position.x + dx, position.y, position.z + dz);
}

export function checkCollisionForCacodemons(newPos, wallBoxes, areaBoxes, collumnsBoxes, blockBoxes) //Checa a colisão dos cacodemons
{
  const futureBB = new THREE.Box3().setFromCenterAndSize(newPos, new THREE.Vector3(8, 8, 8)); //Tamanho diferente do lostsoul, pois o cacodemon é maior

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
  if (newPos.y < 8)
    {
    return true;
    }

    return false;
}

export function spawnCacodemons(blockBoxes) {
  if(soundManager){
    soundManager.playCacodemonSpawn();
  }
  const numToSpawn = 3;
  if (blockBoxes.length < numToSpawn) {
    return;
  }

  if (!cacodemonPrefab) {
    setTimeout(() => spawnCacodemons(blockBoxes), 1000);
    return;
  }

  //Randomiza blocos
  const shuffledBlocks = [...blockBoxes];
  shuffleArray(shuffledBlocks);

  for (let i = 0; i < numToSpawn; i++) {
    const block = shuffledBlocks[i];
    const center = block.getCenter(new THREE.Vector3());
    
    const mesh = createCacodemonMesh();
    if (!mesh) {
      continue;
    }
    
    //Objeto cacodemon
    const cacodemon = {
      mesh,
      hp: 50, //Vida do cacodemon
      timers: {
        lastFire: 0, //Último tiro
        idleUntil: 0 //Tempo de espera
      },
      patrolTarget: null, //Alvo da patrulha começa apontando para null
      state: 'passive' //Status começa passivo, até ser ativado pelo jogador
    };
    
    const healthBar = createHealthBar(); //Cria barra de vida
    cacodemon.mesh.add(healthBar);
    cacodemon.healthBar = healthBar;
    cacodemon.maxHp = cacodemon.hp;
    cacodemon.mesh.position.set(center.x, center.y + 20, center.z); //Posiciona a barra de vida acima do cacodemon
    
    scene.add(cacodemon.mesh);
    cacodemons.push(cacodemon);
  }
}

function checkProjectileCollision(projectile, player, wallBoxes, areaBoxes, collumnsBoxes, blockBoxes) //Checa as colisões dos projéteis
{
  const projectileBB = new THREE.Box3().setFromCenterAndSize(
    projectile.mesh.position,
    new THREE.Vector3(1, 1, 1) // Tamanho da colisão do projétil
  );

  //Colisão com o jogador
  const playerBB = new THREE.Box3().setFromObject(player);
  if (projectileBB.intersectsBox(playerBB)) {
    return 'player';
  }

  //Colisão com o mundo
  for (const boxList of [wallBoxes, areaBoxes, collumnsBoxes, blockBoxes]) {
    for (const box of boxList) {
      if (projectileBB.intersectsBox(box)) {
        return 'world';
      }
    }
  }

  //Colisão com o chão
  if (projectile.mesh.position.y < 0.1) {
    return 'ground';
  }

  return null;
}

export function updateCacodemons(player, wallBoxes, areaBoxes, collumnsBoxes, blockBoxes)
{
  const now = Date.now();
  const tmpVec = new THREE.Vector3();
  const moveVec = new THREE.Vector3();
  const sideVec = new THREE.Vector3();
  const newPos = new THREE.Vector3();

  for (const cacodemon of cacodemons) {
    if (cacodemon.hp <= 0) continue;

    //Atualiza barra de vida
    const percent = Math.max(cacodemon.hp / cacodemon.maxHp, 0);
    const bar = cacodemon.healthBar.userData.foreground;
    bar.scale.x = percent;
    bar.position.x = -(1 - percent) * cacodemon.healthBar.userData.maxWidth / 2;


    //Direção até o jogador
    tmpVec.subVectors(player.position, cacodemon.mesh.position);
    const distToPlayer = tmpVec.length();
    const forwardDir = tmpVec.clone().normalize();

    //Transições de estado (passivo e ativo)
    if (cacodemon.state === 'passive' && distToPlayer < 80) {
      cacodemon.state = 'active';
      if(soundManager){
        soundManager.playCacodemonNearby();
      }
    } else if (cacodemon.state === 'active' && distToPlayer > 100) {
      cacodemon.state = 'passive';
    }

    //Estado passivo (patrulha)
    if (cacodemon.state === 'passive') {

  //Determina movimento, e destino, ou pausa
  if (!cacodemon.patrolTarget || cacodemon.mesh.position.distanceTo(cacodemon.patrolTarget) < 1) {
    cacodemon.patrolTarget = getRandomOffsetTarget(cacodemon.mesh.position, 6 + Math.random() * 6);
    return;
  }

  //Movimento no eixo y
  moveVec.subVectors(cacodemon.patrolTarget, cacodemon.mesh.position).setY(0).normalize().multiplyScalar(0.02);
  newPos.copy(cacodemon.mesh.position).add(moveVec);

  if (!checkCollisionForCacodemons(newPos, wallBoxes, areaBoxes, collumnsBoxes, blockBoxes))
    {
    cacodemon.mesh.position.copy(newPos);
    cacodemon.mesh.lookAt(cacodemon.patrolTarget);
  } else {
    //Em caso de colisão recalcula a rota
    cacodemon.patrolTarget = getRandomOffsetTarget(cacodemon.mesh.position, 6);
    cacodemon.patrolTarget.y += 20; //sobe para se soltar do chão
    cacodemon.patrolTarget = getRandomOffsetTarget(cacodemon.mesh.position, 6);
    cacodemon.timers.idleUntil = now + 500; //pequena pausa antes de tentar de novo
  }

    //Estado ativo (ataque)
    } else if (cacodemon.state === 'active') {
  if (cacodemon.timers.stoppedUntil && now < cacodemon.timers.stoppedUntil) {
    cacodemon.mesh.lookAt(player.position); //Olha para o jogador quando vai atirar
    continue;
  }

  //Movimento de perseguição e zigzag
  const forwardSpeed = 0.04;
  moveVec.copy(forwardDir).multiplyScalar(forwardSpeed);

  const timeFactor = now * 0.001 + cacodemon.mesh.id; //Determina velocidade
  sideVec.crossVectors(forwardDir, new THREE.Vector3(0, 1, 0)).normalize();
  sideVec.multiplyScalar(Math.sin(timeFactor) * 0.3); //Determina amplitude

  moveVec.add(sideVec);
  newPos.copy(cacodemon.mesh.position).add(moveVec);

  if (!checkCollisionForCacodemons(newPos, wallBoxes, areaBoxes, collumnsBoxes, blockBoxes)) {
    cacodemon.mesh.position.copy(newPos);

    //Olha na direção do movimento, não para o jogador
    const targetPos = cacodemon.mesh.position.clone().add(moveVec);
    cacodemon.mesh.lookAt(targetPos);
  }

  //Ataca se estiver no intervalo de tiro
  if (distToPlayer < 80 && now - cacodemon.timers.lastFire > fireInterval) {
    if(soundManager){
      soundManager.playCacodemonAttack();
    }
    const projectile = createProjectile(cacodemon.mesh.position, forwardDir);
    projectiles.push(projectile);
    cacodemon.timers.lastFire = now;

    //Para e olha para o jogador durante o disparo
    cacodemon.timers.stoppedUntil = now + 700;
    cacodemon.mesh.lookAt(player.position);
  }
    }
    cacodemon.healthBar.lookAt(player.position);
  }

  //Atualiza projéteis
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    tmpVec.copy(p.dir).multiplyScalar(projectileSpeed);
    p.mesh.position.add(tmpVec);

    const collision = checkProjectileCollision(p, player, wallBoxes, areaBoxes, collumnsBoxes, blockBoxes);

    if (collision === 'player') {
  console.log('Jogador atingido por projétil do Cacodemon!');
  

    if (window.takeDamage && !window.godModeEnabled) {
      window.takeDamage(15); // Projétil causa 15 de dano
      console.log('Dano aplicado ao player!');
      if (window.soundManager) {
      window.soundManager.playPlayerDamage();
      }
    }
    
    
    
    scene.remove(p.mesh);
    projectiles.splice(i, 1);
    continue;
  }

    //Em caso de colisão com o mundo ou com o chão (ou ao exceder o tempo limite), remove as balas
    if (collision === 'world' || collision === 'ground' || Date.now() - p.spawnTime > 5000) {
      scene.remove(p.mesh);
      projectiles.splice(i, 1);
    }
  }
}


export { cacodemons, projectiles };

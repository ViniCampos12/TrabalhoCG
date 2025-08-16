import * as THREE from 'three';
import { scene } from './game.js';
import { SpriteMixer } from '../libs/sprites/SpriteMixer.js';

const soldiers = [];

const fireInterval = 5000; // Intervalo entre tiros (ms)

// Variáveis para o sistema de sprites
let spriteMixer;
let soldierActions = {};
// Inicializa o sistema de sprites
function initSpriteSystem() {
  spriteMixer = SpriteMixer();
}

function createSoldierMesh() {
  // Carrega a textura da sprite sheet
  const textureLoader = new THREE.TextureLoader();
  
  return new Promise((resolve) => {
    const soldierTexture = textureLoader.load('assets/Sprite/zombieman_grid.png', (texture) => {
      // Configura o espaço de cor
      texture.colorSpace = THREE.SRGBColorSpace;

      texture.magFilter = THREE.NearestFilter;
      texture.minFilter = THREE.NearestFilter;
      texture.generateMipmaps = false;
      
      // Cria o ActionSprite (8x8 grid como no exemplo)
      const actionSprite = spriteMixer.ActionSprite(texture, 8, 8);
      actionSprite.position.y = 2; // Altura do soldado
      actionSprite.scale.set(5, 5, 5); // Largura: 5, Altura: 5

      // Define as animações (adapte conforme sua sprite sheet)
      const actions = {
        idle: spriteMixer.Action(actionSprite, 200, 0, 0, 0, 0), // Parado
        walkDown: spriteMixer.Action(actionSprite, 150, 0, 0, 3, 0), // Andando para baixo
        walkLeft: spriteMixer.Action(actionSprite, 150, 0, 2, 3, 2), // Andando para esquerda
        walkUp: spriteMixer.Action(actionSprite, 150, 0, 4, 3, 4), // Andando para cima
        walkRight: spriteMixer.Action(actionSprite, 150, 0, 6, 3, 6), // Andando para direita
        shootDown: spriteMixer.Action(actionSprite, 100, 4, 0, 5, 0), // Atirando para baixo
        shootLeft: spriteMixer.Action(actionSprite, 100, 4, 2, 5, 2), // Atirando para esquerda
        shootUp: spriteMixer.Action(actionSprite, 100, 4, 4, 5, 4), // Atirando para cima
        shootRight: spriteMixer.Action(actionSprite, 100, 4, 6, 5, 6), // Atirando para direita
        die: spriteMixer.Action(actionSprite, 200, 7, 0, 7, 3) // Morrendo
      };
      
      resolve({ sprite: actionSprite, actions: actions });
    });
  });
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

export async function spawnSoldiers() {
  // Inicializa o sistema de sprites
  if (!spriteMixer) {
    initSpriteSystem();
  }
  
  const numSoldiers = 8;

  for (let i = 0; i < numSoldiers; i++) {
    try {
      // Aguarda a criação da sprite animada
      const { sprite, actions } = await createSoldierMesh();

      const x = 100 + Math.random() * (210 - 100);
      const z = -150 + Math.random() * (-80 + 150);

      sprite.position.set(x, 1, z);

      const healthBar = createHealthBar();
      sprite.add(healthBar);

      const soldier = {
        mesh: sprite,
        actions: actions,
        hp: 30,
        maxHp: 30,
        timers: {
          lastFire: 0,
          stoppedUntil: 0,
        },
        currentAction: null,
        lastDirection: 'down',
        isMoving: false,
        isShooting: false
      };

      soldier.healthBar = healthBar;

      scene.add(sprite);
      soldiers.push(soldier);
      
      console.log(`Soldado ${i + 1} criado com sprite animada`);
    } catch (error) {
      console.error('Erro ao criar soldado:', error);
    }
  }
}
// Função para determinar a direção do movimento
function getMovementDirection(moveVec) {
  const absX = Math.abs(moveVec.x);
  const absZ = Math.abs(moveVec.z);
  
  if (absX > absZ) {
    return moveVec.x > 0 ? 'right' : 'left';
  } else {
    return moveVec.z > 0 ? 'down' : 'up';
  }
}

// Função para atualizar a animação do soldado
function updateSoldierAnimation(soldier, moveVec, isShooting, playerPosition = null) {
  const { actions } = soldier;
  
  if (soldier.hp <= 0) {
    // Animação de morte
    if (soldier.currentAction !== 'die') {
      console.log('Executando animação de morte do soldado'); // DEBUG
      if (actions.die) {
        actions.die.playOnce(true);
        soldier.currentAction = 'die';
      } else {
        console.error('Ação de morte não encontrada!'); // DEBUG
      }
    }
    return;
  }
  
  const isMoving = moveVec.length() > 0.001;
  let direction;
  
  if (isShooting && playerPosition) {
    // QUANDO ATIRANDO: calcula direção baseada na posição do jogador
    const dirToPlayer = new THREE.Vector3().subVectors(playerPosition, soldier.mesh.position);
    direction = getMovementDirection(dirToPlayer);
    soldier.lastDirection = direction; // Atualiza a última direção
    
    // DEBUG
    console.log('Soldado atirando na direção:', direction);
    console.log('Posição soldado:', soldier.mesh.position);
    console.log('Posição jogador:', playerPosition);
  } else if (isMoving) {
    // QUANDO MOVENDO: usa a direção do movimento
    direction = getMovementDirection(moveVec);
    soldier.lastDirection = direction;
  } else {
    // QUANDO PARADO: usa a última direção conhecida
    direction = soldier.lastDirection;
  }
  
  let newAction = null;
  
  if (isShooting) {
    // Animações de tiro baseadas na direção ao jogador
    switch (direction) {
      case 'down': newAction = 'shootDown'; break;
      case 'left': newAction = 'shootLeft'; break;
      case 'up': newAction = 'shootUp'; break;
      case 'right': newAction = 'shootRight'; break;
    }
    
    // DEBUG
    console.log('Ação de tiro selecionada:', newAction);
  } else if (isMoving) {
    // Animações de movimento
    switch (direction) {
      case 'down': newAction = 'walkDown'; break;
      case 'left': newAction = 'walkLeft'; break;
      case 'up': newAction = 'walkUp'; break;
      case 'right': newAction = 'walkRight'; break;
    }
  } else {
    // Parado - frame estático baseado na última direção
    switch (direction) {
      case 'down': soldier.mesh.setFrame(0, 0); break;
      case 'left': soldier.mesh.setFrame(0, 2); break;
      case 'up': soldier.mesh.setFrame(0, 4); break;
      case 'right': soldier.mesh.setFrame(0, 6); break;
    }
    soldier.currentAction = 'idle';
    return;
  }
  
  // Só muda a animação se for diferente da atual
  if (newAction && soldier.currentAction !== newAction) {
    if (actions[newAction]) {
      actions[newAction].playLoop();
      soldier.currentAction = newAction;
      console.log('Mudou para ação:', newAction); // DEBUG
    } else {
      console.error('Ação não encontrada:', newAction); // DEBUG
    }
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

  if(newPos.x > 218 || newPos.x < 94 || newPos.z < -179 || newPos.z > -79)
  {
    return true;
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

  // Atualiza o sistema de sprites
  if (spriteMixer) {
    const delta = 0.016; // ~60 FPS
    spriteMixer.update(delta);
  }

  for (const soldier of soldiers) {
    // MOVA a verificação de HP para DEPOIS da atualização da barra de vida
    
    // Atualiza barra de vida SEMPRE
    const percent = Math.max(soldier.hp / soldier.maxHp, 0);
    const bar = soldier.healthBar.userData.foreground;
    bar.scale.x = percent;
    bar.position.x = -(1 - percent) * soldier.healthBar.userData.maxWidth / 2;

    // AGORA verifica se morreu
    if (soldier.hp <= 0) {
      // Atualiza animação de morte
      updateSoldierAnimation(soldier, new THREE.Vector3(), false, null);
      soldier.healthBar.lookAt(player.position);
      continue; // Pula o resto da lógica
    }

    // Direção ao jogador
    tmpVec.subVectors(player.position, soldier.mesh.position);
    const distToPlayer = tmpVec.length();
    const forwardDir = tmpVec.clone().normalize();

    // Verifica se está atirando
    const isShooting = soldier.timers.stoppedUntil && now < soldier.timers.stoppedUntil;

    // Se está parado para atirar
    if (isShooting) {
      updateSoldierAnimation(soldier, new THREE.Vector3(), true, player.position);
      soldier.healthBar.lookAt(player.position);
      continue;
    }

    const forwardSpeed = 0.02;
    moveVec.copy(forwardDir).multiplyScalar(forwardSpeed);

    // Zig-zag controlado
    const zigzagFrequency = 0.0005;
    const zigzagAmplitude = 0.1;
    const timeFactor = now * zigzagFrequency + soldier.mesh.id;
    sideVec.crossVectors(forwardDir, new THREE.Vector3(0, 1, 0)).normalize();
    sideVec.multiplyScalar(Math.sin(timeFactor) * zigzagAmplitude);
    moveVec.add(sideVec);

    newPos.copy(soldier.mesh.position).add(moveVec);

    if (!checkCollisionForSoldiers(newPos, wallBoxes, areaBoxes, area3Boxes, collumnsBoxes, blockBoxes)) {
      soldier.mesh.position.copy(newPos);
      
      // Atualiza animação de movimento
      updateSoldierAnimation(soldier, moveVec, false, null);
    } else {
      // Parado por colisão
      updateSoldierAnimation(soldier, new THREE.Vector3(), false, null);
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
    }

    soldier.healthBar.lookAt(player.position);
  }
}

export { soldiers };
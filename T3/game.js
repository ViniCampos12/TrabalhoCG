import * as THREE from 'three';
import { PointerLockControls } from '../build/jsm/controls/PointerLockControls.js';
import {
  initRenderer,
  initCamera,
  initDefaultBasicLight,
  setDefaultMaterial,
  InfoBox,
} from "../libs/util/util.js";
import Map from './map.js';
import Ramp from './ramp.js';
import { spawnLostSouls, updateLostSouls, checkCollisionForSouls, lostSouls } from './lostSoul.js';
import { spawnCacodemons, updateCacodemons, cacodemons, projectiles } from './cacoDemons.js';
import { 
  initPlayerHP, 
  takeDamage, 
  checkPlayerDamage, 
  getPlayerHP, 
  isPlayerAlive,
  toggleGodMode
} from './player.js';
import SoundManager from './sounds.js';
import Airplane from "./airplane.js";

let scene = new THREE.Scene();
// Cria um SkyDome com textura de céu
const loader = new THREE.CubeTextureLoader();
const skyboxTexture = loader.load([
    'assets/images/sky_right.bmp',
    'assets/images/sky_left.bmp',
    'assets/images/sky_top.bmp',
    'assets/images/sky_bottom.bmp',
    'assets/images/sky_front.bmp',
    'assets/images/sky_back.bmp',
]);
scene.background = skyboxTexture;


let renderer = initRenderer();
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Adiciona tipo de shadow map para sombras mais suaves
let material = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
let camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
let clock = new THREE.Clock();
const raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0).normalize(), 0, 2); //Colisão
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
let soundManager;

//LERP CONFIGS
const lerpConfigSuport = {
  destination: new THREE.Vector3(0.0, 4, 0.0),
  alpha: 0.01,
  move: false
}

const lerpConfigSuportTop2 = {
  destination: new THREE.Vector3(0.0, 4, 30.0),
  alpha: 0.01,
  move: false
}

let doorOpen = false;
const lerpConfigDoor = {
  destination: new THREE.Vector3(0, -8, 62),
  alpha: 0.01,
  move: false
}

const lerpConfigPlataform = {
  destination: new THREE.Vector3(0, 3, 57),
  alpha: 0.01,
  move: false
}

const doorArea3Open = false;
const lerpConfigDoor1Area3 = {
  destination: new THREE.Vector3(111.8, 5, -66),
  alpha: 0.015,
  move: false
}

const lerpConfigDoor2Area3 = {
  destination: new THREE.Vector3(203, 5, -66),
  alpha: 0.01,
  move: false
}

//Verificação da posição das escadas
const laddersPosition = [
  {
    minX: -188,
    maxX: -172,
    minZ: -71,
    maxZ: -64,
  },{
    minX: -162,
    maxX: 162,
    minZ: 55,
    maxZ: 70,
  },{
    minX: -8,
    maxX: 8,
    minZ: -71,
    maxZ: -64,
  }]

//ARMAS

let armaAtual = 'lançador';
function alternarParaLançador() {
  spriteTexture.offset.x = 0; // Set back to the first frame
  spriteFrame = 0; // Reset the frame counter
  armaAtual = 'lançador';
  gunSprite.visible = false;
  shot.visible = false;
  rocketLauncher.visible = true;
  // Limpa todas as balas ativas quando muda para lançador
}

function alternarParaMetralhadora() {
  armaAtual = 'metralhadora';
  gunSprite.visible = true;
  shot.visible = false;
  rocketLauncher.visible = false;
}



//ILUMINAÇÃO
//criando iluminação - Sol às 10-11h da manhã no verão
let ligthposition = new THREE.Vector3(100, 150, 50); // Posição alto e ligeiramente sudeste
let ligthColor = "rgb(255, 255, 255)";
let directionalLight = new THREE.DirectionalLight(ligthColor, 6.0); // Intensidade um pouco maior (sol forte do verão)
directionalLight.position.copy(ligthposition);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 4096; 
directionalLight.shadow.mapSize.height = 4096;

// Aumenta significativamente a área de cobertura da sombra para cobrir as paredes grandes
directionalLight.shadow.camera.left = -600; 
directionalLight.shadow.camera.right = 600;
directionalLight.shadow.camera.top = 600;
directionalLight.shadow.camera.bottom = -600;
directionalLight.shadow.camera.near = 1;
directionalLight.shadow.camera.far = 1000;
scene.add(directionalLight);

// Cria uma esfera que representa o "sol"
const sunGeometry = new THREE.SphereGeometry(2.5, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffffaa, emissive: 0xffff00 });
const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);

// Coloca a esfera na posição da luz direcional
sunMesh.position.copy(directionalLight.position);

// Faz a "esfera do sol" não receber sombras (opcional)
sunMesh.castShadow = false;
sunMesh.receiveShadow = false;

// Adiciona na cena
scene.add(sunMesh);

//cria iluminação secundária sem sombras
let lightPositionBack = new THREE.Vector3(-30, 30, -30);
let directionalLightBack = new THREE.DirectionalLight("rgb(200, 200, 200)", 1.0); // intensidade mais baixa
directionalLightBack.position.copy(lightPositionBack);
directionalLightBack.castShadow = false; // não projeta sombras

scene.add(directionalLightBack);

// LUZ DO HANGAR (interna) - posicionada na entrada virada para o fundo
const hangarLight = new THREE.DirectionalLight("rgb(200, 180, 120)", 0.5); 
hangarLight.position.set(156, 30, -65); // Posição na entrada (z = -65)
hangarLight.target.position.set(110, 100, -171); // Target para iluminar melhor a area
scene.add(hangarLight.target); 
hangarLight.castShadow = false; 
hangarLight.visible = true; 
scene.add(hangarLight);

// VARIÁVEIS DE CONTROLE DA ILUMINAÇÃO DO HANGAR
let isPlayerInHangar = false;
let lastHangarCheck = 0;
const HANGAR_CHECK_INTERVAL = 100; // Verifica a cada 100ms

function checkPlayerInHangar(playerPosition) {
  // Coordenadas da Área 3 (hangar) baseadas no map.js
  const hangarBounds = {
    minX: 94,   // Limite esquerdo
    maxX: 218,  // Limite direito
    minZ: -171, // Limite do fundo
    maxZ: -65,  // Limite da frente
    minY: 0,    // Chão
    maxY: 30    // Teto
  };

  const x = playerPosition.x;
  const y = playerPosition.y;
  const z = playerPosition.z;

  return (x >= hangarBounds.minX && x <= hangarBounds.maxX &&
          z >= hangarBounds.minZ && z <= hangarBounds.maxZ &&
          y >= hangarBounds.minY && y <= hangarBounds.maxY);
}

// Função para alternar a iluminação com transição suave
let lightTransitionProgress = 0;
let isTransitioning = false;
const TRANSITION_SPEED = 3.0; // Velocidade da transição

function smoothToggleHangarLighting(inHangar) {
  if (isTransitioning) return; // Evita múltiplas transições
  
  isTransitioning = true;
  lightTransitionProgress = 0;
  
  // Intensidades iniciais e finais
  const startMainIntensity = directionalLight.intensity;
  const startBackIntensity = directionalLightBack.intensity;
  const startHangarIntensity = hangarLight.intensity;
  
  // AJUSTE AS INTENSIDADES AQUI:
  const targetMainIntensity = inHangar ? 0 : 6.0; // Reduz para 50% em vez de 0
  const targetBackIntensity = inHangar ? 4 : 1.0; // Mantém um pouco da luz traseira
  const targetHangarIntensity = inHangar ? 4 : 0.5; // Aumenta a luz do hangar
  
  // Garante que todas as luzes estejam visíveis durante a transição
  directionalLight.visible = true;
  directionalLightBack.visible = true;
  hangarLight.visible = true;
  
  const transition = () => {
    lightTransitionProgress += TRANSITION_SPEED * 0.016; // ~16ms por frame
    
    if (lightTransitionProgress >= 1) {
      lightTransitionProgress = 1;
      isTransitioning = false;
      
      // NÃO DESLIGA MAIS AS LUZES - apenas reduz intensidade
      console.log(inHangar ? 'Iluminação do hangar ativa' : 'Iluminação externa restaurada');
    }
    
    // Interpola a intensidade das luzes
    const t = lightTransitionProgress;
    directionalLight.intensity = startMainIntensity + (targetMainIntensity - startMainIntensity) * t;
    directionalLightBack.intensity = startBackIntensity + (targetBackIntensity - startBackIntensity) * t;
    hangarLight.intensity = startHangarIntensity + (targetHangarIntensity - startHangarIntensity) * t;
    
    if (isTransitioning) {
      requestAnimationFrame(transition);
    }
  };
  
  transition();
}

var blocked = false;
var blocked2 = false;

//MAPA
let map = new Map(scene);

// CRIA O AVIÃO:
let airplane = new Airplane(scene);

 

//Variáveis importante advindas do map
const wallBoxes = map.getWallBoxes();
const areaBoxes = map.getAreaBoxes(); 
const collumnsBoxes = map.getCollumnsBoxes();
const area3Boxes = map.getBBBlocksArea3();
const blockBoxes = map.getBlocksBoxes();
const rampMesh = map.getRamps();
const suport1 = map.suport1;
const suport1Box = map.suport1Box;
const doorArea2 = map.door;
const doorBox = map.doorBox;
const suport2 = map.suport2;
const suport2Box = map.getSuport2Box();
const plataform = map.plataform; 
const plataformBox = map.plataformBox;
const suportTop2 = map.suportTop2;
const suportTop2Box = map.suportTop2Box;
const key = map.keyMesh;
const key2 = map.keyMesh2;
const door1Area3 = map.portaHangar1;
const door2Area3 = map.portaHangar2;
const door1Area3Box = map.door1Area3Box;
const door2Area3Box = map.door2Area3Box;
let hasKey1 = false;
let hasKey2 = true;
let contaLostSouls = 0;
let contaCacoDemons = 0;


//CUBO
//Cria pessoa como um cubo
var cubeGeometry = new THREE.BoxGeometry(2, 2, 2);
var cube = new THREE.Mesh(cubeGeometry, material);
cube.position.set(0.0, 2.0, 0.0);
let shiftPress = false;
scene.add(cube);


// Cria o Rocket Launcher como um sprite
const textureLoaderRL = new THREE.TextureLoader();
const spriteTextureRL = textureLoaderRL.load('assets/images/RocketLauncher.png');
spriteTextureRL.repeat.set(1 / 3, 1); // 3 quadros na horizontal
spriteTextureRL.offset.set(0, 0); // começa do primeiro frame
const spriteMaterialRL = new THREE.SpriteMaterial({ 
  map: spriteTextureRL, 
  transparent: true,
  color: 0xffffff
});
const rocketLauncher = new THREE.Sprite(spriteMaterialRL);
rocketLauncher.scale.set(1, 1.5, 1); // aumenta o tamanho para garantir visibilidade

rocketLauncher.visible = true; // só mostra quando metralhadora estiver ativa

//faz o cilindro receber e transmitir sombras
rocketLauncher.castShadow = true;
rocketLauncher.receiveShadow = true;
// Posiciona o cilindro na "frente" da câmera, ajustando para parecer uma arma
camera.add(rocketLauncher);
rocketLauncher.position.set(0, -0.8, -2.78); // posição mais central e próxima

//Cria disparo padrão
let materialShot = new THREE.MeshLambertMaterial({ color: 0x708090 });
var shotGeo = new THREE.SphereGeometry(0.15,64,16);
var shot = new THREE.Mesh(shotGeo,materialShot);
shot.position.set(0,0,0.2);
shot.castShadow = true; // A bala também deve projetar sombras
shot.receiveShadow = true; // A bala também deve receber sombras
shot.visible =false;
rocketLauncher.add(shot); //adiciona o tiro ao rocket launcher
camera.position.set(0,2,0); // posiciona a camera dentro do cubo
cube.add(camera);  

// Cria a metralhadora como um sprite
const textureLoader = new THREE.TextureLoader();
const spriteTexture = textureLoader.load('assets/chaingun.png');
spriteTexture.repeat.set(1 / 3, 1); // 3 quadros na horizontal
spriteTexture.offset.set(0, 0); // começa do primeiro frame

const spriteMaterial = new THREE.SpriteMaterial({ 
  map: spriteTexture, 
  transparent: true,
  color: 0xffffff
});
const gunSprite = new THREE.Sprite(spriteMaterial);

gunSprite.scale.set(1, 1.5, 1); // aumenta o tamanho para garantir visibilidade
camera.add(gunSprite);
gunSprite.position.set(0, -1, -2.5); // posição mais central e próxima
gunSprite.visible = false; // só mostra quando metralhadora estiver ativa

let spriteFrame = 0;
const totalFrames = 3;
let lastSpriteUpdate = 0; // Adicione esta variável
let isAnimatingSprite = false; // Nova variável para controlar a animação
let animationStartTime = 0; // Para controlar quando começou a animação

function animarSprite() {
   if (!isAnimatingSprite) return;
  const now = Date.now();
  const spriteAnimationSpeed = armaAtual === 'metralhadora' ? 70 : 130;
  // Só atualiza o sprite se passou tempo suficiente
  if (now - lastSpriteUpdate >= spriteAnimationSpeed) {
    spriteFrame = (spriteFrame + 1) % totalFrames;
    if(armaAtual === 'metralhadora' ) {
      spriteTexture.offset.x = spriteFrame / totalFrames;
    } else if (armaAtual === 'lançador') {
      spriteTextureRL.offset.x = spriteFrame / totalFrames;
    }
    lastSpriteUpdate = now;
    // Para o lançador, para a animação após completar um ciclo
    if (armaAtual === 'lançador' && spriteFrame === 0 && now - animationStartTime > spriteAnimationSpeed) {
      isAnimatingSprite = false;
      spriteTextureRL.offset.x = 0; // Garante que volta ao primeiro frame
    }
  }
}
function startSpriteAnimation() {
  isAnimatingSprite = true;
  animationStartTime = Date.now();
  spriteFrame = 0; // Começa do primeiro frame
}

//ARMA DEFAULT
//Cria arma como cilindro
// const geometryC = new THREE.CylinderGeometry( 0.13, 0.13, 2.5, 32 ); 
// const materialC = new THREE.MeshLambertMaterial( {color: 0x5F5F5F} ); 
// const cylinder = new THREE.Mesh( geometryC, materialC ); 

// Rotaciona o cilindro para apontar para frente
// cylinder.rotation.x = Math.PI / 2;





// CONTROLES
const controls = new PointerLockControls(cube, document.body); //faz o movimento do mouse atuar direto no cubo
// Torna os controles acessíveis globalmente para o player.js
window.controls = controls;
// Clicar ativa o pointer lock
document.addEventListener('click', () => {
  controls.lock();
  if (!soundManager) {
    soundManager = new SoundManager(camera);
    window.soundManager = soundManager;
    console.log("SoundManager inicializado!");
  }
      setTimeout(() => {
      if (soundManager) {
        soundManager.playBackgroundMusic();
      }
    }, 2000);
}, false);
 const movimento = { frente: false, tras: false, esquerda: false, direita: false };

document.addEventListener('keydown', (event) => {
  switch (event.code) {
    case 'KeyW':
    case "ArrowUp": 
      movimento.frente = true; 
      break;
    case 'KeyS':
    case "ArrowDown": 
      movimento.tras = true; 
      break;
    case 'KeyA':
    case "ArrowLeft": 
      movimento.esquerda = true; 
      break;
    case 'KeyD':
    case "ArrowRight": 
      movimento.direita = true; 
      break;
    case 'Digit1':
        alternarParaMetralhadora();
        break;
    case 'Digit2':
        alternarParaLançador();
        break;
    case 'KeyO':
        openArea3Door();
    case 'ShiftLeft':
    case 'ShiftRight':
      shiftPress = true;
      break;
    case 'KeyC':
      console.log('tecla C');
      hasKey1 = true;
      hasKey2 = false;
      exibirMensagem();
      break;
    case 'KeyG':
      console.log('Tecla G - Toggling God Mode');
      const godModeStatus = toggleGodMode();
      break;
  }
}, false);

document.addEventListener('keyup', (event) => {
  switch (event.code) {
    case 'KeyW':
    case "ArrowUp": 
      movimento.frente = false; 
      break;
    case 'KeyS':
    case "ArrowDown": 
      movimento.tras = false; 
      break;
    case 'KeyA':
    case "ArrowLeft": 
      movimento.esquerda = false; 
      break;
    case 'KeyD':
    case "ArrowRight": 
      movimento.direita = false; 
      break;
    case 'ShiftLeft':
    case 'ShiftRight':
      shiftPress = false;
      break;
  }
}, false);

//DISPARO
let isShooting = false;
let shotInterval = null;
let lastShotTime = 0; // armazena o momento do último disparo
const cadenciaMin = 500; // 500 milissegundos (1/2 segundo)
const activeShots = []; //balas atiradas em cena
let metralhadoraDamageTimer = 0;

document.addEventListener('mousedown', (event) => {
    isShooting = true;
    shoot(); // dispara imediatamente ao clicar
    shotInterval = setInterval(shoot, 10); // tenta disparar continuamente (controlado pela cadência)
});

document.addEventListener('mouseup', (event) => {
    isShooting = false;
    clearInterval(shotInterval);
    shotInterval = null;

        if (armaAtual === 'metralhadora') {
        isAnimatingSprite = false;
        spriteTexture.offset.x = 0;
        spriteFrame = 0;
    }
    // Para o lançador, a animação já para automaticamente após o ciclo
});

window.addEventListener('wheel', (event) => {
  if (event.deltaY > 0) {
    alternarParaMetralhadora();
  } else {
    alternarParaLançador();
  }
});

function shoot() {
  const now = Date.now();
  if ((now - lastShotTime) >= cadenciaMin && armaAtual === 'lançador') {
    // Toca som do rocket launcher
    if (soundManager) {
      
      console.log("SoundManager existe, tocando som...");
      soundManager.playRocketLauncher();
    }
    startSpriteAnimation(); // Anima o sprite do lançador
    lastShotTime = now;
        
    // Clona o tiro
    const shotClone = shot.clone();
    shotClone.visible = true;
    
    // Garante que as propriedades de sombra sejam mantidas
    shotClone.castShadow = true;
    shotClone.receiveShadow = true;
    
    rocketLauncher.add(shotClone);
    shotClone.updateMatrixWorld();

    // Captura a posição global antes de soltar da arma
    const worldPos = new THREE.Vector3();
    shotClone.getWorldPosition(worldPos);

    // Reanexa à cena e corrige posição
    scene.attach(shotClone);
    shotClone.position.copy(worldPos);

    // Define direção do disparo com base na câmera
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    direction.normalize();
    shotClone.userData.direction = direction;

    // Cria caixa de colisão
    const shotBox = new THREE.Box3().setFromObject(shotClone);
    shotClone.userData.box = shotBox;

    // Armazena a bala ativa
    activeShots.push(shotClone);
  }
  else if (armaAtual === 'metralhadora') {
    // Toca som do rocket launcher
    if (soundManager) {
      console.log("SoundManager existe, tocando som...");
      soundManager.playChaingun();
    }
    if (!isAnimatingSprite) {
      startSpriteAnimation();
    }
    // Metralhadora: apenas raycasting
      const origin = new THREE.Vector3();
      camera.getWorldPosition(origin);
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction).normalize();

      const raycasterShoot = new THREE.Raycaster(origin, direction);
      
      // Pega todos os objetos da cena que podem ser atingidos
      const allObjects = [];
      scene.traverse((child) => {
        // Verifica se é um Mesh válido e não é um sprite ou objeto da UI
        if (child.isMesh && 
            child !== cube && 
            child !== rocketLauncher && 
            child !== shot && 
            child !== gunSprite &&
            child !== sunMesh &&
            !activeShots.includes(child) && 
            child.parent && 
            child.material &&
            child.geometry) {
          allObjects.push(child);
        }
      });

      try {
        if (allObjects.length > 0) {
          const intersects = raycasterShoot.intersectObjects(allObjects, false); // false para não ser recursivo

          if (intersects.length > 0) {
            const hit = intersects[0];
            console.log("Acertou", hit.object.name || hit.object);
          }
        }
      } catch (error) {
        console.warn("Erro no raycasting da metralhadora:", error);
      }
    }
}

//Variáveis de queda
let velocidadeVertical = 0;
let amortecimento = 0.5;
let gravidade = -0.003;



function render() {
  requestAnimationFrame(render);
  const delta = clock.getDelta();
  animarSprite();

  // Inicializa o HP apenas uma vez quando os controles estão ativos
  if (controls.isLocked && !window.playerHPInitialized) {
    initPlayerHP();
    window.playerHPInitialized = true;
  }


  const velocidade = () => 
    {if(shiftPress){ 
      console.log("shift");
      return 20.0*delta*2;
    }
    else
      return 20.0*delta};

  //Verificação de fim de ações na área
  if(contaLostSouls == 5){
    lerpConfigSuport.move = true;
  }

  if(contaCacoDemons == 3){
    lerpConfigSuportTop2.move = true;
  }


  if (controls.isLocked && isPlayerAlive()) {

    //PARTE DO TIRO
    activeShots.forEach((shot, index) => {
      const speed = 50 * delta;
      const dir = shot.userData.direction.clone();
      shot.position.add(dir.multiplyScalar(speed));
      shot.userData.box.setFromObject(shot);

      //Colisões
      let atingiuAlgo = false;
      // Testa colisão com as paredes
      for (const wall of wallBoxes) {
        if (shot.userData.box.intersectsBox(wall)) {
          atingiuAlgo = true;
          break;
        }
      }

      // Se não bateu nas paredes, testa as áreas
      if (!atingiuAlgo) {
        for (const area of areaBoxes) {
          if (shot.userData.box.intersectsBox(area)) {
            atingiuAlgo = true;
            break;
          }
        }
      }

      if(!atingiuAlgo) {
        for(const collumn of collumnsBoxes) {
          if (shot.userData.box.intersectsBox(collumn)) {
            atingiuAlgo = true;
            break;
          }
        } 
      }

      if(!atingiuAlgo) {
        for(const block of blockBoxes){
          if (shot.userData.box.intersectsBox(block)) {
            atingiuAlgo = true;
            break;
          }
        }
      }

      if(!atingiuAlgo) {
        for(const block of area3Boxes){
          if (shot.userData.box.intersectsBox(block)) {
            atingiuAlgo = true;
            break;
          }
        }
      }

      for (const soul of lostSouls) {
        if (soul.hp <= 0) continue; // já morto

        const soulBB = new THREE.Box3().setFromObject(soul.mesh);
        if (shot.userData.box.intersectsBox(soulBB)) {
          soul.hp -= 10;
          if(soundManager) {
            soundManager.playEnemyHit();
          }
          // caso a alma morra
          if (soul.hp <= 0) {
            scene.remove(soul.mesh);
            contaLostSouls++;
          }

          atingiuAlgo = true;
          break;
        }
      }

      for (const cacodemon of cacodemons) {
        if (cacodemon.hp <= 0) continue;

        const cacodemonBB = new THREE.Box3().setFromObject(cacodemon.mesh);
        if (shot.userData.box.intersectsBox(cacodemonBB)) {
          cacodemon.hp -= 10;
          if(soundManager) {
            soundManager.playEnemyHit();
          }

          if (cacodemon.hp <= 0) {
            if(soundManager){
              soundManager.playCacodemonDeath();
            }
            scene.remove(cacodemon.mesh);
            contaCacoDemons++;
          }

          atingiuAlgo = true;
          break;
        }
      }


      if (shot.position.length() > 500 || atingiuAlgo) {
        scene.remove(shot);
        if (shot.userData.helper) {
          scene.remove(shot.userData.helper);
        }
        // scene.remove(shot.userData.helper); // Remove helper 
        activeShots.splice(index, 1);
      }
    });

    // Dano contínuo da metralhadora
    if (armaAtual === 'metralhadora' && isShooting) {
      metralhadoraDamageTimer += delta;

      if (metralhadoraDamageTimer >= 1 / 10) { // a cada 0.1s, tirar 1hp (10hp/s)
        metralhadoraDamageTimer = 0;

        const origin = new THREE.Vector3();
        camera.getWorldPosition(origin);
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction).normalize();

        const raycasterShoot = new THREE.Raycaster(origin, direction);

        for (const soul of lostSouls) {
          if (soul.hp <= 0) continue;

          const soulBB = new THREE.Box3().setFromObject(soul.mesh);
          const intersects = raycasterShoot.intersectObject(soul.mesh, true);

          if (intersects.length > 0) {
            soul.hp -= 1;
            if(soundManager) {
            soundManager.playEnemyHit();
            }

            if (soul.hp <= 0) {
              scene.remove(soul.mesh);
              contaLostSouls++;
            }
            break;
          }
        }

        for (const cacodemon of cacodemons) {
          if (cacodemon.hp <= 0) continue;

          const intersects = raycasterShoot.intersectObject(cacodemon.mesh, true);

          if (intersects.length > 0) {
            cacodemon.hp -= 1;
            if(soundManager) {
            soundManager.playEnemyHit();
          }

            if (cacodemon.hp <= 0) {
              scene.remove(cacodemon.mesh);
              contaCacoDemons++;
            }
            break;
          }
        }
      }
    } 
    else {
      metralhadoraDamageTimer = 0; // reset se não está atirando
    }


    //PARTE DO CUBO MOVIMENTAÇÃO
    // Faz o cubo girar com a rotação da câmera
    cube.rotation.y = controls.getObject().rotation.y;

    // Direção baseada na rotação do cubo
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(cube.quaternion);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();

    let moveDir = new THREE.Vector3();
    
    raycaster.ray.origin.copy(cube.position);
    raycaster.ray.origin.y += 1; // evita ficar dentro do chão
    raycaster.ray.direction.set(0, -1, 0);

    const rampMeshArray = Array.isArray(rampMesh) ? rampMesh : [rampMesh];
    const rampsFiltered = rampMeshArray.filter(r => r !== undefined && r !== null && r.parent);

    let intersects = [];
    try {
      intersects = raycaster.intersectObjects(rampsFiltered, true);
    } catch (error) {
      intersects = [];
    }

    if (movimento.frente) moveDir.add(forward);
    if (movimento.tras) moveDir.add(forward.clone().negate());
    if (movimento.direita) moveDir.add(right);
    if (movimento.esquerda) moveDir.add(right.clone().negate());

    //Subida escada area 1
    if (intersects.length > 0 && intersects[0].distance < 4) {
      const yDoImpacto = intersects[0].point.y;

      if (cube.position.y < yDoImpacto) {
        cube.position.y = yDoImpacto;
      }
    }

    //Atualizações dos lerpConfigs
    if(lerpConfigSuport.move) {
      suport1.position.lerp(lerpConfigSuport.destination, lerpConfigSuport.alpha);
      suport1Box.setFromObject(suport1);
    }
    if(lerpConfigSuportTop2.move) {
      map.suportTop2.position.lerp(lerpConfigSuportTop2.destination, lerpConfigSuportTop2.alpha);
      map.suportTop2Box.setFromObject(map.suportTop2);
    }
    if(lerpConfigDoor.move) {
      doorArea2.position.lerp(lerpConfigDoor.destination, lerpConfigDoor.alpha);
      doorBox.setFromObject(doorArea2); // Atualiza a bounding box da porta
    }
     if(lerpConfigDoor1Area3.move) {
      door1Area3.position.lerp(lerpConfigDoor1Area3.destination, lerpConfigDoor1Area3.alpha);
      door2Area3.position.lerp(lerpConfigDoor2Area3.destination, lerpConfigDoor2Area3.alpha);
      door1Area3Box.setFromObject(door1Area3); // Atualiza a bounding box da porta
      door2Area3Box.setFromObject(door2Area3); // Atualiza a bounding box da porta
    }
    
    //Subida da plataforma da area 2
    let isIntersectPlataform = false;
    try {
      if (plataform && plataform.parent && plataform.geometry && plataform.material) {
        const plataformIntersects = raycaster.intersectObject(plataform, true);
        isIntersectPlataform = plataformIntersects.length > 0;
      }
    } catch (error) {
      isIntersectPlataform = false;
    }

    if (isIntersectPlataform) {
      //O cubo sobe junto com a plataforma
      cube.position.lerp(new THREE.Vector3(cube.position.x, 6, cube.position.z),0.01);
    }

    if(lerpConfigPlataform.move) {
  plataform.position.lerp(lerpConfigPlataform.destination, lerpConfigPlataform.alpha);
  plataformBox.setFromObject(plataform);

  if(plataform.position.distanceTo(lerpConfigPlataform.destination) < 0.1) {
    // Plataforma chegou ao destino - para o movimento e som
    lerpConfigPlataform.move = false;
    plataformMoving = false;
    plataformSoundPlaying = false;
     if (soundManager) {
      soundManager.stop('plataformMove');
    }
    if (plataform.position.y > 0) {
      // Chegou no TOPO (posição Y positiva)
      console.log("Plataforma chegou no topo!");
      setTimeout(() => {
        if (!plataformMoving) {
          downPlataform();
        }
      }, 2000); // Espera 2 segundos antes de descer
    } else {
      // Chegou no CHÃO (posição Y negativa ou zero)
      plataformaNoChao = true;
      if (soundManager) {
        soundManager.stop('plataformMove');
      }
      // Não faz nada - fica esperando o jogador pisar nela novamente
    }
  }
}



    moveDir.normalize();

    if(cube.position.y== 8 && cube.position.x <-92 && cube.position.x >-218 && cube.position.z > -179 && cube.position.z < -79 && blocked==false)
    {
      spawnLostSouls();
      blocked = true;
    }

    if(cube.position.y== 8 && cube.position.x < 62 && cube.position.x > -62 && cube.position.z > -179 && cube.position.z < -79 && blocked2==false)
    {
      spawnCacodemons(blockBoxes);
      blocked2 = true;
    }

    if (moveDir.lengthSq() > 0) {

      moveDir.normalize();
  
      // Tentativa completa
      let newPos = pos.clone().add(moveDir.clone().multiplyScalar(velocidade()));
      if (!checkCollisions(wallBoxes, areaBoxes, newPos)) {
        cube.position.copy(newPos);
      } 
      else {
        // Testar só o eixo X
        newPos = pos.clone().add(new THREE.Vector3(moveDir.x, 0, 0).multiplyScalar(velocidade()));
        if (!checkCollisions(wallBoxes, areaBoxes, newPos)) {
          cube.position.copy(newPos);
        } else {
          // Testar só o eixo Z
          newPos = pos.clone().add(new THREE.Vector3(0, 0, moveDir.z).multiplyScalar(velocidade()));
          if (!checkCollisions(wallBoxes, areaBoxes, newPos)) {
            cube.position.copy(newPos);
          }
        }
      }

      //Teste da plataforma
      if(cube.position.x > -9 && cube.position.x < 9 && cube.position.z < - 55 && cube.position.z > -65 && doorOpen) {
        if(!plataformaNoChao) {
          downPlataform();
      }
      }
    }
    //Se estiver fora da área da escada ele atualiza a gravidade
    const inLadderArea = laddersPosition.some(ladder => cube.position.x >= ladder.minX && cube.position.x <= ladder.maxX && cube.position.z >= ladder.minZ && cube.position.z <= ladder.maxZ);

    const cubeWorldPos = new THREE.Vector3();
    cube.getWorldPosition(cubeWorldPos);

    if (!inLadderArea && cubeWorldPos.y > 2)
      atualizaGravidade(cube);
        
    updateLostSouls(cube, wallBoxes, areaBoxes, collumnsBoxes, blockBoxes);
    updateCacodemons(cube, wallBoxes, areaBoxes, collumnsBoxes, blockBoxes);

      // VERIFICAÇÃO DE ILUMINAÇÃO DO HANGAR (com throttling)
    lastHangarCheck += delta * 1000; // Converte para ms
    if (lastHangarCheck >= HANGAR_CHECK_INTERVAL) {
      lastHangarCheck = 0;
      
      const playerInHangar = checkPlayerInHangar(cube.position);
      
      // Só alterna se o estado mudou
      if (playerInHangar !== isPlayerInHangar) {
        isPlayerInHangar = playerInHangar;
        smoothToggleHangarLighting(isPlayerInHangar);
      }
    }
    
     const damageReceived = checkPlayerDamage(cube.position, {
      lostSouls: lostSouls,
      cacodemons: cacodemons,
      projectiles: projectiles
    });

    if(damageReceived){
      // Se o jogador recebeu dano, tocar som
      if (soundManager) {
        soundManager.play('playerDamage');
      }
    }

  }

  renderer.render(scene, camera);
}


//FUNÇÕES
const pos = cube.position;
const ramp = new Ramp();

function atualizaGravidade(cube) {
  const targetY = ramp.getRampHeight(cube.position.x, cube.position.y, cube.position.z);

  if (cube.position.y > targetY) {
    velocidadeVertical += gravidade;
    cube.position.y += velocidadeVertical;

    if (cube.position.y <= targetY) {
      cube.position.y = targetY;
      if (Math.abs(velocidadeVertical) < 0.1) {
        velocidadeVertical = 0;
      } else {
        velocidadeVertical = -velocidadeVertical * amortecimento;
      }
    }
  } else {
    velocidadeVertical = 0;
    cube.position.y = targetY;
  }
}


let plataformSoundPlaying = false;
let plataformMoving = false;
let plataformaNoChao = false;
function checkCollisions(walls, areas, newCubePos) { 

  let collision = false;

  //Bounding box na posição futura para verficar colisão
  const futureBB = new THREE.Box3().setFromCenterAndSize(newCubePos, new THREE.Vector3(5, 4, 5));

  //Testa colunas da área 1
  if(newCubePos.z < -60 && newCubePos.z > -181 && newCubePos.x > -220 && newCubePos.x < -92){

    if(futureBB.intersectsBox(suport1Box)){
      if (soundManager && !hasKey1) {
        soundManager.playKeyPickup();
      }
      suport1.remove(key);
      key.visible = false;
      hasKey1 = true;
    }

    for (const collumn of collumnsBoxes) {
      if (futureBB.intersectsBox(collumn)) {
        return true;
      }
    }
  }


  //Testa blocos da área 2
  if(newCubePos.z < -53 && newCubePos.z > -181 && newCubePos.x > -64 && newCubePos.x < 64){

    if(futureBB.intersectsBox(plataformBox) && !plataformMoving && plataformaNoChao){
      upPlataform();
      return false;
    }

    if(futureBB.intersectsBox(suport2Box)){
      if(hasKey1){
        if (soundManager && !doorOpen) {
          soundManager.playDoorOpen();
        }
        suport2.add(key);
        key.visible = true;
        openArea2Door();
      }
      
      return true;
    }

    if(futureBB.intersectsBox(suportTop2Box)){
      suportTop2.remove(key2);
      key2.visible = false;
      hasKey2 = true;
      return true;
    }

    for (const block of blockBoxes) {
      if (futureBB.intersectsBox(block)) {
        return true;
      }
    }
  } 

  if(newCubePos.z < -53 && newCubePos.z > -182 && newCubePos.x > 90 && newCubePos.x < 230){
    for(const block of area3Boxes){
      if(futureBB.intersectsBox(block)){
        return true;
      }
    }
  }

  //No alto não ter colisão
  if(newCubePos.y > 3){return false} 

  //Testa escadas
  if((newCubePos.z > 52 && newCubePos.x > -17 && newCubePos.x < 17 && newCubePos.z < 62) || ((newCubePos.z > -71 && newCubePos.z < -40) && ((newCubePos.x > -188 && newCubePos.x < -172)))){
    return false;
  }

  //Testa rampa área 2
  if((newCubePos.z > -69   && newCubePos.z < -60) && (newCubePos.x > -6 && newCubePos.x < 6)){
    return false;
  }

  //Testa paredes
  if(Math.abs(newCubePos.x) > 248 || Math.abs(newCubePos.z) > 248){
    for (const wall of walls) {
      if (futureBB.intersectsBox(wall)) {
        collision = true;
        break; 
      }
    }
  }

  //Testa caixona
  else if(newCubePos.z > 52 && newCubePos.z<189 && Math.abs(newCubePos.x)< 158 && newCubePos.y<4){
    collision = futureBB.intersectsBox(areas[0]);
  }
  //Testa outras areas em ordem
  else if(newCubePos.z < -60 && newCubePos.z > -181){
    if(newCubePos.x > -220 && newCubePos.x < -92)
      collision = futureBB.intersectsBox(areas[1]);
    if(newCubePos.x > -64 && newCubePos.x < 64){
      collision = futureBB.intersectsBox(areas[2]);
    }
      
    // if(newCubePos.x > 92 && newCubePos.x < 220)
    //   collision = futureBB.intersectsBox(areas[3]);
  }


  return collision; 
}

function openArea2Door(){
  lerpConfigDoor.move = true;   
  doorOpen = true;
  
}

function upPlataform(){
    // Só toca som se não estiver já movendo
  if (soundManager) {
    soundManager.playPlataformMove();
    plataformSoundPlaying = true;
    console.log('up');
  }
  
  plataformMoving = true;
  lerpConfigPlataform.alpha = 0.01;
  lerpConfigPlataform.destination = new THREE.Vector3(0, 3, 57)
  lerpConfigPlataform.move = true; 
}

function downPlataform(){
  if (!plataformMoving && soundManager) {
    soundManager.playPlataformMove();
    plataformSoundPlaying = true;
    console.log('down');
  }
  
  plataformMoving = true;
 
  lerpConfigPlataform.alpha = 0.02;
  lerpConfigPlataform.destination = new THREE.Vector3(0,-3,57);
  lerpConfigPlataform.move = true;
  
}

function openArea3Door(){
  if(soundManager) {
    soundManager.playDoorOpen();
  }
  lerpConfigDoor1Area3.move = true;
  lerpConfigDoor2Area3.move = true;
  doorArea3Open = true;
}

render();

export {
  scene,
  soundManager
};
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

let scene = new THREE.Scene();
// Define a cor de fundo da cena para azul céu
scene.background = new THREE.Color(0x6BB6FF); // Cor azul céu um pouco mais escura

let renderer = initRenderer();
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Adiciona tipo de shadow map para sombras mais suaves
let material = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
let camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
let clock = new THREE.Clock();


// const raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0).normalize(), 0, 2);
const raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0).normalize(), 0, 2);

//Lerp config para mexer a plataforma no centro da area
const lerpConfig = {
  destination: new THREE.Vector3(0.0, 1, 0.0),
  alpha: 0.01,
  move: false
}


const laddersPosition = [
  {
    minX: -8,
    maxX: 8,
    minZ: -71,
    maxZ: -64,
  },
  {
    minX: -188,
    maxX: -172,
    minZ: -71,
    maxZ: -64,
  },
  {
    minX: 180,
    maxX: 196,
    minZ: -71,
    maxZ: -64,
  },
  {
    minX: -162,
    maxX: 162,
    minZ: 55,
    maxZ: 70,
  },
]

let armaAtual = 'lançador';

function alternarParaLançador() {
  armaAtual = 'lançador';
  gunSprite.visible = false;
  shot.visible = true;
  cylinder.visible = true;
}

function alternarParaMetralhadora() {
  armaAtual = 'metralhadora';
  gunSprite.visible = true;
  shot.visible = false;
  cylinder.visible = false;
}



// Cria a metralhadora como um sprite
const textureLoader = new THREE.TextureLoader();
const spriteTexture = textureLoader.load('../assets/2025.1_T2_Assets/chaingun.png');
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
gunSprite.position.set(0, -0.8, -2); // posição mais central e próxima
gunSprite.visible = false; // só mostra quando metralhadora estiver ativa

let spriteFrame = 0;
const totalFrames = 3;

function animarMetralhadoraSprite() {
  spriteFrame = (spriteFrame + 1) % totalFrames;
  spriteTexture.offset.x = spriteFrame / totalFrames;
}

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

// Chama o mapa
let map = new Map(scene);
const wallBoxes = map.getWallBoxes();
const areaBoxes = map.getAreaBoxes();
const collumnsBoxes = map.getCollumnsBoxes();
const rampMesh = map.getRamps();
const plataforma1 = map.plataform1;
console.log("Ramp Meshs:");
console.log(rampMesh);

//Cria pessoa como um cubo
var cubeGeometry = new THREE.BoxGeometry(2, 2, 2);
var cube = new THREE.Mesh(cubeGeometry, material);
cube.position.set(0.0, 1.0, 0.0);

scene.add(cube);

//Cria arma como cilindro
const geometryC = new THREE.CylinderGeometry( 0.13, 0.13, 2.5, 32 ); 
const materialC = new THREE.MeshLambertMaterial( {color: 0x5F5F5F} ); 
const cylinder = new THREE.Mesh( geometryC, materialC ); 

// Rotaciona o cilindro para apontar para frente
cylinder.rotation.x = Math.PI / 2;

//faz o cilindro receber e transmitir sombras
cylinder.castShadow = true;
cylinder.receiveShadow = true;
// Posiciona o cilindro na "frente" da câmera, ajustando para parecer uma arma
camera.add(cylinder);
cylinder.position.set(0, -0.5, -0.5);

//Cria disparo padrão
let materialShot = new THREE.MeshLambertMaterial({ color: 0x708090 });
var shotGeo = new THREE.SphereGeometry(0.15,64,16);
var shot = new THREE.Mesh(shotGeo,materialShot);
shot.position.set(0,-2,0.2);
shot.castShadow = true; // A bala também deve projetar sombras
shot.receiveShadow = true; // A bala também deve receber sombras
cylinder.add(shot);

camera.position.set(0,2,0); // posiciona a camera dentro do cubo
cube.add(camera);           // faz a câmera seguir o cubo

// CONTROLES
const controls = new PointerLockControls(cube, document.body); //faz o movimento do mouse atuar direto no cubo

// Clicar ativa o pointer lock
document.addEventListener('click', () => {
  controls.lock();
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
        console.log("Troca para metralhadora");
        break;
    case 'Digit2':
        alternarParaLançador();
        console.log("Troca para lançador");
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
  }
}, false);

let isShooting = false;
let shotInterval = null;
let lastShotTime = 0; // armazena o momento do último disparo
const cadenciaMin = 500; // 500 milissegundos (1/2 segundo)
const activeShots = []; //balas atiradas em cena

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
        spriteTexture.offset.x = 0; // Set back to the first frame
        spriteFrame = 0; // Reset the frame counter
    }
});

window.addEventListener('wheel', (event) => {
  if (event.deltaY > 0) {
    alternarParaMetralhadora();
  } else {
    alternarParaLançador();
  }
  console.log("Arma atual:", armaAtual);
});

function shoot() {
  const now = Date.now();
  if ((now - lastShotTime) >= cadenciaMin && armaAtual === 'lançador') {
    lastShotTime = now;
        
    // Clona o tiro
    const shotClone = shot.clone();
    
    // Garante que as propriedades de sombra sejam mantidas
    shotClone.castShadow = true;
    shotClone.receiveShadow = true;
    
    cylinder.add(shotClone);
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
    animarMetralhadoraSprite();
    // Metralhadora: apenas raycasting
      const origin = new THREE.Vector3();
      camera.getWorldPosition(origin);
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction).normalize();

      const raycasterShoot = new THREE.Raycaster(origin, direction);
      
      // Pega todos os objetos da cena que podem ser atingidos
      const allObjects = [];
      scene.traverse((child) => {
        if (child.isMesh && child !== cube && child !== cylinder && child !== shot && !activeShots.includes(child)) {
          allObjects.push(child);
        }
      });

      const intersects = raycasterShoot.intersectObjects(allObjects, true);

      if (intersects.length > 0) {
        const hit = intersects[0];
        console.log("Acertou", hit.object.name || hit.object);
        // Aqui você pode exibir um efeito de impacto, som, etc.
        }
    }
}
let velocidadeVertical = 0;
let amortecimento = 0.5;
let gravidade = -0.003;

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});


  render();
// Update loop
function render() {
  requestAnimationFrame(render);
  const delta = clock.getDelta();
  const velocidade = 50.0 * delta;

  if (controls.isLocked) {

    //PARTE DO TIRO
    activeShots.forEach((shot, index) => {
      const speed = 50 * delta;
      const dir = shot.userData.direction.clone();
      shot.position.add(dir.multiplyScalar(speed));
      shot.userData.box.setFromObject(shot);

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
      for(const collumn of collumnsBoxes) {
        if (shot.userData.box.intersectsBox(collumn)) {
          atingiuAlgo = true;
          lerpConfig.move = true; // Para a plataforma se colidir com a parede
          break;
        }
      } 
    }

    if (shot.position.length() > 500 || atingiuAlgo) {
      scene.remove(shot);
      scene.remove(shot.userData.helper); // Remove helper
      activeShots.splice(index, 1);
    }

    });

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
    const rampsFiltered = rampMeshArray.filter(r => r !== undefined && r !== null);

    const intersects = raycaster.intersectObjects(rampsFiltered, true);


    if (movimento.frente) moveDir.add(forward);
    if (movimento.tras) moveDir.add(forward.clone().negate());
    if (movimento.direita) moveDir.add(right);
    if (movimento.esquerda) moveDir.add(right.clone().negate());
    if (intersects.length > 0 && intersects[0].distance < 4) {
      const yDoImpacto = intersects[0].point.y;

      if (cube.position.y < yDoImpacto) {
        cube.position.y = yDoImpacto;
      }
    }
    if(lerpConfig.move) plataforma1.position.lerp(lerpConfig.destination, lerpConfig.alpha);


    moveDir.normalize();


    if (moveDir.lengthSq() > 0) {

      moveDir.normalize();
      // console.log(pos);
  
      // Tentativa completa
      let newPos = pos.clone().add(moveDir.clone().multiplyScalar(velocidade));
      if (!checkCollisions(wallBoxes, areaBoxes, newPos)) {
        cube.position.copy(newPos);
      } else {
        // Testar só o eixo X
        newPos = pos.clone().add(new THREE.Vector3(moveDir.x, 0, 0).multiplyScalar(velocidade));
        if (!checkCollisions(wallBoxes, areaBoxes, newPos)) {
          cube.position.copy(newPos);
        } else {
          // Testar só o eixo Z
          newPos = pos.clone().add(new THREE.Vector3(0, 0, moveDir.z).multiplyScalar(velocidade));
          if (!checkCollisions(wallBoxes, areaBoxes, newPos)) {
            cube.position.copy(newPos);
          }
        }
      }

      //Se estiver fora da área da escada ele atualiza a gravidade
      const inLadderArea = laddersPosition.some(ladder => cube.position.x >= ladder.minX && cube.position.x <= ladder.maxX &&cube.position.z >= ladder.minZ && cube.position.z <= ladder.maxZ);

        if(!inLadderArea && cube.position.y > 2) {
          // console.log("Entrou");
          atualizaGravidade(cube);
        }
         
    }
    
  }

  renderer.render(scene, camera);
}

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

function checkCollisions(walls, areas, newCubePos) { 

  let collision = false;

  //Bounding box na posição futura para verficar colisão
  const futureBB = new THREE.Box3().setFromCenterAndSize(newCubePos, new THREE.Vector3(5, 4, 5));

  //Testa colunas da área 1
  if(newCubePos.z < -60 && newCubePos.z > -181 && newCubePos.x > -220 && newCubePos.x < -92){
    for (const collumn of collumnsBoxes) {
      if (futureBB.intersectsBox(collumn)) {
        console.log("Colidiu com coluna");
        return true;
      }
    }
  } 

  //No alto não ter colisão
  if(newCubePos.y > 3){return false} 

  //Testa escadas
  if((newCubePos.z > 52 && newCubePos.x > -17 && newCubePos.x < 17 && newCubePos.z < 62) || ((newCubePos.z > -71 && newCubePos.z < -40) && ((newCubePos.x > -188 && newCubePos.x < -172) || (newCubePos.x > 172 && newCubePos.x < 188)))){
    return false;
  }

  //Testa rampa área 2
  if((newCubePos.z > -69   && newCubePos.z < -40) && (newCubePos.x > -6 && newCubePos.x < 6)){
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
    if(newCubePos.x > -64 && newCubePos.x < 64)
      collision = futureBB.intersectsBox(areas[2]);
    if(newCubePos.x > 92 && newCubePos.x < 220)
      collision = futureBB.intersectsBox(areas[3]);
  }


  return collision; 
}

render();
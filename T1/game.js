import * as THREE from 'three';
import { PointerLockControls } from '../build/jsm/controls/PointerLockControls.js';
import {
  initRenderer,
  initCamera,
  initDefaultBasicLight,
  setDefaultMaterial,
  InfoBox,
} from "../libs/util/util.js";
import KeyboardState from '../libs/util/KeyboardState.js';
import Map from './map.js';
import Ramp from './ramp.js';

let scene = new THREE.Scene();
let renderer = initRenderer();
let material = setDefaultMaterial();
let camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
let light = initDefaultBasicLight(scene);
let clock = new THREE.Clock();
let keyboard = new KeyboardState();


// Chama o mapa
let map = new Map(scene);
const wallBoxes = map.getWallBoxes();
const areaBoxes = map.getAreaBoxes();

//Cria pessoa como um cubo
var cubeGeometry = new THREE.BoxGeometry(4, 4, 4);
var cube = new THREE.Mesh(cubeGeometry, material);
cube.position.set(0.0, 2.0, 0.0);

scene.add(cube);

//Cria arma como cilindro
const geometryC = new THREE.CylinderGeometry( 0.13, 0.13, 2.5, 32 ); 
const materialC = new THREE.MeshStandardMaterial( {color: 0x5F5F5F} ); 
const cylinder = new THREE.Mesh( geometryC, materialC ); 

// Rotaciona o cilindro para apontar para frente
cylinder.rotation.x = Math.PI / 2;

// Posiciona o cilindro na "frente" da câmera, ajustando para parecer uma arma
camera.add(cylinder);
cylinder.position.set(0, -0.5, -0.5);

//Cria disparo padrão
let materialShot = setDefaultMaterial("#708090");
var shotGeo = new THREE.SphereGeometry(0.15,64,16);
var shot = new THREE.Mesh(shotGeo,materialShot);
shot.position.set(0,-2,0.2);
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
});

function shoot() {
  const now = Date.now();
  if ((now - lastShotTime) >= cadenciaMin) {
    lastShotTime = now;

    // Clona o tiro
    const shotClone = shot.clone();
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
}

  render();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});


const pos = cube.position;
const ramp = new Ramp();


// Update loop
function render() {
  requestAnimationFrame(render);

  let velocidadeQueda = 0; // velocidade inicial da queda
  let aceleracao = -0.02;  // aceleração da gravidade (negativa pois vai pra baixo)


  const delta = clock.getDelta();
  const velocidade = 20.0 * delta;

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

    if (movimento.frente) moveDir.add(forward);
    if (movimento.tras) moveDir.add(forward.clone().negate());
    if (movimento.direita) moveDir.add(right);
    if (movimento.esquerda) moveDir.add(right.clone().negate());

    moveDir.normalize();


    if (moveDir.lengthSq() > 0) {

      moveDir.normalize();
  
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

      newPos = pos.clone().add(moveDir.multiplyScalar(velocidade));
        

      newPos.y = ramp.getRampHeight(newPos.x, newPos.y, newPos.z);

      //Queda das areas elevadas
      if(pos.y == 8 && newPos.y == 2)
      {
        let posicaoInicialY = 8;
        let posicaoChaoY = 2;
        velocidadeQueda += aceleracao;

        // Atualiza posição Y do cubo baseado na velocidade
        cube.position.lerp(newPos, 0.4);

        // Limita o chão para que o cubo não caia além do Y = 2
        if(cube.position.y <= posicaoChaoY) {
          cube.position.y = posicaoChaoY;
          velocidadeQueda = 0; // Para a queda
        }
      }
      else{
        if (!checkCollisions(wallBoxes, areaBoxes, newPos)) {
          cube.position.copy(newPos);
        } 
        else {
          // Testar só o eixo X
          newPos = pos.clone().add(new THREE.Vector3(moveDir.x, 0, 0).multiplyScalar(velocidade));
          if (!checkCollisions(wallBoxes, areaBoxes, newPos)) {
            cube.position.copy(newPos);
          }
          else {
            // Testar só o eixo Z
            newPos = pos.clone().add(new THREE.Vector3(0, 0, moveDir.z).multiplyScalar(velocidade));

          }
        } 
      }   
    }
  }

  renderer.render(scene, camera);
}



function checkCollisions(walls, areas, newCubePos) { 

  let collision = false;

  //Bounding box na posição futura para verficar colisão
  const futureBB = new THREE.Box3().setFromCenterAndSize(newCubePos, new THREE.Vector3(5, 4, 5));

  //No alto não ter colisão
  if(newCubePos.y > 5) return false;

  //Testa escadas
  if((newCubePos.z > 52 && newCubePos.x > -17 && newCubePos.x < 17 && newCubePos.z < 62) || ((newCubePos.z > -71 && newCubePos.z < -40) && ((newCubePos.x > -188 && newCubePos.x < -172) || (newCubePos.x > -8 && newCubePos.x < 8) || (newCubePos.x > 172 && newCubePos.x < 188)))){
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
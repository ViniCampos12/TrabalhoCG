import * as THREE from 'three';
import { PointerLockControls } from '../build/jsm/controls/PointerLockControls.js';
import {
  initRenderer,
  initCamera,
  initDefaultBasicLight,
  setDefaultMaterial,
  InfoBox,
  createGroundPlaneXZ
} from "../libs/util/util.js";
import KeyboardState from '../libs/util/KeyboardState.js';
import Map from './map.js';

let scene = new THREE.Scene();
let renderer = initRenderer();
let material = setDefaultMaterial();
let camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
let light = initDefaultBasicLight(scene);
let clock = new THREE.Clock();
let keyboard = new KeyboardState();

// const movementVector = new THREE.Vector3(1,0,1)


//Show axes (parameter is size of each axis)
let axesHelper = new THREE.AxesHelper( 250 );
scene.add( axesHelper );

// create a cube
let map = new Map(scene);
const wallBoxes = map.getWallBoxes();
const areaBoxes = map.getAreaBoxes();


var cubeGeometry = new THREE.BoxGeometry(4, 4, 4);
var cube = new THREE.Mesh(cubeGeometry, material);
cube.position.set(0.0, 2.0, 0.0);

const cubeSize = new THREE.Vector3(5, 4, 5);
const cubeCenter = new THREE.Vector3();
cube.getWorldPosition(cubeCenter); 

// add the cube to the scene
scene.add(cube);

const geometryC = new THREE.CylinderGeometry( 0.13, 0.13, 2.5, 32 ); 
const materialC = new THREE.MeshStandardMaterial( {color: 0x5F5F5F} ); 
const cylinder = new THREE.Mesh( geometryC, materialC ); 

// Rotaciona o cilindro para apontar para frente
cylinder.rotation.x = Math.PI / 2;

// Posiciona o cilindro na "frente" da câmera, ajustando para parecer uma arma

camera.add(cylinder);
cylinder.position.set(0, -0.5, -0.5);

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


  render();

// function keyboardUpdate() {
// //  keyboard.update();

// //   const speed = 30;
// //   const moveDistance = speed * clock.getDelta();

// //   const movimentVector = new THREE.Vector3(moveDistance, 0, moveDistance);

// //   // Atualiza a posição atual do cubo
// //   cube.getWorldPosition(position);

   

// //   let newCubePos = position.clone(); // Começa com a posição atual

// //   // Verifica teclas pressionadas (movimento contínuo)
// //   if (keyboard.pressed("A") || keyboard.pressed("left")) {
// //     newCubePos = position.add(new THREE.Vector3(-movimentVector.x, 0, 0));
// //   }
// //   if (keyboard.pressed("D") || keyboard.pressed("right")) {
// //     newCubePos = position.add(new THREE.Vector3(movimentVector.x, 0, 0));
// //   }
// //   if (keyboard.pressed("W") || keyboard.pressed("up")) {
// //     newCubePos = position.add(new THREE.Vector3(0, 0, -movimentVector.z));
// //   }
// //   if (keyboard.pressed("S") || keyboard.pressed("down")) {
// //     newCubePos = position.add(new THREE.Vector3(0, 0, movimentVector.z));
// //   }

// //   // Verifica colisão ANTES de aplicar movimento
// //   const colisionVector = checkCollisions(wallBoxes, areaBoxes, newCubePos);

// //   if (!colisionVector) {
// //   cube.position.copy(newCubePos);   
// // }
  

// //   console.log("Posição atual:", position);
// //   console.log("Nova posição (tentada):", newCubePos);


// }


// function keyboardUpdate() {

//   keyboard.update();

//   const speed = 30;
//   const moveDistance = speed * clock.getDelta();

//   const movimentVector = new THREE.Vector3(moveDistance, 0, moveDistance);

//   // Atualiza a posição atual do cubo
//   cube.getWorldPosition(position);

//   caixaBB.setFromObject(cube);

//   let newCubePos = position.clone(); // Começa com a posição atual

//   // Verifica teclas pressionadas (movimento contínuo)
//   if (keyboard.pressed("A") || keyboard.pressed("left")) {
//     newCubePos = position.add(new THREE.Vector3(-movimentVector.x, 0, 0));
//   }
//   if (keyboard.pressed("D") || keyboard.pressed("right")) {
//     newCubePos = position.add(new THREE.Vector3(movimentVector.x, 0, 0));
//   }
//   if (keyboard.pressed("W") || keyboard.pressed("up")) {
//     newCubePos = position.add(new THREE.Vector3(0, 0, -movimentVector.z));
//   }
//   if (keyboard.pressed("S") || keyboard.pressed("down")) {
//     newCubePos = position.add(new THREE.Vector3(0, 0, movimentVector.z));
//   }

//   // Verifica colisão ANTES de aplicar movimento
//   const colisionVector = checkCollisions(wallBoxes, areaBoxes, newCubePos);

//   if (!colisionVector) {
//   cube.position.copy(newCubePos);   
// }
  

//   // console.log("Posição atual:", position);
//   // console.log("Nova posição (tentada):", newCubePos);
// }


// Resize handler

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Info box
let instrucao = new InfoBox();
instrucao.add("PointerLockControls com cubo vinculado");
instrucao.addParagraph();
instrucao.add("Clique na tela para ativar o controle com o mouse.");
instrucao.add("Use W, A, S, D para mover o cubo com a câmera dentro.");
instrucao.show();
const pos = cube.position;

// Update loop
function render() {
  requestAnimationFrame(render);

  // caixaBB.setFromObject(cube);

  const delta = clock.getDelta();
  const velocidade = 50.0 * delta;

  if (controls.isLocked) {
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

    console.log(pos);

    if (moveDir.lengthSq() > 0) {
      const newPos = pos.clone().add(moveDir.multiplyScalar(velocidade));
      

      newPos.y = getRampHeight(newPos.x, newPos.y, newPos.z);

      //Tem que ver melhor isso aqui, nessa parte é realizada a descida
      if(pos.y == 8 && newPos.y == 2)
      {
        newPos.x = newPos.x + 2;
        newPos.z = newPos.z +2;
        cube.position.copy(newPos); 
      }
      else if(!checkCollisions(wallBoxes, areaBoxes, newPos)) {     
        cube.position.copy(newPos); 
      }
      

    }
  }

  renderer.render(scene, camera);
}

const rampas = [
  { baseX: -16, topoX: 16, baseZ: 55, topoZ: 70, altura: 10 },
  { baseX: -188, topoX: -172, baseZ: -73, topoZ: -61, altura: 10 },
  { baseX: -8, topoX: 8, baseZ: -73, topoZ: -61, altura: 10 },
  { baseX: 172, topoX: 188, baseZ: -73, topoZ: -61, altura: 10 },
];


function getRampHeight(x,y, z) {
 
  if((z>=55 && z<=187 && x<=156 && x>=-156 && y!=2) || ((z<-64 && z>-179 && y !=2) && ((x>-218 && x<-94) || (x>-62 && x<62) || (x>94 && x<218))))
    return 8;
  for (const rampa of rampas) {
    const dentroZ = z >= rampa.baseZ && z <= rampa.topoZ;
    const dentroX = x >= Math.min(rampa.baseX, rampa.topoX) && x <= Math.max(rampa.baseX, rampa.topoX);
    
    if (dentroZ && dentroX) {
      const t = (z - rampa.baseZ) / (rampa.topoZ - rampa.baseZ);
      return 2 + t * rampa.altura;
    }
  }

  return 2; // altura padrão do cubo
}


  function checkCollisions(walls, areas, newCubePos) { 
  
  let collision = false;
 
  const futureBB = new THREE.Box3().setFromCenterAndSize(newCubePos, new THREE.Vector3(5, 4, 5));
  console.log(newCubePos.y);

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
    console.log("Entrou")
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

  if(collision) console.log("Colisão")
  
  return collision; 
}

render();

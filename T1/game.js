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

let scene = new THREE.Scene();
let renderer = initRenderer();
let material = setDefaultMaterial();
let camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
let light = initDefaultBasicLight(scene);
let clock = new THREE.Clock();
let keyboard = new KeyboardState();

// Criando o cubo e adicionando a câmera como filha
const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, transparent: true, opacity: 0.3 });
const cube = new THREE.Mesh(
  new THREE.BoxGeometry(4, 4, 4),
  cubeMaterial
);
cube.position.set(0, 2, 0);
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

// vetor movimento
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

// ----- MAPA -----
class Map {
  constructor() {
    const plane = createGroundPlaneXZ(500, 500);
    scene.add(plane);

    const createArea = (x, z, color = null) => {
      const geo = new THREE.BoxGeometry(124, 6, 124);
      const mat = color ? setDefaultMaterial(color) : material;
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, 3, z);
      scene.add(mesh);
    };

    createArea(-156, -125);               // area 1
    createArea(0, -125, "green");         // area 2
    createArea(156, -125, "blue");        // area 3

    const area4Geo = new THREE.BoxGeometry(312, 6, 124);
    const area4 = new THREE.Mesh(area4Geo, material);
    area4.position.set(0, 3, 125);
    scene.add(area4);

    const meio = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material);
    meio.position.set(0, 1, 0);
    scene.add(meio);
  }
}

// Create the map
let map = new Map();

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

// Update loop
function render() {
  requestAnimationFrame(render);

  const delta = clock.getDelta();
  const velocidade = 80.0 * delta;

  if (controls.isLocked) {
  if (movimento.frente) controls.moveForward(velocidade);
  if (movimento.tras) controls.moveForward(-velocidade);
  if (movimento.direita) controls.moveRight(velocidade);
  if (movimento.esquerda) controls.moveRight(-velocidade);
}
  renderer.render(scene, camera);
}

render();

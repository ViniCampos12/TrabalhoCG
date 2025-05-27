import * as THREE from  'three';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import {initRenderer, 
        initCamera,
        initDefaultBasicLight,
        setDefaultMaterial,
        InfoBox,
        onWindowResize,
        createGroundPlaneXZ} from "../libs/util/util.js";
import KeyboardState from '../libs/util/KeyboardState.js';
import Map from './map.js';

let scene, renderer, camera, material, light, orbit; // Initial variables

scene = new THREE.Scene();    // Create main scene
renderer = initRenderer();    // Init a basic renderer
camera = initCamera(new THREE.Vector3(0, 100, 0)); // Init camera in this position
material = setDefaultMaterial(); // create a basic material
light = initDefaultBasicLight(scene); // Create a basic light to illuminate the scene
orbit = new OrbitControls( camera, renderer.domElement ); // Enable mouse rotation, pan, zoom etc.
let clock = new THREE.Clock();
var keyboard = new KeyboardState();

const movementVector = new THREE.Vector3(1,0,1)

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

//Show axes (parameter is size of each axis)
let axesHelper = new THREE.AxesHelper( 250 );
scene.add( axesHelper );

    // create a cube
    let map = new Map(scene);
    const wallBoxes = map.getWallBoxes();
    const areaBoxes = map.getAreaBoxes();
    let position = new THREE.Vector3();
    let newCubePos = new THREE.Vector3();
    // const wallBox = new THREE.Box3().setFromObject(obj);
    // let helper2 = new THREE.Box3Helper( wallBox, "white" );
    // scene.add(helper2);

    var cubeGeometry = new THREE.BoxGeometry(4, 4, 4);
    var cube = new THREE.Mesh(cubeGeometry, material);
    cube.position.set(0.0, 2.0, 0.0);

    const cubeSize = new THREE.Vector3(5, 4, 5);
    const cubeCenter = new THREE.Vector3();
    cube.getWorldPosition(cubeCenter); 

    const caixaBB = new THREE.Box3().setFromCenterAndSize(cubeCenter, cubeSize);
    // const caixaBB = new THREE.Box3().setFromObject(cube);
    // caixaBB.expandByScalar(2);
    let helper = new THREE.Box3Helper( caixaBB, "white" );
    scene.add(helper); 
    // position the cube
    
    // add the cube to the scene
    scene.add(cube);

  render();

  function keyboardUpdate() {
  keyboard.update();

  const speed = 30;
  const moveDistance = speed * clock.getDelta();

  const movimentVector = new THREE.Vector3(moveDistance, 0, moveDistance);

  cube.getWorldPosition(position);
  caixaBB.setFromObject(cube);

  let newCubePos = position.clone(); // agora sim, base intacta

  if (keyboard.pressed("A") || keyboard.pressed("left")) {
    newCubePos.add(new THREE.Vector3(-movimentVector.x, 0, 0));
  }
  if (keyboard.pressed("D") || keyboard.pressed("right")) {
    newCubePos.add(new THREE.Vector3(movimentVector.x, 0, 0));
  }
  if (keyboard.pressed("W") || keyboard.pressed("up")) {
    newCubePos.add(new THREE.Vector3(0, 0, -movimentVector.z));
  }
  if (keyboard.pressed("S") || keyboard.pressed("down")) {
    newCubePos.add(new THREE.Vector3(0, 0, movimentVector.z));
  }

  // Verifica colisão
  const colisionVector = checkCollisions(wallBoxes, areaBoxes, newCubePos);

  if (!colisionVector) {
    cube.position.copy(newCubePos);
  }
}

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


// Use this to show information onscreen
let controls = new InfoBox();
  controls.add("Basic Scene");
  controls.addParagraph();
  controls.add("Use mouse to interact:");
  controls.add("* Left button to rotate");
  controls.add("* Right button to translate (pan)");
  controls.add("* Scroll to zoom in/out.");
  controls.show();

  function checkCollisions(walls, areas, newCubePos)
{ 
  
  let collision = false;
 
  const futureBB = new THREE.Box3().setFromCenterAndSize(newCubePos, new THREE.Vector3(5, 4, 5));

  if(newCubePos.z > 2 && newCubePos.x > -17 && newCubePos.x < 17 && newCubePos.z < 62){
    
    if (cube.parent !== map.piramide) {
      scene.remove(cube);
      map.piramide.add(cube);
      map.piramide.updateWorldMatrix(true, false);
      let localPos = map.piramide.worldToLocal(newCubePos.clone());
      cube.position.copy(localPos);
    }

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
  else if(newCubePos.z > 52 && Math.abs(newCubePos.x)< 158){
    collision = futureBB.intersectsBox(areas[0]);
  }
  //Testa outras areas em ordem
  else if(newCubePos.z < -60 && newCubePos.z > -181){
    if(newCubePos.x > -218 && newCubePos.x < -92)
      collision = futureBB.intersectsBox(areas[1]);
    if(newCubePos.x > -64 && newCubePos.x < 64)
      collision = futureBB.intersectsBox(areas[2]);
    if(newCubePos.x > 92 && newCubePos.x < 220)
      collision = futureBB.intersectsBox(areas[3]);
  }
  
  return collision; 
}

render();
function render()
{
  requestAnimationFrame(render);
  keyboardUpdate();
  renderer.render(scene, camera) // Render scene
}
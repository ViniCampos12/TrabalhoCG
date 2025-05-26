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
    let colisionVector = new THREE.Vector3();
    colisionVector.add(new THREE.Vector3(1,0,1))

    // const wallBox = new THREE.Box3().setFromObject(obj);
    // let helper2 = new THREE.Box3Helper( wallBox, "white" );
    // scene.add(helper2);

    var cubeGeometry = new THREE.BoxGeometry(4, 4, 4);
    var cube = new THREE.Mesh(cubeGeometry, material);
    cube.position.set(0.0, 2.0, 0.0);
    const caixaBB = new THREE.Box3().setFromObject(cube);
    let helper = new THREE.Box3Helper( caixaBB, "white" );
    scene.add(helper); 
    // position the cube
    
    // add the cube to the scene
    scene.add(cube);

  render();

  function keyboardUpdate() {

  keyboard.update();

  let newCubePos = position.clone()
    var speed = 30;
    var moveDistance = speed * clock.getDelta();
    let movimentVector = new THREE.Vector3();
    movimentVector.add(new THREE.Vector3(moveDistance,0,moveDistance))
     
    movimentVector.multiply(colisionVector)
  //Boundig box follows cube
  caixaBB.setFromObject(cube);
  
  cube.getWorldPosition(position);

  // Keyboard.down - execute only once per key pressed
  if ( keyboard.down("left") ) {
    cube.translateX( -1 );
     //Ideia de uso para descobrir uma posição futura
    newCubePos = position.add(new THREE.Vector3(-1,0,0));
  }  
  if ( keyboard.down("right") )  cube.translateX(  1 );
  if ( keyboard.down("down") )     cube.translateZ(  1 );
  if ( keyboard.down("up") )   cube.translateZ( -1 );

  // Keyboard.pressed - execute while is pressed
  if ( keyboard.pressed("A") ){
    cube.position.add(new THREE.Vector3(-movimentVector.x,0,0))
    newCubePos = newCubePos.add(new THREE.Vector3(-1,0,0))
  }
  if ( keyboard.pressed("D") ){
    cube.position.add(new THREE.Vector3(movimentVector.x,0,0))
    newCubePos = newCubePos.add(new THREE.Vector3(1,0,0))
  }

  if ( keyboard.pressed("W") ){
    cube.position.add(new THREE.Vector3(0,0,-movimentVector.z))
    newCubePos = newCubePos.add(new THREE.Vector3(0,0,-1))
  }
  if ( keyboard.pressed("S") ){
    cube.position.add(new THREE.Vector3(0,0,movimentVector.z))
    newCubePos = newCubePos.add(new THREE.Vector3(0,0,1))  
  }
  colisionVector = checkCollisions(wallBoxes, areaBoxes, newCubePos)
}

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
  //Testa paredes
  if(Math.abs(position.x) > 248 || Math.abs(position.z) > 248){
    for (const wall of walls) {
      if (caixaBB.intersectsBox(wall)) {
        collision = true;
        break; 
      }
    }
  }
  //Testa caixona
  else if(position.z > 52 && Math.abs(position.x)< 158){
    collision = caixaBB.intersectsBox(areas[0]);
  }
  //Testa outras areas em ordem
  else if(position.z < -60 && position.z > -181){
    if(position.x > -218 && position.x < -92)
      collision = caixaBB.intersectsBox(areas[1]);
    if(position.x > -64 && position.x < 64)
      collision = caixaBB.intersectsBox(areas[2]);
    if(position.x > 92 && position.x < 220)
      collision = caixaBB.intersectsBox(areas[3]);
  }

  if(collision)
  {
    if(Math.abs(newCubePos.x) > Math.abs(position.x)) colisionVector.x = 0;
    else colisionVector.x = 1;
    if(Math.abs(newCubePos.z) > Math.abs(position.z)) colisionVector.z = 0;
    else colisionVector.z = 1;
  }
  return colisionVector;
}

render();
function render()
{
  requestAnimationFrame(render);
  keyboardUpdate();
  renderer.render(scene, camera) // Render scene
}
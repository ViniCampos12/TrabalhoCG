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

// Show axes (parameter is size of each axis)
// let axesHelper = new THREE.AxesHelper( 12 );
// scene.add( axesHelper );


    // create area 1
    // let area4Geometry = new THREE.BoxGeometry(312, 6, 124);
    // let area4 = new THREE.Mesh(area4Geometry, material);
    // // position the cube
    // area4.position.set(0.0, 3.0, 125.0);
    // // add the cube to the scene
    // scene.add(area4);

    // // create area 1
    // let area1Geometry = new THREE.BoxGeometry(124, 6, 124);
    // let area1 = new THREE.Mesh(area1Geometry, material);
    // // position the cube
    // area1.position.set(-156.0, 3.0, -125.0);
    // // add the cube to the scene
    // scene.add(area1);

    // // create area 2
    // let material2 = setDefaultMaterial("green");
    // let area2Geometry = new THREE.BoxGeometry(124, 6, 124);
    // let area2 = new THREE.Mesh(area2Geometry, material2);
    // // position the cube
    // area2.position.set(0.0, 3.0, -125.0);
    // // add the cube to the scene
    // scene.add(area2);

    // // create area 3
    // let material3 = setDefaultMaterial("blue");
    // let area3Geometry = new THREE.BoxGeometry(124, 6, 124);
    // let area3 = new THREE.Mesh(area3Geometry, material3);
    // // position the cube
    // area3.position.set(156.0, 3.0, -125.0);
    // // add the cube to the scene
    // scene.add(area3);


    // //Referenciar o meio
    // let meioG = new THREE.BoxGeometry(1, 1, 1);
    // let meio = new THREE.Mesh(meioG, material);
    // // position the cube
    // meio.position.set(0.0, 1.0, 0.0);
    // // add the cube to the scene
    // scene.add(meio);

    // create a cube
var cubeGeometry = new THREE.BoxGeometry(4, 4, 4);
var cube = new THREE.Mesh(cubeGeometry, material);
// position the cube
cube.position.set(0.0, 2.0, 0.0);
// add the cube to the scene
scene.add(cube);

  const cubeBox = new THREE.Box3().setFromObject(cube);
  }
}

render();

function keyboardUpdate() {

  keyboard.update();

  var speed = 30;
  var moveDistance = speed * clock.getDelta();

  // Keyboard.down - execute only once per key pressed
  if ( keyboard.down("left") )   cube.translateX( -1 );
  if ( keyboard.down("right") )  cube.translateX(  1 );
  if ( keyboard.down("down") )     cube.translateZ(  1 );
  if ( keyboard.down("up") )   cube.translateZ( -1 );

  // Keyboard.pressed - execute while is pressed
  if ( keyboard.pressed("A") )  cube.translateX( -moveDistance );
  if ( keyboard.pressed("D") )  cube.translateX(  moveDistance );
  if ( keyboard.pressed("S") )  cube.translateZ(  moveDistance );
  if ( keyboard.pressed("W") )  cube.translateZ( -moveDistance );
}

let map = new Map();

// Use this to show information onscreen
let controls = new InfoBox();
  controls.add("Basic Scene");
  controls.addParagraph();
  controls.add("Use mouse to interact:");
  controls.add("* Left button to rotate");
  controls.add("* Right button to translate (pan)");
  controls.add("* Scroll to zoom in/out.");
  controls.show();

  function checkCollisions(object)
{
   let collision = cubeBox.intersectsBox(object);
   if(collision) infoBox.changeMessage("Collision detected");
}

render();
function render()
{
  checkCollisions(cube);
  requestAnimationFrame(render);
  keyboardUpdate();
  renderer.render(scene, camera) // Render scene
}
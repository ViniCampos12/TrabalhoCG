import * as THREE from  'three';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import KeyboardState from '../libs/util/KeyboardState.js'
import {initRenderer, 
        initCamera, 
        initDefaultBasicLight,
        setDefaultMaterial,
        InfoBox,
        onWindowResize,
        createGroundPlaneXZ} from "../libs/util/util.js";

let scene, renderer, camera, material, light, orbit; // Initial variables 
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer();    // Init a basic renderer
camera = initCamera(new THREE.Vector3(0, 15, 30)); // Init camera in this position
material = setDefaultMaterial(); // create a basic material
light = initDefaultBasicLight(scene); // Create a basic light to illuminate the scene
orbit = new OrbitControls( camera, renderer.domElement ); // Enable mouse rotation, pan, zoom etc.

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

// To be used to manage keyboard
let clock = new THREE.Clock();

// Show text information onscreen
showInformation();

// To use the keyboard
var keyboard = new KeyboardState();
const raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0).normalize(), 0, 2);

// Show axes (parameter is size of each axis)
var axesHelper = new THREE.AxesHelper( 12 );
scene.add( axesHelper );

// create the ground plane
let plane = createGroundPlaneXZ(20, 20)
scene.add(plane);

// create a cube
var cubeGeometry = new THREE.BoxGeometry(4, 4, 4);
var cube = new THREE.Mesh(cubeGeometry, material);
// position the cube
cube.position.set(0.0, 2.0, 0.0);
// add the cube to the scene
scene.add(cube);

const rampGeometry = new THREE.PlaneGeometry(11, 10);
const ramp = new THREE.Mesh(rampGeometry, material);
ramp.rotation.x = 1.5 * Math.PI;
ramp.rotation.y = -Math.PI / 6;
ramp.position.set(28.5, 2, 0);
scene.add(ramp);

render();

function keyboardUpdate() {

  keyboard.update();
  const isIntersectingRamp = raycaster.intersectObject(ramp).length > 0;

  var speed = 30;
  var moveDistance = speed * clock.getDelta();

  // Keyboard.down - execute only once per key pressed
  if ( keyboard.down("left") )   cube.translateX( -1 );
  if ( keyboard.down("right") )  cube.translateX(  1 );
  if ( keyboard.down("up") )     cube.translateZ(  1 );
  if ( keyboard.down("down") )   cube.translateZ( -1 );

  // Keyboard.pressed - execute while is pressed
  if ( keyboard.pressed("A") )  cube.translateX( -moveDistance );
  if ( keyboard.pressed("D") )  cube.translateX(  moveDistance );
  if ( keyboard.pressed("W") )  cube.translateZ(  moveDistance );
  if ( keyboard.pressed("S") )  cube.translateZ( -moveDistance );

  if ( keyboard.pressed("space") ) cube.position.set(0.0, 2.0, 0.0);

  else if (isIntersectingRamp) {
        camera.position.y += speed / 2 * delta;
    }
}

function showInformation()
{
  // Use this to show information onscreen
  var controls = new InfoBox();
    controls.add("Keyboard Example");
    controls.addParagraph();
    controls.add("Press WASD keys to move continuously");
    controls.add("Press arrow keys to move in discrete steps");
    controls.add("Press SPACE to put the cube in its original position");
    controls.show();
}

function render()
{
  requestAnimationFrame(render); // Show events
  keyboardUpdate();
  renderer.render(scene, camera) // Render scene
}

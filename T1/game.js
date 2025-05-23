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

    // create a cube
    let map = new Map(scene);
    const obj = map.getWall();
    var cubeGeometry = new THREE.BoxGeometry(4, 4, 4);
    var cube = new THREE.Mesh(cubeGeometry, material);
    // position the cube
    cube.position.set(0.0, 2.0, 0.0);
    // add the cube to the scene
    scene.add(cube);

  const cubeBox = new THREE.Box3().setFromObject(cube);
  // console.log();
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
   if(collision) console.log("collision detected")
}

render();
function render()
{
    // checkCollisions(obj)
  
  requestAnimationFrame(render);
  keyboardUpdate();
  renderer.render(scene, camera) // Render scene
}
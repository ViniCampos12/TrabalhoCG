import * as THREE from  'three';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
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
camera = initCamera(new THREE.Vector3(0, 20, 250)); // Init camera in this position
material = setDefaultMaterial(); // create a basic material
light = initDefaultBasicLight(scene); // Create a basic light to illuminate the scene
orbit = new OrbitControls( camera, renderer.domElement ); // Enable mouse rotation, pan, zoom etc.

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

// Show axes (parameter is size of each axis)
// let axesHelper = new THREE.AxesHelper( 12 );
// scene.add( axesHelper );

class Map{
  constructor(){
    // create the ground plane
    let plane = createGroundPlaneXZ(500, 500);
    scene.add(plane);

    // create area 4
    let area4Geometry = new THREE.BoxGeometry(312, 6, 124);
    let area4 = new THREE.Mesh(area4Geometry, material);
    // position the cube
    area4.position.set(0.0, 3.0, 125.0);
    // add the cube to the scene
    scene.add(area4);

     let area1Geometry = new THREE.BoxGeometry(124, 6, 108);
    
    // create area 1
    let area1 = new THREE.Mesh(area1Geometry, material);
    // position the cube
    area1.position.set(-156.0, 3.0, -125.0);
    // add the cube to the scene
    scene.add(area1);

    //Create Extend Area of area 1
    let smallExtendedAreaGeometry = new THREE.BoxGeometry(30,6,16);
    let smallExtendedArea = new THREE.Mesh(smallExtendedAreaGeometry,material);
    area1.add(smallExtendedArea);
    smallExtendedArea.position.set(-47,0,54);

    let bigExtendedAreaGeometry = new THREE.BoxGeometry(78,6,16);
    let bigExtendedArea = new THREE.Mesh(bigExtendedAreaGeometry,material);
    area1.add(bigExtendedArea);
    bigExtendedArea.position.set(23,0,54);

    // create area 2
    let material2 = setDefaultMaterial("green");
    let area2 = new THREE.Mesh(area1Geometry, material2);
    // position the cube
    area2.position.set(0.0, 3.0, -125.0);
    // add the cube to the scene
    scene.add(area2);

    //Create Extend Area of area 2
    let extendedAreaGeometry = new THREE.BoxGeometry(54,6,16);
    let extendedArea = new THREE.Mesh(extendedAreaGeometry,material2);
    area2.add(extendedArea);
    extendedArea.position.set(35,0,54);
    
    let extendedArea2 = new THREE.Mesh(extendedAreaGeometry,material2);
    area2.add(extendedArea2);
    extendedArea2.position.set(-35,0,54);


    // create area 3
    let material3 = setDefaultMaterial("blue");
    let area3 = new THREE.Mesh(area1Geometry, material3);
    // position the cube
    area3.position.set(156.0, 3.0, -125.0);
    // add the cube to the scene
    scene.add(area3);

    //Create Extend Area of area 3
    let smallExtendedAreaGeometry3 = new THREE.BoxGeometry(30,6,16);
    let smallExtendedArea3 = new THREE.Mesh(smallExtendedAreaGeometry3,material3);
    area3.add(smallExtendedArea3);
    smallExtendedArea3.position.set(47,0,54);

    let bigExtendedAreaGeometry3 = new THREE.BoxGeometry(78,6,16);
    let bigExtendedArea3= new THREE.Mesh(bigExtendedAreaGeometry3,material3);
    area3.add(bigExtendedArea3);
    bigExtendedArea3.position.set(-23,0,54);


    //Referenciar o meio
    let meioG = new THREE.BoxGeometry(1, 1, 1);
    let meio = new THREE.Mesh(meioG, material);
    // position the cube
    meio.position.set(0.0, 1.0, 0.0);
    // add the cube to the scene
    scene.add(meio);
  }
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

render();
function render()
{
  requestAnimationFrame(render);
  renderer.render(scene, camera) // Render scene
}
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
camera = initCamera(new THREE.Vector3(0, 10, 150)); // Init camera in this position
material = setDefaultMaterial(); // create a basic material
light = initDefaultBasicLight(scene); // Create a basic light to illuminate the scene
orbit = new OrbitControls( camera, renderer.domElement ); // Enable mouse rotation, pan, zoom etc.

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

// Show axes (parameter is size of each axis)
// let axesHelper = new THREE.AxesHelper( 12 );
// scene.add( axesHelper );


class Ladder{
  constructor(material){
    let biggerStepGeometry = new THREE.BoxGeometry(16,0.75,1);
    let biggerStep = new THREE.Mesh(biggerStepGeometry,material);

    
    let step = new THREE.Mesh(biggerStepGeometry,material);
    biggerStep.add(step);
    step.position.set(0,-0.75,1);

    let step2 = new THREE.Mesh(biggerStepGeometry,material);
    step.add(step2);
    step2.position.set(0,-0.75,1);

    let step3 = new THREE.Mesh(biggerStepGeometry,material);
    step2.add(step3);
    step3.position.set(0,-0.75,1);

    let step4 = new THREE.Mesh(biggerStepGeometry,material);
    step3.add(step4);
    step4.position.set(0,-0.75,1);

    let step5 = new THREE.Mesh(biggerStepGeometry,material);
    step4.add(step5);
    step5.position.set(0,-0.75,1);

     let step6 = new THREE.Mesh(biggerStepGeometry,material);
    step5.add(step6);
    step6.position.set(0,-0.75,1);

     let step7 = new THREE.Mesh(biggerStepGeometry,material);
    step6.add(step7);
    step7.position.set(0,-0.75,1);
    
    return biggerStep;
  }
}

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

    let extendedAreaGeometry4 = new THREE.BoxGeometry(140,6,8);
    let extendedArea4 = new THREE.Mesh(extendedAreaGeometry4,material);
    area4.add(extendedArea4);
    extendedArea4.position.set(86,0,-66);
    
     let extendedArea42 = new THREE.Mesh(extendedAreaGeometry4,material);
     area4.add(extendedArea42);
     extendedArea42.position.set(-86,0,-66);

    // create area 1
    let area1Geometry = new THREE.BoxGeometry(124, 6, 108);
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



    //Creates the border´s wall
    let materialWall = setDefaultMaterial("gray");
    let wallGeometry = new THREE.BoxGeometry(499,10,1);
    let wallBottom = new THREE.Mesh(wallGeometry,materialWall);
    scene.add(wallBottom);
    wallBottom.position.set(0,5,249);

    let wallTop = new THREE.Mesh(wallGeometry,materialWall);
    scene.add(wallTop);
    wallTop.position.set(0,5,-249);

    let angle = THREE.MathUtils.degToRad(90);

    let wallLeft = new THREE.Mesh(wallGeometry,materialWall);
    scene.add(wallLeft);
    wallLeft.position.set(250,5,0);
    wallLeft.rotateY(angle);

    let wallRight = new THREE.Mesh(wallGeometry,materialWall);
    scene.add(wallRight);
    wallRight.position.set(-250,5,0);
    wallRight.rotateY(angle);



    //Creates ladder
    const ladder = new Ladder(material);
    area1.add(ladder);
    ladder.position.set(-24,2.6,54.5);

    const ladder2 = new Ladder(material2);
    area2.add(ladder2);
    ladder2.position.set(0,2.6,54.5);

    const ladder3 = new Ladder(material3);
    area3.add(ladder3);
    ladder3.position.set(24,2.6,54.5);

    const ladder4 = new Ladder(material);
    area4.add(ladder4);
    ladder4.position.set(8,2.6,-62.5);
    let angleLadder = THREE.MathUtils.degToRad(180);
    ladder4.rotateY(angleLadder);

    const ladder5 = new Ladder(material);
    area4.add(ladder5);
    ladder5.position.set(-8,2.6,-62.5);
    ladder5.rotateY(angleLadder);
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
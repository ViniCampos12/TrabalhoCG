import * as THREE from  'three';
import { createGroundPlaneXZ, setDefaultMaterial } from '../libs/util/util.js';
import Ladder from './ladder.js';

export let wallBox;
 export   let wall; 

class Map{
  
  constructor(scene){
    this.scene = scene;
    this.wallsBox = [];
    this.areasBox = [];
    this.ladderBig = new Ladder();
    this.piramide = new THREE.Mesh();


    
    

    // create the ground plane
    let plane = createGroundPlaneXZ(500, 500);
    scene.add(plane);



    // creating bigger area
    let material = setDefaultMaterial("rgb(63,81,181)"); 

    let area = this.createBiggerArea(material,0,3,125);
    scene.add(area);

    // create area 1
    let material1 = setDefaultMaterial("rgb(46,139,87)");
    let area1 = this.createDefaultArea(material1,-156,3,-125);
    scene.add(area1);

    //Create Extend Area of area 1
    let smallExtendedAreaGeometry = new THREE.BoxGeometry(30,6,16);
    let smallExtendedArea = new THREE.Mesh(smallExtendedAreaGeometry,material1);
    area1.add(smallExtendedArea);
    smallExtendedArea.position.set(-47,0,54);

    let bigExtendedAreaGeometry = new THREE.BoxGeometry(78,6,16);
    let bigExtendedArea = new THREE.Mesh(bigExtendedAreaGeometry,material1);
    area1.add(bigExtendedArea);
    bigExtendedArea.position.set(23,0,54);

    //Create bb
    const wallBox1 = new THREE.Box3().setFromObject(area1);
    
    this.areasBox.push(wallBox1);

    //Create ladder
    const ladder = new Ladder(material1);
    area1.add(ladder);
    ladder.position.set(-24,2.6,54.5);
    
    
    


    // create area 2
    let material2 = setDefaultMaterial("rgb(168,50,121)");
    let area2 = this.createDefaultArea(material2,0,3,-125);
    scene.add(area2);

    //Create Extend Area of area 2
    let extendedAreaGeometry2 = new THREE.BoxGeometry(54,6,16);
    let extendedArea = new THREE.Mesh(extendedAreaGeometry2,material2);
    area2.add(extendedArea);
    extendedArea.position.set(35,0,54);
    
    let extendedArea2 = new THREE.Mesh(extendedAreaGeometry2,material2);
    area2.add(extendedArea2);
    extendedArea2.position.set(-35,0,54);

    //Create ladder
    const ladder2 = new Ladder(material2);
    area2.add(ladder2);
    ladder2.position.set(0,2.6,54.5);

    

    //Create bb
    const wallBox2 = new THREE.Box3().setFromObject(area2);
    this.areasBox.push(wallBox2);


    // create area 3
    let material3 = setDefaultMaterial("rgb(139,90,43)");
    let area3 = this.createDefaultArea(material3,156,3,-125);
    area3.position.set(156.0, 3.0, -125.0);
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

    const ladder3 = new Ladder(material3);
    area3.add(ladder3);
    ladder3.position.set(24,2.6,54.5);


    

    //Create bb
    const wallBox3 = new THREE.Box3().setFromObject(area3);
    this.areasBox.push(wallBox3);

    this.createBorder(scene);  

    console.log("Areas");
    console.log(this.areasBox);

  }

  createBiggerArea(material, x, y, z){
    let areaGeometry = new THREE.BoxGeometry(312, 6, 124);
    let area = new THREE.Mesh(areaGeometry, material);
    area.position.set(x, y, z);

    let extendedAreaGeometry = new THREE.BoxGeometry(140,6,8);
    for(let i=-1;i<2;i=i+2){
        let extendedArea = new THREE.Mesh(extendedAreaGeometry,material);
        area.add(extendedArea);
        extendedArea.position.set(i*86,0,-66);
    }


    let angleLadder = THREE.MathUtils.degToRad(180);

    for(let i =-1;i<2;i++){
      this.ladder = new Ladder(material);
      area.add(this.ladder);
      this.ladder.position.set(8.2*i,2.6,-62.5);
      this.ladder.rotateY(angleLadder);
      const b = new THREE.Box3().setFromObject(this.ladder);

    const minX = b.min.z;
    const maxX = b.max.z;

    console.log(minX);
    console.log(maxX);
    }

    //Create bb
    const wallBox = new THREE.Box3().setFromObject(area);
    this.areasBox.push(wallBox);

    return area;
  }

  createDefaultArea(material, x, y, z){
    let areaGeometry = new THREE.BoxGeometry(124, 6, 108);
    let area = new THREE.Mesh(areaGeometry, material);
    // position the cube
    area.position.set(x, y, z);

    return area;
  }

  createBorder(scene){
    //Creates the border´s wall
    let materialWall = setDefaultMaterial("rgb(59,59,59)");
    let wallGeometry = new THREE.BoxGeometry(499,10,1);

    for(let i = -1;i<2;i=i+2){
       wall = new THREE.Mesh(wallGeometry,materialWall);
      wall.position.set(0,5,249*i);
      wallBox = new THREE.Box3().setFromObject(wall);
      scene.add(wall);

      this.wallsBox.push(wallBox);
    }

    let angle = THREE.MathUtils.degToRad(90);

    for(let i=-1;i<2;i=i+2){
      wall = new THREE.Mesh(wallGeometry,materialWall);
      wall.position.set(250*i,5,0);
      wall.rotateY(angle);
      wallBox = new THREE.Box3().setFromObject(wall);
      scene.add(wall);

      this.wallsBox.push(wallBox);
    }
  }

  getWallBoxes(){
    console.log(this.wallsBox); 
    return this.wallsBox;
  }

  getAreaBoxes(){
    return this.areasBox;
  }

  // createBBHelper(bb, color)
  // {
  //    // Create a bounding box helper
  //    let helper = new THREE.Box3Helper( bb, color);
  //    this.scene.add( helper );
  //    return helper;
  // }
  
}

export default Map;
import * as THREE from  'three';
import { createGroundPlaneXZ, InfoBox, setDefaultMaterial } from '../libs/util/util.js';
import Ladder from './ladder.js';
import { CSG } from '../libs/other/CSGMesh.js';

export let wallBox;
 export   let wall; 

class Map{
  
  constructor(scene){
    this.scene = scene;
    this.wallsBox = [];   //Vetor with all bb´s of wall
    this.areasBox = [];   //Vetor with all bb´s of areas
    this.collumnsBox = []; //Vetor with all bb´s of collumns
    this.blocksBox = []; //Vetor with all bb´s of blocks
    this.ladderBig = new Ladder();
    this.ramps = [];
    this.suport1 = null;
    this.suport1Box = null;
    this.suport2Box = null;
    this.door = null; // Porta da área 2
    this.doorBox = null; // Bounding box da porta


    // create the ground plane
    let plane = createGroundPlaneXZ(500, 500);
    plane.receiveShadow = true; // A área também deve receber sombras
    scene.add(plane);


    // creating bigger area
    let material = new THREE.MeshLambertMaterial({ color: "rgb(63,81,181)" });

    let area = this.createBiggerArea(material,0,3,125);
    scene.add(area);

    // create area 1
    let material1 = new THREE.MeshLambertMaterial({ color: "rgb(46,139,87)" });
    let area1 = this.createDefaultArea(material1,-156,2,-125,4);
    

    //Create Extend Area of area 1
    let smallExtendedAreaGeometry = new THREE.BoxGeometry(30,4,16);
    let smallExtendedArea = new THREE.Mesh(smallExtendedAreaGeometry,material1);
    smallExtendedArea.castShadow = true; // A área pequena também deve projetar sombras
    smallExtendedArea.receiveShadow = true; // A área pequena também deve receber sombras
    area1.add(smallExtendedArea);
    smallExtendedArea.position.set(-47,0,54);

    let bigExtendedAreaGeometry = new THREE.BoxGeometry(78,4,16);
    let bigExtendedArea = new THREE.Mesh(bigExtendedAreaGeometry,material1);
    bigExtendedArea.castShadow = true; // A área também deve projetar sombras
    bigExtendedArea.receiveShadow = true; // A área também deve receber sombras
    area1.add(bigExtendedArea);
    bigExtendedArea.position.set(23,0,54);

    //Create bb
    const wallBox1 = new THREE.Box3().setFromObject(area1);
    this.areasBox.push(wallBox1);

    //Create ladder
    const l1 = new Ladder(material1);
    const ladder = l1.createLadder();
    area1.add(ladder);
    ladder.position.set(-24,1.6,54.5);
    this.ramps.push(l1.getRampMesh());
    // console.log("Ladder created and added to area 1");
    // console.log(this.ramps);  

    //Add collunms
    let zInicial = 56;
    for(let i=0;i<13;i++){
      if(i%2 == 0)
        this.createColluns(area1, 60, 12, zInicial,false);
      else{
        this.createColluns(area1,-60,12,zInicial,false);
        zInicial -= 18;
      }  
    }

    let xInicial = 51;
    for(let i=0;i<7;i++){
      this.createColluns(area1,xInicial,12,-53,true);
      xInicial -= 18;
    }
    
    //Add collumns on the top
    let topCollumnGeometry = new THREE.BoxGeometry(5,2,80);
    let topCollumn = new THREE.Mesh(topCollumnGeometry, setDefaultMaterial("rgb(114, 18, 112)"));
    topCollumn.position.set(59, 23, -13);
    area1.add(topCollumn);

    let topCollumn2 = new THREE.Mesh(topCollumnGeometry, setDefaultMaterial("rgb(114, 18, 112)"));
    topCollumn2.position.set(-59, 23, -13);
    area1.add(topCollumn2);
    
    let topCollumnGeometryBack = new THREE.BoxGeometry(123,2,5);
    let topCollumnBack = new THREE.Mesh(topCollumnGeometryBack, setDefaultMaterial("rgb(114, 18, 112)"));
    topCollumnBack.position.set(0, 23, -52);
    area1.add(topCollumnBack);
    
    //Add plataform on the middle
    let suportGeometry = new THREE.BoxGeometry(2,4,2);
    this.suport1 = new THREE.Mesh(suportGeometry, setDefaultMaterial("rgb(24, 199, 181)"));
    this.suport1.position.set(0, -10, 0);
    this.suport1Box = new THREE.Box3().setFromObject(this.suport1);
    // let helper3 = new THREE.Box3Helper(this.suport1Box, 'white');
    // this.scene.add(helper3); // helper deve estar na scene
    this.collumnsBox.push(this.suport1Box);

    let keyMesh = this.createKey();
    let keyBox = new THREE.Box3().setFromObject(keyMesh);
    this.collumnsBox.push(keyBox);
    this.suport1.add(keyMesh);

    area1.add(this.suport1);

     


    scene.add(area1);

    // create area 2
    let material2 = new THREE.MeshLambertMaterial({ color: "rgb(168,50,121)" });
    let area2 = this.createDefaultArea(material2,0,3,-125,6);
    

    //Create Extend Area of area 2
    let extendedAreaGeometry2 = new THREE.BoxGeometry(54,6,16);
    let extendedArea = new THREE.Mesh(extendedAreaGeometry2,material2);
    extendedArea.castShadow = true; // A área também deve projetar sombras
    extendedArea.receiveShadow = true; // A área também deve receber sombras
    area2.add(extendedArea);
    extendedArea.position.set(35,0,54);
    
    let extendedArea2 = new THREE.Mesh(extendedAreaGeometry2,material2);
    area2.add(extendedArea2);
    extendedArea2.position.set(-35,0,54);

    //Create bb
    const wallBox2 = new THREE.Box3().setFromObject(area2);
    this.areasBox.push(wallBox2);

    // Create door
    const doorGeometry = new THREE.BoxGeometry(16, 8, 0.1);
    const doorMaterial = new THREE.MeshLambertMaterial({ color: "rgb(157, 157, 157)" });
    this.door = new THREE.Mesh(doorGeometry, doorMaterial);
    this.door.castShadow = true; // A porta também deve projetar sombras
    this.door.receiveShadow = true; // A porta também deve receber sombras 
    
    this.door.position.set(0, 0, 62);
    area2.add(this.door);

    this.doorBox = new THREE.Box3().setFromObject(this.door);
    this.blocksBox.push(this.doorBox);
    let helper = new THREE.Box3Helper(this.doorBox, 'white');
    this.scene.add(helper); // helper deve estar na scene
    
    const doorfloorGeometry = new THREE.BoxGeometry(16, 0.05, 0.1);
    const doorfloor = new THREE.Mesh(doorfloorGeometry, doorMaterial);
    doorfloor.receiveShadow = true;
    doorfloor.position.set(0, -3, 62);
    area2.add(doorfloor); 
    
    const plataformGeometry = new THREE.BoxGeometry(16,0.1,6);
    const plataformMaterial = new THREE.MeshLambertMaterial({ color: "rgb(153, 39, 39)" });
    this.plataform = new THREE.Mesh(plataformGeometry, plataformMaterial);
    this.plataform.castShadow = true; 
    this.plataform.receiveShadow = true; 
    this.plataform.position.set(0, 3, 57);
    area2.add(this.plataform);
    this.plataformBox = new THREE.Box3().setFromObject(this.plataform);
    // const helperp = new THREE.Box3Helper(this.plataformBox, 0xffff00);
    // scene.add(helperp);

    this.suport2 = new THREE.Mesh(suportGeometry, setDefaultMaterial("rgb(24, 199, 181)"));
    this.suport2.position.set(10, 1, -55);
    scene.add(this.suport2);
    this.suport2Box = new THREE.Box3().setFromObject(this.suport2);
    

    //Create blocks
    this.createBlocks(area2,20,10,20,20);
    this.createBlocks(area2,-50,10,50,20);
    this.createBlocks(area2,30,10,10,20);
    this.createBlocks(area2,0,10,0,20);
    this.createBlocks(area2,-20,10,10,20);
    this.createBlocks(area2,-40,10,30,20);
    this.createBlocks(area2,40,10,50,20);
    this.createBlocks(area2,50,10,-20,20);
    this.createBlocks(area2,-40,10,-40,20);
    this.createBlocks(area2,-1,10,-40,20);

    
    // let helper = new THREE.Box3Helper(wallBox2, 'white');
    // this.scene.add(helper); // helper deve estar na scene 
    scene.add(area2);

    // create area 3
    let material3 = new THREE.MeshLambertMaterial({ color: "rgb(139,90,43)" });
    let area3 = this.createDefaultArea(material3,156,3,-125,6);
    area3.position.set(156.0, 3.0, -125.0);
    scene.add(area3);

    //Create Extend Area of area 3
    let smallExtendedAreaGeometry3 = new THREE.BoxGeometry(30,6,16);
    let smallExtendedArea3 = new THREE.Mesh(smallExtendedAreaGeometry3,material3);
    smallExtendedArea3.castShadow = true; // A área também deve projetar sombras
    smallExtendedArea3.receiveShadow = true; // A área também deve receber sombras
    area3.add(smallExtendedArea3);
    smallExtendedArea3.position.set(47,0,54);

    let bigExtendedAreaGeometry3 = new THREE.BoxGeometry(78,6,16);
    let bigExtendedArea3= new THREE.Mesh(bigExtendedAreaGeometry3,material3);
    bigExtendedArea3.castShadow = true; // A área também deve projetar sombras
    bigExtendedArea3.receiveShadow = true; // A área também deve receber sombras
    area3.add(bigExtendedArea3);
    bigExtendedArea3.position.set(-23,0,54);

    const l3 = new Ladder(material3);
    const ladder3 = l3.createLadder();
    area3.add(ladder3);
    ladder3.position.set(24,2.6,54.5);
    this.ramps.push(l3.getRampMesh());

    //Create bb
    const wallBox3 = new THREE.Box3().setFromObject(area3);
    this.areasBox.push(wallBox3);


    //Create side walls
    this.createBorder(scene);
    this.createInfoArea(); 
  }

  createBiggerArea(material, x, y, z){
    let areaGeometry = new THREE.BoxGeometry(312, 6, 124);
    let area = new THREE.Mesh(areaGeometry, material);
    area.position.set(x, y, z);
    area.castShadow = true; // A área principal deve projetar sombras
    area.receiveShadow = true; // A área principal deve receber sombras

    let extendedAreaGeometry = new THREE.BoxGeometry(140,6,8);
    for(let i=-1;i<2;i=i+2){
        let extendedArea = new THREE.Mesh(extendedAreaGeometry,material);
        extendedArea.castShadow = true; // As extensões também devem projetar sombras
        extendedArea.receiveShadow = true; // As extensões também devem receber sombras
        area.add(extendedArea);
        extendedArea.position.set(i*86,0,-66);
    }


    let angleLadder = THREE.MathUtils.degToRad(180);

    for(let i =-1;i<2;i++){
      this.ladder = new Ladder(material);
      let ladderCreated = this.ladder.createLadder();
      area.add(ladderCreated);
      ladderCreated.position.set(8.2*i,2.6,-62.5);
      ladderCreated.rotateY(angleLadder);
      const b = new THREE.Box3().setFromObject(ladderCreated);
      this.ramps.push(this.ladder.getRampMesh());
    }

    //Create bb
    const wallBox = new THREE.Box3().setFromObject(area);
    this.areasBox.push(wallBox);

    return area;
   }

  createDefaultArea(material, x, y, z,height){
    let areaGeometry = new THREE.BoxGeometry(124, height, 108);
    let area = new THREE.Mesh(areaGeometry, material);
    area.position.set(x, y, z);
    area.castShadow = true; // A área deve projetar sombras
    area.receiveShadow = true; // A área deve receber sombras
    return area;
  }

  createBorder(scene){
    //Creates the border´s wall
    let materialWall = new THREE.MeshLambertMaterial({ color: "rgb(59,59,59)" });
    let wallGeometry = new THREE.BoxGeometry(499,10,1);

    for(let i = -1;i<2;i=i+2){
       wall = new THREE.Mesh(wallGeometry,materialWall);
      wall.castShadow = true; // A parede também deve projetar sombras
      wall.receiveShadow = true; // A parede também deve receber sombras
      wall.position.set(0,5,249*i);
      wallBox = new THREE.Box3().setFromObject(wall);
      scene.add(wall);

      this.wallsBox.push(wallBox);
    }

    let angle = THREE.MathUtils.degToRad(90);

    for(let i=-1;i<2;i=i+2){
      wall = new THREE.Mesh(wallGeometry,materialWall);
      wall.castShadow = true; // A parede também deve projetar sombras
      wall.receiveShadow = true; // A parede também deve receber sombras  
      wall.position.set(250*i,5,0);
      wall.rotateY(angle);
      wallBox = new THREE.Box3().setFromObject(wall);
      scene.add(wall);

      this.wallsBox.push(wallBox);
    }
  }

  createColluns(area, x, y, z, rotacionaFundo){
     let collumnGeometry = new THREE.CylinderGeometry(2, 2, 20);
    let collumnMaterial = setDefaultMaterial("rgb(114, 18, 112)");
    let collumn = new THREE.Mesh(collumnGeometry, collumnMaterial);
    collumn.position.set(x, y, z);

    area.add(collumn); // Adiciona primeiro à área

    // Atualiza matriz mundial para que o THREE saiba a posição correta do objeto no mundo
    collumn.updateMatrixWorld(true);

    // Adiciona bb
    let collumnBox = new THREE.Box3().setFromObject(collumn);
    this.collumnsBox.push(collumnBox);

    // let helper = new THREE.Box3Helper(collumnBox, 'white');
    // this.scene.add(helper); // helper deve estar na scene
  }

  createBlocks(area,x,y,z,height){
    let blockGeometry = new THREE.BoxGeometry(4, height, 4);
    let blockMaterial = new THREE.MeshLambertMaterial({ color: "rgb(171, 98, 21)" });
    let block = new THREE.Mesh(blockGeometry, blockMaterial);
    block.castShadow = true; 
    block.receiveShadow = true; 
    block.position.set(x, y, z);

    area.add(block); // Adiciona à área (Group)

    // IMPORTANTE: atualiza transformações até a cena
    block.updateMatrixWorld(true); // <-- aqui

    // Bounding box com posição correta no mundo
    let blockBox = new THREE.Box3().setFromObject(block);
    this.blocksBox.push(blockBox);
  }

  createKey(){
    let auxMat = new THREE.Matrix4();
    let cubeMesh = new THREE.Mesh(new THREE.BoxGeometry(1.4,1.4,1.4));
    let cylinderMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.4, 20));
    let cylinderMesh2 = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.4, 20));
    let cylinderMesh3 = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.4, 20));

    cylinderMesh.position.set(0, 0, 0)
    cylinderMesh.matrixAutoUpdate = false;
    cylinderMesh.updateMatrix();
    cylinderMesh2.position.set(0, 0, 0)
    cylinderMesh2.rotateX(THREE.MathUtils.degToRad(90));
    cylinderMesh2.rotateZ(THREE.MathUtils.degToRad(90));
    cylinderMesh2.matrixAutoUpdate = false;
    cylinderMesh2.updateMatrix();
    cylinderMesh3.position.set(0, 0, 0)
    cylinderMesh3.rotateX(THREE.MathUtils.degToRad(90));
    cylinderMesh3.matrixAutoUpdate = false;
    cylinderMesh3.updateMatrix();
    

    let cubeCSG = CSG.fromMesh(cubeMesh);
    let cylinderCSG = CSG.fromMesh(cylinderMesh);
    let cylinderCSG2 = CSG.fromMesh(cylinderMesh2);
    let cylinderCSG3 = CSG.fromMesh(cylinderMesh3);
    let csgObject = cubeCSG.subtract(cylinderCSG).subtract(cylinderCSG2).subtract(cylinderCSG3);
    // csgObject = cubeCSG.subtract(cylinderCSG2);
    let keyMesh = CSG.toMesh(csgObject, auxMat);
    keyMesh.material = new THREE.MeshPhongMaterial({color:"red", shininess:"200"});
    keyMesh.position.set(0, 2.6 , 0);

    return keyMesh;
  }

  getWallBoxes(){
    return this.wallsBox;
  }

  getAreaBoxes(){
    return this.areasBox;
  }

  getCollumnsBoxes(){
    return this.collumnsBox;
  }

  getBlocksBoxes(){
    return this.blocksBox;
  }

  getSuport2Box(){
    return this.suport2Box;
  }

  getRamps(){
    return this.ramps;
  }


  createInfoArea(){
    // Info box
    let instrucao = new InfoBox();
    instrucao.add("PointerLockControls com cubo vinculado");
    instrucao.addParagraph();
    instrucao.add("Clique na tela para ativar o controle com o mouse.");
    instrucao.add("Use W, A, S, D para mover o cubo com a câmera dentro.");
    instrucao.add("Use o clique do mouse para realizar disparos.");
    instrucao.show();
  }
  
}

export default Map;
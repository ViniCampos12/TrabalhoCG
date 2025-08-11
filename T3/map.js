import * as THREE from  'three';
import { createGroundPlaneXZ, degreesToRadians, InfoBox, setDefaultMaterial } from '../libs/util/util.js';
import Ladder from './ladder.js';
import { CSG } from '../libs/other/CSGMesh.js';
import { MeshLambertMaterial } from '../build/three.module.js';

export let wallBox;
 export   let wall; 

class Map{
  
  constructor(scene){
    //Atributos importante que são pegos pela game
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
    var textureLoader = new THREE.TextureLoader();

    // PLANO
    let planeGeometry = new THREE.PlaneGeometry(500, 500, 100, 100);
    let planeMaterial = new THREE.MeshLambertMaterial({ color: "rgba(251, 251, 251, 1)" });
    let plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.receiveShadow = true; // A área também deve receber sombras
    let mat4 = new THREE.Matrix4(); // Aux mat4 matrix
    // Rotate 90 in X and perform a small translation in Y
    plane.matrixAutoUpdate = false;
    plane.matrix.identity();    // resetting matrices
    plane.matrix.multiply(mat4.makeTranslation(0.0, -0.1, 0.0)); // T1   
    plane.matrix.multiply(mat4.makeRotationX(degreesToRadians(-90))); // R1 


    scene.add(plane);
    

    var floorTexture = textureLoader.load('../assets/textures/intertravado.jpg');
    floorTexture.colorSpace = THREE.SRGBColorSpace;

    plane.material.map = floorTexture;
    plane.material.map.wrapS = THREE.RepeatWrapping;
    plane.material.map.wrapT = THREE.RepeatWrapping;
    plane.material.map.repeat.set(60, 60);


    // ÁREA MAIOR
    let material = new THREE.MeshLambertMaterial({ color: "rgb(63,81,181)" });
    let area = this.createBiggerArea(material,0,3,125);
    scene.add(area);

    // ÁREA 1

    /// 1. Carregar texturas separadas para cada parte
    let texturaTopoPrincipal = textureLoader.load('assets/images/area1cortada.png');
    let texturaTopoExtendida = textureLoader.load('assets/images/area1cortada.png'); // Textura diferente para a parte extendida
    let texturaLateral = textureLoader.load('assets/images/area1clara.jpg');

    // Configurar repetições
    texturaTopoPrincipal.wrapS = THREE.RepeatWrapping;
    texturaTopoPrincipal.wrapT = THREE.RepeatWrapping;
    texturaTopoPrincipal.repeat.set(124/20, 116/20); // Ajuste conforme necessário
    texturaTopoPrincipal.colorSpace = THREE.SRGBColorSpace;

    texturaTopoExtendida.wrapS = THREE.RepeatWrapping;
    texturaTopoExtendida.wrapT = THREE.RepeatWrapping;
    texturaTopoExtendida.repeat.set(2,1); // Ou ajuste para a área extendida
    texturaTopoExtendida.colorSpace = THREE.SRGBColorSpace; // Configurar cor para sRGB

    texturaLateral.wrapS = THREE.RepeatWrapping;
    texturaLateral.wrapT = THREE.RepeatWrapping;
    texturaLateral.repeat.set(1, 1);
    texturaLateral.colorSpace = THREE.SRGBColorSpace; // Configurar cor para sRGB

    // 2. Criar materiais separados
    let materiaisPrincipal = [
      new THREE.MeshLambertMaterial({ map: texturaLateral }), // direita
      new THREE.MeshLambertMaterial({ map: texturaLateral }), // esquerda
      new THREE.MeshLambertMaterial({ map: texturaTopoPrincipal }), // topo principal
      new THREE.MeshLambertMaterial({ map: texturaLateral }), // baixo
      new THREE.MeshLambertMaterial({ map: texturaLateral }), // frente
      new THREE.MeshLambertMaterial({ map: texturaLateral })  // trás
    ];

    let materiaisExtendida = [
      new THREE.MeshLambertMaterial({ map: texturaLateral }), // direita
      new THREE.MeshLambertMaterial({ map: texturaLateral }), // esquerda
      new THREE.MeshLambertMaterial({ map: texturaTopoExtendida }), // topo extendido (diferente)
      new THREE.MeshLambertMaterial({ map: texturaLateral }), // baixo
      new THREE.MeshLambertMaterial({ map: texturaLateral }), // frente
      new THREE.MeshLambertMaterial({ map: texturaLateral })  // trás
    ];

    // 3. Criar a área principal
    let area1 = this.createDefaultArea(materiaisPrincipal, -156, 2, -125, 4);

    // 4. Criar áreas extendidas com materiais independentes
    let smallExtendedArea = new THREE.Mesh(
      new THREE.BoxGeometry(30, 4, 16),
      materiaisExtendida // Usa materiais com textura diferente
    );
    smallExtendedArea.position.set(-47, 0, 54);
    area1.add(smallExtendedArea);

    let bigExtendedArea = new THREE.Mesh(
      new THREE.BoxGeometry(78, 4, 16),
      materiaisExtendida // Usa materiais com textura diferente
    );
    bigExtendedArea.position.set(23, 0, 54);
    area1.add(bigExtendedArea);

    // // 5. Criar o topo com CSG (apenas para a área principal)
    // let auxMat = new THREE.Matrix4();
    // let planeMeshArea1 = new THREE.Mesh(
    //   new THREE.PlaneGeometry(124, 116),
    //   materiaisPrincipal[2] // Usa o material do topo principal
    // );
    // planeMeshArea1.rotation.x = Math.PI / 2; // Rotaciona para ficar horizontal
    // planeMeshArea1.position.set(0, 4, 0);

    // // Não inclua as áreas extendidas no CSG
    // let planeCSG = CSG.fromMesh(planeMeshArea1);
    // let area1Mesh = CSG.toMesh(planeCSG, auxMat);
    // area1Mesh.position.set(-156, 6, -125); // Posiciona corretamente
    // area1.add(area1Mesh);

    //Create bb
    const wallBox1 = new THREE.Box3().setFromObject(area1);
    this.areasBox.push(wallBox1);

    //Create ladder
    const l1 = new Ladder(materiaisExtendida[0]);
    const ladder = l1.createLadder();
    area1.add(ladder);
    ladder.position.set(-24,1.6,54.5);
    this.ramps.push(l1.getRampMesh());

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
    let topCollumn = new THREE.Mesh(topCollumnGeometry, new THREE.MeshLambertMaterial({color: "rgb(159, 146, 121)"}));
    topCollumn.castShadow = true;
    topCollumn.receiveShadow = true;
    topCollumn.position.set(59, 23, -13);
    area1.add(topCollumn);

    let topCollumn2 = new THREE.Mesh(topCollumnGeometry, new THREE.MeshLambertMaterial({color: "rgb(159, 146, 121)"}));
    topCollumn2.castShadow = true;
    topCollumn2.receiveShadow = true;
    topCollumn2.position.set(-59, 23, -13);
    area1.add(topCollumn2);
    
    let topCollumnGeometryBack = new THREE.BoxGeometry(123,2,5);
    let topCollumnBack = new THREE.Mesh(topCollumnGeometryBack, new THREE.MeshLambertMaterial({color: "rgb(159, 146, 121)"}));
    topCollumnBack.castShadow = true;
    topCollumnBack.receiveShadow = true;
    topCollumnBack.position.set(0, 23, -52);
    area1.add(topCollumnBack);
    
    //Add suport on the middle
    let suportGeometry = new THREE.BoxGeometry(2,4,2);
    this.suport1 = new THREE.Mesh(suportGeometry, new THREE.MeshLambertMaterial({ color: "rgb(143, 72, 38)" }));
    this.suport1.castShadow = true;
    this.suport1.receiveShadow = true;
    this.suport1.position.set(0, -10, 0);
    this.suport1Box = new THREE.Box3().setFromObject(this.suport1);
    this.collumnsBox.push(this.suport1Box);

    //Add key on suport
    this.keyMesh = this.createKey("red");
    let keyBox = new THREE.Box3().setFromObject(this.keyMesh);
    this.collumnsBox.push(keyBox);
    this.suport1.add(this.keyMesh);
    area1.add(this.suport1);

    scene.add(area1);



    // ÁREA 2
    let material2 = new THREE.MeshLambertMaterial({ color: "rgb(14, 21, 55)" });
    let area2 = this.createDefaultArea(material2,0,3,-125,6);
    
    //Create Extend Area of area 2
    let extendedAreaGeometry2 = new THREE.BoxGeometry(54,6,16);
    let extendedArea = new THREE.Mesh(extendedAreaGeometry2,material2);
    extendedArea.castShadow = true; // A área também deve projetar sombras
    extendedArea.receiveShadow = true; // A área também deve receber sombras
    area2.add(extendedArea);
    extendedArea.position.set(35,0,54);
    
    let extendedArea2 = new THREE.Mesh(extendedAreaGeometry2,material2);
    extendedArea2.castShadow = true; // A área também deve projetar sombras
    extendedArea2.receiveShadow = true; // A área também deve receber sombras
    area2.add(extendedArea2);
    extendedArea2.position.set(-35,0,54);

    //Create bb
    const wallBox2 = new THREE.Box3().setFromObject(area2);
    this.areasBox.push(wallBox2);
  
    // Create door
    const doorGeometry = new THREE.BoxGeometry(16, 8, 0.1);
    const doorMaterial = new THREE.MeshLambertMaterial({ color: "rgb(186, 184, 184)" });
    this.door = new THREE.Mesh(doorGeometry, doorMaterial);
    this.door.castShadow = true; 
    this.door.receiveShadow = true; 
    this.door.position.set(0, 0, 62);
    area2.add(this.door);
    this.doorBox = new THREE.Box3().setFromObject(this.door);
    this.blocksBox.push(this.doorBox);
    
    
    //Para parecer que a porta não some para baixo
    const doorfloorGeometry = new THREE.BoxGeometry(16, 0.05, 0.1);
    const doorfloor = new THREE.Mesh(doorfloorGeometry, doorMaterial);
    doorfloor.receiveShadow = true;
    doorfloor.position.set(0, -3, 62);
    area2.add(doorfloor); 
    
    //Create plataform
    const plataformGeometry = new THREE.BoxGeometry(16,0.1,6);
    const plataformMaterial = new THREE.MeshLambertMaterial({ color: "rgb(14, 21, 55)" });
    this.plataform = new THREE.Mesh(plataformGeometry, plataformMaterial);
    this.plataform.castShadow = true; 
    this.plataform.receiveShadow = true; 
    this.plataform.position.set(0, 3, 57);
    area2.add(this.plataform);
    this.plataformBox = new THREE.Box3().setFromObject(this.plataform);

    //Create out suport
    this.suport2 = new THREE.Mesh(suportGeometry, new THREE.MeshLambertMaterial({color: "rgb(143, 72, 38)"}));
    this.suport2.receiveShadow = true;
    this.suport2.castShadow = true;
    this.suport2.position.set(10, 1, -55);
    scene.add(this.suport2);
    this.suport2Box = new THREE.Box3().setFromObject(this.suport2);

    //Create blocks
    this.createBlocks(area2,20,20,10);
    this.createBlocks(area2,-50,50,20);
    this.createBlocks(area2,30,10,15);
    this.createBlocks(area2,0,0,12);
    this.createBlocks(area2,-20,10,9);
    this.createBlocks(area2,-40,30,8);
    this.createBlocks(area2,40,50,8);
    this.createBlocks(area2,50,-20,20);
    this.createBlocks(area2,-40,-40,20);
    this.createBlocks(area2,-1,-40,10);
    
    //Add plataform on the middle
    this.suportTop2 = new THREE.Mesh(suportGeometry, new THREE.MeshLambertMaterial({ color: "rgb(143, 72, 38)" }));
    this.suportTop2.receiveShadow = true;
    this.suportTop2.castShadow = true;
    this.suportTop2.position.set(0, -8, 30);
    this.suportTop2Box = new THREE.Box3().setFromObject(this.suportTop2);
    area2.add(this.suportTop2);

    this.keyMesh2 = this.createKey("yellow");
    let keyBox2 = new THREE.Box3().setFromObject(this.keyMesh2);
    
    this.suportTop2.add(this.keyMesh2);    
    scene.add(area2);

    // ÁREA 3
    let material3 = new THREE.MeshLambertMaterial({ color: "rgb(139,90,43)" });
    let area3 = this.createDefaultArea(material3,172,0,-125,0.1);
    area3.position.set(156.0, 0.0, -118.0);
    scene.add(area3);

    let materialGray = new THREE.MeshLambertMaterial({ color: "rgb(59,59,59)" });
    let lateraisHangar = new THREE.Mesh(new THREE.BoxGeometry(2, 20, 108), materialGray);
    lateraisHangar.castShadow = true; // A área também deve projetar sombras
    lateraisHangar.receiveShadow = true; // A área também deve receber sombras
    lateraisHangar.position.set(94, 5, -118);
    scene.add(lateraisHangar);

    let laterais2Hangar = new THREE.Mesh(new THREE.BoxGeometry(2, 20, 108), materialGray);
    laterais2Hangar.castShadow = true; // A área também deve projetar sombras
    laterais2Hangar.receiveShadow = true; // A área também deve receber sombras
    laterais2Hangar.position.set(218, 5, -118);
    scene.add(laterais2Hangar);

    let fundoHangar = new THREE.Mesh(new THREE.BoxGeometry(124, 20, 2), materialGray);
    fundoHangar.castShadow = true; // A área também deve projetar sombras
    fundoHangar.receiveShadow = true; // A área também deve receber sombras
    fundoHangar.position.set(156, 5, -171);
    scene.add(fundoHangar);

    scene.add(this.createTopHangar());

  


    // //Create Extend Area of area 3
    // let smallExtendedAreaGeometry3 = new THREE.BoxGeometry(30,6,16);
    // let smallExtendedArea3 = new THREE.Mesh(smallExtendedAreaGeometry3,material3);
    // smallExtendedArea3.castShadow = true; // A área também deve projetar sombras
    // smallExtendedArea3.receiveShadow = true; // A área também deve receber sombras
    // area3.add(smallExtendedArea3);
    // smallExtendedArea3.position.set(47,0,54);

    // let bigExtendedAreaGeometry3 = new THREE.BoxGeometry(78,6,16);
    // let bigExtendedArea3= new THREE.Mesh(bigExtendedAreaGeometry3,material3);
    // bigExtendedArea3.castShadow = true; // A área também deve projetar sombras
    // bigExtendedArea3.receiveShadow = true; // A área também deve receber sombras
    // area3.add(bigExtendedArea3);
    // bigExtendedArea3.position.set(-23,0,54);

    // const l3 = new Ladder(material3);
    // const ladder3 = l3.createLadder();
    // area3.add(ladder3);
    // ladder3.position.set(24,2.6,54.5);
    // this.ramps.push(l3.getRampMesh());

    // //Create bb
    // const wallBox3 = new THREE.Box3().setFromObject(area3);
    // this.areasBox.push(wallBox3);


    // let area3Floor = new THREE.BoxGeometry(124,3,116);
    // let area3FloorMaterial = new THREE.MeshLambertMaterial({ color: "rgb(139,90,43)" });
    // let area3FloorMesh = new THREE.Mesh(area3Floor, area3FloorMaterial);
    // // area3FloorMesh.rotation.x = Math.PI / 2; // Rotaciona para ficar horizontal
    // area3FloorMesh.position.set(156, 2, -125); // Posiciona corretamente
    // area3FloorMesh.receiveShadow = true; // A área também deve receber sombras
    // scene.add(area3FloorMesh);


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

  createDefaultArea(materials, x, y, z,height){
    let areaGeometry = new THREE.BoxGeometry(124, height, 108);
    let area = new THREE.Mesh(areaGeometry, materials);
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
    let collumnMaterial = new THREE.MeshLambertMaterial({ color: "rgb(159, 146, 121)" });
    let collumn = new THREE.Mesh(collumnGeometry, collumnMaterial);
    collumn.castShadow = true; 
    collumn.receiveShadow = true; 
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

  createBlocks(area,x,z,height){
    let blockGeometry = new THREE.BoxGeometry(4, height, 4);
    let blockMaterial = new THREE.MeshLambertMaterial({ color: "rgb(171, 98, 21)" });
    let block = new THREE.Mesh(blockGeometry, blockMaterial);
    block.castShadow = true; 
    block.receiveShadow = true; 
    block.position.set(x, 3+height/2, z);

    area.add(block); 

    block.updateMatrixWorld(true); 

    // Bounding box com posição correta no mundo
    let blockBox = new THREE.Box3().setFromObject(block);
    this.blocksBox.push(blockBox);
  }

  createKey(color){
    let auxMat = new THREE.Matrix4();
    let cubeMesh = new THREE.Mesh(new THREE.BoxGeometry(1.4,1.4,1.4));
    let cylinderMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.4, 20));
    let cylinderMesh2 = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.4, 20));
    let cylinderMesh3 = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.4, 20));

    //Rotações para fazer a chave
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

    let csgObject = cubeCSG.subtract(cylinderCSG).subtract(cylinderCSG2).subtract(cylinderCSG3); //Subtrações para chegar na chave
    let keyMesh = CSG.toMesh(csgObject, auxMat);
    keyMesh.material = new THREE.MeshPhongMaterial({
      color: color,
      shininess: 300, 
      specular: 0xffffff, // reflexo branco 
    });
    keyMesh.position.set(0, 2.6 , 0);

    return keyMesh;
  }

 createTopHangar(){
    let auxMat = new THREE.Matrix4();

    // Altura menor (ficará mais baixo visualmente)
    let alturaTopo = 116; // antes era 116
    let bigCylinderMesh = new THREE.Mesh(new THREE.CylinderGeometry(80, 80, alturaTopo, 32));
    let smallCylinderMesh = new THREE.Mesh(new THREE.CylinderGeometry(78, 78, alturaTopo, 32));
    let quadradoMesh = new THREE.Mesh(new THREE.BoxGeometry(800, 800, 90 ));

    bigCylinderMesh.matrixAutoUpdate = false;
    bigCylinderMesh.updateMatrix();
    smallCylinderMesh.matrixAutoUpdate = false;
    smallCylinderMesh.updateMatrix();
    quadradoMesh.matrixAutoUpdate = false;
    quadradoMesh.updateMatrix();
    quadradoMesh.position.set(0, 0, 0);
    quadradoMesh.rotateX(THREE.MathUtils.degToRad(90));

    let bigCylinderCSG = CSG.fromMesh(bigCylinderMesh);
    let quadradoCSG = CSG.fromMesh(quadradoMesh);
    let smallCylinderCSG = CSG.fromMesh(smallCylinderMesh);
    let csgObjectPre = bigCylinderCSG.subtract(smallCylinderCSG); // Subtrai o cilindro menor do maior
    let csgObject = csgObjectPre.subtract(quadradoCSG);

    let topoHangarMesh = CSG.toMesh(csgObject, auxMat);
    topoHangarMesh.material = new THREE.MeshLambertMaterial({ color: "rgb(59,59,59)" });
    topoHangarMesh.castShadow = true;
    topoHangarMesh.receiveShadow = true;

    // Rotaciona para a posição horizontal
    topoHangarMesh.rotateX(Math.PI / 2);

    // Ajusta posição para compensar altura menor
    topoHangarMesh.position.set(156, -30, -118);

    return topoHangarMesh;
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
import * as THREE from  'three';
import { createGroundPlaneXZ, degreesToRadians, InfoBox, setDefaultMaterial } from '../libs/util/util.js';
import Ladder from './ladder.js';
import { CSG } from '../libs/other/CSGMesh.js';
import { Color, MeshLambertMaterial } from '../build/three.module.js';

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
    this.blocksArea3 = []; //Vetor with all bb´s of blocks from area 3
    this.blocksArea4 = [];
    this.ladderBig = new Ladder();
    this.ramps = [];
    this.suport1 = null;
    this.suport1Box = null;
    this.suport2Box = null;
    this.door = null; // Porta da área 2
    this.doorBox = null; // Bounding box da porta
    this.textureLoader = new THREE.TextureLoader();
    this.auxMat = new THREE.Matrix4();


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
    

    var floorTexture = this.textureLoader.load('../assets/textures/intertravado.jpg');
    floorTexture.colorSpace = THREE.SRGBColorSpace;

    plane.material.map = floorTexture;
    plane.material.map.wrapS = THREE.RepeatWrapping;
    plane.material.map.wrapT = THREE.RepeatWrapping;
    plane.material.map.repeat.set(60, 60);


    // ÁREA MAIOR
    let material = new THREE.MeshLambertMaterial({ color: "rgb(63,81,181)" });
    this.createBiggerArea(material,0,3,125);
    this.createBlockWall();

    let suportArea4Geometry = new THREE.BoxGeometry(2,4,2);
    this.suport4 = new THREE.Mesh(suportArea4Geometry, new THREE.MeshLambertMaterial({ color: "rgb(143, 72, 38)" }));
    this.suport4.castShadow = true;
    this.suport4.receiveShadow = true;
    this.suport4.position.set(-20, 2,40);
    this.suport4Box = new THREE.Box3().setFromObject(this.suport4);
    this.blocksArea4.push(this.suport4Box);
    this.scene.add(this.suport4);

    // ÁREA 1

    /// 1. Carregar texturas separadas para cada parte
    let texturaTopoPrincipal = this.textureLoader.load('assets/images/chaoArea1.png');
    let texturaTopoExtendida = this.textureLoader.load('assets/images/chaoArea1.png'); // Textura diferente para a parte extendida
    let texturaLateral = this.textureLoader.load('assets/images/area1clara.jpg');

    // Configurar repetições
    texturaTopoPrincipal.wrapS = THREE.RepeatWrapping;
    texturaTopoPrincipal.wrapT = THREE.RepeatWrapping;
    texturaTopoPrincipal.repeat.set(8, 8); // Ajuste conforme necessário
    texturaTopoPrincipal.colorSpace = THREE.SRGBColorSpace;

    texturaTopoExtendida.wrapS = THREE.RepeatWrapping;
    texturaTopoExtendida.wrapT = THREE.RepeatWrapping;
    texturaTopoExtendida.repeat.set(2,1); // Ou ajuste para a área extendida
    texturaTopoExtendida.colorSpace = THREE.SRGBColorSpace; // Configurar cor para sRGB

    texturaLateral.wrapS = THREE.RepeatWrapping;
    texturaLateral.wrapT = THREE.RepeatWrapping;
    texturaLateral.repeat.set(8, 1);
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


    let topTexture = this.textureLoader.load('assets/images/area1clara.jpg');
    topTexture.colorSpace = THREE.SRGBColorSpace;
    topTexture.wrapS = THREE.RepeatWrapping;
    topTexture.wrapT = THREE.RepeatWrapping;
    topTexture.repeat.set(6,0.5);

    let frenteTopTexture = this.textureLoader.load('assets/images/area1clara.jpg');
    frenteTopTexture.colorSpace = THREE.SRGBColorSpace;
    frenteTopTexture.wrapS = THREE.RepeatWrapping;
    frenteTopTexture.wrapT = THREE.RepeatWrapping;
    frenteTopTexture.repeat.set(1,0.5);

    let backTopTexture = this.textureLoader.load('assets/images/area1clara.jpg');
    backTopTexture.colorSpace = THREE.SRGBColorSpace;
    backTopTexture.wrapS = THREE.RepeatWrapping;
    backTopTexture.wrapT = THREE.RepeatWrapping;
    backTopTexture.repeat.set(8,0.5);
    
    let materialArray = [
        new THREE.MeshLambertMaterial({ map: topTexture }), // direita
        new THREE.MeshLambertMaterial({ map: topTexture }), // esquerda
        new THREE.MeshLambertMaterial({ map: topTexture }), // topo
        new THREE.MeshLambertMaterial({ map: frenteTopTexture }), // fundo
        new THREE.MeshLambertMaterial({ map: frenteTopTexture }), // frente
        new THREE.MeshLambertMaterial({ map: topTexture })  // trás
    ];

    

    let topCollumnGeometry = new THREE.BoxGeometry(5, 2, 80);
    let topCollumn = new THREE.Mesh(topCollumnGeometry, materialArray);
    topCollumn.castShadow = true;
    topCollumn.receiveShadow = true;

    topCollumn.position.set(59, 23, -13);
    area1.add(topCollumn);

    let topCollumn2 = new THREE.Mesh(topCollumnGeometry, materialArray);
    topCollumn2.castShadow = true;
    topCollumn2.receiveShadow = true;
    topCollumn2.position.set(-59, 23, -13);
    area1.add(topCollumn2);
    
    let topCollumnGeometryBack = new THREE.BoxGeometry(123,2,5);
    let topCollumnBack = new THREE.Mesh(topCollumnGeometryBack, new THREE.MeshLambertMaterial());
    topCollumnBack.castShadow = true;
    topCollumnBack.receiveShadow = true;
    topCollumnBack.material.map = backTopTexture;
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
    let lateraisHangar = new THREE.Mesh(new THREE.BoxGeometry(2, 30, 106), materialGray);
    lateraisHangar.castShadow = true; // A área também deve projetar sombras
    lateraisHangar.receiveShadow = true; // A área também deve receber sombras
    lateraisHangar.position.set(95, 5, -118);
    this.blocksArea3.push(new THREE.Box3().setFromObject(lateraisHangar));

    scene.add(lateraisHangar);

    let laterais2Hangar = new THREE.Mesh(new THREE.BoxGeometry(2, 30, 106), materialGray);
    laterais2Hangar.castShadow = true; // A área também deve projetar sombras
    laterais2Hangar.receiveShadow = true; // A área também deve receber sombras
    laterais2Hangar.position.set(217, 5, -118);
    scene.add(laterais2Hangar);
    this.blocksArea3.push(new THREE.Box3().setFromObject(laterais2Hangar));

    let fundoHangar = new THREE.Mesh(new THREE.BoxGeometry(124, 30, 2), materialGray);
    fundoHangar.castShadow = true; // A área também deve projetar sombras
    fundoHangar.receiveShadow = true; // A área também deve receber sombras
    fundoHangar.position.set(156, 5, -171);
    scene.add(fundoHangar);
    this.blocksArea3.push(new THREE.Box3().setFromObject(fundoHangar));

    scene.add(this.createTopHangar());

    //Cria frente hangar
    let frenteHangar1 = new THREE.Mesh(new THREE.BoxGeometry(33, 30, 2), materialGray);
    frenteHangar1.castShadow = true; // A área também deve projetar sombras
    frenteHangar1.receiveShadow = true; // A área também deve receber sombras
    frenteHangar1.position.set(110.5, 5, -65);
    scene.add(frenteHangar1);
    this.blocksArea3.push(new THREE.Box3().setFromObject(frenteHangar1));

    let frenteHangar2 = new THREE.Mesh(new THREE.BoxGeometry(32, 30, 2), materialGray);
    frenteHangar2.castShadow = true; // A área também deve projetar sombras
    frenteHangar2.receiveShadow = true; // A área também deve receber sombras
    frenteHangar2.position.set(202, 5, -65);
    scene.add(frenteHangar2);
    this.blocksArea3.push(new THREE.Box3().setFromObject(frenteHangar2));

    //Cria porta lateral
     this.portaHangar1 = new THREE.Mesh(new THREE.BoxGeometry(31, 30, 1), material3);
    this.portaHangar1.castShadow = true; // A área também deve projetar sombras
    this.portaHangar1.receiveShadow = true; // A área também deve receber sombras
    this.portaHangar1.position.set(141.8, 5, -66);
    scene.add(this.portaHangar1);
    this.door1Area3Box = new THREE.Box3().setFromObject(this.portaHangar1);
    this.blocksArea3.push(this.door1Area3Box);

  
    this.portaHangar2 = new THREE.Mesh(new THREE.BoxGeometry(30, 30, 1), material3);
    this.portaHangar2.castShadow = true; // A área também deve projetar sombras
    this.portaHangar2.receiveShadow = true; // A área também deve receber sombras
    this.portaHangar2.position.set(172, 5, -66);
    scene.add(this.portaHangar2);
    this.door2Area3Box = new THREE.Box3().setFromObject(this.portaHangar2);
    this.blocksArea3.push(this.door2Area3Box);




    //Create side walls
    this.createBorder(scene);
    this.createInfoArea(); 
  }

  createBiggerArea(material, x, y, z){

    let floorArea4 = new THREE.Mesh(new THREE.BoxGeometry(287,0.2,102),new THREE.MeshStandardMaterial({roughness: 1, metalness: 0, color:  0xaaaaaa  }));
    const floorTexture = this.textureLoader.load("assets/images/Pebbles_002_COLOR.jpg");
    floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(100, 40);
    
    floorArea4.material.map = floorTexture;
    floorArea4.receiveShadow = true;
    floorArea4.position.set(0,0.1,121);
    this.scene.add(floorArea4);

    let verticalPath = new THREE.Mesh(new THREE.BoxGeometry(40,0.1,40.8), new THREE.MeshLambertMaterial({color: "rgba(122, 67, 67, 1)"}));
    const verticalTexture = this.textureLoader.load("assets/images/floorWood.jpg");
    verticalTexture.wrapS = verticalTexture.wrapT = THREE.RepeatWrapping;
    verticalTexture.repeat.set(2, 20);
    
    verticalPath.material.map = verticalTexture;
    verticalPath.receiveShadow = true;
    verticalPath.position.set(0,0.25,90.4);
    this.scene.add(verticalPath);

    let verticalPath2 = new THREE.Mesh(new THREE.BoxGeometry(40,0.1,40.8), new THREE.MeshLambertMaterial({color: "rgba(122, 67, 67, 1)"}));
    const verticalTexture2 = this.textureLoader.load("assets/images/floorWood.jpg");
    verticalTexture2.wrapS = verticalTexture2.wrapT = THREE.RepeatWrapping;
    verticalTexture2.repeat.set(2, 20);
    
    verticalPath2.material.map = verticalTexture2;
    verticalPath2.receiveShadow = true;
    verticalPath2.position.set(0,0.25,151.2);
    this.scene.add(verticalPath2);

    let horizontalPath = new THREE.Mesh(new THREE.BoxGeometry(287,0.1,20.4), new THREE.MeshLambertMaterial({color: "rgba(122, 67, 67, 1)"}));
    const horizontalTexture = this.textureLoader.load("assets/images/floorWood.jpg");
    horizontalTexture.wrapS = horizontalTexture.wrapT = THREE.RepeatWrapping;
    horizontalTexture.repeat.set(20, 2);
    
    horizontalPath.material.map = horizontalTexture;
    horizontalPath.receiveShadow = true;
    horizontalPath.position.set(0,0.25,121);
    this.scene.add(horizontalPath);


    this.createTowers(-146,20,70);
    this.createTowers(-146,20,177);
    this.createTowers(146,20,70);
    this.createTowers(146,20,177);

    let fortressWallCSGFront = this.createCSGFortressWall(282, 5);

    // Porta (cilindro)
    let cylinderMesh = new THREE.Mesh(new THREE.CylinderGeometry(10, 10, 10, 32, 1));
    cylinderMesh.position.set(0, -10, 0);
    cylinderMesh.rotation.x = THREE.MathUtils.degToRad(90);
    cylinderMesh.updateMatrix();
    let cylinderCSG = CSG.fromMesh(cylinderMesh);
    fortressWallCSGFront = fortressWallCSGFront.subtract(cylinderCSG);



   // Criar um grupo que será o pivot (eixo da porta)
    this.doorPivot = new THREE.Group();
    this.scene.add(this.doorPivot);

    let doorArea4Mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(9.9, 9.9, 1, 32, 1),
        new THREE.MeshLambertMaterial()
    );

    const door4Texture = this.textureLoader.load("assets/images/wood.png");
    door4Texture.wrapS = door4Texture.wrapT = THREE.RepeatWrapping;
    door4Texture.repeat.set(1, 2);
    
    doorArea4Mesh.material.map = door4Texture;
    

    // Rotacionar para deixar na vertical
    doorArea4Mesh.rotation.x = THREE.MathUtils.degToRad(90);

    // ⚠️ O truque: deslocar a porta dentro do pivot, para que o eixo do grupo fique na lateral
    doorArea4Mesh.position.x = 9.9; // metade do diâmetro

    // Adicionar a porta no pivot
    this.doorPivot.add(doorArea4Mesh);

    // Colocar o pivot no lugar correto
    this.doorPivot.position.set(-9.9, 0, 72);

    // Agora sim: calcular bounding box a partir do pivot
    this.door4Box = new THREE.Box3().setFromObject(this.doorPivot);
    this.blocksArea4.push(this.door4Box);


    // Janelas (caixas finas atravessando a parede)
    for (let i = -4; i <= 8; i=i+2) {   // 3 janelas em linha horizontal
        let windowMesh = new THREE.Mesh(new THREE.BoxGeometry(10, 3, 10)); 
        windowMesh.position.set(i * 20, 5, 0); // espaça as janelas
        // cylinderMesh.rotation.x = THREE.MathUtils.degToRad(90);
        windowMesh.updateMatrix();

        let windowCSG = CSG.fromMesh(windowMesh);
        fortressWallCSGFront = fortressWallCSGFront.subtract(windowCSG);
    }

    // Converter de volta para mesh
    let fortressWallFront = CSG.toMesh(
        fortressWallCSGFront,
        this.auxMat,
        new THREE.MeshLambertMaterial()
    );

    const wallTextureFront = this.textureLoader.load("assets/images/stone.jpg");
    wallTextureFront.wrapS = wallTextureFront.wrapT = THREE.RepeatWrapping;
    wallTextureFront.repeat.set(20, 4);
    fortressWallFront.material.map = wallTextureFront;
    fortressWallFront.castShadow = true;
    fortressWallFront.receiveShadow = true;
    fortressWallFront.position.set(0, 10, 70);
    this.blocksArea4.push(new THREE.Box3().setFromObject(fortressWallFront));

    this.scene.add(fortressWallFront);


    let fortressWallCSGBack = this.createCSGFortressWall(282,5);

    // Janelas (caixas finas atravessando a parede)
    for (let i = -4; i <= 8; i=i+2) {   // 3 janelas em linha horizontal
        let windowMesh = new THREE.Mesh(new THREE.BoxGeometry(10, 3, 10)); 
        windowMesh.position.set(i * 20, 5, 0); // espaça as janelas
        // cylinderMesh.rotation.x = THREE.MathUtils.degToRad(90);
        windowMesh.updateMatrix();

        let windowCSG = CSG.fromMesh(windowMesh);
        fortressWallCSGBack = fortressWallCSGBack.subtract(windowCSG);
    }
    let fortressWallBack = CSG.toMesh(fortressWallCSGBack,this.auxMat,new THREE.MeshLambertMaterial());
    const wallTextureBack = this.textureLoader.load("assets/images/stone.jpg");
    wallTextureBack.wrapS = wallTextureBack.wrapT = THREE.RepeatWrapping;
    wallTextureBack.repeat.set(20, 4);
    fortressWallBack.material.map = wallTextureBack;
    fortressWallBack.castShadow = true;
    fortressWallBack.receiveShadow = true;

    fortressWallBack.position.set(0, 10, 177);
    this.blocksArea4.push(new THREE.Box3().setFromObject(fortressWallBack));

    this.scene.add(fortressWallBack);


    let fortressWallCSGLeft = this.createCSGFortressWall(5,97);

    let fortressWallLeft = CSG.toMesh(fortressWallCSGLeft,this.auxMat,new THREE.MeshLambertMaterial());
    const wallTextureLeft = this.textureLoader.load("assets/images/stone.jpg");
    wallTextureLeft.wrapS = wallTextureLeft.wrapT = THREE.RepeatWrapping;
    wallTextureLeft.repeat.set(10, 4);
    fortressWallLeft.material.map = wallTextureLeft;
    fortressWallLeft.castShadow = true;
    fortressWallLeft.receiveShadow = true;

    fortressWallLeft.position.set(-146, 10, 118.5);
    this.blocksArea4.push(new THREE.Box3().setFromObject(fortressWallLeft));
    this.scene.add(fortressWallLeft);


    let fortressWallCSGRight = this.createCSGFortressWall(5,97);

    let fortressWallRight = CSG.toMesh(fortressWallCSGRight,this.auxMat,new THREE.MeshLambertMaterial());
    const wallTextureRight = this.textureLoader.load("assets/images/stone.jpg");
    wallTextureRight.wrapS = wallTextureRight.wrapT = THREE.RepeatWrapping;
    wallTextureRight.repeat.set(10, 4);
    fortressWallRight.material.map = wallTextureLeft;
    fortressWallRight.castShadow = true;
    fortressWallRight.receiveShadow = true;

    fortressWallRight.position.set(146, 10, 118.5);
    this.blocksArea4.push(new THREE.Box3().setFromObject(fortressWallRight));

    this.scene.add(fortressWallRight);

    for(let x = -134.25; x<146; x=x+23.5){
      this.createTopFortressBlock(x,70,false);
      this.createTopFortressBlock(x,177,false);
    }

    for(let z = 86.75; z<177;z=z+23.5){
      this.createTopFortressBlock(146,z,true);
      this.createTopFortressBlock(-146,z,true);
    }


    this.createHomeBiggerArea(50,90);
    this.createHomeBiggerArea(90,90);
    this.createHomeBiggerArea(-50,90);
    this.createHomeBiggerArea(-90,90);
    this.createHomeBiggerArea(50,150);
    this.createHomeBiggerArea(90,150);
    this.createHomeBiggerArea(-50,150);
    this.createHomeBiggerArea(-90,150);


    this.createAltar(0,151);

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
    let materialWall = new THREE.MeshLambertMaterial();
    let wallGeometry = new THREE.BoxGeometry(499,10,1);

    for(let i = -1;i<2;i=i+2){
      wall = new THREE.Mesh(wallGeometry,materialWall);
      let borderTexture = this.textureLoader.load('assets/images/brickwall.jpg ');
      borderTexture.wrapS = THREE.RepeatWrapping;
      borderTexture.wrapT = THREE.RepeatWrapping;
      borderTexture.repeat.set(30, 1); 
      wall.material.map = borderTexture;
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
      let borderTexture = this.textureLoader.load('assets/images/brickwall.jpg ');
      borderTexture.wrapS = THREE.RepeatWrapping;
      borderTexture.wrapT = THREE.RepeatWrapping;
      borderTexture.repeat.set(30, 1); 
      wall.material.map = borderTexture;
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
    const colunaTexture = this.textureLoader.load('assets/images/coluna.png ');
    colunaTexture.wrapS = THREE.RepeatWrapping;
    colunaTexture.wrapT = THREE.RepeatWrapping;
    colunaTexture.repeat.set(1, 1); 

    let collumnGeometry = new THREE.CylinderGeometry(2, 2, 20);
    let collumnMaterial = new THREE.MeshLambertMaterial();
    let collumn = new THREE.Mesh(collumnGeometry, collumnMaterial);
    collumn.castShadow = true; 
    collumn.receiveShadow = true; 
    collumn.position.set(x, y, z);
    collumn.material.map = colunaTexture;
    collumn.material.color.multiplyScalar(0.9);
    area.add(collumn); // Adiciona primeiro à área

    // Atualiza matriz mundial para que o THREE saiba a posição correta do objeto no mundo
    collumn.updateMatrixWorld(true);

    // Adiciona bb
    let collumnBox = new THREE.Box3().setFromObject(collumn);
    this.collumnsBox.push(collumnBox);

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
    let keyMesh = CSG.toMesh(csgObject, this.auxMat);
    keyMesh.material = new THREE.MeshPhongMaterial({
      color: color,
      shininess: 300, 
      specular: 0xffffff, // reflexo branco 
    });
    keyMesh.position.set(0, 2.6 , 0);

    return keyMesh;
  }

 createTopHangar(){
    let profundidadeTopo = 108; 
    let bigCylinderMesh = new THREE.Mesh(new THREE.CylinderGeometry(80, 80, profundidadeTopo, 32));
    let smallCylinderMesh = new THREE.Mesh(new THREE.CylinderGeometry(78, 78, profundidadeTopo-2, 32));
    let quadradoMesh = new THREE.Mesh(new THREE.BoxGeometry(800, 800, 100 ));

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

    let topoHangarMesh = CSG.toMesh(csgObject, this.auxMat);
    topoHangarMesh.material = new THREE.MeshLambertMaterial({ color: "rgba(52, 68, 67, 1)" });
    topoHangarMesh.castShadow = true;
    topoHangarMesh.receiveShadow = true;

    // Rotaciona para a posição horizontal
    topoHangarMesh.rotateX(Math.PI / 2);

    // Ajusta posição para compensar altura menor
    topoHangarMesh.position.set(156, -30, -118);

    return topoHangarMesh;
}

  createTowers(x,y,z){
    let cylinderMesh = new THREE.Mesh(new THREE.CylinderGeometry(10, 10, 40, 32));
    cylinderMesh.updateMatrix();
    let towerCSG = CSG.fromMesh(cylinderMesh);

    // Criar 4 cortes de janela
    for (let i = 0; i < 4; i++) {
        let windowMesh = new THREE.Mesh(new THREE.BoxGeometry(6, 2, 4)); // largura, altura, profundidade
        windowMesh.position.set(8 * Math.cos(i * Math.PI / 2), 8, 8 * Math.sin(i * Math.PI / 2)); // posiciona ao redor da torre
        windowMesh.updateMatrix();

        let windowCSG = CSG.fromMesh(windowMesh);
        towerCSG = towerCSG.subtract(windowCSG);
    }

    // Converter de volta para Mesh
    let tower = CSG.toMesh(towerCSG, this.auxMat, new THREE.MeshLambertMaterial());
    const towerTexture = this.textureLoader.load("assets/images/darkcement.jpg");
    towerTexture.wrapS = towerTexture.wrapT = THREE.RepeatWrapping;
    towerTexture.repeat.set(2, 0.5);
    tower.material.map = towerTexture;
    tower.castShadow = true;
    tower.receiveShadow = true;
    tower.position.set(x, y, z);

    let towerBox = new THREE.Box3().setFromObject(tower);
    this.blocksArea4.push(towerBox);

    // let towerHelper = new THREE.Box3Helper(towerBox, 0xff0000); // vermelho
    // this.scene.add(towerHelper);

    this.scene.add(tower);

  }

  createCSGFortressWall(largura, profundidade){
    let fortressWallMesh = new THREE.Mesh(new THREE.BoxGeometry(largura,20,profundidade));
    fortressWallMesh.matrixAutoUpdate = false;
    fortressWallMesh.updateMatrix();

    let fortressWallCSG = CSG.fromMesh(fortressWallMesh);

    return fortressWallCSG;
  }

  createTopFortressBlock(posx,posz,isTurned){
    let topFortressBlockMesh;
    if(isTurned){
      topFortressBlockMesh = new THREE.Mesh(new THREE.BoxGeometry(5,3,13.5),new THREE.MeshLambertMaterial());
    }
    else{
      topFortressBlockMesh = new THREE.Mesh(new THREE.BoxGeometry(13.5,3,5),new THREE.MeshLambertMaterial());
    }
    const topTextureFortress = this.textureLoader.load("assets/images/stone.jpg");
    topTextureFortress.wrapS = topTextureFortress.wrapT = THREE.RepeatWrapping;
    topTextureFortress.repeat.set(2, 0.5);
    topFortressBlockMesh.material.map = topTextureFortress;
    topFortressBlockMesh.castShadow = true;
    topFortressBlockMesh.receiveShadow = true;
    topFortressBlockMesh.position.set(posx,21.5,posz);
    this.blocksArea4.push(new THREE.Box3().setFromObject(topFortressBlockMesh));
    this.scene.add(topFortressBlockMesh);
  }

  createHomeBiggerArea(posx,posz){

    // const wallTexture = this.textureLoader.load('assets/images/floorWood.jpg');
    const wallTexture = this.textureLoader.load("assets/images/darkcement.jpg");
    wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping;
    wallTexture.repeat.set(1, 1);

    let home = new THREE.Mesh(new THREE.BoxGeometry(15,10,15), new THREE.MeshLambertMaterial())
    home.material.map = wallTexture;
    home.castShadow = true;
    home.receiveShadow = true;
    home.position.set(posx,5,posz);

    const topTexture = this.textureLoader.load('assets/images/floorWood.jpg');
    topTexture.wrapS = topTexture.wrapT = THREE.RepeatWrapping;
    topTexture.repeat.set(1, 1);

    let topHome = new THREE.Mesh(new THREE.ConeGeometry(12,6,4,64), new THREE.MeshLambertMaterial());
    topHome.material.map = topTexture;
    topHome.castShadow = true;
    topHome.receiveShadow = true;
    topHome.position.set(0,8,0);
    topHome.rotation.y = Math.PI / 4; 
    home.add(topHome);

    let baseBox = new THREE.Box3(
    new THREE.Vector3(posx - 7.5, 0, posz - 7.5),  // mínimo
    new THREE.Vector3(posx + 7.5, 10, posz + 7.5) // máximo
    );
    this.blocksArea4.push(baseBox);

    this.scene.add(home);
  }

  createAltar(posx,posz){
    let altarBase = new THREE.Mesh(new THREE.BoxGeometry(30,4,20), new THREE.MeshLambertMaterial());
    const altarTexture = this.textureLoader.load("assets/images/cement.jpg");
    altarTexture.wrapS = altarTexture.wrapT = THREE.RepeatWrapping;
    altarTexture.repeat.set(2, 0.5);
    altarBase.material.map = altarTexture;
    altarBase.castShadow = true;
    altarBase.receiveShadow = true;

    let altarTop = new THREE.Mesh(new THREE.BoxGeometry(20,3,7), new THREE.MeshLambertMaterial());
    const altarTopTexture = this.textureLoader.load("assets/images/cement.jpg");
    altarTopTexture.wrapS = altarTopTexture.wrapT = THREE.RepeatWrapping;
    altarTopTexture.repeat.set(2, 0.5);
    altarTop.material.map = altarTopTexture;
    altarTop.castShadow = true;
    altarTop.receiveShadow = true;
    altarTop.position.set(0,3.5,0);
    altarBase.add(altarTop);

    altarBase.position.set(posx,2,posz);
    this.blocksArea4.push(new THREE.Box3().setFromObject(altarBase));
    this.scene.add(altarBase);
  }


  createBlockWall(){
    this.wallFront = new THREE.Mesh(new THREE.BoxGeometry(320,40,3), new THREE.MeshLambertMaterial());
    const wallTexture = this.textureLoader.load("assets/images/cement.jpg");
    wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping;
    wallTexture.repeat.set(2, 0.5);
    this.wallFront.material.map = wallTexture;
    this.wallFront.castShadow = true;
    this.wallFront.receiveShadow = true;
    this.wallFront.position.set(0,20,55);
    this.scene.add(this.wallFront);
    this.wallFrontBox = new THREE.Box3().setFromObject(this.wallFront)
    this.blocksArea4.push(this.wallFrontBox);

    this.wallBack = new THREE.Mesh(new THREE.BoxGeometry(320,40,3), new THREE.MeshLambertMaterial());
    this.wallBack.material.map = wallTexture;
    this.wallBack.castShadow = true;
    this.wallBack.receiveShadow = true;
    this.wallBack.position.set(0,20,55);
    this.wallBack.position.set(0,20,190);
    this.scene.add(this.wallBack);
    this.wallBackBox = new THREE.Box3().setFromObject(this.wallBack)
    this.blocksArea4.push(this.wallBackBox);

    this.wallLeft = new THREE.Mesh(new THREE.BoxGeometry(3,40,132), new THREE.MeshLambertMaterial());
    this.wallLeft.material.map = wallTexture;
    this.wallLeft.castShadow = true;
    this.wallLeft.receiveShadow = true;
    this.wallLeft.position.set(0,20,55);
    this.wallLeft.position.set(-160,20,122);
    this.scene.add(this.wallLeft);
    this.wallLeftBox = new THREE.Box3().setFromObject(this.wallLeft)
    this.blocksArea4.push(this.wallLeftBox);

    this.wallRight = new THREE.Mesh(new THREE.BoxGeometry(3,40,132), new THREE.MeshLambertMaterial());
    this.wallRight.material.map = wallTexture;
    this.wallRight.castShadow = true;
    this.wallRight.receiveShadow = true;
    this.wallRight.position.set(0,20,55);
    this.wallRight.position.set(160,20,122);
    this.scene.add(this.wallRight);
    this.wallRightBox = new THREE.Box3().setFromObject(this.wallRight)
    this.blocksArea4.push(this.wallRightBox);

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

  getBBBlocksArea3(){
    return this.blocksArea3;
  }

   getBBBlocksArea4(){
    return this.blocksArea4;
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
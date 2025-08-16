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
    this.blocksArea3 = []; //Vetor with all bb´s of blocks from area 3
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
    // Carregar texturas separadas para cada parte da Área 2
    let texturaTopoPrincipalArea2 = textureLoader.load('assets/images/area2chao.png'); // textura para área 2
    let texturaTopoExtendidaArea2 = textureLoader.load('assets/images/area2chao.png'); // Textura para extensões
    let texturaLateralArea2 = textureLoader.load('assets/images/area2lateral.png'); // Textura para laterais

    // Configurar repetições para Área 2
    texturaTopoPrincipalArea2.wrapS = THREE.RepeatWrapping;
    texturaTopoPrincipalArea2.wrapT = THREE.RepeatWrapping;
    texturaTopoPrincipalArea2.repeat.set(150/20, 130/20); // Ajuste conforme necessário
    texturaTopoPrincipalArea2.colorSpace = THREE.SRGBColorSpace;

    texturaTopoExtendidaArea2.wrapS = THREE.RepeatWrapping;
    texturaTopoExtendidaArea2.wrapT = THREE.RepeatWrapping;
    texturaTopoExtendidaArea2.repeat.set(2, 1); // Para as áreas extendidas
    texturaTopoExtendidaArea2.colorSpace = THREE.SRGBColorSpace;

    texturaLateralArea2.wrapS = THREE.RepeatWrapping;
    texturaLateralArea2.wrapT = THREE.RepeatWrapping;
    texturaLateralArea2.repeat.set(7, 1);
    texturaLateralArea2.colorSpace = THREE.SRGBColorSpace;

    // Criar materiais separados para Área 2
    let materiaisPrincipalArea2 = [
      new THREE.MeshLambertMaterial({ map: texturaLateralArea2 }), // direita
      new THREE.MeshLambertMaterial({ map: texturaLateralArea2 }), // esquerda
      new THREE.MeshLambertMaterial({ map: texturaTopoPrincipalArea2 }), // topo principal
      new THREE.MeshLambertMaterial({ map: texturaLateralArea2 }), // baixo
      new THREE.MeshLambertMaterial({ map: texturaLateralArea2 }), // frente
      new THREE.MeshLambertMaterial({ map: texturaLateralArea2 })  // trás
    ];

    let materiaisExtendidaArea2 = [
      new THREE.MeshLambertMaterial({ map: texturaLateralArea2 }), // direita
      new THREE.MeshLambertMaterial({ map: texturaLateralArea2 }), // esquerda
      new THREE.MeshLambertMaterial({ map: texturaTopoExtendidaArea2 }), // topo extendido
      new THREE.MeshLambertMaterial({ map: texturaLateralArea2 }), // baixo
      new THREE.MeshLambertMaterial({ map: texturaLateralArea2 }), // frente
      new THREE.MeshLambertMaterial({ map: texturaLateralArea2 })  // trás
    ];

    // Criar a área principal da Área 2 com texturas
    let area2 = this.createDefaultArea(materiaisPrincipalArea2, 0, 3, -125, 6);

    // Criar áreas extendidas da Área 2 com materiais texturizados
    let extendedAreaGeometry2 = new THREE.BoxGeometry(54, 6, 16);
    let extendedArea = new THREE.Mesh(extendedAreaGeometry2, materiaisExtendidaArea2);
    extendedArea.castShadow = true;
    extendedArea.receiveShadow = true;
    area2.add(extendedArea);
    extendedArea.position.set(35, 0, 54);

    let extendedArea2 = new THREE.Mesh(extendedAreaGeometry2, materiaisExtendidaArea2);
    extendedArea2.castShadow = true;
    extendedArea2.receiveShadow = true;
    area2.add(extendedArea2);
    extendedArea2.position.set(-35, 0, 54);

    // MATERIAL PARA O PORTÃO DA ÁREA 2
    let texturaPortao = textureLoader.load('assets/images/area2portao.png'); // Reutiliza textura existente
    texturaPortao.wrapS = THREE.RepeatWrapping;
    texturaPortao.wrapT = THREE.RepeatWrapping;
    texturaPortao.repeat.set(1, 1); // Ajuste conforme necessário
    texturaPortao.colorSpace = THREE.SRGBColorSpace;

    

    // MATERIAL PARA A PLATAFORMA DA ÁREA 2
    let texturaPlataforma = textureLoader.load('assets/images/area2plat.png'); // Ou area1clara.jpg
    texturaPlataforma.wrapS = THREE.RepeatWrapping;
    texturaPlataforma.wrapT = THREE.RepeatWrapping;
    texturaPlataforma.repeat.set(4, 2); // Repetição para a plataforma
    texturaPlataforma.colorSpace = THREE.SRGBColorSpace;

    

    // MATERIAL PARA OS BLOCOS DA ÁREA 2
    let texturaBlocos = textureLoader.load('assets/images/area2blocos.png');
    texturaBlocos.wrapS = THREE.RepeatWrapping;
    texturaBlocos.wrapT = THREE.RepeatWrapping;
    texturaBlocos.repeat.set(0.75, 2);
    texturaBlocos.colorSpace = THREE.SRGBColorSpace;

    let materialBlocosArea2 = new THREE.MeshLambertMaterial({ 
      map: texturaBlocos,
      color: new THREE.Color(0.8, 0.6, 0.4) // Tinge de marrom claro
    });

    //Create bb
    const wallBox2 = new THREE.Box3().setFromObject(area2);
    this.areasBox.push(wallBox2);
  
    // Create door
    const doorGeometry = new THREE.BoxGeometry(16, 8, 0.1);
    let doorMaterial = new THREE.MeshLambertMaterial({ 
      map: texturaPortao,
      color: new THREE.Color(3.5, 3.5, 3.5) // Tinge de cinza azulado
    });
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
    let plataformMaterial = new THREE.MeshLambertMaterial({ 
      map: texturaPlataforma,
      color: new THREE.Color(0.8, 0.8, 0.9) // Tinge clara
    });
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
    this.createBlocks(area2, 20, 20, 10, materialBlocosArea2);
    this.createBlocks(area2, -50, 50, 20, materialBlocosArea2);
    this.createBlocks(area2, 30, 10, 15, materialBlocosArea2);
    this.createBlocks(area2, 0, 0, 12, materialBlocosArea2);
    this.createBlocks(area2, -20, 10, 9, materialBlocosArea2);
    this.createBlocks(area2, -40, 30, 8, materialBlocosArea2);
    this.createBlocks(area2, 40, 50, 8, materialBlocosArea2);
    this.createBlocks(area2, 50, -20, 20, materialBlocosArea2);
    this.createBlocks(area2, -40, -40, 20, materialBlocosArea2);
    this.createBlocks(area2, -1, -40, 10, materialBlocosArea2);
    
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
    // Carregar texturas para o hangar
    let texturaFrenteHangar = textureLoader.load('assets/images/hangarExt.png'); // Paredes externas
    let texturaLateralHangar = textureLoader.load('assets/images/hangarExt.png'); // Paredes internas
    let texturaChaoHangar = textureLoader.load('assets/images/hangarChao.png'); // Chão do hangar
    let texturaPortasHangar = textureLoader.load('assets/images/hangarPorta.png'); // Portas do hangar
    let texturaTopoHangar = textureLoader.load('assets/images/hangarExt.png'); // Teto do hangar
    let texturaFundoHangar = textureLoader.load('assets/images/hangarExt.png'); // Portão do hangar
    // Configurar repetições
    texturaFrenteHangar.wrapS = THREE.RepeatWrapping;
    texturaFrenteHangar.wrapT = THREE.RepeatWrapping;
    texturaFrenteHangar.repeat.set(2, 3);
    texturaFrenteHangar.colorSpace = THREE.SRGBColorSpace;

    texturaLateralHangar.wrapS = THREE.RepeatWrapping;
    texturaLateralHangar.wrapT = THREE.RepeatWrapping;
    texturaLateralHangar.repeat.set(7, 3);
    texturaLateralHangar.colorSpace = THREE.SRGBColorSpace;

    texturaChaoHangar.wrapS = THREE.RepeatWrapping;
    texturaChaoHangar.wrapT = THREE.RepeatWrapping;
    texturaChaoHangar.repeat.set(1, 1);
    texturaChaoHangar.colorSpace = THREE.SRGBColorSpace;

    texturaPortasHangar.wrapS = THREE.RepeatWrapping;
    texturaPortasHangar.wrapT = THREE.RepeatWrapping;
    texturaPortasHangar.repeat.set(1, 3);
    texturaPortasHangar.colorSpace = THREE.SRGBColorSpace;

    texturaTopoHangar.wrapS = THREE.RepeatWrapping;
    texturaTopoHangar.wrapT = THREE.RepeatWrapping;
    texturaTopoHangar.repeat.set(18,10);
    texturaTopoHangar.colorSpace = THREE.SRGBColorSpace;

    texturaFundoHangar.wrapS = THREE.RepeatWrapping;
    texturaFundoHangar.wrapT = THREE.RepeatWrapping;
    texturaFundoHangar.repeat.set(10,3);
    texturaFundoHangar.colorSpace = THREE.SRGBColorSpace;

    // Criar materiais para o hangar
    let materialChaoHangar = new THREE.MeshLambertMaterial({ 
      map: texturaChaoHangar,
      color: new THREE.Color(1.2, 1.2, 1.2) 
    });

    let materialFrenteHangar = new THREE.MeshLambertMaterial({ 
      map: texturaFrenteHangar,
      color: new THREE.Color(0.8, 0.8, 0.9) 
    });

    let materialLateralHangar = new THREE.MeshLambertMaterial({ 
      map: texturaLateralHangar,
      color: new THREE.Color(0.8, 0.8, 0.9) 
    });

    let materialPortasHangar = new THREE.MeshLambertMaterial({ 
      map: texturaPortasHangar,
      color: new THREE.Color(0.7, 0.6, 0.5) 
    });

    let materialTopoHangar = new THREE.MeshLambertMaterial({ 
      map: texturaTopoHangar,
      color: new THREE.Color(0.8, 0.8, 0.9) 
    });

    let materialFundoHangar = new THREE.MeshLambertMaterial({ 
      map: texturaFundoHangar,
      color: new THREE.Color(0.6, 0.6, 0.7) 
    });

    let material3 = materialChaoHangar;
    let area3 = this.createDefaultArea(material3,172,0,-125,0.1);
    area3.position.set(156.0, 0.0, -118.0);
    scene.add(area3);

    let lateraisHangar = new THREE.Mesh(new THREE.BoxGeometry(2, 30, 106), materialLateralHangar);
    lateraisHangar.castShadow = true; // A área também deve projetar sombras
    lateraisHangar.receiveShadow = true; // A área também deve receber sombras
    lateraisHangar.position.set(95, 5, -118);
    this.blocksArea3.push(new THREE.Box3().setFromObject(lateraisHangar));

    scene.add(lateraisHangar);

    let laterais2Hangar = new THREE.Mesh(new THREE.BoxGeometry(2, 30, 106), materialLateralHangar);
    laterais2Hangar.castShadow = true; // A área também deve projetar sombras
    laterais2Hangar.receiveShadow = true; // A área também deve receber sombras
    laterais2Hangar.position.set(217, 5, -118);
    scene.add(laterais2Hangar);
    this.blocksArea3.push(new THREE.Box3().setFromObject(laterais2Hangar));

    let fundoHangar = new THREE.Mesh(new THREE.BoxGeometry(124, 30, 2), materialFundoHangar);
    fundoHangar.castShadow = true; // A área também deve projetar sombras
    fundoHangar.receiveShadow = true; // A área também deve receber sombras
    fundoHangar.position.set(156, 5, -171);
    scene.add(fundoHangar);
    this.blocksArea3.push(new THREE.Box3().setFromObject(fundoHangar));

    scene.add(this.createTopHangar(materialTopoHangar));

    //Cria frente hangar
    let frenteHangar1 = new THREE.Mesh(new THREE.BoxGeometry(33, 30, 2), materialFrenteHangar);
    frenteHangar1.castShadow = true; // A área também deve projetar sombras
    frenteHangar1.receiveShadow = true; // A área também deve receber sombras
    frenteHangar1.position.set(110.5, 5, -65);
    scene.add(frenteHangar1);
    this.blocksArea3.push(new THREE.Box3().setFromObject(frenteHangar1));

    let frenteHangar2 = new THREE.Mesh(new THREE.BoxGeometry(32, 30, 2), materialFrenteHangar);
    frenteHangar2.castShadow = true; // A área também deve projetar sombras
    frenteHangar2.receiveShadow = true; // A área também deve receber sombras
    frenteHangar2.position.set(202, 5, -65);
    scene.add(frenteHangar2);
    this.blocksArea3.push(new THREE.Box3().setFromObject(frenteHangar2));

    //Cria porta lateral
     this.portaHangar1 = new THREE.Mesh(new THREE.BoxGeometry(31, 30, 1), materialPortasHangar);
    this.portaHangar1.castShadow = true; // A área também deve projetar sombras
    this.portaHangar1.receiveShadow = true; // A área também deve receber sombras
    this.portaHangar1.position.set(141.8, 5, -66);
    scene.add(this.portaHangar1);
    this.door1Area3Box = new THREE.Box3().setFromObject(this.portaHangar1);
    this.blocksArea3.push(this.door1Area3Box);

  
    this.portaHangar2 = new THREE.Mesh(new THREE.BoxGeometry(30, 30, 1), materialPortasHangar);
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

  createBlocks(area,x,z,height, material){
    let blockGeometry = new THREE.BoxGeometry(4, height, 4);
      // Se não foi passado material, usa o padrão
    let blockMaterial = material || new THREE.MeshLambertMaterial({ color: "rgb(171, 98, 21)" });
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

 createTopHangar(material){
    let auxMat = new THREE.Matrix4();

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

    let topoHangarMesh = CSG.toMesh(csgObject, auxMat);
    topoHangarMesh.material = material;
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

  getBBBlocksArea3(){
    return this.blocksArea3;
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
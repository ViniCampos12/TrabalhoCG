import * as THREE from 'three';
import { setDefaultMaterial } from '../libs/util/util.js';

class Ladder {
  constructor(material) {
    // Cria material invisível
    const invisibleMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
    });
    
    let stepGeometry = new THREE.BoxGeometry(16, 0.75, 1);
    this.ladder = new THREE.Mesh(stepGeometry, material);

    for(let i = 1; i < 8; i++) {
      let step = new THREE.Mesh(stepGeometry, material);
      this.ladder.add(step);
      step.position.set(0, -0.75 * i, 1 * i);
    }

    const altura = 5.25;
    const profundidade = 7;
    const angulo = Math.atan(altura / profundidade);

    const rampGeometry = new THREE.PlaneGeometry(16, profundidade);
    
    // Cria e armazena a rampa
    const ramp = new THREE.Mesh(rampGeometry, invisibleMaterial);
    ramp.rotation.x = -angulo;
    ramp.position.set(0, -altura / 2, profundidade / 2);
    this.ladder.add(ramp);

    // Armazena a rampa como propriedade da instância
    this.ramp = ramp;

  }

  createLadder(){
    return this.ladder;
  }

  createBBHelper(bb, color) {
    let helper = new THREE.Box3Helper(bb, color);
    this.scene.add(helper);
    return helper;
  }

  getRampMesh() {
    console.log("Returning ramp mesh");
    console.log(this.ramp);
    return this.ramp;
  } 
}

export default Ladder;
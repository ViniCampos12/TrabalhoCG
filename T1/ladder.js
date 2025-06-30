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
    let ladder = new THREE.Mesh(stepGeometry, invisibleMaterial);

    for(let i = 1; i < 8; i++) {
      let step = new THREE.Mesh(stepGeometry, invisibleMaterial);
      ladder.add(step);
      step.position.set(0, -0.75 * i, 1 * i);
    }

    const altura = 5.25;
    const profundidade = 7;
    const angulo = Math.atan(altura / profundidade);

    const rampGeometry = new THREE.PlaneGeometry(16, profundidade);
    const rampMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xff9900, 
      side: THREE.DoubleSide 
    });
    
    // Cria e armazena a rampa
    const ramp = new THREE.Mesh(rampGeometry, rampMaterial);
    ramp.rotation.x = -angulo;
    ramp.position.set(0, -altura / 2, profundidade / 2);
    ladder.add(ramp);

    // Armazena a rampa como propriedade da instância
    this.ramp = ramp;

    // Retorna a ladder (comportamento incomum)
    return ladder;
  }

  createBBHelper(bb, color) {
    let helper = new THREE.Box3Helper(bb, color);
    this.scene.add(helper);
    return helper;
  }
}

export default Ladder;
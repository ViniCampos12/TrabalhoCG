import * as THREE from  'three';
import { setDefaultMaterial } from '../libs/util/util.js';


class Ladder{
  constructor(material){
    let stepGeometry = new THREE.BoxGeometry(16,0.75,1);
    let ladder = new THREE.Mesh(stepGeometry,material);

    for(let i = 1; i<8;i++){
        let step = new THREE.Mesh(stepGeometry,material);
        ladder.add(step);
        step.position.set(0,-0.75*i,1*i);
    }
    


    const invisibleMat = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        depthWrite: false,
    });

    const ramp = new THREE.Mesh(new THREE.PlaneGeometry(16, 17.1), invisibleMat);
    ramp.rotation.x = THREE.MathUtils.degToRad(135);
    ramp.position.set(0, -8, 0);
    ladder.add(ramp);

    return ladder;
  }

  createBBHelper(bb, color)
    {
       // Create a bounding box helper
       let helper = new THREE.Box3Helper( bb, color);
       this.scene.add( helper );
       return helper;
    }
}

export default Ladder;
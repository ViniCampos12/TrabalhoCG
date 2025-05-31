import * as THREE from  'three';


class Ladder{
  constructor(material){
    let stepGeometry = new THREE.BoxGeometry(16,0.75,1);
    let ladder = new THREE.Mesh(stepGeometry,material);

    for(let i = 1; i<8;i++){
        let step = new THREE.Mesh(stepGeometry,material);
        ladder.add(step);
        step.position.set(0,-0.75*i,1*i);
    }


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
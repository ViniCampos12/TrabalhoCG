import * as THREE from  'three';
import { setDefaultMaterial } from '../libs/util/util.js';


class Ladder {
  constructor(material) {
  //   const invisibleMaterial = new THREE.MeshBasicMaterial({
  // transparent: true, // Habilita a transparência para que 'opacity' funcione
  // opacity: 0,        // Define a opacidade como 0 (totalmente transparente)
  // side: THREE.DoubleSide // Opcional: Renderiza os dois lados do plano/geometria
  // });
  // material = invisibleMaterial;
    let stepGeometry = new THREE.BoxGeometry(16, 0.75, 1);
    let ladder = new THREE.Mesh(stepGeometry, material);

     for(let i = 1; i<8;i++){
        let step = new THREE.Mesh(stepGeometry,material);
        ladder.add(step);
        step.position.set(0,-0.75*i,1*i);
     }

    // // Assuming the first step is at (0,0,0) relative to the ladder's base.
    // // The subsequent steps move down and forward.
    // // The total height and depth of the ladder determine its slope.
    // const numberOfSteps = 8; // Including the initial step
    // const stepHeight = 0.75;
    // const stepDepth = 1;

    // // Calculate the total height and depth spanned by the steps
    // const totalLadderHeight = (numberOfSteps - 1) * stepHeight; // Total vertical drop
    // const totalLadderDepth = (numberOfSteps - 1) * stepDepth;   // Total horizontal extent

    // for (let i = 1; i < numberOfSteps; i++) {
    //   let step = new THREE.Mesh(stepGeometry, material);
    //   ladder.add(step);
    //   step.position.set(0, -stepHeight * i, stepDepth * i);
    // }

    // const rampGeometry = new THREE.PlaneGeometry(16, Math.sqrt(totalLadderHeight * totalLadderHeight + totalLadderDepth * totalLadderDepth)); // Adjust ramp length to match ladder's slope
    // const ramp = new THREE.Mesh(rampGeometry, setDefaultMaterial("rgb(0, 241, 48)"));

    // // Calculate the angle of the ladder based on its total height and depth
    // // The angle will be around the X-axis for a ramp that goes "up/down"
    // const angle = Math.atan2(totalLadderHeight, totalLadderDepth);

    // // Rotate the ramp around its local X-axis to match the ladder's slope
    // // We need to account for the plane's default orientation (facing Z+)
    // // and rotate it to face "up" relative to the ladder's incline.
    // ramp.rotation.x = -Math.PI / 2 + angle; // Rotate to lie flat, then tilt by the ladder's angle

    // // Position the ramp to cover the ladder's incline.
    // // The ramp's origin is its center. We want its "bottom" edge to be at the base of the ladder,
    // // and its "top" edge to align with the top of the last step.
    // // It's usually easier to move the ramp by half its calculated height/depth to align its base correctly.
    // ramp.position.set(
    //   0,
    //   -totalLadderHeight / 2, // Half the total vertical drop
    //   totalLadderDepth / 2    // Half the total horizontal extent
    // );

    // ladder.add(ramp);

    return ladder;
  }

  // getRamp(){
  //   return ramp;
  // }


  createBBHelper(bb, color)
    {
       // Create a bounding box helper
       let helper = new THREE.Box3Helper( bb, color);
       this.scene.add( helper );
       return helper;
    }
}

export default Ladder;
import { SceneComponent } from '@mp/common';
import { Object3D } from 'three';

type Inputs = {
  objectRoot: Object3D|null;
};

class EdgesMesh extends SceneComponent {
  inputs: Inputs = {
    objectRoot: null,
  };

  onInit() {
    const THREE = this.context.three;
    this.outputs.objectRoot = new THREE.Object3D();
    this.onInputsUpdated();
  }

  onInputsUpdated() {
    if (this.inputs.objectRoot) {
      this.inputs.objectRoot.traverse((obj: Object3D) => {
        if (obj.type === 'Mesh') {
        }
      });
    }
  }
}

export const edgesMeshType = 'mp.edgesMesh';

export const createEdgesMesh = () => {
  return new EdgesMesh();
};
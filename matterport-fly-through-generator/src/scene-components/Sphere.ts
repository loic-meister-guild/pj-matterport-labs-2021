import { SceneComponent, ISubscription } from '@mp/common/src/SceneComponent';
import { Object3D } from 'three';

type Inputs = {
  radius: number;
};

export class Sphere extends SceneComponent {
  pivot: Object3D|null = null;
  sub: ISubscription|null = null;

  inputs: Inputs = {
    radius: 0.3,
  };

  onInit() {
    const THREE = this.context.three;

    const size = this.inputs.radius * 2;
    const geometry = new THREE.BoxBufferGeometry(size, size, size, 8, 8, 8);
    const material = new THREE.MeshStandardMaterial({
      color: '#ff0000',
      transparent: true,
      opacity: 0.9,
    });
    const mesh = new THREE.Mesh(geometry, material);

    class Disposer implements ISubscription {
      cancel() {
        geometry.dispose();
        material.dispose();
      }
    }

    this.sub = new Disposer();
    this.outputs.objectRoot = mesh;
  }

  onDestroy() {
    if (this.sub) {
      this.sub.cancel();
      this.sub = null;
    }
  }
}

export const sphereType = 'fly.sphere';
export const makeSphere = function() {
  return () => new Sphere();
}

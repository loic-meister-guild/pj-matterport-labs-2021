import { SceneComponent } from '@mp/common/src/SceneComponent';
import { IDisposable, PathPoint } from '../interfaces';

type Inputs = {
  path: PathPoint[];
};

export class SweepVisualizer extends SceneComponent {
  private dispose: IDisposable[] = [];
  
  inputs: Inputs = {
    path: [],
  }

  onInit() {
    this.renderPath();
  }

  onInputsUpdated() {
    this.renderPath();
  }

  private renderPath() {

    if (this.dispose.length > 0) {
      this.dispose.forEach((disposable: IDisposable)=> {
        disposable.dispose();
      });
      this.dispose = [];
    }

    const THREE = this.context.three;
    const root = new THREE.Object3D();

    const material = new THREE.MeshStandardMaterial({
      transparent: true,
      opacity: 0.7,
    });
    this.dispose.push({
      dispose: () => {
        material.dispose();
      }
    });

    this.inputs.path.forEach((pathPoint) => {
      const geometry = new THREE.CylinderGeometry(0.2, 0.2, 0.03, 10, 10);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(pathPoint.floorPosition.x, pathPoint.floorPosition.y + 0.015, pathPoint.floorPosition.z);
      root.add(mesh);
      this.dispose.push({
        dispose: () => {
          geometry.dispose();
        }
      });
    });

    this.outputs.objectRoot = root;
  }
}

export const sweepVisualizerType = 'fly.sweepVisualizer';
export const makeSweepVisualizer = function() {
  return () => new SweepVisualizer();
}

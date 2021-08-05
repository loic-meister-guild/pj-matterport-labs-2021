import { SceneComponent } from '@mp/common/src/SceneComponent';
import { SphereBufferGeometry, MeshStandardMaterial, Vector3, Object3D } from 'three';

type Inputs = {
  radius: number;
  point: Vector3;
  target: Object3D|null;
  scale: number;
};

export enum HighlightPointEvent {
  Show = 'show',
}

type HighlightPointEvents = {
  [HighlightPointEvent.Show]: boolean;
};

export interface HiglightPointPayload {
  point: Vector3;
}

export class HighlightPoint extends SceneComponent {
  private material: MeshStandardMaterial;
  private geometry: SphereBufferGeometry;
  private scaleCache = { x: 1, y: 1, z: 1 };

  inputs: Inputs = {
    radius: 0.1,
    point: new Vector3(),
    target: null,
    scale: 1.2,
  };
  
  events = {
    show: true,
  } as HighlightPointEvents;

  onInit() {
    const THREE = this.context.three;

    const size = this.inputs.radius * 2;
    this.geometry = new THREE.SphereBufferGeometry(size, 8, 8);
    this.material = new THREE.MeshStandardMaterial({
      color: '#00ff00',
      transparent: true,
    });
    const mesh = new THREE.Mesh(this.geometry, this.material);
    mesh.visible = false;
    // this.outputs.objectRoot = mesh;
  }

  onInputsUpdated(previousInputs: Inputs) {
    const lastTarget = previousInputs.target;
    const nextTarget = this.inputs.target;

    if (lastTarget) {
      lastTarget.scale.set(this.scaleCache.x, this.scaleCache.y, this.scaleCache.z);
    }

    if (nextTarget) {
      console.log(`Hover Tween`);
      this.scaleCache.x = nextTarget.scale.x;
      this.scaleCache.y = nextTarget.scale.y;
      this.scaleCache.z = nextTarget.scale.z;

      nextTarget.scale.set(nextTarget.scale.x * this.inputs.scale, nextTarget.scale.y * this.inputs.scale, nextTarget.scale.z * this.inputs.scale);
    }
  }
}

export const highlightPointType = 'fly.highlightPoint';
export const makeHightlightPoint = function() {
  return () => new HighlightPoint();
}

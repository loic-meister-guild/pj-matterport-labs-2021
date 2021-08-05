import { SceneComponent } from '@mp/common';
import { ObservableValue } from '@mp/core';
import { Material, Mesh } from 'three';

type Inputs = {
  material: ObservableValue<Material>|null;
}

class Plane extends SceneComponent {
  inputs: Inputs = {
    material: null,
  };

  constructor() {
    super();

    this.onMaterialChanged = this.onMaterialChanged.bind(this);
  }

  onInit() {
    const THREE = this.context.three;
    const floorGeometry = new THREE.PlaneBufferGeometry(1, 1);
    const floorMaterial = this.inputs.material.value;
    const mesh = new THREE.Mesh(floorGeometry, floorMaterial);
    mesh.layers.enableAll();
    mesh.rotateX(-90 * Math.PI/ 180);
    this.outputs.objectRoot = mesh;
    this.outputs.collider = mesh;

    this.inputs.material.onChanged(this.onMaterialChanged);
  }

  private onMaterialChanged() {
    const mesh: Mesh = this.outputs.objectRoot as Mesh;
    mesh.material = this.inputs.material.value;
  }
}

export const planeType = 'mp.plane';

export const createPlane = () => {
  return new Plane();
};

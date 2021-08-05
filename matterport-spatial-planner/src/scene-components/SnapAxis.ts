import { SceneComponent } from '@mp/common';
import { modelRenderOrder } from '../interfaces';
import { Mesh, MeshStandardMaterial } from 'three';
import type THREE from 'three';

type Inputs = {
  visible: boolean;
  highlightX: boolean;
  highlightZ: boolean;
  center: { x: number, y: number, z: number };
  min: { x: number, y: number, z: number };
  max: { x: number, y: number, z: number };
}

const newMaterial = function(threeModule: typeof THREE, color: number) {
  return new threeModule.MeshStandardMaterial({
    color,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
    blending: threeModule.AdditiveBlending,
  });
}

class SnapAxis extends SceneComponent {
  private line: Mesh;
  private line2: Mesh;
  private line3: Mesh;
  private xMaterial: MeshStandardMaterial;
  private zMaterial: MeshStandardMaterial;

  inputs: Inputs = {
    visible: false,
    highlightX: false,
    highlightZ: false,
    center: { x: 0, y: 0, z: 0 },
    min: { x: -0.5, y: -0.5, z: -0.5 },
    max: { x: 0.5, y: 0.5, z: 0.5 },
  };

  onInit() {
    const THREE = this.context.three;

    const points = [];
    points.push( new THREE.Vector3( -3, 0, 0 ) );
    points.push( new THREE.Vector3( 3, 0, 0 ) );
    
    // const geometry = new THREE.BufferGeometry().setFromPoints( points );
    const geometry = new THREE.CylinderBufferGeometry(0.01, 0.01, 1);
    
    this.xMaterial = newMaterial(this.context.three, 0xffffff);
    this.zMaterial = newMaterial(this.context.three, 0xffffff);

    this.line = new THREE.Mesh( geometry, this.xMaterial);
    this.line.rotateX(-90 * Math.PI / 180);
    this.line.renderOrder = modelRenderOrder;
    this.line.name = 'SnapAxis-x';

    this.line2 = new THREE.Mesh( geometry, this.zMaterial);
    this.line.scale.set(1,1,1);
    this.line2.rotateZ(-90 * Math.PI / 180);
    this.line2.renderOrder = modelRenderOrder;
    this.line2.name = 'SnapAxis-z';

    this.line3 = new THREE.Mesh( geometry, newMaterial(this.context.three, 0xffffff) );
    this.line.scale.set(1,1,1);
    this.line3.renderOrder = modelRenderOrder;
    this.line3.name = 'SnapAxis-y';

    this.context.scene.add(this.line);
    this.context.scene.add(this.line2);
    this.context.scene.add(this.line3);
    this.line.scale.set(1,4,1);
    this.line2.scale.set(1,4,1);
    this.line3.scale.set(1,0.25,1);
    this.line.updateMatrixWorld();

    this.onInputsUpdated();
  }

  onInputsUpdated() {
    // axis extends to the size of the box
    const zDistance = this.inputs.max.z - this.inputs.min.z;
    // offset from axis center to center of box
    const zOffset = this.inputs.min.z + zDistance / 2 - this.inputs.center.z;
    this.line.visible = this.inputs.visible;
    this.line.position.set(this.inputs.center.x, this.inputs.center.y, this.inputs.center.z + zOffset);
    this.line.scale.set(1, zDistance, 1);


    const xDistance = this.inputs.max.x - this.inputs.min.x;
    const xOffset = this.inputs.min.x + xDistance / 2 - this.inputs.center.x;
    this.line2.visible = this.inputs.visible;
    this.line2.position.set(this.inputs.center.x + xOffset, this.inputs.center.y, this.inputs.center.z);
    this.line2.scale.set(1, xDistance, 1);

    this.line3.visible = this.inputs.visible;
    this.line3.position.set(this.inputs.center.x, this.inputs.center.y, this.inputs.center.z);

    this.xMaterial.opacity = this.inputs.highlightX ? 0.4 : 0.1;
    this.zMaterial.opacity = this.inputs.highlightZ ? 0.4 : 0.1;
  }

  onTick() {
    if (this.inputs.visible) {

    }
  }
}

export const snapAxisType = 'mp.snapAxis';

export const createSnapAxis = () => {
  return new SnapAxis();
};

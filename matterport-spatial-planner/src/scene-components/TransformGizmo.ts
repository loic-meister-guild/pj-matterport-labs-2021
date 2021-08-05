import { SceneComponent } from '@mp/common';
import { Dict } from '@mp/core';
import { GizmoEvents, TranslateEvent } from '../interfaces';
import { Object3D, Quaternion, Vector2, Vector3 } from 'three';

interface Inputs {
  target: Object3D|null;
  posZ: SceneComponent|null;
  negZ: SceneComponent|null;
  posX: SceneComponent|null;
  negX: SceneComponent|null;
}

class TransformGizmo extends SceneComponent {
  private tmp: Vector3 = new Vector3();
  private vec2: Vector2[] = [];

  inputs: Inputs = {
    target: null,
    posZ: null,
    negZ: null,
    posX: null,
    negX: null,
  };

  events = {
    [GizmoEvents.TRANSLATE]: true,
  };

  onInit() {
    for (let i=0; i<2; i++) {
      this.vec2.push(new Vector2());
    }

    this.inputs.negZ.outputs.objectRoot.rotateY(Math.PI);
    this.inputs.posX.outputs.objectRoot.rotateY(90 * Math.PI / 180);
    this.inputs.negX.outputs.objectRoot.rotateY(-90 * Math.PI / 180);
    const THREE = this.context.three;
    const axesHelper = new THREE.AxesHelper(0.2);
    this.outputs.objectRoot = axesHelper;
  }

  onInputsUpdated(previousInputs: Inputs) {
    if (this.inputs.target) {
      const worldPos = new Vector3();
      const worldQuat = new Quaternion();
      this.inputs.target.getWorldPosition(worldPos);
      this.inputs.target.getWorldQuaternion(worldQuat);
    
      const parent = this.inputs.target.parent;
      parent.remove(this.inputs.target);
      this.inputs.target.position.set(0,0,0);
      this.inputs.target.quaternion.set(0,0,0,1);
      const box3 = new this.context.three.Box3();
      box3.setFromObject(this.inputs.target);
      this.inputs.target.position.copy(worldPos);
      this.inputs.target.quaternion.copy(worldQuat);
      parent.add(this.inputs.target);
      const obj3D = (this.context.root as any).obj3D as Object3D;
      obj3D.position.copy(worldPos);
      obj3D.quaternion.copy(worldQuat);

      this.inputs.posZ.inputs.offset = { x: 0, y: 0, z: box3.max.z + 0.01 };
      this.inputs.negZ.inputs.offset = { x: 0, y: 0, z: box3.min.z - 0.01 };
      this.inputs.posX.inputs.offset = { x: box3.max.x + 0.01, y: 0, z: 0 };
      this.inputs.negX.inputs.offset = { x: box3.min.x - 0.01, y: 0, z: 0 };

      const size = new Vector3();
      box3.getSize(size);
      this.inputs.posZ.inputs.scale = { x: size.x, y: size.y, z: size.z };
      this.inputs.negZ.inputs.scale = { x: size.x, y: size.y, z: size.z };
      this.inputs.posX.inputs.scale = { x: size.x, y: size.y, z: size.z };
      this.inputs.negX.inputs.scale = { x: size.x, y: size.y, z: size.z };
    }
  }

  onEvent(eventType: string, eventData: Dict): void {
    if (eventType === GizmoEvents.TRANSLATE) {
      const translateEvent = eventData as TranslateEvent;
      const obj3D = (this.context.root as any).obj3D as Object3D;

      const screenDirection = this.vec2[0].set(translateEvent.screenDirection.x, translateEvent.screenDirection.y);
      const delta = this.vec2[1].set(translateEvent.delta.x, translateEvent.delta.y);
      const magnitude = delta.dot(screenDirection);

      this.tmp.set(translateEvent.worldDirection.x, translateEvent.worldDirection.y, translateEvent.worldDirection.z);
      obj3D.position.addScaledVector(this.tmp, magnitude);
      if (this.inputs.target) {
        this.inputs.target.position.addScaledVector(this.tmp, magnitude);
      }
    }
  }

  onTick(delta: number) {
  }
}

export const transformGizmoType = 'mp.transformGizmo';

export const createTransformGizmo = () => {
  return new TransformGizmo();
};

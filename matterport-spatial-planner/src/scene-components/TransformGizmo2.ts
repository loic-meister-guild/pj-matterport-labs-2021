import { ComponentInteractionType, SceneComponent } from '@mp/common';
import { Dict } from '@mp/core';
import { GizmoEvents } from '../interfaces';
import { Color, Mesh, MeshStandardMaterial } from 'three';
import { PlaneDragHelper } from './PlaneDragHelper';

export enum Mode {
  Translate = 'translate',
  Rotate = 'rotate',
  Draw = 'draw',
  AdjustFloor = 'adjustFloor',
}

interface Inputs {
  enabled: boolean;
  size: { x: number, y: number, z: number };
  offset: { x: number, y: number, z: number };
  mode: Mode;
}

class TransformGizmo2 extends SceneComponent {
  private mesh: Mesh;
  private material: MeshStandardMaterial;
  private hovering = false;
  private dragHelper: PlaneDragHelper;

  inputs: Inputs = {
    size: {
      x: 1,
      y: 1,
      z: 1,
    },
    offset: {
      x: 0,
      y: 0,
      z: 0,
    },
    mode: Mode.Rotate,
    enabled: true,
  }

  events = {
    [GizmoEvents.TRANSLATE]: true,
    [ComponentInteractionType.HOVER]: true,
    [ComponentInteractionType.DRAG_BEGIN]: true,
    [ComponentInteractionType.DRAG_END]: true,
    [ComponentInteractionType.DRAG]: true,
  };

  onInit() {
    const THREE = this.context.three;
    const box = new THREE.BoxGeometry(this.inputs.size.x, this.inputs.size.y, this.inputs.size.z);
    this.material = new THREE.MeshStandardMaterial();
    this.mesh = new THREE.Mesh(box, this.material);
    this.mesh.position.set(this.inputs.offset.x, this.inputs.offset.y, this.inputs.offset.z);

    this.dragHelper = new PlaneDragHelper(this, Mode.Rotate, this.mesh);
    this.dragHelper.init();

    this.outputs.objectRoot = this.mesh;
    this.outputs.collider = this.mesh;

    this.onInputsUpdated();
  }

  onInputsUpdated() {
    this.mesh.visible = this.inputs.enabled;
    this.mesh.position.set(this.inputs.offset.x, this.inputs.offset.y, this.inputs.offset.z);
    this.updateMaterial();
  }

  onEvent(eventType: string, eventData: Dict): void {
    if (eventType === ComponentInteractionType.HOVER) {
      this.hovering = eventData.hover === true;
    }

    this.dragHelper.onEvent(eventType, eventData);
    this.updateMaterial();
  }

  private updateMaterial() {
    if (this.hovering || this.dragHelper.dragging) {
      this.material.color = new Color('rgb(0, 0, 0)');
      this.material.emissive = new Color('rgb(255, 49, 88)');
      this.material.emissiveIntensity = 1;
      this.material.needsUpdate = true;
    }
    else {
      this.material.color = new Color(0xaaaaaa);
      this.material.emissive = new Color('rgb(0, 0, 0)');;
      this.material.emissiveIntensity = 0;
      this.material.needsUpdate = true;
    }
  }

  onTick(delta: number) {
  }
}

export const transformGizmo2Type = 'mp.transformGizmo2';

export const createTransformGizmo2 = () => {
  return new TransformGizmo2();
};

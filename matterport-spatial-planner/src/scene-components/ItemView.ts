import { SceneComponent, ComponentOutput, ComponentInteractionType } from '@mp/common';
import { Dict } from '@mp/core';
import { modelRenderOrder } from '../interfaces';
import { Color, LineSegments, Mesh, MeshBasicMaterial, MeshLambertMaterial, MeshPhongMaterial, Object3D } from 'three';
import { PlaneDragHelper } from './PlaneDragHelper';
import { Mode } from './TransformGizmo2';

type Inputs = {
  visible: boolean;
  color: number;
  objectRoot: Object3D|null;
  opacity: number;
  layer: number;
  minPosition: { x: number, y: number, z: number },
  maxPosition: { x: number, y: number, z: number },
};

type Outputs = {
  material: MeshPhongMaterial|null;
  snapPoint: { x: number, y: number, z: number },
  dragging: boolean,
  xSnapped: boolean,
  zSnapped: boolean,
} & ComponentOutput;

class ItemView extends SceneComponent {
  private dragHelper: PlaneDragHelper|null = null;
  inputs: Inputs = {
    visible: true,
    color: 0xffffff,
    objectRoot: null,
    opacity: 1.0,
    layer: 0,
    minPosition: { x: -0.5, y: -0.5, z: -0.5 },
    maxPosition: { x: 0.5, y: 0.5, z: 0.5 },
  };

  outputs = {
    material: null,
    snapPoint: { x: 0, y: 0, z: 0 },
    dragging: false,
    xSnapped: false,
    zSnapped: false,
  } as Outputs;

  events = {
    [ComponentInteractionType.DRAG_BEGIN]: true,
    [ComponentInteractionType.DRAG_END]: true,
    [ComponentInteractionType.DRAG]: true,
  };

  onInit() {
    this.onInputsUpdated();
  }

  onInputsUpdated() {
    if (this.inputs.objectRoot) {
      if (this.dragHelper) {
        this.dragHelper.dispose();
        this.dragHelper = null;
      }

      this.dragHelper = new PlaneDragHelper(this, Mode.Translate, this.inputs.objectRoot, this.inputs.minPosition, this.inputs.maxPosition);
      this.dragHelper.init();
      // const THREE = this.context.three;

      let transparent = true;
      if (this.inputs.opacity === 1.0) {
        transparent = false;
      }

      this.inputs.objectRoot.traverse((obj: Object3D) => {
        if (obj.type === 'Mesh') {
          const mesh = obj as Mesh;
          mesh.renderOrder = modelRenderOrder;
          mesh.layers.set(this.inputs.layer);
          if (Array.isArray(mesh.material)) {
            const materials = mesh.material as MeshLambertMaterial[];

            for (let i = 0; i<materials.length; i++) {
              materials[i].color = new Color(this.inputs.color);
              materials[i].transparent = transparent;
              materials[i].depthWrite = !transparent;
              materials[i].opacity = this.inputs.opacity;
              materials[i].depthWrite = transparent ? false : true;
            }
          }
          else {
            const material = mesh.material as MeshPhongMaterial;
            material.color = new Color(this.inputs.color);
            material.transparent = transparent;
            material.depthWrite = !transparent;
            material.opacity = this.inputs.opacity;
            material.depthWrite = transparent ? false : true;
            this.outputs.material = material;
          }
        }
        else if (obj.type === 'LineSegments') {
          const segemnts = obj as LineSegments;
          const material = segemnts.material as MeshBasicMaterial;
          material.transparent = true;
          material.opacity = 0.3;
          material.wireframeLinewidth = 10;
          segemnts.visible = false;
        }
      });
    }
  }

  onEvent(eventType: string, eventData: Dict): void {
    if (this.inputs.visible) {
      this.dragHelper.onEvent(eventType, eventData);
    }
  }

  onDestroy() {
    if (this.dragHelper) {
      this.dragHelper.dispose();
    }
  }

  onTick() {
    if (this.dragHelper && this.inputs.visible) {      
      this.outputs.dragging = this.dragHelper.dragging;
      this.outputs.xSnapped = this.dragHelper.xSnapped;
      this.outputs.zSnapped = this.dragHelper.zSnapped;
      this.outputs.snapPoint.x = this.dragHelper.snapPointOnPlane.x;
      this.outputs.snapPoint.y = this.dragHelper.snapPointOnPlane.y;
      this.outputs.snapPoint.z = this.dragHelper.snapPointOnPlane.z;
    }
  }
}

export const itemViewType = 'mp.itemView';

export const createItemView = () => {
  return new ItemView();
};

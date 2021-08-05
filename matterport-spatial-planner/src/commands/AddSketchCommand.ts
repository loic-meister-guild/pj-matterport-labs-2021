import { ISceneNode, planeRendererType } from '@mp/common';
import { Object3D } from 'three';
import { fabricRendererType } from '../scene-components/FabricRenderer';
import { sketchPainterType } from '../scene-components/SketchPainter';

const drawSceneFile = './assets/cube/draw.json';

export class AddSketchCommand {
  private itemSerialized: string|null = null;

  constructor(private sdk: any) {
  }

  public async execute(size: { x: number, y: number }, jsonData?: any): Promise<ISceneNode> {
    if (!this.itemSerialized) {
      const cubeJson = await fetch(drawSceneFile, {
        method: 'GET',
      });

      this.itemSerialized = await cubeJson.text();
    }
    const texelsPerMeter = 200;
    let planeRendererComponent;

    const node: ISceneNode[] = await this.sdk.Scene.deserialize(this.itemSerialized);
    for (const component of node[0].componentIterator()) {
      if (component.componentType === fabricRendererType) {
        component.inputs.size.w = texelsPerMeter * size.x;
        component.inputs.size.h = texelsPerMeter * size.y;
      }
      else if (component.componentType === planeRendererType) {
        planeRendererComponent = component;
        component.inputs.localScale.x = size.x;
        component.inputs.localScale.y = size.y;
        component.inputs.localScale.z = 1;
      }
      else if (component.componentType === sketchPainterType) {
        component.inputs.lineDrawing = false;
        component.inputs.jsonData = jsonData;
      }
    }
    ((node[0] as any).obj3D as Object3D).rotateX(-90*Math.PI/180);
    node[0].start();
    planeRendererComponent.outputs.collider = null;
    return node[0];
  }

  public dispose() {
  }
}
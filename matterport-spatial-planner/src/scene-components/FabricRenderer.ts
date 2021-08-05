import { ComponentOutput, SceneComponent } from "@mp/common";
import { fabric } from 'fabric';
import { CanvasTexture } from "three";

type Inputs = {
  size: { w: number, h: number };
}

type Outputs = {
  canvas: fabric.Canvas;
  texture: CanvasTexture;
} & ComponentOutput;

class FabricRenderer extends SceneComponent {
  private canvas: HTMLCanvasElement;

  constructor() {
    super();

    this.updateTexture = this.updateTexture.bind(this);
  }

  inputs: Inputs = {
    size: { w: 1024, h: 1024 },
  };

  outputs = {
    canvas: null,
    texture: null,
  } as Outputs;

  onInit() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.inputs.size.w;
    this.canvas.height = this.inputs.size.h;
    this.outputs.texture = new this.context.three.CanvasTexture(this.canvas);
    this.outputs.texture.minFilter = this.context.three.LinearFilter;
    this.outputs.texture.generateMipmaps = false;
    this.outputs.canvas = new fabric.Canvas(this.canvas);
    this.outputs.canvas.on("after:render", this.updateTexture);

    const actualWidth = this.canvas.width;
    const actualHeight = this.canvas.height;

    const options = {
      distance: 200,
      width: actualWidth,
      height: actualHeight,
      param: {
        stroke: '#55555511',
        strokeWidth: 3,
        selectable: false
      }
    };

    let gridLen = options.height / options.distance;
    for (let i = 0; i < gridLen; i++) {
      const distance   = i * options.distance;
      const horizontal = new fabric.Line([0, distance,  options.width,  distance ], options.param);
      this.outputs.canvas.add(horizontal);
    };

    gridLen = options.width / options.distance;
    for (let i = 0; i < gridLen; i++) {
      const distance   = i * options.distance;
      const vertical   = new fabric.Line([ distance, 0, distance, options.height], options.param);
      this.outputs.canvas.add(vertical);
    };
  }

  updateTexture() {
    this.outputs.texture.needsUpdate = true;
  }
}

export const fabricRendererType = 'mp.fabricRenderer';

export const createFabricRenderer = () => {
  return new FabricRenderer();
};

import { ComponentOutput, PointerButton, SceneComponent } from '@mp/common';
import { Camera, Color, Scene, Vector2, Vector4, WebGLRenderer, WebGLRenderTarget } from 'three';
import { PointerButtonEventData } from '../../PointerButtonEvent';

type Inputs = {
  position: Vector2;
};

type Outputs = {
  color: Color;
} & ComponentOutput;

class Dropper extends SceneComponent {
  private renderer: WebGLRenderer;
  private colorDst: Uint8Array;
  private rt: WebGLRenderTarget;
  private capture: {
    viewport: Vector4;
    scene: Scene;
    camera: Camera;
  };
  private pointerPos = new Vector2();

  outputs = {
    color: new Color(),
  } as Outputs;

  events = {
    'color.pick': true,
  };

  onInit() {
    const THREE = this.context.three;
    this.renderer = this.context.renderer;

    // HACK: get access to the root scene and camera to do a capture later
    const {camera, scene} = (<any> this.context);
    this.capture = {
      viewport: new Vector4(),
      camera,
      scene,
    };
    this.colorDst = new Uint8Array(4); // 1 byte per channel (r, g, b, a)

    this.context.renderer.getCurrentViewport(this.capture.viewport);
    this.rt = new THREE.WebGLRenderTarget(this.capture.viewport.z, this.capture.viewport.w);
  }

  onEvent(eventType: string, eventData: PointerButtonEventData) {
    if (eventType === 'color.pick' &&
        !eventData.down &&
        eventData.button === PointerButton.PRIMARY) {
      this.pointerPos.copy(eventData.position as Vector2);
      this.pick();
    }
  }

  private pick() {
    // TODO: this whole task should be as easy as reading pixels from the default frame buffer (assuming it hasn't been cleared)
    // const gl = this.renderer.getContext();
    // gl.readPixels(this.inputs.position.x, this.inputs.position.y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, this.colorDst);

    const pointerX = 0.5 * (this.pointerPos.x + 1) * this.capture.viewport.z;
    const pointerY = 0.5 * (this.pointerPos.y + 1) * this.capture.viewport.w;

    const oldRT = this.renderer.getRenderTarget();
    this.renderer.getViewport(this.capture.viewport);
    this.rt.setSize(this.capture.viewport.z, this.capture.viewport.w);
    this.renderer.setRenderTarget(this.rt);
    this.renderer.clear(true, true, false);
    this.renderer.render(this.capture.scene, this.capture.camera);
    this.renderer.setRenderTarget(oldRT);
    this.renderer.readRenderTargetPixels(this.rt, pointerX, pointerY, 1, 1, this.colorDst);
    this.outputs.color.setRGB(this.colorDst[0], this.colorDst[1], this.colorDst[2]).multiplyScalar(1 / 255);
    this.notify('color.picked');
  }
}

export interface IDropper extends SceneComponent {
  inputs: Inputs;
  outputs: Outputs;
}

export const dropperType = 'labs.dropper';
export function makeDropper() {
  return new Dropper();
}

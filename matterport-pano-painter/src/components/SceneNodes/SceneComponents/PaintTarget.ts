import { SceneComponent, PointerButton, PointerButtonMask } from '@mp/common';
import { Object3D, WebGLRenderer, Vector3, Scene, WebGLRenderTarget, Vector4, Camera } from 'three';
import { PointerButtonEventData, PointerMoveEventData } from '../../PointerButtonEvent';
import { BrushT } from './BrushCursor';
import { overlay } from './shader';

type Inputs = {
  brush: BrushT | null;
  renderPosition: Vector3;
};

class PaintTarget extends SceneComponent {
  private renderer: WebGLRenderer;
  private disposables: Array<{ dispose(): void; }> = [];

  // TODO: share with other tools and capture Showcase scene depth only once (when needed)
  private overlayRenderTarget: WebGLRenderTarget;
  private capture: {
    viewport: Vector4;
    scene: Scene;
    camera: Camera;
  };

  private renderOverlay: Object3D;

  private painting: boolean = false;
  private activePath: BrushPath | null = null;
  private activeMaterial: BrushT['material'] | null = null;

  inputs = {
    brush: null,
    renderPosition: new Vector3(),
  } as Inputs;

  events = {
    'brush.start': true,
    'brush.stroke': true,
    'brush.end': true,
  };

  constructor(private paintScene: IPaintScene) {
    super();
  }

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
    this.context.renderer.getCurrentViewport(this.capture.viewport);
    this.overlayRenderTarget = new THREE.WebGLRenderTarget(this.capture.viewport.z, this.capture.viewport.w, {
      stencilBuffer: false,
    });

    const overlayGeometry = new THREE.PlaneGeometry(2.0, 2.0);
    const overlayUniforms = overlay.createUniforms();
    overlayUniforms.tMap.value = this.overlayRenderTarget.texture;
    const overlayMaterial = new THREE.RawShaderMaterial({
      vertexShader: overlay.vertex,
      fragmentShader: overlay.fragment,
      uniforms: overlayUniforms,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });

    this.renderOverlay = new THREE.Mesh(overlayGeometry, overlayMaterial);
    this.renderOverlay.renderOrder = 11;
    this.renderOverlay.frustumCulled = false;

    this.outputs.objectRoot = this.renderOverlay;

    this.disposables.push(
      overlayGeometry,
      overlayMaterial,
      this.overlayRenderTarget.texture,
      this.overlayRenderTarget,
    );
  }

  onDestroy() {
    this.outputs.objectRoot = null;
    for (const disposable of this.disposables) {
      disposable.dispose();
    }

    this.disposables.length = 0;
  }

  onEvent(eventType: string, eventData: PointerButtonEventData | PointerMoveEventData) {
    if (isMoveEvent(eventData) && eventData.buttons & ~PointerButtonMask.PRIMARY) return;
    if (!isMoveEvent(eventData) && eventData.button !== PointerButton.PRIMARY) return;

    const isStart = eventType === 'brush.start' && !isMoveEvent(eventData) && eventData.down;
    const isStroke = eventType === 'brush.stroke' && this.painting;
    const isEnd = eventType === 'brush.end' && !isMoveEvent(eventData) && !eventData.down;
    if (isStart) {
      this.activePath = this.paintScene.addPath();
      this.painting = true;
    }
    if (isStart || isStroke) {
      if (this.inputs.brush) {
        const brushClone = this.inputs.brush.clone();
        brushClone.updateMatrixWorld();
        // brushClone.matrixAutoUpdate = false;
        brushClone.renderOrder = this.paintScene.nChildren;
        if (!this.activeMaterial) {
          this.activeMaterial = brushClone.material.clone();
        }
        brushClone.material = this.activeMaterial;
        this.activePath.add(brushClone);
      }
    } else if (isEnd) {
      // TODO: merge meshes to reduce the number of draw calls
      this.activeMaterial = null;
      this.painting = false;
    }
  }

  onTick() {
    this.updateTarget();
  }

  private updateTarget() {
    // remove the output renderable so it isn't capture in the depth pass
    this.outputs.objectRoot = null;

    const oldRT = this.renderer.getRenderTarget();
    this.renderer.getViewport(this.capture.viewport);
    this.overlayRenderTarget.setSize(this.capture.viewport.z, this.capture.viewport.w);
    this.renderer.setRenderTarget(this.overlayRenderTarget);

    // capture the current scene's depth
    this.renderer.clear(true, true, false);
    this.renderer.render(this.capture.scene, this.capture.camera);

    // draw the paint scene on top and use depth from Showcase to occlude properly
    const sort = this.renderer.sortObjects;
    this.renderer.sortObjects = false;
    this.renderer.clear(true, false, false);
    this.paintScene.render(this.renderer, this.capture.camera);
    this.renderer.sortObjects = sort;

    // reset the render target and add the output renderable back to the scene to draw the painted surfaces
    this.renderer.setRenderTarget(oldRT);
    this.outputs.objectRoot = this.renderOverlay;
  }

}

export interface IPaintTarget extends SceneComponent {
  inputs: Inputs;
}

export const paintTargetType = 'labs.painttarget';
export function makePaintTarget(pathFactory: IPaintScene) {
  return new PaintTarget(pathFactory);
}

export type BrushPath = {
  children: BrushT[];
} & Object3D;

export interface IPaintScene {
  addPath(): BrushPath;
  render(renderer: WebGLRenderer, camera: Camera): void;
  readonly nChildren: number;
}

function isMoveEvent(event: PointerButtonEventData | PointerMoveEventData): event is PointerMoveEventData {
  return event.hasOwnProperty('buttons');
}

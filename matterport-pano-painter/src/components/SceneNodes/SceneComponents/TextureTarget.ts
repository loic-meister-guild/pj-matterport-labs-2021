import { SceneComponent } from '@mp/common';
import { Object3D, WebGLRenderer, Vector3, Scene, RawShaderMaterial, WebGLRenderTarget, Vector4, Camera, Mesh, Texture } from 'three';
import { overlay, worldMapped } from './shader';
import { BrushT } from './BrushCursor';

const UP = new Vector3(0, 1, 0);

type Inputs = {
  brush: BrushT | null;
  texture: Texture | null;
  textureScale: number;
};

class TextureTarget extends SceneComponent {
  private renderer: WebGLRenderer;
  private disposables: Array<{ dispose(): void; }> = [];

  private overlayRenderTarget: WebGLRenderTarget;
  private capture: {
    viewport: Vector4;
    scene: Scene;
    camera: Camera;
  };

  private renderOverlay: Object3D;

  private activePath: BrushPath | null = null;
  private activeMaterial: RawShaderMaterial | null = null;

  private brushNormal = new Vector3();

  inputs = {
    brush: null,
    texture: null,
    textureScale: 1,
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

    this.setupActiveMaterial();

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
    this.renderOverlay.renderOrder = 10;
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

  onEvent(eventType: string) {
    if (!this.activeMaterial || !this.inputs.brush) return;
    // TODO: this should be handled by the BrushInput component but it updates late...
    this.inputs.brush.getWorldDirection(this.brushNormal);
    if (!(Math.abs(this.brushNormal.dot(UP)) > 0.99)) {
      return;
    }

    const isStart = eventType === 'brush.start';
    const isStroke = eventType === 'brush.stroke';
    const isEnd = eventType === 'brush.end';

    if (isStart) {
      console.log('target: isStart');
      this.activePath = this.paintScene.addPath();
    }
    if (isStart || isStroke) {
      console.log('target: isStart || isStroke');
      const brushClone = this.inputs.brush.clone() as Mesh;
      brushClone.updateMatrixWorld();
      brushClone.matrixAutoUpdate = false;
      brushClone.renderOrder = this.paintScene.nChildren;
      brushClone.material = this.activeMaterial;
      this.activePath.add(brushClone);
    } else if (isEnd) {
      console.log('target: isEnd');
      // TODO: merge meshes to reduce the number of draw calls
    }
  }

  onInputsUpdated(prevInputs: Inputs) {
    if (prevInputs.texture !== this.inputs.texture) {
      this.setupActiveMaterial();
    }
  }

  onTick() {
    this.updateTarget();
  }

  private setupActiveMaterial() {
    const THREE = this.context.three;
    if (this.inputs.texture) {
      const textureUniforms = worldMapped.createUniforms();
      textureUniforms.tMap.value = this.inputs.texture;
      textureUniforms.textureScale.value = this.inputs.textureScale;

      this.activeMaterial = new THREE.RawShaderMaterial({
        vertexShader: worldMapped.vertex,
        fragmentShader: worldMapped.fragment,
        uniforms: textureUniforms,
        side: THREE.DoubleSide,
        transparent: true,
        depthWrite: false,
      });
    } else {
      this.activeMaterial = null;
    }
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

export interface ITextureTarget extends SceneComponent {
  inputs: Inputs;
}

export const textureTargetType = 'labs.textureTarget';
export function makeTextureTarget(pathFactory: IPaintScene) {
  return new TextureTarget(pathFactory);
}

export type BrushPath = {
  children: BrushT[];
} & Object3D;

export interface IPaintScene {
  addPath(): BrushPath;
  render(renderer: WebGLRenderer, camera: Camera): void;
  readonly nChildren: number;
}

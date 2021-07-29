import { brushCursorType, IBrushCursor } from './SceneComponents/BrushCursor';
import { Vector3, ObjectLoader } from 'three';
import { ComponentInteractionType, SceneComponent, Cursor } from '@mp/common';
import { ITextureTarget, textureTargetType } from './SceneComponents/TextureTarget';
import { appliedTextureType, ITextureSelector } from './SceneComponents/TextureSelector';
import { brushInputType, IBrushInput } from './SceneComponents/BrushInput';

const UP = new Vector3(0, 1, 0);

export type BrushStateT = {
  size: number;
  textureDescriptors: Array<{
    src: string;
    size: number;
  }>;
  activeTexture: number;
}

export class TextureNode {
  private enabled: boolean = false;
  private position = new Vector3();
  private subs: { cancel(): void }[];

  private input: SceneComponent;
  private textureTarget: ITextureTarget;
  private textureSelector: ITextureSelector;
  private brushCursor: IBrushCursor;
  private brushInput: IBrushInput;

  private _loader: ObjectLoader;

  private brushNormal = new Vector3();

  constructor(sdk: any, private node: any, initialWidth: number, private cursor: SceneComponent) {
    // the brushCursor has to be first so it can respond to input before the textureTarget does
    this.brushInput = node.addComponent(brushInputType, {
      allowed: () => {
        if (this.enabled) {
          const visible = Math.abs(this.brushNormal.dot(UP)) > 0.99;
          this.cursor.inputs.cursor = visible ? Cursor.PLUS : Cursor.NOPE;

          return visible;
        }
        return false;
      },
    });
    this.brushCursor = node.addComponent(brushCursorType, {
      width: initialWidth,
    });

    this.textureTarget = node.addComponent(textureTargetType);
    this.textureSelector = node.addComponent(appliedTextureType);

    this.input = node.addComponent('mp.input', {
      eventsEnabled: false,
      userNavigationEnabled: true,
    });

    this.textureTarget.bind('texture', this.textureSelector, 'texture');
    this.textureTarget.bind('textureScale', this.textureSelector, 'textureScale');
    this.textureTarget.bind('brush', this.brushCursor, 'brush');
    this.brushInput.bindEvent('input.start', this.input, ComponentInteractionType.POINTER_BUTTON);
    this.brushInput.bindEvent('input.stroke', this.input, ComponentInteractionType.POINTER_MOVE);
    this.brushInput.bindEvent('input.end', this.input, ComponentInteractionType.POINTER_BUTTON);
    this.textureTarget.bindEvent('brush.start', this.brushInput, 'start');
    this.textureTarget.bindEvent('brush.stroke', this.brushInput, 'stroke');
    this.textureTarget.bindEvent('brush.end', this.brushInput, 'end');

    node.start();
    this.createSdkSubscriptions(sdk);
    this._loader = new this.textureTarget.context.three.ObjectLoader();
  }

  dispose() {
    for (const sub of this.subs) {
      sub.cancel();
    }
    this.node.stop();
  }

  enable(enabled: boolean) {
    this.input.inputs.eventsEnabled = enabled;
    this.input.inputs.userNavigationEnabled = !enabled;

    this.cursor.inputs.hideReticle = enabled;
    this.cursor.inputs.cursor = enabled ? Cursor.PLUS : Cursor.DEFAULT;

    this.brushCursor.inputs.enabled = enabled;
    this.enabled = enabled;
  }

  setTextureSettings(brushState: BrushStateT) {
    this.brushCursor.inputs.width = brushState.size;
    this.textureSelector.inputs.textureDescs = brushState.textureDescriptors;
    this.textureSelector.inputs.activeTexture = brushState.activeTexture;
  }

  /**
   * HACK!!
   */
  get loader() {
    return this._loader;
  }

  private createSdkSubscriptions(sdk: any) {
    this.subs = [
      sdk.Pointer.intersection.subscribe((intersection: any) => {
        this.brushCursor.inputs.position = intersection.position;
        this.brushCursor.inputs.normal = intersection.normal;

        this.brushNormal.copy(intersection.normal);
      }),
      sdk.Camera.pose.subscribe((pose: any) => {
        this.position.copy(pose.position);
      }),
    ];
  }

}

export namespace TextureNode {
  export type NodeDataT = {
    brushes: {};
  };
}

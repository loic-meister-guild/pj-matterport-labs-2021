import { paintTargetType, IPaintTarget } from './SceneComponents/PaintTarget';
import { brushCursorType, IBrushCursor } from './SceneComponents/BrushCursor';
import { Vector3, ObjectLoader } from 'three';
import { SceneComponent, ComponentInteractionType, IComponentEventSpy, Cursor } from '@mp/common';
import { PointerButtonEventData } from '../PointerButtonEvent';

export type BrushStateT = {
  color: string;
  size: number;
  opacity: number;
}

export interface IPaintNotifier {
  onBrushStarted(): void;
  // onBrushStroke(): void; // TODO: needed?
  onBrushEnded(): void;
}

export class PaintNode {
  private position = new Vector3();
  private subs: { cancel(): void }[];

  private input: SceneComponent;
  private paintTarget: IPaintTarget;
  private brushCursor: IBrushCursor;

  private _loader: ObjectLoader;

  constructor(sdk: any, private node: any, initialWidth: number, private cursor: SceneComponent, paintNotifier: IPaintNotifier) {
    // the brushCursor has to be first so it respond to input before the paintTarget does
    this.brushCursor = node.addComponent(brushCursorType, {
      width: initialWidth,
    });
    this.paintTarget = node.addComponent(paintTargetType);

    this.input = node.addComponent('mp.input', {
      eventsEnabled: false,
      userNavigationEnabled: true,
    });


    this.paintTarget.inputs.renderPosition = this.position;

    this.paintTarget.bind('brush', this.brushCursor, 'brush');
    this.paintTarget.bindEvent('brush.start', this.input, ComponentInteractionType.POINTER_BUTTON);
    this.paintTarget.bindEvent('brush.stroke', this.input, ComponentInteractionType.POINTER_MOVE);
    this.paintTarget.bindEvent('brush.end', this.input, ComponentInteractionType.POINTER_BUTTON);

    this.input.spyOnEvent(new class implements IComponentEventSpy {
      constructor(private paintNotifier: IPaintNotifier) { }
      eventType = ComponentInteractionType.POINTER_BUTTON;
      onEvent(eventData: PointerButtonEventData) {
        if (eventData.down) {
          this.paintNotifier.onBrushStarted();
        } else {
          this.paintNotifier.onBrushEnded();
        }
      }
    }(paintNotifier));

    node.start();
    this.createSdkSubscriptions(sdk);
    this._loader = new this.paintTarget.context.three.ObjectLoader();
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

    this.brushCursor.inputs.enabled = enabled
  }

  setBrushState(brushState: BrushStateT) {
    this.brushCursor.inputs.width = brushState.size;
    this.brushCursor.inputs.color = brushState.color;
    this.brushCursor.inputs.opacity = brushState.opacity;
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
      }),
      sdk.Camera.pose.subscribe((pose: any) => {
        this.position.copy(pose.position);
      }),
    ];
  }

}

export namespace PaintNode {
  export type NodeDataT = {
    brushes: {};
  };
}


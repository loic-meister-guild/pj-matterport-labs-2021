import { dropperType, IDropper } from './SceneComponents/Dropper';
import { ComponentInteractionType, SceneComponent, Cursor } from '@mp/common';

type UpdateColorT = (color?: string) => void;

export class DropperNode {

  private dropper: IDropper;
  private input: SceneComponent;

  constructor(_: unknown, private node: any, private cursor: SceneComponent, updateColor: UpdateColorT) {
    this.dropper = node.addComponent(dropperType);

    this.input = node.addComponent('mp.input', {
      eventsEnabled: false,
      userNavigationEnabled: true,
    });

    const dropper = this.dropper;
    this.dropper.spyOnEvent(new class ColorPickSpy {
      eventType = 'color.picked';
      onEvent() {
        updateColor('#' + dropper.outputs.color.getHexString());
      }
    }());
    this.dropper.bindEvent('color.pick', this.input, ComponentInteractionType.POINTER_BUTTON);

    node.start();
  }

  dispose() {
    this.node.stop();
  }

  enable(enabled: boolean) {
    this.input.inputs.eventsEnabled = enabled;
    this.input.inputs.userNavigationEnabled = !enabled;

    this.cursor.inputs.hideReticle = enabled;
    this.cursor.inputs.cursor = enabled ? Cursor.DROPPER : Cursor.DEFAULT;
  }
}

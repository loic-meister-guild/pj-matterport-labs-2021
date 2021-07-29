import { SceneComponent, PointerButtonMask, PointerButton } from '@mp/common';
import { PointerButtonEventData, PointerMoveEventData } from 'src/components/PointerButtonEvent';

class BrushInput extends SceneComponent {
  private dragging: boolean = false;

  inputs = {
    allowed: () => true,
  } as Inputs;

  events = {
    'input.start': true,
    'input.stroke': true,
    'input.end': true,
  };

  onEvent(eventType: string, eventData: PointerButtonEventData) {
    if (isMoveEvent(eventData) && eventData.buttons & ~PointerButtonMask.PRIMARY) return;
    if (!isMoveEvent(eventData) && eventData.button !== PointerButton.PRIMARY) return;

    const isStart = eventType === 'input.start' && !isMoveEvent(eventData) && eventData.down && !this.dragging;
    const isStroke = eventType === 'input.stroke' && this.dragging;
    const isEnd = eventType === 'input.end' && !isMoveEvent(eventData) && !eventData.down && this.dragging;

    if (this.inputs.allowed()) {
      if (isStart) {
        console.log('isStart')
        this.dragging = true;
        this.notify('start', eventData);
      }
      if (isStroke) {
        this.notify('stroke', eventData);
      }
    }
    if (isEnd) {
      console.log('isEnd')
      this.dragging = false;
      this.notify('end', eventData);
    }
  }

}

export const brushInputType = 'labs.brush.input';
export function makeBrushInput() {
  return new BrushInput();
}

type Inputs = {
  allowed(): boolean;
};

export interface IBrushInput extends SceneComponent {
  inputs: Inputs;
}

function isMoveEvent(event: PointerButtonEventData | PointerMoveEventData): event is PointerMoveEventData {
  return event.hasOwnProperty('buttons');
}

import {
  IVector2,
  PointerButton,
  PointerButtonEvent,
  PointerButtonMask,
  PointerDevice,
  PointerMoveEvent,
} from '@mp/common';

export class PointerButtonEventData implements PointerButtonEvent {
  readonly id: number;
  readonly position: IVector2;
  readonly button: PointerButton;
  readonly down: boolean;
  readonly device: PointerDevice;
}
export class PointerMoveEventData implements PointerMoveEvent {
  readonly id: number;
  readonly position: IVector2;
  readonly buttons: PointerButtonMask;
  readonly device: PointerDevice;
}
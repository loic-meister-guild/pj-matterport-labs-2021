import { ComponentInteractionType, SceneComponent } from '@mp/common';

class Slot extends SceneComponent {
  events = {
    [ComponentInteractionType.CLICK]: true,
    [ComponentInteractionType.HOVER]: true,
  };

  onInit() {
  }
}

export const slotType = 'mp.slot';

export const createSlot = () => {
  return new Slot();
};

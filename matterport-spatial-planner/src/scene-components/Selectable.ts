import { ComponentInteractionType, SceneComponent } from '@mp/common';
import { Dict } from '@mp/core';
import { ISelectionMediator } from '../interfaces';

type Inputs = {
  enable:  boolean;
}

class Selectable extends SceneComponent {
  inputs: Inputs = {
    enable: true,
  };

  events = {
    [ComponentInteractionType.CLICK]: true,
  };

  constructor(private selectionMediator: ISelectionMediator) {
    super();
  }

  onEvent(eventType: string, eventData: Dict): void {
    if (this.inputs.enable) {
      this.selectionMediator.onSelect(this.context.root);
    }
  }
}

export const selectableType = 'mp.selectable';

export const createSelectable = (selectionMediator: ISelectionMediator) => {
  return () => {
    return new Selectable(selectionMediator);
  };
};

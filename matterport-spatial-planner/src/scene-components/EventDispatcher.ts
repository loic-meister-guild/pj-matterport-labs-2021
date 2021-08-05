import { ComponentInteractionType, SceneComponent } from '@mp/common';
import { Dict } from '@mp/core';
import { IEventListener } from '../interfaces';

type Inputs = {
  listeners: IEventListener[];
}

class EventDispatcher extends SceneComponent {
  inputs: Inputs = {
    listeners: [],
  };

  events = {
    [ComponentInteractionType.CLICK]: true,
    [ComponentInteractionType.HOVER]: true,
  };

  onInit() {
    const obj = new this.context.three.Object3D();
    this.outputs.objectRoot = obj;
    this.outputs.collider = obj;
  }

  onEvent(eventType: string, eventData: Dict): void {
    for (const listener of this.inputs.listeners) {
      const result = listener.willHandleEvent ? listener.willHandleEvent(eventType, eventData): {
        handle: true,
      };

      if (result.handle) {
        listener.onEvent(result.eventType || eventType, eventData);
        return;
      }
    }
  }
}

export const eventDispatcherType = 'mp.eventDispatcher';

export const createEventDispatcher = () => {
  return new EventDispatcher();
};

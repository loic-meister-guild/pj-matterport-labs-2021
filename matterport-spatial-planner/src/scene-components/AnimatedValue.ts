import { SceneComponent } from '@mp/common';
import { Dict } from '@mp/core';
import TWEEN from '@tweenjs/tween.js';

export enum Events {
  // inbound events
  Start = 'Start',
  Stop = 'Stop',

  // outbound event
  OnUpdate = 'OnUpdate',
}

export type StartEventData = {
  initial: number;
  target: number;
  duration: number;
}

export enum State {
  Start,
  Update,
  End,
}

export type OnUpdateData = {
  state: State;
  value: number;
};

type ValueWrapper = {
  value: number;
}

class AnimatedValue extends SceneComponent {
  private tween: any = null;
  private time: number = 0;

  onEvent(eventType: string, eventData: Dict): void {
    if (eventType === Events.Start) {
      const data = eventData as StartEventData;

      if(this.tween && this.tween.isPlaying()) {
        this.tween.stop();
        this.tween = null;
      }

      const start = {
        value: data.initial,
      };

      const end = {
        value: data.target,
      };

      this.tween = new TWEEN.Tween<ValueWrapper>(start)
        .to(end)
        .easing(TWEEN.Easing.Quadratic.Out)
        .duration(data.duration)
        .onStart((object: ValueWrapper) => {
          this.notify(Events.OnUpdate, {
            state: State.Start,
            value: object.value,
          } as OnUpdateData);
        })
        .onUpdate((object: ValueWrapper) => {
          this.notify(Events.OnUpdate, {
            state: State.Update,
            value: object.value,
          } as OnUpdateData);
        })
        .onComplete((object: ValueWrapper) => {
          this.notify(Events.OnUpdate, {
            state: State.End,
            value: object.value,
          } as OnUpdateData);
        })
        .start(this.time);
    }
    else if (eventType === Events.Stop) {
      if (this.tween) {
        this.tween.stop();
        this.tween = null;
      }
    }
  }

  onTick(delta: number) {
    this.time += delta;

    if (this.tween) {
      this.tween.update(this.time);
    }
  }
}

export const animatedValueType = 'mp.animatedValue';

export const createAnimatedValue = () => {
  return new AnimatedValue();
};

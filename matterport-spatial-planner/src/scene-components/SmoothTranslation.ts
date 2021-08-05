import { ComponentOutput, SceneComponent } from '@mp/common';
import { Dict } from '@mp/core';
import TWEEN from '@tweenjs/tween.js';
import { Vector3 } from 'three';

type Inputs = {
  target: { x: number, y: number, z: number },
  duration: number|undefined;
};

type Outputs = {
  position: { x: number, y: number, z: number },
  x: number;
  y: number;
  z: number;
  duration: number;
} & ComponentOutput;


export enum Events {
  // inbound
  Start = 'Start',
  Stop = 'Stop',

  // outbound
  OnStopped = 'OnStopped',
  OnStarted = 'OnStarted',
}

export type EventStart = {
  position: Vector3,
}

class SmoothTranslation extends SceneComponent {
  private tween: any = null;
  private time: number = 0;

  inputs: Inputs = {
    target: { x: 0, y: 0, z: 0 },
    duration: undefined,
  };

  outputs = {
    position: { x: 0, y: 0, z: 0 },
    x: 0,
    y: 0,
    z: 0,
  } as Outputs;

  events = {
    [Events.Start]: true,
    [Events.Stop]: true,
  };

  onInit() {
  }

  onInputsUpdated(): void {}

  onTick(delta: number) {
    this.time += delta;

    if (this.tween) {
      this.tween.update(this.time);
    }
  }

  onEvent(eventType: string, eventData: Dict): void {
    if (eventType === Events.Start) {
      const data = eventData as EventStart;

      this.startAnimation(data.position);
    }
    else if (eventType === Events.Stop) {
      this.stopAnimation();
    }
  }

  private stopAnimation() {
    if (this.tween) {
      this.tween.stop();
      this.tween = null;
    }
  }

  private startAnimation(startPosition: { x: number, y: number, z: number }|undefined) {
    this.stopAnimation();

    const state = {
      x: startPosition.x,
      y: startPosition.y,
      z: startPosition.z,
    };

    this.outputs.position.x = startPosition.x;
    this.outputs.position.y = startPosition.y;
    this.outputs.position.z = startPosition.z;

    const diff = new this.context.three.Vector3(this.inputs.target.x - this.outputs.position.x,
                                                this.inputs.target.y - this.outputs.position.y,
                                                this.inputs.target.z - this.outputs.position.z);
    if (diff.lengthSq() > 0.01) {
      let duration;
      if (this.inputs.duration) {
        duration = this.inputs.duration;
      }
      else {
        const distance = diff.length();
        const velocity = 0.01;
        duration = distance / velocity;
      }

      this.tween = new TWEEN.Tween<{ x: number, y: number, z: number}>(state)
        .to(this.inputs.target)
        .easing(TWEEN.Easing.Cubic.Out)
        .duration(duration)
        .onStart(() => {
          this.notify(Events.OnStarted);
        })
        .onUpdate((state) => {
          const output = {
            x: state.x,
            y: state.y,
            z: state.z,
          };
          this.outputs.position = output;
        })
        .onComplete(() => {
          this.notify(Events.OnStopped);
        })
        .start(this.time);
    }
  }
}

export const smoothTranslationType = 'mp.smoothTranslation';

export const createSmoothTranslation = () => {
  return new SmoothTranslation();
};

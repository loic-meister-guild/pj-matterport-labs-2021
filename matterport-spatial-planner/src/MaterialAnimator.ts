import { IComponentEventSpy } from '@mp/common';
import EventEmitter from 'eventemitter3';
import { Material, MeshStandardMaterial } from 'three';
import { IDisposable, IPool } from './interfaces';
import { Events, OnUpdateData, State } from './scene-components/AnimatedValue';

export enum AnimatorEvent {
  OnComplete = 'OnComplete',
}

export type AnimationParams = {
  edges: boolean;
  duration: number;
  target: number;
}

export const animateMaterial = (pool: IPool, material: MeshStandardMaterial, params: AnimationParams): IDisposable => {
  const mat = material;
  const currentValue = mat.opacity;

  if (currentValue === params.target) {
    return {
      dispose() {}
    };
  }

  let animator = pool.borrow();

  // adjust the start value and duration if the material is already transparent.  
  const speed = Math.abs(params.target - currentValue) / params.duration;
  const newDuration = Math.abs(params.target - currentValue) / speed;
  // console.warn(`ANIMATE START name:${room.name} current:${currentValue} target: ${params.target} speed:${speed} newDuration:${newDuration}`);

  const materialAnimator = makeMaterialAnimator(mat);
  const sub = animator.spyOnEvent(materialAnimator);

  animator.onEvent(Events.Start, {
    initial: currentValue,
    target: params.target,
    duration: newDuration,
    edges: params.edges,
  });

  materialAnimator.events.once(AnimatorEvent.OnComplete, () => {
    if (animator) {
      // console.warn(`ANIMATE COMPLETE current:${currentValue} name:${room.name} target: ${params.target} speed:${speed} newDuration:${newDuration}`);
      pool.return(animator);
      animator = null;
      sub.cancel();
    }
  });

  return {
    dispose() {
      if (animator) {
        // console.warn(`ANIMATE CANCEL name:${room.name} current:${currentValue} target: ${params.target} speed:${speed} newDuration:${newDuration}`);
        animator.onEvent(Events.Stop,{});
        pool.return(animator);
        animator = null;
        sub.cancel();
      }
    }
  }
}

class MaterialAnimator implements IComponentEventSpy<any> {
  public eventType = Events.OnUpdate;
  public events: EventEmitter<AnimatorEvent.OnComplete>;
  constructor(private material: Material) {
    this.events = new EventEmitter<AnimatorEvent.OnComplete>();
  }

  onEvent(eventData: OnUpdateData) {
    switch(eventData.state) {
      case State.Start:
        this.material.transparent = eventData.value !== 1;
        this.material.depthWrite = !this.material.transparent;
        this.material.opacity = eventData.value;
        break;

      case State.Update:
        this.material.transparent = eventData.value !== 1;
        this.material.depthWrite = !this.material.transparent;
        this.material.opacity = eventData.value;
        break;

      case State.End:
        this.material.transparent = eventData.value !== 1;
        this.material.depthWrite = !this.material.transparent;
        this.material.opacity = eventData.value;
        this.events.emit(AnimatorEvent.OnComplete);
        break;
    }
  }
}

export const makeMaterialAnimator = function(material: Material): MaterialAnimator {
  return new MaterialAnimator(material);
}

import { ComponentOutput, ISceneNode, SceneComponent } from '@mp/common/src/SceneComponent';
import { Vector3 } from 'three';
import { DirtyTracker } from './DirtyTracker';

type Inputs = {
  node: ISceneNode|null;
};

type Outputs = {
  position: Vector3;
}  & ComponentOutput;

/**
 * poll for position changes of an sdk scene node
 */
export class SceneNodeObserver extends SceneComponent {
  private positionTracker: DirtyTracker<Vector3>|null = null;
  
  inputs: Inputs = {
    node: null,
  }

  outputs = {
    position: new Vector3(),
  } as Outputs;
  
  onInit() {
    this.onInputsUpdated();
  }

  onInputsUpdated() {
     if (this.inputs.node) {
      this.positionTracker = new DirtyTracker<Vector3>(
        250,
        () => this.inputs.node.position,
        (a: Vector3, b: Vector3)  => a.equals(b),
        () => new Vector3(),
        (from: Vector3, to: Vector3) => to.copy(from)
      );
    }
  }

  onDestroy() {
  }

  onTick(delta: number) {
    if (this.positionTracker) {
      this.positionTracker.onTick(delta);

      if (this.positionTracker.dirty) {
        this.positionTracker.update();
        this.outputs.position = new Vector3().copy(this.inputs.node.position);
      }
    }
  }
}

export const sceneNodeObserverType = 'fly.sceneNodeObserver';
export const makeSceneNodeObserver = function() {
  return () => new SceneNodeObserver();
}

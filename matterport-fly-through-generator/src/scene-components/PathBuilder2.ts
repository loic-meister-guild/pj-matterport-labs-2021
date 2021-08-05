import { SceneComponent, ComponentOutput, ISceneNode } from '@mp/common/src/SceneComponent';
import { Vector3 } from 'three';
import { DirtyTracker } from './DirtyTracker';
import { PathState, PathPoint } from '../interfaces';
import { nearestSweepType } from './NearestSweep';

type Inputs = {
  start: ISceneNode|null;
  end: ISceneNode|null;
};

type Outputs = {
  path: PathPoint[];
} & ComponentOutput;

export class PathBuilder2 extends SceneComponent {
  private meshDirty: boolean = true;
  private nextValidUpdateTime: number = 0;
  private timeElapsed: number = 0;
  private startTracker: DirtyTracker<Vector3>|null = null;
  private endTracker: DirtyTracker<Vector3>|null = null;
  private startNearestSweep: SceneComponent|null = null;
  private endNearestSweep: SceneComponent|null = null;

  constructor(private pathState: PathState) {
    super();
  }

  inputs: Inputs = {
    start: null,
    end: null,
  };

  outputs = {
    path: [],
  } as Outputs;

  onInit() {
    this.startTracker = new DirtyTracker<Vector3>(
      250,
      () => this.inputs.start.position,
      (a: Vector3, b: Vector3)  => a.equals(b),
      () => new Vector3(),
      (from: Vector3, to: Vector3) => to.copy(from)
    );

    this.endTracker = new DirtyTracker<Vector3>(
      250,
      () => this.inputs.end.position,
      (a: Vector3, b: Vector3)  => a.equals(b),
      () => new Vector3(),
      (from: Vector3, to: Vector3) => to.copy(from)
    );

    this.pathState.validPath.value = false;

    for (const component of this.inputs.start.componentIterator()) {
      if (component.componentType === nearestSweepType) {
        this.startNearestSweep = component;
      }
    }

    for (const component of this.inputs.end.componentIterator()) {
      if (component.componentType === nearestSweepType) {
        this.endNearestSweep = component;
      }
    }

    this.outputs.path = this.pathState.path.value;
  }

  onInputsUpdated() {
    this.meshDirty = true;
  }

  onDestroy() {
  }

  onTick(delta: number) {
    this.timeElapsed += delta;
    this.startTracker.onTick(delta);
    this.endTracker.onTick(delta);

    const dirty = this.meshDirty || this.startTracker.dirty || this.endTracker.dirty;

    if (dirty && this.timeElapsed > this.nextValidUpdateTime) {
      this.nextValidUpdateTime = this.timeElapsed + 1000;
      this.meshDirty = false;

      this.startTracker.update();
      this.endTracker.update();

      // compute path between start and end points
      let path: PathPoint[] = [];

      // add start point which isn't a sweep
      path.push({
        id: '0',
        position: new Vector3().copy(this.inputs.start.position),
        floorPosition: new Vector3().copy(this.inputs.start.position),
      });

      // add a* path from start -> end
      let search = null;
      if (this.startNearestSweep.outputs.sweep && this.endNearestSweep.outputs.sweep) {
        search = (this.context as any).sweepPathModule.findShortestPath(
          this.startNearestSweep.outputs.sweep.id, this.endNearestSweep.outputs.sweep.id, 0.4, 0.8, 40);
      }

      if (search) {
        path.push(...search);
      }

      // add end point which isn't a sweep
      path.push({
        id: '1',
        position: new Vector3().copy(this.inputs.end.position),
        floorPosition: new Vector3().copy(this.inputs.end.position),
      });

      console.log(path);
      this.outputs.path = path || [];

      this.pathState.path.value = path;
      this.pathState.validPath.value = this.outputs.path.length > 1;
      this.pathState.pathLength.value = this.outputs.path.length;
    }
  }
}

export const pathBuilder2Type = 'fly.pathBuilder2';
export const makePathBuilder2 = function(pathState: PathState) {
  return () => new PathBuilder2(pathState);
}

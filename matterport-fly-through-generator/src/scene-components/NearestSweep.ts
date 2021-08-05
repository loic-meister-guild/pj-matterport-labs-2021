import { SceneComponent, ComponentOutput } from '@mp/common/src/SceneComponent';
import { Sweep } from '../interfaces';
import { DirtyTracker } from './DirtyTracker';
import { Vector3 } from 'three';

export type Outputs = {
  sweep: Sweep|null;
} & ComponentOutput;

export class NearestSweep extends SceneComponent {
  private positionDirtyTracker: DirtyTracker<Vector3>|null = null;

  outputs = {
    sweep: null,
  } as Outputs;

  constructor(private sweeps: Sweep[]) {
    super();
  }

  onInit() {
    this.positionDirtyTracker = new DirtyTracker(
      300,
      () => this.context.root.position,
      (a: Vector3, b: Vector3)  => a.equals(b),
      () => new Vector3(),
      (from: Vector3, to: Vector3) => to.copy(from),
    );
  }

   onTick(delta: number) {
     this.positionDirtyTracker.onTick(delta);

     if (this.positionDirtyTracker.dirty) {
       this.positionDirtyTracker.update();

       let nearestSquared = 1000000;
       let nearestSweep: Sweep|null = null;
       for(const sweep of this.sweeps) {
        const distanceSquared = this.context.root.position.distanceToSquared(sweep.position);
        if (distanceSquared < nearestSquared) {
          nearestSquared = distanceSquared;
          nearestSweep = sweep;
        }
       }

       this.outputs.sweep = nearestSweep;
     }
   }
}

export const nearestSweepType = 'fly.nearestSweep';
export const makeNearestSweep = function(sweeps: Sweep[]) {
  return () => new NearestSweep(sweeps);
}

import { SceneComponent, ComponentOutput } from '@mp/common/src/SceneComponent';
import { Mesh, Vector3, Matrix4 } from 'three';
import { DirtyTracker } from './DirtyTracker';
import { PathState } from 'src/interfaces';

type Sweep = {
  floor: number;
  neighbors: string[];
  position: Vector3;
  rotation: Vector3;
  uuid: string;
  id: string;
}

export type PathPoint = {
  position: Vector3;
  id: string;
}
type Inputs = {
  filter: Mesh|null;
};

type Outputs = {
  path: PathPoint[];
} & ComponentOutput;

export class PathBuilder extends SceneComponent {
  private meshDirty: boolean = true;
  private nextValidUpdateTime: number = 0;
  private timeElapsed: number = 0;
  private tmpMatrix4: Matrix4 = new Matrix4();
  private matrixDirtyTracker: DirtyTracker<Matrix4>|null = null;

  constructor(private pathState: PathState, private sweeps: Sweep[]) {
    super();
  }

  inputs: Inputs = {
    filter: null,
  };

  outputs = {
    path: [],
  } as Outputs;

  onInit() {
    this.matrixDirtyTracker = new DirtyTracker<Matrix4>(
      500,
      () => this.inputs.filter.matrixWorld,
      (a: Matrix4, b: Matrix4)  => a.equals(b),
      () => new Matrix4(),
      (from: Matrix4, to: Matrix4) => to.copy(from)
    );
    this.pathState.validPath.value = false;
  }

  onInputsUpdated() {
    this.meshDirty = true;
  }

  onDestroy() {
  }

  onTick(delta: number) {
    this.timeElapsed += delta;
    this.matrixDirtyTracker.onTick(delta);

    if ((this.meshDirty || this.matrixDirtyTracker.dirty) && this.timeElapsed > this.nextValidUpdateTime) {
      const THREE = this.context.three;

      this.nextValidUpdateTime = this.timeElapsed + 1000;
      this.meshDirty = false;
      this.matrixDirtyTracker.update();

      let sweepCandidates: PathPoint[] = [];
      if (this.inputs.filter) {
        this.inputs.filter.geometry.computeBoundingBox();
        this.inputs.filter.updateMatrixWorld(true);

        this.tmpMatrix4.getInverse(this.inputs.filter.matrixWorld);
        console.log(this.tmpMatrix4);

        const inverseBox = this.inputs.filter.clone();
        //inverseBox.applyMatrix4(this.tmpMatrix4);

        const bb = new THREE.Box3().setFromObject(inverseBox);

        // add sweeps that are inside the filter
        const inversePoint = new THREE.Vector3();        
        for (const sweep of this.sweeps) {
          inversePoint.copy(sweep.position);
          inversePoint.applyMatrix4(this.tmpMatrix4);

          if (bb.containsPoint(inversePoint)) {
            console.log(`intersect:`, sweep.position);
            sweepCandidates.push({
              id: sweep.id,
              position: sweep.position,
            });
          }
        }
      }
      else {
        sweepCandidates = this.sweeps.map((sweep: Sweep) => {
          return {
            id: sweep.id,
            position: sweep.position,
          };
        });
      }

      const forwardVector = new Vector3(0,0,-1);
      if (this.inputs.filter) {
        this.inputs.filter.getWorldDirection(forwardVector);
      }

      sweepCandidates.sort((a: PathPoint, b: PathPoint): number => {
        const aDot = forwardVector.dot(a.position);
        const bDot = forwardVector.dot(b.position);
        return (aDot < bDot) ? -1 : ( aDot > bDot ? 1 : 0);
      });

      // compute path between min and max sweep
      let path: PathPoint[];
      if (sweepCandidates.length > 2) {
        path = (this.context as any).sweepPathModule.findShortestPath(
          sweepCandidates[0].id, sweepCandidates[sweepCandidates.length-1].id, 0.4, 0.8, 40);  
      }
      else {
        path = [...sweepCandidates];
      }
      console.log(path);
      this.outputs.path = path || [];

      this.pathState.validPath.value = this.outputs.path.length > 1;
      this.pathState.pathLength.value = this.outputs.path.length;
    }
  }
}

export const pathBuilderType = 'fly.pathBuilder';
export const makePathBuilder = function(pathState: PathState, sweeps: Sweep[]) {
  return () => new PathBuilder(pathState, sweeps);
}

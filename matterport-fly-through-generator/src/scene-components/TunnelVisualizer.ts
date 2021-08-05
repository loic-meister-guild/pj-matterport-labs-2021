import { SceneComponent } from '@mp/common/src/SceneComponent';
import { IDisposable, PathPoint } from '../interfaces';

type Inputs = {
  path: PathPoint[];
};

export class TunnelVisualizer extends SceneComponent {
  private dispose: IDisposable|null = null;
  
  inputs: Inputs = {
    path: [],
  }

  onInit() {
    this.renderPath();
  }

  onInputsUpdated() {
    this.renderPath();
  }

  private renderPath() {

    if (this.dispose) {
      this.dispose.dispose();
      this.dispose = null;
    }

    const THREE = this.context.three;

    if (this.inputs.path.length <= 1) {
      return;
    }

    const points = this.inputs.path.map((pathPoint) => {
      return new THREE.Vector3().set(pathPoint.position.x, pathPoint.position.y, pathPoint.position.z);
    });

    const pipeSpline = new THREE.CatmullRomCurve3(points);
    const tubeGeometry = new THREE.TubeBufferGeometry( pipeSpline, 200, 0.05, 5, false );
    const tubeMaterial = new THREE.MeshStandardMaterial({});
    const mesh = new THREE.Mesh(tubeGeometry, tubeMaterial);

    const linePoints = [];

    const indices = tubeGeometry.index;
    const positions = tubeGeometry.getAttribute('position');
    for (let j=0; j<indices.count; j += 3) {
      const positionIndex = indices.array[j] * 3;
      const x = positions.array[positionIndex];
      const y = positions.array[positionIndex + 1];
      const z = positions.array[positionIndex + 2];
      linePoints.push(x,y,z);
    }

    const lineGeometry = new (THREE as any).LineGeometry();
    lineGeometry.setPositions( linePoints );

    const lineMaterial = new (THREE as any).LineMaterial({
      color: 0xffffff,
      linewidth: 0.002,
      vertexColors: false,
      dashed: true,
      gapSize: 10,
      dashSize: 10,
      opacity: 0.1,
    });
      

    const line = new (THREE as any).Line2( lineGeometry, lineMaterial );
    line.computeLineDistances();
    line.scale.set( 1, 1, 1 );
    this.outputs.objectRoot = mesh;

    this.dispose = {
      dispose:  () => {
        tubeGeometry.dispose();
        lineMaterial.dispose();
      }
    }
  }
}

export const tunnelVisualizerType = 'fly.tunnelVisualizer';
export const makeTunnelVisualizer = function() {
  return () => new TunnelVisualizer();
}

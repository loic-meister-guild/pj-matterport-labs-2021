import { SceneComponent, ComponentOutput, IVector3 } from '@mp/common';
import { TubeBufferGeometry, Vector3, Camera, Mesh, Quaternion } from 'three';

export const DoneEvent = 'done';

const scale = 1;
type Outputs = {
  camera: null | Camera;
} & ComponentOutput;

type Inputs = {
  points: IVector3[];
  duration: number;
};

class SplineCamera extends SceneComponent {
  private tubeGeometry: TubeBufferGeometry;
  private position: Vector3 = new Vector3();
  private binormal: Vector3 = new Vector3();
  private direction: Vector3 = new Vector3();
  private normal: Vector3 = new Vector3();
  private lookAt: Vector3 = new Vector3();
  private camera: Camera;
  private startTime: number;
  private spheres: Mesh[] = [];
  private disposables: {
    dispose: () => void;
  }[] = [];

  inputs: Inputs = {
    points: [],
    duration: 20,
  };

  outputs = {
    camera: null as null | Camera,
  } as Outputs;

  onInit() {
    const THREE = this.context.three;

    this.camera = new this.context.three.PerspectiveCamera();
    const points = this.inputs.points.map((point) => {
      return new THREE.Vector3().set(point.x, point.y, point.z);
    });

    const pipeSpline = new THREE.CatmullRomCurve3(points, false, 'chordal');
    this.tubeGeometry = new THREE.TubeBufferGeometry( pipeSpline, 100, 0.1, 5, true );
    const material = new THREE.MeshLambertMaterial( { color: 0x008800, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.3 } );
    const wireframeMaterial = new THREE.MeshBasicMaterial( { color: 0x004400, opacity: 0.4, wireframe: true, transparent: true } );
    const mesh = new THREE.Mesh( this.tubeGeometry, material );
    const wireframe = new THREE.Mesh( this.tubeGeometry, wireframeMaterial );
    mesh.add( wireframe );
    mesh.scale.set( scale, scale, scale );
    
    // this.outputs.objectRoot = mesh;
    this.outputs.camera = this.camera;
    this.startTime = Date.now();

    for (const point of points) {
      const geometry = new THREE.SphereGeometry( 0.05, 16, 16 );
      const material = new THREE.MeshBasicMaterial( {color: 0x0000bb } );
      const sphere = new THREE.Mesh( geometry, material );
      sphere.position.copy(point);
      this.spheres.push(sphere);
      mesh.add(sphere);
      
      this.disposables.push(geometry);
      this.disposables.push(material);
    }

    this.disposables.push(this.tubeGeometry);
    this.disposables.push(material);
    this.disposables.push(wireframeMaterial);
  }

  onTick() {
    const time = Date.now() - this.startTime;
    const looptime = this.inputs.duration * 1000;
    const t = ( time % looptime ) / looptime;

    this.tubeGeometry.parameters.path.getPointAt( t, this.position);
    this.position.multiplyScalar(scale);

    const segments = this.tubeGeometry.tangents.length;
    const pickt = t * segments;
    var pick = Math.floor( pickt );
    var pickNext = ( pick + 1 ) % segments;

    this.binormal.subVectors( this.tubeGeometry.binormals[ pickNext ], this.tubeGeometry.binormals[ pick ] );
    this.binormal.multiplyScalar( pickt - pick ).add( this.tubeGeometry.binormals[ pick ] );

    this.direction.copy(this.tubeGeometry.parameters.path.getTangentAt( t ));
    var offset = 0;

    this.normal.copy( this.binormal ).cross( this.direction ).negate();
    this.normal.set(0,1,0);

    this.position.add( this.normal.clone().multiplyScalar( offset ) );

    this.camera.position.copy(this.position);

    let nextIndex = t + 1 / this.tubeGeometry.parameters.path.getLength();
    if (nextIndex > 1) {
      nextIndex = 1;
    }

    this.tubeGeometry.parameters.path.getPointAt( nextIndex, this.lookAt );
		this.lookAt.multiplyScalar( scale );

    const preQuat = new Quaternion().setFromRotationMatrix(this.camera.matrix);

    this.camera.matrix.lookAt( this.camera.position, this.lookAt, this.normal );
    const postQuat = new Quaternion().setFromRotationMatrix(this.camera.matrix);
    preQuat.slerp(postQuat, 0.5);
    this.camera.quaternion.copy(preQuat);

    if (time > this.inputs.duration * 1000) {
      this.notify(DoneEvent);
      this.context.root.stop();
    }
  }

  onDestroy() {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.tubeGeometry = null;
  }
}

export const makeSplineCamera = () => {
  return new SplineCamera();
};

export const splineCameraType = 'fly.splineCamera';
import { SceneComponent, ComponentOutput, ISceneNode } from '@mp/common/src/SceneComponent';
import { Matrix4, Object3D } from 'three';
import { EditMode, BoxTransformState } from 'src/interfaces';
import { Dict } from '@mp/core';
import { pathBuilderType, PathPoint } from './PathBuilder';
import { pathVisualizerType } from './PathVisualizer';
import { gripType } from './Grip';
import { ObservableProxy } from '@mp/core/src/observable/ObservableProxy';
import { DirtyTracker } from './DirtyTracker';

type Inputs = {
  mode: EditMode;
};

type Outputs = {
  path: PathPoint[];
} & ComponentOutput;

const applyToInput = (inputs: Dict<any>, mode: EditMode) => {
  inputs.mode = mode;
  if (mode === 'rotate') {
    inputs.showX = true;
    inputs.showY = true;
    inputs.showZ = true;
    inputs.size = 1;
  }
  else if (mode === 'scale') {
    inputs.showX = true;
    inputs.showY = true;
    inputs.showZ = true;
    inputs.size = 1;
  }
  else if (mode === 'translate') {
    inputs.showX = true;
    inputs.showY = false;
    inputs.showZ = true;
    inputs.size = 1;
  }
};

export class AxisControl extends SceneComponent {
  private transformNode: ISceneNode|null = null;
  private pathBuilderNode: ISceneNode|null = null;
  private boxFilterNode: ISceneNode|null = null;
  private transformComponent: SceneComponent|null = null;
  private matrixDirtyTracker: DirtyTracker<Matrix4>|null = null;

  constructor(private sdk: any, private boxTransformState: BoxTransformState){
    super();
    this.onPathUpdated =this.onPathUpdated.bind(this);
  }

  inputs: Inputs = {
    mode: 'translate',
  }

  outputs = {
    path: [],
  } as Outputs;
  
  onInit() {
    this.setupNodes();
  }

  private async setupNodes() {
    [this.boxFilterNode, this.pathBuilderNode, this.transformNode] = await Promise.all([
      this.sdk.Scene.createNode(),
      this.sdk.Scene.createNode(),
      this.sdk.Scene.createNode(),
    ]);
    
    // setup box filter node
    const filterComponent = this.boxFilterNode.addComponent(gripType);
    this.boxFilterNode.position.copy(this.boxTransformState.position.value);
    this.boxFilterNode.quaternion.copy(this.boxTransformState.rotation.value);
    this.boxFilterNode.scale.copy(this.boxTransformState.scale.value);
    
    // setup transform node
    const transformInputs: Dict<any> = {
      selection: this.boxFilterNode,
    };
    applyToInput(transformInputs, this.inputs.mode);

    this.transformComponent = this.transformNode.addComponent('mp.transformControls', transformInputs);

    // setup path builder+visualizer
    const pathBuilder = this.pathBuilderNode.addComponent(pathBuilderType);
    const pathVisualizer = this.pathBuilderNode.addComponent(pathVisualizerType);
    pathBuilder.bind('filter', filterComponent, 'objectRoot');
    pathVisualizer.bind('path', pathBuilder, 'path');

    const obs = (pathBuilder.outputs as Dict<any>) as ObservableProxy<Dict<any>>;
    obs.onPropertyChanged('path', this.onPathUpdated);

    // start the nodes
    this.boxFilterNode.start() ;
    this.transformNode.start();
    this.pathBuilderNode.start();

    const boxObj3D = (this.boxFilterNode as any).obj3D as Object3D;
    this.matrixDirtyTracker = new DirtyTracker<Matrix4>(
      500,
      () => boxObj3D.matrixWorld,
      (a: Matrix4, b: Matrix4)  => a.equals(b),
      () => new Matrix4(),
      (from: Matrix4, to: Matrix4) => to.copy(from)
    );
  }

  onInputsUpdated() {
    applyToInput(this.transformComponent.inputs, this.inputs.mode);
  }

  onTick(delta: number) {
    if (this.matrixDirtyTracker) {
      this.matrixDirtyTracker.onTick(delta);

      if (this.matrixDirtyTracker.dirty) {
        const boxObj3D = (this.boxFilterNode as any).obj3D as Object3D;
        this.boxTransformState.position.value = boxObj3D.position;
        this.boxTransformState.rotation.value = boxObj3D.quaternion;
        this.boxTransformState.scale.value = boxObj3D.scale;
        this.matrixDirtyTracker.update();
      }
    }
  }

  private onPathUpdated(path: PathPoint[]) {
    this.outputs.path = path;
  }

  onDestroy() {
    if (this.transformNode) {
      this.transformNode.stop();
      this.transformNode = null;
    }

    if (this.pathBuilderNode) {
      this.pathBuilderNode.stop();
      this.pathBuilderNode = null;
    }

    if (this.boxFilterNode) {
      this.boxFilterNode.stop();
      this.boxFilterNode = null;
    }
  }
}

export const axisControlType = 'fly.axisControl';
/**
 * 
 * @param sdk sdk interface object
 * @param boxTransformState box transform, this component is expected to update the boxState.
 */
export const makeAxisControl = function(sdk: any, boxTransformState: BoxTransformState) {
  return () => new AxisControl(sdk, boxTransformState);
}

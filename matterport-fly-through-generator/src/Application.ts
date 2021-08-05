import { Interpreter } from 'xstate';
import { FSMSchema, FSMEvent, makeAppFSM } from './AppFSM';
import { SdkService } from './SdkService';
import { ISceneNode, SceneComponent, ComponentInteractionType, IVector3, IComponentEventSpy, ClickEvent, HoverEvent } from '@mp/common';
import { Dict, ObservableValue } from '@mp/core';
import { EditState, Sweep, AppState, IDisposable } from './interfaces';
import { cameraInputType, CameraInputEvent, makeCameraInput } from '@mp/common/src/sdk-components/Camera';
import { Matrix4, Vector3, Quaternion, Box3, Plane, Ray, Object3D } from 'three';
import { axisControlType, makeAxisControl } from './scene-components/AxisControl';
import { gripType, makeGrip } from './scene-components/Grip';
import { pathBuilderType, makePathBuilder, PathPoint } from './scene-components/PathBuilder';
import { pathVisualizerType, makePathVisualizer } from './scene-components/PathVisualizer';
import { splineCameraType, makeSplineCamera, DoneEvent } from './scene-components/SplineCamera';
import { sphereType, makeSphere } from './scene-components/Sphere';
import { nearestSweepType, makeNearestSweep } from './scene-components/NearestSweep';
import { pathBuilder2Type, makePathBuilder2 } from './scene-components/PathBuilder2';
import { makeGrid, gridType } from './scene-components/Grid';
import { highlightPointType, makeHightlightPoint } from './scene-components/HighlightPoint';
import { makeTunnelVisualizer, tunnelVisualizerType } from './scene-components/TunnelVisualizer';
import { makeSweepVisualizer, sweepVisualizerType } from './scene-components/SweepVisualizer';
import { makeAppSerializer } from './AppSerializer';
import { App } from '@mp/save';
import { makeSceneNodeObserver, sceneNodeObserverType } from './scene-components/SceneNodeObserver';
import { ObservableProxy } from '@mp/core/src/observable/ObservableProxy';

export const delay = function(time: number): Promise<any> {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, time);
  });
};

const maxHalfSize = 10.0;
const maxBounds = new Box3(new Vector3(-maxHalfSize, -maxHalfSize, -maxHalfSize), new Vector3(maxHalfSize, maxHalfSize, maxHalfSize));

export const waitUntil = async (condition: () => boolean) => {
  return new Promise(function (resolve, reject) {
    let intervalId: number;
    const checkCondition = () => {
      if (condition()) {
        clearInterval(intervalId);
        resolve();
      }
    };
    intervalId = window.setInterval(checkCondition, 30);
  });
};

export class Application {
  constructor(private applicationKey: string) {
    this.fsm = makeAppFSM(
      this.onEnterIdle,
      this.onEnterInitializing,
      this.onEnterEditing,
      this.onExitEditing,
      this.onEnterPreviewing,
      this.onExitPreviewing
    );
  }

  public fsm: Interpreter<unknown, FSMSchema, FSMEvent> = null;
  private sdkService: SdkService = new SdkService('sdk-iframe');
  public editState: EditState = {
    transformMode: new ObservableValue('translate'),
    focus: new ObservableValue(new Vector3()),
    focusTarget: new ObservableValue(null),
    hoverTarget: new ObservableValue(null),
    boxTransform: {
      position: new ObservableValue(new Vector3()),
      rotation: new ObservableValue(new Quaternion()),
      scale: new ObservableValue(new Vector3()),
    },
    startPos: new ObservableValue(new Vector3()),
    endPos: new ObservableValue(new Vector3()),
    pathState: {
      path: new ObservableValue([]),
      pathLength: new ObservableValue(0),
      validPath: new ObservableValue(false),
    },
    visualizerState: {
      duration: new ObservableValue(10),
    }
  };

  private animator: ISceneNode | null = null;
  private editSceneDisposable: IDisposable|null = null;
  private floorCount: number = 1;
  private gridComponent: SceneComponent|null = null;
  private modelBounds: Box3 = new Box3();
  private onEnterIdle = async () => {};
  private sweeps: Sweep[] = [];
  private cameraInput: SceneComponent|null = null;

  private onEnterInitializing = async () => {
    this.sdkService.start(this.applicationKey);

    // ensure access to sdk interface
    if (!this.sdkService.interface) {
      await waitUntil(() => this.sdkService.interface);
    }

    const iframeElement = document.getElementById('sdk-iframe') as HTMLIFrameElement;    
    const stylesheet = document.createElement("link");
    stylesheet.rel = 'stylesheet';
    stylesheet.type = 'text/css';
    stylesheet.href = '../assets/showcase.css';
    iframeElement.contentDocument.getElementsByTagName('head')[0].appendChild(stylesheet)

    const sdk = this.sdkService.interface;
    await sdk.App.state.waitUntil((appState: AppState) => {
      return appState.phase === sdk.App.Phase.PLAYING;
    });

    const serializer = makeAppSerializer(this.editState, () => this.fsm.send('INITIALIZE_EDITING'));

    const takeScreenshot = async (width: number, height: number) => {
      return await sdk.Renderer.takeScreenShot({
        width: 256,
        height: 256,
      });
    };

    new App.AppSaver(window.parent, serializer, takeScreenshot);

    const sub = sdk.Sweep.data.subscribe({
      onAdded: (index: number, sweep: Sweep, collection: Sweep[]) => {
        if (sweep.alignmentType === 'aligned') {
          sweep.id = sweep.uuid;
          this.sweeps.push(sweep);
        }
      },
    });

    this.floorCount = (await sdk.Floor.getData()).totalFloors;
    await delay(60);
    sub.cancel();

    // register components
    await sdk.Scene.registerComponents([
      { name: cameraInputType, factory: makeCameraInput },
      { name: axisControlType, factory: makeAxisControl(sdk, this.editState.boxTransform) },
      { name: gripType, factory: makeGrip() },
      { name: pathBuilderType, factory: makePathBuilder(this.editState.pathState, this.sweeps) },
      { name: pathVisualizerType, factory: makePathVisualizer() },
      { name: splineCameraType, factory: makeSplineCamera },
      { name: sphereType, factory: makeSphere() },
      { name: nearestSweepType, factory: makeNearestSweep(this.sweeps) },
      { name: pathBuilder2Type, factory: makePathBuilder2(this.editState.pathState) },
      { name: gridType, factory: makeGrid() },
      { name: highlightPointType, factory: makeHightlightPoint() },
      { name: tunnelVisualizerType, factory: makeTunnelVisualizer() },
      { name: sweepVisualizerType, factory: makeSweepVisualizer() },
      { name: sceneNodeObserverType, factory: makeSceneNodeObserver() },
    ])

    const model = await sdk.Scene.query(['model']);
    this.modelBounds.expandByObject(model[0]);

    const environment = await sdk.Scene.createNode() as ISceneNode;
    this.gridComponent = environment.addComponent(gridType);
    environment.start();

    this.cameraInput = await createCameraControl(sdk, this.editState, this.sweeps[0].position, this.modelBounds);

    this.editState.transformMode.value = 'translate';

    // initialize start/end position
    const center = new Vector3();
    this.modelBounds.getCenter(center);
    this.editState.startPos.value.set(this.modelBounds.max.x, center.y, center.z);
    this.editState.endPos.value.set(this.modelBounds.min.x, center.y, center.z);

    this.fsm.send('EDITING_READY');
  };

  private onEnterEditing = async () => {
    const sdk = this.sdkService.interface;

    this.cameraInput.inputs.showFocusAxis = true;

    this.gridComponent.inputs.bloomThreshold = 0.75;
    this.gridComponent.inputs.bloomStrength = 0.4;
    this.gridComponent.inputs.bloomRadius = 0.8;

    const floorUpdates: Promise<void>[] = [];
    for (let i=0; i<this.floorCount; i++) {
      floorUpdates.push(sdk.Floor.setVisibility(i, 0.25));
    }

    await Promise.all(floorUpdates);
    this.editSceneDisposable = await createEditScene(sdk, this.editState, this.modelBounds, this.sweeps);
  };

  private onExitEditing = async () => {
    this.editSceneDisposable.dispose();
    this.editSceneDisposable = null;
  };

  private onEnterPreviewing = async () => {
    const sdk = this.sdkService.interface;

    this.cameraInput.inputs.showFocusAxis = false;

    this.gridComponent.inputs.bloomThreshold = 0.8;
    this.gridComponent.inputs.bloomStrength = 0.2;
    this.gridComponent.inputs.bloomRadius = 1.5;


    const floorUpdates: Promise<void>[] = [];
    for (let i=0; i<this.floorCount; i++) {
      floorUpdates.push(sdk.Floor.setVisibility(i, 1.0));
    }

    await Promise.all(floorUpdates);
    const animatorPoints = this.editState.pathState.path.value.map((point: PathPoint) => {
      return {
        x: point.position.x,
        y: point.position.y,
        z: point.position.z,
      } as IVector3;
    });

    this.animator = await this.sdkService.interface.Scene.createNode();

    const tmpVector = new Vector3();
    let totalDistance = 0;
    animatorPoints.forEach((point: IVector3, index: number) => {
      if (index > 0) {
        const lastPoint = animatorPoints[index-1];
        tmpVector.set(point.x - lastPoint.x, point.y - lastPoint.y, point.z - lastPoint.z);
        totalDistance += tmpVector.length();
      }
    });

    const duration = totalDistance / this.editState.visualizerState.duration.value;
    const splineCamera = this.animator.addComponent(splineCameraType, {
      points: animatorPoints,
      duration: duration,
    });
    console.log(`duration:${duration} distance${totalDistance} speed:${this.editState.visualizerState.duration.value}`);
    const cameraControl = this.animator.addComponent('mp.camera', {
      enabled: true,
    }) as SceneComponent;
    cameraControl.bind('camera', splineCamera, 'camera');
    this.animator.start();

    class DoneSpy implements IComponentEventSpy<void> {
      public eventType = DoneEvent;
      constructor(private fsm: Interpreter<unknown, FSMSchema, FSMEvent>) {}
      onEvent() {
        this.fsm.send('INITIALIZE_EDITING');
      }
    }

    splineCamera.spyOnEvent(new DoneSpy(this.fsm));
  };

  private onExitPreviewing = async () => {
    this.animator.stop();
    this.animator = null;
  };
}


const createCameraControl = async (theSdk: any, editState: EditState, position: Vector3, modelBounds: Box3) => {
  const cameraNode = await theSdk.Scene.createNode();
  const cameraPose = await theSdk.Camera.getPose();
  const cameraInput = cameraNode.addComponent(cameraInputType) as SceneComponent;

  const poseMatrix = new Matrix4();
  poseMatrix.fromArray(cameraPose.projection);
  const fovY = 2 * Math.atan(1 / poseMatrix.elements[5]);
  const aspect = poseMatrix.elements[5] / poseMatrix.elements[0];

  const min = new Vector3(Math.max(maxBounds.min.x, modelBounds.min.x), Math.max(maxBounds.min.y, modelBounds.min.y), Math.max(maxBounds.min.z, modelBounds.min.z));
  const max = new Vector3(Math.min(maxBounds.max.x, modelBounds.max.x), Math.min(maxBounds.max.y, modelBounds.max.y), Math.min(maxBounds.max.z, modelBounds.max.z));
  const bounds = new Box3(min, max);
  const pose = fitBox(new Vector3(),
    new Quaternion(),
    -Math.PI / 4,
    bounds,
    fovY,
    aspect);

  cameraInput.inputs.startPose = {
    position: pose.position,
    quaternion: pose.rotation,
    projection: poseMatrix,
  };
  const cameraControl = cameraNode.addComponent('mp.camera', {
    enabled: true,
  }) as SceneComponent;
  cameraControl.bind('camera', cameraInput, 'camera');
  const input = cameraNode.addComponent('mp.input', {
    userNavigationEnabled: false,
    unfiltered: false,
  }) as SceneComponent;
  cameraInput.bindEvent(CameraInputEvent.DragBegin, input, ComponentInteractionType.DRAG_BEGIN);
  cameraInput.bindEvent(CameraInputEvent.Drag, input, ComponentInteractionType.DRAG);
  cameraInput.bindEvent(CameraInputEvent.DragEnd, input, ComponentInteractionType.DRAG_END);
  cameraInput.bindEvent(CameraInputEvent.Key, input, ComponentInteractionType.KEY);
  cameraInput.bindEvent(CameraInputEvent.Scroll, input, ComponentInteractionType.SCROLL);
  cameraNode.start();

  const center = new Vector3();
  modelBounds.getCenter(center);

  editState.focusTarget.onChanged((focusTarget: Object3D) => {
    if (focusTarget) {
      const pos = new Vector3();
      focusTarget.getWorldPosition(pos);
      cameraInput.inputs.focus = pos;
    }
  });

  editState.focus.value = new Vector3().set(center.x, 0, center.z);
  cameraInput.inputs.focus = new Vector3().set(center.x, 0, center.z);

  return cameraInput;
}

const createObserverNodes = async(sdk: any, startNode: ISceneNode, endNode: ISceneNode) => {
  const node = await sdk.Scene.createNode() as ISceneNode;
  const startObserverComponent = node.addComponent(sceneNodeObserverType, {
    node: startNode,
  }) as SceneComponent;
  const endObserverComponent = node.addComponent(sceneNodeObserverType, {
    node: endNode,
  }) as SceneComponent;

  node.start();

  return {
    observerNode: node,
    startComponent: startObserverComponent,
    endComponent: endObserverComponent,
  };
};

const createEditScene = async (sdk: any, editState: EditState, modelBounds: Box3, sweeps: Sweep[]): Promise<IDisposable> => {
  const startInfo = await createPathEndpoint(sdk, editState.startPos.value);
  const endInfo = await createPathEndpoint(sdk, editState.endPos.value);
  const builderInfo = await createPathBuilder(sdk, startInfo.proximityNode, endInfo.proximityNode, editState, sweeps);

  const lights = await sdk.Scene.createNode() as ISceneNode;
  lights.addComponent('mp.lights');
  lights.start();

  const highlightNode = await sdk.Scene.createNode() as ISceneNode;
  const highlightComponent = highlightNode.addComponent(highlightPointType, {
    radius: 0.1,
  });
  highlightNode.start();

  editState.hoverTarget.onChanged((hover: Object3D) => {
    highlightComponent.inputs.target = hover;
  });

  // observe start and end scene nodes, reflect changes in edit state
  const observerInfo = await createObserverNodes(sdk, startInfo.proximityNode, endInfo.proximityNode);
  const startOutputs = observerInfo.startComponent.outputs as unknown as ObservableProxy<Dict<any>>;
  startOutputs.onPropertyChanged('position', (value: Vector3) => {
    editState.startPos.value = value;
  });

  const endOutputs = observerInfo.endComponent.outputs as unknown as ObservableProxy<Dict<any>>;
  endOutputs.onPropertyChanged('position', (value: Vector3) => {
    editState.endPos.value = value;
  });

  return {
    dispose: () => {
      lights.stop();
      builderInfo.builderNode.stop();
      startInfo.transformNode.stop();
      startInfo.proximityNode.stop();
      endInfo.transformNode.stop();
      endInfo.proximityNode.stop();
      highlightNode.stop();
      observerInfo.observerNode.stop();
    }
  }
};

const createPathBuilder = async (sdk: any, startNode: ISceneNode, endNode: ISceneNode, editState: EditState, sweeps: Sweep[]) => {
  const node = await sdk.Scene.createNode() as ISceneNode;
  const pathBuilder = node.addComponent(pathBuilder2Type, {
    start: startNode,
    end: endNode,
  });
  const pathVisualizer = node.addComponent(pathVisualizerType) as SceneComponent;
  pathVisualizer.bind('path', pathBuilder, 'path');

  class ClickSpy implements IComponentEventSpy<ClickEvent> {
    public eventType = ComponentInteractionType.CLICK;
    constructor(private editState: EditState) {}

    onEvent(event: ClickEvent) {
      const worldPos = new Vector3();
      event.collider.getWorldPosition(worldPos);
      this.editState.focusTarget.value = event.collider;
    }
  }

  class HoverSpy implements IComponentEventSpy<HoverEvent> {
    public eventType = ComponentInteractionType.HOVER;
    constructor(private editState: EditState) {}

    onEvent(event: HoverEvent) {
      if (event.hover) {
        this.editState.hoverTarget.value = event.collider;
      }
      else {
        this.editState.hoverTarget.value = null;
      }
    }
  }

  pathVisualizer.spyOnEvent(new ClickSpy(editState));
  pathVisualizer.spyOnEvent(new HoverSpy(editState));

  const tunnelVisualizer = node.addComponent(tunnelVisualizerType);
  tunnelVisualizer.bind('path', pathBuilder, 'path');

  const sweepVisualizer = node.addComponent(sweepVisualizerType);
  sweepVisualizer.bind('path', pathBuilder, 'path');

  node.start();

  return {
    builderNode: node,
    builderComponent: pathBuilder,
  };
};

const createPathEndpoint = async (sdk: any, position: Vector3) => {
  const [ proximitySphereNode, transformControlNode ] = await Promise.all([
    sdk.Scene.createNode() as ISceneNode,
    sdk.Scene.createNode() as ISceneNode,  
  ]);

  proximitySphereNode.addComponent(sphereType, {
    radius: 0.25,
  });
  const nearestSweepComponent = proximitySphereNode.addComponent(nearestSweepType);
  proximitySphereNode.position.copy(position);

  transformControlNode.addComponent('mp.transformControls', {
    selection: proximitySphereNode,
    mode: 'translate',
    size: 0.5,
  });
  proximitySphereNode.start();
  transformControlNode.start();

  return {
    proximityNode: proximitySphereNode,
    transformNode: transformControlNode,
    nearestSweepComponent,
  }
};


/**
 * Returns orientation from camera to lookAtPoint
 *
 * @param {Vector3} cameraPosition
 * @param {Vector3} targetPosition
 * @returns {Quaternion}
 *
 */
export const getOrientationToPoint = (() => {
  const targetViewMatrix = new Matrix4();
  const up = new Vector3(0, 1, 0);

  return (cameraPosition: Vector3, targetPosition: Vector3) => {
    targetViewMatrix.setPosition(cameraPosition);
    targetViewMatrix.lookAt(cameraPosition, targetPosition, up);
    return new Quaternion().setFromRotationMatrix(targetViewMatrix);
  };
})();

/**
 * Returns a pose that fits a box on the screen
 *
 * @param {Vector3} targetPosition
 * @param {Quaternion} rotation
 * @param {number} angleDown
 * @param {Box3} object
 * @param {number} fovY
 * @returns {position: Vector3, rotation: Quaternion}
 *
 */
export const fitBox = (() => {
  const direction = new Vector3();
  const zAxis = new Vector3();
  const yAxis = new Vector3();
  const xAxis = new Vector3();
  const corners = [new Vector3(), new Vector3(), new Vector3(), new Vector3(),
                  new Vector3(), new Vector3(), new Vector3(), new Vector3()];

  const closestCorner = new Vector3();
  const currentCorner = new Vector3();
  const lowTargetPosition = new Vector3();
  const intersectingCorner = new Vector3();

  const wallPlane = new Plane();
  const wallNormal = new Vector3();
  const backwardsRay = new Ray();
  const negativeZAxis = new Vector3();
  const intersectionPoint = new Vector3();
  
  const up = new Vector3(0, 1, 0);
  const forward = new Vector3(0, 0, -1);

  return (targetPosition: Vector3, targetRotation: Quaternion, angleDown: number, box: Box3, fovY: number, aspectRatio: number) => {

    // Set up the axes relative to the camera
    direction.copy(forward).applyQuaternion(targetRotation).setY(0);
    zAxis.copy(direction).setY(angleDown).normalize();
    xAxis.copy(zAxis).applyAxisAngle(up, -Math.PI / 2).setY(0).normalize();
    yAxis.copy(xAxis).cross(zAxis).normalize();

    // Array of all 8 corners of the bounding box
    let cornerIndex = 0;
    const max = box.max;
    const min = box.min;
    const extremes: Vector3[] = [max, min];
    for (let i = 0; i < 2; i++) {
      const xVal = extremes[i].x;
      for (let j = 0; j < 2; j++){
        const yVal = extremes[j].y;
        for (let k = 0; k < 2; k++){
          const zVal = extremes[k].z;
          corners[cornerIndex].set(xVal, yVal, zVal);
          cornerIndex++;
        }
      }
    }

    // Corner that would be closest to the camera is most negative projection on camera's z-axis
    closestCorner.copy(min);
    lowTargetPosition.copy(targetPosition).setY(min.y);
    let distanceToClosestCorner: number = currentCorner.copy(closestCorner).sub(lowTargetPosition).dot(zAxis);
    corners.forEach((corner: Vector3) => {
      if (corner.y === max.y) return;
      const distanceToCorner = currentCorner.copy(corner).sub(lowTargetPosition).dot(zAxis);
      if (distanceToCorner < distanceToClosestCorner){
        closestCorner.copy(corner);
        distanceToClosestCorner = distanceToCorner;
      }
    });

    // Use closest point to find the plane that intersects with the camera's forward ray
    const horizontalDirection: number = Math.sign(closestCorner.dot(xAxis));
    intersectingCorner.copy(closestCorner).setX(closestCorner.x === max.x ? min.x : max.x);
    if (Math.sign(intersectingCorner.dot(xAxis)) !== horizontalDirection){
      wallPlane.set(wallNormal.set(0, 0, -1 * Math.sign(closestCorner.z)), Math.abs(closestCorner.z));
    }
    else {
      intersectingCorner.copy(closestCorner).setZ(closestCorner.z === max.z ? min.z : max.z);
      wallPlane.set(wallNormal.set(-1 * Math.sign(closestCorner.x), 0, 0), Math.abs(closestCorner.x));
    }
    backwardsRay.set(targetPosition, negativeZAxis.copy(zAxis).multiplyScalar(-1));
    backwardsRay.intersectPlane(wallPlane, intersectionPoint);
    const depth = Math.min(Math.abs(intersectionPoint && intersectionPoint.dot(zAxis)), distanceToClosestCorner);

    // Then, find the largest projection on the camera's local y-axis or x-axis
    let halfWidth = 0;
    let halfHeight = 0;
    corners.forEach(function(corner: Vector3) {
      currentCorner.copy(corner).sub(targetPosition);
      const dotx = Math.abs(currentCorner.dot(xAxis));
      const doty = Math.abs(currentCorner.dot(yAxis));
      if (dotx > halfWidth) {
        halfWidth = dotx;
      }
      if (doty > halfHeight){
        halfHeight = doty;
      }
    });

    // calculate the minimum distance needed to fit the entire model
    const distanceX = halfWidth / Math.tan(fovY * aspectRatio / 2);
    const distanceY = halfHeight / Math.tan(fovY / 2);
    const maxDimensionLength = Math.max(distanceX, distanceY);
    const distance = maxDimensionLength + Math.abs(depth);

    const position = targetPosition.clone().add(zAxis.clone().multiplyScalar(-distance * 1.1));
    const rotation = getOrientationToPoint(position, targetPosition);
    const pose = {
      position,
      rotation,
    };
    return pose;
  };
})();
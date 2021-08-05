import { IComponentEventSpy, ISceneNode, ISubscription, SceneComponent } from '@mp/common';
import { Events, smoothTranslationType } from '../scene-components/SmoothTranslation';
import THREE, { Box3, PerspectiveCamera, Sphere, Vector3 } from 'three';
import { ICommand, ICommandFactory, IRoom } from '../interfaces';
import { waitUntil } from '../util';

const SmoothDuration = 500;

class OnStoppedSpy implements IComponentEventSpy<any> {
  public eventType = Events.OnStopped;
  constructor(private callback: () => void) {}
  public onEvent(eventData: any) {
    this.callback();
  }
}

class MoveCameraCommand implements ICommand<void, IRoom|null> {
  private translationNode: ISceneNode;
  private positionSmooth: SceneComponent;
  private focusDistanceSmooth: SceneComponent;
  private subs: ISubscription[] = [];
  private animationComplete = false;
  private tmp: Vector3;

  constructor(private sdk: any, private cameraInput: SceneComponent, private modelBounds: Box3, private threeModule: typeof THREE) {
    this.onAnimationComplete = this.onAnimationComplete.bind(this);
  }

  public async execute(room: IRoom|null): Promise<void> {
    this.tmp = new Vector3();
    this.translationNode = await this.sdk.Scene.createNode();
    this.positionSmooth = this.translationNode.addComponent(smoothTranslationType, {
      duration: SmoothDuration,
    });
    this.focusDistanceSmooth = this.translationNode.addComponent(smoothTranslationType, {
      duration: SmoothDuration,
    });
    this.translationNode.start();

    this.subs.push(this.focusDistanceSmooth.outputs.onPropertyChanged('position',  (position: { x: number, y: number, z: number }) => {
      this.cameraInput.outputs.camera.position.copy(position);
      this.cameraInput.outputs.camera.matrixWorldNeedsUpdate = true;
    }));
    
    this.subs.push(this.positionSmooth.outputs.onPropertyChanged('position',  (position: { x: number, y: number, z: number }) => {
      this.tmp.set(position.x, position.y, position.z);
      this.cameraInput.inputs.focus.x = this.tmp.x;
      this.cameraInput.inputs.focus.y = this.tmp.y;
      this.cameraInput.inputs.focus.z = this.tmp.z;
      this.cameraInput.outputs.camera.parent.position.copy(this.tmp);
      this.cameraInput.outputs.camera.matrixWorldNeedsUpdate = true;
    }));
    
    this.subs.push(this.positionSmooth.spyOnEvent(new OnStoppedSpy(this.onAnimationComplete)));

    let center = new this.threeModule.Vector3();
    let radius;
    if (room) {
      room.bbox.getCenter(center);
      radius = room.radius;
    }
    else {
      const sphere = new Sphere();
      this.modelBounds.getBoundingSphere(sphere);
      radius = sphere.radius;
      center.copy(sphere.center);
    }

    // setup smooth targets
    this.positionSmooth.inputs.target = {
      x: center.x,
      y: center.y,
      z: center.z,
    };

    this.focusDistanceSmooth.inputs.target = {
      x: 0,
      y: 0,
      z: radius * 1.5,
    };

    // trigger smooth translation
    const camera = this.cameraInput.outputs.camera as PerspectiveCamera;
    const cameraWorldPos = new Vector3();
    camera.parent.getWorldPosition(cameraWorldPos);
    
    this.positionSmooth.onEvent(Events.Start, {
      position: this.cameraInput.inputs.focus,
    });
    this.focusDistanceSmooth.onEvent(Events.Start, {
      position: camera.position,
    });

    await waitUntil(() => this.animationComplete === true);

    this.translationNode.stop();
    this.subs.forEach((sub: ISubscription) => sub.cancel());
    this.subs = [];
  }

  private onAnimationComplete() {
    this.animationComplete = true;
  }
}

class Factory implements ICommandFactory<void, IRoom|null> {
  constructor(private sdk: any, private cameraInput: SceneComponent, private modelBounds: Box3, private threeModule: typeof THREE) {}
  create() {
    return new MoveCameraCommand(this.sdk, this.cameraInput, this.modelBounds, this.threeModule);
  }
}

export const makeMoveCameraCommandFactory = function(sdk: any, cameraInput: SceneComponent, modelBounds: Box3, threeModule: typeof THREE): ICommandFactory<void, IRoom|null> {
  return new Factory(sdk, cameraInput, modelBounds, threeModule);
};

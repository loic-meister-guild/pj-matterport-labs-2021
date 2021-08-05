import { ComponentInteractionType, IComponentEventSpy, ISceneNode, ISubscription, PointerButton, SceneComponent } from '@mp/common';
import { ObservableValue } from '@mp/core';
import THREE, { Vector3 } from 'three';
import { IDisposable, IRoom } from './interfaces';
import { Events, smoothTranslationType } from './scene-components/SmoothTranslation';
import EventEmitter from 'eventemitter3';

const SmoothDuration = 500;

export enum ClickEvent {
  Primary = 'Primary',
  Secondary = 'Secondary',
}

class OnCompleteSpy implements IComponentEventSpy<any> {
  public eventType = Events.OnStopped;
  constructor(private clickSpy: SelectingClickSpy) {}
  public onEvent(eventData: any) {
    this.clickSpy.events.emit(ClickEvent.Secondary);
  }
}

export class SelectingClickSpy implements IComponentEventSpy<any>, IDisposable {
  public eventType = ComponentInteractionType.CLICK;
  private translationNode: ISceneNode;
  private positionSmooth: SceneComponent;
  private focusDistanceSmooth: SceneComponent;
  private subs: ISubscription[] = [];
  private tmp: Vector3;
  public events: EventEmitter<ClickEvent>;
  
  constructor(private clickedRoom: IRoom,
              private roomSelection: ObservableValue<IRoom>,
              private cameraInput: SceneComponent,
              threeModule: typeof THREE,
              nodePool: ISceneNode[],
  ) {
    this.events = new EventEmitter();
    this.tmp = new threeModule.Vector3();
    this.translationNode = nodePool.pop();
    this.positionSmooth = this.translationNode.addComponent(smoothTranslationType, {
      duration: SmoothDuration,
    });
    this.focusDistanceSmooth = this.translationNode.addComponent(smoothTranslationType, {
      duration: SmoothDuration,
    });
    this.translationNode.start();

    this.subs.push(this.positionSmooth.outputs.onPropertyChanged('position',  (position: { x: number, y: number, z: number }) => {
      this.tmp.set(position.x, position.y, position.z);
      this.cameraInput.inputs.focus.x = this.tmp.x;
      this.cameraInput.inputs.focus.y = this.tmp.y;
      this.cameraInput.inputs.focus.z = this.tmp.z;
      this.cameraInput.outputs.camera.parent.position.copy(this.tmp);
      this.cameraInput.outputs.camera.matrixWorldNeedsUpdate = true;
    }));

    this.subs.push(this.focusDistanceSmooth.outputs.onPropertyChanged('position',  (position: { x: number, y: number, z: number }) => {
      this.cameraInput.outputs.camera.position.set(position.x, position.y, position.z);
      this.cameraInput.outputs.camera.matrixWorldNeedsUpdate = true;
    }));
    
    this.subs.push(this.positionSmooth.spyOnEvent(new OnCompleteSpy(this)));
}
  
  public onEvent(eventData: any) {
    const button = eventData.input.button as number;

    this.roomSelection.value = this.clickedRoom;

    if (button === PointerButton.PRIMARY) {
      this.events.emit(ClickEvent.Primary);
      return;
    }

    this.clickedRoom.bbox.getCenter(this.tmp);

    // setup smooth targets
    this.positionSmooth.inputs.target = {
      x: this.tmp.x,
      y: this.tmp.y,
      z: this.tmp.z,
    };

    this.focusDistanceSmooth.inputs.target = {
      x: 0,
      y: 0,
      z: this.clickedRoom.radius * 2.5,
    };

    // trigger smooth translation
    this.positionSmooth.onEvent(Events.Start, {
      position: this.cameraInput.inputs.focus,
    });
    this.focusDistanceSmooth.onEvent(Events.Start, {
      position: this.cameraInput.outputs.camera.position,
    });
  }

  public dispose() {
    this.subs.forEach((sub: ISubscription) => sub.cancel());
    this.subs = [];
    this.translationNode.stop();
    this.translationNode = null;
  }
}

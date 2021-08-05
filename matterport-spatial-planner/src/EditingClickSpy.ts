import { ComponentInteractionType, IComponentEventSpy, ISubscription, SceneComponent } from '@mp/common';
import EventEmitter from 'eventemitter3';
import THREE, { PerspectiveCamera, Raycaster } from 'three';
import { IDisposable, IRoom } from './interfaces';

export enum EditingEvent {
  Clicked = 'Clicked',
}

export type EditingEventPayload = {
  roomClicked: boolean;
}

export class EditingClickSpy implements IComponentEventSpy<any>, IDisposable {
  public eventType = ComponentInteractionType.CLICK;
  private sub: ISubscription;
  private raycaster: Raycaster;
  public events: EventEmitter<EditingEvent, EditingEventPayload>;
  
  constructor(private room: IRoom,
              private input: SceneComponent,
              private threeModule: typeof THREE,
              private camera: PerspectiveCamera,
  ) {
    this.events = new EventEmitter();
  }

  public start() {
    this.sub = this.input.spyOnEvent(this);
    this.raycaster = new this.threeModule.Raycaster();
  }
  
  public onEvent(eventData: any) {
    this.raycaster.setFromCamera(eventData.position, this.camera);
    this.raycaster.layers.enableAll();

    const intersection = this.raycaster.intersectObjects(this.room.allMeshes);
    const roomClicked = intersection && intersection.length > 0;

    this.events.emit(EditingEvent.Clicked, {
      roomClicked,
    });
  }

  public dispose() {
    this.events.removeAllListeners();
    if (this.sub) {
      this.sub.cancel();
      this.sub = null;
    }
  }
}

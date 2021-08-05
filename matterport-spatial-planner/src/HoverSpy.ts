import { ComponentInteractionType, IComponentEventSpy } from '@mp/common';
import { ObservableValue } from '@mp/core';
import { IDisposable, IRoom } from './interfaces';

export class HoverSpy implements IComponentEventSpy<any>, IDisposable {
  public eventType = ComponentInteractionType.HOVER;
  constructor(private hoveredRoom: IRoom, private hoverArray: ObservableValue<IRoom[]>) { }

  public onEvent(eventData: any) {
    const newArray: IRoom[] = [];
    this.hoverArray.value.forEach((room: IRoom) => newArray.push(room));

    const searchIndex = newArray.findIndex((room: IRoom) => {
      return room.name === this.hoveredRoom.name;
    });

    if (eventData.hover) {        
      if (searchIndex === -1) {
        newArray.push(this.hoveredRoom);
        this.hoverArray.value = newArray;
      }
    }
    else {
      if (searchIndex !== -1) {
        newArray.splice(searchIndex, 1);
        this.hoverArray.value = newArray;
      }
    }
  }

  public dispose() {}
}

import { ICommand, ICommandFactory, IRoom, IRoomBuilder } from '../interfaces';
import { ObservableValue } from '@mp/core';
import { ISceneNode } from '@mp/common';

class RemoveObjectSelectionCommand implements ICommand<void> {
  constructor(private roomSelection: ObservableValue<IRoom|null>,
    private objectSelection: ObservableValue<ISceneNode|null>) {}

  public async execute(): Promise<void> {
    if (this.roomSelection.value === null) {
      console.warn('No room has been selected');
      return;
    }

    if (this.objectSelection.value === null) {
      console.warn('No object has been selected');
      return;
    }

    // hack: i know all IRooms are IRoomBuilders, i should probably just merge these.
    (this.roomSelection.value as IRoomBuilder).removeObject(this.objectSelection.value);
  }
}

class Factory implements ICommandFactory<void> {
  constructor(private roomSelection: ObservableValue<IRoom|null>,
    private objectSelection: ObservableValue<ISceneNode|null>) {}
  create() {
    return new RemoveObjectSelectionCommand(this.roomSelection, this.objectSelection);
  }
}

export const makeRemoveObjectSelectionCommandFactory = function(roomSelection: ObservableValue<IRoom|null>,
    objectSelection: ObservableValue<ISceneNode|null>): ICommandFactory<void> {
  return new Factory(roomSelection, objectSelection);
};
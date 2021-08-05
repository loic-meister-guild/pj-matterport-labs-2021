import { ICommand, ICommandFactory } from '../interfaces';
import { ObservableValue } from '@mp/core';
import { ISceneNode } from '@mp/common';

class ClearSelectionCommand implements ICommand<void> {
  constructor(private objectSelection: ObservableValue<ISceneNode|null>) {}

  public async execute(): Promise<void> {
    this.objectSelection.value = null;
  }
}

class Factory implements ICommandFactory<void> {
  constructor(private objectSelection: ObservableValue<ISceneNode|null>) {}
  create() {
    return new ClearSelectionCommand(this.objectSelection);
  }
}

export const makeClearSelectionCommandFactory = function(objectSelection: ObservableValue<ISceneNode|null>): ICommandFactory<void> {
  return new Factory(objectSelection);
};
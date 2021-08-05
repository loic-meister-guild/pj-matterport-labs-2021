import { ISceneNode } from '@mp/common';
import { ObservableValue } from '@mp/core';
import { ISelectionMediator } from './interfaces';

class SelectionMediator implements ISelectionMediator {
  constructor(private selection: ObservableValue<ISceneNode|null>) {}

  public clear(): void {
    this.selection.value = null;
  }

  public onSelect(node: ISceneNode): void {
    this.selection.value = node;
  }
}

export const createSelectionMediator = function(selection: ObservableValue<ISceneNode|null>) {
  return new SelectionMediator(selection);
};

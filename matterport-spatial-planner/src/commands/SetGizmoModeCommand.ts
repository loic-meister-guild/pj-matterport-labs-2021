import { ICommand, ICommandFactory } from '../interfaces';
import { Mode } from '../scene-components/TransformGizmo2';
import { ObservableValue } from '@mp/core';

class SetGizmoModeCommand implements ICommand<void, Mode> {
  constructor(private gizmoMode: ObservableValue<Mode>) {}

  public async execute(mode: Mode): Promise<void> {
    this.gizmoMode.value = mode;
  }
}

class Factory implements ICommandFactory<void, Mode> {
  constructor(private gizmoMode: ObservableValue<Mode>) {}
  create() {
    return new SetGizmoModeCommand(this.gizmoMode);
  }
}

export const makeSetGizmoModeCommandFactory = function(gizmoMode: ObservableValue<Mode>): ICommandFactory<void, Mode> {
  return new Factory(gizmoMode);
};
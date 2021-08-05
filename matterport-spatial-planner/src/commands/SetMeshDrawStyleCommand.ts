import { ICommand, ICommandFactory, MeshDrawStyle } from '../interfaces';
import { ObservableValue } from '@mp/core';

class SetMeshDrawStyleCommand implements ICommand<void, MeshDrawStyle> {
  constructor(private drawStyle: ObservableValue<MeshDrawStyle>) {}

  public async execute(drawStyle: MeshDrawStyle): Promise<void> {
    this.drawStyle.value = drawStyle;
  }
}

class Factory implements ICommandFactory<void, MeshDrawStyle> {
  constructor(private drawStyle: ObservableValue<MeshDrawStyle>) {}
  create() {
    return new SetMeshDrawStyleCommand(this.drawStyle);
  }
}

export const makeSetMeshDrawStyleCommandFactory = function(drawStyle: ObservableValue<MeshDrawStyle>): ICommandFactory<void, MeshDrawStyle> {
  return new Factory(drawStyle);
};
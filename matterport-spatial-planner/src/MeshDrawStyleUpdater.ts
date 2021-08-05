import { ISubscription, ObservableValue } from '@mp/core';
import { IDisposable, IRoom, MeshDrawStyle } from './interfaces';

class MeshDrawStyleUpdater implements IDisposable {
  private subs: ISubscription[] = [];

  constructor(private meshDrawStyle: ObservableValue<string>,
              private roomSelector: ObservableValue<IRoom|null>) {
    this.onChanged = this.onChanged.bind(this);
    this.subs.push(meshDrawStyle.onChanged(this.onChanged));
    this.subs.push(roomSelector.onChanged(this.onChanged));
    this.onChanged();
  }

  private onChanged() {
    const room = this.roomSelector.value;
    if (room) {
      if (this.meshDrawStyle.value === MeshDrawStyle.Basic) {
        room.damMeshes[0].visible = true;
        room.damMeshes[0].parent.visible = true;
        room.damMeshes[0].parent.parent.visible = true;
        room.setGreyBoxVisible(false);
      }
      else if (this.meshDrawStyle.value === MeshDrawStyle.GreyBox) {
        room.damMeshes[0].visible = false;
        room.damMeshes[0].parent.visible = false;
        room.damMeshes[0].parent.parent.visible = false;
        room.setGreyBoxVisible(true);
      }
    }
  }

  public dispose() {
    this.subs.forEach((sub) => sub.cancel());
  }
}

export const createMeshDrawStyleUpdate = (meshDrawStyle: ObservableValue<string>,
                                          roomSelector: ObservableValue<IRoom|null>,
                                          ): IDisposable => {
  return new MeshDrawStyleUpdater(meshDrawStyle, roomSelector);
};

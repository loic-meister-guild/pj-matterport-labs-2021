import { Furniture, ICommand, ICommandFactory, IRoom } from '../interfaces';
import { ObservableValue } from '@mp/core';
import { assetMap, ObjectSize } from '../AssetMap';
import { ISceneNode, SceneComponent } from '@mp/common';
import { transformGizmo2Type } from '../scene-components/TransformGizmo2';
import { Object3D } from 'three';

class UpdateObjectCommand implements ICommand<void, Furniture, ObjectSize> {
  constructor(private objectSelection: ObservableValue<ISceneNode|null>, private roomSelection: ObservableValue<IRoom|null>) {}

  public async execute(furnitureType: Furniture, size: ObjectSize): Promise<void> {
    const obj3D = (this.objectSelection.value as any).obj3D as Object3D;
    obj3D.userData.furnitureType = furnitureType;
    obj3D.userData.size = size;

    const gizmos: SceneComponent[] = [];
    for (const component of this.objectSelection.value.componentIterator()) {
      if (component.componentType === 'mp.objLoader') {
        component.inputs.localScale = {
          x: size.width, y: size.height, z: size.depth
        };
      }
      else if (component.componentType === 'mp.daeLoader') {
        const newScale: { x: number, y: number, z: number} = {
          x: (size.width / assetMap[furnitureType].size.width),
          y: (size.height / assetMap[furnitureType].size.height),
          z: (size.depth / assetMap[furnitureType].size.depth),
        }

        component.inputs.localScale = newScale;
        component.inputs.url = null;
        component.inputs.url = assetMap[furnitureType].path;
      }
      else if (component.componentType === transformGizmo2Type) {
        gizmos.push(component);
      }
    }

    gizmos[0].inputs.offset.x = size.width / 2;
    gizmos[0].inputs.offset.y = size.height / 2;
    gizmos[0].inputs.offset.z = size.depth / 2;

    gizmos[1].inputs.offset.x = -size.width / 2;
    gizmos[1].inputs.offset.y = size.height / 2;
    gizmos[1].inputs.offset.z = size.depth / 2;

    gizmos[2].inputs.offset.x = size.width / 2;
    gizmos[2].inputs.offset.y = size.height / 2;
    gizmos[2].inputs.offset.z = -size.depth / 2;

    gizmos[3].inputs.offset.x = -size.width / 2;
    gizmos[3].inputs.offset.y = size.height / 2;
    gizmos[3].inputs.offset.z = -size.depth / 2;

    const room = this.roomSelection.value;
    obj3D.position.set(obj3D.position.x, room.bbox.min.y + (size.height * 0.5), obj3D.position.z);
  }
}

class Factory implements ICommandFactory<void, Furniture, ObjectSize> {
  constructor(private objectSelection: ObservableValue<ISceneNode|null>, private roomSelection: ObservableValue<IRoom|null>) {}
  create() {
    return new UpdateObjectCommand(this.objectSelection, this.roomSelection);
  }
}

export const makeUpdateObjectCommandFactory = function(objectSelection: ObservableValue<ISceneNode|null>,
  roomSelection: ObservableValue<IRoom|null>): ICommandFactory<void, Furniture, ObjectSize> {
  return new Factory(objectSelection, roomSelection);
};
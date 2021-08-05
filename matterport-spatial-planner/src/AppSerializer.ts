import { ISceneNode } from '@mp/common';
import { Page, App } from '@mp/save';
import { Object3D, Quaternion, Vector3 } from 'three';
import { ObjectPose, ObjectSize } from './AssetMap';
import { AppState, Furniture, ICommandFactory, IRoomBuilder } from './interfaces';

type SaveT = {
  furniture: any[];
  canvas: any[];
};

type FurnitureDesc = {
  size: ObjectSize;
  type: Furniture;
  pose: ObjectPose;
}

class AppSerializer implements App.ISaveRequestHandler {
  schema: App.SchemaDescriptor = {
    version: 1,
    schema: {
      furniture: 'furniture',
      canvas: 'canvas',
    },
  };

  constructor(private appState: AppState, private addObjectToRoomCenterCommandFactory: ICommandFactory<ISceneNode, Furniture, IRoomBuilder, ObjectSize, ObjectPose|undefined>,
    private onLoad: () => void) {}

  save(): {} {
    const furniture = new Map<string, FurnitureDesc[]>();
    const canvas = new Map<string, any>();

    for (const [roomId, roomBuilder] of this.appState.rooms) {
      for (const objDesc of roomBuilder.objects) {
        const obj3D = (objDesc.node as any).obj3D as Object3D;
        const position = new Vector3();
        const quaternion = new Quaternion();
        objDesc.object.getWorldPosition(position);
        objDesc.object.getWorldQuaternion(quaternion);

        if (!furniture.has(roomId)) {
          furniture.set(roomId, []);
        }
  
        const furnitureItems = furniture.get(roomId);
  
        furnitureItems.push({
          size: obj3D.userData.size,
          type: obj3D.userData.furnitureType,
          pose: {
            rotation: {
              x: quaternion.x,
              y: quaternion.y,
              z: quaternion.z,
              w: quaternion.w,
            },
            x: position.x,
            y: position.y,
            z: position.z,
          },
        });  
      }
      
      let canvasJson = this.appState.roomComponents.get(roomId).canvasData;
      if (this.appState.roomSelection.value.name === roomId) {
        canvasJson = this.appState.canvas.value.toJSON();
      }

      canvas.set(roomId, canvasJson);
    }

    return {
      furniture: Array.from(furniture.entries()),
      canvas: Array.from(canvas.entries()),
    };
  }

  load(loadRequest: Page.LoadRequest): void {
    const data = loadRequest.loadData as SaveT;

    const furnitureMap: Map<string, FurnitureDesc[]> = new Map(data.furniture)
    const canvas: Map<string, any> = new Map(data.canvas);

    const addFurniturePromises: Promise<ISceneNode>[] = [];
    for (const [roomId, builder] of this.appState.rooms) {
      builder.removeAllObjects();
      if (canvas.has(roomId)) {
        this.appState.roomComponents.get(roomId).canvasData = canvas.get(roomId);
        
        if (this.appState.roomSelection.value?.name === roomId) {
          // regenerate the selected canvas
          this.appState.sketchPainter.value.inputs.jsonData = canvas.get(roomId);
        }
      }
      else {
        this.appState.roomComponents.get(roomId).canvasData = null;
      }
      
      if (furnitureMap.has(roomId)) {
        const furnitureItems = furnitureMap.get(roomId);
        for (const furniture of furnitureItems) {
          addFurniturePromises.push(
            this.addObjectToRoomCenterCommandFactory.create().execute(furniture.type, builder, furniture.size, furniture.pose)
          );
        }
      }
    }

    Promise.all(addFurniturePromises).then(() => {
      this.onLoad();
    });
  }

  migrate(outdatedData: App.OutdatedData): {} {
    throw new Error('Method not implemented.');
  }

}

export const makeAppSerializer = (appState: AppState, addObjectToRoomCenterCommandFactory: ICommandFactory<ISceneNode, Furniture, IRoomBuilder, ObjectSize, ObjectPose|undefined>, cb: () => void) => {
  return new AppSerializer(appState, addObjectToRoomCenterCommandFactory, cb);
};
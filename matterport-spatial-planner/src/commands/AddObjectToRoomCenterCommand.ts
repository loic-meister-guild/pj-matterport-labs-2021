import { ISceneNode, SceneComponent } from '@mp/common';
import { Furniture, ICommand, ICommandFactory, IDisposable, IRoom, IRoomBuilder } from '../interfaces';
import { assetMap, ObjectPose, ObjectSize } from '../AssetMap';
import { itemViewType } from '../scene-components/ItemView';
import { Box3, Color, Object3D, Quaternion, Vector3 } from 'three';
import { waitUntil } from '../util';
import { Mode, transformGizmo2Type } from '../scene-components/TransformGizmo2';
import { ObservableValue } from '@mp/core';
import { snapAxisType } from '../scene-components/SnapAxis';

const cubeSceneFile = './assets/cube/cube.json';

class AddObjectToRoomCenterCommand implements ICommand<ISceneNode, Furniture, IRoomBuilder, ObjectSize, ObjectPose|undefined> {
  constructor(private sdk: any, private objectSelection: ObservableValue<ISceneNode|null>, private gizmoMode: ObservableValue<Mode>,
    private roomSelection: ObservableValue<IRoom|null>) {}

  public async execute( furnitureType: Furniture, room: IRoomBuilder, size: ObjectSize, pose: ObjectPose|undefined): Promise<ISceneNode> {
    const disposables: IDisposable[] = [];
    const cubeJson = await fetch(cubeSceneFile, {
      method: 'GET',
    });

    const itemSerialized = await cubeJson.text();

    const cubeNode: ISceneNode[] = await this.sdk.Scene.deserialize(itemSerialized);
    
    const itemSize = size;
    let objLoader: SceneComponent|null = null;
    let itemView: SceneComponent|null = null;
    let snapAxis: SceneComponent|null = null;
    let daeLoader : SceneComponent|null = null;

    let loaded = false;
    const onLoaded = (): void => {
      loaded = !!daeLoader.outputs.objectRoot;
    };

    for (const component of cubeNode[0].componentIterator()) {
      if (component.componentType === 'mp.objLoader') {
        objLoader = component;
        objLoader.inputs.colliderEnabled = false;
        objLoader.inputs.localScale = {
          x: size.width, y: size.height, z: size.depth
        };
      }
      else if (component.componentType === itemViewType) {
        itemView = component;
        itemView.inputs.color = new Color().copy(assetMap[furnitureType].color);
        itemView.inputs.minPosition = {
          x: room.bbox.min.x,
          y: room.bbox.min.y,
          z: room.bbox.min.z,
        };
        itemView.inputs.maxPosition = {
          x: room.bbox.max.x,
          y: room.bbox.max.y,
          z: room.bbox.max.z,
        };
      }
      else if (component.componentType === 'mp.daeLoader') {
        daeLoader = component;

        const scale: { x: number, y: number, z: number} = {
          x: (size.width / assetMap[furnitureType].size.width),
          y: (size.height / assetMap[furnitureType].size.height),
          z: (size.depth / assetMap[furnitureType].size.depth),
        }

        component.inputs.url = assetMap[furnitureType].path;
        component.inputs.localPosition = assetMap[furnitureType].localPosition;
        component.inputs.localScale = scale;
        component.inputs.onLoaded = onLoaded;
      }
      else if (component.componentType === snapAxisType) {
        snapAxis = component;
      }
    }

    const bindGizmoVisibility = (component: SceneComponent) => {      
      const sub1 = this.objectSelection.onChanged(() => {
        component.inputs.enabled = this.objectSelection.value === component.context.root;
      });

      const sub2 = this.gizmoMode.onChanged(() => {
        component.inputs.mode = this.gizmoMode.value;
      });

      disposables.push({
        dispose: function() {
          sub1.cancel();
          sub2.cancel();
        }
      })
    };

    bindGizmoVisibility(cubeNode[0].addComponent(transformGizmo2Type,{
      size: {
        x: 0.1,
        y: 0.02,
        z: 0.1,
      },
      offset: {
        x: itemSize.width / 2,
        y: itemSize.height / 2,
        z: itemSize.depth / 2,
      },
      enabled: false,
      mode: this.gizmoMode.value,
    }));

    bindGizmoVisibility(cubeNode[0].addComponent(transformGizmo2Type,{
      size: {
        x: 0.1,
        y: 0.02,
        z: 0.1,
      },
      offset: {
        x: -itemSize.width / 2,
        y: itemSize.height / 2,
        z: itemSize.depth / 2,
      },
      enabled: false,
      mode: this.gizmoMode.value,
    }));

    bindGizmoVisibility(cubeNode[0].addComponent(transformGizmo2Type,{
      size: {
        x: 0.1,
        y: 0.02,
        z: 0.1,
      },
      offset: {
        x: itemSize.width / 2,
        y: itemSize.height / 2,
        z: -itemSize.depth / 2,
      },
      enabled: false,
      mode: this.gizmoMode.value,
    }));

    bindGizmoVisibility(cubeNode[0].addComponent(transformGizmo2Type,{
      size: {
        x: 0.1,
        y: 0.02,
        z: 0.1,
      },
      offset: {
        x: -itemSize.width / 2,
        y: itemSize.height / 2,
        z: -itemSize.depth / 2,
      },
      enabled: false,
      mode: this.gizmoMode.value,
    }));


    cubeNode[0].start();

    await waitUntil( () => {
      return loaded === true;
    });

    daeLoader.inputs.onLoaded = function() {};
    objLoader.inputs.colliderEnabled = true;

    const bbox = new Box3();
    bbox.expandByObject((cubeNode[0] as any).obj3D);
    const bboxSize = new Vector3();
    bbox.getSize(bboxSize);

    const sceneNodeObj3D = (cubeNode[0] as any).obj3D as Object3D;
    if (pose) {
      sceneNodeObj3D.position.set(pose.x, pose.y, pose.z);
      sceneNodeObj3D.setRotationFromQuaternion(new Quaternion(pose.rotation.x, pose.rotation.y, pose.rotation.z, pose.rotation.w));
    }
    else {
      sceneNodeObj3D.position.set(room.center.x, room.bbox.min.y + (bboxSize.y * 0.5), room.center.z);
    }

    room.addObject(cubeNode[0], bbox, disposables);

    this.objectSelection.value = cubeNode[0];
    if (!sceneNodeObj3D.userData) {
      sceneNodeObj3D.userData = {};
    }
    sceneNodeObj3D.userData.furnitureType = furnitureType;
    sceneNodeObj3D.userData.size = size;

    if (this.roomSelection.value?.name !== room.name) {
      sceneNodeObj3D.visible = false;
    }

    snapAxis.inputs.min = {
      x: room.bbox.min.x,
      y: room.bbox.min.y,
      z: room.bbox.min.z,
    };

    snapAxis.inputs.max = {
      x: room.bbox.max.x,
      y: room.bbox.max.y,
      z: room.bbox.max.z,
    };

    return cubeNode[0];
  }
}

class Factory implements ICommandFactory<ISceneNode, Furniture, IRoomBuilder, ObjectSize, ObjectPose|undefined> {
  constructor(private sdk: any, private objectSelection: ObservableValue<ISceneNode|null>, private gizmoMode: ObservableValue<Mode>, 
    private roomSelection: ObservableValue<IRoom|null>) {}
  create() {
    return new AddObjectToRoomCenterCommand(this.sdk, this.objectSelection, this.gizmoMode, this.roomSelection);
  }
}

export const makeAddObjectToRoomCenterCommandFactory = function(sdk: any,
    objectSelection: ObservableValue<ISceneNode|null>, 
    gizmoMode: ObservableValue<Mode>,
    roomSelection: ObservableValue<IRoom|null>): ICommandFactory<ISceneNode, Furniture, IRoomBuilder, ObjectSize, ObjectPose|undefined> {
  return new Factory(sdk, objectSelection, gizmoMode, roomSelection);
};
import { ComponentInteractionType, IComponentEventSpy, ISceneNode, ISubscription, PointerButtonEvent, SceneComponent } from '@mp/common';
import { Box3, Color } from 'three';
import { assetMap } from '../AssetMap';
import { Furniture, ICommand, ICommandFactory, IRoomBuilder } from '../interfaces';
import { itemViewType } from '../scene-components/ItemView';
import { snapToFloorType } from '../scene-components/SnapToFloor';
import { waitUntil } from '../util';

const cubeSceneFile = './assets/cube/cube.json';

class AddObjectCommand implements ICommand<ISceneNode, Furniture, IRoomBuilder> {
  private poseSub: ISubscription|null = null;
  private intersectionSub: ISubscription|null = null;
  private itemSerialized: string|null = null;

  constructor(private sdk: any,
              private inputComponent: SceneComponent,
              private eventDispatcher: SceneComponent) {
    this.onIntersectionChanged = this.onIntersectionChanged.bind(this);
    this.onPoseChanged = this.onPoseChanged.bind(this);
  }

  public async execute(furnitureType: Furniture, room: IRoomBuilder): Promise<ISceneNode> {
    this.intersectionSub = this.sdk.Pointer.intersection.subscribe(this.onIntersectionChanged);
    this.poseSub = this.sdk.Camera.pose.subscribe(this.onPoseChanged);

    if (!this.itemSerialized) {
      const cubeJson = await fetch(cubeSceneFile, {
        method: 'GET',
      });

      this.itemSerialized = await cubeJson.text();
    }

    const cubeNode: ISceneNode[] = await this.sdk.Scene.deserialize(this.itemSerialized);
    let loaded = false;
    const onLoaded = (): void => {
      loaded = true;
    };

    let objLoader: SceneComponent|null = null;
    let itemView: SceneComponent|null = null;
    let snapToFloor: SceneComponent|null = null;
    for (const component of cubeNode[0].componentIterator()) {
      if (component.componentType === 'mp.objLoader') {
        objLoader = component;
        objLoader.inputs.colliderEnabled = false;
        const size = assetMap[furnitureType].size;
        objLoader.inputs.localScale = {
          x: size.width, y: size.height, z: size.depth
        };
      }
      else if (component.componentType === itemViewType) {
        itemView = component;
        itemView.inputs.opacity = 0.25;
        itemView.inputs.color = new Color().copy(assetMap[furnitureType].color);
      }
      else if (component.componentType === snapToFloorType) {
        this.eventDispatcher.inputs.listeners.unshift(component);
        snapToFloor = component;
        snapToFloor.inputs.enabled = true;
      }
      else if (component.componentType === 'mp.daeLoader') {
        component.inputs.url = assetMap[furnitureType].path;
        component.inputs.localPosition = assetMap[furnitureType].localPosition;
        component.inputs.onLoaded = onLoaded;
      }
    }

    cubeNode[0].start();

    await waitUntil( () => {
      return loaded === true;
    });

    let clicked = false;
    class ClickSpy implements IComponentEventSpy<PointerButtonEvent> {
      public eventType = ComponentInteractionType.POINTER_BUTTON;
      constructor() {}
      onEvent(event: PointerButtonEvent) {
        if (event.down) {
          clicked = true;
        }
      }
    }

    this.inputComponent.spyOnEvent(new ClickSpy());

    await waitUntil(() => clicked === true);

    itemView.inputs.opacity = 0.1;
    snapToFloor.inputs.enabled = false;
    objLoader.inputs.colliderEnabled = true;

    const bbox = new Box3();
    bbox.expandByObject((cubeNode[0] as any).obj3D);

    room.addObject(cubeNode[0], bbox, []);

    this.poseSub.cancel();
    this.intersectionSub.cancel();

    return cubeNode[0];
  }

  private onIntersectionChanged(intersection: any) {
    //this.intersection = intersection;
  }

  private onPoseChanged(pose: any) {
    // this.pose = pose;
  }
}

class Factory implements ICommandFactory<ISceneNode, Furniture, IRoomBuilder> {
  constructor(private sdk: any,
              private inputComponent: SceneComponent,
              private eventDispatcher: SceneComponent) {}
  create() {
    return new AddObjectCommand(this.sdk, this.inputComponent, this.eventDispatcher);
  }
}

export const makeAddObjectCommandFactory = function(sdk: any, inputComponent: SceneComponent, eventDispatcher: SceneComponent): ICommandFactory<ISceneNode, Furniture, IRoomBuilder> {
  return new Factory(sdk, inputComponent, eventDispatcher);
};

import { SceneComponent, ComponentOutput, ComponentInteractionType } from '@mp/common';
import { Dict } from '@mp/core';
import { ChunkType, IRoomBuilder, ISharedMaterial } from '../interfaces';
import { createRoomBuilder } from '../Room';
import { Mesh, Scene } from 'three';

type Inputs = {
  name: string,
  colliderEnabled: boolean,
};

type Outputs = {
} & ComponentOutput;

export enum RoomEvents {
  ON_CHUNK_ADDED = 'ON_CHUNK_ADDED',
  ON_DAM_ADDED = 'ON_DAM_ADDED',
}

export type ChunkAdded = {
  chunkType: ChunkType,
  mesh: Mesh,
};

export type DamAdded = {
  mesh: Mesh,
}

export class RoomComponent extends SceneComponent {
  // temp hack
  public roomBuilder: IRoomBuilder; 
  // private disposables: IDisposable[] = [];

  inputs: Inputs = {
    name: '',
    colliderEnabled: true,
  };

  outputs = {
  } as Outputs;

  events = {
    [RoomEvents.ON_CHUNK_ADDED]: true,
    [RoomEvents.ON_DAM_ADDED]: true,
    [ComponentInteractionType.HOVER]: true,
    [ComponentInteractionType.CLICK]: true,
  };

  constructor(private scene: Scene, private sharedMaterials: ISharedMaterial) {
    super();
  }

  onInit() {
    this.roomBuilder = createRoomBuilder(this.context.three, this.scene, this.sharedMaterials, this.inputs.name);
    this.outputs.objectRoot = new this.context.three.Object3D();
    this.outputs.objectRoot.name = `RoomComponent: ${this.inputs.name}`;
    this.outputs.collider = this.outputs.objectRoot;
    this.onInputsUpdated();
  }

  onInputsUpdated() {
    this.outputs.collider = this.inputs.colliderEnabled ? this.outputs.objectRoot : undefined;
  }

  onEvent(eventType: string, eventData: Dict): void {
    if (eventType === RoomEvents.ON_CHUNK_ADDED) {
      const data = eventData as ChunkAdded;
      this.roomBuilder.addMesh(data.chunkType, data.mesh);
      this.outputs.objectRoot.add(data.mesh);
    }
    else if (eventType === RoomEvents.ON_DAM_ADDED) {
      const data = eventData as DamAdded;
      this.roomBuilder.addDamMesh(data.mesh);
    }
    else if (eventType === ComponentInteractionType.HOVER) {
      // if (eventData.hover) {
      //   this.disposables.push(this.roomBuilder.setMaterial(ChunkType.Ceiling, this.sharedMaterials.get(Materials.Selected).value, false));
      //   this.disposables.push(this.roomBuilder.setMaterial(ChunkType.Door, this.sharedMaterials.get(Materials.Selected).value, false));
      //   this.disposables.push(this.roomBuilder.setMaterial(ChunkType.Floor, this.sharedMaterials.get(Materials.Selected).value, false));
      //   this.disposables.push(this.roomBuilder.setMaterial(ChunkType.Other, this.sharedMaterials.get(Materials.Selected).value, false));
      //   this.disposables.push(this.roomBuilder.setMaterial(ChunkType.Wall, this.sharedMaterials.get(Materials.Selected).value, false));

      //   this.disposables.push(this.roomBuilder.setMaterial(ChunkType.Ceiling, this.sharedMaterials.get(Materials.SelectedEdges).value, true));
      //   this.disposables.push(this.roomBuilder.setMaterial(ChunkType.Door, this.sharedMaterials.get(Materials.SelectedEdges).value, true));
      //   this.disposables.push(this.roomBuilder.setMaterial(ChunkType.Floor, this.sharedMaterials.get(Materials.SelectedEdges).value, true));
      //   this.disposables.push(this.roomBuilder.setMaterial(ChunkType.Other, this.sharedMaterials.get(Materials.SelectedEdges).value, true));
      //   this.disposables.push(this.roomBuilder.setMaterial(ChunkType.Wall, this.sharedMaterials.get(Materials.SelectedEdges).value, true));
      // }
      // else {
      //   this.disposables.forEach((disposable: IDisposable) => disposable.dispose());
      // }

      // forward this event
      this.notify(eventType, eventData);
    }
    else if (eventType === ComponentInteractionType.CLICK) {
      // forward this event
      this.notify(eventType, eventData);
    }
  }
}

export const roomType = 'mp.room';

export const createRoom = (scene: Scene, sharedMaterials: ISharedMaterial) => {
  return () => {
    return new RoomComponent(scene, sharedMaterials);
  }
};

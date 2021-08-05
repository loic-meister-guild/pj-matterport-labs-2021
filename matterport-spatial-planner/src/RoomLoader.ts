import { ISceneNode } from '@mp/common';
import { Box3, BufferGeometry, Mesh, Object3D } from 'three';
import { ChunkType, IRoomBuilder, modelRenderOrder, RoomDesc } from './interfaces';
import { ChunkAdded, DamAdded, RoomComponent, RoomEvents, roomType } from './scene-components/RoomComponent';
import { waitUntil } from './util';

// leaving this function here in case we want to filter by height.
const isBelowFloorHeight = function(roomBounds: Box3, mesh: Mesh, discardHeight: number): boolean {
  const floorBounds = new Box3();
  floorBounds.expandByObject(mesh);

  return true;
  // const diff = floorBounds.max.y - roomBounds.min.y;
  // return diff < discardHeight;
};

const isFacingUp = function(geometry: BufferGeometry): boolean {
  const attr = geometry.getAttribute('normals');
  for (let i=0; i<attr.array.length; i += 3) {
    if (attr.array[i+1] < 0.9) {
      return false;
    }
  }

  return true;
}

const handleDefaultPart = function(roomDesc: RoomDesc, roomBounds: Box3, newMesh: Mesh, floorDiscardHeight: number) {
  if (isBelowFloorHeight(roomBounds, newMesh, floorDiscardHeight) &&
    isFacingUp(newMesh.geometry as BufferGeometry)) {
      roomDesc.room.onEvent(RoomEvents.ON_CHUNK_ADDED, {
        chunkType: ChunkType.Floor,
        mesh: newMesh,
      } as ChunkAdded);
    }
    else {
      roomDesc.room.onEvent(RoomEvents.ON_CHUNK_ADDED, {
        chunkType: ChunkType.Other,
        mesh: newMesh,
      } as ChunkAdded);
    }
}

const handleFourPartName = function(roomDesc: RoomDesc, roomBounds: Box3, parts: string[], newMesh: Mesh, floorDiscardHeight: number) {
  if (parts[3].includes('objectwall') || parts[3].includes('type001')) {
    roomDesc.room.onEvent(RoomEvents.ON_CHUNK_ADDED, {
      chunkType: ChunkType.Wall,
      mesh: newMesh,
    } as ChunkAdded);
  }
  else if (parts[3].includes('objectfloor') || parts[3].includes('type003')) {
    if (isBelowFloorHeight(roomBounds, newMesh, floorDiscardHeight)) {
      roomDesc.room.onEvent(RoomEvents.ON_CHUNK_ADDED, {
        chunkType: ChunkType.Floor,
        mesh: newMesh,
      } as ChunkAdded);
    }
  }
  else if (parts[3].includes('objectceiling') || parts[3].includes('type002')) {
    roomDesc.room.onEvent(RoomEvents.ON_CHUNK_ADDED, {
      chunkType: ChunkType.Ceiling,
      mesh: newMesh,
    } as ChunkAdded);
  }
  else if (parts[3].includes('objectdoor') || parts[3].includes('type004')) {
    roomDesc.room.onEvent(RoomEvents.ON_CHUNK_ADDED, {
      chunkType: ChunkType.Door,
      mesh: newMesh,
    } as ChunkAdded);
  }
  else {
    handleDefaultPart(roomDesc, roomBounds, newMesh, floorDiscardHeight);
  }
}

const handleTwoPartName = function(roomDesc: RoomDesc, roomBounds: Box3, parts: string[], newMesh: Mesh, floorDiscardHeight: number) {
  if (parts[1].includes('type001')) {
    roomDesc.room.onEvent(RoomEvents.ON_CHUNK_ADDED, {
      chunkType: ChunkType.Wall,
      mesh: newMesh,
    } as ChunkAdded);
  }
  else if (parts[1].includes('type002')) {
    roomDesc.room.onEvent(RoomEvents.ON_CHUNK_ADDED, {
      chunkType: ChunkType.Ceiling,
      mesh: newMesh,
    } as ChunkAdded);
  }
  else if (parts[1].includes('type003')) {
    if (isBelowFloorHeight(roomBounds, newMesh, floorDiscardHeight)) {
      roomDesc.room.onEvent(RoomEvents.ON_CHUNK_ADDED, {
        chunkType: ChunkType.Floor,
        mesh: newMesh,
      } as ChunkAdded);
    }
  }
  else if (parts[1].includes('type004')) {
    roomDesc.room.onEvent(RoomEvents.ON_CHUNK_ADDED, {
      chunkType: ChunkType.Door,
      mesh: newMesh,
    } as ChunkAdded);
  }
  else {
    handleDefaultPart(roomDesc, roomBounds, newMesh, floorDiscardHeight);
  }
}
export class RoomLoader {
  private loadComplete = false;
  private roomId: number;
  private floorId: number;
  private floorDiscardHeight: number = 0.1;

  constructor(private nodePool: ISceneNode[],
              private rooms: Map<string, IRoomBuilder>,
              private roomComponents: Map<string, RoomDesc>,
              private modelRooms: Mesh[]) {
    this.onLoaded = this.onLoaded.bind(this);
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.has('floorDiscardHeight')) {
      this.floorDiscardHeight = parseFloat(searchParams.get('floorDiscardHeight'));
    }
  }

  public async execute(url: string, floorId: number, roomId: number) {
    this.floorId = floorId;
    this.roomId = roomId;

    const node = this.nodePool.pop();
    const objLoader = node.addComponent('mp.objLoader', {
      url,
      localRotation: {
        x: -90,
        y: 0,
        z: 0,
      },
       onLoaded: this.onLoaded,
    });
    node.start();

    await waitUntil(() => this.loadComplete);

    objLoader.inputs.colliderEnabled = false;
    objLoader.outputs.objectRoot.visible = false;

    node.stop();
  }

  private onLoaded(root: Object3D): void {
    const roomBounds = new Box3();
    roomBounds.expandByObject(root);

    root.traverse((obj: Object3D) => {
      if (obj.type === 'Mesh') {
        const mesh = obj as Mesh;
        //console.log(`Room mesh: floorId:${this.floorId} roomId:${this.roomId} ${mesh.name}`)

        let roomDesc: RoomDesc;
        const roomName = `RoomMesh:${this.floorId}-${this.roomId}`;
        if (this.rooms.has(roomName)) {
          roomDesc = this.roomComponents.get(roomName);
        }
        else {
          roomDesc = {
            animatedValue: null,
            node: null,
            room: null,
            canvasData: null,
          };

          roomDesc.node = this.nodePool.pop();
          roomDesc.room = roomDesc.node.addComponent(roomType, {
            name: roomName,
          }) as RoomComponent;
          roomDesc.node.start();

          roomDesc.room.onEvent(RoomEvents.ON_DAM_ADDED, {
            mesh: this.modelRooms.find((room: Object3D) => room.name === roomName),
          } as DamAdded);

          this.rooms.set(roomName, (roomDesc.room as RoomComponent).roomBuilder);
          this.roomComponents.set(roomName, roomDesc);
        } 

        const newMesh = new Mesh(mesh.geometry, mesh.material);
        newMesh.name = mesh.name;
        newMesh.renderOrder = modelRenderOrder;
        mesh.getWorldPosition(newMesh.position);
        mesh.getWorldQuaternion(newMesh.quaternion);
        mesh.getWorldScale(newMesh.scale);

        // first naming convention
        // chunk130_group000_sub004_objectfloor065
        //
        // second naming convention
        // from https://ghe.matterport.com/matterport/mp_vision/blob/master/modules/semantic/eos/semantic/semantic.h#L26
        // chunk003_group001_sub005_type001
        const parts = mesh.name.split('_');
        switch(parts.length) {
          case 2:
            handleTwoPartName(roomDesc, roomBounds, parts, newMesh, this.floorDiscardHeight);
            break;
          case 4:
            handleFourPartName(roomDesc, roomBounds, parts, newMesh, this.floorDiscardHeight);
            break;
          default:
            handleDefaultPart(roomDesc, roomBounds, newMesh, this.floorDiscardHeight);
            break;
        }
      }
    });

    this.loadComplete = true;
  }
}

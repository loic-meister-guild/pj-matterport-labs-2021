import { DragEvent, ISceneNode, SceneComponent } from '@mp/common';
import { Dict, ObservableValue } from '@mp/core';
import { Box3, Material, Mesh, MeshStandardMaterial, Object3D, Vector3 } from 'three';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import { FSMStateValues } from './ApplicationFSM';
import { ObjectPose, ObjectSize } from './AssetMap';
import { RoomComponent } from './scene-components/RoomComponent';
import { Mode } from './scene-components/TransformGizmo2';

export const modelRenderOrder = 1000;
export interface IDisposable {
  dispose(): void;
}

export interface TranslateEvent extends DragEvent {
  worldDirection: { x: number, y: number, z: number };
  screenDirection: { x: number, y: number };
}

export enum GizmoEvents {
  TRANSLATE ='TRANSLATE',
}

// Used for event dispatcher
export interface IEventListener {
  // events will only filter if this method is implemented.
  willHandleEvent?(eventType: string, eventData: Dict): { handle: boolean, eventType?: string };

  onEvent(eventType: string, eventData: unknown): void;
}

export interface ISelectionMediator {
  clear(): void;
  onSelect(node: ISceneNode): void;
}

export type RoomObjectDesc = {
  node: ISceneNode;

  /**
   * cache the node's object3D
   */
  object: Object3D;
  
  /**
   * pre-rotated bbox
   */
  bbox: Box3;

  /**
   * cube surrounding the furniture
   */
  cubeModel: SceneComponent;

  /**
   * furniture model
   */
  furnitureModel: SceneComponent;

  /**
   * item view components.
   */
  itemViews: SceneComponent[];

  /**
   * selectable component
   */
  selectable: SceneComponent;

  disposables: IDisposable[];
}

export interface IRoom {
  name: string;
  center: Vector3;
  radius: number;
  allMeshes: Mesh[];
  objects: RoomObjectDesc[];
  bbox: Box3;
  damMeshes: Mesh[];

  getMaterial(): MeshStandardMaterial;
  getEdgesMaterial(): LineMaterial;
  setVisible(visible: boolean): void;
  setObjectsVisible(visible: boolean): void;
  setObjectsInteractable(interactable: boolean): void;
  setDamVisible(visible: boolean): void;
  setGreyBoxVisible(visible: boolean): void;
  // setMaterial(chunkType: ChunkType, material: Material, edges: boolean): IDisposable;
  setMaterial2(chunkType: ChunkType, material: Material, edges: boolean): void;
  setInteractable(interactable: boolean): void;
  meshForChunk(chunkType: ChunkType) : Mesh[];
}

export enum ChunkType {
  Wall = 'wall',
  Ceiling = 'ceiling',
  Floor = 'floor',
  Door = 'door',
  Other = 'other',
  FloorCollider = 'FloorCollider',
}

export enum Materials {
  Edges = 'Edges',
  Invisible = 'Invisible',
  SolidMaterial = 'SolidMaterial',
}

export enum MeshDrawStyle {
  Basic = 'Basic',
  GreyBox = 'GreyBox',
  Transitioning = 'Transitioning',
}

export interface IRoomBuilder extends IRoom {
  addMesh(type: ChunkType, mesh: Mesh): void;
  addDamMesh(mesh: Mesh): void;
  addObject(node: ISceneNode, bbox: Box3, disposables: IDisposable[]): void;
  removeObject(node: ISceneNode): void;
  removeAllObjects(): void;
}
export interface ISharedMaterial {
  get(key: string): ObservableValue<Material>|null;
}

export interface ISharedMaterialStack extends ISharedMaterial {
  push(key: string, material: Material): ObservableValue<Material|null>;
  pop(key: string): void;
  clone(fromKey: string, toKey: string): ObservableValue<Material|null>;
}

export enum Furniture {
  Chair,
  Table,
  Dresser,
  Sofa,
  Bed,
}

export interface IEventService {
  add(component: SceneComponent): void;
}

export type RoomDesc = {
  node: ISceneNode;
  room: RoomComponent;
  animatedValue: SceneComponent;
  canvasData: any;
};

export type SelectingStateVisualProps = {
  roomHoverColor: number;
  roomUnhoverColor: number;
  roomHoverOpacity: number;
  roomUnhoverOpacity: number;
  edgesHoverColor: number;
  edgesUnhoverColor: number;
  edgesHoverOpacity: number;
  edgesUnhoverOpacity: number;
  edgesHoverWidth: number;
  edgesUnhoverWidth: number;
};

export type AppState = {
  rooms: Map<string, IRoomBuilder>;
  roomComponents: Map<string, RoomDesc>;
  roomSelection: ObservableValue<IRoom|null>;
  objectSelection: ObservableValue<ISceneNode|null>;
  meshDrawStyle: ObservableValue<MeshDrawStyle>;
  roomHover: ObservableValue<IRoom[]>;
  clippingHeight: ObservableValue<number>;
  gizmoMode: ObservableValue<Mode>;
  canvas: ObservableValue<fabric.Canvas>;
  sketchPainter: ObservableValue<SceneComponent|null>;
  selectingStateVisualProps: SelectingStateVisualProps;
}

export interface IPool {
  borrow(): SceneComponent|null;
  return(object: SceneComponent): void;
}

export interface IFSMContext {
  current: FSMStateValues;
  next: FSMStateValues|null;
}

export interface ICommand<T, Param1T = void, Param2T = void, Param3T = void, Param4T = void> {
  execute(param1: Param1T, param2: Param2T, param3: Param3T, param4: Param4T): Promise<T>
}
export interface ICommandFactory<T, Param1T = void, Param2T = void, Param3T = void, Param4T = void> {
  create(): ICommand<T, Param1T, Param2T, Param3T, Param4T>;
}

export interface ICommandFactoryProvider {
  addObjectFactory: ICommandFactory<ISceneNode, Furniture, IRoomBuilder>;
  addObjectToRoomCenterCommandFactory: ICommandFactory<ISceneNode, Furniture, IRoomBuilder, ObjectSize, ObjectPose|undefined>;
  setGizmoModeCommandFactory: ICommandFactory<void, Mode>;
  downloadImageCommandFactory: ICommandFactory<void>;
  setMeshDrawStyleCommandFactory: ICommandFactory<void, MeshDrawStyle>;
  removeObjectSelectionCommandFactory: ICommandFactory<void>;
  makeMoveCameraCommandFactory: ICommandFactory<void, IRoom|null>;
  makeUpdateObjectCommandFactory: ICommandFactory<void, Furniture, ObjectSize>;
  clearSelectionCommandFactory: ICommandFactory<void>;
}

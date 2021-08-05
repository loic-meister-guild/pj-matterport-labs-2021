import { BehaviorSubject } from 'rxjs';
import { ISceneNode, SceneComponent } from '@mp/common';
import { ObservableValue } from '@mp/core';
import { Box3, Material, Mesh, MeshStandardMaterial, Vector3 } from 'three';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import { Quaternion } from "three"
import { FSMEvent, FSMSchema } from './AppFSM';
import { Interpreter } from 'xstate';


export type PathPoint = {
    position: Vector3;
    floorPosition: Vector3;
    id: string;
}
export type PathState = {
    path: ObservableValue<any[]>,
    pathLength: ObservableValue<Number>,
    validPath: ObservableValue<any>,
}
export type EditState = {
    transformMode: ObservableValue<String>,
    focus: ObservableValue<Vector3>,
    focusTarget: ObservableValue<any>,
    hoverTarget: ObservableValue<any>,
    boxTransform: {
        position: ObservableValue<Vector3>,
        rotation: ObservableValue<Quaternion>,
        scale: ObservableValue<Vector3>,
    },
    startPos: ObservableValue<Vector3>,
    endPos: ObservableValue<Vector3>,
    pathState: {
        path: ObservableValue<any[]>,
        pathLength: ObservableValue<Number>,
        validPath: ObservableValue<boolean>,
    },
    visualizerState: {
        duration: ObservableValue<number>,
    }
}

export type EditMode = 'translate'| 'rotate'|'scale';

export type BoxTransformState = {
    position: ObservableValue<Vector3>;
    rotation: ObservableValue<Quaternion>;
    scale: ObservableValue<Vector3>; 
}

// From src/scene-components/PathBuilder.ts
export type Sweep = {
    floor: number;
    neighbors: string[];
    position: Vector3;
    rotation: Vector3;
    uuid: string;
    id: string;
    alignmentType: String;
}

// From the Spatial Planner sample's src/types.ts
export type IEnvContext = {
    apiHost: string;
    applicationKey: string;
    sid: string;
}

// From the Showcase SDK sample'S packages/inspector/src/Scene.ts
export interface IContext {
    editState: EditState;
    fsm: Interpreter<any, FSMSchema, FSMEvent, any>;
}

export interface IScene {
    readonly objects: BehaviorSubject<ISceneNode[]>;
    readonly widget: SceneComponent | null;
    readonly cameraInput: SceneComponent | null;
    readonly sensor: any;

    /**
     * This function deserializes the provided string into scene nodes.
     * Additionally, it starts the scene nodes right away.
     * @param serialized serialized scene objects
     */
    deserialize(serialized: string): Promise<void>;

    /**
     * Serialize the entire scene to a string.
     */
    serialize(): Promise<string>;
    addObject(node: ISceneNode): void;
    removeObject(node: ISceneNode): void;

    /**
     * Restores the inspector to the it's default state by removing all non-inspector scene nodes.
     */
    reset(): void;
}

export interface IDisposable {
    dispose(): void;
}

export interface IRoom {
    name: string;
    center: Vector3;
    radius: number;
    allMeshes: Mesh[];
    bbox: Box3;
    damMeshes: Mesh[];

    getMaterial(): MeshStandardMaterial;
    getEdgesMaterial(): LineMaterial;
    setVisible(visible: boolean): void;
    setObjectsVisible(visible: boolean): void;
    setObjectsInteractable(interactable: boolean): void;
    setDamVisible(visible: boolean): void;
    setGreyBoxVisible(visible: boolean): void;
    setMaterial(chunkType: ChunkType, material: Material, edges: boolean): IDisposable;
    setMaterial2(chunkType: ChunkType, material: Material, edges: boolean): void;
    setInteractable(interactable: boolean): void;
    meshForChunk(chunkType: ChunkType): Mesh[];
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
    phase: any;
    rooms: Map<string, IRoomBuilder>;
    roomSelection: ObservableValue<IRoom | null>;
    objectSelection: ObservableValue<ISceneNode | null>;
    meshDrawStyle: ObservableValue<MeshDrawStyle>;
    roomHover: ObservableValue<IRoom[]>;
    clippingHeight: ObservableValue<number>;
    sketchPainter: ObservableValue<SceneComponent | null>;
    selectingStateVisualProps: SelectingStateVisualProps;
}

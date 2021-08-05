import { ISceneNode, SceneComponent } from '@mp/common';
import THREE, { Vector3, Mesh, Box3, Sphere, Scene, Box3Helper, AxesHelper, Material, MeshStandardMaterial } from 'three';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import { ChunkType, IDisposable as IDisposable, IRoom, IRoomBuilder, ISharedMaterial, Materials, RoomObjectDesc } from './interfaces';
import { MeshCollection } from './MeshCollection';
import { itemViewType } from './scene-components/ItemView';
import { selectableType } from './scene-components/Selectable';

class Room implements IRoom, IRoomBuilder {
  constructor(private three: typeof THREE,
              private scene: Scene,
              private sharedMaterials: ISharedMaterial,
              public name: string) {
    const material = this.sharedMaterials.get(Materials.SolidMaterial).value;
    this.material = material.clone() as MeshStandardMaterial;
    this.material.name = `${material.name} ${this.name}`;

    this.lineMaterial = this.sharedMaterials.get(Materials.Edges).value.clone() as LineMaterial;
    this.lineMaterial.name = `${material.name} ${this.name}`;
  }

  private _center = new Vector3();
  private _radius = 1;
  private _box3: Box3;
  private boxHelper: Box3Helper;
  private axesHelper: AxesHelper;
  private boundsDirty = true;
  private material: MeshStandardMaterial;
  private lineMaterial: LineMaterial;

  get center(): Vector3 {
    this.maybeComputeBounds();
    return this._center;
  }

  get radius(): number {
    this.maybeComputeBounds();
    return this._radius;
  }

  get bbox(): Box3 {
    this.maybeComputeBounds();
    return this._box3
  }

  allMeshes: Mesh[] = [];
  objects: RoomObjectDesc[] = [];
  public damMeshes: Mesh[] = [];
  
  private chunkMap: Map<ChunkType, MeshCollection> = new Map();

  public meshForChunk(chunkType: ChunkType) : Mesh[] {
    const meshCollection = this.chunkMap.get(chunkType);
    if (!meshCollection) {
      return [];
    }
    
    return meshCollection.meshes;
  }

  public setMaterial(chunkType: ChunkType, material: Material, edges: boolean): IDisposable {
    const meshCollection = this.chunkMap.get(chunkType);
    const currentMaterial = edges ? this.sharedMaterials.get(Materials.Edges) : this.sharedMaterials.get(chunkType);
    if (!meshCollection) {
      class NullDispose implements IDisposable {
        dispose() {}
      };

      return new NullDispose();
    }
    meshCollection.applyMaterial(material, edges);

    class Revert implements IDisposable {
      constructor(private material: Material, meshCollection: MeshCollection, private edges: boolean) {}
      dispose() {
        meshCollection.applyMaterial(this.material, this.edges);
      }
    }

    return new Revert(currentMaterial.value, meshCollection, edges);
  }

  public setMaterial2(chunkType: ChunkType, material: Material, edges: boolean): void {
    const meshCollection = this.chunkMap.get(chunkType);
    if (meshCollection)  {
      meshCollection.applyMaterial(material, edges);
    }
  }

  public setInteractable(interactable: boolean): void {
    this.allMeshes.forEach((mesh: Mesh) => {
      if (interactable) {
        mesh.layers.enable(1);
      }
      else {
        mesh.layers.disableAll();
      }
    });

    this.objects.forEach((objDesc: RoomObjectDesc) => {
      if (interactable) {
        objDesc.object.layers.enableAll();
      }
      else {
        objDesc.object.layers.disableAll();
      }
    });

    this.damMeshes.forEach((mesh: Mesh) => {
      if (interactable) {
        mesh.layers.enableAll();
      }
      else {
        mesh.layers.disableAll();
      }
    });
  }

  // simplfied, returns wall material for first mesh.
  public getMaterial(): MeshStandardMaterial {
    return this.material;
  }

  public getEdgesMaterial(): LineMaterial {
    return this.lineMaterial;
  }

  public setObjectsVisible(visible: boolean): void {
    this.objects.forEach((objDesc: RoomObjectDesc) => {
      objDesc.object.visible = visible;
      for (const itemView of objDesc.itemViews) {
        itemView.inputs.visible = visible;
      }
      objDesc.selectable.inputs.enable = visible;
    });
  }

  public setObjectsInteractable(interactable: boolean): void {
    this.objects.forEach((objDesc: RoomObjectDesc) => {
      if (interactable) {
        objDesc.cubeModel.outputs.collider = objDesc.cubeModel.outputs.objectRoot;
        objDesc.furnitureModel.outputs.collider = objDesc.furnitureModel.outputs.objectRoot;
      }
      else {
        objDesc.cubeModel.outputs.collider = null;
        objDesc.furnitureModel.outputs.collider = null;
      }

      objDesc.cubeModel.inputs.colliderEnabled = interactable;
      objDesc.furnitureModel.inputs.colliderEnabled = interactable;
    });
  }

  public setDamVisible(visible: boolean): void {
    this.damMeshes.forEach((mesh: Mesh) => mesh.visible = visible);
  }

  public setGreyBoxVisible(visible: boolean): void {
    this.allMeshes.forEach((mesh: Mesh) => mesh.visible = visible);
  }

  public setVisible(visible: boolean): void {
    this.allMeshes.forEach((mesh: Mesh) => {
      // mesh.visible = visible;
      if (visible) {
        mesh.layers.enableAll();
      }
      else {
        mesh.layers.disableAll();
      }
    });
    if (this.boxHelper) {
      this.boxHelper.visible = false;
    }

    if (this.axesHelper) {
      this.axesHelper.visible = false;
    }

    this.objects.forEach((objDesc: RoomObjectDesc) => objDesc.object.visible = visible);
    this.damMeshes.forEach((mesh: Mesh) => mesh.visible = visible);
  }

  public addMesh(type: ChunkType, mesh: Mesh): void {
    const meshCollection = this.chunkMap.get(type) || new MeshCollection(this.three, this.lineMaterial);
    meshCollection.addMesh(mesh);
    meshCollection.applyMaterial(this.material, false);

    this.chunkMap.set(type, meshCollection);
    this.allMeshes.push(mesh);
    this.boundsDirty = true;
  }

  public addDamMesh(mesh: Mesh): void {
    this.damMeshes.push(mesh);
  }

  public addObject(node: ISceneNode, bbox: Box3, disposables: IDisposable[]): void {

    let cubeModel: SceneComponent = null;
    let furnitureModel: SceneComponent = null;
    let itemViews: SceneComponent[] = [];
    let selectable: SceneComponent;
    for (const component of node.componentIterator()) {
      if (component.componentType === 'mp.objLoader') {
        cubeModel = component;
      }
      else if (component.componentType === 'mp.daeLoader') {
        furnitureModel = component;
      }
      else if (component.componentType === itemViewType) {
        itemViews.push(component);
      }
      else if (component.componentType === selectableType) {
        selectable = component;
      }
    }

    this.objects.push({
      node,
      object: (node as any).obj3D,
      bbox,
      disposables,
      cubeModel,
      furnitureModel,
      itemViews,
      selectable,
    });
  }

  public removeObject(node: ISceneNode): void {
    const search = this.objects.findIndex((objDesc: RoomObjectDesc) => node === objDesc.node);
    if (search !== -1) {
      const objectToRemove = this.objects[search];
      this.objects.splice(search, 1);

      for (const disposable of objectToRemove.disposables) {
        disposable.dispose();
      }
      objectToRemove.disposables = [];
      objectToRemove.node.stop();
    }
  }

  public removeAllObjects(): void {
    for (const objDesc of this.objects) {
      for (const disposable of objDesc.disposables) {
        disposable.dispose();
      }
      objDesc.disposables = [];
      objDesc.node.stop();
    }
    this.objects = [];
  }

  private maybeComputeBounds() {
    if (this.boundsDirty) {
      this.boundsDirty = false;
      
      this._box3 = new Box3();
      this.allMeshes.forEach((mesh: Mesh) => this._box3.expandByObject(mesh));
      const sphere = new Sphere();
      this._box3.getBoundingSphere(sphere);
      this._center.copy(sphere.center);
      this._radius = sphere.radius;

      this.boxHelper = new this.three.Box3Helper(this._box3);
      this.boxHelper.visible = false;
      this.scene.add(this.boxHelper);

      this.axesHelper = new this.three.AxesHelper(2);
      this.axesHelper.position.copy(sphere.center);
      this.axesHelper.visible = false;
      this.scene.add(this.axesHelper);
    }
  }
}

export const createRoomBuilder = (three: typeof THREE, scene: Scene, sharedMaterials: ISharedMaterial, name: string): IRoomBuilder => {
  return new Room(three, scene, sharedMaterials, name);
};

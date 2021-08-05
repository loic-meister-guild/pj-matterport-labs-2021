import THREE, { LineSegments, Material, Mesh } from 'three';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry';
import { Wireframe } from 'three/examples/jsm/lines/Wireframe';
import { modelRenderOrder } from './interfaces';

export class MeshCollection {
  constructor(private three: typeof THREE, private lineMaterial: LineMaterial) {}
  public readonly meshes: Mesh[] = [];

  public applyMaterial(material: Material, edges: boolean) {
    this.meshes.forEach((mesh: Mesh) => {
      if (edges) {
        const lineSegments: LineSegments = mesh.children[0] as LineSegments;
        if (lineSegments) {
          lineSegments.material = material;
          lineSegments.material.needsUpdate = true;
        }
      }
      else {
        mesh.material = material;
        mesh.material.needsUpdate = true;
      }
    });
  }

  public addMesh(mesh: Mesh) {
    this.meshes.push(mesh);

    mesh.castShadow = false;
    mesh.receiveShadow = true;
    mesh.geometry.computeVertexNormals();

    const edges = new this.three.EdgesGeometry(mesh.geometry, 20);
    const geo = (new (this.three as any).LineSegmentsGeometry() as LineSegmentsGeometry).fromEdgesGeometry(edges);
  
    const wireframe = new (this.three as any).Wireframe(geo, this.lineMaterial) as Wireframe;
    wireframe.computeLineDistances();
    wireframe.scale.set(1, 1, 1);
    wireframe.name = 'edges';
    wireframe.renderOrder = modelRenderOrder;

    mesh.add(wireframe);
  }
}
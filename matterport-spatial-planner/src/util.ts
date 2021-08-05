import THREE, { BufferGeometry, LineBasicMaterial, LineSegments, Mesh, Object3D } from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';

export const waitUntil = async (condition: () => boolean) => {
  return new Promise<void>(function (resolve, reject) {
    let intervalId: number;
    const checkCondition = () => {
      if (condition()) {
        clearInterval(intervalId);
        resolve();
      }
    };
    intervalId = window.setInterval(checkCondition, 30);
  });
};


export const makeWireframe = (threeModule: typeof THREE, objectToClone: Object3D) => {
  const root = objectToClone.clone(true);

  const lineMat = new (threeModule as any).LineMaterial({
    color: 0xffffff,
    linewidth: 20, // in pixels
  }) as LineMaterial;
  lineMat.resolution.set( window.innerWidth, window.innerHeight );
  // lineMat.needsUpdate = true;

  root.traverse((obj: Object3D) => {
    console.log(obj);
    if (obj.type === 'Mesh') {
      const mesh = obj as Mesh;
      const parent = mesh.parent;
      const geometry = mesh.geometry as BufferGeometry;
      // const material = mesh.material as Material;

      const wireframe = new (threeModule as any).WireframeGeometry( geometry );

      const lineSeg = new (threeModule as any).LineSegments( wireframe ) as LineSegments;
      (lineSeg.material as LineBasicMaterial).depthTest = true;
      (lineSeg.material as LineBasicMaterial).opacity = 0.01;
      (lineSeg.material as LineBasicMaterial).transparent = true;
      (lineSeg.material as LineBasicMaterial).linewidth = 10;

      const lineGeometry = new (threeModule as any).LineGeometry() as LineGeometry;
      const positions: number[] = [];

      const positionAttr = geometry.getAttribute('position');
      for (let i=0; i<positionAttr.array.length; i += 3) {
        positions.push(positionAttr.array[i]);
        positions.push(positionAttr.array[i+1]);
        positions.push(positionAttr.array[i+2]);
      }

      lineGeometry.setPositions(positions);

      const line = new (threeModule as any).Line2(lineGeometry, lineMat) as Line2;
      line.computeLineDistances();
      
      // if (material) {
      //   material.dispose();
      // }
      geometry.dispose();
      parent.remove(mesh);
      parent.add(lineSeg);
      mesh.geometry = null;
      mesh.material = null;
    }
    
    if (obj.type === 'Line2') {
      const line2 = obj as Line2;
      line2.visible = false;
      line2.parent.remove(line2);
    }
  });

  return root;
}
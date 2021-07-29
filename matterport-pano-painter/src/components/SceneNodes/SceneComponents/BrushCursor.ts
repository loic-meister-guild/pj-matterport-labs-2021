import { SceneComponent, ComponentOutput } from '@mp/common';
import { Vector3, LineBasicMaterial, LineSegments, Mesh, MeshBasicMaterial, Geometry } from 'three';;

const INCH2METER = 0.0254;

class BrushCursor extends SceneComponent implements IBrushCursor {
  private vectorCache = new Vector3();

  private brushPreview: LineSegments;
  private brush: BrushT;
  private disposables: Array<{ dispose(): void; }> = [];

  inputs = {
    enabled: false,
    width: 1.0,
    color: '#ffffff',
    opacity: 1.0,
    position: new Vector3(),
    normal: new Vector3(),
  };

  outputs = {
    brush: null,
  } as Outputs;

  onInit() {
    const THREE = this.context.three;
    const brushGeo = new THREE.CircleGeometry(1.0, 16);
    const previewEdge = new THREE.EdgesGeometry(brushGeo);
    const previewMat = new THREE.LineBasicMaterial({
      transparent: true,
      color: this.inputs.color,
      depthTest: false,
      depthWrite: false,
    });
    this.brushPreview = new THREE.LineSegments(previewEdge, previewMat);
    this.brushPreview.renderOrder = 30;
    brushGeo.dispose();

    const brushMat = new THREE.MeshBasicMaterial({
      color: this.inputs.color,
      opacity: this.inputs.opacity,
      transparent: true,
      blending: THREE.CustomBlending,
      blendDst: THREE.ZeroFactor,
      blendSrc: THREE.OneFactor,
      depthWrite: false,
    });
    this.brush = new THREE.Mesh(brushGeo, brushMat) as BrushT;

    this.disposables.push(
      brushGeo,
      brushMat,
      previewEdge,
      previewMat,
    );

    this.outputs.brush = this.brush;
  }

  onInputsUpdated(prevInputs: IBrushCursor['inputs']) {
    const previewMat = (<LineBasicMaterial> this.brushPreview.material);
    const colorMat = this.brush.material;

    this.outputs.objectRoot = this.inputs.enabled ? this.brushPreview : null;

    if (prevInputs.color !== this.inputs.color) {
      previewMat.color.set(this.inputs.color);
      colorMat.color.copy(previewMat.color);
    }
    colorMat.opacity = this.inputs.opacity;
  }

  onDestroy() {
    this.outputs.objectRoot = null;
    for (const disposable of this.disposables) {
      disposable.dispose();
    }

    this.disposables.length = 0;
  }

  onTick() {
    this.brushPreview.scale.setScalar(this.inputs.width * INCH2METER);
    this.brushPreview.position.copy(this.inputs.position).addScaledVector(this.inputs.normal, 0.001);

    this.vectorCache.copy(this.inputs.position).add(this.inputs.normal);
    this.brushPreview.lookAt(this.vectorCache);

    this.brush.position.copy(this.brushPreview.position);
    this.brush.quaternion.copy(this.brushPreview.quaternion);
    this.brush.scale.copy(this.brushPreview.scale);
  }

}

type Inputs = {
  enabled: boolean;
  width: number;
  color: string;
  opacity: number;
  position: Vector3;
  normal: Vector3;
};

type Outputs = {
  brush: BrushT | null;
} & ComponentOutput;

export type BrushT = Mesh & {
  clone(): BrushT;
  material: MeshBasicMaterial;
  geometry: Geometry;
};

export interface IBrushCursor extends SceneComponent {
  inputs: Inputs;
  outputs: Outputs;
}

export const brushCursorType = 'labs.brushcursor';
export function makeBrushCursor() {
  return new BrushCursor();
}

import { IDisposable } from 'src/interfaces';
import { MathUtils, Mesh, Object3D, Raycaster, Vector2, Vector3 } from 'three';
import { Dict } from '@mp/core';
import { ComponentInteractionType, SceneComponent } from '@mp/common';
import { Mode } from './TransformGizmo2';

const up = new Vector3(0,1,0);

export class PlaneDragHelper implements IDisposable {
  private lastPositionOnPlane: Vector3;
  private tmpPosition: Vector3;
  private tmpPosition2: Vector3;
  public snapPointOnPlane: Vector3;
  private snapRootPoint: Vector3;
  private plane: Mesh;
  private raycaster: Raycaster;
  public dragging = false;
  public xSnapped = false;
  public zSnapped = false;

  constructor(private component: SceneComponent, private mode: Mode, private rootInteractionObject: Object3D,
    private minPosition?: { x: number, y: number, z: number }, private maxPosition?: { x: number, y: number, z: number }) {}

  public init() {
    this.lastPositionOnPlane = new Vector3();
    this.tmpPosition = new Vector3();
    this.tmpPosition2 = new Vector3();
    this.snapPointOnPlane = new Vector3();
    this.snapRootPoint = new Vector3();
    this.raycaster = new this.component.context.three.Raycaster();

    const THREE = this.component.context.three;
    const plane = new THREE.PlaneBufferGeometry(30,30, 2, 2);
    const tmpMaterial = new THREE.MeshStandardMaterial({
      wireframe: true,
    });
    this.plane = new THREE.Mesh(plane, tmpMaterial);
    this.plane.rotateX(-90 * Math.PI/180);
    this.plane.visible = false;
  }

  onEvent(eventType: string, eventData: Dict): void {
    if (eventType === ComponentInteractionType.DRAG_BEGIN) {
      this.dragging = true;
      
      this.plane.position.copy(eventData.point);
      this.lastPositionOnPlane.copy(eventData.point);
      this.rootInteractionObject.getWorldPosition(this.snapRootPoint);
      this.snapPointOnPlane.copy(eventData.point);
      this.rootInteractionObject.worldToLocal(this.plane.position);
      this.rootInteractionObject.add(this.plane);
      this.rootInteractionObject.updateMatrixWorld();

      this.updateDragInteraction(eventData.input.position, true);
    }
    else if (eventType === ComponentInteractionType.DRAG_END) {
      this.updateDragInteraction(eventData.input.position, false);
      this.rootInteractionObject.remove(this.plane);
      this.dragging = false;
    }
    else if (eventType === ComponentInteractionType.DRAG) {
      this.updateDragInteraction(eventData.input.position, false);
    }
  }

  private updateDragInteraction(position: Vector2, begin: boolean): void {
    this.raycaster.setFromCamera(position, (this.component.context as any).camera);
    const intersectionOnPlane = this.raycaster.intersectObject(this.plane);

    let xSnapped = false;
    let zSnapped = false;
    if (intersectionOnPlane && intersectionOnPlane.length > 0) {
      if (!begin) {
        const rootObj = (this.component.context.root as any).obj3D as Object3D;
        if (this.mode === Mode.Translate) {
          //rootObj.getWorldPosition(this.tmpPosition);
          
          // delta from intial snap point
          this.tmpPosition.set(intersectionOnPlane[0].point.x - this.snapPointOnPlane.x, intersectionOnPlane[0].point.y, intersectionOnPlane[0].point.z - this.snapPointOnPlane.z);

          const threshold = 0.15;
          if (Math.abs(this.tmpPosition.x) < threshold) {
            this.tmpPosition.x = 0;
            xSnapped = true;
          }

          if (Math.abs(this.tmpPosition.z) < threshold) {
            this.tmpPosition.z = 0;
            zSnapped = true;
          }

          rootObj.position.set(this.snapRootPoint.x + this.tmpPosition.x, this.snapRootPoint.y, this.snapRootPoint.z + this.tmpPosition.z);

          // apply limits
          if (this.minPosition && this.maxPosition) { 
            rootObj.position.x = MathUtils.clamp(rootObj.position.x, this.minPosition.x, this.maxPosition.x);
            rootObj.position.z = MathUtils.clamp(rootObj.position.z, this.minPosition.z, this.maxPosition.z);
          }
        }
        else {
          // delta vector
          this.tmpPosition.subVectors(intersectionOnPlane[0].point, this.lastPositionOnPlane);
          
          // normalized radial vector
          rootObj.getWorldPosition(this.tmpPosition2).multiplyScalar(-1);
          this.tmpPosition2.add(intersectionOnPlane[0].point);
          const radius = this.tmpPosition2.length();
          this.tmpPosition2.normalize();

          // remove radial component from delta
          const dot = this.tmpPosition2.dot(this.tmpPosition);
          this.tmpPosition.addScaledVector(this.tmpPosition2, -dot);

          // compute tangent to figure out direction
          this.tmpPosition2.cross(up);
          const sign = this.tmpPosition.dot(this.tmpPosition2) > 0 ? -1 : 1;

          const theta = this.tmpPosition.length() * sign / radius;
          rootObj.rotateY(theta);
        }
      }
      this.lastPositionOnPlane.copy(intersectionOnPlane[0].point);
    }

    this.xSnapped = xSnapped;
    this.zSnapped = zSnapped;
  }

  public dispose() {

  }
}
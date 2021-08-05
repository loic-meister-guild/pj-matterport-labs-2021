import { ComponentInteractionType, ISubscription, SceneComponent, DragEvent, PointerButtonMask } from '@mp/common';
import { IEventListener } from '../interfaces';
import { Box3, Euler, Object3D, Vector3, MathUtils } from 'three';
import { Dict } from '@mp/core';

interface Inputs {
  enabled: boolean;
  obj3D: Object3D|null;
}

const yAxis = new Vector3(0,1,0);
const forwardAxis = new Vector3(0,0,-1);
const rightAxis = new Vector3(1,0,0);

class SnapToFloor extends SceneComponent implements IEventListener {
  private intersectionPosition = new Vector3();
  private subs: ISubscription[] = [];
  private initialIntersection: Vector3|null = null;
  private box3: Box3|null = null;
  private tmpPos: Vector3 = new Vector3();
  private cameraEuler: Euler = new Euler();
  private hovering = false;

  inputs: Inputs = {
    enabled: false,
    obj3D: null,
  };

  constructor(private sdk: any) {
    super();
    this.onIntersectionChanged = this.onIntersectionChanged.bind(this);  
    this.onPoseChnaged = this.onPoseChnaged.bind(this);
  }

  onInit() {
    this.subs.push(this.sdk.Pointer.intersection.subscribe(this.onIntersectionChanged));
    this.subs.push(this.sdk.Camera.pose.subscribe(this.onPoseChnaged));

    this.onInputsUpdated();
  }

  onInputsUpdated() {
    if (this.inputs.obj3D) {
      this.box3 = new this.context.three.Box3().setFromObject(this.inputs.obj3D);
    }
    else {
      this.box3 = null;
    }
  }

  onTick() {
    if (this.inputs.enabled && this.box3 && this.intersectionPosition) {
      const obj3D = (this.context.root as any).obj3D as Object3D;
      
      this.tmpPos.set(this.intersectionPosition.x, this.intersectionPosition.y, this.intersectionPosition.z);
      this.tmpPos.addScaledVector(yAxis, this.box3.max.y);
      obj3D.position.copy(this.tmpPos);
    }
  }


  onDestroy() {
    this.subs.forEach((sub: ISubscription) => sub.cancel());
    this.subs = [];
  }

  private onIntersectionChanged(intersection: any) {
    if (intersection){
      if (!this.initialIntersection) {
        this.initialIntersection = new Vector3(intersection.position.x, intersection.position.y, intersection.position.z);
      }

      this.tmpPos.set(intersection.normal.x, intersection.normal.y, intersection.normal.z);
      this.intersectionPosition.set(intersection.position.x, intersection.position.y, intersection.position.z);
    }
  }

  public willHandleEvent?(eventType: string, eventData: Dict): { handle: boolean, eventType?: string } {
    if (eventType === ComponentInteractionType.DRAG) {
      const payload = eventData as DragEvent;
      const canInitiateDrag = this.hovering && (payload.buttons & PointerButtonMask.PRIMARY);
      return {
        handle: canInitiateDrag > 0,
      };
    }
    
    return {
      handle: false,
    };
  }
  
  onEvent(eventType: string, eventData: Dict): void {
    if (eventType === ComponentInteractionType.DRAG) {      
      const dragEvent = eventData.input as DragEvent;
      const obj3D = (this.context.root as any).obj3D as Object3D;
      if(dragEvent.buttons === PointerButtonMask.PRIMARY) {
        const scale = 3;
        this.tmpPos.copy(forwardAxis);
        this.tmpPos.applyEuler(this.cameraEuler);
        this.tmpPos.addScaledVector(yAxis, -this.tmpPos.dot(yAxis));
        this.tmpPos.multiplyScalar(dragEvent.delta.y * scale);

        obj3D.position.add(this.tmpPos);

        this.tmpPos.copy(rightAxis);
        this.tmpPos.applyEuler(this.cameraEuler);
        this.tmpPos.addScaledVector(yAxis, -this.tmpPos.dot(yAxis));
        this.tmpPos.multiplyScalar(dragEvent.delta.x * scale);

        obj3D.position.add(this.tmpPos);
      }
      else if (dragEvent.buttons === PointerButtonMask.SECONDARY) {
        const scale = 4;
        obj3D.rotateY(dragEvent.delta.x * scale);
      }
    }
    else if (eventType === ComponentInteractionType.HOVER) {
      this.hovering = eventData.hover;
    }
  }

  private onPoseChnaged(pose: any) {
    this.cameraEuler.set(MathUtils.degToRad(pose.rotation.x), MathUtils.degToRad(pose.rotation.y), 0, 'XYZ');
  }
}

export const snapToFloorType = 'mp.snapToFloor';

export const createSnapToFloor = (sdk: any) => {
  return () => {
    return new SnapToFloor(sdk);
  };
};

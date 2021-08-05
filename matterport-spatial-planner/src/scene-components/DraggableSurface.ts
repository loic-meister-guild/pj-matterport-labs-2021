import { ComponentInteractionType, DragBeginEvent, PointerButtonMask, SceneComponent } from '@mp/common';
import { Dict, ISubscription } from '@mp/core';
import { GizmoEvents, IEventListener, TranslateEvent } from '../interfaces';
import { ArrowHelper, Mesh, MeshBasicMaterial, NormalBlending, PlaneGeometry, Vector2, Vector3 } from 'three';

const defaultOpacity = 0.02;
const hoverOpacity = 0.2;
interface Inputs {
  offset: {x: number, y: number, z: number};
  scale: {x: number, y: number, z: number};
}

export enum Events {
  // incoming input events
  INPUT_DRAG = 'INPUT_DRAG',
  INPUT_DRAG_BEGIN = 'INPUT_DRAG_BEGIN',
  INPUT_DRAG_END = 'INPUT_DRAG_END',
}

export class DraggableSurface extends SceneComponent implements IEventListener {
  private poseSub: ISubscription|null = null;
  private intersectionSub: ISubscription|null = null;
  private pose: any = null;
  private intersection: any = null;
  private geometry: PlaneGeometry;
  private material: MeshBasicMaterial;
  private mesh: Mesh;
  private hovering: boolean = false;
  private dragging: boolean = false;
  private worldDirection: Vector3 = new Vector3(0,1,0);
  private screenDirection: Vector2 = new Vector2();
  private arrowHelper: ArrowHelper;
  inputs: Inputs = {
    offset: { x: 0, y: 0, z: 0},
    scale: { x: 1, y: 1, z: 1},
  };

  events = {
    [ComponentInteractionType.CLICK]: false,
    [ComponentInteractionType.HOVER]: true,
    [Events.INPUT_DRAG]: true,
    [Events.INPUT_DRAG_BEGIN]: true,
    [Events.INPUT_DRAG_END]: true,
  };
  
  constructor(private sdk: any) {
    super();
    this.onPoseChanged = this.onPoseChanged.bind(this);
    this.onIntersectionChanged = this.onIntersectionChanged.bind(this);
  }

  onPoseChanged(pose: any) {
    this.pose = pose;
  }

  onIntersectionChanged(intersection: any) {
    this.intersection = intersection;
  }

  onInit() {
    this.poseSub = this.sdk.Camera.pose.subscribe(this.onPoseChanged);
    this.intersectionSub = this.sdk.Pointer.intersection.subscribe(this.onIntersectionChanged);

    const THREE = this.context.three;
    this.geometry = new THREE.PlaneGeometry(1, 1);
    this.material = new THREE.MeshBasicMaterial({color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: defaultOpacity});
    this.mesh = new THREE.Mesh(this.geometry, this.material);

    this.arrowHelper = new THREE.ArrowHelper(new Vector3(0,0,1), new Vector3(0,0,0), 0.5);
    this.arrowHelper.visible = false;
    this.mesh.add(this.arrowHelper);
    this.outputs.objectRoot = this.mesh;
    this.outputs.collider = this.mesh;
    this.onInputsUpdated();
  }

  onInputsUpdated() {
    this.mesh.position.set(this.inputs.offset.x, this.inputs.offset.y, this.inputs.offset.z);
    this.mesh.scale.set(this.inputs.scale.x, this.inputs.scale.y, this.inputs.scale.z);
  }

  public willHandleEvent(eventType: string, eventData: Dict): { handle: boolean, eventType?: string } {
    if (eventType === ComponentInteractionType.DRAG_BEGIN) {
      const payload = eventData as DragBeginEvent;
      const canInitiateDrag = this.hovering && (payload.buttons & PointerButtonMask.PRIMARY);
      return {
        handle: canInitiateDrag > 0,
        eventType: Events.INPUT_DRAG_BEGIN,
      };
    }
    else if (eventType === ComponentInteractionType.DRAG) {
      const payload = eventData as TranslateEvent;
      const isDragging = this.dragging && (payload.buttons & PointerButtonMask.PRIMARY);
      return {
        handle: isDragging > 0,
        eventType: Events.INPUT_DRAG,
      };
    }
    else if (eventType === ComponentInteractionType.DRAG_END) {
      return {
        handle: this.dragging,
        eventType: Events.INPUT_DRAG_END,
      };
    }

    return {
      handle: false
    };
  }

  onEvent(eventType: string, eventData: Dict): void {
    if (eventType === ComponentInteractionType.HOVER) {
      if (eventData.hover) {
        this.hovering = true;
        this.material.color.set(0x00aa00);
        this.material.opacity = hoverOpacity;
        this.material.blending = NormalBlending;
        this.arrowHelper.visible = true;
      }
      else {
        this.hovering = false;
        this.material.color.set(0xffffff);
        this.material.opacity = defaultOpacity;
        this.material.blending = NormalBlending;
        this.arrowHelper.visible = false;
      }
    }
    else if (eventType === Events.INPUT_DRAG_BEGIN) {
      const payload = eventData as DragBeginEvent;

      const canInitiateDrag = this.hovering && (payload.buttons & PointerButtonMask.PRIMARY);
      if (!canInitiateDrag) {
        this.notify(ComponentInteractionType.DRAG_BEGIN, eventData);
        return;
      }

      const start = new Vector3(this.intersection.position.x, this.intersection.position.y, this.intersection.position.z);
      this.mesh.getWorldDirection(this.worldDirection);
      const end = new Vector3().copy(start).addScaledVector(this.worldDirection, 0.2);

      // project onto screen
      const iframe = document.getElementById('sdk-iframe') as HTMLIFrameElement;
      const size = {
        w: iframe.clientWidth,
        h: iframe.clientHeight,
      };
      
      const startScreen = this.sdk.Conversion.worldToScreen(start, this.pose, size) as { x: number, y: number, z: number };
      const end2Screen = this.sdk.Conversion.worldToScreen(end, this.pose, size) as { x: number, y: number, z: number };

      this.screenDirection.set(-end2Screen.x, end2Screen.y).sub(new Vector2(-startScreen.x, startScreen.y)).normalize();

      this.dragging = true;
    }
    else if (eventType === Events.INPUT_DRAG) {
      const payload = eventData as TranslateEvent;

      const isDragging = this.dragging && (payload.buttons & PointerButtonMask.PRIMARY);
      if (!isDragging) {
        this.notify(ComponentInteractionType.DRAG, eventData);
        return;
      }

      this.mesh.getWorldDirection(this.worldDirection);
      payload.worldDirection = this.worldDirection;
      payload.screenDirection = this.screenDirection;
      this.notify(GizmoEvents.TRANSLATE, payload);
    }
    else if (eventType === Events.INPUT_DRAG_END) {
      if (!this.dragging) {
        this.notify(ComponentInteractionType.DRAG_END, eventData);
      }

      this.dragging = false;
    }
  }

  onDestroy() {
    this.poseSub.cancel();
    this.intersectionSub.cancel();
  }
}

export const draggableSurfaceType = 'mp.draggableSurface';

export const createDraggableSurface = (sdk: any) => {
  return () => {
    return new DraggableSurface(sdk);
  }
};

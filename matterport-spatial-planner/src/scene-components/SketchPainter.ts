import { ComponentInteractionType, SceneComponent } from '@mp/common';
import { Dict } from '@mp/core';
import { Mesh, Object3D, Vector3 } from 'three';
import { fabric } from 'fabric';

type Inputs = {
  canvas: fabric.Canvas;
  jsonData: any;
  lineDrawing: boolean;
}

const canvasRelativePosition = (function() {
  const tmp = new Vector3();
  return function(worldPoint: Vector3, obj: Object3D, canvas: fabric.Canvas): { x: number, y: number } {
    tmp.copy(worldPoint);
    tmp.sub(obj.position);
    
    obj.worldToLocal(tmp);

    const halfWidth = canvas.width * 0.5;
    const halfHeight = canvas.height * 0.5;
    const x = tmp.x * canvas.width + halfWidth;
    const y = -tmp.y * canvas.height + halfHeight;
    
    return {
      x,
      y,
    };
  };
})();

class SketchPainter extends SceneComponent {
  private tmp: Vector3;
  private lastPoint: Vector3;
  private group: fabric.Group;

  constructor() {
    super();
  }

  inputs: Inputs = {
    canvas: null,
    jsonData: null,
    lineDrawing: false,
  };

  onInit() {
    this.tmp = new this.context.three.Vector3();
    this.lastPoint = new this.context.three.Vector3();

    if (this.inputs.jsonData && this.inputs.canvas) {
      this.inputs.canvas.loadFromJSON(this.inputs.jsonData, () => {
        this.inputs.canvas.requestRenderAll();
      });
    }
  }

  onInputsUpdated(prevInputs: Inputs) {
    if (prevInputs.canvas !== this.inputs.canvas || prevInputs.jsonData !== this.inputs.jsonData) {
      if (this.inputs.jsonData) {
        this.inputs.canvas.loadFromJSON(this.inputs.jsonData, () => {
          this.inputs.canvas.requestRenderAll();
        });
      }
    }
    // if (this.inputs.canvas) {
    //   const rect = new fabric.Rect({
    //     left: 256,
    //     top: 256,
    //     fill: 'red',
    //     width: 256,
    //     height: 256,
    //     hasControls: true,
    //   });

    //   this.inputs.canvas.add(rect);
    // }
  }

  onEvent(eventType: string, eventData: Dict): void {
    if (!eventData.point) {
      return;
    }

    if (!this.inputs.lineDrawing) {
      if (eventType === ComponentInteractionType.CLICK) {
        const point2d = canvasRelativePosition(eventData.point, eventData.collider, this.inputs.canvas);

        const newEvent = new MouseEvent('mousedown', { bubbles: true, cancelable: true, clientX: point2d.x, clientY: point2d.y, buttons: eventData.input.buttons });
        //this.inputs.canvas.getElement().dispatchEvent(newEvent);
        const result = (this.inputs.canvas as any).__onMouseDown(newEvent);
        console.log(result);
        return;
      }
      else if (eventType === ComponentInteractionType.DRAG_BEGIN) {
        const point2d = canvasRelativePosition(eventData.point, eventData.collider, this.inputs.canvas);

        const newEvent = new MouseEvent('mousedown', { bubbles: true, cancelable: true, clientX: point2d.x, clientY: point2d.y, buttons: eventData.input.buttons });
        //this.inputs.canvas.getElement().dispatchEvent(newEvent);
        //this.inputs.canvas.getSelectionElement().dispatchEvent(newEvent);
        (this.inputs.canvas as any).__onMouseDown(newEvent);
        return 
      }
      else if (eventType === ComponentInteractionType.DRAG) {
        const point2d = canvasRelativePosition(eventData.point, eventData.collider, this.inputs.canvas);

        const newEvent = new MouseEvent('mousemove', { bubbles: true, cancelable: true, clientX: point2d.x, clientY: point2d.y, buttons: eventData.input.buttons });
        //this.inputs.canvas.getElement().dispatchEvent(newEvent);
        // this.inputs.canvas.getSelectionElement().dispatchEvent(newEvent);
        (this.inputs.canvas as any).__onMouseMove(newEvent);
        return 
      }
      else if (eventType === ComponentInteractionType.DRAG_END) {
        const point2d = canvasRelativePosition(eventData.point, eventData.collider, this.inputs.canvas);

        const newEvent = new MouseEvent('mouseup', { bubbles: true, cancelable: true, clientX: point2d.x, clientY: point2d.y, buttons: eventData.input.buttons });
        //this.inputs.canvas.getElement().dispatchEvent(newEvent);
        // this.inputs.canvas.getSelectionElement().dispatchEvent(newEvent);
        (this.inputs.canvas as any).__onMouseUp(newEvent);
        return;
      }
    }

    const collider = eventData.collider as Mesh;

    this.tmp.copy(eventData.point);
    this.tmp.sub(collider.position);
    
    collider.worldToLocal(this.tmp);

    const localPoint = new this.context.three.Vector3().copy(this.tmp); 

    const halfWidth = this.inputs.canvas.width * 0.5;
    const halfHeight = this.inputs.canvas.height * 0.5;
    const x = localPoint.x * this.inputs.canvas.width + halfWidth;
    const y = -localPoint.y * this.inputs.canvas.height + halfHeight;

    if (eventType === ComponentInteractionType.DRAG_BEGIN) {
      this.group = new fabric.Group([], {
        selectable: true,
      });
      
      this.inputs.canvas.add(this.group);
      // just copy the point
      this.lastPoint.x = x;
      this.lastPoint.y = y;

      this.group.on('click',() => {
        console.log('CLICK');
      });
      return;
    }
    
    const line = new fabric.Line([this.lastPoint.x, this.lastPoint.y, x, y], {
      stroke: '#00880055',
      strokeWidth: 5,
      selectable: false,
    });

    this.group.addWithUpdate(line);

    this.lastPoint.x = x;
    this.lastPoint.y = y;
    this.inputs.canvas.requestRenderAll();
  }
}

export const sketchPainterType = 'mp.sketchPainter';
export function makeSketchPainter() {
  return function () {
    return new SketchPainter();
  }
}

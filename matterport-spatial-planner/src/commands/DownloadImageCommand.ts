import { BufferGeometry, Mesh, Object3D, Vector3 } from 'three';
import { ChunkType, ICommandFactory, IRoom, RoomObjectDesc } from '../interfaces';
import { fabric } from 'fabric';
import { jsPDF } from 'jspdf';
import { ObservableValue } from '@mp/core';
import { waitUntil } from '../util';

class Line2 extends fabric.Line {
  private ctx: CanvasRenderingContext2D;
  // initialize(options?: IObjectOptions): fabric.Object {
  //   return super.initialize(options);
  // }

  // toObject() {
  //   return super.toObject();
  // }

  render(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    super.render(ctx);

    let xDiff = this.x2 - this.x1;
    let yDiff = this.y2 - this.y1;
    let angle = Math.atan2(yDiff, xDiff);
    this.drawArrow(angle, this.x2, this.y2);
    ctx.save();
    xDiff = -this.x2 + this.x1;
    yDiff = -this.y2 + this.y1;
    angle = Math.atan2(yDiff, xDiff);
    this.drawArrow(angle, this.x1, this.y1);
  }

  drawArrow(angle: number, xPos: number, yPos: number) {
    const strokeDouble = this.strokeWidth * 2;
    const strokeThree = this.strokeWidth * 3;

    this.ctx.save();
    this.ctx.translate(xPos, yPos);
    this.ctx.rotate(angle);
    this.ctx.translate(-strokeDouble, 0);
    this.ctx.beginPath();
    // Move 5px in front of line to start the arrow so it does not have the square line end showing in front (0,0)
    // this.ctx.moveTo(10, 0);
    // this.ctx.lineTo(-15, 15);
    // this.ctx.lineTo(-15, -15);
    this.ctx.moveTo(strokeDouble, 0);
    this.ctx.lineTo(-strokeThree, strokeThree);
    this.ctx.lineTo(-strokeThree, -strokeThree);
    this.ctx.closePath();
    this.ctx.fillStyle = this.stroke;
    this.ctx.fill();
    this.ctx.restore();
  }
}

const transformToCanvas = function(point: Vector3, obj: Object3D, center: Vector3, size: Vector3, canvas: fabric.Canvas) {  
  obj.localToWorld(point);
  point.sub(center);

  const x = point.x / size.x;
  const z = point.z / size.z;

  point.x = (x + 0.5) * canvas.width;
  point.y = (z + 0.5) * canvas.height;

  return point;
};

class DownloadImageCommand {
  constructor(private canvas: ObservableValue<fabric.Canvas|null>, private roomSelection: ObservableValue<IRoom>) {
  }

  public async execute(): Promise<void> {
    const room = this.roomSelection.value;

    if (!room) {
      console.warn('cannot download image with no room selected.');
      return;
    }

    if (!this.canvas.value) {
      console.warn('cannot download image without a canvas assigned to the selected room.');
      return;
    }

    let fabricCanvas: fabric.Canvas|null = null;
    this.canvas.value.clone((clone: fabric.Canvas) => {
      fabricCanvas = clone;
    });

    await waitUntil(() => fabricCanvas !== null);

    const walls = room.meshForChunk(ChunkType.Wall);
    const floors = room.meshForChunk(ChunkType.Floor);
    const size = new Vector3();
    const center = new Vector3();
    room.bbox.getSize(size);
    room.bbox.getCenter(center);

    const toRemove: fabric.Object[] = [];

    const bboxSize = new Vector3();
    const bboxMin = new Vector3();
    const tmpObj = new Object3D();
    room.objects.forEach((objDesc: RoomObjectDesc) => {
      objDesc.bbox.getSize(bboxSize);
      const canvasSizeX = fabricCanvas.width * bboxSize.x / size.x;
      const canvasSizeZ = fabricCanvas.height * bboxSize.z / size.z;

      bboxMin.copy(objDesc.object.position);
      transformToCanvas(bboxMin, tmpObj, center, size, fabricCanvas);
      const angle = -objDesc.object.rotation.y * 180 / Math.PI;
      const rect = new fabric.Rect({
        top: bboxMin.y,
        left: bboxMin.x,
        width: canvasSizeX,
        height: canvasSizeZ,
        fill: 'rgba(0,255,0,0.02)',
        strokeWidth: 7,
        stroke: '#333333',
        strokeLineCap: 'round',
        strokeLineJoin: 'round',
        strokeUniform: true,
        angle,
        originX: 'center',
        originY: 'center',
      });

      fabricCanvas.add(rect);
      fabricCanvas.sendToBack(rect);
      toRemove.push(rect);
    });

    walls.forEach((mesh: Mesh) => {
      const geometry = mesh.geometry as BufferGeometry;
      const points = geometry.attributes.position.array;
      for (let i=0; i<points.length; i += 9) {
        const point0 = transformToCanvas(new Vector3(points[i], points[i+1], points[i+2]), mesh, center, size, fabricCanvas);
        const point1 = transformToCanvas(new Vector3(points[i+3], points[i+4], points[i+5]), mesh, center, size, fabricCanvas);
        const point2 = transformToCanvas(new Vector3(points[i+6], points[i+7], points[i+8]), mesh, center, size, fabricCanvas);
        
        const canvasPoints: { x: number, y: number }[] = [];
        canvasPoints.push({x:point0.x, y:point0.y});
        canvasPoints.push({x:point1.x, y:point1.y});
        canvasPoints.push({x:point2.x, y:point2.y});

        const polygon = new fabric.Polygon(canvasPoints, {
          strokeWidth: 7,
          stroke: '#333333',
          strokeUniform: true,
          strokeLineCap: 'round',
          strokeLineJoin: 'round',
        });
        fabricCanvas.add(polygon);
        fabricCanvas.sendToBack(polygon);
        toRemove.push(polygon);
      }
    });

    floors.forEach((mesh: Mesh) => {
      const geometry = mesh.geometry as BufferGeometry;
      const points = geometry.attributes.position.array;
      for (let i=0; i<points.length; i += 9) {
        const point0 = transformToCanvas(new Vector3(points[i], points[i+1], points[i+2]), mesh, center, size, fabricCanvas);
        const point1 = transformToCanvas(new Vector3(points[i+3], points[i+4], points[i+5]), mesh, center, size, fabricCanvas);
        const point2 = transformToCanvas(new Vector3(points[i+6], points[i+7], points[i+8]), mesh, center, size, fabricCanvas);
        
        const canvasPoints: { x: number, y: number }[] = [];
        canvasPoints.push({x:point0.x, y:point0.y});
        canvasPoints.push({x:point1.x, y:point1.y});
        canvasPoints.push({x:point2.x, y:point2.y});

        const polygon = new fabric.Polygon(canvasPoints, {
          strokeWidth: 10,
          stroke: '#eeeeee',
          strokeUniform: true,
          fill: '#eeeeee',
        });
        fabricCanvas.add(polygon);
        fabricCanvas.sendToBack(polygon);
        toRemove.push(polygon);
      }
    });

    const zoom = 0.85;
    let zoomedWidth = fabricCanvas.width * zoom;
    let zoomedHeight = fabricCanvas.height * zoom;
    const leftOffset = (fabricCanvas.width - zoomedWidth) * 0.5;
    const topOffset = (fabricCanvas.height - zoomedHeight) * 0.5;

    
    const stroke = fabricCanvas.width * 0.003;
    const topPadding = fabricCanvas.height - zoomedHeight;
    const leftPadding = fabricCanvas.width - zoomedWidth;
    const halfTopPadding = topPadding * 0.25;
    const halfLeftPadding = leftPadding * 0.25;
    const verticalFontSize = topPadding / 5;
    const horizontalFontSize = leftPadding / 5;
    const fontSize = verticalFontSize > horizontalFontSize ? verticalFontSize : horizontalFontSize;

    const line2 = new Line2([ -halfLeftPadding, 0, -halfLeftPadding, fabricCanvas.height ], {
      strokeWidth: stroke,
      fill: 'black',
      stroke: 'black',
      originX: 'center',
      originY: 'center',
      hasBorders: false,
      hasControls: false,
      objectCaching: false,
    });
    fabricCanvas.add(line2);

    const line = new Line2([0, -halfTopPadding,  fabricCanvas.width,  -halfTopPadding ], {
      strokeWidth: stroke,
      fill: 'black',
      stroke: 'black',
      originX: 'center',
      originY: 'center',
      hasBorders: false,
      hasControls: false,
      objectCaching: false,
    });
    fabricCanvas.add(line);

    const metersToEnglish = function(distance: number) {
      const feetTotal = distance * 3.2808;
      const feet = Math.trunc(feetTotal);
      const inches = (feetTotal % 1) * 12;
      return `${feet}ft ${Math.trunc(inches)}in`;
    }

    const text = new fabric.Text(` ${metersToEnglish(size.x)} `, {
      fontSize,
      left: fabricCanvas.width * 0.5,
      top: -halfTopPadding - (fontSize * 0.5),
      backgroundColor: 'rgb(255,255,255)',
    });
    fabricCanvas.add(text);

    const text2 = new fabric.Text(` ${metersToEnglish(size.z)} `, {
      fontSize,
      left: -halfLeftPadding - (fontSize * 0.5),
      top: fabricCanvas.height * 0.5,
      angle: -90,
      backgroundColor: 'rgb(255,255,255)',
    });
    fabricCanvas.add(text2);
    
    fabricCanvas.setViewportTransform([zoom, 0, 0, zoom, leftOffset, topOffset]);
    fabricCanvas.renderAll();

    let dataUrl = fabricCanvas.toDataURL({
      format: 'png',
      quality: 0.9,
      withoutTransform: true,
    });

    if (zoomedHeight > zoomedWidth) {
      // rotate the canvas
      zoomedWidth = fabricCanvas.height * zoom;
      zoomedHeight = fabricCanvas.width * zoom;
      let rotated = false;
      rotate90(dataUrl, function(res){
        dataUrl = res;
        rotated = true;
      });
      await waitUntil(() => rotated === true)
    }
   
   function rotate90(src: string, callback: (data: string) => void){
     var img = new Image()
     img.src = src
     img.onload = function() {
       var canvas = document.createElement('canvas')
       canvas.width = img.height
       canvas.height = img.width
       canvas.style.position = "absolute"
       var ctx = canvas.getContext("2d")
       ctx.translate(img.height, img.width / img.height)
       // ctx.translate(img.height, 0);
       ctx.rotate(Math.PI / 2)
       ctx.drawImage(img, 0, 0)
       callback(canvas.toDataURL())
     }
   }

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
//      format: [zoomedWidth, zoomedHeight],
    } as any);
    
    const imageScale = 0.75;
    let imageWidth = doc.internal.pageSize.getWidth() * imageScale;
    let imageHeight = (zoomedHeight * imageWidth) / zoomedWidth;
    const heightScale = imageHeight / doc.internal.pageSize.getHeight();
    if (heightScale > imageScale) {
      imageHeight = doc.internal.pageSize.getHeight() * imageScale;
      imageWidth = (zoomedWidth * imageHeight) / zoomedHeight;
    }

    doc.setTextColor(0,0,0);
    doc.text(room.name, 20, 20);
    // const textDim = doc.getTextDimensions(room.name);
    doc.addImage({
      imageData: dataUrl,
      x: (doc.internal.pageSize.getWidth() - imageWidth) * 0.5,
      y: (doc.internal.pageSize.getHeight() - imageHeight) * 0.5,
      width: imageWidth,
      height: imageHeight,
    });
    doc.save('floorplan.pdf');

    fabricCanvas.dispose();
  }

  public dispose() {
  }
}

class Factory implements ICommandFactory<void> {
  constructor(private canvas: ObservableValue<fabric.Canvas|null>, private roomSelection: ObservableValue<IRoom>) {}
  create() {
    return new DownloadImageCommand(this.canvas, this.roomSelection);
  }
}

export const makeDownloadImageCommandFactory = function(canvas: ObservableValue<fabric.Canvas|null>, roomSelection: ObservableValue<IRoom>): ICommandFactory<void> {
  return new Factory(canvas, roomSelection);
};
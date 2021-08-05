import { SceneComponent, ISceneNode, ComponentInteractionType, IComponentEventSpy, HoverEvent } from '@mp/common/src/SceneComponent';
import { PathPoint } from './PathBuilder';
import { Vector3, MeshStandardMaterialParameters, PerspectiveCamera, Object3D } from 'three';
import { IDisposable } from 'src/interfaces';

type Inputs = {
  path: PathPoint[];
};

export class PathVisualizer extends SceneComponent {
  private startLabel: any;
  private endLabel: any;
  
  private root: Object3D|null = null;
  private objPool: ISceneNode[] = [];
  private lineDisposable: IDisposable|null = null;

  inputs: Inputs = {
    path: [],
  }

  onInit() {
    const THREE = this.context.three;

    this.root = new THREE.Group();
    this.outputs.objectRoot = this.root;

    this.startLabel = this.context.debug.label(`start`, 'Start', new Vector3());
    this.startLabel.config.background = true;
    this.startLabel.opacity = 1;
    this.startLabel.scaleFactor = 0.5;
    this.startLabel.visible = false;
    this.endLabel = this.context.debug.label(`end`, 'End', new Vector3());
    this.endLabel.opacity = 1;
    this.endLabel.scaleFactor = 0.5;
    this.endLabel.visible = false;

    this.createPool();
  }

  private createPool() {
    for (let i=0; i<200; i++) {
      this.objPool.push(this.context.nodeFactory.createNode());
    }

    for(let i=0; i<200; i++) {
      const node = this.objPool[i];
      const loader = node.addComponent('mp.objLoader', {
        url: 'https://static.matterport.com/showcase-sdk/examples/assets-1.0-2-g6b74572/assets/models/mp-logo/brand.obj',
        localScale: { "x": 0.02, "y": 0.02, "z": 0.02 },
        localRotation: { "x": 0, "y": 0, "z": 0 },
        localPosition: { "x": 0, "y": -0.2, "z": 0 }
      }) as SceneComponent;

      class HoverSpy implements IComponentEventSpy<HoverEvent> {
        public eventType = ComponentInteractionType.HOVER;
        constructor(private visualizer: PathVisualizer) {}

        onEvent(event: HoverEvent) {
          this.visualizer.notify(ComponentInteractionType.HOVER, event);
        }
      }

      class ClickSpy implements IComponentEventSpy<any> {
        public eventType = ComponentInteractionType.CLICK;
        constructor(private visualizer: PathVisualizer) {}

        onEvent(event: any) {
          console.log(event);
          this.visualizer.notify(ComponentInteractionType.CLICK, event);
        }
      }

      loader.spyOnEvent(new HoverSpy(this));
      loader.spyOnEvent(new ClickSpy(this));
      
      node.start();
      (node as any).obj3D.visible = false;
    }

    this.renderPath();
  }

  onInputsUpdated() {
    this.renderPath();
  }

  onTick(delta: number) {
    if (this.inputs.path.length > 0) {
      const camera: PerspectiveCamera = (this.context as any).camera;
      const startAbove = new Vector3().copy(this.inputs.path[0].position);
      startAbove.y += 3;
      this.startLabel.setPosition(startAbove);
      this.startLabel.setOrientation(camera.quaternion);
      this.startLabel.visible = true;

      const endAbove = new Vector3().copy(this.inputs.path[this.inputs.path.length-1].position);
      endAbove.y += 3;
      this.endLabel.setPosition(endAbove);
      this.endLabel.setOrientation(camera.quaternion);
      this.endLabel.visible = true;
    }
  }

  onDestroy() {
    for (const node of this.objPool) {
      node.stop();
    }
    this.objPool = [];
  }

  private hide() {
    if (this.lineDisposable) {
      this.lineDisposable.dispose();
    }
    for (let j = 0; j<this.objPool.length; j++) {
      (this.objPool[j] as any).obj3D.visible = false;
    }
  }

  private renderPath() {
    const THREE = this.context.three;
 
    this.hide();

    const materialParams: MeshStandardMaterialParameters = {
      opacity: 0.6,
      transparent: false,
      color: 'rgb(0, 128, 255)',
    };
    // let radius = 0.6;

    const linePoints = [];
    const colors = [];

    const numPoints = this.inputs.path.length;
    // let lastPosition = null;

    for (let j = 0; j<this.objPool.length; j++) {
      (this.objPool[j] as any).obj3D.visible = false;
    }

    for (let i = 0; i<numPoints; ++i) {
      const color = new THREE.Color();
      const point = this.inputs.path[i];

      if (i === 0) {
        materialParams.color = 'rgb(255, 0, 0)';
        const pos = new Vector3().copy(point.position);
        pos.y += 1;
        color.set(0xffff00);
      }
      else if (i === numPoints-1) {
        materialParams.color = 'rgb(0, 0, 255)';
        color.set(0xffff00);
      }
      else {
        materialParams.color = 'rgb(0, 255, 0)';

        const node = this.objPool[i];
        (node as any).obj3D.visible = true;
        node.position.copy(point.position);
        color.set(0xffffff);
      }

      linePoints.push(point.position.x, point.position.y, point.position.z);
      colors.push(color.r, color.g, color.b);
    }
    
    if (linePoints.length > 1) {
      const lineGeometry = new (THREE as any).LineGeometry();
      lineGeometry.setPositions( linePoints );
      lineGeometry.setColors( colors );

      const lineMaterial = new (THREE as any).LineMaterial({
        color: 0xffffff,
        linewidth: 0.005,
        vertexColors: true,
        dashed: true,
      });
      

      const line = new (THREE as any).Line2( lineGeometry, lineMaterial );
      line.computeLineDistances();
      line.scale.set( 1, 1, 1 );

      //this.root.add(line);
      
      this.lineDisposable = {
        dispose: () => {
          this.root.remove(line);
          lineMaterial.dispose();
          lineGeometry.dispose();
        },
      }
    }
  }
}

export const pathVisualizerType = 'fly.pathVisualizer';
export const makePathVisualizer = function() {
  return () => new PathVisualizer();
}

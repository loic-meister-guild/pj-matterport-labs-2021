import { canvasRendererType, ComponentInteractionType, GetSDK, ISceneNode, ISubscription, makeCanvasRenderer, makePlaneRenderer, planeRendererType, SceneComponent, slotType } from '@mp/common';
import { CameraInputEvent, cameraInputType, makeCameraInput } from '@mp/common/src/sdk-components/Camera';
import { Dict, ObservableValue } from '@mp/core';
import { ObservableProxy } from '@mp/core/src/observable/ObservableProxy';
import THREE, { Box3, Euler, Mesh, Object3D, Scene, Vector3, WebGLRenderer } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { Interpreter } from 'xstate';
import { makeAddObjectCommandFactory } from './commands/AddObjectCommand';
import { AddSketchCommand } from './commands/AddSketchCommand';
import { makePool } from './AnimatedNumberPool';
import { FSMEvent, FSMSchema, makeAppFSM } from './ApplicationFSM';
import { ClickEvent, SelectingClickSpy } from './SelectingClickSpy';
import { fetchSimpleModelUrl, IApiMeshAsset } from './graphql';
import { HoverSpy } from './HoverSpy';
import { AppState, ChunkType, ICommandFactoryProvider, IDisposable, IEventService, IPool, IRoom, Materials, MeshDrawStyle, RoomDesc } from './interfaces';
import { animateMaterial } from './MaterialAnimator';
import { createMaterialStack } from './MaterialStack';
import { createMeshDrawStyleUpdate } from './MeshDrawStyleUpdater';
import { createRoomUpdater } from './RoomUpdater';
import { animatedValueType, createAnimatedValue } from './scene-components/AnimatedValue';
import { clippingPlaneType, createClippingPlane } from './scene-components/ClippingPlane';
import { createDraggableSurface, draggableSurfaceType } from './scene-components/DraggableSurface';
import { createEdgesMesh, edgesMeshType } from './scene-components/EdgesMesh';
import { createEventDispatcher, eventDispatcherType } from './scene-components/EventDispatcher';
import { createFabricRenderer, fabricRendererType } from './scene-components/FabricRenderer';
import { createItemView, itemViewType } from './scene-components/ItemView';
import { createPlane, planeType } from './scene-components/Plane';
import { createRoom, roomType } from './scene-components/RoomComponent';
import { createSelectable, selectableType } from './scene-components/Selectable';
import { createSelectableTint, selectableTintType } from './scene-components/SelectableTint';
import { makeSketchPainter, sketchPainterType } from './scene-components/SketchPainter';
import { createSkyDome, skyDomeType } from './scene-components/Skydome';
import { createSlot } from './scene-components/Slots';
import { createSmoothTranslation, smoothTranslationType } from './scene-components/SmoothTranslation';
import { createSnapToFloor, snapToFloorType } from './scene-components/SnapToFloor';
import { createTransformGizmo, transformGizmoType } from './scene-components/TransformGizmo';
import { createSelectionMediator } from './SelectionMediator';
import { setupMaterials } from './SharedMaterials';
import { fabric } from 'fabric';
import { makeDownloadImageCommandFactory } from './commands/DownloadImageCommand';
import { makeAddObjectToRoomCenterCommandFactory } from './commands/AddObjectToRoomCenterCommand';
import { createTransformGizmo2, Mode, transformGizmo2Type } from './scene-components/TransformGizmo2';
import { makeSetGizmoModeCommandFactory } from './commands/SetGizmoModeCommand';
import { makeSetMeshDrawStyleCommandFactory } from './commands/SetMeshDrawStyleCommand';
import { makeRemoveObjectSelectionCommandFactory } from './commands/RemoveObjectSelectionCommand';
import { EditingClickSpy, EditingEvent, EditingEventPayload } from './EditingClickSpy';
import { makeMoveCameraCommandFactory } from './commands/MoveCameraCommand';
import { } from 'lottie-web';
import { bloomEffectType, makeBloomEffect } from './scene-components/BloomEffect';
import Tweakpane from 'tweakpane';
import { RoomLoader } from './RoomLoader';
import { HideElement } from './HideElement';
import { makeUpdateObjectCommandFactory } from './commands/UpdateObjectCommand';
import { makeClearSelectionCommandFactory } from './commands/ClearSelectionCommand';
import { makeAppSerializer } from './AppSerializer';
import { App } from '@mp/save';
import { createSnapAxis, snapAxisType } from './scene-components/SnapAxis';

class SubAdapter implements IDisposable {
  constructor(private sub: ISubscription) {}
  public dispose() {
    this.sub.cancel();
    this.sub = null;
  }
}
class EventService implements IEventService {
  public listeners: SceneComponent[] = [];
  add(component: SceneComponent): void {
    this.listeners.push(component);
  }
}

export class Application2 {
  constructor(private sid: string, private apiHost: string, private applicationKey: string, private debugSave: boolean, private debug: boolean) {
    this.fsm = makeAppFSM(
      this.onEnterIdle,
      this.onEnterWaitingForUser,
      this.onEnterInitializing,
      this.onEnterSelecting,
      this.onExitSelecting,
      this.onEnterEditing,
      this.onExitEditing
    );
  }

  public fsm: Interpreter<unknown, FSMSchema, FSMEvent> = null;
  public state: AppState = {
    rooms: new Map(),
    roomComponents: new Map(),
    roomSelection: new ObservableValue(null),
    objectSelection: new ObservableValue(null),
    meshDrawStyle: new ObservableValue<MeshDrawStyle>(MeshDrawStyle.GreyBox),
    roomHover: new ObservableValue([]),
    clippingHeight: new ObservableValue<number>(0),
    gizmoMode: new ObservableValue<Mode>(Mode.Rotate),
    canvas: new ObservableValue<fabric.Canvas|null>(null),
    sketchPainter: new ObservableValue<SceneComponent>(null),
    selectingStateVisualProps:  {
      // roomHoverOpacity: 0.92,
      roomHoverOpacity: 1.0,
      roomUnhoverOpacity: 0.02,
      roomHoverColor: 0xffffff,
      roomUnhoverColor: 0xffffff,
      edgesUnhoverOpacity:  0.08,
      edgesHoverOpacity: 0.7,
      edgesHoverColor: 0x999999,
      edgesUnhoverColor: 0xc2c2c2,
      edgesHoverWidth: 2,
      edgesUnhoverWidth: 1,
    }
  };
  public commandFactories: ObservableValue<ICommandFactoryProvider|null> =  new ObservableValue<ICommandFactoryProvider>(null);
  private selectionMediator = createSelectionMediator(this.state.objectSelection);
  private sharedMaterials = createMaterialStack();
  private threeModule: typeof THREE;
  private scene: Scene;
  private sdk: any;
  private nodePool: ISceneNode[];
  private clippingPlane: SceneComponent;
  private translationNode: ISceneNode;
  private greyBoxBounds: Box3;
  private cameraInput: SceneComponent;
  private inputComponent: SceneComponent;
  private eventDispatcherComponent: SceneComponent;
  private cameraControl: SceneComponent;
  private eventService: EventService;
  private modelMaterialMutator: any;
  private perStateDisposables: IDisposable[] = [];
  private animatedNumberPool: IPool;
  private _tweakPane: Tweakpane|null = null;

  private get tweakPane() {
    if (!this._tweakPane) {
      this._tweakPane = new Tweakpane();
      this._tweakPane.hidden = true;
    }

    return this._tweakPane;
  }

  private onEnterIdle = async () => {
    this.eventService = new EventService();
  }

  private onEnterWaitingForUser = async () => {
    this.sdk = await GetSDK('sdk-iframe', this.applicationKey);

    await this.sdk.App.state.waitUntil((state: any) => state.phase === this.sdk.App.Phase.LOADING);

    this.fsm.send('USER_READY');
  }

  private onEnterInitializing = async () => {
    await this.sdk.Scene.configure((renderer: WebGLRenderer, three: typeof THREE, _effectComposer: EffectComposer, _scene: Scene) => {
      renderer.physicallyCorrectLights = true;
      this.threeModule = three;
      this.scene = _scene;
    });

    await this.sdk.Settings.update('features/360_views', 0);

    this.nodePool = await this.sdk.Scene.createNodes(500) as ISceneNode[];
    await this.sdk.Scene.registerComponents([
      { name: draggableSurfaceType, factory: createDraggableSurface(this.sdk) },
      { name: cameraInputType, factory: makeCameraInput },
      { name: transformGizmoType, factory: createTransformGizmo },
      { name: eventDispatcherType, factory: createEventDispatcher },
      { name: slotType, factory: createSlot },
      { name: itemViewType, factory: createItemView },
      { name: snapToFloorType, factory: createSnapToFloor(this.sdk) },
      { name: skyDomeType, factory: createSkyDome },
      { name: selectableType, factory: createSelectable(this.selectionMediator) },
      { name: selectableTintType, factory: createSelectableTint(this.state.objectSelection) },
      { name: clippingPlaneType, factory: createClippingPlane },
      { name: edgesMeshType, factory: createEdgesMesh },
      { name: planeType, factory: createPlane },
      { name: roomType, factory: createRoom(this.scene, this.sharedMaterials) },
      { name: smoothTranslationType, factory: createSmoothTranslation },
      { name: animatedValueType, factory: createAnimatedValue },
      { name: sketchPainterType, factory: makeSketchPainter() },
      { name: canvasRendererType, factory: makeCanvasRenderer },
      { name: planeRendererType, factory: makePlaneRenderer },
      { name: fabricRendererType, factory: createFabricRenderer },
      { name: transformGizmo2Type, factory: createTransformGizmo2 },
      { name: bloomEffectType, factory: makeBloomEffect(this.sdk) },
      { name: snapAxisType, factory: createSnapAxis },
    ]);
    
    // setup model mesh components
    const node = this.nodePool.pop();
    const modelMeshComponent = node.addComponent('mp.modelMesh', {
      enabled: true,
    });
    const modelMeshOutputs = modelMeshComponent.outputs as unknown as ObservableProxy<Dict<any>>;
    modelMeshOutputs.onPropertyChanged('materialMutator', (mutator: any) => {
      if (mutator) {
        this.modelMaterialMutator = mutator;
        mutator.set({
          visible: false,
          panoOpacity: 0.0,
          meshOpacity: 1.0,
        });
      }
    });

    this.clippingPlane = node.addComponent(clippingPlaneType);
    node.start();

    const func = await this.sdk.Scene.execute('makeAnimatedNumberPool', makePool(this.nodePool, animatedValueType, 100));
    this.animatedNumberPool = await func.promise;

    const apiMeshes = await fetchSimpleModelUrl(this.apiHost, this.applicationKey, this.sid);

    const modelRooms: Mesh[] = await this.sdk.Scene.query(['room']);
    console.log('Rooms', modelRooms);

    // const geometry = new this.threeModule.PlaneGeometry( 100, 100 );
    // const iframe = document.getElementById('sdk-iframe') as HTMLIFrameElement;
    // const height = iframe.contentWindow.innerHeight;
    // const width = iframe.contentWindow.innerWidth;
    // const verticalMirror = new (this.threeModule as any).Reflector( geometry, {
    //   clipBias: 0.003,
    //   textureWidth: width * window.devicePixelRatio,
    //   textureHeight: height * window.devicePixelRatio,
    //   color: 0xff0101,
    // } );
    // verticalMirror.position.y = -1;
    // verticalMirror.rotateX( - Math.PI / 2 );
    // this.scene.add( verticalMirror );
    
    if (this.debug) {
      this.tweakPane.hidden = false;
      // const defaultInputs = {
      //   threshold: 0.04,
      //   strength: 2.9,
      //   radius: 0.1,
      //   layer: 31,
      //   tintColor: { x: 1.0, y: 0.19, z: 0.35 },
      // };

      // const defaultTint = {
      //   tintColor: { r: 255, g: 49, b: 88 },
      // }

      // const bloomEffectNode = this.nodePool.pop();
      // const bloomComponent = bloomEffectNode.addComponent(bloomEffectType, defaultInputs);
      // bloomEffectNode.start();

      // this.tweakPane.addInput(defaultInputs, 'threshold', { min: 0, max: 4 })
      //   .on('change', (value: unknown) => {
      //     bloomComponent.inputs.threshold = value;
      //   });
      
      // this.tweakPane.addInput(defaultInputs, 'strength', { min: 0, max: 6 })
      //   .on('change', (value: unknown) => {
      //     bloomComponent.inputs.strength = value;
      //   });

      // this.tweakPane.addInput(defaultInputs, 'radius', { min: 0, max: 4 })
      //   .on('change', (value: unknown) => {
      //     bloomComponent.inputs.radius = value;
      //   });
      // this.tweakPane.addInput(defaultTint, 'tintColor')
      //   .on('change', (value: unknown) => {
      //     const color = value as { r: number, g: number, b: number };
      //     bloomComponent.inputs.tintColor = {
      //       x: color.r / 255,
      //       y: color.g / 255,
      //       z: color.b / 255,
      //     };
      //   });
      // this.tweakPane.addInput(defaultInputs, 'layer', { min: 0, max: 31 , step: 1 })
      //   .on('change', (value: unknown) => {
      //     bloomComponent.inputs.layer = value;
      //   });

      const selectingFolder = this.tweakPane.addFolder({
        title: 'Selecting Room Props',
        expanded: false,
      });

      const roomFolder = selectingFolder.addFolder({
        title: 'Room',
      });

      const roomInputs = {
        hoverColor: this.state.selectingStateVisualProps.roomHoverColor,
        hoverOpacity: this.state.selectingStateVisualProps.roomHoverOpacity,
        unhoverColor: this.state.selectingStateVisualProps.roomUnhoverColor,
        unhoverOpacity: this.state.selectingStateVisualProps.roomUnhoverOpacity,
      }

      roomFolder.addInput(roomInputs, 'hoverColor', {
        input: 'color',
      })
      .on('change', (value: unknown) => {
        const color = value as number;
        this.state.selectingStateVisualProps.roomHoverColor = color;
      });

      roomFolder.addInput(roomInputs, 'hoverOpacity', { min: 0, max: 1 , step: 0.001 })
      .on('change', (value: unknown) => {
        this.state.selectingStateVisualProps.roomHoverOpacity = parseFloat(value as string);
      });

      roomFolder.addInput(roomInputs, 'unhoverColor', {
        input: 'color',
      })
      .on('change', (value: unknown) => {
        const color = value as number;
        this.state.selectingStateVisualProps.roomUnhoverColor = color;
      });

      roomFolder.addInput(roomInputs, 'unhoverOpacity', { min: 0, max: 1 , step: 0.001 })
      .on('change', (value: unknown) => {
        this.state.selectingStateVisualProps.roomUnhoverOpacity = parseFloat(value as string);
      });



      const edgesFolder = selectingFolder.addFolder({
        title: 'Edges',
      });

      const edgesInputs = {
        hoverWidth: this.state.selectingStateVisualProps.edgesHoverWidth,
        unhoverWidth: this.state.selectingStateVisualProps.edgesUnhoverWidth,
        hoverOpacity: this.state.selectingStateVisualProps.edgesHoverOpacity,
        unhoverOpacity: this.state.selectingStateVisualProps.edgesUnhoverOpacity,
        hoverColor: this.state.selectingStateVisualProps.edgesHoverColor,
        unhoverColor: this.state.selectingStateVisualProps.edgesUnhoverColor,
      };

      edgesFolder.addInput(edgesInputs, 'hoverWidth', { min: 1, max: 6 , step: 1 })
        .on('change', (value: unknown) => {
          this.state.selectingStateVisualProps.edgesHoverWidth = parseInt(value as string);
          // this.state.selectingStateVisualProps.edgesUnhoverWidth = parseInt(value as string);
          // for (const room of this.state.rooms.values()) {
          //   room.getEdgesMaterial().linewidth = parseInt(value as string);
          // }
        });
      edgesFolder.addInput(edgesInputs, 'unhoverWidth', { min: 1, max: 6 , step: 1 })
        .on('change', (value: unknown) => {
          this.state.selectingStateVisualProps.edgesUnhoverWidth = parseInt(value as string);
          // this.state.selectingStateVisualProps.edgesUnhoverWidth = parseInt(value as string);
          // for (const room of this.state.rooms.values()) {
          //   room.getEdgesMaterial().linewidth = parseInt(value as string);
          // }
        });

      edgesFolder.addInput(edgesInputs, 'hoverOpacity', { min: 0, max: 1 , step: 0.01 })
        .on('change', (value: unknown) => {
          this.state.selectingStateVisualProps.edgesHoverOpacity = parseFloat(value as string);
          // for (const room of this.state.rooms.values()) {
          //   room.getEdgesMaterial().opacity = parseFloat(value as string);
          // }
        });
      edgesFolder.addInput(edgesInputs, 'unhoverOpacity', { min: 0, max: 1 , step: 0.01 })
        .on('change', (value: unknown) => {
          this.state.selectingStateVisualProps.edgesUnhoverOpacity = parseFloat(value as string);
          // for (const room of this.state.rooms.values()) {
          //   room.getEdgesMaterial().opacity = parseFloat(value as string);
          // }
        });

      edgesFolder.addInput(edgesInputs, 'hoverColor', {
          input: 'color',
        })
        .on('change', (value: unknown) => {
          const color = value as number;
          this.state.selectingStateVisualProps.edgesHoverColor = color;
          // for (const room of this.state.rooms.values()) {
          //   room.getEdgesMaterial().color = new Color(color);
          // }
        });
      edgesFolder.addInput(edgesInputs, 'unhoverColor', {
          input: 'color',
        })
        .on('change', (value: unknown) => {
          const color = value as number;
          this.state.selectingStateVisualProps.edgesUnhoverColor = color;
          // for (const room of this.state.rooms.values()) {
          //   room.getEdgesMaterial().color = new Color(color);
          // }
        });
    }

    // TODO: likely remove this.
    this.state.clippingHeight.onChanged((height: number) => {
      this.clippingPlane.inputs.targetHeight = height;
      // lowerClippingPlanes[0].constant = height;
      // upperClippingPlanes[0].constant = -height;
    });


    // setup global lighting
    const dirLight = new this.threeModule.DirectionalLight( 0xffffff, 0.3 );
    dirLight.color.setHSL( 0.1, 1, 0.95 );
    dirLight.position.set(-2,5,-7);
    dirLight.updateMatrixWorld();
    dirLight.target = new this.threeModule.Object3D();
    dirLight.target.position.set(-1.8,4,-6.5);
    dirLight.target.updateMatrixWorld();

    this.scene.add( dirLight );
    this.scene.add(dirLight.target);

    const ambient = new this.threeModule.AmbientLight(new this.threeModule.Color(0xffffff), 2.0);
    this.scene.add(ambient);

    setupMaterials(this.threeModule, this.sharedMaterials, this.tweakPane);

    this.translationNode = this.nodePool.pop();
    this.translationNode.addComponent(planeType, {
      material: this.sharedMaterials.get(Materials.Invisible),
    });
    this.translationNode.start();

    // load the simple model
    function lpad(value: number, padding: number) {
      var zeroes = new Array(padding+1).join("0");
      return (zeroes + value).slice(-padding);
    }

    const loaders: Promise<void>[] = [];
    for (const modelRoom of modelRooms) {
      // extract the floor and room id
      const parts = modelRoom.name.split(/(:|-)/);
      const floorId = parseInt(parts[2]);
      const roomId = parseInt(parts[4]);

      // find the mesh url
      const nameSubstring = `tesselate_${lpad(roomId,3)}`;
      const search = apiMeshes.find((apiMesh: IApiMeshAsset) => {
        return apiMesh.url.includes(nameSubstring);
      });

      if (search) {
        const objLoader = new RoomLoader(this.nodePool, this.state.rooms, this.state.roomComponents, modelRooms);
        loaders.push(objLoader.execute(search.url, floorId, roomId));
      }
    }
    await Promise.all(loaders);
    // const objLoader = new RoomLoader(this.nodePool, this.state.rooms, this.state.roomComponents, modelRooms);
    // await objLoader.execute(url, 0, 2);

    // compute simple model bounds
    this.greyBoxBounds = new this.threeModule.Box3();
    for (const pair of this.state.rooms) {
      pair[1].allMeshes.forEach((mesh:Mesh) => this.greyBoxBounds.expandByObject(mesh));
    }
    const center = new Vector3();
    this.greyBoxBounds.getCenter(center);


    // setup camera and input
    const draggableNode = this.nodePool.pop();
    const cameraPose = await this.sdk.Camera.getPose();
    const poseMatrix = new this.threeModule.Matrix4();
    poseMatrix.fromArray(cameraPose.projection);

    this.cameraInput = draggableNode.addComponent(cameraInputType, {
      startPose: {
        position: new this.threeModule.Vector3(cameraPose.position.x, cameraPose.position.y, cameraPose.position.z),
        quaternion: new this.threeModule.Quaternion().setFromEuler(new Euler(
          cameraPose.rotation.x * Math.PI / 180,
          cameraPose.rotation.y * Math.PI / 180,
          cameraPose.rotation.z * Math.PI / 180,
          'YXZ')),
        projection: poseMatrix.transpose(),
      },
      focus: center,
    });
    
    this.inputComponent = draggableNode.addComponent('mp.input', {
      eventsEnabled: true,
      unfiltered: false,
      userNavigationEnabled: false,
    });

    this.eventService.add(this.cameraInput);
    this.eventDispatcherComponent = draggableNode.addComponent(eventDispatcherType, {
      listeners: this.eventService.listeners,
    });

    this.eventDispatcherComponent.bindEvent(ComponentInteractionType.DRAG_BEGIN, this.inputComponent, ComponentInteractionType.DRAG_BEGIN);
    this.eventDispatcherComponent.bindEvent(ComponentInteractionType.DRAG, this.inputComponent, ComponentInteractionType.DRAG);
    this.eventDispatcherComponent.bindEvent(ComponentInteractionType.DRAG_END, this.inputComponent, ComponentInteractionType.DRAG_END);
    this.cameraControl = draggableNode.addComponent('mp.camera', {
      enabled: true,
    });

    this.cameraControl.bind('camera', this.cameraInput, 'camera');
    this.cameraInput.bindEvent(CameraInputEvent.DragBegin, this.eventDispatcherComponent, ComponentInteractionType.DRAG_BEGIN);
    this.cameraInput.bindEvent(CameraInputEvent.Drag, this.eventDispatcherComponent, ComponentInteractionType.DRAG);
    this.cameraInput.bindEvent(CameraInputEvent.DragEnd, this.eventDispatcherComponent, ComponentInteractionType.DRAG_END);
    this.cameraInput.bindEvent(CameraInputEvent.Key, this.inputComponent, ComponentInteractionType.KEY);
    this.cameraInput.bindEvent(CameraInputEvent.Scroll, this.inputComponent, ComponentInteractionType.SCROLL);

    draggableNode.start();

    createMeshDrawStyleUpdate(this.state.meshDrawStyle, this.state.roomSelection);

    this.commandFactories.value = {
      addObjectFactory: makeAddObjectCommandFactory(this.sdk, this.inputComponent, this.eventDispatcherComponent),
      addObjectToRoomCenterCommandFactory: makeAddObjectToRoomCenterCommandFactory(this.sdk, this.state.objectSelection, this.state.gizmoMode, this.state.roomSelection),
      setGizmoModeCommandFactory: makeSetGizmoModeCommandFactory(this.state.gizmoMode),
      downloadImageCommandFactory: makeDownloadImageCommandFactory(this.state.canvas, this.state.roomSelection),
      setMeshDrawStyleCommandFactory: makeSetMeshDrawStyleCommandFactory(this.state.meshDrawStyle),
      removeObjectSelectionCommandFactory: makeRemoveObjectSelectionCommandFactory(this.state.roomSelection, this.state.objectSelection),
      makeMoveCameraCommandFactory: makeMoveCameraCommandFactory(this.sdk, this.cameraInput, this.greyBoxBounds, this.threeModule),
      makeUpdateObjectCommandFactory: makeUpdateObjectCommandFactory(this.state.objectSelection, this.state.roomSelection),
      clearSelectionCommandFactory: makeClearSelectionCommandFactory(this.state.objectSelection),
    };

    // disable showcase controls
    const hideElement = new HideElement(document.getElementById('sdk-iframe') as HTMLIFrameElement);
    hideElement.hide('.bottom-controls');
    hideElement.hide('#loading-gui');
    hideElement.hide('.highlight-reel');

    await this.sdk.App.state.waitUntil((state: any) => state.phase === this.sdk.App.Phase.PLAYING);

    const serializer = makeAppSerializer(this.state, this.commandFactories.value.addObjectToRoomCenterCommandFactory, () => {});

    const takeScreenshot = async (width: number, height: number) => {
      return await this.sdk.Renderer.takeScreenShot({
        width: 256,
        height: 256,
      });
    };

    new App.AppSaver(this.debugSave ? window : window.parent, serializer, takeScreenshot);

    this.fsm.send('INITIALIZED');
  }

  private onEnterSelecting = async () => {
    // set camera focus to center of model
    const focusPosition = new this.threeModule.Vector3()
    this.greyBoxBounds.getCenter(focusPosition);
    const boundingSphere = new this.threeModule.Sphere();
    this.greyBoxBounds.getBoundingSphere(boundingSphere);  

    // enable room colliders while selecting
    // disable object colliders
    this.state.roomComponents.forEach((roomDesc: RoomDesc) => {
      roomDesc.room.inputs.colliderEnabled = true;
      roomDesc.room.roomBuilder.setObjectsInteractable(false);
    });

    // focus camera on entire model
    this.commandFactories.value.makeMoveCameraCommandFactory.create().execute(null);

    this.perStateDisposables.push(createRoomUpdater(this.animatedNumberPool, this.state.rooms, this.state.roomHover, this.state.selectingStateVisualProps));

    // hide model, furniture and floor canvas
    // set all simple rooms to background mode
    // enable hover appearance
    // enable selection
    this.modelMaterialMutator.set({
      visible: false,
    });
   
    // update application state by monitoring hovers and clicks
    this.state.roomHover.value = []; // reset hover states
    for (const keyValue of this.state.roomComponents) {
      const roomComponent = keyValue[1].room;
      roomComponent.inputs.colliderEnabled = true;
      const room = this.state.rooms.get(roomComponent.inputs.name) as IRoom;
      
      const hoverSpy = new HoverSpy(room, this.state.roomHover);
      const clickSpy = new SelectingClickSpy(room, this.state.roomSelection, this.cameraInput, this.threeModule, this.nodePool);

      clickSpy.events.once(ClickEvent.Primary, () => {
        this.fsm.send('START_EDITING');
      });

      this.perStateDisposables.push(hoverSpy, clickSpy, new SubAdapter(roomComponent.spyOnEvent(hoverSpy)),
        new SubAdapter(roomComponent.spyOnEvent(clickSpy)));
    }
  }

  private onExitSelecting = async () => {
    this.perStateDisposables.forEach((disposable: IDisposable) => disposable.dispose());
    this.perStateDisposables = [];
  }

  private onEnterEditing = async () => {
    this.state.gizmoMode.value = Mode.Rotate;
    this.state.objectSelection.value = null;
    
    const currentRoom = this.state.roomSelection.value;
    const currentRoomDesc = this.state.roomComponents.get(currentRoom.name);

    // initialize room visuals
    // make sure all rooms beside the selection are backgrounded
    this.state.rooms.forEach((room: IRoom) => {
      if (currentRoom !== room) {
        this.perStateDisposables.push(animateMaterial(this.animatedNumberPool, room.getMaterial(), {
          duration: 300,
          target: 0.01,
          edges: false,
        }));
        room.setObjectsVisible(false);
        room.setObjectsInteractable(false);
      }
      else {
        this.perStateDisposables.push(animateMaterial(this.animatedNumberPool, room.getMaterial(), {
          duration: 300,
          target: 1.0,
          edges: false,
        }));
        room.setObjectsVisible(true);
        room.setObjectsInteractable(true);
      }
    });

    // disable room colliders while editing
    this.state.roomComponents.forEach((roomDesc: RoomDesc) => {
      roomDesc.room.inputs.colliderEnabled = false;
    });

    // watch for clicks, clicks on the current room deselect the current object while clicks anywhere else deselect the current room
    const editingClickSpy = new EditingClickSpy(currentRoom, this.inputComponent, this.threeModule, 
      this.cameraInput.outputs.camera);
    editingClickSpy.start();
    editingClickSpy.events.on(EditingEvent.Clicked, async (event: EditingEventPayload) => {
      this.state.objectSelection.value = null;
      
      if (!event.roomClicked) {
        this.state.roomSelection.value = null;
        this.fsm.send('STOP_EDITING');
      }
    });
    this.perStateDisposables.push(editingClickSpy);
    

    // set camera focus to center of room
    this.commandFactories.value.makeMoveCameraCommandFactory.create().execute(this.state.roomSelection.value);

    const room = this.state.roomSelection;
    const box3 = room.value.bbox;
    
    const size = new this.threeModule.Vector3();
    const center = new this.threeModule.Vector3();

    box3.getSize(size);
    box3.getCenter(center);

    // create the sketch node
    const addSketchCommand = new AddSketchCommand(this.sdk);
    const node = await addSketchCommand.execute({ x: size.x, y: size.z }, currentRoomDesc.canvasData);

    // if available, use the top of the floor meshes bounding box, otherwise, default to minimum of the room bounding box.
    const canvasNudge = 0.02;
    let height = box3.min.y + canvasNudge;
    const floorMeshes = currentRoom.meshForChunk(ChunkType.Floor);
    if (floorMeshes.length > 0) {
      const floorBbox = new this.threeModule.Box3();
      for (const floorMesh of floorMeshes) {
        floorBbox.expandByObject(floorMesh);
      }
      height = floorBbox.max.y + canvasNudge;
    }
    
    ((node as any).obj3D as Object3D).position.set(center.x, height, center.z);
    let fabricInstance: fabric.Canvas = null;
    let sketchComponent: SceneComponent = null;
    let planeRendererComponent: SceneComponent = null;
    for (const component of node.componentIterator()) {
      if (component.componentType === fabricRendererType) {
        fabricInstance = component.outputs.canvas;
      }
      else if (component.componentType === sketchPainterType) {
        sketchComponent = component;
      }
      else if (component.componentType === planeRendererType) {
        planeRendererComponent = component;
      }
    }

    this.state.canvas.value = fabricInstance;
    this.state.sketchPainter.value = sketchComponent;

    this.perStateDisposables.push({
      dispose: () => {
        currentRoomDesc.canvasData = fabricInstance.toJSON();
      }
    });

    const sub = this.state.gizmoMode.onChanged(() => {
      const lineDrawing = this.state.gizmoMode.value === Mode.Draw;
      sketchComponent.inputs.lineDrawing = lineDrawing;

      switch(this.state.gizmoMode.value) {
        case Mode.Rotate:
          planeRendererComponent.outputs.collider = null;
          break;

        case Mode.Draw:
          this.state.objectSelection.value = null;
          planeRendererComponent.outputs.collider = planeRendererComponent.outputs.objectRoot;
          break;

        case Mode.AdjustFloor:
          this.state.objectSelection.value = null;
          planeRendererComponent.outputs.collider = planeRendererComponent.outputs.objectRoot;
          break;
      }
    });

    this.perStateDisposables.push({
      dispose() {
        sub.cancel();
      }
    })
    
    const nodeDisposable: IDisposable = {
      dispose() {
        node.stop();
      }
    }
    this.perStateDisposables.push(nodeDisposable);
  }

  private onExitEditing = async () => {
    this.state.canvas.value = null;
    this.state.sketchPainter.value = null;
    this.state.meshDrawStyle.value = MeshDrawStyle.GreyBox;
    this.perStateDisposables.forEach((disposable: IDisposable) => disposable.dispose());
    this.perStateDisposables = [];

    // hide all objects
    for (const room of this.state.rooms) {
      room[1].setGreyBoxVisible(true);
      room[1].setObjectsVisible(false);
    }
  }
}

import React, { Component, Fragment } from 'react';
import { Frame } from './Frame';
import classNames from 'classnames';
import { PaintControls, PaintTool, ToolSettingsT, IPaintToolControls } from './Controls/PaintControls';
import { paintTargetType, makePaintTarget } from './SceneNodes/SceneComponents/PaintTarget';
import { brushCursorType, makeBrushCursor } from './SceneNodes/SceneComponents/BrushCursor';
import { PaintNode, IPaintNotifier } from './SceneNodes/PaintNode';
import { TextureNode } from './SceneNodes/TextureNode';
import { DropperNode } from './SceneNodes/DropperNode';
import { CameraOverrideNode } from './SceneNodes/CameraOverrideNode';
import { textureTargetType, makeTextureTarget } from './SceneNodes/SceneComponents/TextureTarget';
import { dropperType, makeDropper } from './SceneNodes/SceneComponents/Dropper';
import { App } from '@mp/save';
import { History } from './History';
import { Scene } from 'three';
import { HistoryControls } from './Controls/HistoryControls';
import { HistoriedPaintScene } from './HistoriedPaintScene';
import { Dict } from '@mp/core';
import { TextureControls, ITextureSelectControls } from './Controls/TextureControls';
import { KeyWatcher, KeyCallbackMapT, Modifier } from './KeyWatcher/KeyWatcher';
import { Keys } from '@mp/common';
import { appliedTextureType, makeTextureSelector } from './SceneNodes/SceneComponents/TextureSelector';
import { PaintSerializer, PaintDeserializer } from './Save/PaintSaver';
import { TextureSerializer, TextureDeserializer } from './Save/TextureSaver';
import { SaveManager, SaveSerializer, SaveDeserializer } from './Save';
import { brushInputType, makeBrushInput } from './SceneNodes/SceneComponents/BrushInput';

const defaultSid = 'j4RZx7ZGM6T';

type Props = {
  onMount?(modelSid: string): void;
};

type State = {
  sdk: any | undefined;
  error: string | undefined;
  toolSettings: ToolSettingsT;
  textureSettings: {
    descriptors: Array<{ src: string; size: number; }>,
    selected: number;
  };
  inProgress: boolean;
  warning: string;
};

export class Main extends Component<Props, State> {
  private modelSid: string;
  private apiHost: string;
  private applicationKey: string;
  private iframeRef = React.createRef<HTMLIFrameElement>();
  private saver: App.AppSaver;
  private addSaveHandlers: boolean;
  private debugSaver: App.AppSaver;

  private keyWatchers: KeyWatcher[] = [];
  private history: History;

  private painter: PaintNode;
  private texturer: TextureNode;
  private dropper: DropperNode;
  private camera: CameraOverrideNode;

  private enabledTool: { enable(enabled: boolean): void } | null = null;

  private paintControls: IPaintToolControls;
  private textureControls: ITextureSelectControls;

  private mapTextureDescriptorsToUrl: () => string[];

  constructor(props: Props) {
    super(props);

    const urlParams = new URLSearchParams(window.location.search);
    this.addSaveHandlers = !!urlParams.get('debug');
    this.modelSid = urlParams.get('m') || defaultSid;
    this.apiHost  = urlParams.get('apiHost') || '';
    this.applicationKey = urlParams.get('applicationKey') || 'PUT_YOUR_SDK_KEY_HERE';
    this.state = {
      sdk: undefined,
      error: undefined,
      toolSettings: {
        activeTool: PaintTool.NONE,
        size: 5.0,
        color: '#c3e2f6',
        opacity: 0.75,
      },
      textureSettings: {
        descriptors: [
          {
            src: './assets/carpet1.jpg',
            size: 0.5,
          },
          {
            src: './assets/plywood1.jpg',
            size: 1.5,
          },
          {
            src: './assets/brick1.jpg',
            size: 1,
          },
          {
            src: './assets/hardwood1.jpg',
            size: 1.5,
          },
        ],
        selected: -1,
      },
      inProgress: false,
      warning: '',
    };

    this.history = new History();

    class PaintToolControls implements IPaintToolControls {
      private onToolSelected:   (tool: PaintTool) => void;
      private onColorChanged:   (color: string)   => void;
      private onSizeChanged:    (size: number)    => void;
      private onOpacityChanged: (opacity: number) => void;
      constructor(private paintState: Main) {
        this.onToolSelected   = (tool: PaintTool)   => this.paintState.setToolSubstate('activeTool', tool);
        this.onColorChanged   = (color: string)     => this.paintState.setToolSubstate('color', color);
        this.onSizeChanged    = (size: number)      => this.paintState.setToolSubstate('size', size);
        this.onOpacityChanged = (opacity: number)   => this.paintState.setToolSubstate('opacity', opacity);
      }

      get tool() {
        return {
          enabled:    true,
          onSelected: this.onToolSelected,
        };
      }

      get color() {
        return {
          enabled:   this.paintState.state.textureSettings.selected === -1,
          onChanged: this.onColorChanged,
        }
      }

      get size() {
        return {
          enabled:   true,
          onChanged: this.onSizeChanged,
        }
      }

      get opacity() {
        return {
          enabled:   this.paintState.state.textureSettings.selected === -1,
          onChanged: this.onOpacityChanged,
        }
      }
    }

    class TextureSelectControls implements ITextureSelectControls {
      constructor(private paintState: Main) {}
      onSelect(i: number) {
        this.paintState.setState((prevState) => ({
          textureSettings: {
            ...prevState.textureSettings,
            selected: i,
          },
        }));
      }
    }

    this.paintControls = new PaintToolControls(this);
    this.textureControls = new TextureSelectControls(this);

    this.mapTextureDescriptorsToUrl = () => this.state.textureSettings.descriptors.map((desc) => desc.src);
  }

  componentDidMount() {
    if (this.addSaveHandlers && this.props.onMount) {
      this.props.onMount(this.modelSid);
    }
    connectSdk(
      this.iframeRef.current,
      this.applicationKey,
      (sdk) => this.onSdkConnect(sdk),
      (error) => this.setState({ error }));
  }

  componentWillUnmount() {
    if (this.saver) {
      // TODO:
      // this.saver.dispose();
    }
    if (this.debugSaver) {
      // TODO:
      // this.debugSaver.dispose();
    }
    for (const keyWatcher of this.keyWatchers) {
      keyWatcher.dispose();
    }
  }

  private setToolSubstate<K extends keyof ToolSettingsT>(property: K, value: ToolSettingsT[K]) {
    this.setState((prevState) => ({
      toolSettings: {
        ...prevState.toolSettings,
        [property]: value,
      },
    }));
  }

  async onSdkConnect(sdk: State['sdk']) {
    this.hackRemoveBottomUi(this.iframeRef.current);
    this.hackFullscreen(this.iframeRef.current);
    this.attachKeyboardShortcuts(this.iframeRef.current);

    const scenes = {
      paint: new Scene(),
      texture: new Scene(),
    };
    const sceneHistory = new HistoriedPaintScene(this.history, scenes);

    await Promise.all([
      sdk.Scene.register(brushCursorType, makeBrushCursor),
      sdk.Scene.register(brushInputType, makeBrushInput),
      sdk.Scene.register(paintTargetType, function createPaintTarget() {
        return makePaintTarget(sceneHistory.getSceneControl('paint'));
      }),
      sdk.Scene.register(appliedTextureType, makeTextureSelector),
      sdk.Scene.register(textureTargetType, function createTextureTarget() {
        return makeTextureTarget(sceneHistory.getSceneControl('texture'));
      }),
      sdk.Scene.register(dropperType, makeDropper),
    ]);

    type Sweep = {
      alignmentType: string;
    };
    const sweepCollection: Dict<{ aligned: boolean; }> = {};

    sdk.Sweep.data.subscribe({
      onAdded(index: string, item: Sweep) {
        sweepCollection[index] = { aligned: item.alignmentType === 'aligned' };
        setAlignedWarning();
      }
    });

    const currentPose: { sweep: string } = {
      sweep: '',
    }
    sdk.Camera.pose.subscribe({
      onChanged(pose: { sweep: string; }) {
        if (currentPose.sweep !== pose.sweep) {
          currentPose.sweep = pose.sweep;
          if (sweepCollection[currentPose.sweep]) {
            setAlignedWarning();
          }
        }
      }
    });

    const setAlignedWarning = () => {
      const currentSweep = sweepCollection[currentPose.sweep];
      if (currentSweep) {
        this.setState({
          warning: currentSweep.aligned ? '' : 'Navigate to an aligned sweep to use the paint tools',
        });
      }
    }
    const cursorNode = await sdk.Scene.createNode();
    const cursor = cursorNode.addComponent('mp.cursor');

    this.painter = new PaintNode(sdk, await sdk.Scene.createNode(), this.state.toolSettings.size, cursor, new class implements IPaintNotifier {
      constructor(private updatePaintState: (inProgress: boolean) => void) {}
      onBrushStarted() {
        this.updatePaintState(true);
      }
      onBrushEnded() {
        this.updatePaintState(false);
      }
    }((active: boolean) => {
      // TODO: if the UI needs to reflect that painting is currently in progress:
      // this.setState({ inProgress: active });
    }));
    this.texturer = new TextureNode(sdk, await sdk.Scene.createNode(), this.state.toolSettings.size, cursor);

    const sceneSaver = new SaveSerializer(scenes, {
      paint: new PaintSerializer(),
      texture: new TextureSerializer(),
    })
    const saveLoader = new SaveDeserializer(sceneHistory, {
      paint: new PaintDeserializer(this.painter.loader),
      texture: new TextureDeserializer(this.texturer.loader),
    });

    if (!this.addSaveHandlers) {
      this.saver = new App.AppSaver(window.parent, new SaveManager(sceneSaver, saveLoader), (width, height) => sdk.Renderer.takeScreenShot({width, height}));
    } else {
      this.debugSaver = new App.AppSaver(window, new SaveManager(sceneSaver, saveLoader), (width, height) => sdk.Renderer.takeScreenShot({width: 512, height: 512}));
    }

    const updateColors = (color: string) => {
      this.paintControls.color.onChanged(color);
      this.paintControls.tool.onSelected(PaintTool.NONE);
    };

    this.dropper = new DropperNode(sdk, await sdk.Scene.createNode(), cursor, updateColors);
    this.camera = new CameraOverrideNode(sdk, await sdk.Scene.createNode());

    this.setState({ sdk });
    cursorNode.start();
  }

  render() {
    const usingTexture =  this.state.textureSettings.selected !== -1;
    // on tool change, exit current tool before enabling the next tool
    if (this.enabledTool) {
      this.enabledTool.enable(false);
      this.enabledTool = null;
    }
    // disable the camera if we have an active tool
    if (this.camera) {
      this.camera.enable(this.state.toolSettings.activeTool !== PaintTool.NONE);
    }
    if (this.painter && this.state.toolSettings.activeTool === PaintTool.BRUSH && !usingTexture) {
      this.painter.enable(true);
      this.painter.setBrushState(this.state.toolSettings);
      this.enabledTool = this.painter;
    }
    if (this.texturer && this.state.toolSettings.activeTool === PaintTool.BRUSH && usingTexture) {
      this.texturer.enable(true);
      this.texturer.setTextureSettings({
        size: this.state.toolSettings.size,
        activeTexture: this.state.textureSettings.selected,
        textureDescriptors: this.state.textureSettings.descriptors,
      });
      this.enabledTool = this.texturer;
    }
    if (this.dropper && this.state.toolSettings.activeTool === PaintTool.DROPPER) {
      this.dropper.enable(true);
      this.enabledTool = this.dropper;
    }

    return (
      <Fragment>
        <Frame
          getRef={this.iframeRef}
          modelSid={this.modelSid}
          apiHost={this.apiHost}
          applicationKey={this.applicationKey}
        />
        {this.getBannerUi()}
        {!!this.state.sdk && this.getToolUi()}
      </Fragment>
    );
  }

  private getBannerUi() {
    if (this.state.error) {
      return (
        <div
          className='banner error'
        >
          Error connecting to the SDK: {this.state.error}
        </div>
      );
    }

    return (
      <div
        className={classNames('banner', {
          collapsed: !!this.state.sdk && !this.state.warning,
          error: !!this.state.error,
          warning: !this.state.error && !!this.state.warning,
        })}
      >
        {!!this.state.error ? 'Error connecting to the SDK: ' + this.state.error :
          !this.state.sdk ? 'Loading Painting Tools...' :
           this.state.warning ? this.state.warning : 'Loading Complete'}
      </div>
    );
  }

  private getToolUi() {
    const textureUrls = this.mapTextureDescriptorsToUrl();
    return (
      <Fragment>
        <TextureControls
          color={this.state.toolSettings.color}
          textureSettings={{
            urls: textureUrls,
            selected: this.state.textureSettings.selected,
          }}
          textureSelectControls={this.textureControls}
        />
        <PaintControls
          toolSettings={this.state.toolSettings}
          // paintInProgress={this.state.inProgress}
          paintToolControls={this.paintControls}
          enabled={!this.state.warning}
        />
        <HistoryControls
          history={this.history}
        />
      </Fragment>
    );
  }

  private attachKeyboardShortcuts(iframeElement: HTMLIFrameElement) {
    const toolEscapeShortcut = () => {
      if (this.state.toolSettings.activeTool !== PaintTool.NONE) {
        this.setToolSubstate('activeTool', PaintTool.NONE);
      }
    }

    const keyBindings: { [key: number]: KeyCallbackMapT[]; } = {
      [Keys.Z]: [
        {
          modifiers: [[Modifier.META], [Modifier.CTRL]],
          callback: () => this.history.undo(),
        },
        {
          modifiers: [[Modifier.META, Modifier.SHIFT], [Modifier.CTRL, Modifier.SHIFT]],
          callback: () => this.history.redo(),
        }
      ],
      [Keys.Y]: [
        {
          modifiers: [[Modifier.META], [Modifier.CTRL]],
          callback: () => this.history.redo(),
        }
      ],
      [Keys.ESCAPE]: [
        {
          modifiers: [],
          callback: toolEscapeShortcut,
        }
      ]
    };

    this.keyWatchers.push(
      new KeyWatcher(window, keyBindings),
      new KeyWatcher(iframeElement.contentWindow, keyBindings));
  }

  private hackRemoveBottomUi(iframeElement: HTMLIFrameElement) {
    const bottomUiSelector = '.bottom-controls';
    const measureSelector  = '[type=button] .icon-tape-measure';
    const shareSelector    = '[type=button] .icon-share';
    const vrSelector       = '[type=button] .icon-vr';
    const bottomUi = iframeElement.contentDocument.querySelector(bottomUiSelector);
    const measureElement = iframeElement.contentDocument.querySelector(measureSelector) as HTMLElement;
    const shareElement   = iframeElement.contentDocument.querySelector(shareSelector) as HTMLElement;
    const vrElement      = iframeElement.contentDocument.querySelector(vrSelector) as HTMLElement;

    function observeChild(root: Element, childSelector: string) {
      const observer = new MutationObserver(() => {
        const child = root.querySelector(childSelector) as HTMLElement;
        if (child) {
          observer.disconnect();
          child.style.display = 'none';
        }
      });

      observer.observe(root, {
        subtree: true,
        childList: true,
      });
    }

    function observeOrRemoveChild(child: HTMLElement | null, root: Element, childSelector: string) {
      if (!child) {
        observeChild(root, childSelector);
      } else {
        child.style.display = 'none';
      }
    }

    if (!bottomUi) {
      const bodyObserver = new MutationObserver(() => {
        const bottom = iframeElement.contentDocument.querySelector(bottomUiSelector);
        if (bottom) {
          observeChild(bottom, measureSelector);
          observeChild(bottom, shareSelector);
          observeChild(bottom, vrSelector);
          bodyObserver.disconnect();
        }
      });
      bodyObserver.observe(iframeElement.contentDocument.body, {
        subtree: true,
        childList: true,
      });
    } else {
      observeOrRemoveChild(measureElement, bottomUi, measureSelector);
      observeOrRemoveChild(shareElement, bottomUi, shareSelector);
      observeOrRemoveChild(vrElement, bottomUi, vrSelector);
    }
  }

  private hackFullscreen(iframeElement: HTMLIFrameElement) {
    const fsElement = iframeElement.contentDocument.querySelector('.fullscreen-mode .icon-fullscreen');
    // if there is no fullscreen button, fullscreen probably isn't supported
    if (!fsElement) return;
    fsElement.addEventListener('click', (ev) => {
      ev.stopImmediatePropagation();
      ev.stopPropagation();
      const rootElem = document.body;

      const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
      const requestFullscreen = rootElem.requestFullscreen || rootElem.webkitRequestFullscreen || rootElem.mozRequestFullScreen || rootElem.msRequestFullscreen;
      const exitFullscreen    = document.exitFullscreen    || document.webkitExitFullscreen    || document.mozCancelFullScreen  || document.msExitFullscreen;

      if (fullscreenElement) {
        exitFullscreen.call(document);
        fsElement.classList.remove('icon-fullscreen-exit');
        fsElement.classList.add('icon-fullscreen');
      } else {
        requestFullscreen.call(rootElem);
        fsElement.classList.remove('icon-fullscreen');
        fsElement.classList.add('icon-fullscreen-exit');
      }
    }, true);
  }
}

function connectSdk(iframe: HTMLIFrameElement, applicationKey: string, onConnect: (sdk: State['sdk']) => void, onError: (error: string) => void): void {
  iframe.addEventListener('load', async function () {
    try {
      const sdk = await (iframe.contentWindow as any).MP_SDK.connect(iframe, applicationKey, '3.5');
      onConnect(sdk);
    } catch (e) {
      onError(e);
    }
  });
}

// Vendor specific full screen functions
declare global {
  interface Document {
    readonly fullscreenElement?: Element;
    readonly mozFullScreenElement?: Element;
    readonly webkitFullscreenElement?: Element;
    readonly msFullscreenElement?: Element;

    readonly fullscreenEnabled: boolean;
    readonly mozFullScreenEnabled?: boolean;
    readonly webkitFullscreenEnabled?: boolean;
    readonly msFullscreenEnabled?: boolean;

    mozCancelFullScreen?(): void;
    webkitExitFullscreen?(): void;
    msExitFullscreen?(): void;
  }
  interface Element {
    mozRequestFullScreen?(): void;
    webkitRequestFullscreen?(): void;
    msRequestFullscreen?(): void;
  }

}

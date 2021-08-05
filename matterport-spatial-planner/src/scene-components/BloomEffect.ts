import THREE, { Layers, Material, Mesh, MeshBasicMaterial, Object3D } from 'three';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { SceneComponent } from '@mp/common';

const defaultInputs: Inputs = {
  threshold: 0.1,
  strength: 0.1,
  radius: 1.0,
  layer: 31,
  tintColor: {x: 1, y: 1, z: 1 },
}

type Inputs = {
  threshold: number;
  strength: number;
  radius: number;
  layer: number;
  tintColor: {x: number, y: number, z: number },
}

interface IDisposable {
  dispose(): void;
}

class BloomEffect extends SceneComponent {
  private disposable: IDisposable|null = null;
  private bloomComposer: EffectComposer;
  private finalComposer: EffectComposer;
  private bloomLayer: Layers;
  private materials: Map<string, Material | Material[]> = new Map();
  private darkMaterial: MeshBasicMaterial;
  private bloomPass: UnrealBloomPass;
  private transformObj: Object3D = null;
  
  constructor(private sdk: any) {
    super();
    this.onConfigure = this.onConfigure.bind(this);
    this.darkenNonBloomed = this.darkenNonBloomed.bind(this);
    this.restoreMaterial = this.restoreMaterial.bind(this);
  }

  inputs: Inputs = {
    ...defaultInputs,
  }

  onInit() {
    this.darkMaterial = new this.context.three.MeshBasicMaterial({ color: 0x000000 });
    this.sdk.Scene.configure(this.onConfigure);
  }

  onInputsUpdated() {
    if (this.bloomPass) {
      this.bloomPass.strength = this.inputs.strength;
      this.bloomPass.threshold = this.inputs.threshold;
      this.bloomPass.radius = this.inputs.radius;
     
      for (const color of this.bloomPass.bloomTintColors) {
        color.set(this.inputs.tintColor.x, this.inputs.tintColor.y, this.inputs.tintColor.z);
      }
    }

    this.bloomLayer.set(this.inputs.layer);
  }

  onConfigure(renderer: any, three: typeof THREE, effectComposer: EffectComposer) {
    const iframe = document.getElementById('sdk-iframe') as HTMLIFrameElement;
    const height = iframe.contentWindow.innerHeight;
    const width = iframe.contentWindow.innerWidth;

    this.bloomLayer = new three.Layers();
		this.bloomLayer.set(this.inputs.layer);

    const pixelRatio = this.context.renderer.getPixelRatio();
    console.log(pixelRatio);
    this.bloomPass = new (three as any).UnrealBloomPass( new three.Vector2( width, height ), this.inputs.strength, this.inputs.radius, this.inputs.threshold );

    this.bloomComposer = effectComposer;
    this.bloomComposer.renderToScreen = false;
    this.bloomComposer.addPass(this.bloomPass);

    /*
    effectFXAA = new ShaderPass( FXAAShader );
    effectFXAA.uniforms[ 'resolution' ].value.x = 1 / ( window.innerWidth * pixelRatio );
    effectFXAA.uniforms[ 'resolution' ].value.y = 1 / ( window.innerHeight * pixelRatio );
    composer.addPass( effectFXAA );   
    */
    function vertexShader(): string {
      return `
        varying vec2 vUv;

        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }
      `;
    }
    
    function fragmentShader() {
      return `
        uniform sampler2D baseTexture;
        uniform sampler2D bloomTexture;

        varying vec2 vUv;

        void main() {
          gl_FragColor = ( texture2D( baseTexture, vUv ) + vec4( 1.0 ) * texture2D( bloomTexture, vUv ) );
        }
      `;
    }

    const finalPass = new (three as any).ShaderPass(
      new three.ShaderMaterial( {
        uniforms: {
          baseTexture: { value: null },
          bloomTexture: { value: this.bloomComposer.renderTarget2.texture }
        },
        vertexShader: vertexShader(),
        fragmentShader: fragmentShader(),
        defines: {}
      } ), "baseTexture"
    );
    finalPass.needsSwap = true;

    this.finalComposer = new (three as any).EffectComposer( renderer );
    this.finalComposer.addPass( effectComposer.passes[0] );
    this.finalComposer.addPass(finalPass);
  }

  onTick(delta: number) {
    if (this.bloomComposer && this.finalComposer) {
      if (!this.transformObj) {
        this.transformObj = this.context.scene.getObjectByName('TRANSFORM_NODE');
        this.context.scene.remove(this.transformObj);
      }
      
      this.context.scene.traverse(this.darkenNonBloomed);
			this.bloomComposer.render();

      if (this.transformObj) {
        this.context.scene.add(this.transformObj);
      }
      
      this.transformObj = null;
			this.context.scene.traverse(this.restoreMaterial);
      this.finalComposer.render();
    }
  }

  darkenNonBloomed( obj: Object3D ) {
    const darkenType = obj.type === 'Mesh' || obj.type === 'Wireframe';
    if ( darkenType && this.bloomLayer.test( obj.layers ) === false ) {
      const mesh: Mesh = obj as Mesh;
      this.materials.set(obj.uuid, mesh.material);
      mesh.material = this.darkMaterial;
    }
  }

  restoreMaterial( obj: Object3D ) {
    if (this.materials.has(obj.uuid)) {
      const mesh = obj as Mesh;
      mesh.material = this.materials.get(obj.uuid);
      this.materials.delete(obj.uuid);
    }
  }

  onDestroy() {
    this.releaseResources();
  }

  private releaseResources() {
    if (this.disposable) {
      this.disposable.dispose();
      this.disposable = null;
    }
  }
}

export const bloomEffectType = 'mp.bloomEffect';
export const makeBloomEffect = function(sdk: any) {
  return () => {
    return new BloomEffect(sdk);
  }
}

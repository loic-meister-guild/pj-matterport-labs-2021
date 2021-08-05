import { SceneComponent } from "@mp/common";
import TWEEN from '@tweenjs/tween.js';

export const gridType = 'grid';
export const makeGrid = () => {
  return () => new Grid();
}

function gradientFragmentShader() {
  return `
    uniform vec3 topColor;
    uniform vec3 bottomColor;
    uniform float offset;
    uniform float exponent;
    varying vec3 vWorldPosition;
    void main() {
      float h = normalize( vWorldPosition + offset ).y;
      gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h , 0.0), exponent ), 0.0 ) ), 1.0 );
    }
  `;
}

function gradientVertexShader() {
  return `
    varying vec3 vWorldPosition;
    void main() {
      vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
  `;
}

type Inputs = {
  bloomThreshold: number;
  bloomStrength: number;
  bloomRadius: number;
};


class Grid extends SceneComponent {
  private bloomPass: any;
  private time: number = 0;

  inputs: Inputs = {
    bloomThreshold: 0.9,
    bloomStrength: 0.4,
    bloomRadius: 0.8,
  }

  constructor() {
    super();
  }

  async onInit() {
    const THREE = this.context.three;
    const modelMeshModule = (this.context as any).modelMeshModule;

    const meshCollider = modelMeshModule.collider;

    for (const collider of meshCollider.allColliders) {
      meshCollider.removeFromRaycasting(collider);
    }

    this.bloomPass = new (THREE as any).UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
    this.context.composer.addPass(this.bloomPass);

    // Workaround THREE.js types by clearly defining the material on the GridHelper
    class GridHelper extends THREE.GridHelper {
      constructor(size: number, divisions: number, color1?: THREE.Color | number, color2?: THREE.Color | number) {
        super(size, divisions, color1, color2);
      }
      public material: THREE.LineBasicMaterial;
    }

    const obj3D = new THREE.Object3D();
    const grid = new GridHelper( 200, 200, 0xffffff, 0x777777 );
		grid.material.opacity = 0.3;
		grid.material.transparent = true;
    obj3D.add(grid);

    var uniforms = {
      "topColor": { value: new THREE.Color( 0x001144 ) },
      "bottomColor": { value: new THREE.Color( 0x88AADD ) },
      "offset": { value: 2 },
      "exponent": { value: 0.4 }
    };

    const skyDomeRadius = 100
    var skyGeo = new THREE.SphereBufferGeometry(skyDomeRadius, 32, 15 );
    var skyMat = new THREE.ShaderMaterial( {
      uniforms: uniforms,
      vertexShader: gradientVertexShader(),
      fragmentShader: gradientFragmentShader(),
      side: THREE.BackSide
    } );
    var sky = new THREE.Mesh( skyGeo, skyMat );
    obj3D.add(sky);

    var geometry = new THREE.SphereGeometry( skyDomeRadius - 5, 32, 15, 0, Math.PI, 0, Math.PI );
    var material = new THREE.MeshBasicMaterial( {color: 0x000000, side: THREE.DoubleSide} );
    var plane = new THREE.Mesh( geometry, material );
    plane.rotateX(Math.PI / 2);
    plane.position.set(0,0,0);
    obj3D.add(plane);
    obj3D.scale.set(2,2,2);

    this.outputs.objectRoot = obj3D;

    this.onInputsUpdated();
  }

  onInputsUpdated() {
    this.bloomPass.threshold = this.inputs.bloomThreshold;
    this.bloomPass.strength = this.inputs.bloomStrength;
    this.bloomPass.radius =this.inputs.bloomRadius;
  }

  onTick(delta: number) {
    this.time += delta;
    TWEEN.update(this.time);
    
    // provide our own global time to all tweens.
    (TWEEN as any).mpTime = this.time;
  }
}

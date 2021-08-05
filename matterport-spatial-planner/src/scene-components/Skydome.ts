import { SceneComponent } from '@mp/common';

const vertexShader = `
varying vec3 vWorldPosition;

void main() {

  vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
  vWorldPosition = worldPosition.xyz;

  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

}
`;

const fragmentShader = `
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

class SkyDome extends SceneComponent {
  onInit() {
    const THREE = this.context.three;

    const uniforms = {
      "topColor": { value: new THREE.Color( 0x0099ff ) },
      "bottomColor": { value: new THREE.Color( 0x0099ff ) },
      "offset": { value: -3 },
      "exponent": { value: 0.4 }
    };

    const skyGeo = new THREE.SphereBufferGeometry( 8, 32, 15 );
    const skyMat = new THREE.ShaderMaterial( {
      uniforms: uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      side: THREE.BackSide
    } );

    const sky = new THREE.Mesh( skyGeo, skyMat );
    sky.position.set(0, 3.4, -6);
    this.outputs.objectRoot = sky;
  }
}

export const skyDomeType = 'mp.skyDome';

export const createSkyDome = () => {
  return new SkyDome();
};

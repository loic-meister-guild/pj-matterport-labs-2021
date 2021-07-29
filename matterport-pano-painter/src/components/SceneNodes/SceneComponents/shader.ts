import { Texture } from 'three';

export const overlay = {
  vertex: `precision highp float;

    attribute vec3 position;
    attribute vec2 uv;

    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = vec4(position.xy, -1.0, 1.0);
    }
  `,
  fragment: `precision highp float;
    uniform sampler2D tMap;

    varying vec2 vUv;

    void main() {
      gl_FragColor = texture2D(tMap, vUv);
    }
  `,
  createUniforms() {
    return {
      tMap: { value: null as Texture },
    };
  }
}

export const worldMapped = {
  vertex: `precision highp float;
    uniform mat4 modelMatrix;
    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    uniform float textureScale;

    attribute vec3 position;
    attribute vec2 uv;

    varying vec2 vUv;

    void main() {
      vUv = (modelMatrix * vec4(position, 1.0)).xz * textureScale;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }

  `,
  fragment: `precision highp float;
    uniform sampler2D tMap;

    varying vec2 vUv;

    void main() {
      gl_FragColor = texture2D(tMap, vUv);
    }
  `,
  createUniforms() {
    return {
      tMap: { value: null as Texture },
      textureScale: { value: 1 },
    }
  }
}

import { SceneComponent, ComponentOutput } from '@mp/common';
import { Texture } from 'three';
import { Dict } from '@mp/core';

// HACK: since this code is run inside an iframe, the path to assets is slightly different
const __ASSET_RELATIVE_PATH__ = '../';

export type TextureDescriptor = {
  src: string;
  size: number;
};

type Inputs = {
  textureDescs: TextureDescriptor[];
  activeTexture: number;
};

type Outputs = {
  texture: Texture | null;
  textureScale: number;
} & ComponentOutput;

class TextureSelector extends SceneComponent {
  private textures: Dict<Texture> = {};

  inputs = {
    textureDescs: [],
    activeTexture: 0,
  } as Inputs;

  outputs = {
    texture: null,
    textureScale: 1,
  } as Outputs;

  onInit() {
    const THREE = this.context.three;

    for (const textureDesc of this.inputs.textureDescs) {
      const texture = new THREE.TextureLoader().load(textureDesc.src);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
    }
  }

  onInputsUpdated() {
    // dispose of any textures that are no longer in the inputs
    const currentTextures = Object.keys(this.textures);
    const inputTextures = this.inputs.textureDescs.map((textureDesc) => textureDesc.src);
    const texturesToDispose = currentTextures.filter((textureSrc) => inputTextures.indexOf(textureSrc) === -1);

    for (const textureToDispose of texturesToDispose) {
      if (this.textures[textureToDispose]) {
        this.textures[textureToDispose].dispose();
        delete this.textures[textureToDispose];
      }
    }

    // allocate any textures that are new in the inputs object
    const THREE = this.context.three;
    const textureLoader = new THREE.TextureLoader();
    for (const inputTexture of this.inputs.textureDescs) {
      if (!this.textures[inputTexture.src]) {
        const texture = textureLoader.load(__ASSET_RELATIVE_PATH__ + inputTexture.src);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;

        this.textures[inputTexture.src] = texture;
      }
    }

    if (this.inputs.activeTexture >= this.inputs.textureDescs.length || this.inputs.activeTexture < 0) {
      this.outputs.texture = null;
    } else {
      const activeTextureDesc = this.inputs.textureDescs[this.inputs.activeTexture];
      this.outputs.texture = this.textures[activeTextureDesc.src];
      const textureSize = isNaN(activeTextureDesc.size) ? 1 : activeTextureDesc.size;
      this.outputs.textureScale = 1 / textureSize;
    }
  }

}


export interface ITextureSelector {
  inputs: Inputs;
  outputs: Outputs;
}

export const appliedTextureType = 'labs.texture';
export function makeTextureSelector() {
  return new TextureSelector();
}

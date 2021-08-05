import { ISceneNode, SceneComponent } from '@mp/common';
import { ISubscription, ObservableValue } from '@mp/core';
import { Color, MeshPhysicalMaterial } from 'three';

type Inputs = {
  material:  MeshPhysicalMaterial|null;
}

class SelectableTint extends SceneComponent {
  private originalColor: Color|null = null;
  private subs: ISubscription[] = [];
  inputs: Inputs = {
    material: null,
  };

  constructor(private selection: ObservableValue<ISceneNode|null>) {
    super();

    this.onInputsUpdated = this.onInputsUpdated.bind(this);
  }

  onInit() {
    this.subs.push(this.selection.onChanged(this.onInputsUpdated));
    this.onInputsUpdated();
  }

  onInputsUpdated() {
    if (this.inputs.material) {
      if (this.originalColor === null) {
        this.originalColor = this.inputs.material.color;
      }

      if (this.selection.value === this.context.root) {
        this.inputs.material.color = new Color(0xff3158);
        this.inputs.material.blending = this.context.three.AdditiveBlending;
      } else {
        this.inputs.material.color = this.originalColor;
        this.inputs.material.blending = this.context.three.NormalBlending;
      }
    }
  }

  onDestroy() {
    this.subs.forEach((sub: ISubscription) => sub.cancel());
    this.subs = [];
  }
}

export const selectableTintType = 'mp.selectableTint';

export const createSelectableTint = (selection: ObservableValue<ISceneNode|null>) => {
  return () => {
    return new SelectableTint(selection);
  };
};

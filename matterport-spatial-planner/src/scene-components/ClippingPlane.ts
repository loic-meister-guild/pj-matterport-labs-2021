import { ComponentOutput, SceneComponent } from '@mp/common';
import TWEEN from '@tweenjs/tween.js';
import { Plane } from 'three';

type Inputs = {
  targetHeight: number;
}

type Outputs = {
  upperClipPlane: Plane|null;
  lowerClipPlane: Plane|null;
  transitioning: boolean;
} & ComponentOutput;

class ClippingPlane extends SceneComponent {
  private height: { value: number } = { value: 0 };
  private tween: any = null;
  private time: number = 0;

  inputs: Inputs = {
    targetHeight: 0,
  };

  outputs = {
    upperClipPlane: null,
    lowerClipPlane: null,
    transitioning: false,
  } as Outputs;

  onInit() {
    const THREE = this.context.three;
    this.outputs.lowerClipPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), this.inputs.targetHeight);
    this.outputs.upperClipPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), this.inputs.targetHeight);
  }

  onTick(delta: number) {
    this.time += delta;

    if (!this.outputs.transitioning) {
      if (this.height.value !== this.inputs.targetHeight) {
        const distance = Math.abs(this.height.value - this.inputs.targetHeight);
        const speed = 6; // m/s
        const duration = 1000 * distance / speed
        // start an animation.
        const target = {
          value: this.inputs.targetHeight,
        };

        this.tween = new TWEEN.Tween<{ value: number}>(this.height)
          .to(target)
          .easing(TWEEN.Easing.Cubic.Out)
          .duration(duration)
          .onStart(() => {
            this.outputs.transitioning = true;
          })
          .onComplete(() => {
            this.outputs.transitioning = false;
          })
          .start(this.time);

          this.outputs.transitioning = true;
      }
    }

    if (this.tween && this.outputs.transitioning) {
      this.tween.update(this.time);
    }

    this.outputs.lowerClipPlane.constant = -this.height.value;
    this.outputs.upperClipPlane.constant = this.height.value;
  }
}

export const clippingPlaneType = 'mp.clippingPlane';

export const createClippingPlane = () => {
  return new ClippingPlane();
};

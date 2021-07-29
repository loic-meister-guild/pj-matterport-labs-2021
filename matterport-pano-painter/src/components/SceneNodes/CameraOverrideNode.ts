import { Camera, Euler } from 'three';
import { SceneComponent } from '@mp/common';

export class CameraOverrideNode {
  private camera = new Camera();
  private eulerHelper = new Euler();
  private subs: { cancel(): void }[];

  private cameraOverride: SceneComponent;

  constructor(sdk: any, private node: any) {
    this.cameraOverride = node.addComponent('mp.camera', {
      camera: this.camera,
    });

    node.start();
    this.createSdkSubscriptions(sdk);
  }

  dispose() {
    for (const sub of this.subs) {
      sub.cancel();
    }
    this.node.stop();
  }

  enable(enabled: boolean) {
    this.cameraOverride.inputs.enabled = enabled;
  }

  private createSdkSubscriptions(sdk: any) {
    this.subs = [
      sdk.Camera.pose.subscribe((pose: any) => {
        this.camera.position.copy(pose.position);
        this.eulerHelper.set(pose.rotation.x * Math.PI / 180, pose.rotation.y * Math.PI / 180, 0, 'YXZ');
        this.camera.quaternion.setFromEuler(this.eulerHelper);
      }),
    ];
  }
}

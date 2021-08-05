import { SceneComponent } from '@mp/common/src/SceneComponent';

export class Grip extends SceneComponent {
  private dispose: ()=> void|null = null;

  onInit() {
    this.allocateMesh();
  }

  onInputsUpdated() {
    this.allocateMesh();
  }

  private releaseMesh() {
    if (this.dispose) {
      this.dispose();
      this.dispose = null;
    }
  }

  private allocateMesh() {
    this.releaseMesh();

    const THREE = this.context.three;
    const geometry = new THREE.BoxBufferGeometry(1, 1, 1, 1, 1, 1);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geometry, material);

    this.outputs.objectRoot = mesh

    this.dispose = () => {
      this.outputs.objectRoot = null;
      geometry.dispose();
      material.dispose();
    };
  }

  onDestroy() {
    this.releaseMesh();
  }
}

export const gripType = 'fly.grip';
export const makeGrip = function() {
  return () => new Grip();
}

// const clamp = function(value: number, min: number, max: number) {
//   return Math.min(Math.max(value, min), max);
// }

// const rotationSpeed = 2;
// const moveReleaseTimeDelta = 50;

// class Rotator {
//   private startPoint = {
//     x: 0, y: 0,
//   };
//   private rotateStartPoint = new Vector3(0, 0, 1);
// 	private rotateEndPoint = new Vector3(0, 0, 1);
//   private deltaX: number = 0;
//   private deltaY: number = 0;
//   private curQuaternion: Quaternion = new Quaternion();
//   private lastMoveTimestamp: Date;
//   private mouseDown: boolean = false;

//   constructor(private object: Object3D, private canvas: HTMLCanvasElement) {
//     this.onMouseMove = this.onMouseMove.bind(this);
//     this.onMouseUp = this.onMouseUp.bind(this);
//     this.canvas.addEventListener('mousemove', this.onMouseMove, false);
// 		this.canvas.addEventListener('mouseup', this.onMouseUp, false);
//   }

//   public dispose() {
//     this.canvas.removeEventListener('mousemove', this.onMouseMove, false);
// 		this.canvas.removeEventListener('mouseup', this.onMouseUp, false);
//   }

//   public onMeshDragging() {
//     if (this.mouseDown) {
//       return;
//     }

//     console.log('onMouseDown');
//     this.mouseDown = true;
//     this.rotateStartPoint = this.rotateEndPoint = this.projectOnTrackball(0, 0);
//   }

//   private onMouseMove(event: MouseEvent) {
//     if (this.mouseDown) {
//       this.deltaX = event.x - this.startPoint.x;
//       this.deltaY = event.y - this.startPoint.y;

//       this.handleRotation();

//       this.startPoint.x = event.x;
//       this.startPoint.y = event.y;

//       this.lastMoveTimestamp = new Date();
//     }
//     else {
//       this.startPoint.x = event.clientX;
//       this.startPoint.y = event.clientY;
//     }
//   }

//   private onMouseUp(event: MouseEvent) {
//     if (!this.mouseDown) {
//       return;
//     }

//     console.log('onMouseUp');
//     if (new Date().getTime() - this.lastMoveTimestamp.getTime() > moveReleaseTimeDelta) {
// 			this.deltaX = event.x - this.startPoint.x;
// 			this.deltaY = event.y - this.startPoint.y;
// 		}

//     this.mouseDown = false;
//   }

//   public onTick() {
//     if (!this.mouseDown) {
// 			var drag = 0.95;
// 			var minDelta = 0.05;

// 			if (this.deltaX < -minDelta || this.deltaX > minDelta) {
// 				this.deltaX *= drag;
// 			} else {
// 				this.deltaX = 0;
// 			}

// 			if (this.deltaY < -minDelta || this.deltaY > minDelta) {
// 				this.deltaY *= drag;
// 			} else {
// 				this.deltaY = 0;
// 			}

// 			this.handleRotation();
// 		}
//   }

//   private projectOnTrackball(touchX: number, touchY: number) {
//     const mouseOnBall = new Vector3();
//     const windowHalfX = window.innerWidth / 2;
//     const windowHalfY = window.innerHeight / 2;

//     mouseOnBall.set(
//       clamp(touchX / windowHalfX, -1, 1) * 35,
//       clamp(touchY / windowHalfY, -1, 1) * 35,
//       0.0);

// 		const length = mouseOnBall.length();

// 		if (length > 1.0) {
// 			mouseOnBall.normalize();
// 		}
// 		else {
//       mouseOnBall.z = Math.sqrt(1.0 - length * length);
//     }

//     if (this.mouseDown) {
//       // console.log(mouseOnBall);
//     }

// 		return mouseOnBall;
//   }

//   private handleRotation() {
//     this.rotateEndPoint = this.projectOnTrackball(this.deltaX, this.deltaY);

//     const rotateQuaternion = this.rotateMatrix(this.rotateStartPoint, this.rotateEndPoint);
//     if (this.mouseDown) {
//       // console.log(this.rotateStartPoint, this.rotateEndPoint, rotateQuaternion);
//     }
// 		this.curQuaternion = this.object.quaternion;
// 		this.curQuaternion.multiplyQuaternions(rotateQuaternion, this.curQuaternion);
// 		this.curQuaternion.normalize();
// 		this.object.setRotationFromQuaternion(this.curQuaternion);

// 		this.rotateEndPoint = this.rotateStartPoint;
//   };
  
//   private rotateMatrix(rotateStart: Vector3, rotateEnd: Vector3) {
// 		const axis = new Vector3();
// 		const quaternion = new Quaternion();

//     var angle = Math.acos(rotateStart.dot(rotateEnd) / rotateStart.length() / rotateEnd.length());
//     if (this.mouseDown) {
//       // console.log(angle);
//     }
// 		if (angle) {
//       axis.crossVectors(rotateStart, rotateEnd).normalize();
// 			angle *= rotationSpeed;
//       quaternion.setFromAxisAngle(axis, angle);
//       // console.log(angle, rotateStart, rotateEnd, axis);
// 		}
// 		return quaternion;
// 	}
// }

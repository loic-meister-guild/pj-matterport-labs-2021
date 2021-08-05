import { ISceneNode, SceneComponent } from '@mp/common';
import { IPool } from './interfaces';

class AnimatedNumberPool implements IPool {
  private inUse: SceneComponent[] = [];
  constructor(private components: SceneComponent[]) {}
  borrow(): SceneComponent|null {
    const toBorrow = this.components.pop();
    
    if (toBorrow) {
      this.inUse.push(toBorrow);
      return toBorrow;
    }
    else {
      console.warn('POOL OBJECT BORROW FAILED');
    }

    return null;
  }

  return(object: SceneComponent): void {
    const searchIndex = this.inUse.findIndex((component: SceneComponent) => component === object);
    if (searchIndex !== -1) {
      const available = this.inUse.splice(searchIndex, 1);
      this.components.push(available[0]);
    }
  }
}

export const createAnimatedNumberPool = function(nodePool: ISceneNode[], componentType: string, size: number) {
  const node = nodePool.pop();
  const components: SceneComponent[] = [];
  for (let i=0; i<size; i++) {
    components.push(node.addComponent(componentType));
  }
  node.start();
  return new AnimatedNumberPool(components);
};

export const makePool = function*(nodePool: ISceneNode[], componentType: string, size: number): Generator {
  const node = nodePool.pop();
  const components: SceneComponent[] = [];
  for (let i=0; i<size; i++) {
    components.push(node.addComponent(componentType));
    if (i%5 === 0) {
      yield;
    }
  }
  node.start();
  return new AnimatedNumberPool(components);
};
import { ObservableValue } from '@mp/core';
import { Material } from 'three';
import { ISharedMaterialStack } from './interfaces';

class MaterialStack implements ISharedMaterialStack {
  private stack: Map<string, Material[]> = new Map();
  private current: Map<string, ObservableValue<Material|null>> = new Map();

  // Push a material onto the stack for a key. The material is owned by this
  // class and will be disposed when popped.
  public push(key: string, material: Material): ObservableValue<Material|null> {
    const stack = this.stack.get(key) || [];
    stack.push(material);
    this.stack.set(key, stack);

    const observable = this.current.get(key) || new ObservableValue(material);
    observable.value = material;
    this.current.set(key, observable);

    return observable;
  }

  public clone(fromKey: string, toKey: string): ObservableValue<Material|null> {
    const fromObservable = this.get(fromKey);
    if (!fromObservable) {
      throw new Error('No material has been registered for this key');
    }

    const fromMaterial = fromObservable.value;
    if (fromMaterial === null) {
      throw new Error('cant clone from null Material');
    }

    const newMaterial = fromMaterial.clone();
    return this.push(toKey, newMaterial);
  }

  public pop(key: string): void {
    if (!this.stack.has(key)) {
      throw new Error('No stack to pop from!');
    }

    const stack = this.stack.get(key);
    if (stack.length === 0) {
      throw new Error('Stack is empty');
    }

    const material = stack.pop();
    material.dispose();

    const nextMaterial = stack.length >= 1 ? stack[stack.length - 1] : null;

    if (!this.current.get(key)) {
      throw new Error('Missing current observable key');
    }

    const observable = this.current.get(key);
    observable.value = nextMaterial;
  }

  public get(key: string): ObservableValue<Material>|null {
    return this.current.has(key) ? this.current.get(key) : null;
  }
}

export const createMaterialStack = (): ISharedMaterialStack => {
  return new MaterialStack();
};

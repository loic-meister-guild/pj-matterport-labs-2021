export type ModifierMapT = {
  meta: boolean;
  shift: boolean;
  alt: boolean;
  ctrl: boolean;
};

export type KeyCallbackMapT = {
  modifiers: Array<keyof ModifierMapT>[];
  callback: () => void;
};

export enum Modifier {
  META  = 'meta',
  SHIFT = 'shift',
  ALT   = 'alt',
  CTRL  = 'ctrl',
}

enum ModifierValue {
  META  = 1 << 0,
  SHIFT = 1 << 1,
  ALT   = 1 << 2,
  CTRL  = 1 << 3,
}

export class KeyWatcher {
  private watchedKeys: { [key: number]: Array<{ modifiers: number[]; callback: () => void; }>; } = {}

  private onDownHandler: (event: KeyboardEvent) => void;
  private onUpHandler:   (event: KeyboardEvent) => void;
  private onBlurHandler: () => void;

  constructor(private window: Window, keyBindings: { [key: number]: KeyCallbackMapT[]}) {
    for (const key in keyBindings) {
      this.watchedKeys[key] = [];

      const keyBinding = keyBindings[key];
      for (const callbackMap of keyBinding) {
        this.watchedKeys[key].push({
          modifiers: callbackMap.modifiers.length > 0 ? callbackMap.modifiers.map(mapModifiers) : [0],
          callback: callbackMap.callback,
        })
      }
    }

    this.onDownHandler = (event: KeyboardEvent) => this.onKeyDown(event.keyCode, event);

    this.window.addEventListener('keydown', this.onDownHandler);
    this.window.addEventListener('keyup', this.onUpHandler);
    this.window.addEventListener('blur', this.onBlurHandler);
  }

  dispose() {
    this.window.removeEventListener('keydown', this.onDownHandler);
    this.window.removeEventListener('keyup', this.onUpHandler);
    this.window.removeEventListener('blur', this.onBlurHandler);
  }

  private onKeyDown(key: number, keyEvent: KeyboardEvent) {
    if (this.watchedKeys[key]) {
      let modifiers = 0;
      modifiers = keyEvent.metaKey  ? modifiers | ModifierValue.META  : modifiers;
      modifiers = keyEvent.shiftKey ? modifiers | ModifierValue.SHIFT : modifiers;
      modifiers = keyEvent.altKey   ? modifiers | ModifierValue.ALT   : modifiers;
      modifiers = keyEvent.ctrlKey  ? modifiers | ModifierValue.CTRL  : modifiers;

      for (const keyBinding of this.watchedKeys[key]) {
        if (keyBinding.modifiers.indexOf(modifiers) > -1) {
          keyEvent.preventDefault();
          keyBinding.callback();
        }
      }
    }
  }

}


function mapModifiers(modifiers: Array<keyof ModifierMapT>): number {
  let mods = 0;
  for (const modifier of modifiers) {
    switch (modifier) {
      case Modifier.META:
        mods = mods | ModifierValue.META;
        break;
      case Modifier.SHIFT:
        mods = mods | ModifierValue.SHIFT;
        break;
      case Modifier.ALT:
        mods = mods | ModifierValue.ALT;
        break;
      case Modifier.CTRL:
        mods = mods | ModifierValue.CTRL;
        break;
    }
  }

  return mods;
}

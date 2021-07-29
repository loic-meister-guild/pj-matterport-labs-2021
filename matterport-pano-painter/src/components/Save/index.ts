import { App, Page } from '@mp/save';
import { Dict } from '@mp/core';
import { HistoriedPaintScene } from '../HistoriedPaintScene';
import { Scene, Mesh, MeshBasicMaterial, Geometry, Object3D } from 'three';

export type Mapped<T, V> = {
  [key in keyof T]: V;
};

type SaveDataT = {
  brushes: {};
};

export interface ISaver {
  save(): Dict<SaveDataT>;
}

export interface ISaveSaver {
  serialize(strokes: Scene): {};
}

export interface ILoader {
  load(saveData: Dict<SaveDataT>): void;
}

export interface ISaveLoader {
  deserialize(objectJSON: {}): Promise<Scene>;
}

export type BrushT = Mesh & {
  clone(): BrushT;
  material: MeshBasicMaterial;
  geometry: Geometry;
};

export type BrushPath = {
  children: BrushT[];
} & Object3D;

export class SaveManager implements App.ISaveRequestHandler {
  private static readonly SCHEMA: App.SchemaDescriptor = {
    version: 1,
    schema: {
      paint: 'brushes',
      texture: 'brushes',
    }
  }

  constructor(private saver: ISaver, private loader: ILoader) { }

  get schema(): App.SchemaDescriptor {
    return SaveManager.SCHEMA;
  }

  save() {
    return this.saver.save();
  }

  load(loadRequest: Page.LoadRequest) {
    if (loadRequest.version !== SaveManager.SCHEMA.version) {
      throw Error(`Version Error: tried to load outdated save data. Migrate the data first. \n
         Received: ${loadRequest.version}; expected: ${SaveManager.SCHEMA.version}`);
    }

    const loadData = loadRequest.loadData as Mapped<App.SchemaDescriptor['schema'], SaveDataT>;
    if (!loadData.paint || !loadData.texture) {
      throw Error('Save data corrupted. Could not load save data.');
    }

    this.loader.load(loadData);
  }

  migrate(outdatedData: App.OutdatedData): {} {
    return {
      // TODO
    };
  }

}

export class SaveSerializer<T extends Dict<ISaveSaver>> implements ISaver {
  constructor(private scenes: Mapped<T, Scene>, private serializers: T) { }

  save() {
    const saveData = {} as Mapped<T, SaveDataT>;
    for (const key in this.serializers) {
      saveData[key] = {
        brushes: this.serializers[key].serialize(this.scenes[key]),
      };
    }

    return saveData;
  }
}

export class SaveDeserializer<T extends Dict<ISaveLoader>> implements ILoader {
  constructor(private paintScene: HistoriedPaintScene<Mapped<T, Scene>>, private deserializers: T) { }

  async load(saveJson: Mapped<T, SaveDataT>) {
    const scenes = {} as Mapped<T, Scene>;
    for (const key in this.deserializers) {
      if (!saveJson[key] || !saveJson[key].brushes) {
        console.error(key, ' save data corrupt. Could not load data');
      }
      scenes[key] = await this.deserializers[key].deserialize(saveJson[key].brushes);
    }

    this.paintScene.addFromScenes(scenes);
  }
}

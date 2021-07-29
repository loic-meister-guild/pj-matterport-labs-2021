import { ISaveSaver, ISaveLoader } from '.';
import { Scene, ObjectLoader } from 'three';

export class TextureSerializer implements ISaveSaver {
  serialize(strokes: Scene) {
    return strokes.toJSON();
  }

}

export class TextureDeserializer implements ISaveLoader {
  constructor(private objectLoader: ObjectLoader) { }

  deserialize(objectJSON: {}): Promise<Scene> {
    return new Promise((res) => {
      this.objectLoader.parse(objectJSON, (strokes) => {
        res(strokes as unknown as Scene);
      });
    });
  }

}

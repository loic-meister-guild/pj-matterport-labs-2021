import { ISaveSaver, ISaveLoader, BrushPath } from '.';
import { Scene, ZeroFactor, OneFactor, ObjectLoader } from 'three';

export class PaintSerializer implements ISaveSaver {
  serialize(strokes: Scene) {
    const json = strokes.toJSON();
    if (json.materials) {
      for (const material of json.materials) {
        material.blendDst = ZeroFactor;
        material.blendSrc = OneFactor;
      }
    }

    return json;
  }

}

export class PaintDeserializer implements ISaveLoader {
  constructor(private objectLoader: ObjectLoader) { }

  deserialize(objectJSON: {}): Promise<Scene> {
    return new Promise((res) => {
      this.objectLoader.parse(objectJSON, (strokes) => {

        // BUG in THREE: `blendDst` and `blendSrc` are not (de)serialized in `toJSON` or the `ObjectLoader`
        for (const stroke of strokes.children) {
          const brushStroke = stroke as BrushPath;
          // the material is shared amongst all children, updating the first child material will update all
          if (brushStroke.children.length) {
            brushStroke.children[0].material.blendDst = ZeroFactor;
            brushStroke.children[0].material.blendSrc = OneFactor;
          }
        }

        res(strokes as unknown as Scene);
      });
    })
  }

}

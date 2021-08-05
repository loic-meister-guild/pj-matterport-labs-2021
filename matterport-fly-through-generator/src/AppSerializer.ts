import { Page, App } from '@mp/save';
import { Vector3 } from 'three';
import { EditState } from './interfaces';

class AppSerializer implements App.ISaveRequestHandler {
  schema: App.SchemaDescriptor = {
    version: 1,
    schema: {
      path: 'start, end',
    },
  };

  constructor(private editState: EditState, private onLoad: () => void) {}

  save(): {} {
    return {
      path: {
        start: this.editState.startPos.value,
        end: this.editState.endPos.value,
      }
    }
  }
  load(loadRequest: Page.LoadRequest): void {
    const data = loadRequest.loadData as any;
    const start = new Vector3().copy(data.path.start);
    const end = new Vector3().copy(data.path.end);
    
    this.editState.pathState.path.value = [];
    this.editState.pathState.pathLength.value = 0;
    this.editState.pathState.validPath.value = false;
    this.editState.startPos.value = start;
    this.editState.endPos.value = end;

    this.onLoad();
  }
  migrate(outdatedData: App.OutdatedData): {} {
    throw new Error('Method not implemented.');
  }

}

export const makeAppSerializer = (editState: EditState, cb: () => void) => {
  return new AppSerializer(editState, cb);
};

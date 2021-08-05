import { Dict } from './types';
import { AppMsgType, SchemaResponse, AppMsgDataT } from './AppMessages';
import { PageMsgType } from './PageMessages';
import Dexie, { Collection } from 'dexie';

export type DatabaseConfT = {
  version: number;
  db: Dexie; // TODO: would be nice to eliminate this direct dependency eventually
}

/**
 * Open a database
 * @param dbName
 */
export function openDb(dbName: string): DatabaseConfT {
  const db = new Dexie(dbName);
  return {
    get version() { return db.verno },
    db, // TODO: write a DB adaptor for greater abstraction
  };
}

export interface ISaveObserver {
  onSavesUpdated(saveData: Array<Metadata | undefined>): void;
}

export type Metadata = {
  date: Date;
  thumbnailUrl?: string;
}

const METADATA_TABLE_NAME = 'meta';
type SlotIndexT = 1 | 2 | 3;

export class AppSaveRequester {
  private onMessage: (message: MessageEvent) => void;
  private messageId: number = 0;

  private db: Dexie; // TODO: direct dependency

  static async create(target: Window, dbConf: DatabaseConfT, saveDataObserver: ISaveObserver) {
    function waitForApp() {
      return new Promise((res: Function) => {
        function onAppReady(msg: MessageEvent) {
          if (msg.data && msg.data.type === AppMsgType.APP_READY) {
            window.removeEventListener('message', onAppReady);
            res();
          }
        }
        window.addEventListener('message', onAppReady);
      })
    }

    await waitForApp();
    return new AppSaveRequester(target, dbConf, saveDataObserver);
  }

  private constructor(private target: Window, dbConf: DatabaseConfT, private saveDataObserver: ISaveObserver) {
    // only handle messages from this.target
    this.onMessage = (message) => message.source === this.target && this.handleMessageEvent(message.data);
    window.addEventListener('message', this.onMessage);
    this.db = dbConf.db;

    this.post(PageMsgType.REQUEST_SCHEMA);
  }

  public async getSlotMetadata(slot: SlotIndexT): Promise<Metadata> | undefined {
    try {
      const table = this.db.table(METADATA_TABLE_NAME);
      const metadata = await table.get(slot);
      return metadata;
    } catch {
      return undefined;
    }
  }

  /**
   * Request to save app state to slot [1-3]
   * @param slot
   */
  public async save(slot: SlotIndexT) {
    const messageId = this.post(PageMsgType.REQUEST_SAVE);
    const saveData = await this.awaitResponse(AppMsgType.SAVE_DATA, messageId);

    this.putSaveData(saveData, slot);
    this.notifyObserver();
  }

  /**
   * Request a load state from slot [1-3]
   * @param slot
   */
  public async load(slot: SlotIndexT) {
    const loadData = await this.readSaveSlot(slot);
    this.post(PageMsgType.REQUEST_LOAD, {
      version: this.db.verno,
      loadData,
    });
  }

  // high level send message
  private post(type: PageMsgType, payload: {} = {}) {
    this.target.postMessage({
      id: ++this.messageId,
      type,
      payload,
    }, '*');
    return this.messageId;
  }

  private awaitResponse(responseType: AppMsgType, messageId: number) {
    return new Promise<Dict>((res) => {
      function onResponseReceived(msg: MessageEvent) {
        if (msg.data.payload && msg.data.type === responseType && msg.data.id === messageId) {
          window.removeEventListener('message', onResponseReceived);
          res(msg.data.payload);
        }
      }
      window.addEventListener('message', onResponseReceived);
    });
  }

  // high level receive message
  private handleMessageEvent(labsMessage: AppMsgDataT) {
    if (isSchemaRespone(labsMessage)) {
      this.onSchemaReceived(labsMessage.payload);
    }
  }

  // lower level messages
  private onSchemaReceived(schemaResponse: SchemaResponse) {
    const schema = schemaResponse.schema;
    for (const tableName in schema) {
      schema[tableName] = '&, ' + schema[tableName];
    }
    // add a "metadata" table, with a unique index, date, and thumbnail if available
    schema[METADATA_TABLE_NAME] = '&, date';

    this.db
      .version(schemaResponse.version)
      .stores(schemaResponse.schema)
      .upgrade(async (tx) => {
        const currentSavedData: { [key: string]: Collection } = {};
        for (const tableName of tx.storeNames) {
          currentSavedData[tableName] = tx.table(tableName).toCollection();
        }
        // const migrationRequest = this.post(PageMsgType.REQUEST_MIGRATE, {
        //   oldVersion: this.db.verno, // TODO: won't work because it will be set to the schema's version...
        //   oldData: currentSavedData,
        // });
        // const migratedData = await this.awaitResponse(AppMsgType.DATA_MIGRATE, migrationRequest);
        // this.saveData(migratedData);
      });

      this.notifyObserver();
  }

  private putSaveData(saveData: Dict, slot: number) {
    for (const tableName in saveData) {
      const table = this.db.table(tableName);
      table.put(saveData[tableName], slot);
    }
  }

  private async readSaveSlot(slot: number): Promise<Dict> {
    const tables = this.db.tables.filter((table) => table.name !== METADATA_TABLE_NAME)
    const savedData: Dict = {};
    for (const table of tables) {
      savedData[table.name] = await table.get(slot);
    }

    return savedData;
  }

  private async notifyObserver() {
    this.saveDataObserver.onSavesUpdated(await Promise.all([
      this.getSlotMetadata(1),
      this.getSlotMetadata(2),
      this.getSlotMetadata(3),
    ]));
  }

}

function isSchemaRespone(msg: AppMsgDataT): msg is AppMsgDataT<AppMsgType.SCHEMA> {
  return msg.type === AppMsgType.SCHEMA;
}

export async function setupMockMessageButtons(makeAppSaver: (observer: ISaveObserver) => Promise<AppSaveRequester>) {
  class SaveObserver implements ISaveObserver {
    onSavesUpdated(savedData: Array<Metadata | undefined>) {
      savedData.forEach((_, i) => {
        if (savedData[i]) {
          // set thumbnail src
          images[i].src = savedData[i].thumbnailUrl;
          loadButtons[i].disabled = false;
        }
      });
    }
  }
  const appSaver = await makeAppSaver(new SaveObserver());
  const mainDiv = document.createElement('div');
  mainDiv.classList.add('saves');
  const saveDiv = document.createElement('div');
  saveDiv.classList.add('saves');
  const save1 = document.createElement('button');
  save1.innerText = 'SAVE 1';
  const save2 = document.createElement('button');
  save2.innerText = 'SAVE 2';
  const save3 = document.createElement('button');
  save3.innerText = 'SAVE 3';
  const saveButtons = [save1, save2, save3];
  saveDiv.append(...saveButtons);

  saveButtons.forEach((button, i) => {
    button.addEventListener('click', () => {
      appSaver.save(i + 1 as SlotIndexT);
    });
  });

  const loadDiv = document.createElement('div');
  const load1 = document.createElement('button');
  load1.innerText = 'LOAD 1';
  const load2 = document.createElement('button');
  load2.innerText = 'LOAD 2';
  const load3 = document.createElement('button');
  load3.innerText = 'LOAD 3';
  const loadButtons = [load1, load2, load3];
  loadDiv.append(...loadButtons);

  loadButtons.forEach((button, i) => {
    button.addEventListener('click', () => {
      appSaver.load(i + 1 as SlotIndexT);
    });
  });

  [...saveButtons, ...loadButtons].forEach((button) => {
    button.disabled = true;
    button.classList.add('save');
  });

  const imgDiv = document.createElement('div');
  const img1 = new Image();
  const img2 = new Image();
  const img3 = new Image();
  const images = [img1, img2, img3];
  imgDiv.append(...images);

  mainDiv.append(saveDiv, loadDiv, imgDiv);
  document.body.append(mainDiv);

  saveButtons.forEach((button) => {
    button.disabled = false;
  });

}

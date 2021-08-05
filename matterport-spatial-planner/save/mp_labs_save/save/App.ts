import { AppMsgType, SchemaDescriptor  } from './AppMessages';
import { PageMsgType, LoadRequest, LabsMsgDataT } from './PageMessages';

export type OutdatedData = {
  version: number;
  data: {};
};

const THUMB_RES = {
  w: 128,
  h: 128,
};

export interface ISaveRequestHandler {
  readonly schema: SchemaDescriptor;
  save(): {};
  load(loadRequest: LoadRequest): void;
  migrate(outdatedData: OutdatedData): {};
}

export class AppSaver {
  private onMessage: (message: MessageEvent) => void;

  constructor(private target: Window, private saveHandler: ISaveRequestHandler, private takeScreenShot?: (w: number, h: number) => Promise<string>) {
    this.onMessage = (message) => {
      if (message.source === target) {
        this.handleMessageEvent(message.data);
      }
    };

    window.addEventListener('message', this.onMessage);
    this.post(AppMsgType.APP_READY, -1, {});
  }

  private handleMessageEvent(labsMessageData: LabsMsgDataT) {
    if (isSchemaRequest(labsMessageData)) {
      this.onSchemaRequested(labsMessageData);
    }
    if (isSaveRequest(labsMessageData)) {
      this.onSaveRequested(labsMessageData);
    }
    if (isLoadRequest(labsMessageData)) {
      this.onLoadRequested(labsMessageData);
    }
    if (isUpgradeRequest(labsMessageData)) {
      this.onMigrateRequested(labsMessageData);
    }
  }

  private onSchemaRequested(schemaRequest: LabsMsgDataT<PageMsgType.REQUEST_SCHEMA>) {
    const schemaData = this.saveHandler.schema;
    this.post(AppMsgType.SCHEMA, schemaRequest.id, schemaData);
  }

  private async onSaveRequested(saveRequest: LabsMsgDataT<PageMsgType.REQUEST_SAVE>) {
    const saveData = this.saveHandler.save();
    if (this.takeScreenShot) {
      const thumbnail = await this.takeScreenShot(THUMB_RES.w, THUMB_RES.h);
      this.post(AppMsgType.SAVE_DATA, saveRequest.id, {
        ...saveData,
        meta: {
          thumbnailUrl: thumbnail,
          date: Date.now(),
        },
      });
    } else {
      this.post(AppMsgType.SAVE_DATA, saveRequest.id, saveData);
    }
  }

  private onLoadRequested(loadRequest: LabsMsgDataT<PageMsgType.REQUEST_LOAD>) {
    this.saveHandler.load(loadRequest.payload);
  }

  private onMigrateRequested(upgradeRequest: LabsMsgDataT<PageMsgType.REQUEST_MIGRATE>) {
    const upgradedData = this.saveHandler.migrate({
      version: upgradeRequest.payload.oldVersion,
      data: upgradeRequest.payload.oldData,
    });

    this.post(AppMsgType.DATA_MIGRATE, upgradeRequest.id, upgradedData);
  }

  // nearly all outgoing posts are in response to an incoming message, therefore and `id` should be associated with each post
  private post(type: AppMsgType, responseId: number, payload: {}) {
    this.target.postMessage({
      id: responseId,
      type,
      payload,
    }, '*');
  }

}

function isSchemaRequest(msg: LabsMsgDataT): msg is LabsMsgDataT<PageMsgType.REQUEST_SCHEMA> {
  return msg.type == PageMsgType.REQUEST_SCHEMA;
}

function isSaveRequest(msg: LabsMsgDataT): msg is LabsMsgDataT<PageMsgType.REQUEST_SAVE> {
  return msg.type === PageMsgType.REQUEST_SAVE;
}

function isLoadRequest(msg: LabsMsgDataT): msg is LabsMsgDataT<PageMsgType.REQUEST_LOAD> {
  return msg.type === PageMsgType.REQUEST_LOAD;
}

function isUpgradeRequest(msg: LabsMsgDataT): msg is LabsMsgDataT<PageMsgType.REQUEST_MIGRATE> {
  return msg.type === PageMsgType.REQUEST_MIGRATE;
}

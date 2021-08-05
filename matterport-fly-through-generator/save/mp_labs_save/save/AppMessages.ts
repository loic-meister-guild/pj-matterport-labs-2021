import { Dict } from './types';

export enum AppMsgType {
  APP_READY    = 'APP_READY',
  SCHEMA       = 'SHEMA_RESPONSE',
  SAVE_DATA    = 'SAVE_DATA',
  DATA_MIGRATE = 'DATA_MIGRATE',
}

type Response = {
  id: number;
}

export type SchemaDescriptor = {
  version: number;
  schema: Dict<string>;
}

export type SchemaResponse = Response & SchemaDescriptor;

export type SaveResponse = Response & {
  saveData: Dict;
};

export type MigrateResponse = Response & {
  upgradedData: Dict;
}

export type PayloadMap = {
  [AppMsgType.APP_READY]:    Response;
  [AppMsgType.SCHEMA]:       SchemaResponse;
  [AppMsgType.SAVE_DATA]:    SaveResponse;
  [AppMsgType.DATA_MIGRATE]: MigrateResponse;
};

export type AppMsgDataT<M extends AppMsgType = AppMsgType> = Response & {
  type: M;
  payload: PayloadMap[M];
};

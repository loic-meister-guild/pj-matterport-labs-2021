export enum PageMsgType {
    REQUEST_SCHEMA  = 'REQUEST_SCHEMA',
    REQUEST_SAVE    = 'REQUEST_SAVE',
    REQUEST_LOAD    = 'REQUEST_LOAD',
    REQUEST_MIGRATE = 'REQUEST_MIGRATE',
  };
  
  export type SchemaRequest = {};
  
  export type SaveRequest = {};
  
  export type LoadRequest = {
    version: number;
    loadData: {};
  };
  
  export type MigrateRequest = {
    oldVersion: number;
    oldData: {};
  }
  
  export type PayloadMap = {
    [PageMsgType.REQUEST_SCHEMA]:  SchemaRequest;
    [PageMsgType.REQUEST_SAVE]:    SaveRequest;
    [PageMsgType.REQUEST_LOAD]:    LoadRequest;
    [PageMsgType.REQUEST_MIGRATE]: MigrateRequest;
  }
  
  export type LabsMsgDataT<M extends PageMsgType = PageMsgType> = {
    id: number;
    type: M;
    payload: PayloadMap[M];
  };
  
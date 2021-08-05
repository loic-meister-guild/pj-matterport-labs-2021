import { interpret, Machine, Observer, State } from 'xstate';

export interface FSMSchema {
  states: {
    // Doing nothing, initial state
    idle: {};

    // Setting up the sdk, data, and editing ui. 
    initializing: {};

    // Editing path
    editing: {};

    // Previewing path
    previewing: {};
  };
}

export type FSMEvent = { type: 'INITIALIZE_EDITING' } | { type: 'EDITING_READY' } | { type: 'START_PREVIEW' } | { type: 'STOP_PREVIEW' };
export type FSMState = State<unknown, FSMEvent, FSMSchema>;
export type FSMObserver = Observer<FSMState>;

type Callback = (context: unknown, event: FSMEvent) => Promise<void>;

export const makeAppFSM = (
  onEnterIdle: Callback,
  onEnterInitializing: Callback,
  onEnterEditing: Callback,
  onExitEditing: Callback,
  onEnterPreviewing: Callback,
  onExitPreviewing: Callback,
) => {
  return interpret(
    Machine<unknown, FSMSchema, FSMEvent>(
      {
        initial: 'idle',
        states: {
          idle: {
            on: {
              INITIALIZE_EDITING: 'initializing',
            },
            entry: 'onEnterIdle',
          },
          initializing: {
            on: {
              EDITING_READY: 'editing',
            },
            entry: 'onEnterInitializing',
          },
          editing: {
            on: {
              START_PREVIEW: 'previewing',
              INITIALIZE_EDITING: 'editing',
            },
            entry: 'onEnterEditing',
            exit: 'onExitEditing',
          },
          previewing: {
            on: {
              INITIALIZE_EDITING: 'editing',
            },
            entry: 'onEnterPreviewing',
            exit: 'onExitPreviewing',
          }
        },
      },
      {
        actions: {
          onEnterIdle,
          onEnterInitializing,
          onEnterEditing,
          onExitEditing,
          onEnterPreviewing,
          onExitPreviewing,
        },
      }
    )
  );
};

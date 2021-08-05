import { interpret, Machine, Observer, State } from 'xstate';

export interface FSMSchema {
  states: {
    // Doing nothing, initial state
    idle: {};

    // Setting up the sdk and waiting for play if not automatic.
    waitingForUser: {};

    // Setting up the data, and ui. 
    initializing: {};

    // Selecting a room
    selecting: {};

    // Editing a room
    editing: {};
  };
}
export type FSMStateValues = keyof FSMSchema['states'];

export type FSMEvent = { type: 'START' } | { type: 'USER_READY' } | { type: 'INITIALIZED' } | { type: 'START_EDITING' } | { type: 'STOP_EDITING' };
export type FSMState = State<unknown, FSMEvent, FSMSchema>;
export type FSMObserver = Observer<FSMState>;

type Callback = (context: unknown, event: FSMEvent) => Promise<void>;

export const makeAppFSM = (
  onEnterIdle: Callback,
  onEnterWaitingForUser: Callback,
  onEnterInitializing: Callback,
  onEnterSelecting: Callback,
  onExitSelecting: Callback,
  onEnterEditing: Callback,
  onExitEditing: Callback,
) => {
  return interpret(
    Machine<unknown, FSMSchema, FSMEvent>(
      {
        initial: 'idle',
        states: {
          idle: {
            on: {
              START: 'waitingForUser',
            },
            entry: 'onEnterIdle',
          },
          waitingForUser: {
            on: {
              USER_READY: 'initializing',
            },
            entry: 'onEnterWaitingForUser',
          },
          initializing: {
            on: {
              INITIALIZED: 'selecting',
            },
            entry: 'onEnterInitializing',
          },
          selecting: {
            on: {
              START_EDITING: 'editing',
            },
            entry: 'onEnterSelecting',
            exit: 'onExitSelecting',
          },
          editing: {
            on: {
              STOP_EDITING: 'selecting',
              START_EDITING: 'editing',
            },
            entry: 'onEnterEditing',
            exit: 'onExitEditing',
          }
        },
      },
      {
        actions: {
          onEnterIdle,
          onEnterWaitingForUser,
          onEnterInitializing,
          onEnterSelecting,
          onExitSelecting,
          onEnterEditing,
          onExitEditing,
        },
      }
    )
  );
};

import React, { ReactNode, useEffect, useState } from 'react';
import { FSMEvent, FSMSchema, FSMState, FSMStateValues } from '../ApplicationFSM';
import { Interpreter } from 'xstate';
import { FSMContext } from '../FSMContext';
import { IFSMContext } from '../interfaces';

interface Props {
  fsm: Interpreter<unknown, FSMSchema, FSMEvent>;
  children: ReactNode;
}

export function FSMContextProvider(props: Props) {
  useEffect(() => {
    // subscribe to fsm state changes
    const onChangeHandler = () => {
      setFsmContext({
        current: props.fsm.state.value as FSMStateValues,
        next: null,
      });
    };

    props.fsm.onChange(onChangeHandler);

    const onTransitionHandler = (state: FSMState) => {
      if (state.transitions.length > 0) {
        setFsmContext({
          current: state.value as FSMStateValues,
          next: state.transitions[0].target[0].key as FSMStateValues,
        }); 
      }
    };

    props.fsm.onTransition(onTransitionHandler);

    return () => {
      // cleanup
      props.fsm.off(onChangeHandler);
      props.fsm.off(onTransitionHandler);
    };
  }, []);

  const [fsmContext, setFsmContext] = useState<IFSMContext>({
    current: 'idle',
    next: null,
  }); 

  return(
    <FSMContext.Provider value={fsmContext}>
      {props.children}
    </FSMContext.Provider>
  );
}
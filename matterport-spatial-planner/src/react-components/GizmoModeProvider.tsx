import React, { ReactNode, useEffect, useState } from 'react';
import { ObservableValue } from '@mp/core';
import { Mode } from '../scene-components/TransformGizmo2';
import { GizmoModeContext } from '../GizmoModeContext';

interface Props {
  gizmoMode: ObservableValue<Mode>;
  children: ReactNode;
}

export function GizmoModeProvider(props: Props) {
  const [ gizmoMode, setGizmoMode ] = useState<Mode>(props.gizmoMode.value);
  
  useEffect(() => {
    const onChangeHandler = () => {
      setGizmoMode(props.gizmoMode.value);
    };

    props.gizmoMode.onChanged(onChangeHandler);

    return () => {
      props.gizmoMode.removeOnChanged(onChangeHandler);
    };
  }, []);

  return(
    <GizmoModeContext.Provider value={gizmoMode}>
      {props.children}
    </GizmoModeContext.Provider>
  );
}
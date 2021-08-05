import React, { ReactNode, useEffect, useState } from 'react';
import { ObservableValue } from '@mp/core';
import { ISceneNode } from '@mp/common';
import { ObjectSelectionContext } from '../ObjectSelectionContext';

interface Props {
  objectSelection: ObservableValue<ISceneNode|null>;
  children: ReactNode;
}

export function ObjectSelectionProvider(props: Props) {
  const [ objectSelection, setObjectSelection ] = useState<ISceneNode|null>(props.objectSelection.value);
  
  useEffect(() => {
    const onChangeHandler = () => {
      setObjectSelection(props.objectSelection.value);
    };

    props.objectSelection.onChanged(onChangeHandler);

    return () => {
      props.objectSelection.removeOnChanged(onChangeHandler);
    };
  }, []);

  return(
    <ObjectSelectionContext.Provider value={objectSelection}>
      {props.children}
    </ObjectSelectionContext.Provider>
  );
}
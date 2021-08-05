import React, { ReactNode, useEffect, useState } from 'react';
import { ObservableValue } from '@mp/core';
import { MeshDrawStyle } from '../interfaces';
import { DrawStyleContext } from '../DrawStyleContext';

interface Props {
  drawStyle: ObservableValue<MeshDrawStyle>;
  children: ReactNode;
}

export function DrawStyleProvider(props: Props) {
  const [ drawStyle, setDrawStyle ] = useState<MeshDrawStyle>(props.drawStyle.value);
  
  useEffect(() => {
    const onChangeHandler = () => {
      setDrawStyle(props.drawStyle.value);
    };

    props.drawStyle.onChanged(onChangeHandler);

    return () => {
      props.drawStyle.removeOnChanged(onChangeHandler);
    };
  }, []);

  return(
    <DrawStyleContext.Provider value={drawStyle}>
      {props.children}
    </DrawStyleContext.Provider>
  );
}
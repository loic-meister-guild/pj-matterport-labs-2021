import React, { ReactNode, useEffect, useState } from 'react';
import { ObservableValue } from '@mp/core';
import { IRoomBuilder } from '../interfaces';
import { RoomSelectionContext } from '../RoomSelectionContext';

interface Props {
  roomSelection: ObservableValue<IRoomBuilder|null>;
  children: ReactNode;
}

export function RoomSelectionProvider(props: Props) {
  const [ roomSelection, setRoomSelection ] = useState<IRoomBuilder|null>(props.roomSelection.value);
  
  useEffect(() => {
    const onChangeHandler = () => {
      setRoomSelection(props.roomSelection.value);
    };

    props.roomSelection.onChanged(onChangeHandler);

    return () => {
      props.roomSelection.removeOnChanged(onChangeHandler);
    };
  }, []);

  return(
    <RoomSelectionContext.Provider value={roomSelection}>
      {props.children}
    </RoomSelectionContext.Provider>
  );
}
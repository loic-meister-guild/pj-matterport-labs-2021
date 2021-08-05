import React, { ReactNode, useEffect, useState } from 'react';
import { ObservableValue } from '@mp/core';
import { CommandContext } from '../CommandContext';
import { ICommandFactoryProvider } from '../interfaces';

interface Props {
  provider: ObservableValue<ICommandFactoryProvider|null>;
  children: ReactNode;
}

export function CommandProvider(props: Props) {
  const [ provider, setProvider ] = useState<ICommandFactoryProvider|null>(props.provider.value);
  
  useEffect(() => {
    const onChangeHandler = () => {
      setProvider(props.provider.value);
    };

    props.provider.onChanged(onChangeHandler);

    return () => {
      props.provider.removeOnChanged(onChangeHandler);
    };
  }, []);

  return(
    <CommandContext.Provider value={provider}>
      {props.children}
    </CommandContext.Provider>
  );
}
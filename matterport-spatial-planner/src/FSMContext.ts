import React from 'react';
import { IFSMContext } from './interfaces';

export const FSMContext = React.createContext<IFSMContext>({
  current: 'idle',
  next: null,
});

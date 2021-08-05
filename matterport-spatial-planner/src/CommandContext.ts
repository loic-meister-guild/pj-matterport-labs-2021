import React from 'react';
import { ICommandFactoryProvider } from './interfaces';

export const CommandContext = React.createContext<ICommandFactoryProvider>(null);

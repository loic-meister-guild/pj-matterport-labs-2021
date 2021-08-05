import React from 'react';
import { IEnvContext } from './interfaces';

export const EnvContext =  React.createContext<IEnvContext>({} as IEnvContext);

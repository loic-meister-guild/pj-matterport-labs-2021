import { createContext } from 'react';
import { ISceneNode } from '@mp/common';

export const ObjectSelectionContext = createContext<ISceneNode|null>(null);

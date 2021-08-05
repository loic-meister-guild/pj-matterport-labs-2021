import React from 'react';
import { MeshDrawStyle } from './interfaces';

export const DrawStyleContext = React.createContext<MeshDrawStyle>(MeshDrawStyle.GreyBox);

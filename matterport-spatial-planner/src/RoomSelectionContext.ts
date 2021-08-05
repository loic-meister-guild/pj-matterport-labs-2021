import React from 'react';
import { IRoomBuilder } from './interfaces';

export const RoomSelectionContext = React.createContext<IRoomBuilder|null>(null);

import React from 'react';
import { Mode } from './scene-components/TransformGizmo2';

export const GizmoModeContext = React.createContext<Mode>(Mode.Translate);

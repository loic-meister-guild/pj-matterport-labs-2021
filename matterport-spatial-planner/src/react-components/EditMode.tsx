import React, { useContext, useState } from 'react';
import { makeStyles } from '@material-ui/styles';
import { AddObjectModal } from './AddObjectModal';
import { AddObjectButton } from './AddObjectButton';
import { ObjectSelectionContext } from '../ObjectSelectionContext';
import { TopLeftControls } from './TopLeftControls';
import { ImageButton } from './ImageButton';
import { CommandContext } from '../CommandContext';
import { EditSizeModal } from './EditSizeModal';
import { ObjectSize } from '../AssetMap';
import { Furniture } from '../interfaces';
import { GizmoModeContext } from '../GizmoModeContext';
import { Mode } from '../scene-components/TransformGizmo2';

const useStyles = makeStyles({
  overlay: {
    flexDirection: 'column',
    display: 'flex',
    justifyContent: 'flexEnd',
    height: '100vh',
    width: '100%',
    pointerEvents: 'none',
  },
  toolbar: {
    display: 'flex',
    flexDirection: 'row',
    position: 'absolute',
    left: '50%',
    bottom: '80px',
    transform: `translateX(-50%)`,
    pointerEvents: 'none',
    alignItems: 'center',
    justifyContent: 'space-between',
  }
});

enum EditState {
  Idle ='Idle',
  AddingObject = 'AddingObject',
  EditingSize = 'EditingSize',
}

interface Props{}

export function EditMode(props: Props) {
  const [state, setState ] = useState(EditState.Idle);
  const objectSelection  = useContext(ObjectSelectionContext);
  const commands = useContext(CommandContext);
  const gizoMode = useContext(GizmoModeContext);
  const classes = useStyles();

  const addObjectClickHandler = () => {
    setState(EditState.AddingObject);
  };

  const onEditObjectClicked = () => {
    setState(EditState.EditingSize);
  };

  const onDeleteObjectClicked = () => {
    commands.removeObjectSelectionCommandFactory.create().execute();
    commands.clearSelectionCommandFactory.create().execute();
  };

  const onObjectAdded = () => {
    setState(EditState.Idle);
  };

  const onSizeUpdated = (furnitureType: Furniture, size: ObjectSize) => {
    commands.makeUpdateObjectCommandFactory.create().execute(furnitureType, size);
    setState(EditState.Idle);
  };

  const onCancelled = () => {
    setState(EditState.Idle);
  };

  const renderUI = () => {
    switch(state) {
      case EditState.Idle:
        return (
          <div>
            <div className={classes.toolbar}>
              {
                objectSelection !== null ? <ImageButton image='assets/edit.svg' onButtonClicked={onEditObjectClicked} size={'51px'} dark={true}></ImageButton> : null
              }
              <AddObjectButton onButtonClicked={addObjectClickHandler} enabled={gizoMode !== Mode.Draw}></AddObjectButton>
              {
                objectSelection !== null ? <ImageButton image='assets/delete.svg' onButtonClicked={onDeleteObjectClicked} size={'51px'} dark={true}></ImageButton> : null
              }
            </div>
              <TopLeftControls></TopLeftControls>
          </div>
        );
      case EditState.AddingObject:
        return (
          <AddObjectModal onObjectAdded={onObjectAdded} onCancelled={onCancelled}></AddObjectModal>
        );
      case EditState.EditingSize:
        return (
          <EditSizeModal onSizeUpdated={onSizeUpdated} onCancelled={onCancelled}></EditSizeModal>
        );
    }
  };

  return (
    <div className={classes.overlay}>
      {renderUI()}
    </div>
  )
}

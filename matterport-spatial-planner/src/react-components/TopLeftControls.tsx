import { makeStyles } from '@material-ui/styles';
import React, { useContext } from 'react';
import { CommandContext } from '../CommandContext';
import { ImageButton } from './ImageButton';
import { DrawStyleContext } from '../DrawStyleContext';
import { MeshDrawStyle } from '../interfaces';
// import { ObjectSelectionContext } from '../ObjectSelectionContext';

const useStyles = makeStyles({
  container: {
    position: 'absolute',
    top: '50px',
    left: '50px',
    flexDirection: 'column',
    display: 'flex',
    justifyContent: 'flexEnd',
    pointerEvents: 'none',
  },
});

interface Props{}

export function TopLeftControls(props: Props) {
  const classes = useStyles();
  const commands = useContext(CommandContext);
  const drawStyle = useContext(DrawStyleContext);
  // const objectSelection  = useContext(ObjectSelectionContext);

  // const onRotateClicked = function() {
  //   commands.setGizmoModeCommandFactory.create().execute(Mode.Rotate);
  // };

  // const onTranslateClicked = function() {
  //   commands.setGizmoModeCommandFactory.create().execute(Mode.Translate);
  // };

  const onDownloadClicked = function() {
    commands.downloadImageCommandFactory.create().execute();
  };

  const onDrawStyleClicked = function() {
    const nextDrawStyle = drawStyle === MeshDrawStyle.Basic ? MeshDrawStyle.GreyBox : MeshDrawStyle.Basic;
    commands.setMeshDrawStyleCommandFactory.create().execute(nextDrawStyle);
  };

  return (
    <div className={classes.container}>
      {/* <ImageButton
        enabled={objectSelection !== null && gizmoMode !== Mode.Draw}
        image='assets/rotate.svg'
        onButtonClicked={onRotateClicked}
        toggleImageColor={true}
        selected={gizmoMode === Mode.Rotate && objectSelection !== null}
      ></ImageButton>
      <ImageButton
        enabled={objectSelection !== null && gizmoMode !==  Mode.Draw}
        image='assets/translate.svg'
        onButtonClicked={onTranslateClicked}
        toggleImageColor={true}
        selected={gizmoMode === Mode.Translate && objectSelection !== null}
      ></ImageButton> */}
      <ImageButton
        image='assets/preview.svg'
        onButtonClicked={onDrawStyleClicked}
        toggleImageColor={true}
      ></ImageButton>
      <ImageButton
        image='assets/download.svg'
        onButtonClicked={onDownloadClicked}
        toggleImageColor={true}
      ></ImageButton>
    </div>
  );
}
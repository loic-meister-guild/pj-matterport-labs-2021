import React, { useContext } from 'react';
import { FSMContext } from '../FSMContext';
import { SelectRoom } from './SelectRoom';
import { makeStyles } from '@material-ui/styles';
import { EditMode } from './EditMode';
import Lottie from 'lottie-react';
import animation from '../../assets/labs_loader.json';

const useStyles = makeStyles({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100vh',
    width: '100%',
    pointerEvents: 'none',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
  },
});

const lottieStyle: React.CSSProperties = {
  width: 150,
  height: 150,
};

interface Props{}

export function AppRoot(props: Props) {
  const classes = useStyles();
  const fsmContext = useContext(FSMContext);

  const child = () => {
    switch(fsmContext.current) {
      case 'waitingForUser':
        return (
          <div></div>
        );
      case 'selecting':
        return(
          <SelectRoom></SelectRoom>
        );
      case 'editing':
        return(
          <EditMode></EditMode>
        );
      case 'initializing':
        return (
          <div className={classes.loadingContainer}>
            <Lottie animationData={animation} style={lottieStyle} width={300}></Lottie>
          </div>
        );
    }

    return(
      <div></div>
    );
  };

  return (
    <div className={classes.container}>
      {child()}
    </div>
  )
}

import React from 'react';
import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles({
  container: {
    // position: 'absolute',
    // left: '50%',
    // bottom: '80px',
    // transform: `translateX(-50%)`,
    pointerEvents: 'none',
    boxSizing: 'border-box',
    '&:hover': {
      '& $button': {
        backgroundColor: '#ff3158',
      },
      '& $icon': {
        color: '#ffffff',
      }
    },
    margin: '5px',
  },
  disabled: {
    margin: '5px',
    opacity: 0.3,
  },
  button: {
    width: '65px',
    height: '65px',
    borderRadius: '50%',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    pointerEvents: 'auto',
    boxSizing: 'border-box',
  },
  icon: {
    fontSize: '39pt',
    color: '#000000',
    textAlign: 'center',
  }
});

interface Props{
  enabled: boolean;
  onButtonClicked: () => void|null;
}

export function AddObjectButton(props: Props) {
  const classes = useStyles();

  const addObjectClickHandler = () => {
    if (!props.enabled) {
      return;
    }
    
    if (props.onButtonClicked) {
      props.onButtonClicked();
    }
  };

  return (
    <div className={props.enabled ? classes.container : classes.disabled} onClick={addObjectClickHandler}>
      <div className={classes.button}>
        <div className={classes.icon}>+</div> 
      </div>
    </div>
  );
}
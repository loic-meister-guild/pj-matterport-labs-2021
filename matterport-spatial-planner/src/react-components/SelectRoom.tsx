import { makeStyles } from '@material-ui/styles';
import React from 'react';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    height: '100vh',
    pointerEvents: 'none',
  },
  text: {
    padding: '16px',
    background: 'rgba(34, 34, 34, 0.5)',
    borderRadius: '200px',
    width: '183px',
    fontFamily: 'Roboto',
    fontStyle: 'normal',
    fontWeight: 'normal',
    fontSize: '16px',
    lineHeight: '26px',
    textAlign: 'center',
    letterSpacing: '0.2px',
    color: '#FFFFFF',
    margin: '16px',
  },
});

interface Props{}

export function SelectRoom(props: Props) {
  const styles = useStyles();
  return (
    <div className={styles.container}>
      <div className={styles.text}>Select a room to edit</div>
    </div>
  )
}

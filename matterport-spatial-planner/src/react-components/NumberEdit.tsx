import { DefaultTheme, makeStyles } from '@material-ui/styles';
import React, { useRef } from 'react';

const useStyles = makeStyles<DefaultTheme, Props>(() => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontFamily: 'IBM Plex Sans',
    fontSize: '8px',
    fontWeight: 500,
    fontStyle: 'normal',
    lineHeight: '18px',
    letterSpacing: '1.6px',
  },
  input: {
    fontFamily: 'Roboto',
    fontSize: '14px',
    fontWeight: 400,
    fontStyle: 'normal',
    letterSpacing: '0.2px',
    maxWidth: 30,
    '&::-webkit-inner-spin-button': {
      appearance: 'none',
      margin: 0,
    },
  },
}));

interface Props {
  defaultValue: number;
  label: string;
  onChanged: (value: number) => void;
}

export function NumberEdit(props: Props) {
  const classes = useStyles(props);
  const inputRef = useRef();

  const onChanged = () => {
    if (props.onChanged && inputRef.current) {
      const inputElement = inputRef.current as HTMLInputElement;
      props.onChanged(parseFloat(inputElement.value));
    }
  };

  return (
    <div className={classes.container}>
      <div className={classes.label}>{props.label}</div>
      <input
        type='number'
        ref={inputRef}
        defaultValue={props.defaultValue}
        value={props.defaultValue}
        className={classes.input}
        onChange={onChanged}
      ></input>
    </div>
  );
}
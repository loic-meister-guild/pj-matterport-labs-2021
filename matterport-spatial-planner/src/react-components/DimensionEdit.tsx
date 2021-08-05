import { DefaultTheme, makeStyles } from '@material-ui/styles';
import React, { useState } from 'react';
import { Furniture } from 'src/interfaces';
import { assetMap, ObjectSize } from '../AssetMap';
import { NumberEdit } from './NumberEdit';

const useStyles = makeStyles<DefaultTheme, Props>(() => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
  },
  title: {
    fontFamily: 'Roboto',
    fontWeight: 400,
    fontStyle: 'normal',
    fontSize: '13px',    
    lineHeight: '18px',
    letterSpacing: '0.2px',
    color: '#444444',
    textAlign: 'center',
  },
  numberRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-around',
  }
}));

interface Props {
  furnitureType: Furniture;
  onSizedChanged: (size: ObjectSize) => void;
}

export function DimensionEdit(props: Props) {
  const classes = useStyles(props);
  const [ size, setSize ] = useState<ObjectSize>(assetMap[props.furnitureType].size);

  const onWidthChanged = (value: number) => {
    const newSize: ObjectSize = {
      depth: size.depth,
      width: value,
      height: size.height,
    };

    setSize(newSize);

    if (props) {
      props.onSizedChanged(newSize);
    }
  };

  const onHeightChanged = (value: number) => {
    const newSize: ObjectSize = {
      depth: size.depth,
      width: size.width,
      height: value,
    };

    setSize(newSize);

    if (props) {
      props.onSizedChanged(newSize);
    }
  };

  const onDepthChanged = (value: number) => {
    const newSize: ObjectSize = {
      depth: value,
      width: size.width,
      height: size.height,
    };

    setSize(newSize);

    if (props) {
      props.onSizedChanged(newSize);
    }
  };

  return (
    <div className={classes.container}>
      <div className={classes.title}>Dimensions (meters)</div>
      <div className={classes.numberRow}>
        <NumberEdit
          label='WIDTH'
          defaultValue={size.width}
          onChanged={onWidthChanged}
        ></NumberEdit>
        <NumberEdit
          label='DEPTH'
          defaultValue={size.depth}
          onChanged={onDepthChanged}
        ></NumberEdit>
        <NumberEdit
          label='HEIGHT'
          defaultValue={size.height}
          onChanged={onHeightChanged}
        ></NumberEdit>
      </div>
    </div>
  );
}
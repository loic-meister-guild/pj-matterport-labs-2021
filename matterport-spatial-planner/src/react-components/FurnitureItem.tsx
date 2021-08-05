import { makeStyles } from '@material-ui/styles';
import { DefaultTheme } from '@material-ui/styles';
import React, { useState } from 'react';
import { assetMap, ObjectSize } from '../AssetMap';
import { Furniture } from '../interfaces';
import { DimensionEdit } from './DimensionEdit';

const useStyles = makeStyles<DefaultTheme, Props>(() => ({
  container: {
    width: 146,
    flexBasis: 171,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    margin: 8,
    borderRadius: 5,
    background: 'white',
    borderStyle: 'solid',
    border: '1',
    borderColor: ({selected}) =>  selected ? '#ff3158' : '#ffffff',
    transition:  'all 0.2s',
    maxHeight: '171',
    overflow: 'hidden',
  },
  editMinimized: {
    maxHeight: '171px',
  },
  topSection: {
    height: 117,
  },
  middleSection: {
    height: 54,
    display: 'flex',
    justifyContent: 'space-between',
  },
  bottomSectionMin: {
    height: 0,
  },
  bottomSectionMax: {
    height: 67,
  },
  image: {
    position: 'relative',
    height: 117,
    left: 10,
    userSelect: 'none',
    'userDrag': 'none',
  },
  outerCircle: {
    position: 'relative',
    top: -105,
    left: 15,
    border: 1,
    borderStyle: 'solid',
    borderColor: ({selected}) => selected ? '#ff3158' : '#222222',
    height: 20,
    borderRadius: '50%',
    width: 20,
    '&:hover': {
      transition: 'all 0.2s',
      borderColor: '#ff3158',
    },
  },
  innerCircle: {
    position: 'relative',
    margin: 3,
    backgroundColor: ({selected}) => selected ? '#ff3158' : 'white',
    borderRadius: '50%',
    width: 14,
    height: 14,
  },
  label: {
    padding: 16,
    fontFamily: 'IBM Plex Sans',
    fontSize: '14px',
    fontWeight: 700,
    fontStyle: 'normal',
    lineHeight: '22px',
    letterSpacing: '0.6px',
  },
  edit: {
    padding: 16,
    textDecoration: 'underline',
    fontFamily: 'Roboto',
    fontStyle: 'normal',
    fontSize: '12px',    
    lineHeight: '18px',
    letterSpacing: '0.2px',
  },
}));

interface Props {
  image: string,
  furnitureType: Furniture;
  selected: boolean,
  onClicked: (type: Furniture) => void,
  onSizeChanged: (size: ObjectSize) => void;
}

export function FurnitureItem(props: Props) {
  const classes = useStyles(props);
  const [editExpanded, setEditExpanded ] = useState(false);

  const onInnerCircleClicked = () => {
    if (props.onClicked) {
      props.onClicked(props.furnitureType);
    }
  };

  const onEditClicked = () => {
    setEditExpanded(!editExpanded);
  };

  const onSizeChanged = (size: ObjectSize) => {
    if (props.onSizeChanged) {
      props.onSizeChanged(size);
    }
  };

  return (
    <div className={`${classes.container} ${editExpanded ? '' : classes.editMinimized}`}>
      <div className={classes.topSection}>
        <div>
          <img className={classes.image} src={props.image} onClick={onInnerCircleClicked}></img>
        </div>
        <div className={classes.outerCircle} onClick={onInnerCircleClicked}>
          <div className={classes.innerCircle}>
          </div>
        </div>
      </div>
      <div className={classes.middleSection}>
        <div className={classes.label}>{assetMap[props.furnitureType].label}</div>
        <div className={classes.edit} onClick={onEditClicked}>Edit</div>
      </div>
      <div className={editExpanded ? classes.bottomSectionMax : classes.bottomSectionMin}>
        <DimensionEdit furnitureType={props.furnitureType} onSizedChanged={onSizeChanged}></DimensionEdit>
      </div>
    </div>
  );
}
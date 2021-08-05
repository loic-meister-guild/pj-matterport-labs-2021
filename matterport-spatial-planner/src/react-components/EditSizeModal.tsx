import { makeStyles } from '@material-ui/styles';
import React, { useEffect, useState } from 'react';
import { assetMap, ObjectSize } from '../AssetMap';
import { Furniture } from '../interfaces';
import { ObjectSelector } from './ObjectSelector';

const useStyles = makeStyles({
  overlay: {
    flexDirection: 'column',
    display: 'flex',
    justifyContent: 'flexEnd',
    height: '100vh',
    width: '100%',
    pointerEvents: 'all',
  },
  modalContainer: {
    width: '485px',
    height: '300px',
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: `translateX(-50%) translateY(-50%)`,
    backgroundColor: '#F5F4F3',
    display: 'flex',
    flexDirection: 'column',
    paddingLeft: '56px',
    paddingRight: '56px',
    borderRadius: '4px',
    paddingTop: '56px',
  },
  header: {
    fontFamily: 'IBM Plex Sans',
    fontSize: '28px',
    fontWeight: 700,
    fontStyle: 'normal',
    lineHeight: '36px',
    letterSpacing: '0.4px',
    color: '#444444',
  },
  buttonContainer: {
    marginTop: 32,
  },
  button: {
    width: 86,
    height: 48,
    margin: 8,
    marginBottom: 32,
    backgroundColor: '#222222',
    borderStyle: 'solid',
    color: '#F5F4F3',
    '&:hover': {
      transition: 'all 0.2s',
      backgroundColor: '#ff3158',
      borderColor: '#ff3158',
    },
  },
});

interface Props {
  onSizeUpdated: (furnitureType: Furniture, size: ObjectSize) => void;
  onCancelled: () => void;
}

export function EditSizeModal(props: Props) {
  const classes = useStyles();
  const [ furnitureType, setFurnitureType ] = useState<Furniture>(Furniture.Chair);
  const [ size, setSize ] = useState<ObjectSize>(assetMap[furnitureType].size);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        props?.onCancelled();
      }
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, []);
  
  const onSizeUpdated = (furnitureType: Furniture, size: ObjectSize) => {
    setFurnitureType(furnitureType);
    setSize(size);
  };

  const onUpdatePressed = () => {
    props?.onSizeUpdated(furnitureType, size);
  };

  return (
    <div className={classes.overlay}>
      <div className={classes.modalContainer}>
        <div className={classes.header}>Edit dimensions</div>
        <ObjectSelector onObjectSelected={onSizeUpdated}></ObjectSelector>
        <div className={classes.buttonContainer}>
          <button className={classes.button} onClick={onUpdatePressed}>UPDATE</button>
        </div>
      </div>
    </div>
  );
}

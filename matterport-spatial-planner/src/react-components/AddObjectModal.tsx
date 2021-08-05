import React, { useContext, useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/styles';
import { FurnitureItem } from './FurnitureItem';
import { Furniture } from '../interfaces';
import { CommandContext } from '../CommandContext';
import { RoomSelectionContext } from '../RoomSelectionContext';
import { assetMap, ObjectSize } from '../AssetMap';

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
    width: '582px',
    height: '490px',
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
  },
  header: {
    height: 'auto',
    fontFamily: 'IBM Plex Sans',
    fontSize: '28px',
    fontWeight: 700,
    fontStyle: 'normal',
    lineHeight: '36px',
    letterSpacing: '0.4px',
    color: '#444444',
    margin: 8,
    marginTop: 32,
  },
  rowGridContainer: { // vertical grid
    display: 'flex',
    flexDirection: 'column',
  },
  itemGridContainer: { // horizontal grid
    display: 'flex',
    justifyContent: 'flex-start',
    flexDirection: 'row',
  },
  allItemsContainer: {
    height: 278,
    overflowY: 'scroll',
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
  }
});

interface Props{
  onCancelled: () =>void;
  onObjectAdded: () => void|null;
}

export function AddObjectModal(props: Props) {
  const [selection, setSelection ] = useState(Furniture.Chair);
  const [ size, setSize ] = useState<ObjectSize>(assetMap[Furniture.Chair].size);
  const classes = useStyles();
  const commandContext = useContext(CommandContext);
  const roomSelectionContext = useContext(RoomSelectionContext);

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

  const onSelected = (type: Furniture) => {
    setSelection(type);
    setSize(assetMap[type].size);
  };

  const onAddPressed = () => {
    commandContext.addObjectToRoomCenterCommandFactory.create().execute(selection, roomSelectionContext, size, undefined);
    if (props.onObjectAdded) {
      props.onObjectAdded();
    }
  };

  const onSizeChanged = (size: ObjectSize) => {
    setSize(size);
  }

  const renderFurnitureItem = (type: Furniture) => {
    return (
      <FurnitureItem
        image={assetMap[type].image}
        furnitureType={type}
        selected={selection === type}
        onClicked={onSelected}
        onSizeChanged={onSizeChanged}
      ></FurnitureItem>
    );
  };

  return (
    <div className={classes.overlay}>
      <div className={classes.modalContainer}>
        <div className={classes.rowGridContainer}>
          <div className={classes.header}>Add object</div>
          <div className={classes.allItemsContainer}>
            <div className={classes.itemGridContainer}>
              {renderFurnitureItem(Furniture.Chair)}
              {renderFurnitureItem(Furniture.Dresser)}
              {renderFurnitureItem(Furniture.Sofa)}
            </div>
            <div className={classes.itemGridContainer}>
              {renderFurnitureItem(Furniture.Table)}
              {renderFurnitureItem(Furniture.Bed)}
            </div>
          </div>
          <div className={classes.buttonContainer}>
            <button className={classes.button} onClick={onAddPressed}>ADD</button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { makeStyles } from '@material-ui/styles';
import React, { useState, FormEvent, ChangeEvent, useEffect, useContext } from 'react';
import { ObjectSelectionContext } from '../ObjectSelectionContext';
import { Furniture } from '../interfaces';
import { Object3D } from 'three';
import { Asset, assetMap, ObjectSize } from '../AssetMap';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: '18px',
  },
  sizeContainer: {
    display: 'flex',
    flexDirection: 'column',
    width: '75px',
  },
  selectContainer: {
    display: 'flex',
    flexDirection: 'column',
    width: '100px',
  },
  select: {
    height: '26px',
    width: '100px',
  },
  input: {
    height: '22px',
    width: '75px',
    padding: '0px',
  }
});

interface Props{
  onObjectSelected: (furnitureType: Furniture, size: ObjectSize) => void|null;
}

export function ObjectSelector(props: Props) {
  const objectSelection  = useContext(ObjectSelectionContext);
  const obj3D = (objectSelection as any).obj3D as Object3D;

  const currentSize: ObjectSize = obj3D.userData.size;
  const currentFurnitureType: Furniture = obj3D.userData.furnitureType;

  const [ size, setSize ] = useState<ObjectSize>(currentSize);
  const [ furnitureType, setFurnitureType ] = useState<Furniture>(currentFurnitureType);

  const classes = useStyles();

  useEffect(() => {
    if (props.onObjectSelected) {
      props.onObjectSelected(furnitureType, size);
    }
  }, [size, furnitureType]);

  const handleChange = (event: FormEvent<HTMLSelectElement>) => {
    const asset = assetMap[event.currentTarget.value];
    setSize(asset.size);
    setFurnitureType(event.currentTarget.value as unknown as Furniture);
  };

  const handleDepthChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newSize: ObjectSize = {
      depth: parseFloat(event.currentTarget.value),
      height: size.height,
      width: size.width,
    };

    setSize(newSize);
    props?.onObjectSelected(furnitureType, newSize);
  };

  const handleWidthChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newSize: ObjectSize = {
      depth: size.depth,
      height: size.height,
      width: parseFloat(event.currentTarget.value),
    };

    setSize(newSize);
    props?.onObjectSelected(furnitureType, newSize);
  };

  const handleHeightChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newSize: ObjectSize = {
      depth: size.depth,
      height: parseFloat(event.currentTarget.value),
      width: size.width,
    };

    setSize(newSize);
    props?.onObjectSelected(furnitureType, newSize);
  };

  const assetArray: Asset[] = [];
  for(const assetId in assetMap) {
    assetArray.push(assetMap[assetId]);
  }

  return (
    <div className={classes.container}>
      <div className={classes.selectContainer}>
        <label>Type</label>
        <select className={classes.select} onChange={handleChange}>
          {
            assetArray.map((asset: Asset, index: number) => {
              return (
                <option value={asset.id} key={index} selected={asset.id === furnitureType}>{asset.label}</option>
              );
            })
          }
        </select>
      </div>
      <div className={classes.sizeContainer}>
        <label>Width</label>
        <input type='number' placeholder='Width' step='0.01' className={classes.input} defaultValue={size.width} onChange={handleWidthChange}></input>
      </div>
      <div className={classes.sizeContainer}>
        <label>Height</label>
        <input type='number' placeholder='Height' step='0.01' className={classes.input} defaultValue={size.height} onChange={handleHeightChange}></input>
      </div>
      <div className={classes.sizeContainer}>
        <label>Depth</label>
        <input type='number' placeholder='Depth' step='0.01' className={classes.input} defaultValue={size.depth} onChange={handleDepthChange}></input>
      </div>
    </div>
  );
}
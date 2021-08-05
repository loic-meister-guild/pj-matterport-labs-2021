import { Dict } from '@mp/core';
import { Color } from 'three';
import { Furniture } from './interfaces';

export type ObjectSize = {
  width: number;
  height: number;
  depth: number;
}

export type ObjectPose = {
  rotation: {
    x: number,
    y: number,
    z: number,
    w: number,
  },
  x: number;
  y: number;
  z: number;
}

export type Asset = {
  id: Furniture;
  label: string;
  size: ObjectSize;
  color: Color;
  path: string;
  image: string;
  localPosition: { x: number, y: number, z: number };
}

export const assetMap: Dict<Asset> = {
  [Furniture.Chair]: {
    id: Furniture.Chair,
    label: 'Chair',
    size: { width: 0.55, height: 0.85, depth: 0.65},
    color: new Color(0xffffff),
    path: '../assets/cube/chair.dae',
    image: './assets/Chair.png',
    localPosition: { x: 0, y: -0.42, z: 0 },
  },
  [Furniture.Table]: {
    id: Furniture.Table,
    label: 'Table',
    size: { width: 1.7, height: 0.80, depth: 1.0},
    color: new Color(0xffffff),
    path: '../assets/cube/table.dae',
    image: './assets/Table.png',
    localPosition: { x: 0, y: -0.4, z: 0 },
  },
  [Furniture.Dresser]: {
    id: Furniture.Dresser,
    label: 'Dresser',
    size: { width: 0.8, height: 1.0, depth: 0.6},
    color: new Color(0xffffff),
    path: '../assets/cube/dresser.dae',
    image: './assets/Dresser.png',
    localPosition: { x: 0, y: -0.5, z: 0 },
  },
  [Furniture.Sofa]: {
    id: Furniture.Sofa,
    label: 'Sofa',
    size: { width: 2.25, height: 0.85, depth: 0.9},
    color: new Color(0xffffff),
    path: '../assets/cube/sofa.dae',
    image: './assets/Couch.png',
    localPosition: { x: 0, y: -0.42, z: 0 },
  },
  [Furniture.Bed]: {
    id: Furniture.Bed,
    label: 'Bed',
    size: { width: 1.8, height: 1.0, depth: 2.4},
    color: new Color(0xffffff),
    path: '../assets/cube/bed.dae',
    image: './assets/Bed.png',
    localPosition: { x: 0, y: -0.5, z: 0 },
  },
};

export const defaultFurniture: Furniture = Furniture.Chair;

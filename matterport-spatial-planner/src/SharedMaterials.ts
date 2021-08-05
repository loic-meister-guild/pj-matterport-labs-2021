import THREE from 'three';
import Tweakpane from 'tweakpane';
import { ISharedMaterialStack, Materials } from './interfaces';

export const setupMaterials = function(threeModule: typeof THREE, materialStack: ISharedMaterialStack, tweakPane: Tweakpane) {
  materialStack.push(Materials.SolidMaterial, new threeModule.MeshStandardMaterial({
    name: Materials.SolidMaterial,
    color: 0xffffff,
    roughness: 0.35,
    metalness: 0,
    side: threeModule.FrontSide,
    transparent: false,
    opacity: 1,
  }));

  const lineMaterial = new (threeModule as any).LineMaterial({
    name: Materials.Edges,
    side: threeModule.DoubleSide,
    color: 0x999999,
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
    dashed: false,
    linewidth: 1,
    polygonOffset: true,
    polygonOffsetFactor: -4.0,
    polygonOffsetUnits: -4.0,
  });
  const iframe = document.getElementById('sdk-iframe') as HTMLIFrameElement;
  const height = iframe.contentWindow.innerHeight;
  const width = iframe.contentWindow.innerWidth;
  lineMaterial.resolution.set(width, height);
  
  materialStack.push(Materials.Edges, lineMaterial);

  materialStack.push(Materials.Invisible, new threeModule.MeshBasicMaterial({
    name: Materials.Invisible,
    side: threeModule.FrontSide,
    transparent: true,
    opacity: 0,
    depthTest: false,
    depthWrite: false,
  }));
};

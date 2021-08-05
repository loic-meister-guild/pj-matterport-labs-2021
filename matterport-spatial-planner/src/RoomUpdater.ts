import { ObservableValue } from '@mp/core';
import { AdditiveBlending, Color, NormalBlending } from 'three';
import { IDisposable, IPool, IRoom, SelectingStateVisualProps } from './interfaces';
import { animateMaterial } from './MaterialAnimator';

const setEdgesUnhovered = function(room: IRoom, visualProps: SelectingStateVisualProps) {
  const edgesMaterial = room.getEdgesMaterial();
  edgesMaterial.opacity = visualProps.edgesUnhoverOpacity;
  edgesMaterial.linewidth = visualProps.edgesUnhoverWidth;
  edgesMaterial.color = new Color(visualProps.edgesUnhoverColor);
  edgesMaterial.blending = AdditiveBlending;
  edgesMaterial.blending = NormalBlending;
}

const setEdgesHovered = function(room: IRoom, visualProps: SelectingStateVisualProps) {
  const edgesMaterial = room.getEdgesMaterial();
  edgesMaterial.opacity = visualProps.edgesHoverOpacity;
  edgesMaterial.linewidth = visualProps.edgesHoverWidth;
  edgesMaterial.color = new Color(visualProps.edgesHoverColor);
  edgesMaterial.blending = NormalBlending;
}

class RoomUpdater implements IDisposable {
  private hoverCache: IRoom[] = [];
  private hoverDirty: boolean = false;
  private roomDisposables: Map<string, IDisposable|null> = new Map();
  private intervalId: number;

  constructor(private pool: IPool,
              private rooms: Map<string, IRoom>,
              private hover: ObservableValue<IRoom[]>,
              private visualProps: SelectingStateVisualProps) {
    this.onHoverDirty = this.onHoverDirty.bind(this);
    this.onHoverChanged = this.onHoverChanged.bind(this);
    this.tick = this.tick.bind(this);
    this.hover.onChanged(this.onHoverDirty);
    
    for (const roomName of this.rooms.keys()) {
      this.roomDisposables.set(roomName, null);
    }

    this.intervalId = window.setInterval(this.tick, 15);


    // initialize
    this.rooms.forEach((room: IRoom) => {
      const material = room.getMaterial();
      material.color = new Color(this.visualProps.roomUnhoverColor);
      this.roomDisposables.set(room.name, animateMaterial(this.pool, material, {
        duration: 300,
        target: this.visualProps.roomUnhoverOpacity,
        edges: false,
      }));
      setEdgesUnhovered(room, this.visualProps);
    });

  }

  private onHoverDirty() {
    this.hoverDirty = true;
  }

  private tick() {
    if (this.hoverDirty) {
      this.hoverDirty = false;
      this.onHoverChanged();
    }
  }

  private clearRoomAnimation(room: IRoom) {
    const disposable = this.roomDisposables.get(room.name);
    if (disposable) {
      disposable.dispose();
      this.roomDisposables.set(room.name, null);
    }
  }

  private onHoverChanged(): void {
    for (const hoverItem of this.hover.value) {
      const hoverSearch = this.hoverCache.findIndex((value: IRoom) => value === hoverItem);
      if (hoverSearch === -1) {
        this.clearRoomAnimation(hoverItem);
        
        // newly added
        this.roomDisposables.set(hoverItem.name, animateMaterial(this.pool, hoverItem.getMaterial(), {
          duration: 200,
          edges: false,
          target: this.visualProps.roomHoverOpacity,
        }));
        hoverItem.getMaterial().color.set(this.visualProps.roomHoverColor);

        setEdgesHovered(hoverItem, this.visualProps);
        hoverItem.setObjectsVisible(true);
      }
    }

    for (const hoverItem of this.hoverCache) {
      const hoverSearch = this.hover.value.findIndex((value: IRoom) => value === hoverItem);
      if (hoverSearch === -1) {        
        this.clearRoomAnimation(hoverItem);

        // removed
        this.roomDisposables.set(hoverItem.name, animateMaterial(this.pool, hoverItem.getMaterial(), {
          duration: 400,
          edges: false,
          target: this.visualProps.roomUnhoverOpacity,
        }));
        hoverItem.getMaterial().color.set(this.visualProps.roomUnhoverColor);

        setEdgesUnhovered(hoverItem, this.visualProps);
        hoverItem.setObjectsVisible(false);
      }
    }

    this.hoverCache = this.hover.value;
  }

  public dispose() {
    window.clearInterval(this.intervalId);

    for (const disposable of this.roomDisposables.values()) {
      if (disposable) {
        disposable.dispose();
      }
    }
    this.roomDisposables.clear();
  }
}

export const createRoomUpdater = function(pool: IPool, rooms: Map<string, IRoom>, hover: ObservableValue<IRoom[]>, visualProps: SelectingStateVisualProps): IDisposable {
  return new RoomUpdater(pool, rooms, hover, visualProps);
};
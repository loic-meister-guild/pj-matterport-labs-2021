import './style/paint-controls.css';
import React, { Component, Fragment } from 'react';
import { Button } from './Button';
import classNames from 'classnames';
import { Range } from './Range';
import { Dict } from '@mp/core';
import { ColorPicker } from './ColorPicker';

export interface IPaintToolControls {
  tool: {
    enabled: boolean;
    onSelected(tool: PaintTool): void;
  };
  color: {
    enabled: boolean;
    onChanged(color: string): void;
  };
  size: {
    enabled: boolean;
    onChanged(size: number): void;
  };
  opacity: {
    enabled: boolean;
    onChanged(opacity: number): void;
  };
}

export type ToolSettingsT = {
  activeTool: PaintTool;
  color: string;
  size: number;
  opacity: number;
}

type Props = {
  toolSettings: ToolSettingsT;
  paintToolControls: IPaintToolControls;
  enabled: boolean;
};

export enum PaintTool {
  NONE,
  COLOR,
  BRUSH,
  DROPPER,
}

export class PaintControls extends Component<Props> {
  private toolChangeCallbacks: Dict<() => void>;
  private colorChangeCallback: () => void;
  private brushWidthChangeCallback: (size: number) => void;
  private brushOpacityChangeCallback: (opacity: number) => void;

  private colorRef = React.createRef<HTMLInputElement>();
  private onColorBlurred: () => void;

  private percentageTransform: (value: number) => string;
  private inchTransform: (value: number) => string;

  constructor(props: Props) {
    super(props);

    this.toolChangeCallbacks = {
      [PaintTool.NONE]:    () => this.props.paintToolControls.tool.onSelected(PaintTool.NONE),
      [PaintTool.COLOR]:   () => this.props.paintToolControls.tool.onSelected(PaintTool.COLOR),
      [PaintTool.BRUSH]:   () => this.props.paintToolControls.tool.onSelected(PaintTool.BRUSH),
      [PaintTool.DROPPER]: () => this.props.paintToolControls.tool.onSelected(PaintTool.DROPPER),
    };

    this.onColorBlurred = () => {
      if (this.props.toolSettings.activeTool === PaintTool.COLOR) {
        this.props.paintToolControls.tool.onSelected(PaintTool.NONE);
      }
    }

    this.colorChangeCallback = () => this.props.paintToolControls.color.onChanged(this.colorRef.current.value);
    this.brushWidthChangeCallback = (size: number) => this.props.paintToolControls.size.onChanged(size);
    this.brushOpacityChangeCallback = (opacity: number) => this.props.paintToolControls.opacity.onChanged(opacity);

    this.percentageTransform = (value: number) => {
      return (value * 100).toFixed(0) + '%';
    }

    this.inchTransform = (value: number) => {
      return value.toFixed(1) + '"';
    }
  }

  render() {
    const activeTool = this.props.toolSettings.activeTool;
    return (
      <Fragment>
        <div
          className={'paint-control-overlay'}
        >
          <div
            className={'controls'}
          >
            <div
              className={'tool-button-container'}
            >
              <ColorPicker
                colorRef={this.colorRef}
                selected={this.props.toolSettings.activeTool === PaintTool.COLOR}
                enabled={this.props.enabled}
                color={this.props.toolSettings.color}
                onChange={this.colorChangeCallback}
                onClick={this.toolChangeCallbacks[PaintTool.COLOR]}
                onBlur={this.onColorBlurred}
              />
              <Button
                classNames={classNames('button tool-button icon icon-brush', {
                  'icon-brush': activeTool !== PaintTool.BRUSH,
                  'icon-checkmark': activeTool === PaintTool.BRUSH,
                  selected: activeTool === PaintTool.BRUSH,
                  enabled: this.props.enabled,
                })}
                onClick={activeTool !== PaintTool.BRUSH ? this.toolChangeCallbacks[PaintTool.BRUSH] : this.toolChangeCallbacks[PaintTool.NONE]}
              />
              <Button
                classNames={classNames('button tool-sub-button icon icon-dropper', {
                  selected: activeTool === PaintTool.DROPPER,
                  enabled: this.props.enabled,
                })}
                onClick={activeTool !== PaintTool.DROPPER ? this.toolChangeCallbacks[PaintTool.DROPPER] : this.toolChangeCallbacks[PaintTool.NONE]}
              >
                <div
                  className={classNames('icon icon-dropper-outline')}
                />
                <div
                  className={classNames('icon icon-dropper-fill')}
                  style={{ color: this.props.toolSettings.color }}
                />
              </Button>
            </div>
            <div
              className={'tool-options-container'}
            >
              {activeTool === PaintTool.BRUSH   && this.getBrushControls()}
            </div>
          </div>
        </div>
      </Fragment>
    );
  }

  private getBrushControls() {
    return (
      <Fragment>
      { this.props.paintToolControls.size.enabled &&
          <div
            className={'size-control'}
          >
            <div
              className={'range-label'}
            >
              Size
            </div>
            <Range
              min={0.5}
              max={20}
              step={0.5}
              value={this.props.toolSettings.size}
              onValueChange={this.brushWidthChangeCallback}
              valueTextTransform={this.inchTransform}
            />
          </div>
        }
        { this.props.paintToolControls.opacity.enabled &&
          <div
            className={'opacity-control'}
          >
            <div
              className={'range-label'}
            >
              Opacity
            </div>
            <Range
              min={0}
              max={1}
              step={0.01}
              value={this.props.toolSettings.opacity}
              onValueChange={this.brushOpacityChangeCallback}
              valueTextTransform={this.percentageTransform}
            />
          </div>
        }

      </Fragment>
    );
  }

}

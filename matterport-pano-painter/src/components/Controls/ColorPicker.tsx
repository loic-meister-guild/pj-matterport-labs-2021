import './style/color-picker.css';
import React, { Component, } from 'react';
import classNames from 'classnames';
import { preventDefault } from '../preventDefault';

type Props = {
  colorRef: React.RefObject<HTMLInputElement>;
  selected: boolean;
  enabled: boolean;
  color: string;
  onChange(): void;
  onClick(): void;
  onBlur(): void;
}

export class ColorPicker extends Component<Props> {
  render () {
    return (
      <div
        className={classNames('button tool-sub-button color-preview', {
          selected: this.props.selected,
          enabled: this.props.enabled,
        })}
        onContextMenu={preventDefault}
      >
        <input
          ref={this.props.colorRef}
          className={'button tool-sub-button color-selector enabled'}
          type='color'
          value={this.props.color}
          onChange={this.props.onChange}
          onClick={this.props.onClick}
          onBlur={this.props.onBlur}
        />
        <div
          className={'icon icon-bucket-fill'}
          style={{ color: this.props.color }}
        />
      </div>
    );
  }
}

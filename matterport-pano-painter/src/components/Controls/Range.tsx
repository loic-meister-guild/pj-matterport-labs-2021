import './style/range.css';
import React, { Component } from 'react';
import { preventDefault } from '../preventDefault';

type Props = {
  min: number;
  max: number;
  step: number;
  value: number;
  onValueChange(value: number): void;
  valueTextTransform(value: number): string;
}

export class Range extends Component<Props> {
  private rangeRef = React.createRef<HTMLInputElement>();
  private thumbRef = React.createRef<HTMLDivElement>();
  private progressBarRef = React.createRef<HTMLDivElement>();

  private onRangeInput: () => void;

  constructor(props: Props) {
    super(props);

    this.onRangeInput = () => this.props.onValueChange(parseFloat(this.rangeRef.current.value));
  }

  render() {
    const progress = (this.props.value - this.props.min) / (this.props.max - this.props.min) * 100 + '%';

    return (
      <div
        className={'range-wrapper'}
        onContextMenu={preventDefault}
      >
        <div
          className={'range-visual'}
        >
          <div
            className={'range-track'}
          >
            <div
              ref={this.progressBarRef}
              className={'range-progress'}
              style={{ width: progress }}
            />
          </div>
          <div
            ref={this.thumbRef}
            className={'range-thumb'}
            style={{ left: progress }}
          >
            <div
              className={'range-bubble'}
            >
              <div
                className={'range-value'}
              >
                {this.props.valueTextTransform(this.props.value)}
              </div>
            </div>
          </div>
        </div>
        <input
          ref={this.rangeRef}
          className={'range-internal'}
          type='range'
          min={this.props.min}
          max={this.props.max}
          step={this.props.step}
          value={this.props.value}
          onChange={this.onRangeInput}
        />
      </div>
    );
  }
}

export namespace Range {
  export function noTransform(value: number): string {
    return value + '';
  }
}

import './style/button.css';
import React, { Component } from 'react';
import { preventDefault } from '../preventDefault';

type ButtonProps = {
  classNames?: string;
  onClick(): void;
}

export class Button extends Component<ButtonProps> {
  render() {
    return (
      <div
        className={this.props.classNames}
        onClick={this.props.onClick}
        onContextMenu={preventDefault}
      >
        {this.props.children}
      </div>
    );
  }
}

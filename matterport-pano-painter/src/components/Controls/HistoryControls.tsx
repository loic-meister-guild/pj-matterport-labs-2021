import './style/history.css';
import React, { Component } from 'react';
import classNames from 'classnames';
import { IHistory } from '../History';
import { Button } from './Button';

type Props = {
  history: IHistory;
};

function noop() { }

export class HistoryControls extends Component<Props> {
  private undo: () => void;
  private redo: () => void;

  constructor(props: Props) {
    super(props);

    this.undo = () => props.history.undo();
    this.redo = () => props.history.redo();

    // TOOD: how can we avoid a `forceUpdate`?
    props.history.onHistoryChange(new class {
      constructor(private controls: HistoryControls) {}
      notify() {
        this.controls.forceUpdate();
      }
    }(this));
  }

  render() {
    const history = this.props.history;
    return (
      <div
        className={'history-buttons-container'}
      >
        <Button
          classNames={classNames('button history-button history-undo', {
            enabled: history.hasPrev,
          })}
          onClick={history.hasPrev ? this.undo : noop}
        >
          <div className={'icon icon-history'} />
          Undo
        </Button>
        <Button
          classNames={classNames('button history-button history-redo', {
            enabled: history.hasNext,
          })}
          onClick={history.hasNext ? this.redo : noop}
        >
         <div className={'icon icon-history'} />
          Redo
        </Button>
      </div>
    );
  }
}

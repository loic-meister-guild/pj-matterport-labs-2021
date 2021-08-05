import React, { Component } from 'react';
import { WithStyles, withStyles } from '@material-ui/core/styles';
import { Frame } from './Frame';
import { IContext, EditMode } from '../interfaces';
import { AppContext } from '../AppContext';
import { PlayControls } from './PlayControls';
import { SpeedControl } from './SpeedControl';
import { FSMObserver, FSMState } from 'src/AppFSM';
import { Unsubscribable } from 'xstate';

const styles = () => ({
});

interface Props extends WithStyles<typeof styles> {
  sid: string;
  onMount: () => void;
}

interface State {
  validPath: boolean;
  playing: boolean;
}

class MainViewImpl extends Component<Props, State> {
  context: IContext;
  static contextType = AppContext;
  private unsub: Unsubscribable = null;

  constructor(props: Props) {
    super(props);

    this.state = {
      validPath: false,
      playing: false,
    };

    this.onModeChanged = this.onModeChanged.bind(this);
    this.onPlayStarted = this.onPlayStarted.bind(this);
    this.onStop = this.onStop.bind(this);
    this.onValidPathChanged = this.onValidPathChanged.bind(this);
    this.onDurationChanged = this.onDurationChanged.bind(this);
  }

  componentDidMount() {
    this.context.editState.pathState.validPath.onChanged(this.onValidPathChanged);
    this.props.onMount();

    class StateHandler implements FSMObserver {
      constructor(private mainView: MainViewImpl) {}
      next(state: FSMState) {
        this.mainView.setState({
          playing: state.value === 'previewing',
        })
      }
      error(err: any) {}
      complete() {}
    };

    this.unsub = this.context.fsm.subscribe(new StateHandler(this));
  }

  componentWillUnmount() {
    this.unsub.unsubscribe();
  }

  private onModeChanged(mode: EditMode) {
    this.context.editState.transformMode.value = mode;
  }

  private onValidPathChanged() {
    this.setState({
      validPath: this.context.editState.pathState.validPath.value,
    });
  }

  private onPlayStarted() {
    this.context.fsm.send('START_PREVIEW');
  }

  private onStop() {
    this.context.fsm.send('INITIALIZE_EDITING');
  }

  private onDurationChanged(duration: number) {
    this.context.editState.visualizerState.duration.value = duration;
  }

  render() {
    return (
      <div>
        <PlayControls
          playing={this.state.playing}
          disabled={!this.state.validPath}
          onPlay={this.onPlayStarted}
          onStopped={this.onStop}
        ></PlayControls>
        <SpeedControl
          onChanged={this.onDurationChanged}
        ></SpeedControl>
        <Frame/>
      </div>
    );
  }
}

export const MainView = withStyles(styles, { withTheme: true })(MainViewImpl);
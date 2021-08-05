import React, { Component } from 'react';
import { WithStyles, withStyles, Button } from '@material-ui/core';
import PlayCircleFilledIcon from '@material-ui/icons/PlayCircleFilled';
import Stop from '@material-ui/icons/Stop';

const styles = () => ({ 
  root: {
    position: 'absolute' as 'absolute',
    margin: '10px',
    zIndex: 10,
    padding: '8px',
    background: 'white',
  }
});

interface Props extends WithStyles<typeof styles> {
  playing: boolean;
  disabled: boolean;
  onPlay: () => void;
  onStopped: () => void;
}

class PlayControlsImpl extends Component<Props> {

  constructor(props: Props){
    super(props);

    this.onClick = this.onClick.bind(this);
  }

  private onClick() {
    if (this.props.playing) {
      this.props.onStopped();
    }
    else {
      this.props.onPlay();
    }
  }

  render() {
    const icon = (playing: boolean) => {
      if (playing) {
        return <Stop/>;
      }
      else {
        return <PlayCircleFilledIcon/>;
      }
    };

    const text = (playing: boolean) => {
      if (playing) {
        return 'Stop';
      }
      else {
        return 'Play';
      }
    };

    return (
      <div className={this.props.classes.root}>
        <Button
          disabled={this.props.disabled}
          aria-label="play"
          size="large"
          onClick={this.onClick}
          startIcon={icon(this.props.playing)}
        >
          {text(this.props.playing)}
        </Button>
      </div>
    );
  }
}

export const PlayControls = withStyles(styles, { withTheme: true })(PlayControlsImpl);

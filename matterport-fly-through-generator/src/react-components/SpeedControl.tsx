import React, { Component, ChangeEvent } from 'react';
import { WithStyles, withStyles, Slider } from '@material-ui/core';

const marks = [
  {
    value: 1,
    label: 'Slow',
  },
  {
    value: 3,
    label: 'Medium',
  },
  {
    value: 5,
    label: 'Fast',
  },
];

const styles = () => ({ 
  root: {
    position: 'absolute' as 'absolute',
    margin: '10px',
    zIndex: 10,
    paddingTop: '5px',
    paddingLeft: '20px',
    paddingRight: '20px',
    background: 'white',
    left: '110px',
    width: '100px',
  }
});

interface Props extends WithStyles<typeof styles> {
  onChanged: (duration: number) => void;
}

class SpeedControlImpl extends Component<Props> {

  constructor(props: Props) {
    super(props);

    this.onSliderChanged = this.onSliderChanged.bind(this);
  }

  componentDidMount() {
    this.props.onChanged(marks[1].value);
  }

  private onSliderChanged(changeEvent: ChangeEvent, value: number) {
    this.props.onChanged(value);
  }

  render() {
    return (
      <div className={this.props.classes.root}>
        <Slider
          aria-label="custom thumb label"
          defaultValue={marks[1].value}
          marks={marks}
          onChange={this.onSliderChanged}
          max={marks[2].value}
          min={marks[0].value}
          step={marks[1].value - marks[0].value}
          track={false}
        />
      </div>
    );
  }
}

export const SpeedControl = withStyles(styles, { withTheme: true })(SpeedControlImpl);

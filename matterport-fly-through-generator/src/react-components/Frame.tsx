import React, { Component, createRef, RefObject, forwardRef } from 'react';
import { WithStyles, withStyles } from '@material-ui/core/styles';
import { EnvContext } from '../EnvContext';
import { IEnvContext } from '../interfaces';

const styles = () => ({
  root: {
    width: '100%',
    height: '100vh',
    position: 'absolute' as 'absolute',
    borderWidth: '0',
  }
});

interface Props extends WithStyles<typeof styles> {
  apiHost: string;
  sid: string;
  applicationKey: string;
};

const Iframe = (props: Props, ref: any) => {
  return (
    <iframe
      id='sdk-iframe'
      className={props.classes.root}
      src= {`./bundle/showcase.html?m=${props.sid}&apiHost=${props.apiHost}&applicationKey=${props.applicationKey}&mt=0&play=1&title=0&qs=1&sm=2&brand=0&sr=-2.87,-.04,-3.13&sp=-.09,3.83,-7.53`}
      ref={ref}
      allow='xr-spatial-tracking'
      allowFullScreen
    ></iframe>
  );
};

const IFrame2 = forwardRef(Iframe);

interface FrameProps extends WithStyles<typeof styles> {}

export class FrameImpl extends Component<FrameProps, {}> {
  private iframeRef: RefObject<HTMLIFrameElement>;

  constructor(props: Props) {
    super(props);

    this.state = {};
    this.iframeRef = createRef();
  }

  render(): JSX.Element {
    return (
      <EnvContext.Consumer>
        {
          (context: IEnvContext) => {
            return <IFrame2 applicationKey={context.applicationKey} apiHost={context.apiHost} classes={this.props.classes} ref={this.iframeRef} sid={context.sid}></IFrame2>;
          }
        }
        </EnvContext.Consumer>
    );
  }
}

export const Frame = withStyles(styles, { withTheme: true })(FrameImpl);

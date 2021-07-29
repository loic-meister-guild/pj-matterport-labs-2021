import React, { Component, Fragment } from 'react';
import { Frame } from './Frame';
import { Dict } from '@mp/core';

const defaultSid = 'j4RZx7ZGM6T';

type Props = {
  onMount?(modelSid: string): void;
};

type State = {
  sdk: any | undefined;
  error: string | undefined;
  inProgress: boolean;
  warning: string;
};

export class Main extends Component<Props, State> {
  private modelSid: string;
  private apiHost: string;
  private applicationKey: string;
  private iframeRef = React.createRef<HTMLIFrameElement>();

  constructor(props: Props) {
    super(props);

    const urlParams = new URLSearchParams(window.location.search);
    this.modelSid = urlParams.get('m') || defaultSid;
    this.apiHost  = urlParams.get('apiHost') || '';
    this.applicationKey = urlParams.get('applicationKey') || 'nsai8wcy6qwb4wfzh6k1u2mgc';
    this.state = {
      sdk: undefined,
      error: undefined,
      inProgress: false,
      warning: '',
    };

  }

  componentDidMount() {
    if (this.props.onMount) {
      this.props.onMount(this.modelSid);
    }
    connectSdk(
      this.iframeRef.current,
      this.applicationKey,
      (sdk) => this.onSdkConnect(sdk),
      (error) => this.setState({ error }));
  }

  componentWillUnmount() {
  }

  async onSdkConnect(sdk: State['sdk']) {
    type Sweep = {
      alignmentType: string;
    };
    const sweepCollection: Dict<{ aligned: boolean; }> = {};

    sdk.Sweep.data.subscribe({
      onAdded(index: string, item: Sweep) {
        sweepCollection[index] = { aligned: item.alignmentType === 'aligned' };
        setAlignedWarning();
      }
    });

    const currentPose: { sweep: string } = {
      sweep: '',
    }
    sdk.Camera.pose.subscribe({
      onChanged(pose: { sweep: string; }) {
        if (currentPose.sweep !== pose.sweep) {
          currentPose.sweep = pose.sweep;
          if (sweepCollection[currentPose.sweep]) {
            setAlignedWarning();
          }
        }
      }
    });

    const setAlignedWarning = () => {
      const currentSweep = sweepCollection[currentPose.sweep];
      if (currentSweep) {
        this.setState({
          warning: currentSweep.aligned ? '' : 'Navigate to an aligned sweep to use the paint tools',
        });
      }
    }
  }
  render() {
    return (
      <Fragment>
        <Frame
          getRef={this.iframeRef}
          modelSid={this.modelSid}
          apiHost={this.apiHost}
          applicationKey={this.applicationKey}
        />
      </Fragment>
    );
  }
}

function connectSdk(iframe: HTMLIFrameElement, applicationKey: string, onConnect: (sdk: State['sdk']) => void, onError: (error: string) => void): void {
  iframe.addEventListener('load', async function () {
    try {
      const sdk = await (iframe.contentWindow as any).MP_SDK.connect(iframe, applicationKey, '3.5');
      onConnect(sdk);
    } catch (e) {
      onError(e);
    }
  });
}
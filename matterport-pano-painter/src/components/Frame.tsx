import React, { Component } from 'react';

type Props = {
  getRef: React.RefObject<HTMLIFrameElement>;
  modelSid: string;
  apiHost?: string;
  applicationKey: string;
}

export class Frame extends Component<Props> {
  render() {
    const apiHostParam = `&apiHost=${this.props.apiHost}`;
    const applicationKeyParam = `&applicationKey=${this.props.applicationKey}`;
    const src = `./bundle/showcase.html?m=${this.props.modelSid}${this.props.apiHost ? apiHostParam : ''}${applicationKeyParam}&hr=0&gt=0&play=1&dh=0&fp=0&title=0&mt=0`;
    return (
      <iframe
        ref={this.props.getRef}
        id='sdk-iframe'
        src={src}
      />
    )
  }
}

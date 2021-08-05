import React, { useEffect } from 'react';
import { IEnvContext } from '../types';
import { AppRoot } from './AppRoot';
import { BundleIframe } from './BundleIframe';

const defaults: {[domain: string]: IEnvContext} = {
  'https://my.matterport.com': {
    sid: 'j4RZx7ZGM6T',
    applicationKey: 'PUT_YOUR_SDK_KEY_HERE',
    apiHost: 'https://my.matterport.com',
  },
  'https://qa3-app.matterport.com': {
    sid: 'AAWs9eZ9ip6',
    applicationKey: 'qa314apf28d4um76n45cz91md',
    apiHost: 'https://qa3-app.matterport.com',
  },
};

interface Props {
  onMount: () => void;
}
export function Main(props: Props) {
  const params = new URLSearchParams(window.location.search);

  let env: IEnvContext;
  if (!params.has('apiHost')) {
    params.set('apiHost', 'https://qa3-app.matterport.com');
  }

  env = defaults[params.get('apiHost')];

  if (!params.has('m')) {
    params.set('m', env.sid);
  }

  if (!params.has('applicationKey')) {
    params.set('applicationKey', env.applicationKey);
  }

  params.set('qs', '1');
  params.set('title', '0');
  params.set('texlod', '0');
  params.set('mt', '0');
  params.set('aa', '1');
  params.set('sm', '2');
  params.set('sr', '-1.66,1.25,1.67');
  params.set('sp', '23.76,9.87');
  params.set('brand', '0');
  params.set('play', '1');

  useEffect(() => {
    props.onMount();
  }, []);
  
  return (
    <div>
      <div>
        <BundleIframe parameters={params.toString()}></BundleIframe>
      </div>
      <AppRoot></AppRoot>
    </div>
  )
}

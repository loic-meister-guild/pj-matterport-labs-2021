import * as ReactDOM from 'react-dom';
import * as React from 'react';
import { MainView } from './react-components/Main';
import { IEnvContext, IContext } from './interfaces';
import { AppContext } from './AppContext';
import { Application } from './Application';
import { Page } from '@mp/save';
import { Dict } from '@mp/core';
import { EnvContext } from './EnvContext';

const defaults: Dict<IEnvContext> = {
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

const initialize = async () => {
  const params = new URLSearchParams(window.location.search);
  const apiHost = params.get('apiHost') || 'https://qa3-app.matterport.com';
  const sid = params.get('m') || defaults[apiHost].sid;
  const applicationKey = params.get('applicationKey') || defaults[apiHost].applicationKey;

  const application = new Application(applicationKey);
  const context: IContext = {
    fsm: application.fsm,
    editState: application.editState,
  };

  application.fsm.start();
  application.fsm.send('INITIALIZE_EDITING');

  console.log(`Using host:${apiHost} space:${sid} appKey:${applicationKey}`);

  ReactDOM.render(
    <AppContext.Provider value={context}>
      <EnvContext.Provider value={{
        apiHost,
        applicationKey,
        sid,
      }}>
        <MainView sid={sid} onMount={onMount}/>
      </EnvContext.Provider>
    </AppContext.Provider>,
    document.getElementById('content')
  );

  async function onMount() {
    if (params.get('debug') === '1') {
      document.body.style.overflow = 'visible';

      const dbConf = Page.openDb('fly/' + sid);
      Page.setupMockMessageButtons(async (observer) => {
        const appSaver = await Page.AppSaveRequester.create(window, dbConf, observer);
        return appSaver;
      });
    }
  }
};

initialize();

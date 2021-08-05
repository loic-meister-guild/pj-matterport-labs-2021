import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Main } from './react-components/Main';
import { EnvContext } from './react-components/EnvContext';
import { IEnvContext } from './types';
import { Application2 } from './Application2';
import { FSMContextProvider } from './react-components/FSMContextProvider';
import { CommandProvider } from './react-components/CommandProvider';
import { RoomSelectionProvider } from './react-components/RoomSelectionProvider';
import { ObjectSelectionProvider } from './react-components/ObjectSelectionProvider';
import { GizmoModeProvider } from './react-components/GizmoModeProvider';
import { DrawStyleProvider } from './react-components/DrawStyleProvider';
import { Page } from '@mp/save';

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

const params = new URLSearchParams(window.location.search);

let env: IEnvContext;
if (params.has('apiHost')) {
  env = defaults[params.get('apiHost')];
}
else {
  env = defaults['https://qa3-app.matterport.com'];
}

const sid = params.get('m') || env.sid;
const debug = params.get('debug') === '1';
const debugSave = params.get('debugSave') === '1';

const application = new Application2(sid, env.apiHost, env.applicationKey, debugSave, debug);
application.fsm.start();
application.fsm.send('START');


ReactDom.render(
  <FSMContextProvider fsm={application.fsm}>
    <EnvContext.Provider value={env}>
      <CommandProvider provider={application.commandFactories}>
        <RoomSelectionProvider roomSelection={application.state.roomSelection as any}>
          <ObjectSelectionProvider   objectSelection={application.state.objectSelection}>
            <GizmoModeProvider gizmoMode={application.state.gizmoMode}>
              <DrawStyleProvider drawStyle={application.state.meshDrawStyle}>
                <Main onMount={onMount}/>
              </DrawStyleProvider>
            </GizmoModeProvider>
          </ObjectSelectionProvider>
        </RoomSelectionProvider>
      </CommandProvider>
    </EnvContext.Provider>
  </FSMContextProvider>,
  document.getElementById('content')
);

async function onMount() {
  if (debugSave) {
    document.body.classList.add('has-saves');
    const dbConf = Page.openDb('spatial-planner/' + env.sid);
    Page.setupMockMessageButtons(async (saveObserver) => {
      const appSaver = await Page.AppSaveRequester.create(window, dbConf, saveObserver);
      return appSaver;
    });
  }
}
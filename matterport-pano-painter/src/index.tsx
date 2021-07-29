import './main.css';

import React from 'react';
import * as ReactDom from 'react-dom';
import { Main } from './components/Main';

ReactDom.render((
  <Main
    onMount={onMount}
  />
), document.getElementById('content'));

import { Page } from '@mp/save';

async function onMount(modelSid: string) {
  document.body.classList.add('has-saves');
  const dbConf = Page.openDb('paint/' + modelSid);
  Page.setupMockMessageButtons(async (saveObserver) => {
    const appSaver = await Page.AppSaveRequester.create(window, dbConf, saveObserver);
    return appSaver;
  });
}

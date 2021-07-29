import './main.css';

import React from 'react';
import * as ReactDom from 'react-dom';
import { Main } from './components/Main';

ReactDom.render((
  <Main
    onMount={onMount}
  />
), document.getElementById('content'));

async function onMount(modelSid: string) {

}
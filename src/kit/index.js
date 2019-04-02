import React from 'react';
import { Provider } from 'react-redux';
import debuggerStore from './store';

import App from './components/App';

function Debugger() {
  return <App />;
}

export default Debugger;

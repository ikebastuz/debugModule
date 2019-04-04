import React from 'react';
import { Provider } from 'react-redux';
import store from './store';
import App from './components/App';

function AppDebugger() {
  return (
    <Provider store={store}>
      <App />
    </Provider>
  );
}

export default AppDebugger;

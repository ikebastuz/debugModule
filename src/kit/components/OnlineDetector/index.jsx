import React from 'react';
import { Offline, Online } from 'react-detect-offline';
import classNames from 'classnames';

import { detector, online, offline } from './styles.css';

export default () => (
  <React.Fragment>
    <Online>
      <div className={classNames(detector, online)} />
    </Online>
    <Offline>
      <div className={classNames(detector, offline)} />
    </Offline>
  </React.Fragment>
);

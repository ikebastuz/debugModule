import React from 'react';
import Skeleton from '../Skeleton';
import Video from '../Video';

import { layout } from './styles.css';

export default () => (
  <div className={layout}>
    <Skeleton />
    <Video />
  </div>
);

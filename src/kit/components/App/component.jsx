import React from 'react';
import CV from '../CV';
import OnlineDetector from '../OnlineDetector';
import Video from '../Video';
import HUD from '../HUD';
import { layout } from './styles.css';

export default () => (
  <div className={layout}>
    <OnlineDetector />
    <HUD />
    <CV />
    <Video />
  </div>
);

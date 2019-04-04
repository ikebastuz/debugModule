import { init } from '@rematch/core';

import { vision } from './models/vision.js';
import { view } from './models/view.js';
import { cvEvents } from './models/cvEvents.js';

export default init({
  models: { vision, view, cvEvents }
});

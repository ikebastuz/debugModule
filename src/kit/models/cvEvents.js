import { dispatch } from '@rematch/core';
import { throttle } from '../utils';
import { subscribeCVEvent } from './kit';

export const cvEvents = {
  state: {
    data: {}
  },
  reducers: {
    setState: (state, payload) => ({
      data: payload
    })
  },
  effects: {
    subscribe: () => {
      try {
        subscribeCVEvent(
          throttle((data) => {
            dispatch.cvEvents.setState(data);
          }, 200)
        );
      } catch (error) {
        console.info(error.message);
      }
    }
  }
};

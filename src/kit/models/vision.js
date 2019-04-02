import { dispatch } from '@rematch/core';
import { subscribeVision, throttle } from '../utils';

export const vision = {
  state: {
    data: null
  },
  reducers: {
    setState: (state, payload) => ({
      ...state,
      data: payload
    })
  },
  effects: {
    subscribe: async () => {
      try {
        subscribeVision(
          throttle((data) => {
            dispatch.vision.setState(data);
          }, Math.floor(1000 / 30))
        );
      } catch (error) {
        console.info(error.message);
      }
    }
  }
};

import { dispatch } from '@rematch/core';
import { throttle } from '../utils';
import { KitApi } from 'outernets-apps-core';

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
        KitApi.subscribeCVEvent(
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

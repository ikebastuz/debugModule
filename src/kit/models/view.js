export const view = {
  state: {
    ready: false,
    layout: null
  },
  reducers: {
    setState: (state, payload) => ({
      ...state,
      ...payload
    }),
    setLayout: (state, payload) => ({
      ...state,
      layout: payload
    })
  },
  effects: {}
};

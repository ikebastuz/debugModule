function onCVEvent(e, cb) {
  const eventType = 'CV_SNAPSHOT_V2';

  if (e.data && e.data[1].type === eventType) {
    cb(e.data[1].payload);
  }
}

async function makeRequest(url, data) {
  return fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
}

export const subscribeCVEvent = (callback) => {
  const listener = (event) => onCVEvent(event, callback);
  window.addEventListener('message', listener);

  return () => window.removeEventListener('message', listener);
};

export const getSettings = () => {
  try {
    return JSON.parse(decodeURIComponent(window.location.search.slice(1)));
  } catch (err) {
    return null;
  }
};

export const holdScheduler = (time = 0) => {
  const settings = getSettings();

  if (!settings) return Promise.reject(new Error('Can not read app settings'));

  const body = {
    areaId: settings.areaId,
    holdTime: time
  };

  return makeRequest(`${settings.baseUrl}holdScheduler`, body);
};

export const sendMetrics = (metrics = []) => {
  const settings = getSettings();

  if (!settings) return Promise.reject(new Error('Can not read app settings'));

  return makeRequest(
    `${settings.baseUrl}app-metrics/${settings.appId}`,
    metrics
  );
};

export const throttle = (fun, ms) => {
  let isLocked = false;

  return (...args) => {
    if (!isLocked) {
      fun(...args);
      isLocked = true;
      setTimeout(() => (isLocked = false), ms);
    }
  };
};

export async function subscribeVision(callback) {
  const socket = new WebSocket('ws://localhost:9090');
  await new Promise((resolve) => (socket.onopen = resolve));
  socket.onmessage = ({ data }) => callback(JSON.parse(data));
  return socket;
}

export async function subscribeVision(callback) {
  try {
    const socket = new WebSocket('ws://localhost:9090');
    socket.onmessage = ({ data }) => callback(JSON.parse(data));
    socket.onclose = () => setTimeout(() => subscribeVision(callback), 1000);
    socket.onerror = (err) => console.error(`Socket error | ${err}`);
    return socket;
  } catch (err) {
    console.error(`Socket error | ${err}`);
    setTimeout(() => subscribeVision(callback), 1000);
  }
}

export function throttle(fun, ms) {
  let isLocked = false;

  return (...args) => {
    if (!isLocked) {
      fun(...args);
      isLocked = true;
      setTimeout(() => (isLocked = false), ms);
    }
  };
}

export function partsReducer(poses, listenParts) {
  return Object.values(poses).reduce(
    (acc, parts) =>
      listenParts.reduce(
        (acc, partId) =>
          parts[partId]
            ? acc.concat([Object.assign({ partId }, parts[partId])])
            : acc,
        acc
      ),
    []
  );
}

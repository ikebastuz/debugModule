import QRCode from 'qrcode';

export const createQRCode = (url) => {
  return QRCode.toDataURL(url);
};

export const createShortUrl = ({
  url,
  token = '5433e0175462bbe705ce3d25064f1206aad86437'
}) => {
  return fetch(
    `https://api-ssl.bitly.com/v3/shorten?access_token=${token}&longUrl=${url}`
  )
    .then((res) => res.json())
    .then((res) => res.data.url);
};

export const captureWebcam = () => {
  if (navigator.mediaDevices) {
    return navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => stream);
  } else {
    return Promise.reject(
      new Error(
        'Native web camera streaming (getUserMedia) not supported in this browser.'
      )
    );
  }
};

export const injectDataToURL = (url, data) => {
  try {
    const tmp = new URL(url);
    tmp.searchParams.set('d', encodeURIComponent(JSON.stringify(data)));
    return tmp.toString();
  } catch (_) {
    return null;
  }
};

export const ejectDataFromURL = (url) => {
  try {
    const tmp = new URL(url);
    return JSON.parse(decodeURIComponent(tmp.searchParams.get('d')));
  } catch (_) {
    return null;
  }
};

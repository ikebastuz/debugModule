const endpoint = 'http://127.0.0.1:8085';
const settings = {
  method: 'POST',
  cache: 'no-cache',
  mode: 'cors',
  headers: {
    'Content-Type': 'application/json'
  }
};

export async function initModel() {
  return fetch(`${endpoint}/loadModel`, {
    ...settings,
    body: JSON.stringify({ modelName: 'palm_gesture_360_6k' })
  }).then((response) => response.json());
}

export async function createTrainImage(imageData) {
  return fetch(`${endpoint}/trainImage`, {
    ...settings,
    body: JSON.stringify({ imageData })
  }).then((response) => {
    console.log(response.statusText);
    return response.json();
  });
}

export async function classifyImage(imageData) {
  return fetch(`${endpoint}/predict`, {
    ...settings,
    body: JSON.stringify({ imageData })
  }).then((response) => {
    return response.json();
  });
}

export async function microsoftRequest(imageData) {
  const params = {
    returnFaceId: 'true',
    returnFaceRectangle: 'true',
    returnFaceLandmarks: 'true',
    returnFaceAttributes: 'age,gender,smile,headPose'
  };
  return fetch(
    `https://eastus2.api.cognitive.microsoft.com/face/v1.0/detect?${encodeQueryData(
      params
    )}`,
    {
      mode: 'cors',
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Ocp-Apim-Subscription-Key': 'aa5b32722e9c4477b9e96b81e8eb2248'
      },
      body: imageData
    }
  )
    .then((response) => {
      console.log(response);
      return response.json();
    })
    .then((data) => console.log(data))
    .catch((err) => console.log(err));
}

function encodeQueryData(data) {
  const ret = [];
  for (let d in data)
    ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(data[d]));
  return ret.join('&');
}

export function random(min, max) {
  var rand = min - 0.5 + Math.random() * (max - min + 1);
  rand = Math.round(rand);
  return rand;
}

export function loadConfig() {
  return fetch('./config.json')
    .then((res) => res.json())
    .catch((err) => console.log(err));
}

const koeff = 0.8;

export function mapCoord(coord) {
  if (coord < 0.5) {
    return coord - ((0.5 - coord) / (0.5 - (1 - koeff))) * (1 - koeff);
  } else if (coord > 0.5) {
    return coord + ((coord - 0.5) / (0.5 - (1 - koeff))) * (1 - koeff);
  } else {
    return 0.5;
  }
}

export function getBoundingBox(element, n = 1) {
  if (element) {
    const rect = element.getBoundingClientRect();

    const bb = [
      rect.x,
      rect.y,
      rect.x + rect.width * n,
      rect.y + rect.height * n
    ];

    return bb;
  } else {
    return [0, 0, 0, 0];
  }
}

function nodeCoord(node, { width, height }) {
  return node
    ? {
        x: (1 - node.x) * width,
        y: node.y * height
      }
    : false;
}

function nodeAbsPos(node) {
  return node ? { top: `${node.y}px`, left: `${node.x}px` } : false;
}

export function passerStyles(emoji) {
  return {
    head: nodeAbsPos(emoji.head),
    lhand: nodeAbsPos(emoji.lhand),
    rhand: nodeAbsPos(emoji.rhand)
  };
}

export function personsNodeCoords(person, bb, layout) {
  let head = person[0];

  if (head) {
    return {
      head: nodeCoord(person[0], layout),
      lhand: nodeCoord(person[44], layout),
      rhand: nodeCoord(person[77], layout)
    };
  } else {
    return {
      head: false,
      lhand: false,
      rhand: false
    };
  }
}

export function calcLayout(video) {
  let width,
    height,
    top = 0,
    left = 0,
    scale = 1;

  const webcamWidth = video.videoWidth;
  const webcamHeight = video.videoHeight;
  const webcamRatio = webcamWidth / webcamHeight;
  const aspectRatio = window.innerWidth / window.innerHeight;

  if (webcamRatio < aspectRatio) {
    width = window.innerWidth;
    scale = width / webcamWidth;
    height = width / webcamRatio;
    top = window.innerHeight / 2 - height / 2;
  } else {
    height = window.innerHeight;
    scale = height / webcamHeight;
    width = height * webcamRatio;
    left = 0 - (width / 2 - window.innerWidth / 2);
  }

  return { width, height, top, left, scale };
}

export const sum = (array) => array.reduce((a, b) => a + b, 0);

export const max = (array) => Math.max.apply(null, array);

export const calcWidth = (item, max) => (item / max) * 100;

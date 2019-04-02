const bones = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [1, 5],
  [5, 6],
  [6, 7],
  [1, 11],
  [1, 8],
  [8, 11],
  [14, 15],
  [0, 14],
  [0, 15],
  [0, 16],
  [0, 17],
  [8, 9],
  [9, 10],
  [11, 12],
  [12, 13]
];

const headNodes = [0, 14, 15, 16, 17];
const leftEye = 15;
const rightEye = 14;

export const tagCoords = (visionData) => {
  let nodes = Object.keys(visionData).map((personInd) => {
    for (let headNode of headNodes) {
      const personNodes = visionData[personInd]['lastSnap']['nodes'];
      if (personNodes[headNode]) {
        return Object.assign(
          {
            personInd,
            eyeDist:
              personNodes[leftEye] && personNodes[rightEye]
                ? Math.hypot(
                    personNodes[leftEye]['x'] - personNodes[rightEye]['x'],
                    personNodes[leftEye]['y'] - personNodes[rightEye]['y']
                  )
                : 0
          },
          personNodes[headNode]
        );
      }
    }
    return false;
  });
  return nodes;
};

export const bonesMap = (visionData) => {
  let drawLines = {};
  Object.keys(visionData).map((personInd) => {
    let personLines = [];
    bones.forEach((pair) => {
      const personParts = visionData[personInd].lastSnap.nodes;
      if (personParts[pair[0]] && personParts[pair[1]]) {
        personLines.push({
          x1: personParts[pair[0]]['x'],
          y1: personParts[pair[0]]['y'],
          x2: personParts[pair[1]]['x'],
          y2: personParts[pair[1]]['y']
        });
      }
    });
    drawLines[personInd] = personLines;
  });

  return drawLines;
};

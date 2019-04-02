import uuidv1 from 'uuidv1';

class TrackerApi {
  constructor(cvs) {
    this.cvs = cvs;
    if (cvs) {
      this.ctx = cvs.getContext('2d');
    }
    // complete persons data
    this.persons = {};
    // ticks before deleting person
    this.ticksToLoosePerson = 20;
    // snapshots to save for each person
    this.personsCacheLength = 20;
    // person tag vertical shift
    this.tagShift = 0.1;
    this.colorCursor = 0;
    this.newPersonMinDist = 0.15;
    // false-detect snapshots treshold
    this.falseDetectSnaps = 3;
    this.debugmode = false;
    // flat-hand adding
    this.flathands = false;

    /* 
      max input persons (affects performance)
      5 = 120 combos
      6 = 720 combos
      7 = 5040 combos
      8 = 40320 combos
    */
    this.maxIncomePersons = 5;

    // luminance density (calc every N-th pixel)
    this.luminanceDensity = 100;

    // weights of distance functions
    this.weights = {
      nodeDistances: 1,
      massCenterPredictedDistances: 1,
      luminanceDiff: 2
    };

    // HSV constants, dont change
    this.luminanceWeights = {
      red: 0.299,
      green: 0.587,
      blue: 0.114
    };

    // cached data to improve snapshot calculations performance
    this.snapDistCache = {};
    this.snapCMPredictCache = {};
    this.snapLuminanceCache = {};

    this.skeletonDrawer = new SkeletonDrawer();
  }

  feed(cvData) {
    const calc_start = performance.now();

    this.snapDistCache = {};
    this.snapCMPredictCache = {};
    this.snapLuminanceCache = {};

    // takes top N objects with maximum detected points
    cvData = this.filterIncomingData(cvData);

    if (Object.keys(this.persons).length === 0) {
      // persons empty -> all cvFeed to new persons
      for (let personIndex in cvData) {
        this.initPerson(cvData[personIndex]);
      }
    } else {
      const combos = this.calcCombos(cvData);
      const bestCombo = this.pickBestCombo(combos);
      this.mapCvDataToPersons(cvData, bestCombo);

      if (this.debugmode) {
        console.log(combos);
      }
    }

    const calc_end = performance.now();

    if (this.debugmode) {
      console.warn(`CALC TIME = ${calc_end - calc_start}`);
    }
  }

  getFeed() {
    const feed = {};

    for (let personId in this.persons) {
      if (this.persons[personId].cache.length > this.falseDetectSnaps) {
        feed[personId] = this.persons[personId].lastSnap.nodes;
      }
    }

    return feed;
  }

  initPerson(snapshot) {
    const personId = uuidv1();
    const snap = this.genSnapShot(snapshot, personId);
    this.persons[personId] = {
      cache: [snap],
      lastSnap: snap,
      missedTicks: 0,
      missing: false,
      color: skeletonColors[this.colorCursor]
    };
    this.colorCursor =
      this.colorCursor === skeletonColors.length - 1 ? 0 : this.colorCursor + 1;
  }

  genSnapShot(snapshot, personId) {
    if (this.flathands) {
      snapshot = this.addFlatHands(snapshot);
    }

    const vector = this.calcVector(snapshot, personId);
    const massCenter = this.massCenter(snapshot);
    const snap = {
      nodes: snapshot,
      massCenter,
      vector,
      massCenterPredict: this.massCenterPredict(massCenter, vector, personId),
      bones: this.getBones(snapshot),
      tagPos: this.getTagpos(snapshot)
    };

    if (this.cvs && this.ctx) {
      snap.luminance = this.getPersonLuminance(snapshot);
    }

    return snap;
  }

  filterIncomingData(cvData) {
    cvData = Object.assign({}, Object.values(cvData).sort(this.sortCVData));

    if (Object.keys(cvData).length > this.maxIncomePersons) {
      cvData = Object.keys(cvData)
        .map((key) => cvData[key])
        .slice(0, this.maxIncomePersons);
    }

    return cvData;
  }

  sortCVData(a, b) {
    return Object.keys(b).length - Object.keys(a).length;
  }

  calcCombos(cvData) {
    return this.getAllPermutations(
      Object.keys(this.persons),
      Object.keys(cvData)
    ).map((combo) => {
      const c = {
        combo,
        values: {
          nodeDistances: this.calcNodeDistances(combo, cvData),
          massCenterPredictedDistances: this.calcMassCenterPredictedDistances(
            combo,
            cvData
          )
        }
      };

      if (this.cvs && this.ctx) {
        c.values.luminanceDiff = this.calcLuminanceDiff(combo, cvData);
      }

      return c;
    });
  }

  addFlatHands(snapshot) {
    if (!snapshot[3] && !snapshot[6]) return snapshot;

    snapshot = this.predictHand(snapshot, 4);
    snapshot = this.predictHand(snapshot, 7);

    return snapshot;
  }

  predictHand(snapshot, handIdx) {
    if (snapshot[handIdx]) {
      snapshot[handIdx * 11] = {
        x:
          snapshot[handIdx].x +
          (snapshot[handIdx].x - snapshot[handIdx - 1].x) * 0.2,
        y:
          snapshot[handIdx].y +
          (snapshot[handIdx].y - snapshot[handIdx - 1].y) * 0.2,
        score: 1
      };
    } /* else if (
      !snapshot[handIdx] &&
      snapshot[handIdx - 1] &&
      snapshot[handIdx - 1].y < 0.85
    ) {
      snapshot[handIdx * 11] = {
        x:
          snapshot[handIdx - 1].x +
          (snapshot[handIdx - 1].x - snapshot[handIdx - 2].x) * 0.2,
        y:
          snapshot[handIdx - 1].y -
          (snapshot[handIdx - 1].y - snapshot[handIdx - 2].y) * 0.2,
        score: 1
      };
    }
    */

    return snapshot;
  }

  calcMassCenterPredictedDistances(combo, cvData) {
    let total = 0;
    for (let personId in combo) {
      if (this.snapCMPredictCache[`${personId}_${combo[personId]}`]) {
        total += this.snapCMPredictCache[`${personId}_${combo[personId]}`];
      } else {
        const lastSnap = this.lastSnapShot(personId);
        if (lastSnap.massCenterPredict) {
          const dist = this.distBetweenNodes(
            lastSnap.massCenterPredict,
            this.massCenter(cvData[combo[personId]])
          );
          total += dist;
          this.snapCMPredictCache[`${personId}_${combo[personId]}`] = dist;
        } else {
          return 0;
        }
      }
    }
    return total;
  }

  calcLuminanceDiff(combo, cvData) {
    let total = 0;

    for (let personId in combo) {
      if (this.snapLuminanceCache[`${personId}_${combo[personId]}`]) {
        total += this.snapLuminanceCache[`${personId}_${combo[personId]}`];
      } else {
        const luminanceDiff = Math.abs(
          this.getPersonLuminance(cvData[combo[personId]]) -
            this.lastSnapShot(personId).luminance
        );
        this.snapLuminanceCache[
          `${personId}_${combo[personId]}`
        ] = luminanceDiff;

        total += luminanceDiff;
      }
    }
    return total;
  }

  calcNodeDistances(combo, cvData) {
    let total = 0;
    for (let personId in combo) {
      if (this.snapDistCache[`${personId}_${combo[personId]}`]) {
        total += this.snapDistCache[`${personId}_${combo[personId]}`];
      } else {
        const dist = this.distBetweenSnapshots(
          this.lastSnapShot(personId).nodes,
          cvData[combo[personId]]
        );
        this.snapDistCache[`${personId}_${combo[personId]}`] = dist;

        total += dist;
      }
    }
    return total;
  }

  pickBestCombo(combos) {
    let bestIndex = 0;
    let bestWeight = null;

    for (let i = 0; i < combos.length; i++) {
      let weight = 0;

      for (let func in combos[i].values) {
        weight += combos[i].values[func] * this.weights[func];
      }

      if (bestWeight === null || weight < bestWeight) {
        bestWeight = weight;
        bestIndex = i;
      }
    }
    return combos[bestIndex].combo;
  }

  getBoundingBox(snapshot) {
    let [minX, minY, maxX, maxY] = [false, false, false, false];

    for (let nodeInd in snapshot) {
      if (!minX || snapshot[nodeInd].x < minX) {
        minX = snapshot[nodeInd].x;
      }
      if (!minY || snapshot[nodeInd].y < minY) {
        minY = snapshot[nodeInd].y;
      }
      if (!maxX || snapshot[nodeInd].x > maxX) {
        maxX = snapshot[nodeInd].x;
      }
      if (!maxY || snapshot[nodeInd].y > maxY) {
        maxY = snapshot[nodeInd].y;
      }
    }

    return [minX, minY, maxX, maxY];
  }

  getPersonLuminance(snapshot) {
    const boundingBox = this.getBoundingBox(snapshot);
    try {
      const imgData = this.ctx.getImageData(
        this.percent2pix(boundingBox[0]),
        this.percent2pix(boundingBox[1], true),
        this.percent2pix(boundingBox[2]) - this.percent2pix(boundingBox[0]),
        this.percent2pix(boundingBox[3], true) -
          this.percent2pix(boundingBox[1], true)
      );

      return this.getImageLuminance(imgData.data);
    } catch (err) {
      console.warn(`Tracker ERROR | Luminance calc: ${err}`);
      return 1;
    }
  }

  getImageLuminance(imgData) {
    let sum = 0;

    for (let ind = 0; ind < imgData.length; ind += 4 * this.luminanceDensity) {
      let k = 0;
      if (ind % 4 == 0) {
        k = this.luminanceWeights.red;
      } else if (ind % 4 == 1) {
        k = this.luminanceWeights.green;
      } else if (ind % 4 == 2) {
        k = this.luminanceWeights.blue;
      }

      sum += k * imgData[ind];
    }

    return sum / (imgData.length / (4 * this.luminanceDensity)) / 255;
  }

  getBones(snapshot) {
    return bonePairs
      .filter((pair) => snapshot[pair[0]] && snapshot[pair[1]])
      .map((pair) => ({
        x1: snapshot[pair[0]]['x'],
        y1: snapshot[pair[0]]['y'],
        x2: snapshot[pair[1]]['x'],
        y2: snapshot[pair[1]]['y']
      }));
  }

  getTagpos(snapshot) {
    for (let headNode of headNodes) {
      if (snapshot[headNode]) {
        return {
          x: snapshot[headNode].x,
          y: snapshot[headNode].y - this.tagShift
        };
      }
    }
    return false;
  }

  getAllPermutations(arr1, arr2) {
    let byKeys = arr1.length > arr2.length,
      permuted = null;

    if (byKeys) permuted = permute(arr1, arr2.length);
    else permuted = permute(arr2, arr1.length);

    return permuted.map((arr) =>
      arr.reduce((r, e, i) => {
        byKeys ? (r[e] = arr2[i]) : (r[arr1[i]] = e);
        return r;
      }, {})
    );

    function permute(data, len) {
      let result = [];

      function generate(data, n, c) {
        if (!data.length) {
          result.push(c.slice(0, len));
          return;
        }

        for (var i = 0; i < data.length; i++) {
          c[n] = data[i];
          let copy = [...data];
          copy.splice(i, 1);
          generate(copy, n + 1, c);
        }
      }

      generate(data, 0, []);
      return result;
    }
  }

  massCenterPredict(massCenter, vector, personId) {
    if (!this.persons[personId] || this.persons[personId].cache.length === 0) {
      return false;
    } else {
      const ticks = this.persons[personId].cache.length;
      const tan = Math.tan((vector.angle * Math.PI) / 180);
      const tickSpeed = vector.speed / ticks;

      const deltaXChunk = 1 / (1 + tan);
      const deltaYChunk = 1 - deltaXChunk;

      let deltaX = tickSpeed * deltaXChunk;
      let deltaY = tickSpeed * deltaYChunk;

      if (vector.angle > 0 && vector.angle <= 90) {
        deltaX = Math.abs(deltaX) * -1;
        deltaY = Math.abs(deltaY);
      } else if (vector.angle > 90 && vector.angle <= 180) {
        deltaX = Math.abs(deltaX);
        deltaY = Math.abs(deltaY);
      } else if (vector.angle < 0 && vector.angle >= -90) {
        deltaX = Math.abs(deltaX) * -1;
        deltaY = Math.abs(deltaY) * -1;
      } else if (vector.angle < -90 && vector.angle >= -180) {
        deltaX = Math.abs(deltaX);
        deltaY = Math.abs(deltaY) * -1;
      }

      return {
        x: massCenter.x + deltaX,
        y: massCenter.y + deltaY
      };
    }
  }

  calcVector(snapshot, personId) {
    const firstSnap = this.firstSnapShot(personId);
    if (firstSnap) {
      let [prevSnap, currentSnap] = this.overLappedSnapShots(
        firstSnap.nodes,
        snapshot
      );
      const massCenterPrev = this.massCenter(prevSnap);
      const massCenterCurr = this.massCenter(currentSnap);

      const speed = this.distBetweenNodes(massCenterPrev, massCenterCurr);
      const angle =
        (Math.atan2(
          massCenterCurr['y'] - massCenterPrev['y'],
          (massCenterCurr['x'] - massCenterPrev['x']) * -1
        ) *
          180) /
        Math.PI;

      return {
        speed,
        angle
      };
    } else {
      return false;
    }
  }

  overLappedSnapShots(snapshot1, snapshot2) {
    const snap1 = {},
      snap2 = {};
    for (let nodeId in snapshot1) {
      if (snapshot2[nodeId]) {
        snap1[nodeId] = snapshot1[nodeId];
      }
    }
    for (let nodeId in snapshot2) {
      if (snapshot1[nodeId]) {
        snap2[nodeId] = snapshot2[nodeId];
      }
    }

    return [snap1, snap2];
  }

  lastSnapShot(personId) {
    return this.persons[personId]
      ? this.persons[personId].cache[this.persons[personId].cache.length - 1]
      : false;
  }

  firstSnapShot(personId) {
    return this.persons[personId] ? this.persons[personId].cache[0] : false;
  }

  massCenter(snapshot) {
    let [x, y] = [0, 0];

    for (let node in snapshot) {
      x += snapshot[node]['x'];
      y += snapshot[node]['y'];
    }

    return {
      x: x / Object.keys(snapshot).length,
      y: y / Object.keys(snapshot).length
    };
  }

  mapCvDataToPersons(cvData, personsMap) {
    let usedIndexes = [];

    for (let personId in this.persons) {
      if (personsMap[personId]) {
        this.pushSnapToPerson(personId, cvData[personsMap[personId]]);
        usedIndexes.push(personsMap[personId]);
      } else {
        this.handlePersonMiss(personId);
      }
    }

    for (let personInd in cvData) {
      if (
        !usedIndexes.includes(personInd) &&
        this.checkFalseDuplicates(cvData[personInd])
      ) {
        this.initPerson(cvData[personInd]);
      }
    }
  }

  checkFalseDuplicates(cvSnapshot) {
    for (let personId in this.persons) {
      let dist = 0;
      dist +=
        this.distBetweenSnapshots(
          cvSnapshot,
          this.lastSnapShot(personId).nodes
        ) * this.weights.nodeDistances;

      if (dist < this.newPersonMinDist) {
        return false;
      }
    }
    return true;
  }

  handlePersonMiss(personId) {
    this.persons[personId].missedTicks++;
    this.persons[personId].missing = true;

    if (
      this.persons[personId].cache.length < this.falseDetectSnaps ||
      this.persons[personId].missedTicks > this.ticksToLoosePerson
    ) {
      delete this.persons[personId];
    }
  }

  pushSnapToPerson(personId, snapshot) {
    const snap = this.genSnapShot(snapshot, personId);

    this.persons[personId].cache.push(snap);
    this.persons[personId].lastSnap = snap;
    this.persons[personId].missing = false;
    this.persons[personId].missedTicks = 0;

    if (this.persons[personId].cache.length > this.personsCacheLength) {
      this.persons[personId].cache.shift();
    }
  }

  distBetweenSnapshots(snap1, snap2) {
    let nodes = {};
    let sum = 0;
    let amount = 0;
    for (let node1 in snap1) {
      if (snap2[node1]) {
        nodes[node1] = this.distBetweenNodes(snap1[node1], snap2[node1]);
      }
    }

    if (Object.keys(nodes).length > 0) {
      for (let nodeKey in nodes) {
        sum += nodes[nodeKey];
        amount++;
      }
      return sum / amount;
    } else {
      return false;
    }
  }

  distBetweenNodes(node1, node2) {
    return Math.sqrt(
      Math.pow(node1['x'] - node2['x'], 2) +
        Math.pow(node1['y'] - node2['y'], 2)
    );
  }

  percent2pix(val, vertical = false) {
    if (vertical) {
      return val * this.cvs.height;
    } else {
      return val * this.cvs.width;
    }
  }

  drawSkeleton(cvs, options = {}) {
    console.log(this.persons);
    this.skeletonDrawer.draw(cvs, this.persons, options);
  }
}

const bonePairs = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [1, 5],
  [5, 6],
  [6, 7],
  [5, 11],
  [2, 8],
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

const skeletonColors = ['#3333cc', '#2E86C1', '#7D3C98', '#CA6F1E', '#1E8449'];

class SkeletonDrawer {
  percent2pix(val, vertical = false) {
    if (vertical) {
      return val * this.cvs.height;
    } else {
      return val * this.cvs.width;
    }
  }

  draw(cvs, persons, options) {
    if (!this.cvs) {
      this.cvs = cvs;
      this.ctx = this.cvs.getContext('2d');
    }
    console.log(persons);

    for (let personId in persons) {
      if (persons[personId].cache.length < 2) {
        continue;
      }
      const snapshot = persons[personId].lastSnap;

      // tag
      if (options.drawTags) {
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'center';

        this.ctx.fillStyle = persons[personId].color;
        this.ctx.fillRect(
          this.percent2pix(snapshot.tagPos.x) - 150,
          this.percent2pix(snapshot.tagPos.y, true),
          300,
          30
        );
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.save();
        this.ctx.scale(-1, 1);
        this.ctx.fillText(
          personId,
          -this.percent2pix(snapshot.tagPos.x),
          this.percent2pix(snapshot.tagPos.y, true) + 20
        );
        this.ctx.restore();
      }

      // bones
      if (options.drawBones) {
        for (let bone of snapshot.bones) {
          this.ctx.beginPath();
          this.ctx.lineWidth = 10;
          this.ctx.moveTo(
            this.percent2pix(bone.x1),
            this.percent2pix(bone.y1, true)
          );
          this.ctx.lineTo(
            this.percent2pix(bone.x2),
            this.percent2pix(bone.y2, true)
          );
          this.ctx.strokeStyle = persons[personId].color;
          this.ctx.stroke();
        }
      }

      // nodes
      if (options.drawNodes) {
        for (let nodeId in snapshot.nodes) {
          const nodeX = this.percent2pix(snapshot.nodes[nodeId].x);
          const nodeY = this.percent2pix(snapshot.nodes[nodeId].y, true);
          this.ctx.beginPath();
          this.ctx.arc(nodeX, nodeY, this.percent2pix(0.01), 0, 2 * Math.PI);
          this.ctx.fillStyle = persons[personId].color;
          this.ctx.fill();
          this.ctx.closePath();

          this.ctx.fillStyle = '#FFFFFF';
          this.ctx.save();
          this.ctx.scale(-1, 1);
          this.ctx.fillText(nodeId, -nodeX, nodeY + 3);
          this.ctx.restore();
        }
      }

      // massCenter
      if (options.drawMassCenter) {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(
          this.percent2pix(snapshot.massCenter.x) - 15,
          this.percent2pix(snapshot.massCenter.y, true) - 15,
          30,
          30
        );
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.save();
        this.ctx.scale(-1, 1);
        this.ctx.fillText(
          'M',
          -this.percent2pix(snapshot.massCenter.x),
          this.percent2pix(snapshot.massCenter.y, true) + 3
        );
        this.ctx.restore();

        // massCenterPredicted
        this.ctx.fillStyle = 'green';
        this.ctx.fillRect(
          this.percent2pix(snapshot.massCenterPredict.x) - 15,
          this.percent2pix(snapshot.massCenterPredict.y, true) - 15,
          30,
          30
        );
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.save();
        this.ctx.scale(-1, 1);
        this.ctx.fillText(
          'P',
          -this.percent2pix(snapshot.massCenterPredict.x),
          this.percent2pix(snapshot.massCenterPredict.y, true) + 3
        );
        this.ctx.restore();
      }

      // vector
      if (options.drawVector) {
        const speedPix = this.percent2pix(snapshot.vector.speed);
        if (speedPix > 30) {
          this.ctx.save();
          this.ctx.translate(
            this.percent2pix(snapshot.massCenter.x),
            this.percent2pix(snapshot.massCenter.y, true)
          );
          this.ctx.scale(-1, 1);
          this.ctx.rotate((snapshot.vector.angle * Math.PI) / 180);
          this.ctx.beginPath();
          this.ctx.lineWidth = 5;
          this.ctx.moveTo(0, -8);
          this.ctx.lineTo(speedPix - 20, -8);
          this.ctx.lineTo(speedPix - 20, -16);
          this.ctx.lineTo(speedPix, 0);
          this.ctx.lineTo(speedPix - 20, 16);
          this.ctx.lineTo(speedPix - 20, 8);
          this.ctx.lineTo(0, 8);
          this.ctx.lineTo(0, -8);
          this.ctx.strokeStyle = persons[personId].color;
          this.ctx.fill();
          this.ctx.stroke();

          this.ctx.restore();
        }
      }
    }
  }
}

export default TrackerApi;

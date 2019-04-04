import cvData from './cvData.json';

let counter = 0;

function currentSnap() {
  let cs = cvData[counter];
  counter++;
  if (counter > cvData.length - 1) {
    counter = 0;
  }
  return cs;
}

export { currentSnap as cvFeed };

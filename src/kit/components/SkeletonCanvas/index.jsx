import React from 'react';
import { connect } from 'react-redux';

import { canvas } from './styles.css';
import Tracker from '../../models/tracker';
import { captureWebcam } from '../../models/media';

const mapStateToProps = ({ vision }) => ({
  vision
});

const mapDispatchToProps = ({ vision }) => ({
  countFingers: vision.countFingers
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(
  class extends React.Component {
    constructor() {
      super();

      this.state = {
        tracker: false,
        hashOnly: false
      };

      this.gestureLoading = false;
      this.gestureLast = Date.now();
      this.snapLast = Date.now();
      this.saveSnaps = null;
      this.snapsInProcessing = 0;

      this.snapShot = this.snapShot.bind(this);

      this.locked = false;
    }

    webCamLoaded(stream) {
      this.video = document.createElement('video');
      this.video.srcObject = stream;
      this.video.style.display = 'none';
      document.body.appendChild(this.video);

      this.video.onloadedmetadata = (e) => {
        this.video.play();
        this.snapShot();
      };
    }

    percent2pix = (val, vertical = false) => {
      if (vertical) {
        return val * this.cvs.height;
      } else {
        return val * this.cvs.width;
      }
    };

    async snapShot() {
      if (this.ctx) {
        this.ctx.drawImage(this.video, 0, 0, this.cvs.width, this.cvs.height);
        let currentProps = this.props;

        if (
          currentProps.vision.data &&
          Object.values(currentProps.vision.data).length
        ) {
          console.log('drawing skeleton');
          console.log(this.state.tracker);
          this.state.tracker.feed(currentProps.vision.data);
          this.state.tracker.drawSkeleton(this.cvs, {
            drawTags: true,
            drawBones: true,
            drawNodes: true,
            drawMassCenter: true,
            drawVector: true
          });
        }
      }

      window.requestAnimationFrame(this.snapShot);
    }

    percent2pix(val, vertical = false) {
      if (vertical) {
        return val * this.cvs.height;
      } else {
        return val * this.cvs.width;
      }
    }

    componentDidMount() {
      [this.cvs.width, this.cvs.height] = [
        window.innerWidth,
        window.innerHeight
      ];
      this.ctx = this.cvs.getContext('2d');

      const tracker = new Tracker();

      this.setState({ tracker });

      captureWebcam().then((objectUrl) => {
        this.webCamLoaded(objectUrl);
      });
    }

    render() {
      return (
        <React.Fragment>
          <canvas
            tabIndex="0"
            key={'cvsMain'}
            className={canvas}
            ref={(cvs) => {
              this.cvs = cvs;
            }}
          />
        </React.Fragment>
      );
    }
  }
);

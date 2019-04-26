import React from 'react';
import { connect } from 'react-redux';

import {
  container,
  skeletonNode,
  skeletonBone,
  boneLine,
  tag,
  eyeDistStyleClose,
  eyeDistStyleFar,
  cvFaceBox,
  cvFaceData
} from './styles.css';
import { bonesMap, tagCoords } from './skeleton';

import Tracker from '../../models/tracker';

import { cvFeed } from '../../utils/cvMock';

const mapStateToProps = ({ vision, view, cvEvents }) => ({
  vision,
  view,
  cvEvents
});

export default connect(mapStateToProps)(
  class extends React.Component {
    constructor() {
      super();

      this.state = {
        nodes: {},
        bones: {},
        tags: [],

        colors: ['#007bff', '#6c757d', '#ffc107', '#17a2b8'],
        tracker: false,
        updated: false
      };

      this.cvData = {};
      this.cvTimeout = null;
      this.layout = null;
    }

    componentWillReceiveProps(currentProps) {
      // Set layout
      if (!this.state.updated && currentProps.view.layout) {
        this.setState({ updated: true });
      }

      // Calc skeleton parts
      let nodes = {};
      let bones = {};
      let tags = [];
      if (
        currentProps.vision.data &&
        Object.values(currentProps.vision.data).length
      ) {
        this.state.tracker.feed(currentProps.vision.data);
        nodes = this.state.tracker.persons;
        bones = bonesMap(nodes);
        tags = tagCoords(nodes);
      }

      clearTimeout(this.cvTimeout);
      this.cvData = currentProps.cvEvents;
      this.cvTimeout = setTimeout(() => {
        this.cvData = {};
      }, 3000);

      this.setState({ nodes, bones, tags });
    }

    componentDidMount() {
      const tracker = new Tracker();
      tracker.addPalms = true;
      this.setState({ tracker });
    }

    absPosX(x) {
      return `${100 - x * 100}%`;
    }
    absPosY(y) {
      return `${y * 100}%`;
    }

    drawNodes() {
      return Object.keys(this.state.nodes).map((personId, ind) => {
        const nodes = this.state.nodes[personId].lastSnap.nodes;

        return !this.state.nodes[personId].missing
          ? Object.keys(nodes).map((partId) => {
              const style = {
                top: this.absPosY(nodes[partId].y),
                left: this.absPosX(nodes[partId].x),
                backgroundColor: this.state.colors[
                  ind % this.state.colors.length
                ]
              };

              return (
                <div
                  style={style}
                  className={skeletonNode}
                  key={`${personId}_${partId}`}
                >
                  {partId}
                </div>
              );
            })
          : null;
      });
    }

    drawBones() {
      return Object.keys(this.state.nodes).map((personId, ind) => {
        return !this.state.nodes[personId].missing
          ? this.state.bones[personId].map((line, key) => (
              <svg
                key={`bone_${ind}_${key}`}
                className={skeletonBone}
                xmlns="http://www.w3.org/2000/svg"
              >
                <line
                  className={boneLine}
                  x1={this.absPosX(line.x1)}
                  y1={this.absPosY(line.y1)}
                  x2={this.absPosX(line.x2)}
                  y2={this.absPosY(line.y2)}
                  stroke={this.state.colors[ind % this.state.colors.length]}
                />
              </svg>
            ))
          : null;
      });
    }

    drawTags() {
      return this.state.tags.map((t, ind) => {
        if (t) {
          const style = {
            top: `${t.y * 100 - 15}%`,
            left: this.absPosX(t.x),
            backgroundColor: this.state.colors[ind % this.state.colors.length]
          };
          const eyeDist = Math.floor(
            t.eyeDist *
              (this.props.view.layout
                ? this.props.view.layout.width
                : window.innerWidth)
          );
          return (
            <p className={tag} key={ind} style={style}>
              {t.personInd}
              <span
                className={eyeDist >= 120 ? eyeDistStyleClose : eyeDistStyleFar}
              >
                {eyeDist}
              </span>
            </p>
          );
        }
      });
    }

    drawCVData() {
      return this.cvData.data &&
        this.cvData.data.currentFaces &&
        this.cvData.data.currentFaces.length
        ? this.cvData.data.currentFaces.map((face, ind) => {
            const style = {
              top: this.absPosY(1 - face.lastPosition[0] - face.height / 2),
              left: this.absPosX(face.lastPosition[1] + face.width / 2),
              width: `${face.width * 100}%`,
              height: `${face.height * 100}%`,
              borderColor: face.gender == 'male' ? 'blue' : 'red',
              color: face.gender == 'male' ? 'blue' : 'red'
            };

            return (
              <div className={cvFaceBox} key={`cvface_${ind}`} style={style}>
                <p className={cvFaceData}>
                  {face.gender} ({face.age})
                </p>
              </div>
            );
          })
        : null;
    }

    parseStyle = ({ width, height, top, left }) => {
      return {
        width: `${width}px`,
        height: `${height}px`,
        top: `${top}px`,
        left: `${left}px`
      };
    };

    render() {
      let layout = {};

      if (this.state.updated && !this.layout) {
        layout = this.layout = this.parseStyle(this.props.view.layout);
      } else {
        layout = this.layout;
      }

      return (
        <div className={container} style={layout}>
          {this.drawNodes()}
          {this.drawBones()}
          {this.drawTags()}
          {this.drawCVData()}
        </div>
      );
    }
  }
);

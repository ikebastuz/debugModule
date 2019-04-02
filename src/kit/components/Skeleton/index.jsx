import React, { Component } from 'react';
import { connect } from 'react-redux';

import {
  container,
  skeletonNode,
  skeletonBone,
  boneLine,
  tag,
  eyeDist
} from './styles.css';
import { bonesMap, tagCoords } from './skeleton';

import { TrackerApi as Tracker } from 'outernets-apps-core';

const mapStateToProps = ({ vision }) => ({
  vision
});

export default connect(mapStateToProps)(
  class extends Component {
    constructor() {
      super();

      this.state = {
        nodes: {},
        bones: {},
        tags: [],
        colors: ['green', 'red', 'blue'],
        tracker: false
      };
    }

    componentWillReceiveProps(currentProps) {
      console.log('Debugger props:');
      console.log(currentProps);
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

      this.setState({ nodes, bones, tags });
    }

    componentDidMount() {
      console.log('Debugger mounted');
      console.log(this.props);
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
          return (
            <React.Fragment>
              <p className={tag} key={ind} style={style}>
                {t.personInd}
                <span className={eyeDist}>
                  {Math.floor(t.eyeDist * window.innerWidth)}
                </span>
              </p>
            </React.Fragment>
          );
        }
      });
    }

    render() {
      return (
        <div className={container}>
          {this.drawNodes()}
          {this.drawBones()}
          {this.drawTags()}
        </div>
      );
    }
  }
);

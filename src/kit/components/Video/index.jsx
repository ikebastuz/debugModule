import React from 'react';
import { connect } from 'react-redux';

import { video } from './styles.css';

export default connect()
  (class extends React.Component {
    componentWillMount() {
      navigator.mediaDevices.getUserMedia({ audio: false, video: true })
        .then((stream) => this.video.srcObject = stream);
    }

    render() {
      return (
        <video
          ref={video => {this.video = video}}
          className={video}
          autoPlay
        />
      );
    }
  });
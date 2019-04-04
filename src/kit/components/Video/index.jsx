import React from 'react';
import { connect } from 'react-redux';
import { calcLayout } from '../../utils/helpers';
import { video, cnv } from './styles.css';

const mapDispatch = ({ view }) => ({ view });
const SIZE = 1024; // hidden canvas width

class Video extends React.Component {
  constructor() {
    super();

    this.ctx = null;
  }

  componentWillMount() {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream) => {
        this.video.srcObject = stream;
        this.start();
      });
  }

  start = () => {
    this.video.onloadeddata = (e) => {
      const { videoWidth, videoHeight } = this.video;
      this.cnv.width = SIZE;
      this.cnv.height =
        videoWidth && videoHeight
          ? (SIZE / this.video.videoWidth) * this.video.videoHeight
          : SIZE / 1.7777777777777777;

      this.ctx = this.cnv.getContext('2d');
      this.cnv.beforeBlob = () => {
        this.ctx.clearRect(0, 0, this.cnv.width, this.cnv.height);
        this.ctx.drawImage(this.video, 0, 0, this.cnv.width, this.cnv.height);
      };

      const layout = calcLayout(this.video);

      this.props.view.setState({ layout, canvas: this.cnv });
    };

    this.video.play();
  };

  render() {
    return [
      <video key={1} ref={(video) => (this.video = video)} className={video} />,
      <canvas key={2} ref={(cnv) => (this.cnv = cnv)} className={cnv} />
    ];
  }
}

export default connect(
  null,
  mapDispatch
)(Video);

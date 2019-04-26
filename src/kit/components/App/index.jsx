import React from 'react';
import { connect } from 'react-redux';

import App from './component';

const mapStateToProps = (props) => ({
  ...props
});

export default connect(mapStateToProps)(
  class extends React.Component {
    constructor() {
      super();
      this.state = {
        show: false
      };
      this.handleKBClick = this.handleKBClick.bind(this);
    }

    handleKBClick(e) {
      if (e.ctrlKey && e.altKey && e.key == 'z' && !this.state.show) {
        this.setState({ show: true });
      }

      if (e.ctrlKey && e.altKey && e.key == 'x' && this.state.show) {
        this.setState({ show: false });
      }
    }

    componentDidMount() {
      window.addEventListener('keydown', this.handleKBClick);
      window.addEventListener('keyup', this.handleKBClick);
      this.props.dispatch.vision.subscribe();
      this.props.dispatch.cvEvents.subscribe();
    }

    render() {
      return this.state.show ? <App {...this.props} /> : null;
    }
  }
);

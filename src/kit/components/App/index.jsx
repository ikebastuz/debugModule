import React, { Component } from 'react';
import { connect } from 'react-redux';

import App from './component';

const mapStateToProps = (props) => ({
  ...props
});

export default connect(mapStateToProps)(
  class extends Component {
    componentDidMount() {
      this.props.dispatch.vision.subscribe();
    }

    render() {
      return <App {...this.props} />;
    }
  }
);

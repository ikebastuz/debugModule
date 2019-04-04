import React, { Component } from 'react';
import { KitApi } from 'outernets-apps-core';
import { hudContainer, param, paramKey, paramValue } from './styles.css';

export default class extends Component {
  constructor() {
    super();

    this.state = {
      data: {}
    };
  }

  componentDidMount() {
    const appId = KitApi.getSettings() ? KitApi.getSettings().appId : 'Unknown';
    this.setState({ data: { ...this.state.data, appId } });
  }

  render() {
    return (
      <div className={hudContainer}>
        {Object.keys(this.state.data).map((key) => (
          <p className={param}>
            <span className={paramKey}>{key}:</span>{' '}
            <span className={paramValue}>{this.state.data[key]}</span>
          </p>
        ))}
      </div>
    );
  }
}

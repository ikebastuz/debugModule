import React from 'react';
import { getSettings } from '../../models/kit';
import { hudContainer, param, paramKey, paramValue } from './styles.css';

export default class extends React.Component {
  constructor() {
    super();

    this.state = {
      data: {}
    };
  }

  componentDidMount() {
    const appId = getSettings() ? getSettings().appId : 'Unknown';
    this.setState({ data: { ...this.state.data, appId } });
    this.loadPkgConfig();
  }

  loadPkgConfig(){
    fetch('./package.json')
      .then((res) => res.json())
      .then(pkg => {
        this.setState({ data: { ...this.state.data, version: pkg.version ? pkg.version : 'Unknown' } });
      })
      .catch(err => console.log(err));
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

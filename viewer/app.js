import React from 'react';
import ReactDOM from 'react-dom';

import Visualizer from './visualizer.jsx';

class MainLayout extends React.Component {
  componentDidMount() {
    this.refs.mainVisualizer.triggerRender();
  }
  render() {
    return (
      <div>
        <Visualizer
          ref="mainVisualizer"
        />
      </div>
    );
  }
}

ReactDOM.render(
    <MainLayout />,
    document.getElementById('react-target')
);

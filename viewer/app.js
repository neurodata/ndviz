import React from 'react';
import ReactDOM from 'react-dom';

import Visualizer from './visualizer.jsx';

import { State, StateLayer } from './state.js';
import ToolboxMenu from './toolbox/toolbox.jsx';

class NDViz extends React.Component {
  constructor(props) {
    super(props);

    // register functions
    this.triggerRender = this.triggerRender.bind(this);

    // read initial state from the window
    if (window.config) {
          this.stateObject = new State(window.config.xstart, window.config.xoffset, window.config.xsize, window.config.ystart, window.config.yoffset, window.config.ysize, window.config.zstart, window.config.zoffset, window.config.zsize, window.config.minres, window.config.maxres, window.config.res);
    }

    // read window layers into state
    if (window.config.layers) {
      var order = 0;
      for (let layer of window.config.layers) {

        var tmpLayer = new StateLayer(layer.name, layer.url, layer.tilesize, layer.color, order);
        order++;
        this.stateObject.addLayer(tmpLayer);
      }
    }

    // setup the visualizer
    this.mainVisualizer = new Visualizer(this.stateObject);

  }
  triggerRender() {
    this.mainVisualizer.triggerRender();
  }
  componentDidMount() {
    this.triggerRender();
  }
  render() {
    return (
      <div>
        <div id="visualizer-target"></div>
        <div style={{position: "absolute", top: 50, right: 0, paddingRight: 10, paddingTop: 5}}>
          <ToolboxMenu
            viewerState={this.stateObject}
            visualizer={this.mainVisualizer}
          />
        </div>
      </div>
    );
  }
}

ReactDOM.render(
    <NDViz />,
    document.getElementById('react-target')
);

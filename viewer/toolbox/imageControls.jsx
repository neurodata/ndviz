import React from 'react';
import ReactDOM from 'react-dom';

export default class ImageControlsParent extends React.Component {
  constructor(props) {
    super(props);

    this.handleBlendModeChange = this.handleBlendModeChange.bind(this);

    this.state = {
      blendMode: this.props.blendMode
    };
  }
  handleBlendModeChange(event) {
    var value = parseInt(event.target.value);
    this.setState({
      blendMode: value
    });
    //updateGlobalBlendMode(value) // AB TODO
    console.log('updating blend mode: ' + value);
  }
  render() {
    return (
      <div>
        <ImageControlsController viewerState={this.props.viewerState} />
        <br />
        <div id="blendmode">
          Blending:
          <select name="blendmode"
            onChange={this.handleBlendModeChange}
            value={this.state.blendMode}
            >
            <option value="1">Normal</option>
            <option value="2">Additive</option>
            <option value="3">Subtractive</option>
            <option value="4">Multiply</option>
            <option value="0">None</option>
          </select>
          <span style={{float: "right"}}>
            <a href="#" data-toggle="modal" data-target="#blendModeHelp">
              <i className="fa fa-info-circle fa-lg"></i>
            </a>
          </span>
        </div>
      </div>
    );
  }
}

ImageControlsParent.propTypes = {
  blendMode: React.PropTypes.number, // blend mode passed as string via django
  viewerState: React.PropTypes.object.isRequired
}

ImageControlsParent.defaultProps = {
  blendMode: 1
}

class ImageControlsController extends React.Component {
  constructor(props) {
    super(props);

    this.setCollapsedTrue = this.setCollapsedTrue.bind(this);
    this.setCollapsedFalse = this.setCollapsedFalse.bind(this);

    this.state = {
      collapsed: false
    };
  }
  setCollapsedTrue() {
    this.setState({collapsed: true})
  }
  setCollapsedFalse() {
    this.setState({collapsed: false})
  }
  render() {
    var layers = this.props.viewerState.layers;
    return (
      <div id="image-sliders">
        <small><a href="#" onClick={this.setCollapsedTrue}>Collapse All</a> / <a href="#" onClick={this.setCollapsedFalse}>Expand All</a></small>
        {layers.map(function(layer, i) {
          var layerKey = 'controls-' + i;
          if (layer.enabled) {
            return (
              <div key={layerKey}>
                <ImageControlsLayer
                  layer={layer}
                  collapsed={this.state.collapsed}
                />
              </div>
            );
          } else {
            return null;
          }
        }.bind(this))}
      </div>
    );
  }
}

ImageControlsController.propTypes = {
  viewerState: React.PropTypes.object.isRequired
}

class ImageControlsLayer extends React.Component {
  constructor(props) {
    super(props);

    this.handleToggleCollapse = this.handleToggleCollapse.bind(this);
    this.handleOpacityChange = this.handleOpacityChange.bind(this);
    this.handleMinChange = this.handleMinChange.bind(this);
    this.handleMaxChange = this.handleMaxChange.bind(this);
    this.handleGammaChange = this.handleGammaChange.bind(this);
    this.handleColorChange = this.handleColorChange.bind(this);

    this.state = {
      collapsed: this.props.collapsed,
      opacity: this.props.layer.opacity,
      minVal: this.props.layer.minval,
      maxVal: this.props.layer.maxval,
      gamma: this.props.layer.gamma,
      color: this.props.layer.color
    };
  }
  componentWillReceiveProps(nextProps) {
    this.setState({collapsed: nextProps.collapsed})
  }
  handleToggleCollapse() {
    this.setState({collapsed: !this.state.collapsed});
  }
  handleOpacityChange(opacity) {
    if (opacity == 0 && this.state.opacity > 0) {
      // remove all tiles, we are going dark
      this.props.layer.tileLayer._removeAllTiles();
      map.removeLayer(this.props.layer.tileLayer);
    } else if (opacity > 0 && this.state.opacity == 0) {
      // readd all tiles, we are back in business
      this.props.layer.reinitializeLayer();
      this.props.layer.tileLayer.addTo(map);
    }

    this.setState({opacity: opacity});
  }
  handleMinChange(min) {
    this.setState({minVal: min});
  }
  handleMaxChange(max) {
    this.setState({maxVal: max});
  }
  handleGammaChange(gamma) {
    this.setState({gamma: gamma});
  }
  handleColorChange(color) {
    this.setState({color: color});
  }
  render() {
    return (
      <div>
        <div className="controls-layer-name">
          <a href="#" onClick={this.handleToggleCollapse}>
            <span className="image-controls-layer-icon"><i className={this.state.collapsed ? "fa fa-plus-square-o" : "fa fa-minus-square-o"}></i></span>
            <span>{this.props.layer.name}</span>
          </a>
        </div>
        <div className={this.state.collapsed ? 'hiddencontrols' : 'visiblecontrols'}>
          <div className="controls-slider-name">Opacity ({Math.round(this.state.opacity*100)})</div>
          <div id="slider">
            <ImageControlsSlider
              layer={this.props.layer}
              layerProp="opacity"
              defaultValue={this.state.opacity}
              handleChange={this.handleOpacityChange}
              className="opacity"
              divisor={100} />
          </div>
          <br />
          <div className="controls-slider-name">Min ({Math.round(this.state.minVal*255)})</div>
          <div id="slider">
            <ImageControlsSlider
              layer={this.props.layer}
              layerProp="min"
              defaultValue={this.state.minVal}
              handleChange={this.handleMinChange}
              className="minslider"
              maxValue={255}
              divisor={255} />
          </div>
          <br />
          <div className="controls-slider-name">Max ({Math.round(this.state.maxVal*255)})</div>
          <div id="slider">
            <ImageControlsSlider
              layer={this.props.layer}
              layerProp="max"
              defaultValue={this.state.maxVal}
              handleChange={this.handleMaxChange}
              className="maxslider"
              maxValue={255}
              divisor={255} />
          </div>
          <br />
          <div className="controls-slider-name">Gamma ({this.state.gamma})</div>
          <div id="slider">
            <ImageControlsSlider
              layer={this.props.layer}
              layerProp="gamma"
              defaultValue={this.state.gamma}
              handleChange={this.handleGammaChange}
              className="gammaslider"
              maxValue={2}
              step={0.1} />
          </div>
          <br />
          <div className="colorbox">
            <div className="controls-slider-name">Color {this.state.color ? '(' + this.state.color + ')' : ''}</div>
            <ImageControlsColor
            layer={this.props.layer}
            onColorChange={this.handleColorChange} />
          </div>
          <br />
        </div>
      </div>
    );
  }
}

ImageControlsLayer.propTypes = {
  layer: React.PropTypes.object.isRequired,
  collapsed: React.PropTypes.bool
}

ImageControlsLayer.defaultProps =  {
  collapsed: false,
  opacity: 1,
  minVal: 0,
  maxVal: 1,
  gamma: 1,
  color: null,
  enabled: true
}

class ImageControlsSlider extends React.Component {
  constructor(props) {
    super(props);

    this.handleValueChange = this.handleValueChange.bind(this);

    this.state = {
      value: this.props.defaultValue
    }
  }
  handleValueChange(event, ui) {
    this.props.layer[this.props.layerProp] = ui.value/this.props.divisor;
    this.setState({value: ui.value/this.props.divisor});
    this.props.handleChange(ui.value/this.props.divisor);
  }
  componentDidMount() {
    var span = ReactDOM.findDOMNode(this);
    $( span ).slider({
      min: this.props.minValue,
      max: this.props.maxValue,
      value: this.state.value*this.props.divisor,
      slide: this.handleValueChange,
      step: this.props.step,
      start: function(event, ui) { map.dragging.disable(); },
      stop: function(event, ui) { map.dragging.enable(); glLayer.draw(); }
    });
  }
  render() {
    return <span className={this.props.className}></span>;
  }
}

ImageControlsSlider.propTypes = {
  layer: React.PropTypes.object.isRequired,
  layerProp: React.PropTypes.string.isRequired,
  defaultValue: React.PropTypes.number.isRequired,
  handleChange: React.PropTypes.func.isRequired,
  className: React.PropTypes.string.isRequired,
  minValue: React.PropTypes.number,
  maxValue: React.PropTypes.number,
  step: React.PropTypes.number,
  divisor: React.PropTypes.number
}

ImageControlsSlider.defaultProps = {
  minValue: 0,
  maxValue: 100,
  step: 1,
  divisor: 1
}

class ImageControlsColor extends React.Component {
  constructor(props) {
    super(props);

    this.handleColorChange = this.handleColorChange.bind(this);

    this.state = {
      color: this.props.layer.color
    }
  }
  handleColorChange(event) {
    var color = event.target.value;
    if (color == "none") {
      this.setState({color: null});
      this.props.onColorChange(null);
      this.props.layer.color = color;
      glLayer.draw();
      return;
    }

    this.setState({color: color})
    this.props.layer.color = color;
    this.props.onColorChange(color);
    glLayer.draw();
  }
  render() {
    return (
        <div className="btn-group btn-group-xs">
          <button className="btn btn-default btn-color btn-r" value="R" onClick={this.handleColorChange}>R</button>
          <button className="btn btn-default btn-color btn-g " value="G" onClick={this.handleColorChange}>G</button>
          <button className="btn btn-default btn-color btn-b" value="B" onClick={this.handleColorChange}>B</button>
          <button className="btn btn-default btn-color btn-c" value="C" onClick={this.handleColorChange}>C</button>
          <button className="btn btn-default btn-color btn-m" value="M" onClick={this.handleColorChange}>M</button>
          <button className="btn btn-default btn-color btn-y" value="Y" onClick={this.handleColorChange}>Y</button>
          <button className="btn btn-default btn-color" value="none" onClick={this.handleColorChange}>
            <span className="glyphicon glyphicon-remove-sign" aria-hidden="true"></span>
          </button>
        </div>
    );
  }
}

ImageControlsColor.propTypes = {
  layer: React.PropTypes.object.isRequired,
  onColorChange: React.PropTypes.func.isRequired,
  color: React.PropTypes.string
};

ImageControlsColor.defaultProps = {
  color: null
}

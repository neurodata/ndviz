import React from 'react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import ImageControlsParent from './imageControls.jsx';

export default class ToolboxMenu extends React.Component {
  render() {
    var imageControlsComponent = <ImageControlsParent blendMode={1} />;
    return (
      <ToolboxController
        toolboxComponent={imageControlsComponent}
        toolboxName="Image Controls"
        toolboxIconName="fa-picture-o"
      />
    );
  }
}

class Toolbox extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    var iconClassString = "fa fa-stack-1x " + this.props.iconClassName;
    return (
      <div className="toolbox">
        <ToolboxHideIcon onClick={this.props.onClick} />
        <div id="controlpanelheader">
          <div style={{float:"left"}}>
            <span className="fa-stack fa-2x" style={{paddingBottom: 5}}>
              <i className="fa fa-square fa-stack-2x fa-inverse"></i>
              <i className={iconClassString}></i>
            </span>
          </div>
          <div className="headertext">{this.props.toolboxName}</div>
        </div>
        <div>
          {this.props.toolboxComponents}
        </div>
      </div>
    )
  }
}

class ToolboxShowIcon extends React.Component {
  render() {
    var iconClassString = "fa fa-stack-1x " + this.props.iconClassName;

    return (
      <div className="showToolboxIcon" style={{float: "left"}}>
        <div className="helperText">{this.props.helperText}</div>
        <span className="fa-stack fa-2x">
          <a href="#" onClick={this.props.onClick}>
            <i className="fa fa-square fa-stack-2x fa-inverse"></i>
            <i className={iconClassString}></i>
          </a>
        </span>
      </div>
    );
  }
}

class ToolboxHideIcon extends React.Component {
  render() {
    return (
      <div style={{float: 'right'}}>
        <a href="#" onClick={this.props.onClick}>
          <i className="fa fa-times fa-lg"></i>
        </a>
      </div>
    );
  }
}

class ToolboxController extends React.Component {
  constructor(props) {
    super(props);

    this.handleClick = this.handleClick.bind(this);

    this.state = {
      showToolbox: false
    };
  }
  handleClick() {
    this.setState({ showToolbox: !this.state.showToolbox });
  }
  render() {
    var boxKey = "boxKey_" + this.props.toolboxIconName;
    var iconKey = "iconKey_" + this.props.toolboxIconName;
    return (
      <div>
        <ReactCSSTransitionGroup transitionName="toolboxTransition" transitionEnterTimeout={1} transitionLeaveTimeout={1} >
          { this.state.showToolbox
            ?
            <Toolbox
              iconClassName={this.props.toolboxIconName}
              toolboxName={this.props.toolboxName}
              toolboxComponent = {this.props.toolboxComponent}
              onClick={this.handleClick}
              key={boxKey} />
            :
            <ToolboxShowIcon
              iconClassName={this.props.toolboxIconName}
              onClick={this.handleClick}
              helperText={this.props.toolboxName}
              key={iconKey}
              /> }
        </ReactCSSTransitionGroup>
      </div>
    );
  }
}

ToolboxController.propTypes = {
  toolboxComponent: React.PropTypes.object.isRequired,
  toolboxName: React.PropTypes.string.isRequired,
  toolboxIconName: React.PropTypes.string.isRequired
}

class ToolboxLoading extends React.Component {
  componentDidMount() {
    var div = $(ReactDOM.findDOMNode(this));
    // setup spinjs
    var opts = {
      lines: 12 // The number of lines to draw
    , length: 5 // The length of each line
    , width: 6 // The line thickness
    , radius: 19 // The radius of the inner circle
    , scale: 0.75 // Scales overall size of the spinner
    , corners: 1 // Corner roundness (0..1)
    , color: '#000' // #rgb or #rrggbb or array of colors
    , opacity: 0.25 // Opacity of the lines
    , rotate: 0 // The rotation offset
    , direction: 1 // 1: clockwise, -1: counterclockwise
    , speed: 1.6 // Rounds per second
    , trail: 25 // Afterglow percentage
    , fps: 20 // Frames per second when using setTimeout() as a fallback for CSS
    , zIndex: 2e9 // The z-index (defaults to 2000000000)
    , className: 'spinner' // The CSS class to assign to the spinner
    , top: '50%' // Top position relative to parent
    , left: '50%' // Left position relative to parent
    , shadow: false // Whether to render a shadow
    , hwaccel: false // Whether to use hardware acceleration
    , position: 'absolute' // Element positioning
    }
    var spinner = new Spinner(opts);
    spinner.spin(this.refs.div);
  }
  render() {
    var divStyle = {
      paddingTop: 100,
    };
    return (
      <div
        style={divStyle}
        ref="div"
      ></div>
    );
  }
}

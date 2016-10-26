import React from 'react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import ImageControlsParent from './imageControls.jsx';
import ProjectInfoController from './projectInfo.jsx'

export default class ToolboxMenu extends React.Component {
  render() {
    var imageControlsComponent = <ImageControlsParent blendMode={1} />;
    var projInfoComponent = <ProjectInfoController server="openconnecto.me" token="kasthuri11"/>
    return (
      <div>
        <ToolboxController
          toolboxComponent={projInfoComponent}
          toolboxName="Project Info"
          toolboxIconName="fa-info"
        />
        <ToolboxController
          toolboxComponent={imageControlsComponent}
          toolboxName="Image Controls"
          toolboxIconName="fa-picture-o"
        />
      </div>
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

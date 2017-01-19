import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import {ImageControlsTest} from 'ndviz/ui/image_controls';

//import ImageControlsParent from './imageControls.jsx';
//import {ProjectInfoController} from 'ndviz/ui/project_info'

require('./toolbox.css');

interface DemoParentProps { test: string } 

class DemoParent extends React.Component<DemoParentProps, undefined> {
  render() {
    return (
      <div><h1>{this.props.test}</h1></div> 
    );
  }
}

export interface ToolboxMenuProps { visualizer: Object }

export class ToolboxMenu extends React.Component<ToolboxMenuProps, undefined> {
  render() {
    //var imageControlsComponent = <ImageControlsParent viewerState={this.props.viewerState} visualizer={this.props.visualizer}
    //blendMode={1} />;
    //var projInfoComponent = <ProjectInfoController server="openconnecto.me" token="kasthuri11"/>
    //var demoComponent = <DemoParent test="ndviz" />;
    var imageControlsComponent = <ImageControlsTest />;
    return (
      <div>
        <ToolboxController
          toolboxComponent={imageControlsComponent}
          toolboxName="Demo Component"
          toolboxIconName="fa-coffee"
          visualizer={this.props.visualizer}
        />
      </div>
    );
  }
} 

interface ToolboxProps { 
  visualizer: Object, 
  iconClassName: string, 
  toolboxName: string, 
  toolboxComponent: Object,
  onClick: any 
}

class Toolbox extends React.Component<ToolboxProps, undefined> {

  componentDidMount() {
    var container = ReactDOM.findDOMNode(this).parentNode;
    /*
    container!.addEventListener('mouseover', function() {
      this.props.visualizer.disablePan();
    }.bind(this));
    container!.addEventListener('mouseout', function() {
      this.props.visualizer.enablePan();
    }.bind(this));
    */
  }
  componentWillUnmount() {

    /*
    var container = ReactDOM.findDOMNode(this).parentNode;

    container!.removeEventListener('mouseover', listener: (this: any) => void {

    });
    
    
    function() {

    });

    container!.removeEventListener('mouseover', function() {
      this.props.visualizer.disablePan();
    }.bind(this));
    container!.removeEventListener('mouseout', function() {
      this.props.visualizer.enablePan();
    }.bind(this));
    */
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
          {this.props.toolboxComponent}
        </div>
      </div>
    )
  }
}

interface ToolboxShowIconProps { iconClassName: string, helperText: string, onClick: any }

class ToolboxShowIcon extends React.Component<ToolboxShowIconProps, undefined> {
  render() {
    var iconClassString = "fa fa-stack-1x " + this.props.iconClassName;

    return (
      <div className="showToolboxIcon" style={{float: "right"}}>
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

interface ToolboxHideIconProps { onClick: any }; 

class ToolboxHideIcon extends React.Component<ToolboxHideIconProps, undefined> {
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

interface ToolboxControllerProps {
  toolboxComponent: Object, 
  toolboxName: string, 
  toolboxIconName: string, 
  visualizer: Object
}

interface ToolboxControllerState {
  showToolbox: boolean
}

class ToolboxController extends React.Component<ToolboxControllerProps, ToolboxControllerState> {
  constructor(props: ToolboxControllerProps) {
    super(props);

    this.handleClick = this.handleClick.bind(this);
    
    // set initial state 
    this.state = {
      showToolbox: false
    };
  }
  handleClick(event: Event) {
    console.log('click!');
    event.preventDefault(); 
    this.setState({ showToolbox: !this.state.showToolbox });
  }
  render() {
    var boxKey = "boxKey_" + this.props.toolboxIconName;
    var iconKey = "iconKey_" + this.props.toolboxIconName;
    return (
      <div id={this.props.toolboxName.replace(/\s+/g, '')} style={{"clear": "both", "paddingTop": 10}}>
        <ReactCSSTransitionGroup transitionName="toolboxTransition" transitionEnterTimeout={1} transitionLeaveTimeout={1}>
          { this.state.showToolbox
            ?
            <Toolbox
              iconClassName={this.props.toolboxIconName}
              toolboxName={this.props.toolboxName}
              toolboxComponent = {this.props.toolboxComponent}
              onClick={this.handleClick}
              visualizer={this.props.visualizer}
              key={boxKey}
              />
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

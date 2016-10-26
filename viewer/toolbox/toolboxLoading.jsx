import React from 'react';

export default class ToolboxLoading extends React.Component {
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

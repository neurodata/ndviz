import React from 'react'

import ToolboxLoading from './toolboxLoading.jsx'

export default class ProjectInfoController extends React.Component {
  getInitialState() {
    return {
      projinfo: null
    };
  }

  componentDidMount() {
    var url = "http://" + this.props.server + "/ocp/ca/" + this.props.token + "/info/";
    this.serverRequest = $.get(
      url,
      function( result ) {
        var projinfo = result;
        this.setState({
          projinfo: projinfo,
        });
      }.bind(this),
      'json'
    )
  }

  componentWillUnmount() {
    this.serverRequest.abort();
  }

  render() {
    return (
      <div>
        {(this.state.projinfo != null) ? <ProjectInfoDisplay projinfo={this.state.projinfo} /> : <ToolboxLoading />}
      </div>
    );
  }
}

ProjectInfoController.propTypes = {
  server: React.PropTypes.string.isRequired,
  token: React.PropTypes.string.isRequired
}

class ProjectInfoDisplay extends React.Component {
  render() {
    var project = this.props.projinfo.project;
    var channels = this.props.projinfo.channels;
    var dataset = this.props.projinfo.dataset;
    var metadata = this.props.projinfo.metadata;

    return (
      <div>
        <h4>{project.name}</h4>
        <p>{project.description}</p>
        <h5>Channels</h5>
        <table className="table table-condensed">
        <tbody>
          {Object.keys(channels).map(function(key, i) {
            return (
              <tr key={i}>
                <td><a href="#"
                  ref={function(a) {
                    var popoverHTML = "<strong>" + channels[key].description + "</strong>";
                    $(a).popover({content: popoverHTML, placement: "bottom", html: true, trigger: "focus"});
                  }.bind(this)}
                  >{key}</a></td>
                <td><em>{channels[key].channel_type} ({channels[key].datatype})</em></td>
              </tr>
            );
          })}
        </tbody>
        </table>
        <h5>Dataset</h5>
        <table className="table table-condensed">
        <tbody>
          <tr>
            <td colSpan="3"><strong>Image Size</strong></td>
          </tr>
          <tr>
            <td>x</td>
            <td>{dataset.offset[0][0]}</td>
            <td>{dataset.imagesize[0][0]}</td>
          </tr>
          <tr>
            <td>y</td>
            <td>{dataset.offset[0][1]}</td>
            <td>{dataset.imagesize[0][1]}</td>
          </tr>
          <tr>
            <td>z</td>
            <td>{dataset.offset[0][2]}</td>
            <td>{dataset.imagesize[0][2]}</td>
          </tr>
          <tr>
            <td colSpan="2"><strong>Low Resolution</strong></td>
            <td>{dataset.resolutions[dataset.resolutions.length - 1]}</td>
          </tr>
          <tr>
            <td><strong>Time Range</strong></td>
            <td>{dataset.timerange[0]}</td>
            <td>{dataset.timerange[1]}</td>
          </tr>
        </tbody>
        </table>
      </div>
    );
  }
}

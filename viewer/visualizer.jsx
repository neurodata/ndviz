import React from 'react';
import TileLayer from './tilelayer.js';
import Tile from './tile.js';
import State from './state.js';


var THREE = require('three');

class Visualizer extends React.Component {
  constructor(props) {
    super(props);

    let self = this;

    this.init = this.init.bind(this);
    this.animate = this.animate.bind(this);
    self.renderScene = this.renderScene.bind(this);
    this.triggerRender = this.triggerRender.bind(this);
    this.onWindowResize = this.onWindowResize.bind(this);
    this.onDocumentMouseMove = this.onDocumentMouseMove.bind(this);
    this.onDocumentMouseDown = this.onDocumentMouseDown.bind(this);
    this.onDocumentMouseUp = this.onDocumentMouseUp.bind(this);

    this.disablePan = this.disablePan.bind(this);
    this.enablePan = this.enablePan.bind(this);

    this.updateResolution = this.updateResolution.bind(this);

    this.onDocumentScroll = this.onDocumentScroll.bind(this);
    this.onDocumentKeyPress = this.onDocumentKeyPress.bind(this);

    this.getInitialAppState = this.getInitialAppState.bind(this);
    this.getCurrentZIndex = this.getCurrentZIndex.bind(this);
    this.getCurrentRes = this.getCurrentRes.bind(this);
    this._addEventListeners = this._addEventListeners.bind(this);

    this.layers = [];
    this.viewerState = this.props.viewerState;

    this.cameraDistance = this.props.cameraDistance || 1000;

    this.onReady = this.props.onReady || (() => {});
    this.onReady(self);
  }

  componentDidMount() {
    let self = this;

    self._addEventListeners();
    self.enablePan();
  }

  getInitialAppState() {
    let self = this;

    // read layers from state and add to scene
    for (let layer of self.viewerState.layers) {
      var tmpLayer = new TileLayer(self.getCurrentZIndex(), self.getCurrentRes(), layer.tilesize, layer.color, layer.url, self.viewerState, layer);
      self.addLayer(tmpLayer);
    }

  }

  getCurrentZIndex() {
    let self = this;
    return self.viewerState.zindex;
  }

  getCurrentRes() {
    let self = this;
    return self.viewerState.res;
  }

  disablePan() {
    let self = this;
    removeEventListener('mousedown', self.onDocumentMouseDown);
    removeEventListener('mouseup', self.onDocumentMouseUp);
  }

  enablePan() {
    let self = this;
    // pan listeners
    addEventListener('mousedown', self.onDocumentMouseDown, false);
    addEventListener('mouseup', self.onDocumentMouseUp, false);
  }

  _addEventListeners() {
    let self = this;

    addEventListener('resize', self.onWindowResize,
    false);

    // AB TODO: move these to enable/disable functions for pan, zoom, change z so we can disable pan when sliding, for exmaple

    // change z listeners (AB TODO)
    addEventListener('wheel', self.onDocumentScroll, false);
    // key press
    addEventListener('keypress', self.onDocumentKeyPress, false);

  }

  init() {
    let self = this;

    self.lastMouse = new THREE.Vector2();

    self.offset = new THREE.Vector3();

    // Set up scene primitives
    self.scene = new THREE.Scene();
    //window.scene = self.scene;
    self.renderer = new THREE.WebGLRenderer();
    self.renderer.setPixelRatio(window.devicePixelRatio);
    self.renderer.setSize(window.innerWidth, window.innerHeight);

    // Insert into document
    self.container = document.getElementById('visualizer-target');
    self.container.appendChild(self.renderer.domElement);

    self.camera = new THREE.OrthographicCamera(
      window.innerWidth / -2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / -2,
      1, 1024.0);
    self.camera.position.z = 1;

    // get initial state and add layers
    self.getInitialAppState();

  }

  onWindowResize() {
    let self = this;

    self.camera.aspect = window.innerWidth / window.innerHeight;

    self.renderer.setSize( window.innerWidth, window.innerHeight );
    self.camera.updateProjectionMatrix();
  }

  onDocumentMouseDown(event) {
    let self = this;

    event.preventDefault();

    self.lastMouse.set(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );

    self.container.style.cursor = 'move';

    addEventListener('mousemove', self.onDocumentMouseMove, false);
  }

  onDocumentMouseUp(event) {
    let self = this;

    self.container.style.cursor = 'auto';

    removeEventListener('mousemove', self.onDocumentMouseMove);
  }

  onDocumentMouseMove(event) {
    let self = this;

    event.preventDefault();

    var mouse = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );

    // convoluted subtraction
    var mouseDiff = new THREE.Vector3(
      mouse.x - self.lastMouse.x,
      mouse.y - self.lastMouse.y,
    1);

    mouseDiff.unproject(self.camera);
    // unprojecting affects the z coordinate, but we don't care
    mouseDiff.z = 0;
    self.offset.add( mouseDiff );

    self.lastMouse = mouse;

    for (var layer of self.layers) {
      layer.onPan(mouseDiff, self.scene, self.renderScene);
    }
    self.renderScene();
  }

  onDocumentScroll(event) {
    let self = this;

    // TODO: change z axis

    //event.preventDefault();
    // convert to zoom factor
    //self.updateZoom(event.deltaY*0.01);

    //self.renderScene();
  }

  onDocumentKeyPress(event) {
    let self = this;
    if ( !(event.target.localName == 'input') ) {
      switch(event.key) {
        case 'h': // h -- help
          console.log('help');
          //toggleKeyboardHelp();
          break;
        case 'w': // w -- ndv.zindex++
          self.incZIndex();
          break;
        case 's': // s -- ndv.zindex--
          self.decZIndex();
          break;
        case 'a': // a -- zoom out
          self.zoomAndUpdate(false);
          break;
        case 'd': // d -- zoom in
          self.zoomAndUpdate(true);
          break;
        default:
        // do nothing
      }
    }
  }

  /*
  updateZoom(value) {
    let self = this;
    console.log('zoom value: ' + value);

    // update current zoom value
    self.zoom -= value.toFixed(2);
    console.log('self.zoom: ' + self.zoom);

    if (self.zoom >= 1.5) {
      // load next lowest resolution
      self.updateResolution(-1);
    } else if (self.zoom <= 0.5) {
      // load next highest resolution
      self.updateResolution(1);
    }

    self.camera.zoom = self.zoom;
    if (self.camera.zoom < 0) {
      self.camera.zoom = 0;
    }
    self.camera.updateProjectionMatrix();

  }
  */

  incZIndex() {
    let self = this;

    self.viewerState.zindex++;
    self._updateZIndex();
  }

  decZIndex() {
    let self = this;

    self.viewerState.zindex--;
    self._updateZIndex();
  }

  _updateZIndex() {
    let self = this;

    for (let layer of self.layers) {
      layer.updateZIndex(self.viewerState.zindex, self.renderScene);
    }
  }

  // zoomAndUpdate assumes zooming in. Set zoomIn to be false to zoom out
  zoomAndUpdate(zoomIn) {
    let self = this;

    if(zoomIn) {
      //self.camera.zoom *= 2;
      //self.camera.updateProjectionMatrix();
      //self.renderScene();
      self.updateResolution(self.getCurrentRes() - 1);
    } else {
      //self.camera.zoom *= 0.5;
      //self.camera.updateProjectionMatrix();
      //self.renderScene();
      self.updateResolution(self.getCurrentRes() + 1);
    }
  }

  updateResolution(newRes) {
    let self = this;

    // TODO: may need to update offset here

    console.log(newRes);
    if (self.getCurrentRes() < 0 || newRes < 0) {
      self.viewerState.res = newRes;
      console.log('ABTODO!')
      return;
    }
    self.viewerState.res = newRes;

    // update all layers
    for (let layer of self.layers) {
      layer.updateResolution(self.getCurrentRes(), self.scene, self.renderScene, function() {}.bind(this));
    }

    /*
    if (self.res + change > 0) {
      self.res += change;
      for (let layer of self.layers) {
        layer.updateResolution(self.res, self.scene, self.renderScene, function() { self.zoom += change/2; self.camera.zoom = self.zoom; self.camera.updateProjectionMatrix(); }.bind(this));
      }
    }
    */
  }

  addLayer(layer) {
    let self = this;
    layer.addTo(self.scene, self.offset, self.renderScene);
    self.layers.push(layer);
  }

  removeLayer(layer) {
    let self = this;
    layer.removeFrom(scene, self.renderScene);
    var idx = self.layers.indexOf(layer);
    if (index > -1) {
      self.layers.splice(index, 1);
    }
  }

  animate() {
    let self = this;
    requestAnimationFrame(self.animate);

    self.renderer.render(self.scene, self.camera);

  }

  renderScene() {
    let self = this;
    self.renderer.render(self.scene, self.camera);
    console.log('rendered!');
  }

  triggerRender() {
      let self = this;

      self.init();
      self.renderScene();
  }

  render() {
    return (
      <div id="visualizer-target"></div>
    );
  }
}

export default Visualizer;

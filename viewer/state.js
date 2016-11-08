var THREE = require('three');

class State {
  constructor(xstart, xoffset, xsize, ystart, yoffset, ysize, zstart, zoffset, zsize, minres, maxres, res) {

    // user provided state
    this.xstart = xstart;
    this.xmin = xoffset;
    this.xmax = xsize + xoffset - 1;

    this.ystart = ystart;
    this.ymin = yoffset;
    this.ymax = ysize + yoffset - 1;

    this.zmin = zoffset;
    this.zmax = zsize + zoffset - 1;
    this.zindex = zstart;

    this.minres = minres;
    this.maxres = maxres;
    this.res = res;

    // preset state
    //this.blendmode = THREE.NormalBlending;
    this.blendmode = THREE.AdditiveBlending;

    this.fragmentShader = document.getElementById('fragmentShader').text;
    this.vertexShader = document.getElementById('vertexShader').text;

    this.layers = [];

  }

  addLayer(layer) {
    this.layers.push(layer);
  }
}

class StateLayer {
  constructor(name, url, tilesize, color, enabled=true) {
    this.name = name;
    this.url = url;
    this.tilesize = tilesize;
    this.color = color;
    this.enabled = enabled;

    // some default values
    this.opacity = 1.0;
    this.minval = 0.0;
    this.maxval = 1.0;
    this.gamma = 1.0;
    this.bitdepth = 8; //ABTODO use for min/max range
  }
}

export {
  State,
  StateLayer
}
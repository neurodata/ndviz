import Tile from './tile.js';
var THREE = require('three');

export default class TileLayer  {
  // the constructor only builds a TileLayer object. tiles are loaded on add
  constructor(zindex, res, tilesize, color, url, state, stateLayer) {
    this.zindex = zindex;
    this.res = res;
    this.cameraPixelRes = res > 0 ? res : 0;
    this.tilesize = tilesize;

    this.color = color;

    this.baseUrl = url;

    this.state = state;
    this.stateLayer = stateLayer;

    this.offset = new THREE.Vector3();

    // set of tiles
    this.children = new Set();
    this.tiles = new Map(); // children -> tile
  }

  _loadTiles(offset) {
    let self = this;

    var halfWidth = window.innerWidth/2;
    var halfHeight = window.innerHeight/2;

    var tilesToLoadWidth = new THREE.Vector2(
      Math.floor( (-halfWidth-offset.x) / self.tilesize),
      Math.ceil( (halfWidth -offset.x) / self.tilesize)
    );
    var tilesToLoadHeight = new THREE.Vector2(
      Math.floor( (-halfHeight + offset.y) / self.tilesize),
      Math.ceil( (halfHeight + offset.y) / self.tilesize)
    );

    var tmpTiles = new Set();

    for (var x = tilesToLoadWidth.x; x < tilesToLoadWidth.y; x++) {
      for (var y = tilesToLoadHeight.x; y < tilesToLoadHeight.y; y++) {
        //console.log(x ', ' y);
        tmpTiles.add(x + "," + y);
      }
    }

    // add anything not in the old set
    let tilesToAdd = new Set(
      [...tmpTiles].filter(x => !self.children.has(x))
    );

    // throw away anything not in the new set
    let tilesToRemove = new Set(
      [...self.children].filter(x => !tmpTiles.has(x))
    );
    return [tilesToAdd, tilesToRemove];
  }

  // load tiles on add
  addTo(scene, offset, render) {
    let self = this;
    let [tilesToAdd, tilesToRemove] = self._loadTiles(offset);

    for (let tileCoord of tilesToAdd) {
      let tile = self.storeTile(tileCoord);
      tile.addToScene(scene, offset, render);
    }
  }

  storeTile(coordinate) {
    let self = this;

    self.children.add(coordinate);
    let x = coordinate.split(',')[0];
    let y = coordinate.split(',')[1];
    let tile = new Tile(x, y, self.zindex, self.res, self.tilesize, self.baseUrl, self);
    self.tiles.set(coordinate, tile);

    return tile;
  }

  removeStoredTile(coordinate) {
    let self = this;

    self.children.delete(coordinate);
    let tile = self.tiles.get(coordinate);
    self.tiles.delete(coordinate);

    return tile;
  }

  // remove tiles on remove
  removeFrom(scene, render) {
    let self = this;

    for (let tile of self.children) {
      tile.removeFromScene(scene, render);
    }
  }

  onPan(mouseVector, scene, render) {
    let self = this;

    if (!mouseVector) {
      return;
    }

    // update the position of all existing tiles first
    for (let tile of self.tiles.values()) {
      if (tile.mesh) {
        tile.updatePosition( mouseVector );
      }
    }

    // update the global offset for adding new tiles
    self.offset.add(mouseVector);

    // handle adding and removing tiles
    let [tilesToAdd, tilesToRemove] = self._loadTiles(self.offset);

    for (let coordinate of tilesToAdd) {
      let tile = self.storeTile(coordinate);
      tile.addToScene(scene, self.offset, render);
    }

    for (let coordinate of tilesToRemove) {
      let tile = self.removeStoredTile(coordinate);
      tile.removeFromScene(scene, render);
    }
  }

  updateResolution(newRes, scene, render, onLoad) {
    let self = this;

    // going to need to load an entirely new set of tiles! :-(
    //let oldChildren = new Set([...self.children]);
    let oldTiles = new Map([...self.tiles]);

    self.tiles = new Map();
    self.children = new Set();

    let resChange = newRes - self.res;

    self.res = newRes;
    let offsetCoords = self.offset.divideScalar(Math.pow(2,resChange));

    let [tilesToAdd, tilesToRemove] = self._loadTiles(self.offset);

    var tilesToLoad = tilesToAdd.size;
    for (let coordinate of tilesToAdd) {
      let tile = self.storeTile(coordinate);
      tile.addToScene(scene, offsetCoords, function() {
        render();
        tilesToLoad--;
        if (tilesToLoad == 0) {
          for (let oldTile of oldTiles.values()) {
            oldTile.removeFromScene(scene, render);
          }
        }
      }.bind(this));
    }

    for (let coordinate of tilesToRemove) {
      let tile = self.removeStoredTile(coordinate);
      tile.removeFromScene(scene, render);
    }
  }

  updateZIndex(zindex, render) {
    let self = this;

    self.zindex = zindex;
    for (let tile of self.tiles.values()) {
      tile.updateZIndex(self.zindex, render);
    }
  }

  reload(render) {
    let self = this;

    for (let tile of self.tiles.values()) {
      tile.updateTileMaterial(render);
    }

  }
}

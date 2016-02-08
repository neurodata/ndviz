// for smooth scrolling through z-indices
// TODO
// Implement blend mode, fix other modes for safari and fx
//
L.TileLayer.OCPLayer = L.TileLayer.extend({

	options: {
		minZoom: 0,
		maxZoom: 18,
		tileSize: 256,
		subdomains: 'abc',
		errorTileUrl: '',
		attribution: '',
		zoomOffset: 0,
		opacity: 1,
    /* begin ocpviz added */
    brightness: 100,
    contrast: 100,
    curtime: 0,
    propagate: 0,
    /* end ocpviz added */
		/*
		maxNativeZoom: null,
		zIndex: null,
		tms: false,
		continuousWorld: false,
		noWrap: false,
		zoomReverse: false,
		detectRetina: false,
		reuseTiles: false,
		bounds: false,
		*/
		unloadInvisibleTiles: L.Browser.mobile,
		updateWhenIdle: L.Browser.mobile
	},

  _tileOnLoad: function () {
    var layer = this._layer;
    
    //Only if we are loading an actual image
    if (this.src !== L.Util.emptyImageUrl) {
      L.DomUtil.addClass(this, 'leaflet-tile-loaded');
      // mark classes by index
      L.DomUtil.addClass(this, 'index-' + ndv.zindex);

      layer.fire('tileload', {
        tile: this,
        url: this.src
      });
    }

    layer._tileLoaded();
  },
	
  _loadTile: function (tile, tilePoint) {
		tile._layer  = this;
		tile.onload  = this._tileOnLoad;
		tile.onerror = this._tileOnError;

		this._adjustTilePoint(tilePoint);
    if (tilePoint.x < 0 || tilePoint.y < 0) {
      tile.src = L.Util.emptyImageUrl
    }
    else {
      tile.src     = this.getTileUrl(tilePoint);
    }
		this.fire('tileloadstart', {
			tile: tile,
			url: tile.src
		});
	},

  smoothRedraw: function () {
    if (this._map) {
      var old_tiles = this._tiles;
      this._tiles = {};
      this._tilesToLoad = 0;
      this._update();
      this._clearBgBuffer();

      function unloadTiles() {
        for (key in old_tiles) {
          this._tileContainer.removeChild(old_tiles[key]);
        }
        old_tiles = {};
      };

      this.on('load', function () {
          setTimeout(unloadTiles.bind(this), 300);
      });
    }
    return this;
  },

  _smoothRemoveTile: function(tile) {
    this._tileContainer.removeChild(tile);
  },

	_getTileSize: function () {
		var map = this._map,
		    zoom = map.getZoom() + this.options.zoomOffset,
		    zoomN = this.options.maxNativeZoom,
		    tileSize = this.options.tileSize;
   
		if (zoomN && zoom > zoomN) {
      tileSize = Math.round(map.getZoomScale(zoom) / map.getZoomScale(zoomN) * tileSize);
    }
    else if ( (zoomN == 0) && (zoom > zoomN) ) {
      // another quick for the case where maxNativeZoom is 0
      // AB TODO consider using == undefined in the general case 
      tileSize = Math.round(map.getZoomScale(zoom) / map.getZoomScale(zoomN) * tileSize);
    }

		return tileSize;
	},


	_getZoomForUrl: function () {

		var options = this.options,
		    zoom = this._map.getZoom();
		if (options.zoomReverse) {
			if (options.maxNativeZoom) {
        zoom = options.maxNativeZoom - zoom;
			}
			else if (options.maxNativeZoom == 0) {
        // inelegantly handle the case where maxNativeZoom exists and is 0
        zoom = options.maxNativeZoom - zoom;
      }
      else {
        zoom = options.maxZoom - zoom;
			}
		}

		zoom += options.zoomOffset;
		//return options.maxNativeZoom ? Math.min(zoom, options.maxNativeZoom) : zoom;
    return Math.max(0, zoom);
	},

  setBrightness: function (brightness) {
		this.options.brightness = brightness;

		if (this._map) {
			this._updateBrightness();
		}

		return this;
	},

  _updateBrightness: function () {
    L.DomUtil.setBrightnessContrast(this._container, this.options.brightness, this.options.contrast);
  },

  setContrast: function (contrast) {
		this.options.contrast = contrast;

		if (this._map) {
			this._updateContrast();
		}

		return this;
	},

  _updateContrast: function () {
    L.DomUtil.setBrightnessContrast(this._container, this.options.brightness, this.options.contrast);

  },

  setBlendMode: function (blendmode) {
    if (this._map) {
      L.DomUtil.setBlendMode(this._container, blendmode);
    }
    return this;
  },

});

// add updateBrightness and updateContrast methods
// TODO support for Fx
L.extend(L.DomUtil, {
  setBrightnessContrast: function(el, brightness, contrast) {
    if ('filter' in el.style) {
      el.style.setProperty('-webkit-filter', 'brightness(' + brightness + '%) ' + 'contrast(' + contrast + '%)')
    }
  },
  setBlendMode: function(el, mode) {
    // TODO validate this somehow?
    console.log(el.style);
    el.style.setProperty('mix-blend-mode', mode);
  },

});

L.tileLayer.OCPLayer = function (url, options) {
    return new L.TileLayer.OCPLayer(url, options);
};

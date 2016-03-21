// for smooth scrolling through z-indices
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

		// don't load negative tiles (ndstore is 0 indexed)
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

	_createTile: function () {
		var tile = L.DomUtil.create('img', 'leaflet-tile');
		/* camanjs filtering */
		tile.setAttribute('crossOrigin','anonymous');

		tile.style.width = tile.style.height = this._getTileSize() + 'px';
		tile.galleryimg = 'no';

		tile.onselectstart = tile.onmousemove = L.Util.falseFn;

		if (L.Browser.ielt9 && this.options.opacity !== undefined) {
			L.DomUtil.setOpacity(tile, this.options.opacity);
		}
		// without this hack, tiles disappear after zoom on Chrome for Android
		// https://github.com/Leaflet/Leaflet/issues/2078
		if (L.Browser.mobileWebkit3d) {
			tile.style.WebkitBackfaceVisibility = 'hidden';
		}
		return tile;
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
    el.style.setProperty('mix-blend-mode', mode);
  },

});

L.tileLayer.OCPLayer = function (url, options) {
    return new L.TileLayer.OCPLayer(url, options);
};

/* build our own canvas layer based on our modified TileLayer class */
L.TileLayer.OCPCanvas = L.TileLayer.Canvas.extend({
	options: {
		async: true
	},
/*
	onAdd: function (map) {
		this._map = map;
		this._animated = map._zoomAnimated;

		// create a container div for tiles
		this._initContainer();

		// set up events
		map.on({
			'viewreset': this._reset,
			'moveend': this._update
		}, this);

		if (this._animated) {
			map.on({
				'zoomanim': this._animateZoom,
				'zoomend': this._endZoomAnim
			}, this);
		}

		if (!this.options.updateWhenIdle) {
			this._limitedUpdate = L.Util.limitExecByInterval(this._update, 150, this);
			map.on('move', this._limitedUpdate, this);
		}

		this._reset();
		this._update();
	},
*/

	/* properly handle zoom */
	/*
	_endZoomAnim: function () {

			var front = this._tileContainer,
					bg = this._bgBuffer;

			front.style.visibility = '';
			front.parentNode.appendChild(front); // Bring to fore

			// force reflow
			L.Util.falseFn(bg.offsetWidth);

			var zoom = this._map.getZoom();
			if (zoom > this.options.maxZoom || zoom < this.options.minZoom) {
				this._clearBgBuffer();
			}

			this._animating = false;

	},
*/

	/*
	_reset: function (e) {

		var old_tiles = this._tiles;

		function unloadTiles() {
			for (var key in old_tiles) {
				this.fire('tileunload', {tile: old_tiles[key]});
			}
			old_tiles = {}
		};

		this.on('load', function () {
				setTimeout(unloadTiles.bind(this), 300);
				//setTimeout(this._endZoomAnim(), 200);
		});

		this._tiles = {};
		this._tilesToLoad = 0;

		if (this.options.reuseTiles) {
			this._unusedTiles = [];
		}

		this._tileContainer.innerHTML = '';

		if (this._animated && e && e.hard) {
			this._clearBgBuffer();
		}

		this._initContainer();
	},
	*/

	/*
	_tileLoaded: function () {
		this._tilesToLoad--;

		if (this._animated) {
			L.DomUtil.addClass(this._tileContainer, 'leaflet-zoom-animated');
		}

		if (!this._tilesToLoad) {
			this.fire('load');

			if (this._animated) {
				// clear scaled tiles after all new tiles are loaded (for performance)
				clearTimeout(this._clearBgBufferTimer);
				this._clearBgBufferTimer = setTimeout(L.bind(this._clearBgBuffer, this), 500);
			}
		}
	},
	*/

	/* set tile loaded only after drawing */
	/*
	_tileOnLoad: function () {
		var layer = this._layer;

		//Only if we are loading an actual image
		if (this.src !== L.Util.emptyImageUrl) {
			L.DomUtil.addClass(this, 'leaflet-tile-loaded');

			layer.fire('tileload', {
				tile: this,
				url: this.src
			});
		}

		layer._tileLoaded();
	},

	_loadTile: function (tile, tilePoint) {
		tile._layer = this;
		tile._tilePoint = tilePoint;

		this._redrawTile(tile);

		if (!this.options.async) {
			this.tileDrawn(tile);
		}
	},

	*/
	/*
	tileDrawn: function(tile) {
		console.log('argggggg');
		console.log(tile);
		//var layer = tile._layer;
		//layer._tileLoaded();

	},
	*/
	/*
	_tileOnLoad: function () {
		var layer = this._layer;

		//Only if we are loading an actual image
		if (this.src !== L.Util.emptyImageUrl) {
			L.DomUtil.addClass(this, 'leaflet-tile-loaded');

			layer.fire('tileload', {
				tile: this,
				url: this.src
			});
		}

		layer._tileLoaded();
	},
	*/

	/* reblends tiles */
	reload: function() {
		for (var i in this._tiles) {
			this._reloadTile(this._tiles[i]);
		}
	},

	_reloadTile: function(tile) {
		this.reloadTile(tile, tile._tilePoint, this._map._zoom);
	},

	reloadTile: function(/*tile, tilePoint, zoom*/) {
		// override with tile rendering code
	},

	// compatability with OCPLayer above (for panning)
	smoothRedraw: function() {
		if (this._map) {
			this._update();
		}

		for (var i in this._tiles) {
			this._reloadTile(this._tiles[i]);
		}
		return this;
	},

});

L.tileLayer.OCPCanvas = function (options) {
	return new L.TileLayer.OCPCanvas(options);
};

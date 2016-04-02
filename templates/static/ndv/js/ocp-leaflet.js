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
			// hide by default
			//L.DomUtil.addClass(this, 'hidden');
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
		// TODO don't load tiles > image bounds
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
		/* camanjs filtering TODO do we keep this? */
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
    //el.style.setProperty('mix-blend-mode', mode);
  },

});

L.tileLayer.OCPLayer = function (url, options) {
    return new L.TileLayer.OCPLayer(url, options);
};

/* build our own THREEJS rendering layer based on our modified TileLayer class */
L.TileLayer.OCPCanvas = L.TileLayer.OCPLayer.extend({
	options: {
		async: true,
	},
	// same as canvas layer
	initialize: function (options) {
		L.setOptions(this, options);
	},

	redraw: function () {
		if (this._map) {
			this._reset({hard: true});
			this._update();
		}

		for (var i in this._tiles) {
			this._redrawTile(this._tiles[i]);
		}
		return this;
	},

	_loadTile: function (tile, tilePoint) {
		tile._layer = this;
		tile._tilePoint = tilePoint;

		this._redrawTile(tile);

		if (!this.options.async) {
			this.tileDrawn(tile);
		}
	},

	/* the following methods have been modified from L.TileLayer.Canvas */
	_createTile: function () {
		var tile = L.DomUtil.create('div', 'leaflet-tile');
		// scale tile size by zoom
		tile.width = tile.height = this._getTileSize();

		tile.renderer = new THREE.WebGLRenderer();
		tile.renderer.setSize( tile.width, tile.height );
		tile.appendChild( tile.renderer.domElement );

		tile.camera = this._getCamera();

		tile.onselectstart = tile.onmousemove = L.Util.falseFn;
		return tile;
	},

	_removeTile: function (key) {
		var tile = this._tiles[key];

		this.fire('tileunload', {tile: tile, url: tile.src});

		if (this.options.reuseTiles) {
			L.DomUtil.removeClass(tile, 'leaflet-tile-loaded');
			this._unusedTiles.push(tile);

		} else if (tile.parentNode === this._tileContainer) {
			this._tileContainer.removeChild(tile);
		}

		// for https://github.com/CloudMade/Leaflet/issues/137
		if (!L.Browser.android) {
			tile.onload = null;
			tile.src = L.Util.emptyImageUrl;
		}

		delete this._tiles[key];
	},

	// remove hidden tag
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

	_getCamera: function() {
			var curTileSize = this._getTileSize();
			return new THREE.OrthographicCamera( curTileSize / -2, curTileSize / 2, curTileSize / 2, curTileSize / -2, 1, 1000 );
		},

	_redrawTile: function (tile) {
		this.drawTile(tile, tile._tilePoint, this._map._zoom, this._getTileSize());
	},

	drawTile: function (/*tile, tilePoint, zoom, tileSize*/) {
		// override with rendering code
	},

	/* the following methods have been added */
	tileDrawn: function (tile) {
		this._tileOnLoad.call(tile);
	},

	/* reblends tiles */
	reload: function() {
		for (var i in this._tiles) {
			this._reloadTile(this._tiles[i]);
		}
	},

	_reloadTile: function(tile) {
		//this.reloadTile(tile, tile._tilePoint, this._map._zoom);
		this.drawTile(tile, tile._tilePoint, this._map._zoom, this._getTileSize());
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

/* creates a single WebGL rendering context that spans the page */
L.WebGLLayer = L.Class.extend({
	options: {
		minZoom: 0,
		maxZoom: 18,
		tileSize: 256,
		zoomOffset: 0,
	},

	initialize: function(options) {
		//this._bounds = L.latLngBounds(bounds);

		L.setOptions(this, options);
	},

	draw: function() {
		/* WebGL drawing function */
	},

	onAdd: function(map) {
		this._map = map;

		if (!this._renderer) {
			this._initRenderer();
			//this._setRendererSize(map.getSize()); // handle in _reset()
		}

		map._panes.overlayPane.appendChild( this._renderer.domElement );

		map.on({
			'viewreset': this._reset,
			'moveend': this._update
		}, this);

		if (map.options.zoomAnimation) {
			map.on('zoomanim', this._animateZoom, this);
			// TODO we could add an end catch here, too, to redraw
		}

		this._reset();
		this.draw();
	},

	onRemove: function(map) {
		map.getPanes().overlayPane.removeChild( this._renderer.domElement );

		map.off({
			'viewreset': this._reset,
			'moveend': this._update
		}, this);
		if (map.options.zoomAnimation) {
			map.off('zoomanim', this._animateZoom, this);
		}
	},

	addTo: function(map) {
		map.addLayer(this);
		return this;
	},

	_animateZoom: function(e) {
		// TODO
	},

	_reset: function() {
		this._setRendererSize(this._map.getSize());
		//this._setupCamera(this._map.getPixelOrigin());
		this._setupCamera(this._map.getSize());
	},

	_update: function() {
		if (!this._map) { return; }

		var map = this._map,
			bounds = map.getPixelBounds(), // TODO don't need these?
			origin = map.getPixelOrigin(),
			size = map.getSize();

		//var shift = bounds.min.subtract(origin);
		var position = map._getMapPanePos().multiplyBy(-1);

		L.DomUtil.setPosition( this._renderer.domElement, position );
		this._reset();
		this.draw();
	},

	_getSize: function() {
		return this._map.getSize();
	},

	_initRenderer: function() {
		this._renderer = new THREE.WebGLRenderer();
		//this._renderer.setClearColor( 0xff0000 );
	},

	_setRendererSize: function(size) {
		this._renderer.setSize( size.x, size.y );
	},

	_setupCamera: function(origin) {
		this._camera = new THREE.OrthographicCamera( origin.x / -2, origin.x / 2, origin.y / 2, origin.y / -2, 1, 1024.0 );
		//this._camera = new THREE.OrthographicCamera( bounds.min.x, bounds.max.x, bounds.min.y, bounds.max.y, 1, 1000 );

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

	// helper function for converting tile key to pixel coords
	_getTilePos: function(tilePointStr) {



		var tilePointTmp = tilePointStr.split(":");
		var tilePoint = new L.Point(tilePointTmp[0], tilePointTmp[1]);

		var tileSize = this._getTileSize(),
		            nwPoint = tilePoint.multiplyBy(tileSize),
		            sePoint = nwPoint.add(new L.Point(tileSize, tileSize)),
		            nw = this._map.unproject(nwPoint),
		            se = this._map.unproject(sePoint),
		            bounds = new L.LatLngBounds([nw, se]);

		var tileCenter = map._getCenterOffset( bounds.getCenter() );
		return map.layerPointToContainerPoint( L.point(tileCenter.x, tileCenter.y*-1 ) );
		/*
		var origin = this._map.getPixelOrigin(),
				bounds = this._map.getPixelBounds(),
				tileSize = this._getTileSize();

		var test = this._map._getCenterLayerPoint();

		// this gives us the coordinates for the nw corner of each tile
		var tilePointNw = tilePoint.multiplyBy(tileSize); //  .subtract( [tileSize / 2.0, tileSize / 2.0] );
		var tileCenter = tilePointNw.subtract([tileSize / 2.0, tileSize / 2.0]);
		//return tilePoint.multiplyBy(tileSize).subtract(bounds.min);
		return map.latLngToContainerPoint(map.unproject(tilePointNw));
		*/
	},


	_drawCircle: function(point) {
		var scene = new THREE.Scene();
		var material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
		var geometry = new THREE.CircleGeometry( 10, 20 );
		var mesh = new THREE.Mesh(geometry, material);
		mesh.position.set(point.x, point.y, 0);
		scene.add(mesh);

		function render() {
			requestAnimationFrame( render.bind(this) );
			this._renderer.render(scene, this._camera);
		}
		render.bind(this)();

	},

});

L.webGLLayer = function(options) {
	return new L.WebGLLayer(options);
};

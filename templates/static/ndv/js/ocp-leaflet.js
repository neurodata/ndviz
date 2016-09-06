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
    curtime: 0,
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
			L.DomUtil.addClass(this, 'hidden');
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
    } else {
      tile.src = this.getTileUrl(tilePoint);
    }
		this.fire('tileloadstart', {
			tile: tile,
			url: tile.src
		});
	},

	_createTile: function () {
		var tile = L.DomUtil.create('img', 'leaflet-tile');
		/* required to load tiles as textures */
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

	_removeAllTiles: function() {
		for (var key in this._tiles) {
			this.fire('tileunload', {tile: this._tiles[key]});
		}
		this._tiles = {};
		this._tilesToLoad = 0;

		this._tileContainer.innerHTML = '';
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
					var tile = old_tiles[key];
					this.fire('tileunload', {tile: tile, url: tile.src});
          this._tileContainer.removeChild(tile);
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
});

L.tileLayer.OCPLayer = function (url, options) {
    return new L.TileLayer.OCPLayer(url, options);
};

/* creates a single WebGL rendering context that spans the page */
L.WebGLLayer = L.Class.extend({
	options: {
		minZoom: 0,
		maxZoom: 18,
		tileSize: 256,
		zoomOffset: 0,
		disableScreenRender: false,
		isIdle: false,
	},

	isIdle: false,

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
			this._initCamera(map.getSize());
		}

		map._panes.overlayPane.appendChild( this._renderer.domElement );

		map.on({
			'viewreset': this._reset,
			'moveend': this._update
		}, this);

		if (map.options.zoomAnimation) {
			map.on({
				'zoomanim': this._animateZoom,
				'zoomend': this._endZoomAnim,
			}, this);
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
			map.off({
				'zoomanim': this._animateZoom,
				'zoomend': this._endZoomAnim,
			}, this);
		}
	},

	addTo: function(map) {
		map.addLayer(this);
		return this;
	},

	_animateZoom: function(e) {
		var scale = map.getZoomScale(e.zoom);
		console.log(scale);
		this._camera.zoom = scale;
		this._camera.updateProjectionMatrix();
		this._renderToScreen();
		this.disableScreenRender();
	},

	_endZoomAnim: function() {
		this._camera.zoom = 1;
		this._camera.updateProjectionMatrix();
		setTimeout(this.enableScreenRender.bind(this), 200);
	},

	_reset: function() {
		this._setRendererSize(this._map.getSize());
		this._resizeCamera(this._map.getSize());
		//this._setupCamera(this._map.getPixelOrigin());
		//this._setupCamera(this._map.getSize());
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
		this._renderToScreen();
	},

	disableScreenRender: function() {
		this.options.disableScreenRender = true;
	},

	enableScreenRender: function() {
		this.options.disableScreenRender = false;
	},

	_renderToScreen: function() {
		if (this._renderTarget && !this.options.disableScreenRender) {
			if (this._screenScene) {
				// clean up existing scene
				this._screenScene.children[0].geometry.dispose();
				this._screenScene.children[0].material.dispose();
				this._screenScene.remove( this._screenScene.children[0] );
			}

			var worldSize = this._map.getSize();
			var geo = new THREE.PlaneBufferGeometry( worldSize.x, worldSize.y );
			var mat = new THREE.MeshBasicMaterial({map: this._renderTarget.texture });
			var mesh = new THREE.Mesh( geo, mat );
			this._screenScene = new THREE.Scene();
			this._screenScene.add(mesh);

			this._renderer.render(this._screenScene, this._camera)
		}
	},

	_getSize: function() {
		return this._map.getSize();
	},

	_initRenderer: function() {
		this._renderer = new THREE.WebGLRenderer();
	},

	_initCamera: function(origin) {
		this._camera = new THREE.OrthographicCamera( origin.x / -2, origin.x / 2, origin.y / 2, origin.y / -2, 1, 1024.0 );
	},

	_setRendererSize: function(size) {
		this._renderer.setSize( size.x, size.y );
	},

	_resizeCamera: function(origin) {
		this._camera.left = origin.x / -2;
		this._camera.right = origin.x / 2;
		this._camera.top = origin.y / 2;
		this._camera.bottom = origin.y / -2;
		this._camera.updateProjectionMatrix();
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
		//return map.layerPointToContainerPoint( L.point(tileCenter.x, tileCenter.y*-1 ) );
		return L.point(tileCenter.x, tileCenter.y*-1);
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

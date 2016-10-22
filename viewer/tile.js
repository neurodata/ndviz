import Colors from './webgl/colors.js';

var THREE = require('three');

export default class Tile {
  constructor(x, y, z, res, size, baseUrl, tileLayer) {
    let self = this;

    this.x = x;
    this.y = y;
    this.z = z;
    this.res = res;
    this.size = size;

    this.mesh = null;

    this.baseUrl = baseUrl;
    this.tileLayer = tileLayer;
  }

  getWorldPosition() {
    return new Vector2(this.x*this.size, this.y*this.size);
  }

  getCurrentUrl() {
    var url;
    url = this.baseUrl.replace('{x}', this.x);
    url = url.replace('{y}', this.y);
    url = url.replace('{z}', this.z);
    url = url.replace('{res}', this.res);

    return url;
  }

  updateZIndex(zindex, render) {
    let self = this;
    self.z = zindex;
    self.updateTileMaterial(render);
  }

  updatePosition(offset) {
    let self = this;

    self.mesh.position.add(offset);
  }

  updateTileMaterial(render=null, onLoad=null) {
    let self = this;

    var loader = new THREE.TextureLoader();
    loader.load(
      // resource URL
      self.getCurrentUrl(),
      // Function when resource is loaded
      function( texture ) {
        let self = this;

        // some default uniforms
        var uniforms = {
          color: { type: "c", value: Colors.GetColor(self.tileLayer.color) },
          texture: { type: "t", value: texture },
          // TODO: read these from parent!
          opacity: { type: "f", value: 1 },
          minval: { type: "f", value: 0.0 },
          maxval: { type: "f", value: 1.0 },
          gamma: { type: "f", value: 1.0 },
        };

        // TODO only enable these when sliders have been moved
        var defines = {
          REMAP: true,
          GAMMACOR: true,
        }

        var material = new THREE.ShaderMaterial({
          uniforms: uniforms,
          defines: defines,
          vertexShader: self.tileLayer.state.vertexShader,
          fragmentShader: self.tileLayer.state.fragmentShader,
          transparent: true,
          blending: self.tileLayer.state.blendmode,
        });

        self.mesh.material = material;
        self.mesh.needsUpdate = true;

        if (render) {
          render();
        }

        if (onLoad) {
          onLoad();
        }

      }.bind(this),
      // Function to be called when download progresses
      function( e ) {
        // null
      },
      // Function called when download errors
      function( e ) {
        console.log("error " + e.target.status + ", " + e.target.statusText);
        if (render) {
          render();
        }
      }
    )
  }

  addToScene(scene, offset, render=null) {
    let self = this;

    var geometry = new THREE.PlaneGeometry(self.size, self.size);
    var loader = new THREE.TextureLoader();
    loader.load(
      // resource URL
      self.getCurrentUrl(),
      // Function when resource is loaded
      function( texture ) {
        let self = this;

        // some default uniforms
        var uniforms = {
          color: { type: "c", value: Colors.GetColor(self.tileLayer.color) },
          texture: { type: "t", value: texture },
          // TODO: read these from parent!
          opacity: { type: "f", value: 1.0 },
          minval: { type: "f", value: 0.0 },
          maxval: { type: "f", value: 1.0 },
          gamma: { type: "f", value: 1.0 },
        };

        // TODO only enable these when sliders have been moved
        var defines = {
          REMAP: true,
          GAMMACOR: true,
        }

        var material = new THREE.ShaderMaterial({
          uniforms: uniforms,
          defines: defines,
          vertexShader: self.tileLayer.state.vertexShader,
          fragmentShader: self.tileLayer.state.fragmentShader,
          transparent: true,
          blending: self.tileLayer.state.blendmode,
        });
        self.mesh = new THREE.Mesh( geometry, material );

        var halfTileSize = self.size / 2;

        var pos = new THREE.Vector3(
          offset.x + self.x*self.size + halfTileSize,
          offset.y - self.y*self.size - halfTileSize,
          0
        );

        self.mesh.position.copy(pos);

        scene.add( self.mesh );

        if (render) {
          render();
        }

      }.bind(this),
      // Function to be called when download progresses
      function( e ) {
        // null
      },
      // Function called when download errors
      function( e ) {
        console.log("error " + e.target.status + ", " + e.target.statusText);
        if (render) {
          render();
        }
      }
    );
  }

  removeFromScene(scene, render=null) {
    let self = this;

    scene.remove(self.mesh);

    if (render) {
      render();
    }
  }
}

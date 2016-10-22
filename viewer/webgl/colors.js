var THREE = require('three');

export default class Colors {
  static GetColor(color) {
    switch(color) {
      case 'R':
        return new THREE.Color("rgb(255,0,0)");
      case 'G':
        return new THREE.Color("rgb(0, 255, 0)");
      case 'B':
        return new THREE.Color("rgb(0, 0, 255)");
      case 'C':
        return new THREE.Color("rgb(0, 255, 255)");
      case 'M':
        return new THREE.Color("rgb(255, 0, 255)");
      case 'Y':
        return new THREE.Color("rgb(255, 255, 0)");
      default:
        return new THREE.Color("rgb(255, 255, 255)");
    }
  }
}

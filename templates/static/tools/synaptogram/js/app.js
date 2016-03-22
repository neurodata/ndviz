var synaptogramApp = angular.module('synaptogramApp', [
  'synaptogramControllers',
  'synaptogramServices',
  'angular-loading-bar',
  'ngAnimate',
]);


synaptogramApp.config(function($resourceProvider) {
  $resourceProvider.defaults.stripTrailingSlashes = false;
});

synaptogramApp.filter('half', function() {
  return function(input) {
    return Math.round( input / 2 );
  }
});

// global app vars
//var server = 'http://brainviz1.cs.jhu.edu/microns';
//var server = 'http://ec2-52-36-22-26.us-west-2.compute.amazonaws.com';
//var server = 'http://localhost:8000/';

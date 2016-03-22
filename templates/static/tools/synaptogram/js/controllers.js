var synaptogramControllers = angular.module('synaptogramControllers', []);

synaptogramControllers.controller('synaptogramController', ['$scope', '$window', 'ProjInfo', 'Synaptogram', function($scope, $window, ProjInfo, Synaptogram) {
  $scope.token = $window.inits.token;
  $scope.channels = $window.channels;
  $scope.chanlist = $scope.channels.join(',');
  $scope.chanoptions = []
  $scope.channelToAdd = '';
  $scope.plane = 'xy';
  $scope.res = $window.inits.res;
  // 661 482 0
  $scope.x = $window.inits.x;
  $scope.y = $window.inits.y;
  $scope.z = $window.inits.z;

  $scope.size = Math.max($window.inits.xsize, $window.inits.ysize);
  $scope.zboxes = $window.inits.zsize;

  $scope.overlayimg = null;

  $scope.loadChannels = function() {
    var projinfo = ProjInfo.query({
      token: $scope.token,
    });

    projinfo.$promise.then(function() {
      for (var chan in projinfo['channels']) {
        $scope.chanoptions.push(chan);
      }
    });
  }
  $scope.loadChannels();

  $scope.reload = function() {
    //$scope.channels = [];
    //$scope.chanlist = '';
    $scope.res = 0;
    $scope.x = 0;
    $scope.y = 0;
    $scope.z = 0;
    $scope.size = 5;
    $scope.zboxes = 5;

    $scope.loadChannels();
  }

  // if we have invalid values for any of the inits, reload
  if ($scope.x == "None" || $scope.y == "None" || $scope.z == "None") {
    $scope.reload()
  }
  if ($scope.res == "None" || $scope.size == "None" || $scope.zboxes == "None") {
    $scope.reload()
  }

  $scope.hidden = true;

  $scope.loadSynaptogram = function() {
    // hide on load
    $scope.hidden = true;

    var synaptogramRaw = Synaptogram.query({
      token: $scope.token,
      chanlist: $scope.chanlist,
      plane: $scope.plane,
      res: $scope.res,
      x: Math.round($scope.x - $scope.size/2) + ',' + Math.round($scope.x + $scope.size/2),
      y: Math.round($scope.y - $scope.size/2) + ',' + Math.round($scope.y + $scope.size/2),
      z: $scope.z + ',' + Math.round($scope.z + $scope.zboxes), // Math.round forces addition
    });

    $scope.imgs = {};
    $scope.dtypes = {};

    var loadData = synaptogramRaw.$promise.then(function() {
      // process channel types
      for (var i in $scope.channels) {
        var chan = $scope.channels[i];
        $scope.dtypes[ chan ] = synaptogramRaw[ chan + '.dtype' ];
      }
      // create synaptogram images
      $scope.shape = synaptogramRaw.shape;
      for (var i in $scope.channels) {
        var chan = $scope.channels[i];
        $scope.imgs[ chan ] = [];
        for (var j in synaptogramRaw[ chan ] ) {
          $scope.imgs[ chan ].push( {'arr': synaptogramRaw[ chan ][ j ]} );
        }
      }
    });
    loadData.then(function() {
      // show
      $scope.hidden = false;
      // TMP
      $scope.overlayimg = $scope.imgs['synapses'];
      console.log($scope.overlayimg);
    })
  }
  if ($scope.channels.length > 0) {
    $scope.loadSynaptogram();
  }


  $scope.addChannel = function() {
    $scope.channels.push($scope.channelToAdd);
    $scope.chanlist = $scope.channels.join(',');
    $scope.loadSynaptogram();
  }
  $scope.removeChannel = function(channel) {
    var idx = $scope.channels.indexOf(channel);
    if (idx > -1) {
      $scope.channels.splice(idx, 1);
      $scope.chanlist = $scope.channels.join(',');
      $scope.loadSynaptogram();
    }
  }

  $scope.updateSize = function(newsize) {
    $scope.size = newsize;
    $scope.$digest();
    $scope.loadSynaptogram();
  }
  $scope.updateZBoxes = function(newzboxes) {
    $scope.zboxes = newzboxes;
    $scope.$digest();
    $scope.loadSynaptogram();
  }

}]);

synaptogramControllers.directive('scaleimage', function() {
  return {
    restrict: 'A', // match attribute name
    link: function(scope, element, attrs) {
      element.bind('load', function() {
        // call camanjs function to scale images
        scaleImage(element[0], 150, 150);
        var channel = attrs.class.split(" ")[1];
        if (scope.dtypes[channel] == 'uint32') {
          blackBackground(channel);
        }
      });
      element.bind('error', function() {
        alert('error: failed to load images');
      });
    }
  }
});

synaptogramControllers.directive('scaleoverlay', function() {
  return {
    restrict: 'A', // match attribute name
    link: function(scope, element, attrs) {
      element.bind('load', function() {
        // call camanjs function to scale images
        t = scaleImage(element[0], 150, 150);
        console.log(t);
      });
      element.bind('error', function() {
        alert('error: failed to load images');
      });
    }
  }
});

synaptogramControllers.directive('fadebeforeload', function() {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        element.on('load', function() {
          element.addClass('loading');
        }).on('error', function() {
          //
        });

        scope.$watch('ngSrc', function(newVal) {
          element.addClass('loading');
        });
      }
    };
});

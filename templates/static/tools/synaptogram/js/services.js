var synaptogramServices = angular.module('synaptogramServices', ['ngResource']);

// get synaptogram
synaptogramServices.factory('Synaptogram', ['$resource',
  function($resource) {
    return $resource(server + '/nd/synaptogram/:token/:chanlist/:plane/:res/:x/:y/:z/', {},
      { query: { method: 'GET', } }
    );
  }
]);

// get projinfo contents
synaptogramServices.factory('ProjInfo', ['$resource',
  function($resource) {
    return $resource(server + '/nd/sd/:token/info/', {},
      { query: { method: 'GET', } }
    );
  }
]);

'use strict';

angular.module('ibookApp')
    .controller('FriendCtrl', function ($rootScope, $http, $scope, $stateParams) {

        var id = $stateParams.id;

        $http.get('/api/friends/get/' + id).success(function (result) {
            $scope.contact = result.data;

            var itemId = result.data._id;

            $http.get('/api/friends/' + itemId + '/groups').success(function (result) {
                $scope.groups = result.data;
            });
        });
    });

'use strict';

angular.module('ibookApp')
    .controller('GroupsCtrl', function ($scope, $http, $ionicLoading) {
        $http.get('/api/groups').success(function (result) {
            $scope.groups = result.data;
        }).error(function () {
            $ionicLoading.show({
                template: '网络异常',
                noBackdrop: true,
                duration: 3000
            });
        });
    });

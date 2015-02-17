'use strict';

angular.module('ibookApp')
    .controller('FriendsCtrl', function ($scope, $rootScope, $stateParams, $http, $ionicLoading, $timeout) {

        $scope.searchText='';
        $scope.offset = 0;
        $scope.pageIndex = 0;
        $scope.data = {
            total: 0,
            items: []
        };
        $scope.hasMore = true;

        $scope.clearSearch = function () {
            $scope.setKeyword('');
        };

        $scope.setKeyword = function (keyword) {
            console.log(keyword);
            keyword = keyword.toUpperCase();
            if (keyword !== $scope.searchText) {

                $scope.searchText = keyword;
                $scope.offset = 0;
                $scope.data.total = 0;
                $scope.data.items = [];
                $scope.hasMore = false;//主动加载列表，不实用loadMore
                $scope.load({
                    q: $scope.searchText,
                    group_id: $stateParams.groupId,
                    from: 0,
                    size: 10
                });
            }
        };

        $scope.load = function (params) {
            $http.get('/api/friends/', {params: params}).success(function (result) {

                $scope.offset = $scope.offset + result.data.items.length;
                $scope.hasMore = $scope.offset < result.data.total;
                $scope.data.items = $scope.data.items.concat(result.data.items);
                $scope.$broadcast('scroll.infiniteScrollComplete');

            }).error(function () {
                $ionicLoading.show({
                    template: '网络异常',
                    noBackdrop: true,
                    duration: 3000
                });
            });
            ;
        };

        $scope.loadMore = function () {
            if (!$scope.hasMore) {
                return;
            }

            $scope.load({
                q: $scope.searchText,
                group_id: $stateParams.groupId,
                from: $scope.offset,
                size: 10
            });
        };
    }
);

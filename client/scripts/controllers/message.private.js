'use strict';

/**
 * # MessageCtrl
 * Controller of the ibookApp
 */
angular.module('ibookApp')
    .controller('MessagePrivateCtrl', function ($scope, $rootScope, $timeout) {

        $scope.title = '正在连接..';

        /**＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝
         * 启动默认发起请求进行获取数据
         *
         * private ---> private
         * private       <--
         * isReady
         ＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝*/

        $scope.$emit('data', {
            event: 'private'
        });

        $scope.$on('private', function (event, content) {
            $scope.title = '会话列表';
            $timeout(function () {
                //获取用户的名称和Id
                $scope.sessions = content.data;
            });
        });

        // 选取连接的用户id
        $scope.selectUserId = function (ids) {
            ids = ids || [];

            for (var i = 0; i < ids.length; i++) {
                if (ids[i] !== $rootScope.currentChatUserId) {
                    return ids[i];
                }
            }
        };

    });

'use strict';

/**
 * # MessageDetailCtrl
 * Controller of the ibookApp
 */
angular.module('ibookApp')
    .controller('MessageDetailCtrl', function ($scope, $rootScope, $stateParams, $timeout, $http) {
        $scope.toUserId = $stateParams.toUserId;
        $scope.messages = [];
        $scope.isReady = false;
        $scope.timestamp = '';
        $scope.title = '正在加载...';
        $scope.room = '';

        $http.get('/api/contacts/' + $scope.toUserId).success(function (result) {

            if (result.status !== 200) {
                $scope.title = '获取用户信息失败';
                return;
            }

            /**＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝
             * 启动默认发起请求进行获取数据
             *
             * private.conversation ---> private.conversation
             * private.status       <--
             *                       --> private.history
             * private.history       <--
             * isReady
             ＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝*/

                // 向父级发送请求，加入私人会话
            $scope.$emit('data', {
                event: 'private.conversation',
                content: {
                    to: $scope.toUserId
                }
            });


            /**＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝
             * 监听服务返回相关事件
             ＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝*/

                // 监听新文本消息
            $scope.$on('private.message', function (event, content) {

                $timeout(function () {

                        if ($scope.room === content.room) {
                            $scope.messages.push(
                                content
                            );
                        }
                    }
                );
            });

            // 获取私有聊天历史记录
            $scope.$on('private.history', function (event, data) {
                $timeout(function () {
                    $scope.isReady = true;
                    $scope.messages = data.data.concat($scope.messages);
                });
            });

            // 私人会话的状态
            $scope.$on('private.status', function (event, content) {
                $timeout(function () {
                        // 启动默认读取历史聊天记录
                        $scope.$emit('data', {
                            event: 'private.history',
                            content: {
                                to: $scope.toUserId,
                                timestamp: $scope.timestamp
                            }
                        });

                        $scope.room = content.room;
                        $scope.messages.push(content);
                    }
                );
            });


            $scope.$on('status.online', function (event, data) {
                $timeout(function () {
                        $scope.messages.push('用户上线了' + new Date());
                    }
                );
            });

            $scope.$on('status.offline', function (event, data) {
                $timeout(function () {
                        $scope.messages.push(
                                '用户offline了' + new Date()
                        );
                    }
                );
            });

            $scope.sendPrivateMessage = function (text) {
                console.log('send message');
                $scope.$emit('data', {
                    event: 'private.message',
                    content: {
                        to: $scope.toUserId,
                        text: text
                    }
                });
            };

            $scope.title = result.data.name || result.data.section_name;

        }).error(function () {
            $scope.title = '获取用户信息失败';
        });
    })
;

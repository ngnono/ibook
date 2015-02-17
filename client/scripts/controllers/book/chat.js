'use strict';

/**
 * # MessageDetailCtrl
 * Controller of the ibookApp
 */
angular.module('ibookApp')
    .controller('ChatCtrl', function ($scope, $rootScope, $ionicScrollDelegate, $stateParams, $timeout, $http) {
        $scope.toUserId = $stateParams.toUserId;
        $scope.messages = [];
        $scope.isReady = false;
        $scope.timestamp = +new Date();
        $scope.title = '正在加载...';
        $scope.room = '';
        $scope.isSendTimeline = false;

        var viewScroll = $ionicScrollDelegate.$getByHandle('userMessageScroll');

        $scope.scrollToBottom = function () {
            viewScroll.resize();
            $timeout(function () {
                viewScroll.scrollBottom(true);
            }, 500);
        };

        $scope.doRefresh = function () {
            $scope.$emit('data', {
                event: 'private.history',
                content: {
                    from: $rootScope.currentChatUserId,
                    to: $scope.toUserId,
                    timestamp: $scope.timestamp
                }
            });
        };


        $scope.$on('$ionicView.beforeLeave', function () {

        });

        $http.get('/api/friends/get/' + $scope.toUserId).success(function (result) {

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

                if ($scope.room === content.room) {

                    if (content.to !== $scope.toUserId && content.type !== 'time') {
                        var audio = document.getElementsByTagName("audio")[0];
                        audio.play();
                        $scope.messages = $scope.messages.concat([content]);
                    } else {
                        //更新发送状态
                        var msg = _.find($scope.messages, function (item) {
                            return item.tag == content.tag;
                        });

                        if (msg) {
                            msg.loading = false;
                        }
                    }

                    $timeout(function () {
                        viewScroll.scrollBottom(true);
                    }, 0);
                }
            });

            // push timeline
            $scope.pushTimeline = function () {
                $scope.$emit('data', {
                    event: 'private.message',
                    content: {
                        to: $scope.toUserId,
                        content: new Date(),
                        type: 'time'
                    }
                });
            };

            // 获取私有聊天历史记录
            $scope.$on('private.history', function (event, data) {
                console.log('private.history');
                $timeout(function () {
                    $scope.isReady = true;

                    $scope.$broadcast('scroll.refreshComplete');

                    $scope.timestamp = (_.first(data.data) || {}).timestamp;
                    console.log($scope.timestamp);
                    //添加时间
                    $scope.messages = data.data.concat($scope.messages);
                });
            });

            // 私人会话的状态
            $scope.$on('private.status', function (event, content) {
                $timeout(function () {

                        console.log(content);
                        // 启动默认读取历史聊天记录
                        $scope.$emit('data', {
                            event: 'private.history',
                            content: {
                                from: $rootScope.currentChatUserId,
                                to: $scope.toUserId,
                                timestamp: $scope.timestamp
                            }
                        });

                        $scope.online = (content.status === 'online');
                        $scope.room = content.room;


                        // 发送状态通知会话列表
                        $scope.$emit('private.opened.status', {id: content.room, status: true});

                        $timeout(function () {
                            $scope.scrollToBottom();
                        });

                        //绑定事件，进入页面清理未读信息
                        $scope.$on('$ionicView.enter', function () {
                            console.log('UserMessages $ionicView.enter');
                            $scope.$emit('private.opened.status', {id: content.room, status: true});
                        });

                        $scope.$on('$ionicView.beforeLeave', function () {
                            console.log('leaving UserMessages view, destroying interval');

                            //页面离开进行会话消息更新都是已经读取的信息
                            $scope.$emit('private.opened.status',
                                {
                                    id: content.room,
                                    status: false
                                });

                            console.log(content.room);
                            $scope.$emit('data', {
                                event: 'private.conversation.unread.clear',
                                content: {
                                    id: content.room
                                }
                            });

                        });
                    }
                );
            });

            $scope.$on('status.online', function (event, data) {
                $timeout(function () {
                        if (data.id === $scope.toUserId) {
                            $timeout(function () {
                                $scope.online = true;
                            }, 1);

                        }
                    }
                );
            });

            $scope.$on('status.offline', function () {
                $timeout(function () {
                    $scope.online = false;
                }, 0);
            });

            // 发送私有消息
            $scope.sendPrivateMessage = function () {
                var message = {
                    to: $scope.toUserId,
                    content: $scope.input.message,
                    type: 'text',
                    loading: true,
                    tag: +new Date()
                };

                console.log(message);

                if (!$scope.isSendTimeline) {
                    $scope.pushTimeline();
                    $scope.isSendTimeline = true;
                }

                $timeout(function () {
                    $scope.messages.push(message);
                });

                $scope.$emit('data', {
                    event: 'private.message',
                    content: message
                });

                $scope.input.message = '';
            };

            $scope.title = result.data.name || result.data.section_name;

        }).error(function () {
            $scope.title = '获取用户信息失败';
        });

        //
        $scope.onMessageHold = function (e, itemIndex, message) {
            console.log('onMessageHold');
            console.log('message: ' + JSON.stringify(message, null, 2));
        };
    })
;

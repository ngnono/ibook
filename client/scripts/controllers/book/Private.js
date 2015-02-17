'use strict';

/**
 * # MessageCtrl
 * Controller of the ibookApp
 */
angular.module('ibookApp')
    .controller('PrivateCtrl', function ($scope, $rootScope, $ionicActionSheet, $timeout, $http, ResourceServer) {

        /**
         * 使用RootScope聊天离开当前页面还可以进行
         * @type {string}
         */
        $scope.title = '正在连接..';
        $rootScope.conversations = [];
        $rootScope.opend = {};
        $rootScope.conversationsCache = {};
        $scope.ResourceServer = ResourceServer;

        /**＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝
         * 启动默认发起请求进行获取数据
         *
         * private ---> private
         * private       <--
         * isReady
         ＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝*/

        $scope.doRefresh = function () {
            $scope.$emit('data', {
                event: 'private'
            });
        };

        $scope.doRefresh();

        var loadConversations = function (content, callback) {

            var conversations = [];

            var ids = _.map(content.data || [], function (item) {
                return $scope.selectUserId(item.users || []);
            });

            // 获取用户信息
            $http.get('/api/friends/profiles', {params: {ids: ids.join(',')}})
                .success(function (result) {

                    var users = {};

                    _.each(result.data || [], function (item) {
                        users[item._id] = item;
                    });

                    _.each(content.data || [], function (item) {
                        var id = $scope.selectUserId(item.users);
                        var user = users[id] || {};
                        var conversation = {
                            _id: item._id,
                            name: user.name || user.section_name || user.store_name,
                            title: user.title,
                            avatar: ResourceServer + user.logo + '_100x100.jpg' || '',
                            activity: $scope.selectActive(item.activity),
                            users: item.users,
                            last_message: item.last_message,
                            update_at: item.update_at
                        };

                        // add to list
                        if (!$rootScope.conversationsCache[conversation._id]) {
                            conversations.push(conversation);
                        }

                        //add cache
                        $rootScope.conversationsCache[item._id] = angular.copy(conversation);
                    });

                    callback(conversations);
                });
        };

        $scope.$on('private', function (event, content) {
            loadConversations(content, function (conversations) {
                $timeout(function () {
                    $scope.$broadcast('scroll.refreshComplete');
                    $rootScope.conversations = $rootScope.conversations.concat(conversations);
                }, 1);
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

        // select current active
        $scope.selectActive = function (activity) {
            activity = activity || [];

            for (var i = 0; i < activity.length; i++) {
                if (activity[i].id === $rootScope.currentChatUserId) {
                    return activity[i];
                }
            }
        };

        $rootScope.$on('private.opened.status', function (event, content) {
            console.log('private.opened.status');
            console.log(content);
            $rootScope.opend[content.id] = content.status;
        });

        var audio = document.getElementsByTagName("audio")[0];
        // 监听新文本消息
        $rootScope.$on('private.message', function (event, content) {

            var conversation = _.findLast($rootScope.conversations, function (item) {
                return item._id === content.room;
            });

            $timeout(function () {

                if (conversation && content.to === $rootScope.currentChatUserId && content.type !== 'time' && (!($rootScope.opend[content.room]))) {
                    conversation.activity = conversation.activity || {mentions: 0};
                    conversation.activity.mentions = conversation.activity.mentions + 1;
                    audio.play();
                }
                conversation.last_message = content.content;
                conversation.update_at = new Date();
            }, 0);
        });

        $rootScope.$on('private.conversation.new', function (event, content) {
            console.log('private.conversation.new----');

            content.activity = $scope.selectActive(content.activity);
            loadConversations({data: [content]}, function (conversations) {
                $timeout(function () {
                    $rootScope.conversations = $rootScope.conversations.concat(conversations);
                }, 1);
            });
        });

        $scope.hold = function (item) {
            $ionicActionSheet.show({
                buttons: [
                    { text: '<b>删除会话</b>' }
                ],
                titleText: '操作列表',
                cancelText: '取消',
                cancel: function () {
                    // add cancel code..
                },
                buttonClicked: function (index) {
                    switch (index) {
                        case 0:
                            //remove server
                            $scope.$emit('data', {
                                event: 'private.conversation.delete',
                                content: {
                                    id: item._id
                                }
                            });

                            console.log(item);
                            //remove client
                            _.remove($rootScope.conversations, function (n) {
                                return n._id == item._id;
                            });
                            break;
                    }
                    return true;
                }
            });
        };
    });

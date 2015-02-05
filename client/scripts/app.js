'use strict';

/**
 * IBook module of the application.
 */
angular
    .module('ibookApp', [
        'ngAnimate',
        'ngCookies',
        'ionic',
        'ionic.contrib.frostedGlass'
    ]).config(function ($stateProvider, $urlRouterProvider) {

        $urlRouterProvider.otherwise('/tab/friends');

        $stateProvider.state('tab', {
            url: '/tab',
            abstract: true,
            templateUrl: 'views/book/tabs.html'
        });

        $stateProvider.state('tab.private', {
            url: '/private',
            views: {
                'tab-private': {
                    controller: 'PrivateCtrl',
                    templateUrl: 'views/book/tab_private.html'
                }
            }
        });

        $stateProvider.state('tab.friends', {
            url: '/friends',
            views: {
                'tab-friends': {
                    controller: 'FriendsCtrl',
                    templateUrl: 'views/book/tab_friends.html'
                }
            }
        });

        $stateProvider.state('tab.groups', {
            url: '/groups',
            views: {
                'tab-groups': {
                    controller: 'GroupsCtrl',
                    templateUrl: 'views/book/tab_groups.html'
                }
            }
        });

        $stateProvider.state('friend', {
            url: '/friend/:id',
            controller: 'FriendCtrl',
            templateUrl: 'views/book/friend.html'
        });

        $stateProvider.state('chat', {
            url: '/chat/:toUserId',
            controller: 'ChatCtrl',
            templateUrl: 'views/book/chat.html'
        });
    })
    .run(function ($rootScope, $state, $ionicPlatform, $stateParams, $ionicLoading, $ionicHistory, AuthenticationService) {

        $ionicPlatform.ready(function () {
            if (window.StatusBar) {
                StatusBar.styleDefault();
            }
        });

        $rootScope.$state = $state;
        $rootScope.$stateParams = $stateParams;

        $rootScope.goBack = function () {
            $ionicHistory.goBack();
        };

        /**
         * 校验微信登陆信息
         */
        $rootScope.$on('$stateChangeStart', function (ev, to, toParams, from, fromParams) {

            if (!AuthenticationService.isLogined()) {
                //location.href='/auth/wechat';
            }
        });

        $rootScope.$on('$stateChangeSuccess', function (ev, to, toParams, from, fromParams) {

            if ($state.current.name.indexOf('detail') !== -1) {
                $rootScope.showBackButton = true;
            } else {
                $rootScope.showBackButton = false;
            }
        });
    }).run(function ($rootScope, $http, $ionicLoading, $timeout) {

        $ionicLoading.show({
            noBackdrop: true,
            template: 'Loading...'
        });

        $rootScope.ChatReady = false;
        $rootScope.queue = [];

        //接收子页面发送的消息
        $rootScope.$on('data', function (event, message) {
            message = message || {};
            message['sent'] = +new Date();
            if (!$rootScope.ChatReady) {
                $rootScope.queue.push(message);
            } else {
                $rootScope.socket.emit('data', message);
            }
        });

        // 获取Token,用于请求聊天服务器的身份凭证
        $http.get('/api/user/token')
            .success(function (result) {
                if (result.code !== 200) {
                    $ionicLoading.show({
                        template: '获取Token失败',
                        noBackdrop: true,
                        duration: 3000
                    });
                    return;
                }

                // 设置当前聊天的用户Id
                $rootScope.currentChatUserId = result.userId;

                // 通过获取的Token连接Socket server
                var socket = io.connect(result.url);

                $ionicLoading.show({
                    template: 'Loading...',
                    noBackdrop: true
                });

                socket.on('connect_failed', function (err) {
                    $ionicLoading.show({
                        template: '连接服务器失败',
                        noBackdrop: true,
                        duration: 3000
                    });
                });

                socket.on('connect', function () {
                    $ionicLoading.hide();

                    // 设置Socket,以便于其他Controller的使用
                    $rootScope.socket = socket;
                    $rootScope.ChatReady = true;

                    //pop queue
                    var task;
                    while ((task = $rootScope.queue.pop())) {
                        if (task != null) {
                            $rootScope.socket.emit('data', task);
                        }
                    }
                });

                // 转换服务端返回的事件进行处理
                socket.on('data', function (message) {
                    console.log(message);
                    var eventName = message.event;
                    $rootScope.$broadcast(eventName, message.content);
                    $rootScope.$broadcast('*', message.content);
                });

            }).error(function () {
                $ionicLoading.show({
                    template: '网络异常',
                    noBackdrop: true,
                    duration: 3000
                });
            });
    });


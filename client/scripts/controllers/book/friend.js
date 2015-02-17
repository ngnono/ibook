'use strict';

angular.module('ibookApp')
    .controller('FriendCtrl', function ($rootScope, $http, $scope, $ionicPopup, $ionicModal, $stateParams) {

        var id = $stateParams.id;

        $http.get('/api/friends/get/' + id).success(function (result) {
            $scope.contact = result.data;

            var itemId = result.data._id;

            $http.get('/api/friends/' + itemId + '/groups').success(function (result) {
                $scope.groups = result.data;
            });
        });

        $scope.deleteContact = function (obj) {
            var confirmPopup = $ionicPopup.confirm({
                title: '您确定要删除吗？',
                template: '您确定要删除联系人:' + obj.name || obj.id
            });

            confirmPopup.then(function (res) {
                    if (res) {
                        $http.delete('api/contacts/' + obj.id)
                            .success(function (data, status, headers, config) {

                                if (status >= 200 && status < 300) {
                                    var alertPopup = $ionicPopup.alert({
                                        title: '删除成功'//,
                                        //template: '删除成功'
                                    });
                                    alertPopup.then(function (res) {
                                        //console.log('Thank you for not eating my delicious ice cream cone');
                                    });
                                } else {
                                    var alertPopup = $ionicPopup.alert({
                                        title: '错误',
                                        template: 'code:' + data.status + ',message:' + data.message
                                    });
                                    alertPopup.then(function (res) {
                                        //console.log('Thank you for not eating my delicious ice cream cone');
                                    });
                                }
                            }
                        )
                            .error(function (data, status, headers, config) {

                                var alertPopup = $ionicPopup.alert({
                                    title: '删除联系人发生异常',
                                    template: 'code:' + status + ',data:' + data
                                });
                                alertPopup.then(function (res) {
                                    //console.log('Thank you for not eating my delicious ice cream cone');
                                });
                            });


                    }
                    else {
                        // console.log('You are not sure');
                    }
                }
            )
            ;

        };

        //edit

        $ionicModal.fromTemplateUrl('views/book/friend.edit.modal.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.modal = modal;

        });


        $scope.openModal = function () {
            //back
            //判断
            $scope._contact = $scope.contact;
            $scope.isSaved = false;
            $scope.modal.show();
        };
        $scope.closeModal = function () {

            if (!$scope.isSaved) {
                //restore
                $scope.edit_contact = $scope.contact;
                $scope.contact = $scope._contact;
            }

            $scope.modal.hide();
        };
        //Cleanup the modal when we're done with it!
        $scope.$on('$destroy', function () {

            $scope.edit_contact = null;
            $scope.modal.remove();
        });
        // Execute action on hide modal
        $scope.$on('modal.hidden', function () {
            // Execute action
        });
        // Execute action on remove modal
        $scope.$on('modal.removed', function () {
            // Execute action
        });

        $scope.saveDisabled = false;

        $scope.isSaved = false;

        $scope.submit = function () {
            $scope.saveDisabled = true;
            $http.put('/api/contacts/' + id, $scope.contact)
                .success(function (data, status, headers, config) {
                    $scope.saveDisabled = false;

                    //edit 时间未更新，应由服务端返回item
                    $scope._contact = $scope.contact;

                    $scope.isSaved = true;

                    $scope.closeModal();
                })
                .error(function (data, status, headers, config) {
                    $scope.saveDisabled = false;
                    // window.alert(status);

                    var alertPopup = $ionicPopup.alert({
                        title: '发生异常:' + data.status,
                        template: data.message
                    });
                    alertPopup.then(function (res) {
                        //console.log('Thank you for not eating my delicious ice cream cone');
                    });

                });

        };


        $http.get('/api/groups?type=customer').success(function (result) {
            $scope.groups = result.data;
        }).error(function () {
            $ionicLoading.show({
                template: '网络异常',
                noBackdrop: true,
                duration: 3000
            });
        });
    });


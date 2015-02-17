/**
 * User: ngnono
 * Date: 15-2-11
 * Time: 下午3:32
 * To change this template use File | Settings | File Templates.
 */


angular.module('ibookApp')
    .controller('FriendNewCtrl', function ($rootScope, $http, $scope, $ionicModal, $ionicPopup) {

        $ionicModal.fromTemplateUrl('views/book/friend.new.modal.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.modal = modal;
        });


        $scope.openModal = function () {
            $scope.modal.show();
        };
        $scope.closeModal = function () {
            $scope.modal.hide();
        };
        //Cleanup the modal when we're done with it!
        $scope.$on('$destroy', function () {
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


        /**
         * open group modal
         */

        $ionicModal.fromTemplateUrl('views/book/groups.new.modal.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.modal4group = modal;
        });

        $scope.openModal4group = function () {
            $scope.modal4group.show();
        };
        $scope.closeModal4group = function () {
            $scope.modal4group.hide();
        };
        //Cleanup the modal when we're done with it!
        $scope.$on('$destroy', function () {
            $scope.modal4group.remove();
        });
        // Execute action on hide modal
        $scope.$on('modal4group.hidden', function () {
            // Execute action
        });
        // Execute action on remove modal
        $scope.$on('modal4group.removed', function () {
            // Execute action
        });

        var group = {};
        $scope.group = group;
        $scope.saveDisabled4group = false;
        $scope.submit4group = function () {
            $scope.saveDisabled4group = true;

            $http.post('/api/groups', $scope.group)
                .success(function (data, status, headers, config) {
                    $scope.saveDisabled4group = false;
                    // windows.alert(data.data);

                    $scope.groups.push(data.data);
                    //close
                    $scope.closeModal4group();
                })
                .error(function (data, status, headers, config) {
                    $scope.saveDisabled4group = false;

                    var alertPopup = $ionicPopup.alert({
                        title: '异常',
                        template: 'error code:' + data.status + ', message:' + data.message
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


        //var id = $stateParams.id;
        var contact = {};

        $scope.contact = contact;
        $scope.saveDisabled = false;
        $scope.submit = function () {
            $scope.saveDisabled = true;

            //$scope.contactGroups

            $http.post('/api/friends', $scope.contact)
                .success(function (data, status, headers, config) {
                    $scope.saveDisabled = false;

                    // $scope.groups.push(data.data);
                    //close
                    $scope.closeModal();
                })
                .error(function (data, status, headers, config) {
                    $scope.saveDisabled = false;

                    var alertPopup = $ionicPopup.alert({
                        title: '异常',
                        template: 'error code:' + data.status + ', message:' + data.message
                    });
                    alertPopup.then(function (res) {
                        //console.log('Thank you for not eating my delicious ice cream cone');
                    });
                });

        };
    });
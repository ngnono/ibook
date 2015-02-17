/**
 * User: ngnono
 * Date: 15-2-15
 * Time: 上午11:13
 * To change this template use File | Settings | File Templates.
 */



angular.module('ibookApp')
    .controller('GroupsNewCtrl', function ($rootScope, $http, $scope, $ionicModal, $ionicPopup, $ionicActionSheet, $stateParams, $timeout) {

        $ionicModal.fromTemplateUrl('views/book/group.new.modal.html', {
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

        //var id = $stateParams.id;
        var group = {};
        $scope.group = group;
        $scope.saveDisabled = false;

        $scope.submit = function () {
            $scope.saveDisabled = true;
            $http.post('/api/groups', $scope.group)
                .success(function (data, status, headers, config) {

                    $scope.saveDisabled = false;

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
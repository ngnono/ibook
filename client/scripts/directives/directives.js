angular.module('ibookApp').
    directive('timeago', function () {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                attrs.$observe("timeago", function () {
                    element.text(moment(attrs.timeago).fromNow());
                });
            }
        };
    }).filter('timeago', function () {
        return function (date) {
            return moment(date).fromNow();
        };
    });
;
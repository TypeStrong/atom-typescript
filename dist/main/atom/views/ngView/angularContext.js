function getContext($injector, $scope) {
    return {
        $injector: $injector,
        $timeout: $injector.get('$timeout'),
        $interval: $injector.get('$interval'),
        $scope: $scope
    };
}
exports.getContext = getContext;

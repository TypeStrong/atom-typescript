/**
 * Convinience to get common angular stuff
 */
export interface NgContext {
    $injector: ng.auto.IInjectorService,
    $timeout: ng.ITimeoutService,
    $interval: ng.IIntervalService
    $scope: ng.IScope
}
export function getContext($injector: ng.auto.IInjectorService, $scope: ng.IScope): NgContext {
    return {
        $injector,
        $timeout: $injector.get('$timeout'),
        $interval: $injector.get('$interval'),
        $scope: $scope
    }
}
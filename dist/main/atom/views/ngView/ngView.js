var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var atomUtils_1 = require("../../atomUtils");
var sp = require("atom-space-pen-views");
document.body.setAttribute('data-ng-csp', 'true');
var angular = require('angular');
var angularContext_1 = require("./angularContext");
exports.NGViewDemoHtml = "\n<div>This is a test {{vm.foo}}</div>\n<input ng-model=\"vm.foo\"/>\n";
var NGViewDemoClass = (function () {
    function NGViewDemoClass(ngContext) {
        this.foo = 0;
        ngContext.$interval(function () {
            console.log('called');
        }, 10);
    }
    return NGViewDemoClass;
})();
exports.NGViewDemoClass = NGViewDemoClass;
var NgView = (function (_super) {
    __extends(NgView, _super);
    function NgView(config) {
        var _this = this;
        _super.call(this);
        this.config = config;
        this.getURI = function () { return atomUtils_1.uriForPath(_this.config.protocol, _this.config.filePath); };
        this.getTitle = function () { return _this.config.title; };
        this.getIconName = function () { return _this.config.icon; };
        var name = config.controller.name;
        this.mainContent[0].innerHTML = "<div class=\"native-key-bindings\" ng-controller=\"" + name + "\">" + config.html + "</div>";
        var app = angular.module('app', [])
            .controller(config.controller.name, function ($scope, $injector) {
            return $scope.vm = new config.controller(angularContext_1.getContext($injector, $scope));
        });
        angular.bootstrap(this.$[0], ['app']);
    }
    NgView.content = function () {
        var _this = this;
        return this.div({ class: 'atomts-angular-view' }, function () {
            _this.div({ outlet: 'mainContent' });
        });
    };
    Object.defineProperty(NgView.prototype, "$", {
        get: function () { return this; },
        enumerable: true,
        configurable: true
    });
    NgView.protocol = 'ngview:';
    return NgView;
})(sp.ScrollView);
exports.NgView = NgView;

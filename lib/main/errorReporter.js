'use strict';
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var ServiceConsumer = require('./serviceConsumer');
var immediate = require('../commons/immediate');

var TypeScriptErrorReporter = (function (_super) {
    __extends(TypeScriptErrorReporter, _super);
    function TypeScriptErrorReporter() {
        _super.apply(this, arguments);
        this.name = 'TypeScript';
    }
    TypeScriptErrorReporter.prototype.scanFileAsync = function (content, path) {
        var _this = this;
        return $.Deferred(function (deferred) {
            immediate.setImmediate(function () {
                _this.getService().then(function (service) {
                    service.getErrorsForFile(path).then(function (result) {
                        deferred.resolve(result);
                    }, function () {
                        deferred.resolve({
                            errors: [],
                            aborted: false
                        });
                    });
                });
            });
        }).promise();
    };
    return TypeScriptErrorReporter;
})(ServiceConsumer);

module.exports = TypeScriptErrorReporter;

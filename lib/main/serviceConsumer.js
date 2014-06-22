'use strict';
var Promise = require('bluebird');

var ServiceConsumer = (function () {
    function ServiceConsumer() {
        this.reset();
    }
    ServiceConsumer.prototype.setService = function (service) {
        this.serviceResolver(service);
    };

    ServiceConsumer.prototype.getService = function () {
        return this.promise;
    };

    ServiceConsumer.prototype.reset = function () {
        var _this = this;
        this.promise = new Promise(function (resolve) {
            return _this.serviceResolver = resolve;
        });
    };
    return ServiceConsumer;
})();

module.exports = ServiceConsumer;

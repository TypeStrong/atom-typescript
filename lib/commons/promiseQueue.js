'use strict';
var Promise = require('bluebird');

var PromiseQueue = (function () {
    function PromiseQueue() {
        var _this = this;
        this.initialized = false;
        this.promise = new Promise(function (resolve) {
            _this.initializer = resolve;
        });
    }
    PromiseQueue.prototype.init = function (val) {
        if (this.initialized) {
            this.promise = Promise.cast(val);
        } else {
            this.initialized = true;
            this.initializer(val);
            return this.promise;
        }
    };

    PromiseQueue.prototype.then = function (action) {
        return this.promise = this.promise.then(function () {
            return action();
        }, function () {
            return action();
        });
    };
    return PromiseQueue;
})();

module.exports = PromiseQueue;

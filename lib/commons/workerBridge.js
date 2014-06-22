'use strict';
var utils = require('./utils');
var collections = require('./collections');
var signal = require('./signal');
var Promise = require('bluebird');

var Operation;
(function (Operation) {
    Operation[Operation["REQUEST"] = 0] = "REQUEST";
    Operation[Operation["RESPONSE"] = 1] = "RESPONSE";
    Operation[Operation["ERROR"] = 2] = "ERROR";
    Operation[Operation["EXPOSE"] = 3] = "EXPOSE";
    Operation[Operation["SIGNAL"] = 4] = "SIGNAL";
})(Operation || (Operation = {}));

var Type;
(function (Type) {
    Type[Type["FUNCTION"] = 0] = "FUNCTION";
    Type[Type["SIGNAL"] = 1] = "SIGNAL";
})(Type || (Type = {}));

function createProxyDescriptor(services, signals, baseKeys) {
    if (typeof baseKeys === "undefined") { baseKeys = []; }
    if (baseKeys.length > 5) {
        return {};
    }
    return utils.getEnumerablePropertyNames(services).reduce(function (descriptor, key) {
        var value = services[key], keys = baseKeys.concat(key);
        if (typeof value === 'function') {
            descriptor[key] = 0 /* FUNCTION */;
        } else if (typeof value === 'object') {
            if (value instanceof signal.Signal) {
                descriptor[key] = 1 /* SIGNAL */;
                signals[keys.join('.')] = value;
            } else if (!Array.isArray(value)) {
                descriptor[key] = createProxyDescriptor(value, signals, keys);
            }
        }
        return descriptor;
    }, {});
}

var uidHelper = 0;

function newQuery(chain, sendMessage, resolverMap) {
    return function () {
        var args = [];
        for (var _i = 0; _i < (arguments.length - 0); _i++) {
            args[_i] = arguments[_i + 0];
        }
        var uid = 'operation' + (uidHelper++);
        sendMessage({
            operation: 0 /* REQUEST */,
            chain: chain,
            args: args,
            uid: uid
        });
        return new Promise(function (resolve, reject) {
            resolverMap.set(uid, {
                resolve: resolve,
                reject: reject
            });
        });
    };
}

function createProxy(descriptor, sendMessage, resolverMap, baseKeys) {
    if (typeof baseKeys === "undefined") { baseKeys = []; }
    return Object.keys(descriptor).reduce(function (proxy, key) {
        var value = descriptor[key], keys = baseKeys.concat(key);
        if (value === 0 /* FUNCTION */) {
            proxy[key] = newQuery(keys, sendMessage, resolverMap);
        } else if (value === 1 /* SIGNAL */) {
            proxy[key] = new signal.Signal();
        } else if (typeof value === 'object') {
            proxy[key] = createProxy(descriptor[key], sendMessage, resolverMap, keys);
        }
        return proxy;
    }, {});
}

var WorkerBridge = (function () {
    function WorkerBridge(target) {
        var _this = this;
        this.target = target;
        this.resolverMap = new collections.StringMap();
        this.messageHandler = function (message) {
            var data = message.data;
            switch (data.operation) {
                case 3 /* EXPOSE */:
                    _this.proxy = createProxy(data.descriptor, function (args) {
                        return _this.target.postMessage(args);
                    }, _this.resolverMap);

                    _this.initResolver.resolve(_this.proxy);
                    break;

                case 0 /* REQUEST */:
                    new Promise(function (resolve) {
                        var chain = data.chain.slice(), thisObject = null, method = _this.services;
                        while (chain.length) {
                            thisObject = method;
                            method = method[chain.shift()];
                        }
                        resolve(method.apply(thisObject, data.args));
                    }).then(function (result) {
                        _this.target.postMessage({
                            operation: 1 /* RESPONSE */,
                            chain: data.chain,
                            result: result,
                            uid: data.uid
                        });
                    }, function (error) {
                        _this.target.postMessage({
                            operation: 2 /* ERROR */,
                            chain: data.chain,
                            errorMessage: error instanceof Error ? error.message : error,
                            uid: data.uid
                        });
                    });

                    break;

                case 1 /* RESPONSE */:
                    var responseDeferred = _this.resolverMap.get(data.uid);
                    responseDeferred.resolve(data.result);
                    _this.resolverMap.delete(data.uid);
                    break;

                case 2 /* ERROR */:
                    var errorDeferred = _this.resolverMap.get(data.uid);
                    errorDeferred.reject(new Error(data.errorMessage));
                    _this.resolverMap.delete(data.uid);
                    break;

                default:
                    var chain = data.chain.slice(), signal = _this.proxy;
                    while (chain.length) {
                        signal = signal[chain.shift()];
                    }
                    signal.dispatch(data.value);
            }
        };
    }
    WorkerBridge.prototype.init = function (services) {
        var _this = this;
        this.services = services;
        return new Promise(function (resolve, reject) {
            var target = _this.target;
            target.onmessage = _this.messageHandler;

            var signals = {};
            target.postMessage({
                operation: 3 /* EXPOSE */,
                descriptor: createProxyDescriptor(services, signals)
            });

            _this.signals = Object.keys(signals).map(function (key) {
                var signal = signals[key];
                var handler = function (value) {
                    target.postMessage({
                        operation: 4 /* SIGNAL */,
                        chain: key.split('.'),
                        value: value
                    });
                };
                signal.add(handler);
                return {
                    signal: signal,
                    handler: handler
                };
            });

            _this.initResolver = { resolve: resolve, reject: reject };
        });
    };

    WorkerBridge.prototype.dispose = function () {
        this.signals.forEach(function (signalDesc) {
            return signalDesc.signal.remove(signalDesc.handler);
        });
        this.target.onmessage = null;
    };
    return WorkerBridge;
})();

module.exports = WorkerBridge;

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var childprocess = require('child_process');
var exec = childprocess.exec;
var spawn = childprocess.spawn;
var path = require('path');
function createId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
var orphanExitCode = 100;
var RequesterResponder = (function () {
    function RequesterResponder() {
        var _this = this;
        this.getProcess = function () { throw new Error('getProcess is abstract'); return null; };
        this.currentListeners = {};
        this.currentLastOfType = {};
        this.pendingRequests = [];
        this.pendingRequestsChanged = function (pending) { return null; };
        this.sendToIpcHeart = function (data, message) {
            if (!_this.getProcess()) {
                console.log('PARENT ERR: no child when you tried to send :', message);
                return Promise.reject(new Error("No worker active to recieve message: " + message));
            }
            if (!_this.currentListeners[message])
                _this.currentListeners[message] = {};
            var id = createId();
            var defer = Promise.defer();
            _this.currentListeners[message][id] = defer;
            _this.pendingRequests.push(message);
            _this.pendingRequestsChanged(_this.pendingRequests);
            _this.getProcess().send({ message: message, id: id, data: data, request: true });
            return defer.promise;
        };
        this.responders = {};
        this.processRequest = function (m) {
            var parsed = m;
            if (!parsed.message || !_this.responders[parsed.message]) {
                return;
            }
            var message = parsed.message;
            var responsePromise;
            try {
                responsePromise = _this.responders[message](parsed.data);
            }
            catch (err) {
                responsePromise = Promise.reject({ method: message, message: err.message, stack: err.stack, details: err.details || {} });
            }
            responsePromise
                .then(function (response) {
                _this.getProcess().send({
                    message: message,
                    id: parsed.id,
                    data: response,
                    error: null,
                    request: false
                });
            })
                .catch(function (error) {
                _this.getProcess().send({
                    message: message,
                    id: parsed.id,
                    data: null,
                    error: error,
                    request: false
                });
            });
        };
    }
    RequesterResponder.prototype.processResponse = function (m) {
        var parsed = m;
        this.pendingRequests.shift();
        this.pendingRequestsChanged(this.pendingRequests);
        if (!parsed.message || !parsed.id) {
            console.log('PARENT ERR: Invalid JSON data from child:', m);
        }
        else if (!this.currentListeners[parsed.message] || !this.currentListeners[parsed.message][parsed.id]) {
            console.log('PARENT ERR: No one was listening:', parsed.message, parsed.data);
        }
        else {
            if (parsed.error) {
                this.currentListeners[parsed.message][parsed.id].reject(parsed.error);
                console.log(parsed.error);
                console.log(parsed.error.stack);
            }
            else {
                this.currentListeners[parsed.message][parsed.id].resolve(parsed.data);
            }
            delete this.currentListeners[parsed.message][parsed.id];
            if (this.currentLastOfType[parsed.message]) {
                var last = this.currentLastOfType[parsed.message];
                delete this.currentLastOfType[parsed.message];
                var lastPromise = this.sendToIpcHeart(last.data, parsed.message);
                lastPromise.then(function (res) { return last.defer.resolve(res); }, function (rej) { return last.defer.reject(rej); });
            }
        }
    };
    RequesterResponder.prototype.sendToIpc = function (func) {
        var _this = this;
        var message = func.name;
        return function (data) { return _this.sendToIpcHeart(data, message); };
    };
    RequesterResponder.prototype.sendToIpcOnlyLast = function (func, defaultResponse) {
        var _this = this;
        return function (data) {
            var message = func.name;
            if (!_this.getProcess()) {
                console.log('PARENT ERR: no child when you tried to send :', message);
                return Promise.reject(new Error("No worker active to recieve message: " + message));
            }
            if (!Object.keys(_this.currentListeners[message] || {}).length) {
                return _this.sendToIpcHeart(data, message);
            }
            else {
                if (_this.currentLastOfType[message]) {
                    _this.currentLastOfType[message].defer.resolve(defaultResponse);
                }
                var defer = Promise.defer();
                _this.currentLastOfType[message] = {
                    data: data,
                    defer: defer
                };
                return defer.promise;
            }
        };
    };
    RequesterResponder.prototype.addToResponders = function (func) {
        this.responders[func.name] = func;
    };
    RequesterResponder.prototype.registerAllFunctionsExportedFromAsResponders = function (aModule) {
        var _this = this;
        Object.keys(aModule)
            .filter(function (funcName) { return typeof aModule[funcName] == 'function'; })
            .forEach(function (funcName) { return _this.addToResponders(aModule[funcName]); });
    };
    return RequesterResponder;
})();
var Parent = (function (_super) {
    __extends(Parent, _super);
    function Parent() {
        var _this = this;
        _super.apply(this, arguments);
        this.node = process.execPath;
        this.gotENOENTonSpawnNode = false;
        this.getProcess = function () { return _this.child; };
        this.stopped = false;
    }
    Parent.prototype.startWorker = function (childJsPath, terminalError, customArguments) {
        var _this = this;
        try {
            this.child = spawn(this.node, [
                childJsPath
            ].concat(customArguments), { cwd: path.dirname(childJsPath), env: { ATOM_SHELL_INTERNAL_RUN_AS_NODE: '1' }, stdio: ['ipc'] });
            this.child.on('error', function (err) {
                if (err.code === "ENOENT" && err.path === _this.node) {
                    _this.gotENOENTonSpawnNode = true;
                }
                console.log('CHILD ERR ONERROR:', err.message, err.stack, err);
                _this.child = null;
            });
            this.child.on('message', function (message) {
                if (message.request) {
                    _this.processRequest(message);
                }
                else {
                    _this.processResponse(message);
                }
            });
            this.child.stderr.on('data', function (err) {
                console.log("CHILD ERR STDERR:", err.toString());
            });
            this.child.on('close', function (code) {
                if (_this.stopped) {
                    return;
                }
                if (code === orphanExitCode) {
                    _this.startWorker(childJsPath, terminalError, customArguments);
                }
                else if (_this.gotENOENTonSpawnNode) {
                    terminalError(new Error('gotENOENTonSpawnNode'));
                }
                else {
                    console.log("ts worker restarting. Don't know why it stopped with code:", code);
                    _this.startWorker(childJsPath, terminalError, customArguments);
                }
            });
        }
        catch (err) {
            terminalError(err);
        }
    };
    Parent.prototype.stopWorker = function () {
        this.stopped = true;
        if (!this.child)
            return;
        try {
            this.child.kill('SIGTERM');
        }
        catch (ex) {
            console.error('failed to kill worker child');
        }
        this.child = null;
    };
    return Parent;
})(RequesterResponder);
exports.Parent = Parent;
var Child = (function (_super) {
    __extends(Child, _super);
    function Child() {
        var _this = this;
        _super.call(this);
        this.getProcess = function () { return process; };
        this.keepAlive();
        process.on('message', function (message) {
            if (message.request) {
                _this.processRequest(message);
            }
            else {
                _this.processResponse(message);
            }
        });
    }
    Child.prototype.keepAlive = function () {
        setInterval(function () {
            if (!process.connected) {
                process.exit(orphanExitCode);
            }
        }, 1000);
    };
    return Child;
})(RequesterResponder);
exports.Child = Child;

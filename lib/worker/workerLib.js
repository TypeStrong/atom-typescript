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
var Parent = (function () {
    function Parent() {
        this.currentListeners = {};
        this.node = process.execPath;
        this.gotENOENTonSpawnNode = false;
    }
    Parent.prototype.childQuery = function (func) {
        var _this = this;
        return function (data) {
            var message = func.name;
            if (!_this.child) {
                console.log('PARENT ERR: no child when you tried to send :', message);
                return Promise.reject(new Error("No worker active to recieve message: " + message));
            }
            if (!_this.currentListeners[message])
                _this.currentListeners[message] = {};
            var id = createId();
            var defer = Promise.defer();
            _this.currentListeners[message][id] = defer;
            _this.child.send({ message: message, id: id, data: data });
            return defer.promise;
        };
    };
    Parent.prototype.startWorker = function (childJsPath, terminalError) {
        var _this = this;
        try {
            this.child = spawn(this.node, [
                childJsPath
            ], { cwd: path.dirname(childJsPath), env: { ATOM_SHELL_INTERNAL_RUN_AS_NODE: '1' }, stdio: ['ipc'] });
            this.child.on('error', function (err) {
                if (err.code === "ENOENT" && err.path === _this.node) {
                    _this.gotENOENTonSpawnNode = true;
                }
                console.log('CHILD ERR ONERROR:', err.message, err.stack, err);
                _this.child = null;
            });
            this.child.on('message', function (resp) { return _this.processResponse(resp); });
            this.child.stderr.on('data', function (err) {
                console.log("CHILD ERR STDERR:", err.toString());
            });
            this.child.on('close', function (code) {
                console.log('ts worker exited with code:', code);
                if (code === orphanExitCode) {
                    console.log('ts worker restarting');
                    _this.startWorker(childJsPath, terminalError);
                }
                else if (_this.gotENOENTonSpawnNode) {
                    terminalError(new Error('gotENOENTonSpawnNode'));
                }
                else {
                    console.log('ts worker restarting');
                    _this.startWorker(childJsPath, terminalError);
                }
            });
        }
        catch (err) {
            terminalError(err);
        }
    };
    Parent.prototype.stopWorker = function () {
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
    Parent.prototype.processResponse = function (m) {
        var parsed = m;
        if (!parsed.message || !parsed.id) {
            console.log('PARENT ERR: Invalid JSON data from child:', m);
        }
        else if (!this.currentListeners[parsed.message] || !this.currentListeners[parsed.message][parsed.id]) {
            console.log('PARENT ERR: No one was listening:', parsed.message, parsed.data);
        }
        else {
            if (parsed.error) {
                this.currentListeners[parsed.message][parsed.id].reject(parsed.error);
            }
            else {
                this.currentListeners[parsed.message][parsed.id].resolve(parsed.data);
            }
            delete this.currentListeners[parsed.message][parsed.id];
        }
    };
    return Parent;
})();
exports.Parent = Parent;
var Child = (function () {
    function Child() {
        var _this = this;
        this.responders = {};
        this.keepAlive();
        process.on('message', function (data) {
            _this.processData(data);
        });
    }
    Child.prototype.keepAlive = function () {
        setInterval(function () {
            if (!process.connected) {
                process.exit(orphanExitCode);
            }
        }, 1000);
    };
    Child.prototype.processData = function (m) {
        var parsed = m;
        if (!parsed.message || !this.responders[parsed.message]) {
            return;
        }
        var message = parsed.message;
        try {
            var response = this.responders[message](parsed.data);
        }
        catch (err) {
            var error = { method: message, message: err.message, stack: err.stack, details: err.details || {} };
        }
        process.send({
            message: message,
            id: parsed.id,
            data: response,
            error: error
        });
    };
    Child.prototype.addToResponders = function (func) {
        this.responders[func.name] = func;
    };
    Child.prototype.registerAllFunctionsExportedFrom = function (aModule) {
        var _this = this;
        Object.keys(aModule).filter(function (funcName) { return typeof aModule[funcName] == 'function'; }).forEach(function (funcName) { return _this.addToResponders(aModule[funcName]); });
    };
    return Child;
})();
exports.Child = Child;

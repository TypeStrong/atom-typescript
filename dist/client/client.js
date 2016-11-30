"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var child_process_1 = require("child_process");
var stream_1 = require("stream");
var byline = require("byline");
var TypescriptServiceClient = (function () {
    function TypescriptServiceClient(tsServerPath) {
        var _this = this;
        this.callbacks = {};
        this.listeners = {};
        this.seq = 0;
        this.onMessage = function (res) {
            if (isResponse(res)) {
                var callback = _this.callbacks[res.request_seq];
                if (callback) {
                    console.log("received response for", res.command, "in", Date.now() - callback.started, "ms", "with data", res.body);
                    delete _this.callbacks[res.request_seq];
                    if (res.success) {
                        callback.resolve(res);
                    }
                    else {
                        callback.reject(new Error(res.message));
                    }
                    _this.emitPendingRequests();
                }
            }
            else if (isEvent(res)) {
                console.log("received event", res);
                _this.emit(res.event, res.body);
            }
        };
        this.tsServerPath = tsServerPath;
    }
    TypescriptServiceClient.prototype.executeChange = function (args) {
        this.execute("change", args);
    };
    TypescriptServiceClient.prototype.executeClose = function (args) {
        this.execute("close", args);
    };
    TypescriptServiceClient.prototype.executeCompletions = function (args) {
        return this.execute("completions", args);
    };
    TypescriptServiceClient.prototype.executeGetErr = function (args) {
        this.execute("geterr", args);
    };
    TypescriptServiceClient.prototype.executeOpen = function (args) {
        this.execute("open", args);
    };
    TypescriptServiceClient.prototype.executeProjectInfo = function (args) {
        return this.execute("projectInfo", args);
    };
    TypescriptServiceClient.prototype.executeQuickInfo = function (args) {
        return this.execute("quickinfo", args);
    };
    TypescriptServiceClient.prototype.execute = function (command, args) {
        var _this = this;
        return this.serverPromise.then(function (cp) {
            var expectResponse = !!TypescriptServiceClient.commandWithResponse[command];
            return _this.sendRequest(cp, command, args, expectResponse);
        }).catch(function (err) {
            console.log("command", command, "failed due to", err);
            throw err;
        });
    };
    TypescriptServiceClient.prototype.on = function (name, listener) {
        var _this = this;
        if (this.listeners[name] === undefined) {
            this.listeners[name] = [];
        }
        this.listeners[name].push(listener);
        return function () {
            var idx = _this.listeners[name].indexOf(listener);
            _this.listeners[name].splice(idx, 1);
        };
    };
    TypescriptServiceClient.prototype.emit = function (name, data) {
        var listeners = this.listeners[name];
        if (listeners) {
            for (var _i = 0, listeners_1 = listeners; _i < listeners_1.length; _i++) {
                var listener = listeners_1[_i];
                listener(data);
            }
        }
    };
    TypescriptServiceClient.prototype.emitPendingRequests = function () {
        var pending = [];
        for (var callback in this.callbacks) {
            pending.push(this.callbacks[callback].name);
        }
        this.emit("pendingRequestsChange", pending);
    };
    TypescriptServiceClient.prototype.sendRequest = function (cp, command, args, expectResponse) {
        var _this = this;
        var req = {
            seq: this.seq++,
            command: command,
            arguments: args
        };
        console.log("sending request", command, "with args", args);
        var resultPromise = undefined;
        if (expectResponse) {
            resultPromise = new Promise(function (resolve, reject) {
                _this.callbacks[req.seq] = { name: command, resolve: resolve, reject: reject, started: Date.now() };
            });
            this.emitPendingRequests();
        }
        cp.stdin.write(JSON.stringify(req) + "\n");
        return resultPromise;
    };
    TypescriptServiceClient.prototype.startServer = function () {
        var _this = this;
        if (!this.serverPromise) {
            this.serverPromise = new Promise(function (resolve, reject) {
                console.log("starting", _this.tsServerPath);
                var cp = child_process_1.spawn(_this.tsServerPath, []);
                cp.once("error", function (err) {
                    console.log("tsserver starting failed with", err);
                    reject(err);
                });
                cp.once("exit", function (code) {
                    console.log("tsserver failed to start with code", code);
                    reject({ code: code });
                });
                messageStream(cp.stdout).on("data", _this.onMessage);
                _this.sendRequest(cp, "ping", null, true).then(function (res) { return resolve(cp); }, function (err) { return resolve(cp); });
            });
            return this.serverPromise.catch(function (error) {
                _this.serverPromise = null;
                throw error;
            });
        }
        else {
            throw new Error("Server already started: " + this.tsServerPath);
        }
    };
    return TypescriptServiceClient;
}());
TypescriptServiceClient.commandWithResponse = {
    completions: true,
    projectInfo: true,
    quickinfo: true
};
exports.TypescriptServiceClient = TypescriptServiceClient;
function isEvent(res) {
    return res.type === "event";
}
function isResponse(res) {
    return res.type === "response";
}
function messageStream(input) {
    return input.pipe(byline()).pipe(new MessageStream());
}
var MessageStream = (function (_super) {
    __extends(MessageStream, _super);
    function MessageStream() {
        var _this = _super.call(this, { objectMode: true }) || this;
        _this.lineCount = 1;
        return _this;
    }
    MessageStream.prototype._transform = function (line, encoding, callback) {
        if (this.lineCount % 2 === 0) {
            this.push(JSON.parse(line));
        }
        this.lineCount += 1;
        callback(null);
    };
    return MessageStream;
}(stream_1.Transform));

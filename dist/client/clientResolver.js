"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var client_1 = require("./client");
var events = require("events");
var path = require("path");
var nodeResolve = require("resolve");
var defaultServerPath = require.resolve("typescript/bin/tsserver");
var ClientResolver = (function (_super) {
    __extends(ClientResolver, _super);
    function ClientResolver() {
        var _this = _super.apply(this, arguments) || this;
        _this.clients = {};
        return _this;
    }
    ClientResolver.prototype.get = function (filePath) {
        var _this = this;
        return resolveServer(filePath)
            .catch(function () { return defaultServerPath; })
            .then(function (serverPath) {
            if (_this.clients[serverPath]) {
                return _this.clients[serverPath].client;
            }
            var entry = _this.clients[serverPath] = {
                client: new client_1.TypescriptServiceClient(serverPath),
                pending: [],
            };
            entry.client.startServer();
            entry.client.on("pendingRequestsChange", function (pending) {
                entry.pending = pending;
                _this.emit("pendingRequestsChange");
            });
            return entry.client;
        });
    };
    return ClientResolver;
}(events.EventEmitter));
exports.ClientResolver = ClientResolver;
function resolveServer(sourcePath) {
    var basedir = path.dirname(sourcePath);
    return new Promise(function (resolve, reject) {
        nodeResolve("typescript/bin/tsserver", { basedir: basedir }, function (err, resolvedPath) {
            if (err) {
                reject(err);
            }
            else {
                resolve(resolvedPath);
            }
        });
    });
}
exports.resolveServer = resolveServer;

"use strict";
var findServer_1 = require("./findServer");
var client_1 = require("./client");
var path = require("path");
var nodeResolve = require("resolve");
var defaultServerPath = require.resolve("typescript/bin/tsserver");
var defaultServerVersion = require("typescript/package.json").version;
var defaultServer = new client_1.TypescriptServiceClient(defaultServerPath, defaultServerVersion);
var ClientResolver = (function () {
    function ClientResolver() {
        this.clients = [];
    }
    ClientResolver.prototype.get = function (filePath) {
        var client = this.clients.find(function (client) { return filePath.startsWith(client.prefix); });
        if (client) {
            return Promise.resolve(client.client);
        }
        return this.resolveFrom(filePath);
    };
    ClientResolver.prototype.addClient = function (prefix, client) {
        var existingClient = this.clients.find(function (client) { return client.prefix === prefix; });
        if (existingClient) {
            return;
        }
        this.clients.push({
            prefix: prefix,
            client: client
        });
        if (!client.serverPromise) {
            client.startServer();
        }
        this.clients.sort(function (a, b) { return a.prefix.length - b.prefix.length; });
    };
    ClientResolver.prototype.resolveFrom = function (filePath) {
        var _this = this;
        var basedir = path.dirname(filePath);
        return resolveLocalServer(basedir)
            .then(function (tsServerPath) { return path.resolve(tsServerPath, "..", "..", "..", ".."); })
            .then(findServer_1.findTypescriptServers)
            .then(function (servers) {
            console.log("got some servers", servers);
            for (var _i = 0, servers_1 = servers; _i < servers_1.length; _i++) {
                var server = servers_1[_i];
                _this.addClient(server.prefix, new client_1.TypescriptServiceClient(server.binPath, server.version));
            }
            return _this.get(filePath);
        }).catch(function () {
            _this.addClient(basedir, defaultServer);
            return defaultServer;
        });
    };
    return ClientResolver;
}());
exports.ClientResolver = ClientResolver;
function resolveLocalServer(basedir) {
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

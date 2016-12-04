"use strict";
const tslib_1 = require("tslib");
const client_1 = require("./client");
const events = require("events");
const path = require("path");
const nodeResolve = require("resolve");
const defaultServerPath = require.resolve("typescript/bin/tsserver");
class ClientResolver extends events.EventEmitter {
    constructor() {
        super(...arguments);
        this.clients = {};
    }
    on(event, callback) {
        return super.on(event, callback);
    }
    get(filePath) {
        return resolveServer(filePath)
            .catch(() => defaultServerPath)
            .then(serverPath => {
            if (this.clients[serverPath]) {
                return this.clients[serverPath].client;
            }
            const entry = this.clients[serverPath] = {
                client: new client_1.TypescriptServiceClient(serverPath),
                pending: [],
            };
            entry.client.startServer();
            entry.client.on("pendingRequestsChange", pending => {
                entry.pending = pending;
                this.emit("pendingRequestsChange");
            });
            const diagnosticHandler = (type, result) => {
                this.emit("diagnostics", {
                    type,
                    serverPath,
                    filePath: isConfDiagBody(result) ? result.configFile : result.file,
                    diagnostics: result.diagnostics
                });
            };
            entry.client.on("configFileDiag", diagnosticHandler.bind(this, "configFileDiag"));
            entry.client.on("semanticDiag", diagnosticHandler.bind(this, "semanticDiag"));
            entry.client.on("syntaxDiag", diagnosticHandler.bind(this, "syntaxDiag"));
            return entry.client;
        });
    }
}
exports.ClientResolver = ClientResolver;
function resolveServer(sourcePath) {
    const basedir = path.dirname(sourcePath);
    return new Promise((resolve, reject) => {
        nodeResolve("typescript/bin/tsserver", { basedir }, (err, resolvedPath) => {
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
function isConfDiagBody(body) {
    return body && body.triggerFile && body.configFile;
}

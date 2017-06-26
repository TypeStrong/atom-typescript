"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const client_1 = require("./client");
const events = require("events");
const path = require("path");
const resolve_1 = require("resolve");
const defaultServer = {
    serverPath: require.resolve("typescript/bin/tsserver"),
    version: require("typescript").version,
};
/**
 * ClientResolver takes care of finding the correct tsserver for a source file based on how a
 * require("typescript") from the same source file would resolve.
 */
class ClientResolver extends events.EventEmitter {
    constructor() {
        super(...arguments);
        this.clients = {};
    }
    on(event, callback) {
        return super.on(event, callback);
    }
    get(filePath) {
        return resolveServer(filePath).catch(() => defaultServer).then(({ serverPath, version }) => {
            if (this.clients[serverPath]) {
                return this.clients[serverPath].client;
            }
            const entry = this.addClient(serverPath, new client_1.TypescriptServiceClient(serverPath, version));
            entry.client.startServer();
            entry.client.on("pendingRequestsChange", pending => {
                entry.pending = pending;
                this.emit("pendingRequestsChange");
            });
            const diagnosticHandler = (type, result) => {
                const filePath = isConfDiagBody(result) ? result.configFile : result.file;
                if (filePath) {
                    this.emit("diagnostics", {
                        type,
                        serverPath,
                        filePath,
                        diagnostics: result.diagnostics,
                    });
                }
            };
            entry.client.on("configFileDiag", diagnosticHandler.bind(this, "configFileDiag"));
            entry.client.on("semanticDiag", diagnosticHandler.bind(this, "semanticDiag"));
            entry.client.on("syntaxDiag", diagnosticHandler.bind(this, "syntaxDiag"));
            return entry.client;
        });
    }
    addClient(serverPath, client) {
        this.clients[serverPath] = {
            client,
            pending: [],
            retained: 0,
        };
        return this.clients[serverPath];
    }
    retain(filePath) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const client = yield this.get(filePath);
            const clientInfo = this.clients[client.tsServerPath];
            if (!clientInfo) {
                throw new Error("Could not find server for: " + filePath);
            }
            clientInfo.retained += 1;
        });
    }
    release(filePath) {
        // Sleep a little and then decrement the retained counter. If it's 0,
        // shut the server down.
        setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const client = yield this.get(filePath);
            const clientInfo = this.clients[client.tsServerPath];
            if (!clientInfo) {
                return;
            }
            clientInfo.retained -= 1;
            if (clientInfo.retained <= 0) {
                delete this.clients[client.tsServerPath];
                client.stopServer();
                client.dispose();
            }
        }), 300);
    }
}
exports.ClientResolver = ClientResolver;
function resolveServer(sourcePath) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const resolvedPath = resolve_1.sync("typescript/bin/tsserver", {
            basedir: path.dirname(sourcePath),
            paths: process.env.NODE_PATH && [process.env.NODE_PATH],
        });
        const packagePath = path.resolve(resolvedPath, "../../package.json");
        const version = require(packagePath).version;
        return {
            version,
            serverPath: resolvedPath,
        };
    });
}
exports.resolveServer = resolveServer;
function isConfDiagBody(body) {
    return body && body.triggerFile && body.configFile;
}
//# sourceMappingURL=clientResolver.js.map
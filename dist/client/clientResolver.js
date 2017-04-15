"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("./client");
const events = require("events");
const path = require("path");
const resolve_1 = require("resolve");
const defaultServer = {
    serverPath: require.resolve("typescript/bin/tsserver"),
    version: require("typescript").version
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
        return resolveServer(filePath)
            .catch(() => defaultServer)
            .then(({ serverPath, version }) => {
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
                        diagnostics: result.diagnostics
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
        };
        return this.clients[serverPath];
    }
}
exports.ClientResolver = ClientResolver;
function resolveServer(sourcePath) {
    const basedir = path.dirname(sourcePath);
    return Promise.resolve().then(() => {
        const resolvedPath = resolve_1.sync("typescript/bin/tsserver", { basedir });
        const packagePath = path.resolve(resolvedPath, "../../package.json");
        const version = require(packagePath).version;
        return {
            version,
            serverPath: resolvedPath
        };
    });
}
exports.resolveServer = resolveServer;
function isConfDiagBody(body) {
    return body && body.triggerFile && body.configFile;
}
//# sourceMappingURL=clientResolver.js.map
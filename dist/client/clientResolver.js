"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("./client");
const events = require("events");
const path = require("path");
const Resolve = require("resolve");
/**
 * ClientResolver takes care of finding the correct tsserver for a source file based on how a
 * require("typescript") from the same source file would resolve.
 */
class ClientResolver extends events.EventEmitter {
    constructor() {
        super(...arguments);
        this.clients = new Map();
    }
    on(event, callback) {
        return super.on(event, callback);
    }
    async get(pFilePath) {
        const { pathToBin, version } = await resolveBinary(pFilePath, "tsserver");
        const clientRec = this.clients.get(pathToBin);
        if (clientRec)
            return clientRec.client;
        const newClientRec = {
            client: new client_1.TypescriptServiceClient(pathToBin, version),
            pending: [],
        };
        this.clients.set(pathToBin, newClientRec);
        newClientRec.client.startServer();
        newClientRec.client.on("pendingRequestsChange", pending => {
            newClientRec.pending = pending;
            this.emit("pendingRequestsChange");
        });
        const diagnosticHandler = (type) => (result) => {
            const filePath = isConfDiagBody(result) ? result.configFile : result.file;
            if (filePath) {
                this.emit("diagnostics", {
                    type,
                    pathToBin,
                    filePath,
                    diagnostics: result.diagnostics,
                });
            }
        };
        newClientRec.client.on("configFileDiag", diagnosticHandler("configFileDiag"));
        newClientRec.client.on("semanticDiag", diagnosticHandler("semanticDiag"));
        newClientRec.client.on("syntaxDiag", diagnosticHandler("syntaxDiag"));
        return newClientRec.client;
    }
    dispose() {
        this.removeAllListeners();
    }
}
exports.ClientResolver = ClientResolver;
// Promisify the async resolve function
const resolveModule = (id, opts) => {
    return new Promise((resolve, reject) => Resolve(id, opts, (err, result) => {
        if (err) {
            reject(err);
        }
        else {
            resolve(result);
        }
    }));
};
async function resolveBinary(sourcePath, binName) {
    const { NODE_PATH } = process.env;
    const defaultPath = require.resolve(`typescript/bin/${binName}`);
    const resolvedPath = await resolveModule(`typescript/bin/${binName}`, {
        basedir: path.dirname(sourcePath),
        paths: NODE_PATH && NODE_PATH.split(path.delimiter),
    }).catch(() => defaultPath);
    const packagePath = path.resolve(resolvedPath, "../../package.json");
    const version = require(packagePath).version;
    return {
        version,
        pathToBin: resolvedPath,
    };
}
exports.resolveBinary = resolveBinary;
function isConfDiagBody(body) {
    return body && body.triggerFile && body.configFile;
}
//# sourceMappingURL=clientResolver.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("./client");
const path = require("path");
const Resolve = require("resolve");
const fs = require("fs");
const atom_1 = require("atom");
/**
 * ClientResolver takes care of finding the correct tsserver for a source file based on how a
 * require("typescript") from the same source file would resolve.
 */
class ClientResolver {
    constructor() {
        this.clients = new Map();
        this.emitter = new atom_1.Emitter();
    }
    // This is just here so TypeScript can infer the types of the callbacks when using "on" method
    on(event, callback) {
        return this.emitter.on(event, callback);
    }
    *getAllPending() {
        for (const clientRec of this.getAllClients()) {
            yield* clientRec.pending;
        }
    }
    killAllServers() {
        for (const clientRec of this.getAllClients()) {
            clientRec.client.killServer();
        }
    }
    async get(pFilePath) {
        const { pathToBin, version } = await resolveBinary(pFilePath, "tsserver");
        const tsconfigPath = await resolveTsConfig(pFilePath);
        let tsconfigMap = this.clients.get(pathToBin);
        if (!tsconfigMap) {
            tsconfigMap = new Map();
            this.clients.set(pathToBin, tsconfigMap);
        }
        const clientRec = tsconfigMap.get(tsconfigPath);
        if (clientRec)
            return clientRec.client;
        const newClientRec = {
            client: new client_1.TypescriptServiceClient(pathToBin, version),
            pending: [],
        };
        tsconfigMap.set(tsconfigPath, newClientRec);
        newClientRec.client.on("pendingRequestsChange", pending => {
            newClientRec.pending = pending;
            this.emitter.emit("pendingRequestsChange", pending);
        });
        const diagnosticHandler = (type) => (result) => {
            const filePath = isConfDiagBody(result) ? result.configFile : result.file;
            if (filePath) {
                this.emitter.emit("diagnostics", {
                    type,
                    serverPath: pathToBin,
                    filePath,
                    diagnostics: result.diagnostics,
                });
            }
        };
        newClientRec.client.on("configFileDiag", diagnosticHandler("configFileDiag"));
        newClientRec.client.on("semanticDiag", diagnosticHandler("semanticDiag"));
        newClientRec.client.on("syntaxDiag", diagnosticHandler("syntaxDiag"));
        newClientRec.client.on("suggestionDiag", diagnosticHandler("suggestionDiag"));
        return newClientRec.client;
    }
    dispose() {
        this.emitter.dispose();
    }
    *getAllClients() {
        for (const tsconfigMap of this.clients.values()) {
            yield* tsconfigMap.values();
        }
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
        paths: NODE_PATH !== undefined ? NODE_PATH.split(path.delimiter) : undefined,
    }).catch(() => defaultPath);
    const packagePath = path.resolve(resolvedPath, "../../package.json");
    // tslint:disable-next-line:no-unsafe-any
    const version = require(packagePath).version;
    return {
        version,
        pathToBin: resolvedPath,
    };
}
exports.resolveBinary = resolveBinary;
async function fsexists(filePath) {
    return new Promise(resolve => {
        fs.exists(filePath, resolve);
    });
}
async function resolveTsConfig(sourcePath) {
    let parentDir = path.dirname(sourcePath);
    let tsconfigPath = path.join(parentDir, "tsconfig.json");
    while (!(await fsexists(tsconfigPath))) {
        const oldParentDir = parentDir;
        parentDir = path.dirname(parentDir);
        if (oldParentDir === parentDir)
            return undefined;
        tsconfigPath = path.join(parentDir, "tsconfig.json");
    }
    return tsconfigPath;
}
function isConfDiagBody(body) {
    // tslint:disable-next-line:no-unsafe-any
    return body && body.triggerFile && body.configFile;
}
//# sourceMappingURL=clientResolver.js.map
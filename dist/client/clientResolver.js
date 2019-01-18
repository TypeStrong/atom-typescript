"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom");
const path = require("path");
const Resolve = require("resolve");
const ts = require("typescript");
const client_1 = require("./client");
/**
 * ClientResolver takes care of finding the correct tsserver for a source file based on how a
 * require("typescript") from the same source file would resolve.
 */
class ClientResolver {
    constructor(reportBusyWhile) {
        this.reportBusyWhile = reportBusyWhile;
        this.clients = new Map();
        this.emitter = new atom_1.Emitter();
        this.subscriptions = new atom_1.CompositeDisposable();
        this.tsserverInstancePerTsconfig = atom.config.get("atom-typescript")
            .tsserverInstancePerTsconfig;
        // This is just here so TypeScript can infer the types of the callbacks when using "on" method
        // tslint:disable-next-line:member-ordering
        this.on = this.emitter.on.bind(this.emitter);
        this.diagnosticHandler = (serverPath, type) => (result) => {
            const filePath = isConfDiagBody(result) ? result.configFile : result.file;
            if (filePath) {
                this.emitter.emit("diagnostics", {
                    type,
                    serverPath,
                    filePath,
                    diagnostics: result.diagnostics,
                });
            }
        };
    }
    async restartAllServers() {
        await this.reportBusyWhile("Restarting servers", () => Promise.all(Array.from(this.getAllClients()).map(client => client.restartServer())));
    }
    async get(pFilePath) {
        const { pathToBin, version } = await resolveBinary(pFilePath, "tsserver");
        const tsconfigPath = this.tsserverInstancePerTsconfig
            ? ts.findConfigFile(pFilePath, f => ts.sys.fileExists(f))
            : undefined;
        let tsconfigMap = this.clients.get(pathToBin);
        if (!tsconfigMap) {
            tsconfigMap = new Map();
            this.clients.set(pathToBin, tsconfigMap);
        }
        const client = tsconfigMap.get(tsconfigPath);
        if (client)
            return client;
        const newClient = new client_1.TypescriptServiceClient(pathToBin, version, this.reportBusyWhile);
        tsconfigMap.set(tsconfigPath, newClient);
        this.subscriptions.add(newClient.on("configFileDiag", this.diagnosticHandler(pathToBin, "configFileDiag")), newClient.on("semanticDiag", this.diagnosticHandler(pathToBin, "semanticDiag")), newClient.on("syntaxDiag", this.diagnosticHandler(pathToBin, "syntaxDiag")), newClient.on("suggestionDiag", this.diagnosticHandler(pathToBin, "suggestionDiag")));
        return newClient;
    }
    dispose() {
        this.emitter.dispose();
        this.subscriptions.dispose();
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
function isConfDiagBody(body) {
    // tslint:disable-next-line:no-unsafe-any
    return body && body.triggerFile && body.configFile;
}
//# sourceMappingURL=clientResolver.js.map
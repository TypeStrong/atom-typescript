"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom");
const ts = require("typescript");
const client_1 = require("./client");
const resolveBinary_1 = require("./resolveBinary");
/**
 * ClientResolver takes care of finding the correct tsserver for a source file based on how a
 * require("typescript") from the same source file would resolve.
 */
class ClientResolver {
    constructor(reportBusyWhile) {
        this.reportBusyWhile = reportBusyWhile;
        this.clients = new Map();
        this.memoizedClients = new Map();
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
        const memo = this.memoizedClients.get(pFilePath);
        if (memo)
            return memo;
        const client = this._get(pFilePath);
        this.memoizedClients.set(pFilePath, client);
        try {
            return await client;
        }
        catch (e) {
            this.memoizedClients.delete(pFilePath);
            throw e;
        }
    }
    dispose() {
        this.emitter.dispose();
        this.subscriptions.dispose();
        this.memoizedClients.clear();
        this.clients.clear();
    }
    async _get(pFilePath) {
        const { pathToBin, version } = await resolveBinary_1.resolveBinary(pFilePath, "tsserver");
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
    *getAllClients() {
        for (const tsconfigMap of this.clients.values()) {
            yield* tsconfigMap.values();
        }
    }
}
exports.ClientResolver = ClientResolver;
function isConfDiagBody(body) {
    // tslint:disable-next-line:no-unsafe-any
    return body && body.triggerFile && body.configFile;
}
//# sourceMappingURL=clientResolver.js.map
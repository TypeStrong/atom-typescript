"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom");
const fs = require("fs");
const jsonc = require("jsonc-parser");
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
        const client = await this._get(pFilePath);
        this.memoizedClients.set(pFilePath, client);
        return client;
    }
    dispose() {
        this.emitter.dispose();
        this.subscriptions.dispose();
        this.memoizedClients.clear();
        this.clients.clear();
    }
    async _get(pFilePath) {
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
async function fsExists(p) {
    return new Promise(resolve => fs.exists(p, resolve));
}
async function fsReadFile(p) {
    return new Promise((resolve, reject) => fs.readFile(p, (error, data) => {
        if (error)
            reject(error);
        else
            resolve(data.toString("utf-8"));
    }));
}
async function tryConfigFile(basedir, relpath) {
    const configFile = path.join(basedir, ...relpath);
    if (await fsExists(configFile))
        return configFile;
}
async function tryConfigFiles(basedir, relpaths) {
    for (const relpath of relpaths) {
        const cf = await tryConfigFile(basedir, relpath);
        if (cf !== undefined)
            return cf;
    }
}
async function resolveConfigFile(initialBaseDir) {
    let basedir = initialBaseDir;
    let parent = path.dirname(basedir);
    while (basedir !== parent) {
        const configFile = await tryConfigFiles(basedir, [
            [".atom-typescript.json"],
            [".atom", "atom-typescript.json"],
            [".vscode", "settings.json"],
        ]);
        if (configFile !== undefined)
            return { basedir, configFile };
        basedir = parent;
        parent = path.dirname(basedir);
    }
}
function isConfigObject(x) {
    // tslint:disable-next-line: no-unsafe-any
    return typeof x === "object" && x !== null && typeof x.tsdkPath === "string";
}
function isVSCodeConfigObject(x) {
    // tslint:disable-next-line: no-unsafe-any
    return typeof x === "object" && x !== null && typeof x["typescript.tsdk"] === "string";
}
async function getSDKPath(dirname) {
    const configFile = await resolveConfigFile(dirname);
    if (configFile) {
        try {
            const configFileContents = jsonc.parse(await fsReadFile(configFile.configFile));
            let tsdkPath;
            if (isConfigObject(configFileContents)) {
                tsdkPath = configFileContents.tsdkPath;
            }
            else if (isVSCodeConfigObject(configFileContents)) {
                tsdkPath = path.dirname(configFileContents["typescript.tsdk"]);
            }
            else {
                return undefined;
            }
            return path.isAbsolute(tsdkPath) ? tsdkPath : path.join(configFile.basedir, tsdkPath);
        }
        catch (e) {
            console.warn(e);
        }
    }
}
async function resolveBinary(sourcePath, binBaseName) {
    const { NODE_PATH } = process.env;
    const binName = `${binBaseName}.js`;
    const resolvedPath = await resolveModule(`typescript/lib/${binName}`, {
        basedir: path.dirname(sourcePath),
        paths: NODE_PATH !== undefined ? NODE_PATH.split(path.delimiter) : undefined,
    }).catch(async () => {
        // try to get typescript from auxiliary config file
        const auxTsdkPath = await getSDKPath(path.dirname(sourcePath));
        if (auxTsdkPath !== undefined) {
            const binPath = path.join(auxTsdkPath, "lib", binName);
            const exists = await fsExists(binPath);
            if (exists)
                return binPath;
        }
        // try to get typescript from configured tsdkPath
        const tsdkPath = atom.config.get("atom-typescript.tsdkPath");
        if (tsdkPath) {
            const binPath = path.join(tsdkPath, "lib", binName);
            const exists = await fsExists(binPath);
            if (exists)
                return binPath;
        }
        // use bundled version
        const defaultPath = require.resolve(`typescript/lib/${binName}`);
        return defaultPath;
    });
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
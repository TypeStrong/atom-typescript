"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const jsonc = require("jsonc-parser");
const path = require("path");
const Resolve = require("resolve");
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
// Promisify the async resolve function
async function resolveModule(id, opts) {
    return new Promise((resolve, reject) => Resolve(id, opts, (err, result) => {
        if (err) {
            reject(err);
        }
        else {
            resolve(result);
        }
    }));
}
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
async function tryConfigFiles(basedir, relpaths) {
    for (const relpath of relpaths) {
        const configFile = path.join(basedir, ...relpath);
        if (await fsExists(configFile))
            return configFile;
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
                // NOTE: VSCode asks for path to "typescript/lib", while
                // we only want path to "typescript". Hence the dirname here
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
//# sourceMappingURL=resolveBinary.js.map
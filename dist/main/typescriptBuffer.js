"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Atom = require("atom");
const lodash_1 = require("lodash");
const utils_1 = require("../utils");
const utils_2 = require("./atom/utils");
class TypescriptBuffer {
    constructor(buffer, deps) {
        this.buffer = buffer;
        this.deps = deps;
        this.events = new Atom.Emitter();
        this.compileOnSave = false;
        this.subscriptions = new Atom.CompositeDisposable();
        // tslint:disable-next-line:member-ordering
        this.on = this.events.on.bind(this.events);
        this.dispose = () => {
            this.subscriptions.dispose();
            utils_1.handlePromise(this.close());
        };
        this.init = async () => {
            if (!this.state)
                return;
            await this.state.client.execute("open", {
                file: this.state.filePath,
                fileContent: this.buffer.getText(),
            });
            utils_1.handlePromise(this.getErr({ allFiles: false }));
        };
        this.close = async () => {
            await this.openPromise;
            if (this.state) {
                const client = this.state.client;
                const file = this.state.filePath;
                this.deps.clearFileErrors(file);
                this.state.subscriptions.dispose();
                this.state = undefined;
                await client.execute("close", { file });
            }
        };
        this.onDidChangePath = (newPath) => {
            utils_1.handlePromise(this.close().then(() => {
                this.openPromise = this.open(newPath);
            }));
        };
        this.onDidSave = async () => {
            await Promise.all([this.getErr({ allFiles: true }), this.doCompileOnSave()]);
        };
        this.onDidChangeText = async ({ changes }) => {
            // If there are no actual changes, or the file isn't open, we have nothing to do
            if (changes.length === 0 || !this.state)
                return;
            const { client, filePath } = this.state;
            // NOTE: this might look somewhat weird until we realize that
            // awaiting on each "change" command may lead to arbitrary
            // interleaving, while pushing them all at once guarantees
            // that all subsequent "change" commands will be sequenced after
            // the ones we pushed
            await Promise.all(changes.reduceRight((acc, { oldRange, newText }) => {
                acc.push(client.execute("change", {
                    file: filePath,
                    line: oldRange.start.row + 1,
                    offset: oldRange.start.column + 1,
                    endLine: oldRange.end.row + 1,
                    endOffset: oldRange.end.column + 1,
                    insertString: newText,
                }));
                return acc;
            }, []));
        };
        this.subscriptions.add(buffer.onDidChangePath(this.onDidChangePath), buffer.onDidDestroy(this.dispose), buffer.onDidSave(() => {
            utils_1.handlePromise(this.onDidSave());
        }), buffer.onDidStopChanging(({ changes }) => {
            utils_1.handlePromise(this.getErr({ allFiles: false }));
            if (changes.length > 0)
                this.deps.reportBuildStatus(undefined);
        }), buffer.onDidChangeText(arg => {
            // NOTE: we don't need to worry about interleaving here,
            // because onDidChangeText pushes all changes at once
            utils_1.handlePromise(this.onDidChangeText(arg));
        }));
        this.openPromise = this.open(this.buffer.getPath());
    }
    static create(buffer, deps) {
        const b = TypescriptBuffer.bufferMap.get(buffer);
        if (b)
            return b;
        else {
            const nb = new TypescriptBuffer(buffer, deps);
            TypescriptBuffer.bufferMap.set(buffer, nb);
            return nb;
        }
    }
    getPath() {
        return this.state && this.state.filePath;
    }
    getInfo() {
        if (!this.state)
            return;
        return {
            clientVersion: this.state.client.version,
            tsConfigPath: this.state.configFile && this.state.configFile.getPath(),
        };
    }
    async getErr({ allFiles }) {
        if (!this.state)
            return;
        const files = allFiles ? Array.from(utils_2.getOpenEditorsPaths()) : [this.state.filePath];
        await this.state.client.execute("geterr", {
            files,
            delay: 100,
        });
    }
    /** Throws! */
    async compile() {
        if (!this.state)
            return;
        const { client, filePath } = this.state;
        const result = await client.execute("compileOnSaveAffectedFileList", {
            file: filePath,
        });
        const fileNames = lodash_1.flatten(result.body.map(project => project.fileNames));
        if (fileNames.length === 0)
            return;
        const promises = fileNames.map(file => client.execute("compileOnSaveEmitFile", { file }));
        const saved = await Promise.all(promises);
        if (!saved.every(res => !!res.body)) {
            throw new Error("Some files failed to emit");
        }
    }
    async doCompileOnSave() {
        if (!this.compileOnSave)
            return;
        this.deps.reportBuildStatus(undefined);
        try {
            await this.compile();
            this.deps.reportBuildStatus({ success: true });
        }
        catch (error) {
            const e = error;
            console.error("Save failed with error", e);
            this.deps.reportBuildStatus({ success: false, message: e.message });
        }
    }
    async open(filePath) {
        if (filePath !== undefined && utils_2.isTypescriptFile(filePath)) {
            const client = await this.deps.getClient(filePath);
            this.state = {
                client,
                filePath,
                configFile: undefined,
                subscriptions: new Atom.CompositeDisposable(),
            };
            this.state.subscriptions.add(client.on("restarted", () => utils_1.handlePromise(this.init())));
            await this.init();
            const result = await client.execute("projectInfo", {
                needFileNameList: false,
                file: filePath,
            });
            // TODO: wrong type here, complain on TS repo
            if (result.body.configFileName !== undefined) {
                this.state.configFile = new Atom.File(result.body.configFileName);
                await this.readConfigFile();
                this.state.subscriptions.add(this.state.configFile.onDidChange(() => utils_1.handlePromise(this.readConfigFile())));
            }
            this.events.emit("opened");
        }
        else {
            return this.close();
        }
    }
    async readConfigFile() {
        if (!this.state || !this.state.configFile)
            return;
        const options = utils_2.getProjectConfig(this.state.configFile.getPath());
        this.compileOnSave = options.compileOnSave;
        await this.state.client.execute("configure", {
            file: this.state.filePath,
            formatOptions: options.formatCodeOptions,
        });
    }
}
exports.TypescriptBuffer = TypescriptBuffer;
TypescriptBuffer.bufferMap = new WeakMap();
//# sourceMappingURL=typescriptBuffer.js.map
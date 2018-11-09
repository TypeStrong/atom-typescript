"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// A class to keep all changes to the buffer in sync with tsserver. This is mainly used with
// the editor panes, but is also useful for editor-less buffer changes (renameRefactor).
const Atom = require("atom");
const lodash_1 = require("lodash");
const utils_1 = require("../utils");
const utils_2 = require("./atom/utils");
class TypescriptBuffer {
    constructor(buffer, deps) {
        this.buffer = buffer;
        this.deps = deps;
        this.events = new Atom.Emitter();
        // Timestamps for buffer events
        this.changedAt = 0;
        this.changedAtBatch = 0;
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
            await this.getErr();
        };
        this.close = async () => {
            await this.openPromise;
            if (this.state) {
                const client = this.state.client;
                const file = this.state.filePath;
                await client.execute("close", { file });
                this.deps.clearFileErrors(file);
                this.state.subscriptions.dispose();
                this.state = undefined;
            }
        };
        this.onDidChange = () => {
            this.changedAt = Date.now();
        };
        this.onDidChangePath = (newPath) => {
            utils_1.handlePromise(this.close().then(() => {
                this.openPromise = this.open(newPath);
            }));
        };
        this.onDidSave = async () => {
            // Check if there isn't a onDidStopChanging event pending.
            const { changedAt, changedAtBatch } = this;
            if (changedAtBatch > 0 && changedAt > changedAtBatch) {
                await new Promise(resolve => this.events.once("changed", resolve));
            }
            if (this.state) {
                await this.state.client.execute("geterr", {
                    files: Array.from(utils_2.getOpenEditorsPaths()),
                    delay: 100,
                });
            }
            this.events.emit("saved");
        };
        this.onDidStopChanging = async ({ changes }) => {
            // Don't update changedAt or emit any events if there are no actual changes or file isn't open
            if (changes.length === 0 || !this.state)
                return;
            this.changedAtBatch = Date.now();
            const client = this.state.client;
            for (const change of changes) {
                const { start, oldExtent, newText } = change;
                const end = {
                    endLine: start.row + oldExtent.row + 1,
                    endOffset: (oldExtent.row === 0 ? start.column + oldExtent.column : oldExtent.column) + 1,
                };
                await client.execute("change", Object.assign({}, end, { file: this.state.filePath, line: start.row + 1, offset: start.column + 1, insertString: newText }));
            }
            await this.getErr();
            this.events.emit("changed");
        };
        this.subscriptions.add(buffer.onDidChange(this.onDidChange), buffer.onDidChangePath(this.onDidChangePath), buffer.onDidDestroy(this.dispose), buffer.onDidSave(() => utils_1.handlePromise(this.onDidSave())), buffer.onDidStopChanging(arg => utils_1.handlePromise(this.onDidStopChanging(arg))));
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
    // If there are any pending changes, flush them out to the Typescript server
    async flush() {
        if (this.changedAt > this.changedAtBatch) {
            await new Promise(resolve => {
                const sub = this.buffer.onDidStopChanging(() => {
                    sub.dispose();
                    resolve();
                });
                this.buffer.emitDidStopChangingEvent();
            });
        }
    }
    getInfo() {
        if (!this.state)
            return;
        return {
            clientVersion: this.state.client.version,
            tsConfigPath: this.state.configFile && this.state.configFile.getPath(),
        };
    }
    shouldCompileOnSave() {
        return this.compileOnSave;
    }
    async getErr() {
        if (!this.state)
            return;
        await this.state.client.execute("geterr", {
            files: [this.state.filePath],
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
        const options = await utils_2.getProjectConfig(this.state.configFile.getPath());
        this.compileOnSave = options.compileOnSave;
        await this.state.client.execute("configure", {
            file: this.state.filePath,
            formatOptions: options.formatCodeOptions,
        });
    }
}
TypescriptBuffer.bufferMap = new WeakMap();
exports.TypescriptBuffer = TypescriptBuffer;
//# sourceMappingURL=typescriptBuffer.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// A class to keep all changes to the buffer in sync with tsserver. This is mainly used with
// the editor panes, but is also useful for editor-less buffer changes (renameRefactor).
const Atom = require("atom");
const utils_1 = require("./atom/utils");
class TypescriptBuffer {
    constructor(buffer, getClient) {
        this.buffer = buffer;
        this.getClient = getClient;
        this.events = new Atom.Emitter();
        // Timestamps for buffer events
        this.changedAt = 0;
        this.changedAtBatch = 0;
        this.subscriptions = new Atom.CompositeDisposable();
        this.dispose = async () => {
            this.subscriptions.dispose();
            await this.close();
        };
        this.close = async () => {
            if (this.state) {
                const client = await this.state.client;
                const file = this.state.filePath;
                await client.execute("close", { file });
                this.events.emit("closed", file);
                this.state = undefined;
            }
        };
        this.onDidChange = () => {
            this.changedAt = Date.now();
        };
        this.onDidChangePath = async () => {
            await this.close();
            await this.open();
        };
        this.onDidSave = async () => {
            // Check if there isn't a onDidStopChanging event pending.
            const { changedAt, changedAtBatch } = this;
            if (changedAtBatch > 0 && changedAt > changedAtBatch) {
                await new Promise(resolve => this.events.once("changed", resolve));
            }
            this.events.emit("saved");
        };
        this.onDidStopChanging = async ({ changes }) => {
            // Don't update changedAt or emit any events if there are no actual changes or file isn't open
            if (changes.length === 0 || !this.state)
                return;
            this.changedAtBatch = Date.now();
            const client = await this.state.client;
            for (const change of changes) {
                const { start, oldExtent, newText } = change;
                const end = {
                    endLine: start.row + oldExtent.row + 1,
                    endOffset: (oldExtent.row === 0 ? start.column + oldExtent.column : oldExtent.column) + 1,
                };
                await client.execute("change", Object.assign({}, end, { file: this.state.filePath, line: start.row + 1, offset: start.column + 1, insertString: newText }));
            }
            this.events.emit("changed");
        };
        this.subscriptions.add(buffer.onDidChange(this.onDidChange), buffer.onDidChangePath(this.onDidChangePath), buffer.onDidDestroy(this.dispose), buffer.onDidSave(this.onDidSave), buffer.onDidStopChanging(this.onDidStopChanging));
        this.open();
    }
    static create(buffer, getClient) {
        const b = TypescriptBuffer.bufferMap.get(buffer);
        if (b)
            return b;
        else {
            const nb = new TypescriptBuffer(buffer, getClient);
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
    async getNavTree() {
        if (!this.state)
            return;
        const client = await this.state.client;
        try {
            const navtreeResult = await client.execute("navtree", { file: this.state.filePath });
            return navtreeResult.body;
        }
        catch (err) {
            console.error(err, this.state.filePath);
        }
        return;
    }
    async getNavTo(search) {
        if (!this.state)
            return;
        const client = await this.state.client;
        try {
            const navtoResult = await client.execute("navto", {
                file: this.state.filePath,
                currentFileOnly: false,
                searchValue: search,
                maxResultCount: 1000,
            });
            return navtoResult.body;
        }
        catch (err) {
            console.error(err, this.state.filePath);
        }
        return;
    }
    async open() {
        const filePath = this.buffer.getPath();
        if (filePath !== undefined && utils_1.isTypescriptFile(filePath)) {
            this.state = {
                client: this.getClient(filePath),
                filePath,
            };
            const client = await this.state.client;
            await client.execute("open", {
                file: this.state.filePath,
                fileContent: this.buffer.getText(),
            });
            this.events.emit("opened");
        }
        else {
            this.state = undefined;
        }
    }
}
TypescriptBuffer.bufferMap = new WeakMap();
exports.TypescriptBuffer = TypescriptBuffer;
//# sourceMappingURL=typescriptBuffer.js.map
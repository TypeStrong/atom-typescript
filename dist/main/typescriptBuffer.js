"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// A class to keep all changes to the buffer in sync with tsserver. This is mainly used with
// the editor panes, but is also useful for editor-less buffer changes (renameRefactor).
const Atom = require("atom");
const events_1 = require("events");
const utils_1 = require("./atom/utils");
class TypescriptBuffer {
    constructor(buffer, getClient) {
        this.buffer = buffer;
        this.getClient = getClient;
        // Timestamps for buffer events
        this.changedAt = 0;
        this.changedAtBatch = 0;
        this.events = new events_1.EventEmitter();
        this.subscriptions = new Atom.CompositeDisposable();
        this.dispose = async () => {
            this.subscriptions.dispose();
            if (this.isOpen && this.clientPromise) {
                const client = await this.clientPromise;
                const file = this.buffer.getPath();
                if (file) {
                    client.executeClose({ file });
                }
                this.events.emit("closed", this.filePath);
            }
        };
        this.onDidChange = () => {
            this.changedAt = Date.now();
        };
        this.onDidChangePath = async () => {
            if (this.clientPromise && this.filePath) {
                const client = await this.clientPromise;
                client.executeClose({ file: this.filePath });
                this.events.emit("closed", this.filePath);
            }
            this.open();
        };
        this.onDidSave = async () => {
            // Check if there isn't a onDidStopChanging event pending.
            const { changedAt, changedAtBatch } = this;
            if (changedAt && changedAtBatch && changedAt > changedAtBatch) {
                await new Promise(resolve => this.events.once("changed", resolve));
            }
            this.events.emit("saved");
        };
        this.onDidStopChanging = async ({ changes }) => {
            // Don't update changedAt or emit any events if there are no actual changes or file isn't open
            if (changes.length === 0 || !this.isOpen || !this.clientPromise) {
                return;
            }
            this.changedAtBatch = Date.now();
            const filePath = this.buffer.getPath();
            if (!filePath) {
                return;
            }
            const client = await this.clientPromise;
            for (const change of changes) {
                const { start, oldExtent, newText } = change;
                const end = {
                    endLine: start.row + oldExtent.row + 1,
                    endOffset: (oldExtent.row === 0 ? start.column + oldExtent.column : oldExtent.column) + 1,
                };
                await client.executeChange(Object.assign({}, end, { file: filePath, line: start.row + 1, offset: start.column + 1, insertString: newText }));
            }
            this.events.emit("changed");
        };
        this.subscriptions.add(buffer.onDidChange(this.onDidChange));
        this.subscriptions.add(buffer.onDidChangePath(this.onDidChangePath));
        this.subscriptions.add(buffer.onDidDestroy(this.dispose));
        this.subscriptions.add(buffer.onDidSave(this.onDidSave));
        this.subscriptions.add(buffer.onDidStopChanging(this.onDidStopChanging));
        this.open();
    }
    static construct(buffer, getClient) {
        const b = TypescriptBuffer.bufferMap.get(buffer);
        if (b)
            return b;
        else {
            const nb = new TypescriptBuffer(buffer, getClient);
            TypescriptBuffer.bufferMap.set(buffer, nb);
            return nb;
        }
    }
    async open() {
        this.filePath = this.buffer.getPath();
        if (this.filePath && utils_1.isTypescriptFile(this.filePath)) {
            // Set isOpen before we actually open the file to enqueue any changed events
            this.isOpen = true;
            this.clientPromise = this.getClient(this.filePath);
            const client = await this.clientPromise;
            await client.executeOpen({
                file: this.filePath,
                fileContent: this.buffer.getText(),
            });
            this.events.emit("opened");
        }
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
    on(name, callback) {
        this.events.on(name, callback);
        return this;
    }
}
TypescriptBuffer.bufferMap = new WeakMap();
exports.TypescriptBuffer = TypescriptBuffer;
//# sourceMappingURL=typescriptBuffer.js.map
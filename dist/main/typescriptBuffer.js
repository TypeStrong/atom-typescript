"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
// A class to keep all changes to the buffer in sync with tsserver. This is mainly used with
// the editor panes, but is also useful for editor-less buffer changes (renameRefactor).
const atom_1 = require("atom");
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
        this.subscriptions = new atom_1.CompositeDisposable();
        this.dispose = () => tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.subscriptions.dispose();
            if (this.isOpen && this.clientPromise) {
                const client = yield this.clientPromise;
                client.executeClose({ file: this.buffer.getPath() });
                this.events.emit("closed", this.filePath);
            }
        });
        this.onDidChange = () => {
            this.changedAt = Date.now();
        };
        this.onDidChangePath = (newPath) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (this.clientPromise && this.filePath) {
                const client = yield this.clientPromise;
                client.executeClose({ file: this.filePath });
                this.events.emit("closed", this.filePath);
            }
            this.open();
        });
        this.onDidSave = () => tslib_1.__awaiter(this, void 0, void 0, function* () {
            // Check if there isn't a onDidStopChanging event pending.
            const { changedAt, changedAtBatch } = this;
            if (changedAt && changedAtBatch && changedAt > changedAtBatch) {
                yield new Promise(resolve => this.events.once("changed", resolve));
            }
            this.events.emit("saved");
        });
        this.onDidStopChanging = ({ changes }) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            // Don't update changedAt or emit any events if there are no actual changes or file isn't open
            if (changes.length === 0 || !this.isOpen || !this.clientPromise) {
                return;
            }
            this.changedAtBatch = Date.now();
            const client = yield this.clientPromise;
            const filePath = this.buffer.getPath();
            for (const change of changes) {
                const { start, oldExtent, newText } = change;
                const end = {
                    endLine: start.row + oldExtent.row + 1,
                    endOffset: (oldExtent.row === 0 ? start.column + oldExtent.column : oldExtent.column) + 1,
                };
                yield client.executeChange(Object.assign({}, end, { file: filePath, line: start.row + 1, offset: start.column + 1, insertString: newText }));
            }
            this.events.emit("changed");
        });
        this.subscriptions.add(buffer.onDidChange(this.onDidChange));
        this.subscriptions.add(buffer.onDidChangePath(this.onDidChangePath));
        this.subscriptions.add(buffer.onDidDestroy(this.dispose));
        this.subscriptions.add(buffer.onDidSave(this.onDidSave));
        this.subscriptions.add(buffer.onDidStopChanging(this.onDidStopChanging));
        this.open();
    }
    open() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.filePath = this.buffer.getPath();
            if (utils_1.isTypescriptFile(this.filePath)) {
                // Set isOpen before we actually open the file to enqueue any changed events
                this.isOpen = true;
                this.clientPromise = this.getClient(this.filePath);
                const client = yield this.clientPromise;
                yield client.executeOpen({
                    file: this.filePath,
                    fileContent: this.buffer.getText(),
                });
                this.events.emit("opened");
            }
        });
    }
    // If there are any pending changes, flush them out to the Typescript server
    flush() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (this.changedAt > this.changedAtBatch) {
                let sub;
                yield new Promise(resolve => {
                    sub = this.buffer.onDidStopChanging(() => {
                        resolve();
                    });
                    this.buffer.emitDidStopChangingEvent();
                });
                if (sub) {
                    sub.dispose();
                }
            }
        });
    }
    on(name, callback) {
        this.events.on(name, callback);
        return this;
    }
}
exports.TypescriptBuffer = TypescriptBuffer;
//# sourceMappingURL=typescriptBuffer.js.map
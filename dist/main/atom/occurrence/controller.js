"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom");
const lodash_1 = require("lodash");
const utils_1 = require("../../../utils");
const utils_2 = require("../utils");
class OccurenceController {
    constructor(getClient, editor) {
        this.getClient = getClient;
        this.editor = editor;
        this.disposables = new atom_1.CompositeDisposable();
        this.occurrenceMarkers = [];
        this.disposed = false;
        const debouncedUpdate = lodash_1.debounce(() => {
            utils_1.handlePromise(this.update());
        }, 100);
        this.disposables.add(editor.onDidChangeCursorPosition(debouncedUpdate), editor.onDidChangePath(debouncedUpdate), editor.onDidChangeGrammar(debouncedUpdate));
    }
    dispose() {
        if (this.disposed)
            return;
        this.disposed = true;
        this.disposables.dispose();
        this.clearMarkers();
    }
    clearMarkers() {
        for (const marker of this.occurrenceMarkers) {
            marker.destroy();
        }
        this.occurrenceMarkers = [];
    }
    async update() {
        if (this.disposed)
            return;
        if (!utils_2.isTypescriptEditorWithPath(this.editor)) {
            this.clearMarkers();
            return;
        }
        const filePath = this.editor.getPath();
        if (filePath === undefined)
            return;
        const client = await this.getClient(filePath);
        if (this.disposed)
            return;
        const pos = this.editor.getLastCursor().getBufferPosition();
        try {
            const result = await client.execute("occurrences", {
                file: filePath,
                line: pos.row + 1,
                offset: pos.column + 1,
            });
            if (this.disposed)
                return;
            const ranges = result.body.map(utils_2.spanToRange);
            const newOccurrenceMarkers = ranges.map(range => {
                const oldMarker = this.occurrenceMarkers.find(m => m.getBufferRange().isEqual(range));
                if (oldMarker)
                    return oldMarker;
                else {
                    const marker = this.editor.markBufferRange(range);
                    this.editor.decorateMarker(marker, {
                        type: "highlight",
                        class: "atom-typescript-occurrence",
                    });
                    return marker;
                }
            });
            for (const m of this.occurrenceMarkers) {
                if (!newOccurrenceMarkers.includes(m))
                    m.destroy();
            }
            this.occurrenceMarkers = newOccurrenceMarkers;
        }
        catch (e) {
            if (window.atom_typescript_debug)
                console.error(e);
        }
    }
}
exports.OccurenceController = OccurenceController;
//# sourceMappingURL=controller.js.map
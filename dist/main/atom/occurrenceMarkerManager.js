"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom");
const lodash_1 = require("lodash");
const utils_1 = require("./utils");
class OccurrenceMarkerManager {
    constructor(getClient) {
        this.getClient = getClient;
        this.disposables = new atom_1.CompositeDisposable();
        this.disposables.add(atom.workspace.observeTextEditors(editor => {
            const disp = new atom_1.CompositeDisposable();
            const update = this.updateMarkers(editor);
            disp.add(editor.onDidChangeCursorPosition(update), editor.onDidChangePath(update), editor.onDidChangeGrammar(update), editor.onDidDestroy(() => {
                this.disposables.remove(disp);
                disp.dispose();
            }));
            this.disposables.add(disp);
        }));
    }
    dispose() {
        this.disposables.dispose();
    }
    updateMarkers(editor) {
        let occurrenceMarkers = [];
        const clearMarkers = () => {
            for (const marker of occurrenceMarkers) {
                marker.destroy();
            }
        };
        return lodash_1.debounce(async () => {
            if (!utils_1.isTypescriptEditorWithPath(editor)) {
                clearMarkers();
                return;
            }
            const filePath = editor.getPath();
            if (filePath === undefined)
                return;
            const client = await this.getClient(filePath);
            const pos = editor.getLastCursor().getBufferPosition();
            try {
                const result = await client.execute("occurrences", {
                    file: filePath,
                    line: pos.row + 1,
                    offset: pos.column + 1,
                });
                const ranges = result.body.map(utils_1.spanToRange);
                const newOccurrenceMarkers = ranges.map(range => {
                    const oldMarker = occurrenceMarkers.find(m => m.getBufferRange().isEqual(range));
                    if (oldMarker)
                        return oldMarker;
                    else {
                        const marker = editor.markBufferRange(range);
                        editor.decorateMarker(marker, {
                            type: "highlight",
                            class: "atom-typescript-occurrence",
                        });
                        return marker;
                    }
                });
                for (const m of occurrenceMarkers) {
                    if (!newOccurrenceMarkers.includes(m))
                        m.destroy();
                }
                occurrenceMarkers = newOccurrenceMarkers;
            }
            catch (e) {
                if (window.atom_typescript_debug)
                    console.error(e);
            }
        }, 100, { leading: true });
    }
}
exports.OccurrenceMarkerManager = OccurrenceMarkerManager;
//# sourceMappingURL=occurrenceMarkerManager.js.map
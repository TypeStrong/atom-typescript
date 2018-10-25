"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom");
const controller_1 = require("./controller");
class OccurrenceManager {
    constructor(getClient) {
        this.disposables = new atom_1.CompositeDisposable();
        this.disposables.add(atom.workspace.observeTextEditors(editor => {
            const controller = new controller_1.OccurenceController(getClient, editor);
            this.disposables.add(controller, editor.onDidDestroy(() => {
                this.disposables.remove(controller);
                controller.dispose();
            }));
        }));
    }
    dispose() {
        this.disposables.dispose();
    }
}
exports.OccurrenceManager = OccurrenceManager;
//# sourceMappingURL=manager.js.map
"use strict";
// Inspiration : https://atom.io/packages/ide-haskell
// and https://atom.io/packages/ide-flow
Object.defineProperty(exports, "__esModule", { value: true });
const Atom = require("atom");
const utils_1 = require("../../../utils");
const controller_1 = require("./controller");
class SigHelpManager {
    constructor(deps) {
        this.deps = deps;
        this.subscriptions = new Atom.CompositeDisposable();
        this.editorMap = new WeakMap();
        this.stoppedChanging = (editor) => (event) => {
            if (!atom.config.get("atom-typescript.sigHelpDisplayOnChange"))
                return;
            const filePath = editor.getPath();
            if (filePath === undefined)
                return;
            const pos = editor.getLastCursor().getBufferPosition();
            const [ch] = event.changes.filter(x => x.newRange.containsPoint(pos));
            if (ch && ch.newText.match(/[<(,]/) !== null) {
                utils_1.handlePromise(this.showTooltip(editor, pos));
            }
        };
        this.subscriptions.add(atom.workspace.observeTextEditors(editor => {
            const disp = new Atom.CompositeDisposable();
            disp.add(editor.onDidDestroy(() => {
                disp.dispose();
                this.subscriptions.remove(disp);
                const controller = this.editorMap.get(editor);
                if (controller)
                    controller.dispose();
            }), editor.onDidStopChanging(this.stoppedChanging(editor)));
            this.subscriptions.add(disp);
        }));
    }
    dispose() {
        this.subscriptions.dispose();
        for (const editor of atom.workspace.getTextEditors()) {
            const controller = this.editorMap.get(editor);
            if (controller)
                controller.dispose();
        }
    }
    async showTooltipAt(editor) {
        const pt = editor.getLastCursor().getBufferPosition();
        return this.showTooltip(editor, pt);
    }
    rotateSigHelp(editor, shift) {
        const controller = this.editorMap.get(editor);
        if (controller && !controller.isDisposed()) {
            utils_1.handlePromise(controller.rotateSigHelp(shift));
            return true;
        }
        else {
            return false;
        }
    }
    hideTooltipAt(editor) {
        const controller = this.editorMap.get(editor);
        if (controller && !controller.isDisposed()) {
            controller.dispose();
            return true;
        }
        else {
            return false;
        }
    }
    async showTooltip(editor, pos) {
        const controller = this.editorMap.get(editor);
        if (!controller || controller.isDisposed()) {
            this.editorMap.set(editor, new controller_1.TooltipController(this.deps, editor, pos));
        }
    }
}
exports.SigHelpManager = SigHelpManager;
//# sourceMappingURL=manager.js.map
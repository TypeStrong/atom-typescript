"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom");
const utils_1 = require("./atom/utils");
const typescriptBuffer_1 = require("./typescriptBuffer");
class TypescriptEditorPane {
    constructor(editor, opts) {
        this.editor = editor;
        this.opts = opts;
        this.subscriptions = new atom_1.CompositeDisposable();
        this.isTypescript = false;
        this.destroy = () => {
            atom.views.getView(this.editor).classList.remove("typescript-editor");
            this.subscriptions.dispose();
        };
        /** NOTE:
         * it is implicitly assumed that `atom.workspace.getActiveTextEditor() === this.editor`
         * which has to be ensured at call site
         */
        this.didActivate = () => {
            if (this.isTypescript)
                this.reportInfo();
        };
        this.onOpened = () => {
            const isActive = atom.workspace.getActiveTextEditor() === this.editor;
            if (isActive)
                this.reportInfo();
        };
        this.checkIfTypescript = () => {
            this.isTypescript = utils_1.isTypescriptEditorWithPath(this.editor);
            if (this.isTypescript) {
                atom.views.getView(this.editor).classList.add("typescript-editor");
            }
            else {
                atom.views.getView(this.editor).classList.remove("typescript-editor");
            }
        };
        this.buffer = typescriptBuffer_1.TypescriptBuffer.create(editor.getBuffer(), opts);
        this.subscriptions.add(this.buffer.on("opened", this.onOpened));
        this.checkIfTypescript();
        this.subscriptions.add(editor.onDidChangePath(this.checkIfTypescript), editor.onDidChangeGrammar(this.checkIfTypescript), editor.onDidDestroy(this.destroy), editor.onDidSave(() => {
            if (atom.config.get("atom-typescript.checkAllFilesOnSave")) {
                atom.commands.dispatch(atom.views.getView(editor), "typescript:check-all-files");
            }
        }));
    }
    // tslint:disable-next-line:member-ordering
    static createFactory(opts) {
        return (editor) => {
            let tep = TypescriptEditorPane.editorMap.get(editor);
            if (!tep) {
                tep = new TypescriptEditorPane(editor, opts);
                TypescriptEditorPane.editorMap.set(editor, tep);
            }
            return tep;
        };
    }
    // tslint:disable-next-line:member-ordering
    static lookupPane(editor) {
        return TypescriptEditorPane.editorMap.get(editor);
    }
    reportInfo() {
        const info = this.buffer.getInfo();
        if (info)
            this.opts.reportClientInfo(info);
    }
}
exports.TypescriptEditorPane = TypescriptEditorPane;
TypescriptEditorPane.editorMap = new WeakMap();
//# sourceMappingURL=typescriptEditorPane.js.map
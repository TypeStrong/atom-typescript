"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom");
const utils_1 = require("../utils");
const utils_2 = require("./atom/utils");
const typescriptBuffer_1 = require("./typescriptBuffer");
class TypescriptEditorPane {
    constructor(editor, opts) {
        this.editor = editor;
        this.opts = opts;
        this.subscriptions = new atom_1.CompositeDisposable();
        this.isTypescript = false;
        this.dispose = () => {
            atom.views.getView(this.editor).classList.remove("typescript-editor");
            this.subscriptions.dispose();
        };
        /** NOTE:
         * it is implicitly assumed that `atom.workspace.getActiveTextEditor() === this.editor`
         * which has to be ensured at call site
         */
        this.didActivate = () => {
            if (this.isTypescript) {
                utils_1.handlePromise(this.buffer.getErr());
                const info = this.buffer.getInfo();
                if (info) {
                    this.opts.reportClientInfo(info);
                }
            }
        };
        this.onOpened = () => {
            const isActive = atom.workspace.getActiveTextEditor() === this.editor;
            if (isActive) {
                const info = this.buffer.getInfo();
                if (info) {
                    this.opts.reportClientInfo(info);
                }
            }
        };
        this.checkIfTypescript = () => {
            this.isTypescript = utils_2.isTypescriptEditorWithPath(this.editor);
            if (this.isTypescript) {
                atom.views.getView(this.editor).classList.add("typescript-editor");
            }
            else {
                atom.views.getView(this.editor).classList.remove("typescript-editor");
            }
        };
        this.buffer = typescriptBuffer_1.TypescriptBuffer.create(editor.getBuffer(), opts);
        this.subscriptions.add(this.buffer.on("changed", () => {
            this.opts.reportBuildStatus(undefined);
        }), this.buffer.on("opened", this.onOpened), this.buffer.on("saved", () => {
            utils_1.handlePromise(this.compileOnSave());
        }));
        this.checkIfTypescript();
        this.subscriptions.add(editor.onDidChangePath(this.checkIfTypescript), editor.onDidChangeGrammar(this.checkIfTypescript), editor.onDidDestroy(this.dispose));
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
    async compileOnSave() {
        if (!this.buffer.shouldCompileOnSave())
            return;
        this.opts.reportBuildStatus(undefined);
        try {
            await this.buffer.compile();
            this.opts.reportBuildStatus({ success: true });
        }
        catch (error) {
            const e = error;
            console.error("Save failed with error", e);
            this.opts.reportBuildStatus({ success: false, message: e.message });
        }
    }
}
TypescriptEditorPane.editorMap = new WeakMap();
exports.TypescriptEditorPane = TypescriptEditorPane;
//# sourceMappingURL=typescriptEditorPane.js.map
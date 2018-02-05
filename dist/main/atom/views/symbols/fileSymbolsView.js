"use strict";
/** @babel */
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom");
const symbolsView_1 = require("./symbolsView");
const fuzzaldrin_1 = require("fuzzaldrin");
const atomts_1 = require("../../../atomts");
const fileSymbolsTag_1 = require("./fileSymbolsTag");
/**
 * this is a modified copy of symbols-view/lib/file-view.js
 * for support of searching file-symbols in typescript files,
 * utilizing the typescript service instead of ctag.
 */
class FileView extends symbolsView_1.default {
    constructor(stack) {
        super(stack);
        this.cachedTags = {};
        this.editorsSubscription = atom.workspace.observeTextEditors((editor) => {
            const removeFromCache = () => {
                const path = editor.getPath();
                if (path) {
                    delete this.cachedTags[path];
                }
            };
            const editorSubscriptions = new atom_1.CompositeDisposable();
            editorSubscriptions.add(editor.onDidChangeGrammar(removeFromCache));
            editorSubscriptions.add(editor.onDidSave(removeFromCache));
            editorSubscriptions.add(editor.onDidChangePath(removeFromCache));
            editorSubscriptions.add(editor.getBuffer().onDidReload(removeFromCache));
            editorSubscriptions.add(editor.getBuffer().onDidDestroy(removeFromCache));
            editor.onDidDestroy(() => {
                editorSubscriptions.dispose();
            });
        });
    }
    destroy() {
        this.editorsSubscription.dispose();
        return super.destroy();
    }
    elementForItem({ position, name }) {
        // Style matched characters in search results
        const matches = fuzzaldrin_1.match(name, this.selectListView.getFilterQuery());
        const li = document.createElement("li");
        li.classList.add("two-lines");
        const primaryLine = document.createElement("div");
        primaryLine.classList.add("primary-line");
        primaryLine.appendChild(symbolsView_1.default.highlightMatches(this, name, matches));
        li.appendChild(primaryLine);
        const secondaryLine = document.createElement("div");
        secondaryLine.classList.add("secondary-line");
        secondaryLine.textContent = `Line ${position.row + 1}`;
        li.appendChild(secondaryLine);
        return li;
    }
    didChangeSelection(item) {
        // NOTE uses the "parent" package's setting (i.e. from symbols-view):
        if (atom.config.get("symbols-view.quickJumpToFileSymbol") && item) {
            this.openTag(item);
        }
    }
    async didCancelSelection() {
        await this.cancel();
        const editor = this.getEditor();
        if (this.initialState && editor) {
            this.deserializeEditorState(editor, this.initialState);
        }
        this.initialState = null;
    }
    async toggle() {
        if (this.panel.isVisible()) {
            await this.cancel();
        }
        const filePath = this.getPath();
        if (filePath) {
            const editor = this.getEditor();
            // NOTE uses the "parent" package's setting (i.e. from symbols-view):
            if (atom.config.get("symbols-view.quickJumpToFileSymbol") && editor) {
                this.initialState = this.serializeEditorState(editor);
            }
            this.populate(filePath);
            this.attach();
        }
    }
    serializeEditorState(editor) {
        const editorElement = atom.views.getView(editor);
        const scrollTop = editorElement.getScrollTop();
        return {
            bufferRanges: editor.getSelectedBufferRanges(),
            scrollTop,
        };
    }
    deserializeEditorState(editor, { bufferRanges, scrollTop }) {
        const editorElement = atom.views.getView(editor);
        editor.setSelectedBufferRanges(bufferRanges);
        editorElement.setScrollTop(scrollTop);
    }
    getEditor() {
        return atom.workspace.getActiveTextEditor();
    }
    getPath() {
        const editor = this.getEditor();
        if (editor) {
            return editor.getPath();
        }
        return undefined;
    }
    getScopeName() {
        const editor = this.getEditor();
        if (editor && editor.getGrammar()) {
            return editor.getGrammar().scopeName;
        }
        return undefined;
    }
    async populate(filePath) {
        const tags = this.cachedTags[filePath];
        if (tags) {
            await this.selectListView.update({ items: tags });
        }
        else {
            await this.selectListView.update({
                items: [],
                loadingMessage: "Generating symbols\u2026",
            });
            await this.selectListView.update({
                items: await this.generateTags(filePath),
                loadingMessage: null,
            });
        }
    }
    async generateTags(filePath) {
        // const generator = new TagGenerator(filePath, this.getScopeName());
        this.cachedTags[filePath] = await this.generate(filePath); // generator.generate();
        return this.cachedTags[filePath];
    }
    async generate(filePath) {
        const navtree = await this.getNavTree(filePath);
        const tags = [];
        if (navtree && navtree.childItems) {
            // NOTE omit root NavigationTree tree element (which corresponds to the file itself)
            this.parseNavTree(navtree.childItems, tags);
        }
        return tags;
    }
    parseNavTree(navTree, list, parent) {
        let tag;
        let children;
        if (!Array.isArray(navTree)) {
            tag = new fileSymbolsTag_1.Tag(navTree, parent);
            list.push(tag);
            children = navTree.childItems ? navTree.childItems : null;
        }
        else {
            tag = null;
            children = navTree;
        }
        if (children) {
            // sort children by their line-position
            children.sort((a, b) => a.spans[0].start.line - b.spans[0].start.line);
            for (let i = 0, size = children.length; i < size; ++i) {
                this.parseNavTree(children[i], list, tag);
            }
        }
    }
    // TODO optimize? when semantic-view is open, and has the current navTree -> use that instead of requesting it again?
    async getNavTree(filePath) {
        try {
            const client = await atomts_1.clientResolver.get(filePath);
            await client.executeOpen({ file: filePath });
            const navtreeResult = await client.executeNavTree({ file: filePath });
            const navTree = navtreeResult ? navtreeResult.body : void 0;
            if (navTree) {
                return navTree;
            }
        }
        catch (err) {
            console.error(err, filePath);
        }
        return null;
    }
}
exports.FileView = FileView;
//# sourceMappingURL=fileSymbolsView.js.map
"use strict";
/** @babel */
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom");
const humanize = require("humanize-plus");
const symbolsView_1 = require("./symbolsView");
const fileSymbolsTag_1 = require("./fileSymbolsTag");
const lodash_1 = require("lodash");
/**
 * this is a modified copy of symbols-view/lib/project-view.js
 * for support of searching project-symbols in typescript files,
 * utilizing the typescript service instead of ctag.
 */
class ProjectView extends symbolsView_1.default {
    constructor(stack, clientResolver) {
        super(stack, "Project has no tags file or it is empty", 10);
        this.clientResolver = clientResolver;
        this.updatedTags = new atom_1.Emitter();
        this.startTaskDelayed = lodash_1.debounce(this.startTask.bind(this), 250);
    }
    destroy() {
        this.stopTask();
        this.updatedTags.dispose();
        return super.destroy();
    }
    toggle() {
        if (this.panel.isVisible()) {
            this.cancel();
        }
        else {
            this.populate();
            this.attach();
        }
    }
    didChangeQuery(query) {
        if (query) {
            this.startTaskDelayed(query);
        }
        else {
            this.updatedTags.emit("tags", []);
        }
    }
    //////////////// START: copied from fileSymbolsView /////////////////////////////
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
    //////////////// END: copied from fileSymbolsView /////////////////////////////
    async populate() {
        if (this.tags) {
            await this.selectListView.update({ items: this.tags });
        }
        await this.selectListView.update({
            loadingMessage: "Loading project symbols\u2026",
            loadingBadge: 0,
        });
        let tagsRead = 0;
        this.updatedTags.clear();
        this.updatedTags.on("tags", tags => {
            if (tags && tags.length > 0) {
                tagsRead += tags.length;
                this.selectListView.update({ loadingBadge: humanize.intComma(tagsRead) });
            }
            else {
                this.tags = [];
                const message = this.getEmptyResultMessage();
                this.selectListView.update({
                    loadingMessage: message,
                    loadingBadge: null,
                    items: this.tags,
                });
            }
        });
        this.updatedTags.emit("tags", this.tags);
    }
    stopTask() {
        if (this.startTaskDelayed && this.startTaskDelayed.cancel) {
            this.startTaskDelayed.cancel();
        }
        if (this.loadTagsTask) {
            // TODO cancel pending request -- would need Oberservable or similar instead of Promise
            // this.loadTagsTask.terminate();
        }
    }
    startTask(searchValue) {
        // console.log('new request for query: "'+searchValue+'"...')
        this.stopTask();
        // NOTE need file path when querying tsserver's "navto"
        const filePath = this.getPath();
        if (filePath) {
            this.loadTagsTask = this.generate(filePath, searchValue).then(tags => {
                this.search = searchValue;
                this.tags = tags;
                const message = tags.length > 1 ? null : this.getEmptyResultMessage();
                this.selectListView.update({
                    loadingMessage: message,
                    loadingBadge: null,
                    items: this.tags,
                });
                return tags;
            });
        }
    }
    getEmptyResultMessage() {
        return this.search ? "No symbols found" : "Please enter search value";
    }
    /////////////// custom tag generation: use tsserver /////////////////////
    async generate(filePath, searchValue) {
        const navto = await this.getNavTo(filePath, searchValue);
        const tags = [];
        if (navto && navto.length > 0) {
            this.parseNavTo(navto, tags);
        }
        return tags;
    }
    parseNavTo(navTree, list, parent) {
        let tag;
        let children;
        if (!Array.isArray(navTree)) {
            tag = new fileSymbolsTag_1.Tag(navTree, parent);
            list.push(tag);
            children = null;
        }
        else {
            tag = null;
            children = navTree;
        }
        if (children) {
            for (let i = 0, size = children.length; i < size; ++i) {
                this.parseNavTo(children[i], list, tag);
            }
        }
    }
    async getNavTo(filePath, query) {
        try {
            const client = await this.clientResolver.get(filePath);
            await client.executeOpen({ file: filePath });
            const navtoResult = await client.executeNavto({
                file: filePath,
                currentFileOnly: false,
                searchValue: query,
            });
            const navTo = navtoResult ? navtoResult.body : void 0;
            if (navTo) {
                return navTo;
            }
        }
        catch (err) {
            console.error(err, filePath);
        }
        return null;
    }
}
exports.default = ProjectView;
//# sourceMappingURL=projectSymbolsView.js.map
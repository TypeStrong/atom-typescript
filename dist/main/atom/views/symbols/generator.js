"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const fileSymbolsTag_1 = require("./fileSymbolsTag");
async function generate(filePath, allFiles, deps) {
    const client = await deps.clientResolver.get(filePath);
    let files;
    if (allFiles) {
        const { body } = await client.executeProjectInfo({ file: filePath, needFileNameList: true });
        files = new Set(body.fileNames);
        files.delete(body.configFileName);
    }
    else {
        files = new Set([filePath]);
    }
    const allTags = await Promise.all(Array.from(files).map(async (file) => {
        if (file.includes(`${path_1.sep}node_modules${path_1.sep}`))
            return [];
        const navtree = await getNavTree(file, deps);
        const tags = [];
        if (navtree && navtree.childItems) {
            // NOTE omit root NavigationTree tree element (which corresponds to the file itself)
            parseNavTree(file, navtree.childItems, tags);
        }
        return tags;
    }));
    return [].concat(...allTags);
}
exports.generate = generate;
function parseNavTree(file, navTree, list, parent) {
    let tag;
    let children;
    if (!Array.isArray(navTree)) {
        tag = new fileSymbolsTag_1.Tag(file, navTree, parent);
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
            parseNavTree(file, children[i], list, tag);
        }
    }
}
// TODO possibly factor out a single navTree generator
async function getNavTree(filePath, deps) {
    return deps.withTypescriptBuffer(filePath, buffer => {
        return buffer.getNavTree();
    });
}
//# sourceMappingURL=generator.js.map
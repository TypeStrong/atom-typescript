"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const symbolsTag_1 = require("./symbolsTag");
async function generateFile(filePath, deps) {
    const navtree = await getNavTree(filePath, deps);
    if (navtree && navtree.childItems) {
        // NOTE omit root NavigationTree tree element (which corresponds to the file itself)
        return Array.from(parseNavTree(navtree.childItems));
    }
    else
        return [];
}
exports.generateFile = generateFile;
async function generateProject(filePath, search, deps) {
    const navtree = await getNavTo(filePath, search, deps);
    if (navtree) {
        return Array.from(parseNavTo(navtree));
    }
    else
        return [];
}
exports.generateProject = generateProject;
function* parseNavTree(navTree, parent) {
    navTree.sort((a, b) => a.spans[0].start.line - b.spans[0].start.line);
    for (const item of navTree) {
        const tag = symbolsTag_1.Tag.fromNavTree(item, parent);
        yield tag;
        if (item.childItems)
            yield* parseNavTree(item.childItems, tag);
    }
}
function* parseNavTo(navTree, parent) {
    for (const item of navTree) {
        yield symbolsTag_1.Tag.fromNavto(item, parent);
    }
}
async function getNavTree(filePath, deps) {
    return deps.withTypescriptBuffer(filePath, buffer => {
        return buffer.getNavTree();
    });
}
async function getNavTo(filePath, search, deps) {
    return deps.withTypescriptBuffer(filePath, buffer => {
        return buffer.getNavTo(search);
    });
}
//# sourceMappingURL=generator.js.map
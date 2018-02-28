"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Tag {
    constructor(file, navTree, parent) {
        this.file = file;
        this.name = navTree.text;
        this.type = this.getType(navTree.kind);
        const start = navTree.spans[0].start;
        this.position = { row: start.line - 1, column: start.offset };
        this.parent = parent ? parent : null;
    }
    getType(kind) {
        return kind;
    }
}
exports.Tag = Tag;
//# sourceMappingURL=fileSymbolsTag.js.map
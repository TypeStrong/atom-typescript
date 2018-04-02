"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Tag {
    static fromNavTree(navTree, parent) {
        const start = navTree.spans[0].start;
        return new Tag({
            name: navTree.text,
            type: navTree.kind,
            position: { row: start.line - 1, column: start.offset - 1 },
            parent: parent != null ? parent : null,
        });
    }
    static fromNavto(navTo, parent) {
        const start = navTo.start;
        return new Tag({
            name: navTo.name,
            type: navTo.kind,
            position: { row: start.line - 1, column: start.offset - 1 },
            parent: parent != null ? parent : null,
            file: navTo.file,
        });
    }
    constructor(props) {
        this.position = props.position;
        this.name = props.name;
        this.type = props.type;
        this.parent = props.parent;
        this.file = props.file;
    }
}
exports.Tag = Tag;
//# sourceMappingURL=symbolsTag.js.map
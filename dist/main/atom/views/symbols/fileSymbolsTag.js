"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * this is a modified extraction (of Tag class) from symbols-view/lib/file-view.js
 * for support of searching file-symbols in typescript files,
 * utilizing the typescript service instead of ctag.
 */
class Tag {
    constructor(navTree, parent) {
        this.name = navTree.text;
        this.type = this.getType(navTree.kind);
        const start = navTree.spans[0].start;
        this.position = { row: start.line - 1, column: start.offset };
        this.parent = parent ? parent : null;
    }
    getType(kind) {
        // TODO need to convert from ctag, but since this seem to be unused anyway...
        // switch(kind){
        //   case 'class':
        //   case 'struct':
        //   case 'interface':
        //   case 'enum':
        //   case 'typedef':
        //   case 'macro':
        //   case 'union':
        //   case 'module':
        //   case 'namespace':
        //     return 'class';
        //   case 'type':
        //   case 'variable':
        //   case 'field':
        //   case 'member':
        //   case 'var':
        //   case 'property':
        //   case 'alias':
        //   case 'let':
        //     return 'variable';
        //   case 'const':
        //     return 'const';
        //   case 'function':
        //   case 'constructor':
        //   case 'method':
        //   case 'setter':
        //   case 'getter':
        //     return 'function';
        // }
        return kind;
    }
}
exports.Tag = Tag;
//# sourceMappingURL=fileSymbolsTag.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../atom/utils");
function getOutlineProvider(getClient) {
    return {
        name: "Atom-TypeScript",
        grammarScopes: utils_1.typeScriptScopes(),
        priority: 100,
        updateOnEdit: true,
        async getOutline(editor) {
            const filePath = editor.getPath();
            if (filePath === undefined)
                return;
            const client = await getClient(filePath);
            const navTreeResult = await client.execute("navtree", { file: filePath });
            const navTree = navTreeResult.body;
            if (!navTree)
                return;
            return { outlineTrees: [navTreeToOutline(navTree)] };
        },
    };
}
exports.getOutlineProvider = getOutlineProvider;
function navTreeToOutline(navTree) {
    const ranges = navTree.spans.map(utils_1.spanToRange);
    const range = ranges.reduce((prev, cur) => cur.union(prev));
    return {
        kind: kindMap[navTree.kind],
        plainText: navTree.text,
        startPosition: range.start,
        endPosition: range.end,
        landingPosition: navTree.nameSpan ? utils_1.spanToRange(navTree.nameSpan).start : undefined,
        children: navTree.childItems ? navTree.childItems.map(navTreeToOutline) : [],
    };
}
const kindMap = {
    // | "file"
    directory: "file",
    // | "module"
    module: "module",
    "external module name": "module",
    // | "namespace"
    // | "package"
    // | "class"
    class: "class",
    "local class": "class",
    // | "method"
    method: "method",
    // | "property"
    property: "property",
    getter: "property",
    setter: "property",
    // | "field"
    "JSX attribute": "field",
    // | "constructor"
    constructor: "constructor",
    // | "enum"
    enum: "enum",
    // | "interface"
    interface: "interface",
    type: "interface",
    // | "function"
    function: "function",
    "local function": "function",
    // | "variable"
    label: "variable",
    alias: "variable",
    var: "variable",
    let: "variable",
    "local var": "variable",
    parameter: "variable",
    // | "constant"
    "enum member": "constant",
    const: "constant",
    // | "string"
    string: "string",
    // | "number"
    // | "boolean"
    // | "array"
    // ???
    "": undefined,
    warning: undefined,
    keyword: undefined,
    script: undefined,
    call: undefined,
    index: undefined,
    construct: undefined,
    "type parameter": undefined,
    "primitive type": undefined,
};
//# sourceMappingURL=outlineProvider.js.map
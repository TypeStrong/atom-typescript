/**
 * Things we care about:
 * name , kind , text
 */
// Inspired by `ts.forEachChild`:
// https://github.com/Microsoft/TypeScript/blob/65cbd91667acf890f21a3527b3647c7bc994ca32/src/compiler/parser.ts#L43-L320
var ts = require("typescript");
var tsconfig_1 = require("../../tsconfig/tsconfig");
function astToText(srcFile) {
    //// A useful function for debugging
    // aggregate(srcFile, 0);
    // function aggregate(node: ts.Node, depth: number): void {
    //     console.error(node.kind, (node.name && node.name.text), (node.parent), depth, node);
    //     ts.forEachChild(node, (node) => aggregate(node, depth + 1));
    // }
    var nodeIndex = 0;
    function nodeToNodeDisplay(node, depth) {
        if (node.parent) {
            delete node.parent;
        }
        var kind = syntaxKindToString(node.kind);
        var details = keyDetails(node, kind);
        var children = [];
        ts.forEachChild(node, function (cNode) {
            var child = nodeToNodeDisplay(cNode, depth + 1);
            children.push(child);
        });
        var ret = {
            kind: kind,
            children: children,
            depth: depth,
            nodeIndex: nodeIndex,
            details: details,
            rawJson: tsconfig_1.prettyJSON(node)
        };
        nodeIndex++;
        return ret;
    }
    var root = nodeToNodeDisplay(srcFile, 0);
    return root;
}
exports.default = astToText;
function keyDetails(node, kind) {
    var n = node;
    var details = undefined;
    if (node.kind == 227) {
        details = { fileName: node.fileName };
    }
    else if (n.name && n.name.text) {
        details = { 'name.text: ': (n.name.text) };
    }
    return details;
}
function syntaxKindToString(syntaxKind) {
    return ts.SyntaxKind[syntaxKind];
}
function clearParent(obj) {
    return obj;
}

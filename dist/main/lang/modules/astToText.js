/**
 * Things we care about:
 * name , kind , text
 */
// Inspired by `ts.forEachChild`:
// https://github.com/Microsoft/TypeScript/blob/65cbd91667acf890f21a3527b3647c7bc994ca32/src/compiler/parser.ts#L43-L320
var ts = require("typescript");
var syntaxKindToString_1 = require("./syntaxKindToString");
function astToText(srcFile) {
    //// A useful function for debugging
    // aggregate(srcFile, 0);
    // function aggregate(node: ts.Node, depth: number): void {
    //     console.error(node.kind, (node.name && node.name.text), (node.parent), depth, node);
    //     ts.forEachChild(node, (node) => aggregate(node, depth + 1));
    // }
    function nodeToNodeDisplay(node) {
        var kind = syntaxKindToString_1.default(node.kind);
        var display = nodeDisplayString(node);
        var children = [];
        ts.forEachChild(node, function (cNode) {
            var child = nodeToNodeDisplay(cNode);
            children.push(child);
        });
        var ret = {
            display: display,
            kind: kind,
            children: children,
        };
        return ret;
    }
    var root = nodeToNodeDisplay(srcFile);
    return root;
}
exports.default = astToText;
function nodeDisplayString(node) {
    var n = node;
    if (node.kind == 227) {
        return node.fileName;
    }
    else if (n.name && n.name.text) {
        return (n.name.text);
    }
    else {
        return 'Kind: ' + syntaxKindToString_1.default(node.kind);
    }
}

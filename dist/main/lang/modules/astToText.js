/**
 * Things we care about:
 * name , kind , text
 */
// Inspired by `ts.forEachChild`:
// https://github.com/Microsoft/TypeScript/blob/65cbd91667acf890f21a3527b3647c7bc994ca32/src/compiler/parser.ts#L43-L320
var astUtils_1 = require("../fixmyts/astUtils");
function astToText(srcFile) {
    //// A useful function for debugging
    // aggregate(srcFile, 0);
    // function aggregate(node: ts.Node, depth: number): void {
    //     console.error(node.kind, (node.name && node.name.text), (node.parent), depth, node);
    //     ts.forEachChild(node, (node) => aggregate(node, depth + 1));
    // }
    var nodeIndex = 0;
    function nodeToNodeDisplay(node, depth) {
        var kind = astUtils_1.syntaxKindToString(node.kind);
        var children = [];
        ts.forEachChild(node, function (cNode) {
            var child = nodeToNodeDisplay(cNode, depth + 1);
            children.push(child);
        });
        var ret = {
            kind: kind,
            children: children,
            pos: node.pos,
            end: node.end,
            depth: depth,
            nodeIndex: nodeIndex,
            rawJson: prettyJSONNoParent(node)
        };
        nodeIndex++;
        return ret;
    }
    var root = nodeToNodeDisplay(srcFile, 0);
    return root;
}
exports.astToText = astToText;
function astToTextFull(srcFile) {
    //// A useful function for debugging
    // aggregate(srcFile, 0);
    // function aggregate(node: ts.Node, depth: number): void {
    //     console.error(node.kind, (node.name && node.name.text), (node.parent), depth, node);
    //     ts.forEachChild(node, (node) => aggregate(node, depth + 1));
    // }
    var nodeIndex = 0;
    function nodeToNodeDisplay(node, depth) {
        var kind = astUtils_1.syntaxKindToString(node.kind);
        var children = [];
        node.getChildren().forEach(function (cNode) {
            var child = nodeToNodeDisplay(cNode, depth + 1);
            children.push(child);
        });
        var ret = {
            kind: kind,
            children: children,
            pos: node.pos,
            end: node.end,
            depth: depth,
            nodeIndex: nodeIndex,
            rawJson: prettyJSONNoParent(node)
        };
        nodeIndex++;
        return ret;
    }
    var root = nodeToNodeDisplay(srcFile, 0);
    return root;
}
exports.astToTextFull = astToTextFull;
function prettyJSONNoParent(object) {
    var cache = [];
    var value = JSON.stringify(object, function (key, value) {
        if (key == 'parent') {
            return;
        }
        if (typeof value === 'object' && value !== null) {
            if (cache.indexOf(value) !== -1) {
                return;
            }
            cache.push(value);
        }
        return value;
    }, 4);
    cache = null;
    return value;
}

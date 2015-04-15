var ts = require("typescript");
exports.forEachChild = ts.forEachChild;
function forEachChildRecursive(node, cbNode, depth) {
    if (depth === void 0) { depth = 0; }
    var res = cbNode(node, depth);
    forEachChildRecursive(node, cbNode, depth + 1);
    return res;
}
exports.forEachChildRecursive = forEachChildRecursive;
function deepestNodeAtPosition(node, position) {
    var deepest = node;
    function checkDeeperNodes(node) {
        if (node.pos < position && node.end > position) {
            deepest = node;
            exports.forEachChild(node, checkDeeperNodes);
        }
    }
    exports.forEachChild(node, checkDeeperNodes);
    return deepest;
}
exports.deepestNodeAtPosition = deepestNodeAtPosition;
function getNodeByKindAndName(program, kind, name) {
    console.error(name);
    var found = undefined;
    function findNode(node) {
        if (node.kind == kind) {
            if (node.kind == 201) {
                if (node.name.text == name) {
                    found = node;
                }
            }
            if (node.kind == 202) {
                if (node.name.text == name) {
                    found = node;
                }
            }
        }
        if (!found) {
            exports.forEachChild(node, findNode);
        }
    }
    for (var _i = 0, _a = program.getSourceFiles(); _i < _a.length; _i++) {
        var file = _a[_i];
        exports.forEachChild(file, findNode);
    }
    return found;
}
exports.getNodeByKindAndName = getNodeByKindAndName;

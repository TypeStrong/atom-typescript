var ts = require("typescript");
exports.forEachChild = ts.forEachChild;
function forEachChildRecursive(node, cbNode) {
    var res = cbNode(node);
    exports.forEachChild(node, cbNode);
    return res;
}
exports.forEachChildRecursive = forEachChildRecursive;

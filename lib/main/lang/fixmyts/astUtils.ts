import * as ts from "typescript";

export var forEachChild = ts.forEachChild;

export function forEachChildRecursive<T>(node: ts.Node, cbNode: (node: ts.Node) => T): T {
    var res = cbNode(node);
    forEachChild(node, cbNode);
    return res;
}
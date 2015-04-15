import * as ts from "typescript";

export var forEachChild = ts.forEachChild;

export function forEachChildRecursive<T>(node: ts.Node, cbNode: (node: ts.Node, depth: number) => T, depth = 0): T {
    var res = cbNode(node, depth);
    forEachChildRecursive(node, cbNode, depth + 1);
    return res;
}

export function deepestNodeAtPosition(node: ts.Node, position: number) {
    var deepest: ts.Node = node;

    function checkDeeperNodes(node: ts.Node) {
        if (node.pos < position && node.end > position) {
            deepest = node;
            forEachChild(node, checkDeeperNodes);
        }
    }

    forEachChild(node, checkDeeperNodes);
    return deepest;
}

export function getNodeByKindAndName(program: ts.Program, kind: ts.SyntaxKind, name: string): ts.Node {
    console.error(name);
    let found: ts.Node = undefined;

    function findNode(node: ts.Node) {
        if (node.kind == kind) {
            // Now lookup name: 
            if (node.kind == ts.SyntaxKind.ClassDeclaration) {
                if ((<ts.ClassDeclaration>node).name.text == name) {
                    found = node;
                }
            }
            if (node.kind == ts.SyntaxKind.InterfaceDeclaration) {
                if ((<ts.InterfaceDeclaration>node).name.text == name) {
                    found = node;
                }
            }
        }

        if (!found) { forEachChild(node, findNode);}
    }

    for (let file of program.getSourceFiles()) {
        forEachChild(file, findNode);
    }

    return found;
}
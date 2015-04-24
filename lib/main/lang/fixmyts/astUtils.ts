
export var forEachChild = ts.forEachChild;

export function forEachChildRecursive<T>(node: ts.Node, cbNode: (node: ts.Node, depth: number) => T, depth = 0): T {
    var res = cbNode(node, depth);
    forEachChildRecursive(node, cbNode, depth + 1);
    return res;
}

export function getNodeByKindAndName(program: ts.Program, kind: ts.SyntaxKind, name: string): ts.Node {
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

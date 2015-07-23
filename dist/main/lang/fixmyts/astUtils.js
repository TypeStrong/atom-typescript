exports.forEachChild = ts.forEachChild;
function forEachChildRecursive(node, cbNode, depth) {
    if (depth === void 0) { depth = 0; }
    var res = cbNode(node, depth);
    forEachChildRecursive(node, cbNode, depth + 1);
    return res;
}
exports.forEachChildRecursive = forEachChildRecursive;
function syntaxKindToString(syntaxKind) {
    return ts.SyntaxKind[syntaxKind];
}
exports.syntaxKindToString = syntaxKindToString;
function getNodeByKindAndName(program, kind, name) {
    var found = undefined;
    function findNode(node) {
        if (node.kind == kind) {
            if (node.kind == ts.SyntaxKind.ClassDeclaration) {
                if (node.name.text == name) {
                    found = node;
                }
            }
            if (node.kind == ts.SyntaxKind.InterfaceDeclaration) {
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
function getSourceFileImports(srcFile) {
    var modules = [];
    getImports(srcFile, modules);
    return modules;
}
exports.getSourceFileImports = getSourceFileImports;
function getSourceFileImportsWithTextRange(srcFile) {
    var modules = [];
    getImportsWithTextRange(srcFile, modules);
    return modules;
}
exports.getSourceFileImportsWithTextRange = getSourceFileImportsWithTextRange;
function getImports(searchNode, importedModules) {
    ts.forEachChild(searchNode, function (node) {
        if (node.kind === ts.SyntaxKind.ImportDeclaration || node.kind === ts.SyntaxKind.ImportEqualsDeclaration || node.kind === ts.SyntaxKind.ExportDeclaration) {
            var moduleNameExpr = getExternalModuleName(node);
            if (moduleNameExpr && moduleNameExpr.kind === ts.SyntaxKind.StringLiteral) {
                importedModules.push(moduleNameExpr.text);
            }
        }
        else if (node.kind === ts.SyntaxKind.ModuleDeclaration && node.name.kind === ts.SyntaxKind.StringLiteral) {
            getImports(node.body, importedModules);
        }
    });
}
function getExternalModuleName(node) {
    if (node.kind === ts.SyntaxKind.ImportDeclaration) {
        return node.moduleSpecifier;
    }
    if (node.kind === ts.SyntaxKind.ImportEqualsDeclaration) {
        var reference = node.moduleReference;
        if (reference.kind === ts.SyntaxKind.ExternalModuleReference) {
            return reference.expression;
        }
    }
    if (node.kind === ts.SyntaxKind.ExportDeclaration) {
        return node.moduleSpecifier;
    }
}
function getImportsWithTextRange(searchNode, importedModules) {
    ts.forEachChild(searchNode, function (node) {
        if (node.kind === ts.SyntaxKind.ImportDeclaration || node.kind === ts.SyntaxKind.ImportEqualsDeclaration || node.kind === ts.SyntaxKind.ExportDeclaration) {
            var moduleNameExpr = getExternalModuleName(node);
            if (moduleNameExpr && moduleNameExpr.kind === ts.SyntaxKind.StringLiteral) {
                var moduleExpr = moduleNameExpr;
                importedModules.push({
                    text: moduleExpr.text,
                    range: { pos: moduleExpr.getStart() + 1, end: moduleExpr.getEnd() - 1 }
                });
            }
        }
        else if (node.kind === ts.SyntaxKind.ModuleDeclaration && node.name.kind === ts.SyntaxKind.StringLiteral) {
            getImportsWithTextRange(node.body, importedModules);
        }
    });
}

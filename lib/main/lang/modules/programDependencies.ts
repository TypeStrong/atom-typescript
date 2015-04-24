
import {TypeScriptProjectFileDetails, pathIsRelative, consistentPath} from "../../tsconfig/tsconfig";
import tsconfig = require("../../tsconfig/tsconfig");
import * as path from "path";
import * as fs from "fs";

export default function getDependencies(projectFile: TypeScriptProjectFileDetails, program: ts.Program): FileDependency[] {
    var links: FileDependency[] = [];
    var projectDir = projectFile.projectFileDirectory;
    for (let file of program.getSourceFiles()) {
        let filePath = file.fileName;
        var dir = path.dirname(filePath);

        var targets = getSourceFileImports(file)
            .filter((fileReference) => pathIsRelative(fileReference))
            .map(fileReference => {
            var file = path.resolve(dir, fileReference + '.ts');
            if (!fs.existsSync(file)) {
                file = path.resolve(dir, fileReference + '.d.ts');
            }
            return file;
        });

        for (let target of targets) {
            var targetPath = consistentPath(path.relative(projectDir, consistentPath(target)));
            var sourcePath = consistentPath(path.relative(projectDir, filePath));
            links.push({
                sourcePath,
                targetPath
            })
        }
    }
    return links;
}

function getSourceFileImports(srcFile: ts.SourceFile) {
    var modules: string[] = [];
    getImports(srcFile, modules);
    return modules;
}

// https://github.com/Microsoft/TypeScript/issues/2621#issuecomment-90986004
function getImports(searchNode: ts.Node, importedModules: string[]) {
    ts.forEachChild(searchNode, node => {
        // Vist top-level import nodes
        if (node.kind === ts.SyntaxKind.ImportDeclaration || node.kind === ts.SyntaxKind.ImportEqualsDeclaration || node.kind === ts.SyntaxKind.ExportDeclaration) {
            let moduleNameExpr = getExternalModuleName(node);
            // if they have a name, that is a string, i.e. not alias defition `import x = y`
            if (moduleNameExpr && moduleNameExpr.kind === ts.SyntaxKind.StringLiteral) {
                importedModules.push((<ts.LiteralExpression>moduleNameExpr).text);
            }
        }
        else if (node.kind === ts.SyntaxKind.ModuleDeclaration && (<ts.ModuleDeclaration>node).name.kind === ts.SyntaxKind.StringLiteral) {
            // Ambient module declaration
            getImports((<ts.ModuleDeclaration>node).body, importedModules);
        }
    });
}
function getExternalModuleName(node: ts.Node): ts.Expression {
    if (node.kind === ts.SyntaxKind.ImportDeclaration) {
        return (<ts.ImportDeclaration>node).moduleSpecifier;
    }
    if (node.kind === ts.SyntaxKind.ImportEqualsDeclaration) {
        let reference = (<ts.ImportEqualsDeclaration>node).moduleReference;
        if (reference.kind === ts.SyntaxKind.ExternalModuleReference) {
            return (<ts.ExternalModuleReference>reference).expression;
        }
    }
    if (node.kind === ts.SyntaxKind.ExportDeclaration) {
        return (<ts.ExportDeclaration>node).moduleSpecifier;
    }
}
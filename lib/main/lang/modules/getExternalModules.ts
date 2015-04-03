// From https://github.com/Microsoft/TypeScript/pull/2173/files
import {
SyntaxKind, ModuleDeclaration, forEachChild, Program
} from "typescript";


export function getExternalModuleNames(program: Program): string[] {
    var entries: string[] = [];

    program.getSourceFiles().forEach(sourceFile => {

        // Look for ambient external module declarations
        forEachChild(sourceFile, child => {
            if (child.kind === SyntaxKind.ModuleDeclaration && (<ModuleDeclaration>child).name.kind === SyntaxKind.StringLiteral) {
                entries.push((<ModuleDeclaration>child).name.text);
            }
        });
    });

    return entries;
}

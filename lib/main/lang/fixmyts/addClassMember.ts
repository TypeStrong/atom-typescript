import {QuickFix, QuickFixQueryInformation, Refactoring} from "./quickFix";
import * as ts from "typescript";
import * as ast from "./astUtils";
import {EOL} from "os";

export default class AddClassMember implements QuickFix {
    key = AddClassMember.name;

    canProvideFix(info: QuickFixQueryInformation): string {
        var relevantError = info.positionErrors.filter(x=> x.code == 2339)[0];
        if (!relevantError) return;
        if (info.positionNode.kind !== ts.SyntaxKind.Identifier) return;

        // TODO: use type checker to see if item of `.` before hand is a class
        //  But for now just run with it.

        return "Add Member to Class";
    }

    provideFix(info: QuickFixQueryInformation): Refactoring[] {

        var relevantError = info.positionErrors.filter(x=> x.code == 2339)[0];
        var errorText: string = <any>relevantError.messageText;
        if (typeof errorText !== 'string') {
            console.error('I have no idea what this is:', errorText);
            return []
        };

        var identifier = <ts.Identifier>info.positionNode;
        var identifierName = identifier.text;

        // see https://github.com/Microsoft/TypeScript/blob/6637f49209ceb5ed719573998381eab010fa48c9/src/compiler/diagnosticMessages.json#L842
        var typeName = errorText.match(/Property \'(\w+)\' does not exist on type \'(\w+)\'./)[2];

        // Find the containing class declaration
        var classNode = <ts.ClassDeclaration>ast.getNodeByKindAndName(info.program, ts.SyntaxKind.ClassDeclaration, typeName);

        // Then the first brace
        var firstBrace = classNode.getChildren().filter(x=> x.kind == ts.SyntaxKind.OpenBraceToken)[0];

        // Perhaps later:
        var indentLength = info.service.getIndentationAtPosition(
            info.srcFile.fileName, firstBrace.end + 1, info.project.projectFile.project.formatCodeOptions);
        var indent = Array(indentLength + 1).join(' ');

        // And add stuff after the first brace
        var refactoring: Refactoring = {
            span: {
                start: firstBrace.end,
                length: 0
            },
            /** TODO: ask the type checker for the type if the right hand side is an assignment */
            newText: `${EOL}${indent}${identifierName}: any;`,
            filePath: classNode.getSourceFile().fileName
        };

        return [refactoring];
    }
}

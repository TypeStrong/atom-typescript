import {QuickFix, QuickFixQueryInformation, Refactoring} from "./quickFix";
import * as ts from "typescript";
import * as ast from "./astUtils";

export default class AddClassMember implements QuickFix {
    key = AddClassMember.name;

    canProvideFix(info: QuickFixQueryInformation): string {
        var relevantError = info.positionErrors.filter(x=> x.code == 2339)[0];
        if (!relevantError) return;
        if (info.positionNode.kind !== ts.SyntaxKind.Identifier) return;

        // TODO: comment out
        // I am just testing stuff out :)
        this.provideFix(info);

        return "Add Member to Class";
    }

    /** TODO */
    provideFix(info: QuickFixQueryInformation): Refactoring[] {

        var relevantError = info.positionErrors.filter(x=> x.code == 2339)[0];
        var errorText: string = <any>relevantError.messageText;
        if (typeof errorText !== 'string') {
            console.error('I have no idea:', errorText);
            return []
        };

        var identifier = <ts.Identifier>info.positionNode;
        var identifierName = identifier.text;

        // see https://github.com/Microsoft/TypeScript/blob/6637f49209ceb5ed719573998381eab010fa48c9/src/compiler/diagnosticMessages.json#L842
        var typeName = errorText.match(/Property \'(\w+)\' does not exist on type \'(\w+)\'./)[2];

        // find the containing class declaration
        // Then add stuff after the first Brace

        var classNode = <ts.ClassDeclaration>ast.getNodeByKindAndName(info.program, ts.SyntaxKind.ClassDeclaration, typeName);
        var firstBrace = classNode.getChildren().filter(x=>x.kind == ts.SyntaxKind.OpenBraceToken)[0];
        console.error(firstBrace.getText());
        console.error(firstBrace.pos,firstBrace.end);

        return [];
    }
}

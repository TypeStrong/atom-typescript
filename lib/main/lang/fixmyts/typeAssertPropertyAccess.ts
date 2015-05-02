import {QuickFix, QuickFixQueryInformation, Refactoring} from "./quickFix";
import * as ast from "./astUtils";


class TypeAssert implements QuickFix {
    key = TypeAssert.name;

    canProvideFix(info: QuickFixQueryInformation): string {
        var relevantError = info.positionErrors.filter(x=> x.code == ts.Diagnostics.Property_0_does_not_exist_on_type_1.code)[0];
        if (!relevantError) return;
        if (info.positionNode.kind !== ts.SyntaxKind.Identifier) return;

        var match = getIdentifierName(info.positionErrorMessages[0]);

        if (!match) return;

        var {identifierName} = match;
        return `Assert <Type> for property access "${identifierName}"`;
    }

    provideFix(info: QuickFixQueryInformation): Refactoring[] {
        /**
         * We want the largest property access expressing `a.b.c` starting at the identifer `c`
         * Since this gets tokenized as `a.b` `.` `c` so its just the parent :)
         */
        let parent = info.positionNode.parent;
        if (parent.kind == ts.SyntaxKind.PropertyAccessExpression) {
            let propertyAccess = <ts.PropertyAccessExpression>parent;
            let start = propertyAccess.getStart();
            let end = propertyAccess.dotToken.getStart();

            let oldText = propertyAccess.getText().substr(0, end - start);

            let refactoring: Refactoring = {
                filePath: info.filePath,
                span: {
                    start: start,
                    length: end - start,
                },
                newText: `(<any>${oldText})`
            };

            return [refactoring];
        }
        return [];
    }
}

export default TypeAssert;

function getIdentifierName(errorText: string) {
    // see https://github.com/Microsoft/TypeScript/blob/6637f49209ceb5ed719573998381eab010fa48c9/src/compiler/diagnosticMessages.json#L842
    var match = /Property \'(\w+)\' does not exist on type \.*/.exec(errorText);

    if (!match) return;

    var [, identifierName] = match;
    return { identifierName };
}

import {QuickFix, QuickFixQueryInformation, Refactoring} from "./quickFix";
import * as ts from "typescript";
import * as ast from "./astUtils";
import {EOL} from "os";
import {displayPartsToString, typeToDisplayParts, SyntaxKind} from "typescript";


class EqualsToEquals implements QuickFix {
    key = EqualsToEquals.name;

    canProvideFix(info: QuickFixQueryInformation): string {
        if (info.positionNode.kind === SyntaxKind.EqualsEqualsToken) {
            return "Convert == to ===";
        }
        if (info.positionNode.kind === SyntaxKind.ExclamationEqualsToken) {
            return "Convert != to !==";
        }
    }

    provideFix(info: QuickFixQueryInformation): Refactoring[] {

        if (info.positionNode.kind === SyntaxKind.EqualsEqualsToken) {
            var newText = '===';
        }
        if (info.positionNode.kind === SyntaxKind.ExclamationEqualsToken) {
            var newText = '!==';
        }

        var refactoring: Refactoring = {
            span: {
                // Since TypeScript stores trivia at with the node `pos` we only want 2 steps behind the `end` instead of `pos`
                start: info.positionNode.end - 2,
                length: 2
            },
            newText,
            filePath: info.filePath
        };

        return [refactoring];
    }
}

export default EqualsToEquals;
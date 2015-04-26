import {QuickFix, QuickFixQueryInformation, Refactoring} from "./quickFix";
import * as ast from "./astUtils";
import {EOL} from "os";


function isBinaryAddition(node: ts.Node): boolean {
    return (node.kind == ts.SyntaxKind.BinaryExpression &&
        (<ts.BinaryExpression>node).operatorToken.kind == ts.SyntaxKind.PlusToken);
}

/** TODO: Get the TypeScript team to review this
 * Lookup the docs on `symbol` as well
 */
function isStringExpression(node: ts.Node, typeChecker: ts.TypeChecker): boolean {
    var type = typeChecker.getTypeAtLocation(node);
    // Note:
    // type.instrinsicName = 'string'
    // But I can't get that to typecheck
    return ts.displayPartsToString(ts.typeToDisplayParts(typeChecker, type)) == 'string';
}

/** Returns the root (binary +) node if there is some otherwise returns undefined */
function isAPartOfAChainOfStringAdditions(node: ts.Node, typeChecker: ts.TypeChecker): ts.Node {
    // We are looking for the `largestSumNode`. Its set once we find one up our tree
    var largestSumNode: ts.Node = undefined;
    while (true) {
        // Whenever we find a binary expression of type sum that evaluates to a string
        if (isBinaryAddition(node) && isStringExpression(node, typeChecker)) {
            largestSumNode = node;
        }

        // We've gone too far up
        if (node.kind == ts.SyntaxKind.SourceFile) {
            return largestSumNode;
        }

        // Next look at the parent to find a larger sum node
        node = node.parent;
    }
}


class StringConcatToTemplate implements QuickFix {
    key = StringConcatToTemplate.name;

    canProvideFix(info: QuickFixQueryInformation): string {
        // Algo
        // Can provide a quick fix if we are part of an expression that
        // is a part of a binary + expression
        // and when these binary +es end we come to an expression which is of type `string`

        // Based on algo we do not care about what the current thing is as long as its a part of a sum of additions
        var strRoot = isAPartOfAChainOfStringAdditions(info.positionNode, info.typeChecker);
        if (strRoot) {
            return 'String concatenations to a template string';
        }
    }

    provideFix(info: QuickFixQueryInformation): Refactoring[] {

        // Each expression that isn't a string literal will just be escaped
        // Each string literal needs to be checked that it doesn't contain (`) and those need to be escaped

        return [];

        // var text = info.positionNode.getText();
        // var quoteCharacter = text.trim()[0];
        // var nextQuoteCharacter = '`';
        //
        // // The following code is same as `quotesToQuotes. Refactor!`
        //
        // var quoteRegex = new RegExp(quoteCharacter, 'g')
        // var escapedQuoteRegex = new RegExp(`\\\\${quoteCharacter}`, 'g')
        // var nextQuoteRegex = new RegExp(nextQuoteCharacter, 'g')
        //
        // var newText = text
        //     .replace(nextQuoteRegex, `\\${nextQuoteCharacter}`)
        //     .replace(escapedQuoteRegex, quoteCharacter);
        //
        // newText = nextQuoteCharacter + newText.substr(1, newText.length - 2) + nextQuoteCharacter
        //
        // var refactoring: Refactoring = {
        //     span: {
        //         start: info.positionNode.getStart(),
        //         length: info.positionNode.end - info.positionNode.getStart()
        //     },
        //     newText,
        //     filePath: info.filePath
        // };
        //
        // return [refactoring];
    }
}

export default StringConcatToTemplate;

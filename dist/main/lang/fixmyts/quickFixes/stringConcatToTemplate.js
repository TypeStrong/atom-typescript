"use strict";
function isBinaryAddition(node) {
    return (node.kind == ts.SyntaxKind.BinaryExpression &&
        node.operatorToken.kind == ts.SyntaxKind.PlusToken);
}
function isStringExpression(node, typeChecker) {
    var type = typeChecker.getTypeAtLocation(node);
    var flags = type.getFlags();
    return !!(flags & ts.TypeFlags.String);
}
function isAPartOfAChainOfStringAdditions(node, typeChecker) {
    var largestSumNode = undefined;
    while (true) {
        if (isBinaryAddition(node) && isStringExpression(node, typeChecker)) {
            largestSumNode = node;
        }
        if (node.kind == ts.SyntaxKind.SourceFile) {
            return largestSumNode;
        }
        node = node.parent;
    }
}
var StringConcatToTemplate = (function () {
    function StringConcatToTemplate() {
        this.backTickCharacter = '`';
        this.backTick = new RegExp(this.backTickCharacter, 'g');
        this.$regex = /\$/g;
        this.key = StringConcatToTemplate.name;
    }
    StringConcatToTemplate.prototype.canProvideFix = function (info) {
        var strRoot = isAPartOfAChainOfStringAdditions(info.positionNode, info.typeChecker);
        if (strRoot) {
            return { display: 'String concatenations to a template string' };
        }
    };
    StringConcatToTemplate.prototype.provideFix = function (info) {
        var finalOutput = [];
        var strRoot = isAPartOfAChainOfStringAdditions(info.positionNode, info.typeChecker);
        var current = strRoot;
        while (true) {
            if (current.kind == ts.SyntaxKind.BinaryExpression) {
                var binary = current;
                this.appendToFinal(finalOutput, binary.right);
                current = binary.left;
            }
            else {
                this.appendToFinal(finalOutput, current);
                break;
            }
        }
        var newText = this.backTickCharacter +
            finalOutput.join('') +
            this.backTickCharacter;
        var refactoring = {
            span: {
                start: strRoot.getStart(),
                length: strRoot.end - strRoot.getStart()
            },
            newText: newText,
            filePath: info.filePath
        };
        return [refactoring];
    };
    StringConcatToTemplate.prototype.appendToFinal = function (finalOutput, node) {
        if (node.kind == ts.SyntaxKind.StringLiteral) {
            var text = node.getText();
            var quoteCharacter = text.trim()[0];
            var quoteRegex = new RegExp(quoteCharacter, 'g');
            var escapedQuoteRegex = new RegExp("\\\\" + quoteCharacter, 'g');
            var newText = text
                .replace(this.backTick, "\\" + this.backTickCharacter)
                .replace(escapedQuoteRegex, quoteCharacter)
                .replace(this.$regex, '\\$');
            newText = newText.substr(1, newText.length - 2);
            finalOutput.unshift(newText);
        }
        else if (node.kind == ts.SyntaxKind.TemplateExpression || node.kind == ts.SyntaxKind.NoSubstitutionTemplateLiteral) {
            var text = node.getText();
            text = text.trim();
            text = text.substr(1, text.length - 2);
            finalOutput.unshift(text);
        }
        else {
            finalOutput.unshift('${' + node.getText() + '}');
        }
    };
    return StringConcatToTemplate;
}());
exports.StringConcatToTemplate = StringConcatToTemplate;

function isBinaryAddition(node) {
    return (node.kind == 178 &&
        node.operatorToken.kind == 34);
}
function isStringExpression(node, typeChecker) {
    var type = typeChecker.getTypeAtLocation(node);
    var flags = type.getFlags();
    return !!(flags & 2);
}
function isAPartOfAChainOfStringAdditions(node, typeChecker) {
    var largestSumNode = undefined;
    while (true) {
        if (isBinaryAddition(node) && isStringExpression(node, typeChecker)) {
            largestSumNode = node;
        }
        if (node.kind == 245) {
            return largestSumNode;
        }
        node = node.parent;
    }
}
var StringConcatToTemplate = (function () {
    function StringConcatToTemplate() {
        this.key = StringConcatToTemplate.name;
    }
    StringConcatToTemplate.prototype.canProvideFix = function (info) {
        // Algo
        // Can provide a quick fix if we are part of an expression that
        // is a part of a binary + expression
        // and when these binary +es end we come to an expression which is of type `string`
        var strRoot = isAPartOfAChainOfStringAdditions(info.positionNode, info.typeChecker);
        if (strRoot) {
            return { display: 'String concatenations to a template string' };
        }
    };
    StringConcatToTemplate.prototype.provideFix = function (info) {
        var strRoot = isAPartOfAChainOfStringAdditions(info.positionNode, info.typeChecker);
        var finalOutput = [];
        var current = strRoot;
        var backTickCharacter = '`';
        var backTick = new RegExp(backTickCharacter, 'g');
        var $regex = /\$/g;
        while (true) {
            function appendToFinal(node) {
                if (node.kind == 8) {
                    var text = node.getText();
                    var quoteCharacter = text.trim()[0];
                    var quoteRegex = new RegExp(quoteCharacter, 'g');
                    var escapedQuoteRegex = new RegExp("\\\\" + quoteCharacter, 'g');
                    var newText_1 = text
                        .replace(backTick, "\\" + backTickCharacter)
                        .replace(escapedQuoteRegex, quoteCharacter)
                        .replace($regex, '\\$');
                    newText_1 = newText_1.substr(1, newText_1.length - 2);
                    finalOutput.unshift(newText_1);
                }
                else if (node.kind == 180 || node.kind == 10) {
                    var text = node.getText();
                    text = text.trim();
                    text = text.substr(1, text.length - 2);
                    finalOutput.unshift(text);
                }
                else {
                    finalOutput.unshift('${' + node.getText() + '}');
                }
            }
            if (current.kind == 178) {
                var binary = current;
                appendToFinal(binary.right);
                current = binary.left;
            }
            else {
                appendToFinal(current);
                break;
            }
        }
        var newText = backTickCharacter + finalOutput.join('') + backTickCharacter;
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
    return StringConcatToTemplate;
})();
exports.StringConcatToTemplate = StringConcatToTemplate;

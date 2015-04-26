function isBinaryAddition(node) {
    return (node.kind == 169 &&
        node.operatorToken.kind == 33);
}
function isStringExpression(node, typeChecker) {
    var type = typeChecker.getTypeAtLocation(node);
    return ts.displayPartsToString(ts.typeToDisplayParts(typeChecker, type)) == 'string';
}
function isAPartOfAChainOfStringAdditions(node, typeChecker) {
    var largestSumNode = undefined;
    while (true) {
        if (isBinaryAddition(node) && isStringExpression(node, typeChecker)) {
            largestSumNode = node;
        }
        if (node.kind == 227) {
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
            return 'String concatenations to a template string';
        }
    };
    StringConcatToTemplate.prototype.provideFix = function (info) {
        // Each expression that isn't a string literal will just be escaped
        // Each string literal needs to be checked that it doesn't contain (`) and those need to be escaped
        return [];
    };
    return StringConcatToTemplate;
})();
exports.default = StringConcatToTemplate;

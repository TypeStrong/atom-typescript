var TypeAssertPropertyAccessToAny = (function () {
    function TypeAssertPropertyAccessToAny() {
        this.key = TypeAssertPropertyAccessToAny.name;
    }
    TypeAssertPropertyAccessToAny.prototype.canProvideFix = function (info) {
        var relevantError = info.positionErrors.filter(function (x) { return x.code == ts.Diagnostics.Property_0_does_not_exist_on_type_1.code; })[0];
        if (!relevantError)
            return;
        if (info.positionNode.kind !== ts.SyntaxKind.Identifier)
            return;
        var match = getIdentifierName(info.positionErrorMessages[0]);
        if (!match)
            return;
        var identifierName = match.identifierName;
        return { display: "Assert \"any\" for property access \"" + identifierName + "\"" };
    };
    TypeAssertPropertyAccessToAny.prototype.provideFix = function (info) {
        var parent = info.positionNode.parent;
        if (parent.kind == ts.SyntaxKind.PropertyAccessExpression) {
            var propertyAccess = parent;
            var start = propertyAccess.getStart();
            var end = propertyAccess.dotToken.getStart();
            var oldText = propertyAccess.getText().substr(0, end - start);
            var refactoring = {
                filePath: info.filePath,
                span: {
                    start: start,
                    length: end - start,
                },
                newText: "(" + oldText + " as any)"
            };
            return [refactoring];
        }
        return [];
    };
    return TypeAssertPropertyAccessToAny;
})();
exports.TypeAssertPropertyAccessToAny = TypeAssertPropertyAccessToAny;
function getIdentifierName(errorText) {
    var match = /Property \'(\w+)\' does not exist on type \.*/.exec(errorText);
    if (!match)
        return;
    var identifierName = match[1];
    return { identifierName: identifierName };
}

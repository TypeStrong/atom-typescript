var ast = require("../astUtils");
var os_1 = require("os");
function getClassAndInterfaceName(error) {
    var errorText = ts.flattenDiagnosticMessageText(error.messageText, os_1.EOL);
    var match = errorText.match(/Class \'(\w+)\' incorrectly implements interface \'(\w+)\'./);
    if (!match || match.length !== 3)
        return;
    var className = match[1], interfaceName = match[2];
    return { className: className, interfaceName: interfaceName };
}
var ImplementInterface = (function () {
    function ImplementInterface() {
        this.key = ImplementInterface.name;
    }
    ImplementInterface.prototype.canProvideFix = function (info) {
        var relevantError = info.positionErrors.filter(function (x) { return x.code == ts.Diagnostics.Class_0_incorrectly_implements_interface_1.code; })[0];
        if (!relevantError)
            return;
        if (info.positionNode.kind !== ts.SyntaxKind.Identifier)
            return;
        var match = getClassAndInterfaceName(relevantError);
        if (!match)
            return;
        var className = match.className, interfaceName = match.interfaceName;
        return { display: "Implement members of " + interfaceName + " in " + className };
    };
    ImplementInterface.prototype.provideFix = function (info) {
        var relevantError = info.positionErrors.filter(function (x) { return x.code == ts.Diagnostics.Class_0_incorrectly_implements_interface_1.code; })[0];
        if (!relevantError)
            return;
        if (info.positionNode.kind !== ts.SyntaxKind.Identifier)
            return;
        var match = getClassAndInterfaceName(relevantError);
        var className = match.className, interfaceName = match.interfaceName;
        var interfaceTarget = ast.getNodeByKindAndName(info.program, ts.SyntaxKind.InterfaceDeclaration, className);
        var classTarget = ast.getNodeByKindAndName(info.program, ts.SyntaxKind.ClassDeclaration, className);
        var braces = classTarget.getChildren().filter(function (x) { return x.kind == ts.SyntaxKind.CloseBraceToken; });
        var lastBrace = braces[braces.length - 1];
        var indentLength = info.service.getIndentationAtPosition(classTarget.getSourceFile().fileName, lastBrace.getStart(), info.project.projectFile.project.formatCodeOptions);
        var indent = Array(indentLength + info.project.projectFile.project.formatCodeOptions.IndentSize + 1).join(' ');
        var refactorings = [];
        return refactorings;
    };
    return ImplementInterface;
})();
exports.ImplementInterface = ImplementInterface;

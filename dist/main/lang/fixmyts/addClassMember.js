var ts = require("typescript");
var ast = require("./astUtils");
var os_1 = require("os");
var typescript_1 = require("typescript");
function getIdentifierAndClassNames(error) {
    var errorText = error.messageText;
    if (typeof errorText !== 'string') {
        console.error('I have no idea what this is:', errorText);
        return undefined;
    }
    ;
    var _a = errorText.match(/Property \'(\w+)\' does not exist on type \'(\w+)\'./), identifierName = _a[1], className = _a[2];
    return { identifierName: identifierName, className: className };
}
var AddClassMember = (function () {
    function AddClassMember() {
        this.key = AddClassMember.name;
    }
    AddClassMember.prototype.canProvideFix = function (info) {
        var relevantError = info.positionErrors.filter(function (x) { return x.code == 2339; })[0];
        if (!relevantError)
            return;
        if (info.positionNode.kind !== 65)
            return;
        var _a = getIdentifierAndClassNames(relevantError), identifierName = _a.identifierName, className = _a.className;
        return "Add " + identifierName + " to " + className;
    };
    AddClassMember.prototype.provideFix = function (info) {
        var relevantError = info.positionErrors.filter(function (x) { return x.code == 2339; })[0];
        var identifier = info.positionNode;
        var identifierName = identifier.text;
        var className = (getIdentifierAndClassNames(relevantError)).className;
        var typeString = 'any';
        var parentOfParent = identifier.parent.parent;
        if (parentOfParent.kind == 169
            && parentOfParent.operatorToken.getText().trim() == '=') {
            var binaryExpression = parentOfParent;
            var type = info.typeChecker.getTypeAtLocation(binaryExpression.right);
            typeString = typescript_1.displayPartsToString(typescript_1.typeToDisplayParts(info.typeChecker, type)).replace(/\s+/g, ' ');
        }
        var targetDeclaration = ast.getNodeByKindAndName(info.program, 201, className);
        var firstBrace = targetDeclaration.getChildren().filter(function (x) { return x.kind == 14; })[0];
        var indent = Array(info.project.projectFile.project.formatCodeOptions.IndentSize + 1).join(' ');
        var refactoring = {
            span: {
                start: firstBrace.end,
                length: 0
            },
            newText: "" + os_1.EOL + indent + identifierName + ": " + typeString + ";",
            filePath: targetDeclaration.getSourceFile().fileName
        };
        return [refactoring];
    };
    return AddClassMember;
})();
exports.default = AddClassMember;
